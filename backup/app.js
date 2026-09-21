(() => {
  'use strict';
  const B=window.IYTE_BACKUP, $=s=>document.querySelector(s);
  let pending=null, undo=null, selection=0;
  function list(target,payload) {
    const entries=Object.entries(B.describe(payload));
    $(target).innerHTML=entries.length ? entries.map(([label,count])=>`<li>${label}: ${count} kayıt grubu</li>`).join('') : '<li>Henüz kayıt yok.</li>';
  }
  const refresh=()=>list('#currentSummary',B.capture());
  function download(payload) {
    const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download=`iyte-tum-araclar-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  $('#downloadBackup').addEventListener('click',()=>{
    try { download(B.capture()); $('#backupMessage').textContent='Yedek indirme başlatıldı.'; } catch { $('#backupMessage').textContent='Yedek indirilemedi.'; }
  });
  $('#backupFile').addEventListener('change',async event=>{
    const request=++selection, file=event.target.files[0];pending=null;$('#backupPreview').hidden=true;$('#backupMessage').textContent='';
    if(!file)return;
    try {
      if(file.size>5*1024*1024)throw new Error('Yedek dosyası en fazla 5 MB olabilir.');
      const value=B.validate(JSON.parse(await file.text()));
      if(request!==selection)return;
      pending=value;list('#incomingSummary',pending);
      const date=new Date(pending.createdAt);
      $('#backupDate').textContent=Number.isNaN(date.getTime())?'Yedek önizlemesi':`Oluşturulma: ${date.toLocaleString('tr-TR')}`;
      $('#backupPreview').hidden=false;
    } catch(error) { if(request===selection)$('#backupMessage').textContent=error instanceof SyntaxError?'Dosya okunamadı. Geçerli bir JSON yedeği seç.':error.message; }
  });
  $('#restoreMode').addEventListener('change',()=>{
    $('#restoreExplanation').textContent=$('#restoreMode').value==='replace'?'Bu sitedeki mevcut kayıtların yerini yedekteki kayıtlar alır.':'Yedekte bulunmayan mevcut kayıtlar korunur; çakışan kayıtlar yedektekiyle değiştirilir.';
  });
  $('#restoreBackup').addEventListener('click',()=>{
    if(!pending)return;
    try {
      undo=B.restore(pending,$('#restoreMode').value);refresh();$('#undoRestore').hidden=false;
      $('#backupMessage').textContent='Yedek geri yüklendi. Araçları açarak kullanabilirsin.';
    } catch(error) { $('#backupMessage').textContent=error.message; }
  });
  $('#undoRestore').addEventListener('click',()=>{
    if(!undo)return;
    try { B.restore(undo);undo=null;refresh();$('#undoRestore').hidden=true;$('#backupMessage').textContent='Geri yükleme öncesindeki kayıtlar geri getirildi.'; }
    catch(error) { $('#backupMessage').textContent=error.message; }
  });
  window.addEventListener('pageshow',refresh);refresh();
})();
