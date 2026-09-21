// Run with PGLITE_MODULE pointing to the pinned PGlite entrypoint; see supabase/README.md.
import {test,before,after,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {PGlite}=await import(process.env.PGLITE_MODULE||'@electric-sql/pglite');
const db=new PGlite();
const record={id:'12345678-1234-1234-1234-123456789abc',term_id:'test-term',course_id:'phys301',kind:'exam',title:'Midterm',event_date:'2026-10-01',event_time:'13:30',location:'Test room',details:'Test only',nickname:'test-visitor'};
async function rpc(name,value) {return (await db.query(`select public.${name}($1) as result`,[value])).rows[0].result;}
const create=(patch={})=>rpc('calendar_create_entry',{...record,...patch});
const report=()=>rpc('calendar_report_entry',record.id);
const claim=()=>db.query('select * from public.calendar_claim_reports(5)');
before(async()=>{
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls; grant usage on schema public to service_role,anon,authenticated;');
  await db.exec(await readFile(new URL('../supabase/schema.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../supabase/catalog.sql',import.meta.url),'utf8'));
  await db.exec("insert into public.calendar_terms values('test-term','Test',date '2000-01-01',date '2099-01-01',date '2100-01-01',true);insert into public.calendar_courses values('test-term','phys301','PHYS 301','Test course','3');");
});
beforeEach(async()=>{await db.exec('reset role; delete from public.calendar_entries; delete from public.calendar_delivery_budget;');});
after(()=>db.close());
test('catalog contains all 71 existing courses and preserves social sections',async()=>{
  assert.equal(Number((await db.query("select count(*) as n from public.calendar_courses where term_id='2026-fall'")).rows[0].n),71);
  assert.equal((await db.query("select id from public.calendar_courses where term_id='2026-fall' and id in ('art201-s1','art201-s2')")).rows.length,2);
});
test('anonymous and authenticated clients cannot read/write tables or call privileged RPCs',async()=>{
  for(const role of ['anon','authenticated']) {
    await db.exec(`set role ${role}`);
    for(const sql of ['select * from public.calendar_entries','select * from public.calendar_reports',"insert into public.calendar_terms values('bad','bad',current_date,current_date,current_date+1,true)",'select public.calendar_create_entry($1)'])await assert.rejects(db.query(sql,sql.includes('$1')?[record]:[]),/permission denied/);
    await db.exec('reset role');
  }
  const rows=(await db.query("select relname,relrowsecurity from pg_class where relname in ('calendar_terms','calendar_courses','calendar_entries','calendar_reports','calendar_delivery_budget')")).rows;
  assert.equal(rows.length,5);assert.ok(rows.every(r=>r.relrowsecurity));
});
test('RLS still hides public records if a read grant is accidentally added',async()=>{
  await create();await db.exec('grant select on public.calendar_entries to anon;set role anon;');
  assert.equal((await db.query('select * from public.calendar_entries')).rows.length,0);
  await db.exec('reset role; revoke select on public.calendar_entries from anon;');
});
test('service role works through explicit grants, with idempotent retries and conflict detection',async()=>{
  await db.exec('set role service_role');
  assert.deepEqual(await create(),{id:record.id,duplicate:false});assert.deepEqual(await create(),{id:record.id,duplicate:true});
  await assert.rejects(create({title:'Different title'}),/request_conflict/);
  assert.equal((await db.query('select * from public.calendar_entries')).rows.length,1);
});
test('different request IDs for the same event do not make duplicate calendar entries',async()=>{
  await create();assert.equal((await create({id:crypto.randomUUID(),title:'MIDTERM',nickname:'someone-else'})).duplicate,true);
  assert.equal((await db.query('select * from public.calendar_entries')).rows.length,1);
});
test('unknown courses, closed terms, out-of-term dates and invalid kinds fail at the database',async()=>{
  await assert.rejects(create({course_id:'not-a-course'}),/foreign key/);
  await assert.rejects(create({term_id:'missing'}),/term_closed/);
  await assert.rejects(create({event_date:'1999-01-01'}),/date_outside_term/);
  await assert.rejects(create({kind:'delete'}),/check constraint/);
  await db.exec("update public.calendar_terms set active=false where id='test-term'");
  await assert.rejects(create(),/term_closed/);
  await db.exec("update public.calendar_terms set active=true where id='test-term'");
});
test('daily event quota is enforced inside the insert transaction',async()=>{
  await db.exec("insert into public.calendar_entries(term_id,course_id,kind,title,event_date,nickname) select 'test-term','phys301','exam','Event '||n,date '2026-10-01','test-only' from generate_series(1,200) n;");
  await assert.rejects(create(),/quota_reached/);
});
test('the same event version generates one report; editing allows a fresh report',async()=>{
  await create();const first=await report();assert.equal(first.duplicate,false);assert.equal((await report()).duplicate,true);
  await db.query('update public.calendar_entries set title=$1 where id=$2',['Corrected title',record.id]);
  const next=await report();assert.equal(next.duplicate,false);assert.notEqual(next.id,first.id);
});
test('claiming leases reports, retries at most three times and updates the monthly delivery budget',async()=>{
  await create();const r=await report();
  for(let attempt=1;attempt<=3;attempt++) {
    const rows=(await claim()).rows;assert.equal(rows.length,1);assert.equal(rows[0].attempts,attempt);
    assert.equal((await claim()).rows.length,0);
    await db.query('select public.calendar_finish_report($1,false)',[r.id]);
    await db.query("update public.calendar_reports set next_attempt_at=now()-interval '1 minute' where id=$1",[r.id]);
  }
  assert.equal((await claim()).rows.length,0);
  assert.equal((await db.query('select status from public.calendar_reports')).rows[0].status,'failed');
  assert.equal((await db.query('select attempts from public.calendar_delivery_budget')).rows[0].attempts,3);
});
test('actual monthly delivery budget covers backlogs from previous months',async()=>{
  await create();await report();
  await db.exec("update public.calendar_reports set created_at=now()-interval '32 days';insert into public.calendar_delivery_budget values(date_trunc('month',now())::date,45);");
  assert.equal((await claim()).rows.length,0);
  assert.equal((await db.query('select attempts from public.calendar_reports')).rows[0].attempts,0);
});
test('fifteen distinct reports per month is enforced before any provider request',async()=>{
  await create();await report();
  await db.query("insert into public.calendar_reports(entry_id,entry_version) select $1,now()-n*interval '1 second' from generate_series(1,14) n",[record.id]);
  await db.query("update public.calendar_entries set title='New version' where id=$1",[record.id]);
  await assert.rejects(report(),/quota_reached/);
});
test('expired leases are recovered and expired terms are purged without touching current events',async()=>{
  await create();await report();
  await db.exec("update public.calendar_reports set status='sending',attempts=3,next_attempt_at=now()-interval '1 minute';select public.calendar_cleanup();");
  assert.equal((await db.query('select status from public.calendar_reports')).rows[0].status,'failed');
  await db.exec("insert into public.calendar_terms values('expired','Expired',date '2000-01-01',date '2000-12-01',date '2001-01-01',false);insert into public.calendar_courses values('expired','phys301','PHYS 301','Expired','3');insert into public.calendar_entries(term_id,course_id,kind,title,event_date,nickname) values('expired','phys301','exam','Expired event',date '2000-06-01','test');select public.calendar_cleanup();");
  assert.equal((await db.query('select * from public.calendar_entries')).rows.length,1);
});
