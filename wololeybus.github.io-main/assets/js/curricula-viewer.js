(() => {
  const years = Object.keys(window.CURRICULA).map(Number).sort();
  const list = document.getElementById('yearList');
  const grid = document.getElementById('semGrid');
  const calcLink = document.getElementById('calcLink');
  const esc = v => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function render(year) {
    list.innerHTML = years.map(y=>`<button data-year="${y}" class="${y===year?'active':''}">${y} girişli</button>`).join('');
    const data=window.CURRICULA[String(year)];
    grid.innerHTML=data.semesters.map(sem=>`<article class="sem-card card"><h2>${esc(sem.title)}</h2>${sem.courses.map(c=>`<div class="course"><span class="course-code">${esc(c.code)}</span><span>${esc(c.name)}</span><span class="course-credit">${c.credit}</span></div>`).join('')}</article>`).join('');
    calcLink.href=`../calculator/?year=${year}`;
  }
  list.addEventListener('click',e=>{const b=e.target.closest('[data-year]');if(b)render(Number(b.dataset.year));});
  render(years.at(-1));
})();
