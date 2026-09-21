(() => {
  'use strict';
  const A = window.IYTE_ACADEMIC;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const format = value => value == null ? '—' : value.toFixed(2);
  window.IYTE_PLANNER_GPA = {
    create({getContext,getCourses,termId,readScenario,writeScenario,onChange}) {
      const container = document.querySelector('#miniGpaRows');
      const key = () => { const {year,profile}=getContext(); return `iyte_planner_gpa_scenario_${termId}_${year}_p${profile}`; };
      const read = () => readScenario ? readScenario() : A.read(key());
      function render() {
        const {year,profile}=getContext(), saved=read();
        const actual=A.records(year,profile), unique=new Map();
        getCourses().forEach(course => { const id=A.code(course.code)||course.id; if(!unique.has(id))unique.set(id,course); });
        const planned=[...unique].map(([id,course]) => {
          const config=saved[id] || {}, cr=config.credit ?? A.defaultCredit(course,actual);
          return {id,course,credit:cr,grade:config.grade || '',include:config.include ?? cr !== 0};
        });
        const result=A.project(actual,planned);
        document.querySelector('#miniGpaSummary').textContent=planned.length ? `Dönem ${format(result.termGpa)} · GNO ${format(result.projectedGpa)}` : 'Programa ders ekle';
        document.querySelector('#miniGpaBaseline').textContent=`Kayıtlı GNO: ${format(result.baseGpa)} · ${result.baseCredits} yerel kredi. Tahminler gerçek notlarını değiştirmez.`;
        document.querySelector('#miniGpaMessage').textContent=result.missing ? `${result.missing} dersin tahmini notunu veya yerel kredisini tamamla.` :
          result.termCredits ? `${result.termCredits} yerel kredi hesaplanıyor. Tekrar derslerinde kayıtlı eski notun yerine tahmini not kullanılır.` : 'Hesaplamak istediğin dersleri işaretle ve tahmini harf notlarını seç.';
        container.innerHTML=planned.length ? planned.map(item => {
          const old=A.previous(item.course,actual);
          return `<tr class="${item.include ? '' : 'gpa-excluded'}">
            <td><input type="checkbox" data-gpa-id="${escape(item.id)}" data-field="include" aria-label="${escape(item.course.code)} hesaba kat" ${item.include?'checked':''}></td>
            <td><strong title="${escape(item.course.name)}">${escape(item.course.code)}</strong><small>${old ? `Mevcut: ${escape(old.grade)}` : 'Yeni ders'}</small></td>
            <td><input class="mini-credit" type="number" min="0" step="0.5" value="${escape(item.credit ?? '')}" placeholder="Kredi" data-gpa-id="${escape(item.id)}" data-field="credit" aria-label="${escape(item.course.code)} yerel kredi" ${item.include?'':'disabled'}></td>
            <td><select data-gpa-id="${escape(item.id)}" data-field="grade" aria-label="${escape(item.course.code)} tahmini not" ${item.include?'':'disabled'}><option value="">Not seç</option>${Object.keys(A.points).map(g=>`<option value="${g}" ${g===item.grade?'selected':''}>${g}</option>`).join('')}</select></td>
          </tr>`;
        }).join('') : '<tr><td colspan="4">Önce haftalık programına ders ekle.</td></tr>';
      }
      container.addEventListener('change', event => {
        const {gpaId,field}=event.target.dataset;
        if(!gpaId || !['include','credit','grade'].includes(field))return;
        const saved=read();
        saved[gpaId]={...saved[gpaId],[field]:field==='include'?event.target.checked:event.target.value};
        if(writeScenario)writeScenario(saved);else localStorage.setItem(key(),JSON.stringify(saved));
        render(); onChange?.();
      });
      window.addEventListener('storage', event => {if(event.storageArea===localStorage && (event.key===null || event.key===key()))render();});
      return {render};
    }
  };
})();
