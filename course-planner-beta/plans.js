(() => {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const validContext = c => object(c) && Number.isInteger(c.year) && c.year >= 2019 && c.year <= 2026 && [1,2,3].includes(c.profile);
  const contextKey = c => `${c.year}_p${c.profile}`;
  function validate(state, termId) {
    if (!object(state) || state.version !== 1 || state.termId !== termId || !Array.isArray(state.plans) || !state.plans.length || state.plans.length > 50) return false;
    const ids = new Set();
    for (const p of state.plans) {
      if (!object(p) || typeof p.id !== 'string' || !/^[\w-]{1,100}$/.test(p.id) || ids.has(p.id) || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 60 || !validContext(p.context)) return false;
      if (!Array.isArray(p.selected) || !p.selected.every(id=>typeof id==='string') || !object(p.scenarios)) return false;
      if (!Object.entries(p.scenarios).every(([key,scenario])=>/^20\d{2}_p[123]$/.test(key) && object(scenario) && Object.values(scenario).every(object))) return false;
      ids.add(p.id);
    }
    return ids.has(state.activeId);
  }
  function createStore({termId,initialSelected,initialContext,storage=localStorage}) {
    const key = `iyte-course-planner-beta-plans:${termId}`;
    let state;
    try { const saved=JSON.parse(storage.getItem(key)); if(validate(saved,termId))state=saved; } catch {}
    if (!state) {
      const scenarios = {};
      for (let year=2019;year<=2026;year++) for (let profile=1;profile<=3;profile++) {
        try {
          const saved=JSON.parse(storage.getItem(`iyte_planner_gpa_scenario_${termId}_${year}_p${profile}`));
          if(object(saved) && Object.values(saved).every(object))scenarios[`${year}_p${profile}`]=saved;
        } catch {}
      }
      state={version:1,termId,activeId:'initial',plans:[{id:'initial',name:'Planım',selected:[...initialSelected],context:{...initialContext},scenarios}]};
      storage.setItem(key,JSON.stringify(state));
    }
    const save = next => { storage.setItem(key,JSON.stringify(next)); state=next; };
    const active = () => state.plans.find(p=>p.id===state.activeId);
    const update = fn => { const next=clone(state); fn(next.plans.find(p=>p.id===next.activeId),next); save(next); };
    const cleanName = value => {
      const name=String(value||'').trim();
      if(!name || name.length>60)throw new Error('Plan adı 1–60 karakter olmalı.');
      return name;
    };
    return {
      key, active:()=>clone(active()), all:()=>clone(state.plans),
      selected(ids,context) { update(p=>{p.selected=[...ids];p.context={...context};}); },
      scenario(context) { return clone(active().scenarios[contextKey(context)] || {}); },
      saveScenario(context,scenario) { update(p=>{p.scenarios[contextKey(context)]=clone(scenario);}); },
      rename(value) { const name=cleanName(value); update(p=>{p.name=name;}); },
      copy(value) {
        const name=cleanName(value);
        if(state.plans.length>=50)throw new Error('En fazla 50 plan kaydedebilirsin.');
        const id=`p${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;
        update((p,next)=>{next.plans.push({...clone(p),id,name});next.activeId=id;});
      },
      open(id) { if(!state.plans.some(p=>p.id===id))return; update((p,next)=>{next.activeId=id;}); },
      remove() {
        if(state.plans.length===1)throw new Error('En az bir plan kalmalı.');
        update((p,next)=>{next.plans=next.plans.filter(item=>item.id!==p.id);next.activeId=next.plans[0].id;});
      },
      reload() { const saved=JSON.parse(storage.getItem(key)); if(validate(saved,termId))state=saved; }
    };
  }
  function summary(plan, courses) {
    const A=window.IYTE_ACADEMIC, records=A.records(plan.context.year,plan.context.profile);
    const scenario=plan.scenarios[contextKey(plan.context)] || {};
    const chosen=courses.filter(c=>plan.selected.includes(c.id));
    const unique=[...new Map(chosen.map(c=>[A.code(c.code)||c.id,c])).values()];
    const planned=unique.map(course=>{
      const cfg=scenario[A.code(course.code)||course.id] || {};
      const credit=cfg.credit ?? A.defaultCredit(course,records);
      return {course,credit,grade:cfg.grade || '',include:cfg.include ?? credit!==0};
    });
    return {...A.project(records,planned),courses:unique.length,
      days:new Set(chosen.flatMap(c=>c.sessions.map(s=>s.day))).size,
      credits:planned.reduce((s,p)=>s+(A.credit(p.credit) || 0),0),
      unknownCredits:planned.filter(p=>A.credit(p.credit)===null).length};
  }
  function mount({store,courses,onOpen}) {
    const $=s=>document.querySelector(s);
    const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const fmt=n=>n==null?'—':n.toFixed(2);
    function render() {
      const current=store.active();
      $('#planSelect').innerHTML=store.all().map(p=>`<option value="${esc(p.id)}" ${p.id===current.id?'selected':''}>${esc(p.name)}</option>`).join('');
      $('#planName').value=current.name;
      $('#deletePlan').disabled=store.all().length===1;
      $('#planSummary').textContent=current.name;
      $('#planComparison').innerHTML=store.all().map(p=>{
        const s=summary(p,courses);
        return `<tr ${p.id===current.id?'class="active-plan"':''}><th scope="row">${esc(p.name)}${p.id===current.id?' · Açık':''}</th><td>${p.context.year} / ${p.context.profile}</td><td>${s.courses}</td><td>${s.credits}${s.unknownCredits?' + ?':''}</td><td>${s.days}</td><td>${fmt(s.termGpa)}</td><td>${fmt(s.projectedGpa)}</td></tr>`;
      }).join('');
    }
    function act(fn) { try { fn(); render(); $('#planMessage').textContent='Kaydedildi.'; } catch(error) { $('#planMessage').textContent=error.message; } }
    $('#planSelect').addEventListener('change',e=>act(()=>{store.open(e.target.value);onOpen(store.active());}));
    $('#copyPlan').addEventListener('click',()=>act(()=>{store.copy($('#planName').value);onOpen(store.active());}));
    $('#renamePlan').addEventListener('click',()=>act(()=>store.rename($('#planName').value)));
    $('#deletePlan').addEventListener('click',()=>{
      if(confirm(`“${store.active().name}” planı silinsin mi?`))act(()=>{store.remove();onOpen(store.active());});
    });
    return {render};
  }
  window.IYTE_PLANS={validate,createStore,summary,mount};
})();
