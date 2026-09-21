(() => {
  'use strict';
  const format='iyte-physics-tools';
  const object=v=>v!==null && typeof v==='object' && !Array.isArray(v);
  function group(key) {
    if (/^iyte_gpa_20\d{2}_p[123]$/.test(key))return 'GPA notları';
    if (/^iyte_gpa_target_20\d{2}_p[123]$/.test(key) || /^iyte_planner_gpa_scenario_[\w-]+_20\d{2}_p[123]$/.test(key))return 'GPA tahminleri';
    if (/^iyte_grad_20\d{2}_p[123]$/.test(key))return 'Mezuniyet takibi';
    if (/^iyte-course-planner(?:-beta)?(?::|-filter:|-context:|-plans:)[\w-]+$/.test(key))return 'Ders programları';
    if (key==='iyte-vize-final-v1')return 'Vize–final notları';
    if (['iyte_grad_year','iyte_grad_profile','site-theme','iyte_tools_theme'].includes(key))return 'Görünüm ve tercihler';
    return null;
  }
  function capture(storage=localStorage) {
    const data={};
    for(let i=0;i<storage.length;i++) { const key=storage.key(i); if(group(key))data[key]=storage.getItem(key); }
    return {format,version:1,createdAt:new Date().toISOString(),data};
  }
  function checkValue(key, raw) {
    if(typeof raw!=='string')return false;
    if (['site-theme','iyte_tools_theme'].includes(key))return ['light','dark'].includes(raw);
    if (key==='iyte_grad_year')return /^(2019|202[0-6])$/.test(raw);
    if (key==='iyte_grad_profile')return /^[123]$/.test(raw);
    if (key.includes('-filter:'))return /^[a-z0-9-]{1,30}$/.test(raw);
    let value;try { value=JSON.parse(raw); } catch { return false; }
    if(key.includes('-plans:'))return window.IYTE_PLANS.validate(value,key.split(':')[1]);
    if(key.includes('-context:'))return object(value) && Number.isInteger(value.year) && value.year>=2019 && value.year<=2026 && [1,2,3].includes(value.profile);
    if(/^iyte-course-planner(?:-beta)?:/.test(key))return Array.isArray(value) && value.every(id=>typeof id==='string');
    if(key==='iyte-vize-final-v1')return Array.isArray(value) && value.every(c=>object(c) && (!c.midterms || Array.isArray(c.midterms) && c.midterms.every(object)));
    if(!object(value))return false;
    if(/^iyte_gpa_20/.test(key)) {
      if(Number(value.year)!==Number(key.match(/20\d{2}/)[0]))return false;
      return (!value.static || object(value.static) && Object.values(value.static).every(object)) &&
        (!value.dynamic || object(value.dynamic) && Object.values(value.dynamic).every(rows=>Array.isArray(rows) && rows.every(object)));
    }
    if(/^iyte_grad_20/.test(key))return ['overrides','electives','extras'].every(field=>!value[field] || object(value[field])) &&
      ['electives','extras'].every(field=>!value[field] || Object.values(value[field]).every(object));
    if(key.startsWith('iyte_gpa_target_'))return Object.values(value).every(v=>typeof v==='boolean');
    return Object.values(value).every(object);
  }
  function validate(payload) {
    if(!object(payload) || payload.format!==format || payload.version!==1 || !object(payload.data))throw new Error('Bu dosya tüm araçlar için oluşturulmuş geçerli bir yedek değil.');
    const entries=Object.entries(payload.data);
    if(entries.length>500)throw new Error('Yedekte beklenenden fazla kayıt var.');
    for(const [key,raw] of entries)if(!group(key) || !checkValue(key,raw))throw new Error(`Yedek okunamadı: ${key}. Hiçbir kayıt değiştirilmedi.`);
    return payload;
  }
  function describe(payload) {
    const counts={};
    for(const key of Object.keys(payload.data))counts[group(key)]=(counts[group(key)]||0)+1;
    return counts;
  }
  function restore(payload, mode='replace', storage=localStorage) {
    validate(payload);
    if(!['replace','merge'].includes(mode))throw new Error('Geçersiz geri yükleme seçimi.');
    const before=capture(storage);
    const removeOwned=()=>Object.keys(capture(storage).data).forEach(key=>storage.removeItem(key));
    try {
      if(mode==='replace')removeOwned();
      for(const [key,raw] of Object.entries(payload.data))storage.setItem(key,raw);
    } catch(error) {
      removeOwned();
      for(const [key,raw] of Object.entries(before.data))storage.setItem(key,raw);
      throw new Error('Yedek kaydedilemedi; önceki kayıtlar geri getirildi. Tarayıcının depolama alanını kontrol et.');
    }
    return before;
  }
  window.IYTE_BACKUP={capture,validate,describe,restore};
})();
