(() => {
  'use strict';

  const gradePoints = { AA:4, BA:3.5, BB:3, CB:2.5, CC:2, DC:1.5, DD:1, FD:.5, FF:0, NA:0 };
  const gradeKeys = ['DD','DC','CC','CB','BB','BA','AA'];
  const failingGrades = new Set(['FF','FD','NA']);
  const prerequisites = {
    'PHYS 204':'PHYS 203', 'PHYS 212':'PHYS 201', 'PHYS 305':'PHYS 222',
    'PHYS 302':'PHYS 301', 'PHYS 322':'PHYS 321', 'PHYS 432':'PHYS 431'
  };
  const validYears = Object.keys(window.CURRICULA || {}).map(Number).sort();
  let year = null;
  let profile = 1;
  let undoSnapshot = null;

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const optionsHTML = '<option value="">-</option>' + Object.keys(gradePoints).map(g => `<option value="${g}">${g}</option>`).join('');
  const escapeHTML = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  function storageKey() { return `iyte_gpa_${year}_p${profile}`; }

  function initialState() { return { version: 4, year, profile, target: '', static: {}, dynamic: {} }; }

  function getURLYear() {
    const raw = Number(new URLSearchParams(location.search).get('year'));
    return validYears.includes(raw) ? raw : null;
  }

  function setURLYear(nextYear) {
    const url = new URL(location.href);
    url.searchParams.set('year', nextYear);
    history.replaceState({}, '', url);
  }

  function setupYearUI() {
    $('#yearGrid').innerHTML = validYears.map(y => `<button class="year-pick" type="button" data-year="${y}">${y}</button>`).join('');
    $('#yearSelect').innerHTML = validYears.map(y => `<option value="${y}">${y} girişli</option>`).join('');
    $('#yearGrid').addEventListener('click', e => {
      const btn = e.target.closest('[data-year]');
      if (btn) activateYear(Number(btn.dataset.year));
    });
    $('#yearSelect').addEventListener('change', e => activateYear(Number(e.target.value)));
  }

  function activateYear(nextYear) {
    if (!validYears.includes(nextYear)) return;
    if (year) saveState();
    year = nextYear;
    profile = 1;
    undoSnapshot = null;
    setURLYear(year);
    $('#yearGate').classList.add('hidden');
    $('#calculatorApp').classList.remove('hidden');
    $('#yearSelect').value = String(year);
    $$('.profile-btn').forEach((b,i) => b.classList.toggle('active', i === 0));
    renderCurriculum();
    loadState();
    $('#pageTitle').textContent = `${year} Müfredatı GPA Hesaplayıcı`;
    $('#brandSubtitle').textContent = `${year} GİRİŞLİ • GPA ASİSTANI`;
  }

  function showYearGate() {
    $('#calculatorApp').classList.add('hidden');
    $('#yearGate').classList.remove('hidden');
  }

  function renderCurriculum() {
    const curriculum = window.CURRICULA[String(year)];
    $('#semesterContainer').innerHTML = curriculum.semesters.map((sem, semIndex) => `
      <section class="semester-block open" id="${escapeHTML(sem.id || `sem${semIndex+1}`)}" data-sem-index="${semIndex}">
        <div class="semester-header">
          <div><span class="semester-title">${escapeHTML(sem.title)}</span><span class="semester-spa" id="sem${semIndex+1}-spa">0.00</span></div>
          <button class="add-course-btn" type="button">+ Ders</button>
        </div>
        <div class="semester-content">
          <table>
            <thead><tr><th style="width:16%">Kod</th><th>Ders adı</th><th style="width:76px">Kr</th><th style="width:82px">Not</th><th style="width:32px"></th></tr></thead>
            <tbody class="course-list">
              ${sem.courses.map((course, rowIndex) => staticRow(course, semIndex, rowIndex)).join('')}
            </tbody>
          </table>
        </div>
      </section>`).join('');
  }

  function staticRow(course, semIndex, rowIndex) {
    const name = course.editableName
      ? `<input type="text" class="course-name-input" value="${escapeHTML(course.name)}">`
      : escapeHTML(course.name);
    const credit = `<input type="number" min="0" step="0.5" value="${course.credit}" class="credit-input" ${course.editableCredit ? '' : 'readonly'}>`;
    return `<tr data-static="true" data-key="s${semIndex}r${rowIndex}">
      <td class="c-code">${escapeHTML(course.code)}</td><td>${name}</td><td>${credit}</td>
      <td><select class="grade-select">${optionsHTML}</select></td><td></td>
    </tr>`;
  }

  function addCourse(semIndex, data = null) {
    const tbody = $(`.semester-block[data-sem-index="${semIndex}"] .course-list`);
    if (!tbody) return;
    const id = data?.id || `d${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    const tr = document.createElement('tr');
    tr.dataset.dynamic = 'true';
    tr.dataset.id = id;
    tr.innerHTML = `
      <td><input type="text" class="course-code-input" placeholder="Kod" value="${escapeHTML(data?.code || '')}"></td>
      <td><input type="text" class="course-name-input" placeholder="Ders Adı" value="${escapeHTML(data?.name || '')}"></td>
      <td><input type="number" min="0" step="0.5" class="credit-input" value="${escapeHTML(data?.credit ?? 3)}"></td>
      <td><select class="grade-select">${optionsHTML}</select></td>
      <td><button type="button" class="remove-btn" aria-label="Dersi kaldır">×</button></td>`;
    if (data?.grade) tr.querySelector('.grade-select').value = data.grade;
    tbody.appendChild(tr);
  }

  function collectState() {
    const state = initialState();
    state.target = $('#targetGPA').value;
    $$('tr[data-static="true"]').forEach(row => {
      state.static[row.dataset.key] = {
        grade: row.querySelector('.grade-select').value,
        name: row.querySelector('.course-name-input')?.value ?? null,
        credit: row.querySelector('.credit-input').value
      };
    });
    $$('.semester-block').forEach(sem => {
      const semIndex = sem.dataset.semIndex;
      state.dynamic[semIndex] = [...sem.querySelectorAll('tr[data-dynamic="true"]')].map(row => ({
        id: row.dataset.id,
        code: row.querySelector('.course-code-input').value,
        name: row.querySelector('.course-name-input').value,
        credit: row.querySelector('.credit-input').value,
        grade: row.querySelector('.grade-select').value
      }));
    });
    return state;
  }

  function applyState(state) {
    if (!state || Number(state.year) !== year) return;
    $('#targetGPA').value = state.target || '';
    Object.entries(state.static || {}).forEach(([key,val]) => {
      const row = document.querySelector(`tr[data-key="${CSS.escape(key)}"]`);
      if (!row) return;
      row.querySelector('.grade-select').value = val.grade || '';
      const name = row.querySelector('.course-name-input');
      if (name && val.name != null) name.value = val.name;
      const credit = row.querySelector('.credit-input');
      if (credit && val.credit != null && !credit.readOnly) credit.value = val.credit;
    });
    Object.entries(state.dynamic || {}).forEach(([semIndex,rows]) => (rows || []).forEach(row => addCourse(Number(semIndex), row)));
    calculate();
  }

  function saveState() {
    if (!year) return;
    localStorage.setItem(storageKey(), JSON.stringify(collectState()));
  }

  function loadState() {
    const raw = localStorage.getItem(storageKey());
    if (!raw) { calculate(); return; }
    try { applyState(JSON.parse(raw)); } catch (err) { console.error('Kayıt okunamadı', err); calculate(); }
  }

  function resetView() {
    renderCurriculum();
    $('#targetGPA').value = '';
    $('#targetResult').textContent = '';
    calculate(false);
  }

  function calculate(persist = true) {
    let totalPoints = 0, totalCredits = 0;
    const passedCodes = new Set();
    const distribution = {};

    $$('.semester-block').forEach((sem, semIndex) => {
      let semPoints = 0, semCredits = 0;
      sem.querySelectorAll('tbody tr').forEach(row => {
        row.classList.remove('prereq-fail');
        row.querySelector('.fail-msg')?.remove();
        const credit = Number(row.querySelector('.credit-input')?.value || 0);
        const grade = row.querySelector('.grade-select')?.value || '';
        const code = row.querySelector('.c-code')?.textContent.trim() || row.querySelector('.course-code-input')?.value.trim() || '';
        if (grade && Number.isFinite(credit) && credit > 0) {
          const pts = gradePoints[grade] * credit;
          semPoints += pts; semCredits += credit; totalPoints += pts; totalCredits += credit;
          distribution[grade] = (distribution[grade] || 0) + 1;
          if (!failingGrades.has(grade) && code) passedCodes.add(code);
        }
      });
      $(`#sem${semIndex+1}-spa`).textContent = semCredits ? (semPoints/semCredits).toFixed(2) : '0.00';
    });

    checkPrerequisites(passedCodes);
    const gpa = totalCredits ? totalPoints / totalCredits : 0;
    $('#gpaResult').textContent = gpa.toFixed(2);
    $('#totalCredits').textContent = String(totalCredits);
    updateStatus(gpa, totalCredits);
    updateStats(distribution);
    if (persist) saveState();
  }

  function checkPrerequisites(passedCodes) {
    $$('tbody tr').forEach(row => {
      const code = row.querySelector('.c-code')?.textContent.trim() || row.querySelector('.course-code-input')?.value.trim() || '';
      const prereq = prerequisites[code];
      if (!prereq || passedCodes.has(prereq)) return;
      const grade = row.querySelector('.grade-select')?.value;
      if (!grade) return;
      row.classList.add('prereq-fail');
      const msg = document.createElement('span');
      msg.className = 'fail-msg'; msg.textContent = `Önkoşul: ${prereq}`;
      row.children[1]?.appendChild(msg);
    });
  }

  function updateStatus(gpa, credits) {
    const status = $('#gpaStatus');
    const reg = $('#regDynamicStatus');
    if (!credits) {
      status.textContent = 'Başlangıç'; reg.innerHTML = '<span class="muted">Not girdikçe akademik durum burada görünür.</span>'; return;
    }
    if (gpa < 2) { status.textContent = 'Başarısız'; reg.innerHTML = '<div class="reg-alert">GNO 2,00 altında.</div>'; }
    else if (gpa >= 3.5) { status.textContent = 'Yüksek Onur düzeyi'; reg.innerHTML = '<div class="reg-ok">GNO 3,50 veya üzeri.</div>'; }
    else if (gpa >= 3) { status.textContent = 'Onur düzeyi'; reg.innerHTML = '<div class="reg-ok">GNO 3,00 veya üzeri.</div>'; }
    else { status.textContent = 'Başarılı'; reg.innerHTML = '<div class="reg-ok">GNO 2,00 veya üzeri.</div>'; }
  }

  function updateStats(distribution) {
    const entries = Object.keys(gradePoints).filter(g => distribution[g]);
    $('#statsContainer').innerHTML = entries.length
      ? entries.map(g => `<div><strong>${g}</strong>: ${distribution[g]} ders</div>`).join('')
      : 'Henüz not girilmedi.';
  }

  function saveUndoSnapshot() {
    undoSnapshot = collectState();
    $('#btnUndo').style.display = 'block';
  }

  function autoFillTarget() {
    const target = Number($('#targetGPA').value);
    if (!Number.isFinite(target) || target < 0 || target > 4) { $('#targetResult').textContent = '0,00–4,00 arasında hedef gir.'; return; }
    const rows = $$('tbody tr');
    let fixedPoints = 0, fixedCredits = 0;
    const empty = [];
    rows.forEach(row => {
      const cr = Number(row.querySelector('.credit-input')?.value || 0);
      const sel = row.querySelector('.grade-select');
      if (!sel || cr <= 0) return;
      if (sel.value) { fixedPoints += gradePoints[sel.value] * cr; fixedCredits += cr; }
      else empty.push({ sel, cr, idx: 0 });
    });
    if (!empty.length) { $('#targetResult').textContent = 'Notu boş kredili ders yok.'; return; }
    saveUndoSnapshot();
    const allCredits = fixedCredits + empty.reduce((s,c) => s+c.cr, 0);
    const maxPoints = fixedPoints + empty.reduce((s,c) => s + c.cr*4, 0);
    const maxGpa = maxPoints/allCredits;
    if (target > maxGpa + 1e-9) {
      empty.forEach(c => c.sel.value = 'AA');
      $('#targetResult').textContent = `Bu derslerle maksimum yaklaşık ${maxGpa.toFixed(2)}.`;
      calculate(); return;
    }
    let points = fixedPoints + empty.reduce((s,c) => s + c.cr*gradePoints[gradeKeys[0]], 0);
    const need = target * allCredits;
    while (points + 1e-9 < need) {
      let best = null;
      for (const c of empty) if (c.idx < gradeKeys.length-1 && (!best || c.idx < best.idx)) best = c;
      if (!best) break;
      points -= best.cr * gradePoints[gradeKeys[best.idx]];
      best.idx++;
      points += best.cr * gradePoints[gradeKeys[best.idx]];
    }
    empty.forEach(c => c.sel.value = gradeKeys[c.idx]);
    $('#targetResult').textContent = 'Boş dersler hedefe yaklaşacak şekilde dolduruldu.';
    calculate();
  }

  function exportData() {
    const payload = collectState();
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `iyte-fizik-gpa-${year}-profil${profile}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  async function importData(file) {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (Number(data.year) !== year) { alert(`Bu yedek ${data.year || '?'} müfredatına ait. Önce o yılı seç.`); return; }
      resetView(); applyState(data); saveState();
    } catch { alert('Yedek dosyası okunamadı.'); }
  }

  function bindEvents() {
    $('#semesterContainer').addEventListener('click', e => {
      const add = e.target.closest('.add-course-btn');
      if (add) { e.stopPropagation(); addCourse(Number(add.closest('.semester-block').dataset.semIndex)); calculate(); return; }
      const remove = e.target.closest('.remove-btn');
      if (remove) { remove.closest('tr').remove(); calculate(); return; }
      const header = e.target.closest('.semester-header');
      if (header) header.closest('.semester-block').classList.toggle('open');
    });
    $('#gpaForm').addEventListener('input', calculate);
    $('#gpaForm').addEventListener('change', calculate);
    $$('.profile-btn').forEach(btn => btn.addEventListener('click', () => {
      saveState(); profile = Number(btn.dataset.profile); undoSnapshot = null;
      $$('.profile-btn').forEach(b => b.classList.toggle('active', b === btn));
      resetView(); loadState();
    }));
    $('#regHeader').addEventListener('click', () => {
      $('#regBox').classList.toggle('open');
      $('#regChevron').textContent = $('#regBox').classList.contains('open') ? '▲' : '▼';
    });
    $('#autoFillBtn').addEventListener('click', autoFillTarget);
    $('#btnUndo').addEventListener('click', () => {
      if (!undoSnapshot) return;
      resetView(); applyState(undoSnapshot); undoSnapshot = null; $('#btnUndo').style.display = 'none'; saveState();
    });
    $('#resetBtn').addEventListener('click', () => {
      if (!confirm(`${year} • Profil ${profile} verileri sıfırlansın mı?`)) return;
      saveUndoSnapshot(); localStorage.removeItem(storageKey()); resetView();
    });
    $('#exportBtn').addEventListener('click', exportData);
    $('#importBtn').addEventListener('click', () => $('#fileInput').click());
    $('#fileInput').addEventListener('change', e => { importData(e.target.files[0]); e.target.value=''; });
  }

  setupYearUI();
  bindEvents();
  const initialYear = getURLYear();
  if (initialYear) activateYear(initialYear); else showYearGate();
})();
