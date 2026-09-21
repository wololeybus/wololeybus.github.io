const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const slug=/^[a-z0-9-]{1,60}$/;
const fail=(message,status=400)=>Object.assign(new Error(message),{status});
export function validateRecord(value) {
  if(!value||typeof value!=='object'||Array.isArray(value))throw fail('Kayıt bilgileri eksik.');
  const lengths={title:[2,100],nickname:[2,32],location:[0,120],details:[0,1000]};
  const record={};
  for(const [key,[min,max]] of Object.entries(lengths)) {
    const text=value[key];
    if(typeof text!=='string'||text.trim().length<min||text.length>max||/\p{Cc}/u.test(key==='details'?text.replace(/[\n\r\t]/g,''):text))throw fail(`${key==='nickname'?'Nickname':'Kayıt alanları'} geçerli uzunlukta olmalı.`);
    record[key]=text.trim();
  }
  if(!UUID.test(value.id)||!slug.test(value.term_id)||!slug.test(value.course_id)||!['exam','homework','announcement'].includes(value.kind))throw fail('Ders veya kayıt türü geçersiz.');
  if(typeof value.event_date!=='string'||!/^20\d{2}-\d{2}-\d{2}$/.test(value.event_date)||Number.isNaN(Date.parse(`${value.event_date}T12:00:00Z`))||new Date(`${value.event_date}T12:00:00Z`).toISOString().slice(0,10)!==value.event_date)throw fail('Geçerli bir tarih seç.');
  if(typeof value.event_time!=='string'||(value.event_time!==''&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(value.event_time)))throw fail('Geçerli bir saat seç.');
  for(const key of ['id','term_id','course_id','kind','event_date','event_time'])record[key]=value[key];
  return record;
}
export function createHandler({env,fetcher=fetch}) {
  const base=env('SUPABASE_URL'),service=env('SUPABASE_SERVICE_ROLE_KEY');
  const origins=(env('CALENDAR_ALLOWED_ORIGINS')||'https://wololeybus.github.io').split(',').map(v=>v.trim()).filter(Boolean);
  const site=env('CALENDAR_SITE_URL')||'https://wololeybus.github.io/course-calendar/';
  const turnstile=env('TURNSTILE_SECRET_KEY'),formEndpoint=env('CALENDAR_FORM_ENDPOINT');
  const mailReady=Boolean(formEndpoint&&/^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(formEndpoint));
  const workerKey=env('CALENDAR_WORKER_SECRET');
  const reportsReady=mailReady&&Boolean(workerKey)&&env('CALENDAR_REPORTS_ENABLED')==='true';
  const withTimeout=(url,options={})=>fetcher(url,{...options,signal:AbortSignal.timeout(12000)});
  async function db(path,body,method=body?'POST':'GET') {
    const response=await withTimeout(`${base}/rest/v1/${path}`,{method,headers:{apikey:service,Authorization:`Bearer ${service}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
    const text=await response.text();
    const result=text?JSON.parse(text):null;
    if(!response.ok) {
      const errors={quota_reached:['Gönderim sınırına ulaşıldı. Daha sonra tekrar dene.',429],term_closed:['Bu dönem yeni kayda kapalı.',400],date_outside_term:['Tarih seçilen dönemin dışında.',400],entry_not_found:['Kayıt bulunamadı.',404],request_conflict:['Bu gönderim numarası daha önce kullanıldı. Formu yeniden aç.',409]};
      const known=errors[result?.message];
      if(known)throw fail(...known);
      if(result?.code==='23503')throw fail('Ders bu dönemin kataloğunda bulunamadı.');
      throw fail('Veritabanı işlemi tamamlanamadı.',503);
    }
    return result;
  }
  async function verify(token,action,origin) {
    if(!turnstile)throw fail('Kayıt gönderimi henüz açılmadı.',503);
    if(typeof token!=='string'||!token||token.length>2048)throw fail('Doğrulama tamamlanamadı.',403);
    const response=await withTimeout('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:turnstile,response:token})});
    const result=await response.json();
    if(!response.ok||!result.success||result.action!==action||result.hostname!==new URL(origin).hostname)throw fail('Doğrulama başarısız. Tekrar deneyebilirsin.',403);
  }
  async function deliver() {
    if(!mailReady)return 0;
    const reports=await db('rpc/calendar_claim_reports',{p_limit:2});
    let sent=0;
    for(const report of reports) {
      let success=false;
      try {
        const records=await db(`calendar_entries?id=eq.${report.entry_id}&select=id,course_id,term_id,title,kind,event_date,event_time,location&limit=1`);
        const record=records[0];
        if(record) {
          const course=(await db(`calendar_courses?term_id=eq.${encodeURIComponent(record.term_id)}&id=eq.${encodeURIComponent(record.course_id)}&select=code,name&limit=1`))[0];
          const response=await withTimeout(formEndpoint,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({subject:`${course?.code||record.course_id} kaydında hata uyarısı`,ders:course?.code||record.course_id,kayit:record.title,tur:record.kind,tarih:record.event_date,saat:record.event_time||'Belirtilmedi',yer:record.location||'Belirtilmedi',baglanti:`${site}?entry=${record.id}`,bildirim_id:report.id})});
          const result=await response.json();
          success=response.ok&&result.ok!==false&&!result.errors;
        }
      } catch { /* Keep a bounded retry in the private outbox; never log the payload. */ }
      await db('rpc/calendar_finish_report',{p_id:report.id,p_success:success});
      if(success)sent++;
    }
    return sent;
  }
  return async function handler(request) {
    const origin=request.headers.get('Origin')||'';
    const allowed=origins.includes(origin);
    const headers={'Content-Type':'application/json','Vary':'Origin','Cache-Control':'no-store',...(allowed?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'}:{})};
    const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
    try {
      if(!base||!service)throw fail('Ortak takvim henüz yapılandırılmadı.',503);
      if(request.method==='OPTIONS')return allowed?new Response(null,{status:204,headers}):response({error:'İzin verilmeyen kaynak.'},403);
      if(request.method==='GET') {
        if(origin&&!allowed)throw fail('İzin verilmeyen kaynak.',403);
        const term=new URL(request.url).searchParams.get('term');
        if(!term||!slug.test(term))throw fail('Geçerli bir dönem seç.');
        const terms=await db(`calendar_terms?id=eq.${encodeURIComponent(term)}&select=active,starts_on,ends_on,purge_after&limit=1`);
        const available=terms[0]&&terms[0].purge_after>new Date().toISOString().slice(0,10);
        const entries=[];
        if(available)for(let offset=0;offset<3000;offset+=1000) {
          const page=await db(`calendar_entries?term_id=eq.${encodeURIComponent(term)}&select=id,course_id,kind,title,event_date,event_time,location,details,nickname,updated_at&order=event_date.asc,event_time.asc.nullslast,id.asc&limit=1000&offset=${offset}`);
          entries.push(...page);if(page.length<1000)break;
        }
        return response({entries,term:available?{starts_on:terms[0].starts_on,ends_on:terms[0].ends_on}:null,capabilities:{create:Boolean(available&&terms[0].active&&turnstile),report:Boolean(available&&turnstile&&reportsReady)}});
      }
      if(request.method!=='POST')throw fail('Bu işlem desteklenmiyor.',405);
      if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw fail('JSON bekleniyor.',415);
      // Read at most 8 KiB rather than trusting the caller's Content-Length.
      const reader=request.body?.getReader();let raw='',size=0;
      if(!reader)throw fail('İstek boş.');
      const decoder=new TextDecoder();
      while(true){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.byteLength;if(size>8192){await reader.cancel();throw fail('İstek çok büyük.',413);}raw+=decoder.decode(chunk.value,{stream:true});}
      raw+=decoder.decode();let body;try{body=JSON.parse(raw);}catch{throw fail('Geçersiz istek.');}
      if(!body||typeof body!=='object'||Array.isArray(body))throw fail('Geçersiz istek.');
      if(body.action==='deliver') {
        if(!workerKey||request.headers.get('x-calendar-worker-secret')!==workerKey)throw fail('Bu işleme izin verilmiyor.',403);
        await db('rpc/calendar_cleanup',{});
        return response({sent:await deliver()});
      }
      if(!allowed)throw fail('İzin verilmeyen kaynak.',403);
      if(body.website)throw fail('İstek kabul edilmedi.');
      if(body.action==='create') {
        const record=validateRecord(body.record);await verify(body.token,'create',origin);
        return response(await db('rpc/calendar_create_entry',{p_record:record}),201);
      }
      if(body.action==='report') {
        if(!reportsReady)throw fail('Hata bildirimi henüz açılmadı.',503);
        if(typeof body.entry_id!=='string'||!UUID.test(body.entry_id))throw fail('Geçersiz kayıt.');
        await verify(body.token,'report',origin);
        const report=await db('rpc/calendar_report_entry',{p_entry_id:body.entry_id});
        // Scheduled delivery keeps the one-click request short, even during provider outages.
        return response({accepted:true,duplicate:report.duplicate},202);
      }
      throw fail('Geçersiz işlem.');
    } catch(error) {return response({error:error.status?error.message:'İşlem tamamlanamadı. Tekrar deneyebilirsin.'},error.status||503);}
  };
}
