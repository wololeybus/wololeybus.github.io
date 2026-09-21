import test from 'node:test';
import assert from 'node:assert/strict';
import {readSelection,plannerSelection,selectionKey,todayInTurkey,visibleEntries,escapeHTML} from '../course-calendar/model.mjs';
import {createHandler,validateRecord} from '../supabase/functions/course-calendar/handler.mjs';

const term='2026-fall', courses=[{id:'phys301'},{id:'phys321'},{id:'art201-s1'},{id:'art201-s2'}];
const storage=values=>({getItem:key=>values[key]??null});
test('calendar selection overrides the active plan, including an intentionally empty selection',()=>{
  const values={['iyte-course-planner-beta-plans:'+term]:JSON.stringify({activeId:'b',plans:[{id:'a',selected:['phys301']},{id:'b',selected:['phys321','missing']}]})};
  assert.deepEqual(readSelection(storage(values),term,courses),['phys321']);
  values[selectionKey(term)]='[]';assert.deepEqual(readSelection(storage(values),term,courses),[]);
  values[selectionKey(term)]='["art201-s1","missing"]';assert.deepEqual(readSelection(storage(values),term,courses),['art201-s1']);
});
test('planner import retains distinct sections and falls back to the legacy selection',()=>{
  assert.deepEqual(plannerSelection(storage({['iyte-course-planner:'+term]:'["art201-s1","art201-s2"]'}),term,courses),['art201-s1','art201-s2']);
  assert.deepEqual(readSelection(storage({[selectionKey(term)]:'corrupt'}),term,courses),[]);
});
test('today and chronological filtering use Turkey dates, including midnight boundaries',()=>{
  assert.equal(todayInTurkey(new Date('2026-10-01T22:00:00Z')),'2026-10-02');
  const list=[{id:1,course_id:'phys301',kind:'exam',event_date:'2026-10-02',event_time:null},{id:2,course_id:'phys321',kind:'exam',event_date:'2026-10-02',event_time:'08:00'},{id:3,course_id:'phys301',kind:'exam',event_date:'2026-10-01',event_time:'12:00'},{id:4,course_id:'phys301',kind:'homework',event_date:'2026-10-02',event_time:'10:00'}];
  const args={selected:new Set(['phys301']),today:'2026-10-02'};
  assert.deepEqual(visibleEntries(list,args).map(e=>e.id),[4,1]);
  assert.deepEqual(visibleEntries(list,{...args,scope:'all',kind:'exam',past:true}).map(e=>e.id),[3,2,1]);
  assert.equal(escapeHTML('<img src=x onerror="bad()">'),'&lt;img src=x onerror=&quot;bad()&quot;&gt;');
});

