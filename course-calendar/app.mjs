import {kinds,selectionKey,escapeHTML as esc,readSelection,plannerSelection,todayInTurkey,visibleEntries,dateLabel} from './model.mjs';

const $=s=>document.querySelector(s), data=window.COURSE_PLANNER_DATA;
const config=window.IYTE_CALENDAR_CONFIG || {}, courses=data.courses;
const byId=new Map(courses.map(c=>[c.id,c]));
const linkedEntry=new URLSearchParams(location.search).get('entry');
let linkShown=false;
let selected=new Set(), entries=[], loaded=false, canCreate=false, canReport=false, busy=false, requestId=crypto.randomUUID(), termBounds=null;
try { selected=new Set(readSelection(localStorage,data.termId,courses)); } catch {}
$('#termLabel').textContent=`${data.termLabel} · Ortak takvim`;
if(linkedEntry){$('#scope').value='all';$('#past').checked=true;}

function saveSelection() {
  try { localStorage.setItem(selectionKey(data.termId),JSON.stringify([...selected])); }
  catch { $('#message').textContent='Ders seçimin bu tarayıcıda saklanamadı; sayfa açıkken kullanabilirsin.'; }
}
function renderCourses() {
  const query=$('#search').value.trim().toLocaleLowerCase('tr-TR'),level=$('#level').value;
  const shown=courses.filter(c=>`${c.code} ${c.name} ${c.nameEn||''}`.toLocaleLowerCase('tr-TR').includes(query) &&
    (level==='all'||String(c.level)===level||(level==='technical'&&c.technicalElective)||(level==='graduate'&&['graduate','grad','msc','phd'].includes(c.level))));
  $('#selectedCount').textContent=`${selected.size} ders`;
  $('#courses').innerHTML=shown.length ? shown.map(c=>`<label class="course"><input type="checkbox" data-course="${esc(c.id)}" ${selected.has(c.id)?'checked':''}><span><strong>${esc(c.code)}</strong><small>${esc(c.name)}</small></span></label>`).join('') : '<p class="hint">Aramana uygun ders yok.</p>';
}
function renderEntries() {
  const visible=visibleEntries(entries,{selected,scope:$('#scope').value,kind:$('#kind').value,past:$('#past').checked});
  $('#count').textContent=loaded ? `${visible.length} kayıt` : '';
  let date='';
  $('#entries').innerHTML=visible.length ? visible.map(e=>{
    const c=byId.get(e.course_id),heading=date===e.event_date?'':`<h3 class="date-heading">${esc(dateLabel(e.event_date))}</h3>`;
    date=e.event_date;
    const updated=new Intl.DateTimeFormat('tr-TR',{dateStyle:'short',timeStyle:'short',timeZone:'Europe/Istanbul'}).format(new Date(e.updated_at));
    return `${heading}<article class="entry" id="entry-${esc(e.id)}"><div class="entry-top"><span class="entry-course">${esc(c?.code||e.course_id)}</span><span class="kind">${esc(kinds[e.kind]||e.kind)}</span></div><h3>${esc(e.title)}</h3><p class="hint">${esc(c?.name||'')}</p><p>${e.event_time?esc(e.event_time.slice(0,5)):'Saat belirtilmedi'}${e.location?` · ${esc(e.location)}`:''}</p>${e.details?`<p class="details">${esc(e.details)}</p>`:''}<div class="entry-bottom"><small>Ekleyen: @${esc(e.nickname)} · Güncelleme: ${esc(updated)}</small><button type="button" class="quiet" data-report="${esc(e.id)}" ${canReport?'':'disabled'}>Hatalı bilgi bildir</button></div></article>`;
  }).join('') : `<div class="empty">${!config.endpoint?'Ortak takvim henüz açılmadı. Derslerini şimdiden seçebilirsin.':!loaded?'Takvim yüklenemedi. Yenile düğmesiyle tekrar deneyebilirsin.':!selected.size&&$('#scope').value==='mine'?'Takip edeceğin dersleri seç veya planlayıcıdan al.':'Bu filtrelere uygun kayıt yok.'}</div>`;
}
async function api(method,body) {
  const endpoint=new URL(config.endpoint);
  if(endpoint.protocol!=='https:')throw new Error('Takvim bağlantısı henüz hazır değil.');
  if(method==='GET')endpoint.searchParams.set('term',data.termId);
  const response=await fetch(endpoint,{method,headers:method==='POST'?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,credentials:'omit',signal:AbortSignal.timeout(20000)});
  const result=await response.json();
  if(!response.ok)throw new Error(result.error||'İşlem tamamlanamadı. Tekrar deneyebilirsin.');
  return result;
}
async function refresh() {
  canCreate=false;canReport=false;
  if(!config.endpoint){$('#connection').textContent='Kurulum hazırlanıyor. Ortak kayıtlar veritabanı bağlantısı tamamlandığında açılacak.';renderEntries();return;}
  $('#refresh').disabled=true;
  try {
    const result=await api('GET');
    if(!Array.isArray(result.entries))throw new Error('Takvimden geçerli yanıt alınamadı.');
    entries=result.entries;loaded=true;termBounds=result.term;
    canCreate=Boolean(result.capabilities?.create&&config.turnstileSiteKey);
    canReport=Boolean(result.capabilities?.report&&config.turnstileSiteKey);
    $('#connection').textContent=canCreate?'Ortak takvim güncel. Seçtiğin derslerin kayıtları burada görünür.':'Takvim açık; yeni kayıt paylaşımı henüz etkinleştirilmedi.';
    if(canCreate&&!canReport)$('#connection').textContent+=' Hata bildirimleri e-posta bağlantısı tamamlanınca açılacak.';
  } catch(error) {
    $('#connection').textContent=loaded?'Takvim yenilenemedi. Son yüklenen kayıtlar gösteriliyor.':'Ortak takvime şu anda ulaşılamıyor.';
    $('#message').textContent=error.message;
  } finally {
    $('#refresh').disabled=false;renderEntries();
    const linked=linkedEntry&&document.getElementById(`entry-${linkedEntry}`);
    if(linked&&!linkShown){linked.classList.add('highlighted');linked.scrollIntoView({block:'center'});linkShown=true;}
  }
}
let turnstileLoading;
function loadTurnstile() {
  if(window.turnstile)return Promise.resolve();
  if(!turnstileLoading)turnstileLoading=new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;
    script.onload=()=>window.turnstile.ready(resolve);
    script.onerror=()=>{turnstileLoading=null;script.remove();reject(new Error('Doğrulama yüklenemedi. Tekrar deneyebilirsin.'));};
    document.head.append(script);
  });
  return turnstileLoading;
}
async function challenge(action) {
  if(!config.turnstileSiteKey)throw new Error('Kayıt gönderimi henüz açılmadı.');
  await loadTurnstile();
  const container=$(action==='create'?'#createChallenge':'#reportChallenge');
  return new Promise((resolve,reject)=>{
    let widget,done=false;
    const finish=(error,token)=>{if(done)return;done=true;clearTimeout(timer);if(widget!==undefined)window.turnstile.remove(widget);container.replaceChildren();error?reject(error):resolve(token);};
    const timer=setTimeout(()=>finish(new Error('Doğrulama tamamlanamadı. Tekrar deneyebilirsin.')),90000);
    widget=window.turnstile.render(container,{sitekey:config.turnstileSiteKey,action,appearance:'interaction-only',execution:'execute',callback:token=>finish(null,token),'error-callback':()=>{finish(new Error('Doğrulama başarısız. Tekrar deneyebilirsin.'));return true;},'expired-callback':()=>finish(new Error('Doğrulamanın süresi doldu. Tekrar dene.'))});
    window.turnstile.execute(widget);
  });
}
function openEditor(courseId) {
  $('#entryForm').reset();requestId=crypto.randomUUID();
  $('#entryCourse').innerHTML=[...courses].sort((a,b)=>Number(selected.has(b.id))-Number(selected.has(a.id))).map(c=>`<option value="${esc(c.id)}">${esc(c.code)} · ${esc(c.name)}</option>`).join('');
  if(courseId&&byId.has(courseId))$('#entryCourse').value=courseId;
  $('#date').min=termBounds?.starts_on||'';$('#date').max=termBounds?.ends_on||'';
  $('#date').value=todayInTurkey();$('#submitEntry').disabled=!canCreate;
  $('#formMessage').textContent=canCreate?'':'Form hazır. Ortak kayıt paylaşımı bağlantı tamamlandığında açılacak.';
  $('#editor').showModal();
}
$('#entryForm').addEventListener('submit',async e=>{
  e.preventDefault();if(busy||!canCreate)return;busy=true;$('#submitEntry').disabled=true;
  try {
    $('#formMessage').textContent='Kaydın paylaşılıyor…';
    const form=new FormData(e.currentTarget);
    // Explicit fields: no local grades, plans, selected courses or identity data are sent.
    const record={id:requestId,term_id:data.termId};
    for(const key of ['course_id','kind','title','event_date','event_time','location','details','nickname'])record[key]=String(form.get(key)||'').trim();
    const token=await challenge('create');
    const result=await api('POST',{action:'create',record,token,website:String(form.get('website')||'')});
    $('#editor').close();$('#message').textContent=result.duplicate?'Bu kayıt takvimde zaten var; tekrar eklenmedi.':'Kaydın ortak takvime eklendi.';
    if(!selected.has(record.course_id))$('#scope').value='all';
    $('#kind').value='all';if(record.event_date<todayInTurkey())$('#past').checked=true;
    await refresh();
  } catch(error) {$('#formMessage').textContent=error.message;}
  finally {busy=false;$('#submitEntry').disabled=!canCreate;}
});
$('#entries').addEventListener('click',async e=>{
  const button=e.target.closest('[data-report]');if(!button||busy||!canReport)return;
  busy=true;button.disabled=true;$('#message').textContent='Bildirimin gönderiliyor…';
  try {
    const token=await challenge('report');
    const result=await api('POST',{action:'report',entry_id:button.dataset.report,token});
    $('#message').textContent=result.duplicate?'Bu kayıt için bildirim zaten alındı.':'Bildirimin alındı; site yöneticisine iletilecek.';
    button.textContent='Bildirildi';
  } catch(error) {$('#message').textContent=error.message;button.disabled=false;}
  finally {busy=false;}
});
$('#courses').addEventListener('change',e=>{
  const id=e.target.dataset.course;if(!id)return;
  e.target.checked?selected.add(id):selected.delete(id);saveSelection();renderCourses();renderEntries();
});
$('#importPlanner').addEventListener('click',()=>{
  try {
    selected=new Set(plannerSelection(localStorage,data.termId,courses));saveSelection();renderCourses();renderEntries();
    $('#message').textContent=selected.size?'Planlayıcının açık planındaki dersler alındı.':'Planlayıcıda seçili ders bulunamadı. Derslerini buradan seçebilirsin.';
  } catch {$('#message').textContent='Planlayıcı kayıtları okunamadı.';}
});
for(const id of ['search','level'])$(`#${id}`).addEventListener(id==='search'?'input':'change',renderCourses);
for(const id of ['scope','kind','past'])$(`#${id}`).addEventListener('change',renderEntries);
$('#newEntry').addEventListener('click',()=>openEditor());
$('#closeEditor').addEventListener('click',()=>{if(!busy)$('#editor').close();});
$('#editor').addEventListener('cancel',e=>{if(busy)e.preventDefault();});
$('#refresh').addEventListener('click',refresh);
$('#theme').addEventListener('click',()=>{const value=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=value;try{localStorage.setItem('site-theme',value);}catch{}});
renderCourses();renderEntries();refresh();
