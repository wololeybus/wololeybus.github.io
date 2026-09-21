(() => {
  'use strict';
  const points = Object.freeze({AA:4, BA:3.5, BB:3, CB:2.5, CC:2, DC:1.5, DD:1, FD:.5, FF:0, NA:0});
  const code = value => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const name = value => String(value || '').toLocaleLowerCase('tr-TR').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/\s*[—–-]\s*sube\s*\d+\s*$/i, '').trim().replace(/\s+/g, ' ');
  const credit = value => value === '' || value == null ? null :
    Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : null;
  const passing = grade => Object.hasOwn(points, grade) && !['FD','FF','NA'].includes(grade);
  function read(key) {
    try { const value = JSON.parse(localStorage.getItem(key)); return value && typeof value === 'object' ? value : {}; }
    catch { return {}; }
  }
  function records(year, profile) {
    const curriculum = window.CURRICULA?.[String(year)];
    const raw = read(`iyte_gpa_${year}_p${profile}`);
    const saved = Number(raw.year) === Number(year) ? raw : {};
    const tracker = read(`iyte_grad_${year}_p${profile}`);
    const result = [];
    (curriculum?.semesters || []).forEach((semester, si) => {
      semester.courses.forEach((course, ri) => {
        const key = `s${si}r${ri}`, stored = saved.static?.[key] || {};
        result.push({key, code:course.code, name:tracker.electives?.[key]?.name ?? stored.name ?? course.name,
          credit:credit(stored.credit ?? course.credit), grade:stored.grade || ''});
      });
      const extra = saved.dynamic?.[si];
      if (Array.isArray(extra)) extra.forEach((course, i) => {
        if (course && typeof course === 'object') result.push({key:`d:${course.id || `${si}_${i}`}`,
          code:course.code || '', name:course.name || '', credit:credit(course.credit), grade:course.grade || ''});
      });
    });
    return result;
  }
  function matches(course, record) {
    const actual = code(record.code), wanted = code(course.code);
    if (wanted && actual === wanted) return true;
    if (actual && !/^(ELS|ELT)/.test(actual)) return false;
    return Boolean(name(record.name)) && [course.name,course.nameEn].some(n => name(n) === name(record.name));
  }
  function previous(course, rows) {
    return rows.filter(r => matches(course,r) && Object.hasOwn(points,r.grade)).at(-1) || null;
  }
  function defaultCredit(course, rows) {
    const saved = previous(course, rows) || rows.find(r => matches(course,r));
    return saved?.credit ?? credit(course.credit);
  }
  function totals(rows) {
    return rows.reduce((sum,r) => {
      if (r.credit > 0 && Object.hasOwn(points,r.grade)) { sum.credits += r.credit; sum.points += r.credit * points[r.grade]; }
      return sum;
    }, {credits:0,points:0});
  }
  function project(rows, planned) {
    const base = totals(rows);
    let termCredits = 0, termPoints = 0, removedCredits = 0, removedPoints = 0, missing = 0;
    const seen = new Set(), replaced = new Set();
    for (const item of planned) {
      if (item.include === false) continue;
      const key = code(item.course.code) || item.course.id;
      if (seen.has(key)) continue;
      seen.add(key);
      const cr = credit(item.credit);
      if (cr === 0) continue;
      if (cr === null || !Object.hasOwn(points,item.grade)) { missing++; continue; }
      termCredits += cr; termPoints += cr * points[item.grade];
      const old = previous(item.course,rows);
      if (old && old.credit > 0 && !replaced.has(old.key)) {
        replaced.add(old.key); removedCredits += old.credit; removedPoints += old.credit * points[old.grade];
      }
    }
    const projectedCredits = base.credits - removedCredits + termCredits;
    return {baseGpa:base.credits ? base.points/base.credits : null,baseCredits:base.credits,
      termCredits, missing, termGpa:!missing && termCredits ? termPoints/termCredits : null,
      projectedGpa:!missing && termCredits && projectedCredits > 0 ? (base.points-removedPoints+termPoints)/projectedCredits : null};
  }
  function targetPlan(rows, target) {
    const grades = ['DD','DC','CC','CB','BB','BA','AA'];
    const fixed = totals(rows.filter(r => !r.include));
    const chosen = rows.filter(r => r.include && r.credit > 0).map(r => ({...r,
      index: Math.max(0, grades.indexOf(r.grade))}));
    const credits = fixed.credits + chosen.reduce((s,r) => s+r.credit,0);
    const maximum = credits ? (fixed.points + chosen.reduce((s,r)=>s+4*r.credit,0))/credits : null;
    let total = fixed.points + chosen.reduce((s,r)=>s+points[grades[r.index]]*r.credit,0);
    while (total + 1e-9 < target*credits) {
      const next = chosen.filter(r=>r.index<grades.length-1).sort((a,b)=>a.index-b.index)[0];
      if (!next) break;
      total -= points[grades[next.index]]*next.credit;
      next.index++;
      total += points[grades[next.index]]*next.credit;
    }
    return {maximum,gpa:credits ? total/credits : null,
      suggestions:chosen.map(r=>({...r,suggested:grades[r.index]}))};
  }
  window.IYTE_ACADEMIC = {points,code,name,credit,passing,read,records,matches,previous,defaultCredit,totals,project,targetPlan};
})();
