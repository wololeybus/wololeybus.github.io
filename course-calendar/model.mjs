export const kinds = Object.freeze({exam:'Sınav', homework:'Ödev', announcement:'Duyuru'});
export const selectionKey = term => `iyte-calendar-courses:${term}`;
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function readSelection(storage, term, courses) {
  const valid = new Set(courses.map(c => c.id));
  const parse = raw => { try { const x=JSON.parse(raw); return Array.isArray(x) ? x.filter(id=>valid.has(id)) : []; } catch { return []; } };
  const saved = storage.getItem(selectionKey(term));
  if (saved !== null) return parse(saved);
  return plannerSelection(storage, term, courses);
}
export function plannerSelection(storage, term, courses) {
  const valid = new Set(courses.map(c=>c.id));
  let selected;
  try {
    const plans=JSON.parse(storage.getItem(`iyte-course-planner-beta-plans:${term}`));
    selected=plans?.plans?.find(p=>p.id===plans.activeId)?.selected;
  } catch {}
  if (!Array.isArray(selected)) {
    try { selected=JSON.parse(storage.getItem(`iyte-course-planner-beta:${term}`) ?? storage.getItem(`iyte-course-planner:${term}`) ?? '[]'); } catch {}
  }
  return Array.isArray(selected) ? selected.filter(id=>valid.has(id)) : [];
}
export function todayInTurkey(now=new Date()) {
  return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Istanbul'}).format(now);
}
export function visibleEntries(entries,{selected,scope='mine',kind='all',past=false,today=todayInTurkey()}) {
  return entries.filter(e=>(scope==='all'||selected.has(e.course_id)) && (kind==='all'||e.kind===kind) && (past||e.event_date>=today))
    .sort((a,b)=>a.event_date.localeCompare(b.event_date)||(a.event_time||'99:99').localeCompare(b.event_time||'99:99'));
}
export function dateLabel(date) {
  return new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'long',year:'numeric',weekday:'long',timeZone:'Europe/Istanbul'}).format(new Date(`${date}T12:00:00+03:00`));
}
