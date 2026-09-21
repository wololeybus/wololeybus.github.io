import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {todayInTurkey} from '../course-calendar/model.mjs';
const {JSDOM}=await import(process.env.JSDOM_MODULE||'jsdom');
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const [html,model,app,catalog,social]=await Promise.all(['course-calendar/index.html','course-calendar/model.mjs','course-calendar/app.mjs','course-planner/data-2026-fall.js','course-planner/social-electives-2026-fall.js'].map(read));
const id='12345678-1234-1234-1234-123456789abc';
const baseEntry={id,course_id:'phys301',kind:'exam',title:'Test sınavı',event_date:todayInTurkey(),event_time:'13:30',location:'Test odası',details:'Örnek açıklama',nickname:'test-fizik',updated_at:'2026-09-21T08:00:00Z'};
const activePlanKey='iyte-course-planner-beta-plans:2026-fall';
async function until(check) {for(let n=0;n<50;n++){if(check())return;await new Promise(resolve=>setTimeout(resolve,10));}assert.ok(check(),'UI update did not complete');}
function setup({configured=true,seed={},entries=[baseEntry],failGet=false,failReport=false,search=''}={}) {
  const dom=new JSDOM(html.replace(/<script[\s\S]*?<\/script>/g,''),{url:'https://wololeybus.github.io/course-calendar/'+search,runScripts:'outside-only'});
  const w=dom.window,requests=[];let rows=entries;
  Object.entries(seed).forEach(([key,value])=>w.localStorage.setItem(key,value));
  w.AbortSignal=AbortSignal;
  w.HTMLElement.prototype.scrollIntoView=function(){};
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  w.HTMLDialogElement.prototype.close=function(){this.open=false;};
  w.IYTE_CALENDAR_CONFIG=configured?{endpoint:'https://edge.example/course-calendar',turnstileSiteKey:'test-key'}:{};
  let callback;
  w.turnstile={render:(node,config)=>{callback=config.callback;return 'test-widget';},execute:()=>queueMicrotask(()=>callback('synthetic-test-token')),remove(){}};
  w.fetch=async(url,options)=>{
    const body=options.body?JSON.parse(options.body):null;requests.push({url:String(url),body});
    if(options.method==='GET')return {ok:!failGet,json:async()=>failGet?{error:'Test bağlantı hatası'}:{entries:rows,term:{starts_on:'2000-01-01',ends_on:'2099-01-01'},capabilities:{create:true,report:true}}};
    if(body.action==='report')return {ok:!failReport,json:async()=>failReport?{error:'Test bildirim hatası'}:{accepted:true,duplicate:false}};
    if(body.action==='create'){rows=[{...body.record,updated_at:new Date().toISOString()}];return {ok:true,json:async()=>({id:body.record.id,duplicate:false})};}
    throw new Error('Unexpected request');
  };
  w.eval(catalog);w.eval(social);
  w.eval(`(()=>{${model.replace(/^export /gm,'')}\nconst esc=escapeHTML;\n${app.replace(/^import .*?;\n/,'')}})()`);
  const q=selector=>w.document.querySelector(selector);
  const change=(selector,value)=>{const node=q(selector);if(node.type==='checkbox')node.checked=value;else node.value=value;node.dispatchEvent(new w.Event('change',{bubbles:true}));};
  return {dom,w,q,change,requests};
}
test('active planner selections load; changing calendar courses stays local and does not alter the plan',async()=>{
  const plan=JSON.stringify({activeId:'test-plan',plans:[{id:'test-plan',selected:['phys301'],scenarios:{secret:'AA'}}]});
  const e=setup({seed:{[activePlanKey]:plan,'iyte_gpa_2026_p1':'private grades'}});
  try {
    await until(()=>e.q('#count').textContent==='1 kayıt');
    e.change('[data-course="phys321"]',true);
    assert.deepEqual(JSON.parse(e.w.localStorage.getItem('iyte-calendar-courses:2026-fall')),['phys301','phys321']);
    assert.equal(e.w.localStorage.getItem(activePlanKey),plan);assert.equal(e.requests.length,1);
    assert.equal(e.requests[0].body,null);assert.ok(e.requests[0].url.endsWith('?term=2026-fall'));
  } finally {e.dom.window.close();}
});
test('unconfigured and offline views keep honest status and disable submission',async()=>{
  for(const options of [{configured:false},{failGet:true}]) {
    const e=setup(options);
    try {
      await until(()=>!e.q('#refresh').disabled);e.q('#newEntry').click();
      assert.equal(e.q('#editor').open,true);assert.equal(e.q('#submitEntry').disabled,true);
      assert.doesNotMatch(e.q('#connection').textContent,/Ortak takvim güncel/);
    } finally {e.dom.window.close();}
  }
});
test('event text is escaped and report needs one click with no nickname, message or email field',async()=>{
  const e=setup({entries:[{...baseEntry,title:'<img src=x onerror=alert(1)>'}],seed:{'iyte-calendar-courses:2026-fall':'["phys301"]'}});
  try {
    await until(()=>e.q('[data-report]'));
    assert.equal(e.q('#entries img'),null);assert.match(e.q('#entries').textContent,/<img src=x/);
    e.q('[data-report]').click();await until(()=>e.requests.some(r=>r.body?.action==='report'));
    assert.deepEqual(Object.keys(e.requests.at(-1).body).sort(),['action','entry_id','token']);
    await until(()=>e.q('#message').textContent.includes('Bildirimin alındı'));
  } finally {e.dom.window.close();}
});
test('failed report stays retryable and never shows a sent confirmation',async()=>{
  const e=setup({failReport:true,seed:{'iyte-calendar-courses:2026-fall':'["phys301"]'}});
  try {
    await until(()=>e.q('[data-report]'));e.q('[data-report]').click();
    await until(()=>e.q('#message').textContent==='Test bildirim hatası');assert.equal(e.q('[data-report]').disabled,false);
    assert.equal(e.q('[data-report]').textContent,'Hatalı bilgi bildir');
  } finally {e.dom.window.close();}
});
test('new entry sends only explicit fields and displays the returned shared event',async()=>{
  const e=setup({seed:{'iyte_gpa_2026_p1':'private grades'}});
  try {
    await until(()=>e.q('#connection').textContent.includes('güncel'));e.q('#newEntry').click();
    for(const [selector,value] of [['#entryCourse','phys301'],['#entryKind','homework'],['#nickname','test-friend'],['#title','Problem set 1'],['#date',todayInTurkey()],['#time','23:59']])e.q(selector).value=value;
    e.q('#entryForm').dispatchEvent(new e.w.Event('submit',{bubbles:true,cancelable:true}));
    await until(()=>e.requests.some(r=>r.body?.action==='create'));
    const body=e.requests.find(r=>r.body?.action==='create').body;
    assert.deepEqual(Object.keys(body.record).sort(),['course_id','details','event_date','event_time','id','kind','location','nickname','term_id','title']);
    assert.doesNotMatch(JSON.stringify(body),/private grades/);
    await until(()=>e.q('#entries').textContent.includes('Problem set 1'));assert.equal(e.q('#editor').open,false);
  } finally {e.dom.window.close();}
});
test('email deep links show a past event even if its course is not selected',async()=>{
  const e=setup({entries:[{...baseEntry,event_date:'2000-01-01'}],search:'?entry='+id});
  try {
    await until(()=>e.q('.entry.highlighted'));assert.equal(e.q('#scope').value,'all');assert.equal(e.q('#past').checked,true);
  } finally {e.dom.window.close();}
});