const origin='https://wololeybus.github.io';
const id='12345678-1234-1234-1234-123456789abc';
const record={id,term_id:term,course_id:'phys301',kind:'exam',title:'1. ara sınav',event_date:'2026-10-01',event_time:'13:30',location:'F 204',details:'Kapsam: ilk iki bölüm',nickname:'test-fizik'};
const envValues={SUPABASE_URL:'https://database.example',SUPABASE_SERVICE_ROLE_KEY:'server-only-test-key',TURNSTILE_SECRET_KEY:'turnstile-test-secret',CALENDAR_FORM_ENDPOINT:'https://formspree.io/f/testform',CALENDAR_WORKER_SECRET:'worker-test-secret',CALENDAR_REPORTS_ENABLED:'true'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
function setup({overrides={},verify={},routes={}}={}) {
  const calls=[];
  const handler=createHandler({env:key=>({...envValues,...overrides})[key],fetcher:async(url,options)=>{
    const body=options.body?JSON.parse(options.body):null;
    calls.push({url,options,body});
    if(url.includes('/siteverify'))return json({success:true,action:'create',hostname:'wololeybus.github.io',...verify});
    const route=Object.keys(routes).find(key=>url.includes(key));
    if(route)return typeof routes[route]==='function'?routes[route](url,body):json(routes[route]);
    if(url.includes('/calendar_terms?'))return json([{active:true,starts_on:'2026-09-01',ends_on:'2027-02-28',purge_after:'2100-01-01'}]);
    if(url.includes('/calendar_entries?'))return json([]);
    if(url.includes('/rpc/calendar_create_entry'))return json({id,duplicate:false});
    if(url.includes('/rpc/calendar_report_entry'))return json({id,duplicate:false});
    if(url.includes('/rpc/calendar_claim_reports'))return json([]);
    if(url.includes('/rpc/calendar_cleanup')||url.includes('/rpc/calendar_finish_report'))return new Response(null,{status:204});
    throw new Error('Unexpected outbound request: '+url);
  }});
  const post=(body,headers={})=>handler(new Request('https://edge.example/course-calendar',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...headers},body:JSON.stringify(body)}));
  return {handler,calls,post};
}
test('record validation rejects invalid dates, times, lengths and control characters; discards extra data',()=>{
  assert.deepEqual(validateRecord({...record,grades:['AA'],email:'do-not-send@example.test',selected:['phys321']}),record);
  for(const patch of [{event_date:'2026-02-30'},{event_time:'25:10'},{nickname:'a'},{nickname:'name\nadmin'},{title:'x'.repeat(101)},{course_id:'phys301&select=*'},{kind:'delete'}])assert.throws(()=>validateRecord({...record,...patch}));
});
test('create validates the CAPTCHA action/hostname and only writes explicit public record fields',async()=>{
  const {post,calls}=setup();const response=await post({action:'create',token:'valid',record:{...record,grades:['AA'],email:'private@example.test'}});
  assert.equal(response.status,201);
  const write=calls.find(c=>c.url.includes('/rpc/calendar_create_entry'));
  assert.deepEqual(write.body,{p_record:record});
  assert.equal(write.options.headers.apikey,envValues.SUPABASE_SERVICE_ROLE_KEY);
  const validation=calls.find(c=>c.url.includes('/siteverify'));
  assert.deepEqual(Object.keys(validation.body).sort(),['response','secret']);
  assert.doesNotMatch(await response.text(),/server-only-test-key|private@example/);
});
test('invalid CAPTCHA, wrong action/hostname, unapproved origin and honeypot all prevent writes',async()=>{
  for(const verify of [{success:false},{action:'report'},{hostname:'other.example'}]) {
    const {post,calls}=setup({verify});assert.equal((await post({action:'create',token:'bad',record})).status,403);
    assert.equal(calls.some(c=>c.url.includes('/rpc/calendar_create_entry')),false);
  }
  for(const [body,headers] of [[{action:'create',token:'valid',record},{Origin:'https://other.example'}],[{action:'create',token:'valid',record,website:'spam'},{}]]) {
    const {post,calls}=setup();assert.ok((await post(body,headers)).status>=400);assert.equal(calls.length,0);
  }
});
test('GET uses term-level reads, handles pagination and keeps reports disabled until setup is verified',async()=>{
  const {handler,calls}=setup({overrides:{CALENDAR_REPORTS_ENABLED:'false'},routes:{'/calendar_entries?':url=>json(new URL(url).searchParams.get('offset')==='0'?Array.from({length:1000},()=>({id})):[])}});
  const res=await handler(new Request('https://edge.example/course-calendar?term='+term,{headers:{Origin:origin}}));
  const body=await res.json();assert.equal(body.entries.length,1000);assert.equal(body.capabilities.create,true);assert.equal(body.capabilities.report,false);
  assert.equal(calls.filter(c=>c.url.includes('/calendar_entries?')).length,2);
  assert.equal(calls.some(c=>c.url.includes('course_id=eq')),false);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'),origin);
});
test('report returns after durable enqueue, without waiting for email or accepting reporter identity',async()=>{
  const {post,calls}=setup({verify:{action:'report'}});
  const res=await post({action:'report',entry_id:id,token:'valid',nickname:'ignored'});
  assert.equal(res.status,202);assert.deepEqual(await res.json(),{accepted:true,duplicate:false});
  assert.deepEqual(calls.find(c=>c.url.includes('/rpc/calendar_report_entry')).body,{p_entry_id:id});
  assert.equal(calls.some(c=>c.url.includes('formspree.io')),false);
});
test('worker requires its secret and retries provider failures without leaking nickname or details',async()=>{
  const {post,calls}=setup({routes:{'/rpc/calendar_claim_reports':[{id:'report-id',entry_id:id}],'/calendar_entries?':[record],'/calendar_courses?':[{code:'PHYS 301',name:'Test'}],'formspree.io':()=>json({error:'unavailable'},503)}});
  assert.equal((await post({action:'deliver'})).status,403);assert.equal(calls.length,0);
  const res=await post({action:'deliver'},{Origin:'','x-calendar-worker-secret':envValues.CALENDAR_WORKER_SECRET});
  assert.equal(res.status,200);assert.deepEqual(await res.json(),{sent:0});
  const mail=calls.find(c=>c.url.includes('formspree.io'));
  assert.equal(mail.body.nickname,undefined);assert.equal(mail.body.details,undefined);assert.equal(mail.body.ders,'PHYS 301');
  assert.deepEqual(calls.find(c=>c.url.includes('/rpc/calendar_finish_report')).body,{p_id:'report-id',p_success:false});
});
test('worker handles void RPC responses and counts accepted email delivery',async()=>{
  const {post}=setup({routes:{'/rpc/calendar_claim_reports':[{id:'report-id',entry_id:id}],'/calendar_entries?':[record],'/calendar_courses?':[{code:'PHYS 301'}],'formspree.io':{ok:true}}});
  const res=await post({action:'deliver'},{'x-calendar-worker-secret':envValues.CALENDAR_WORKER_SECRET});
  assert.equal(res.status,200);assert.deepEqual(await res.json(),{sent:1});
});
test('quota errors are recoverable and infrastructure errors never echo server internals',async()=>{
  for(const [error,status] of [[{message:'quota_reached'},429],[{message:'server secret',code:'OTHER'},503]]) {
    const {post}=setup({routes:{'/rpc/calendar_create_entry':()=>json(error,400)}});
    const res=await post({action:'create',record,token:'valid'});assert.equal(res.status,status);assert.doesNotMatch(await res.text(),/server secret/);
  }
});
test('oversized JSON and unsupported methods are rejected before outbound work',async()=>{
  const {handler,post,calls}=setup();assert.equal((await post({action:'create',record,token:'x'.repeat(9000)})).status,413);
  assert.equal((await handler(new Request('https://edge.example/course-calendar',{method:'DELETE'}))).status,405);assert.equal(calls.length,0);
});
