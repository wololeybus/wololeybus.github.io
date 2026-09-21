const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = require('node:path').resolve(__dirname, '..') + '/';
let checks = 0;
function check(label, run) { run(); checks++; console.log('PASS', label); }

// Run the real scripts with an in-memory storage and a minimal DOM adapter.
// Check generated markup and event-driven updates, not browser layout.
function setup(seed = {}, search = '') {
  const data = new Map(Object.entries(seed));
  const nodes = new Map();
  const listeners = new Map();
  function node(key) {
    if (!nodes.has(key)) nodes.set(key, {
      innerHTML: '', textContent: '', value: '', dataset: {}, style: {},
      classList: { add() {}, remove() {}, toggle() {} }, handlers: {},
      addEventListener(type, fn) { this.handlers[type] = fn; }, querySelectorAll() { return []; },
      querySelector() { return node(key + '/child'); }, setAttribute() {}
    });
    return nodes.get(key);
  }
  const localStorage = {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key)
  };
  const docHandlers = {};
  const ctx = { console, localStorage, URL, URLSearchParams, setTimeout: () => 1, clearTimeout() {}, confirm: () => true,
    location: { href: 'https://example.test/graduation/' + search, search },
    history: { replaceState() {} },
    document: { body: node('body'), documentElement: node('root'),
      querySelector: node, querySelectorAll: () => [], addEventListener(type, fn) { docHandlers[type] = fn; } },
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(fn);
    }
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  const run = path => vm.runInContext(fs.readFileSync(root + path, 'utf8'), ctx, { filename: path });
  run('assets/js/curricula.js');
  run('assets/js/curricula-2026.js');
  run('assets/js/course-metadata.js');
  run('assets/js/academic-model.js');
  run('course-planner-beta/planner-gpa.js');
  function planner() {
    run('course-planner/data-2026-fall.js');
    run('course-planner/social-electives-2026-fall.js');
    run('course-planner-beta/app.js');
  }
  function graduation() {
    const html = fs.readFileSync(root + 'graduation/index.html', 'utf8');
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
    vm.runInContext(scripts.at(-1)[1], ctx, { filename: 'graduation/index.html' });
  }
  function emit(type, key) {
    for (const fn of listeners.get(type) || []) fn({ storageArea: localStorage, key });
  }
  function card(id) {
    return node('#courseList').innerHTML.match(new RegExp('<article\\s[^>]*data-course-id="' + id + '"[\\s\\S]*?<\\/article>'))?.[0] || '';
  }
  const clickCourse = id => docHandlers.click({ target: { closest: selector => selector === "[data-action='toggle']" ? { dataset: { courseId: id } } : null } });
  return { ctx, node, data, planner, graduation, emit, card, clickCourse, run };
}

const empty = setup();
empty.planner();
check('empty records render planner and social catalog', () => {
  assert.ok(empty.card('math145'));
  assert.ok(empty.card('art201-s1'));
  assert.ok(!empty.node('#courseList').innerHTML.includes('Son not:'));
  const social = empty.ctx.COURSE_PLANNER_DATA.courses.filter(c => c.socialElective);
  assert.equal(new Set(social.map(c => c.code)).size, 19);
  for (const c of social) assert.equal(empty.ctx.IYTE_COURSE_METADATA.get(c.code).category, 'social');
});

function keyFor(code) {
  let key;
  empty.ctx.CURRICULA['2021'].semesters.forEach((sem, s) => sem.courses.forEach((c, r) => {
    if (c.code === code) key = `s${s}r${r}`;
  }));
  assert.ok(key, code + ' exists in fixture');
  return key;
}
const math = keyFor('MATH 145');
const elective = keyFor('ELS I');
const gpa = { year: 2021, profile: 2, static: { [math]: { grade: 'DD' }, [elective]: { grade: 'CB' } },
  dynamic: { 0: [{ code: 'HUM 203', name: 'Test elective', grade: 'FF', credit: 3 }] } };
const tracker = { overrides: { 'd:0_0': 'completed' }, electives: { [elective]: { name: 'Drawing-Sketch' } }, extras: {} };
const env = setup({ iyte_grad_year: '2021', iyte_grad_profile: '2',
  iyte_gpa_2021_p2: JSON.stringify(gpa), iyte_grad_2021_p2: JSON.stringify(tracker),
  'iyte-course-planner:2026-fall': '["math145"]' });
env.planner();
check('passing grades show a tick and FF shows a cross despite manual completion', () => {
  assert.match(env.card('math145'), /Son not: DD/);
  assert.match(env.card('math145'), /✓ Tamamlandı/);
  const hum = env.ctx.COURSE_PLANNER_DATA.courses.find(c => c.code === 'HUM203');
  assert.match(env.card(hum.id), /Son not: FF/);
  assert.match(env.card(hum.id), /✗ Başarısız/);
  assert.ok(!env.card(hum.id).includes('✓ Tamamlandı'));
});
check('English elective names match all planner sections', () => {
  for (const id of ['art201-s1', 'art201-s2']) {
    assert.match(env.card(id), /Son not: CB/);
    assert.match(env.card(id), /✓ Tamamlandı/);
  }
});
tracker.electives[elective].name = '  Desen-Skeç  ';
env.data.set('iyte_grad_2021_p2', JSON.stringify(tracker));
env.emit('storage', 'iyte_grad_2021_p2');
check('Turkish elective name matches section suffixes', () => assert.match(env.card('art201-s2'), /Son not: CB/));

gpa.dynamic[2] = [{ id: 'retake', code: 'math145', grade: 'FF' }];
gpa.dynamic[7] = [{ id: 'future', code: 'MATH 145', grade: '' }];
env.data.set('iyte_gpa_2021_p2', JSON.stringify(gpa));
env.emit('storage', 'iyte_gpa_2021_p2');
check('latest graded repeat replaces passing grade without clearing selected courses', () => {
  assert.match(env.card('math145'), /Son not: FF/);
  assert.ok(!env.card('math145').includes('✓ Tamamlandı'));
  assert.equal(env.node('#statCourses').textContent, '1');
  assert.equal(env.data.get('iyte-course-planner:2026-fall'), '["math145"]');
});
gpa.dynamic[2][0].grade = 'BA';
tracker.overrides['d:retake'] = 'pending';
env.data.set('iyte_gpa_2021_p2', JSON.stringify(gpa));
env.data.set('iyte_grad_2021_p2', JSON.stringify(tracker));
env.emit('pageshow');
check('pageshow reloads GPA and manual pending takes precedence', () => {
  assert.match(env.card('math145'), /Son not: BA/);
  assert.ok(!env.card('math145').includes('✓ Tamamlandı'));
});
env.data.set('iyte_grad_profile', '1');
env.emit('storage', 'iyte_grad_profile');
check('profiles do not leak grades into one another', () => assert.ok(!env.card('math145').includes('Son not:')));

const invalid = setup({ iyte_grad_year: '2025', iyte_gpa_2025_p1: '{invalid', iyte_grad_2025_p1: '{invalid' });
invalid.planner();
check('malformed saved JSON keeps planner usable', () => assert.ok(invalid.card('math145')));

check('legacy selections are copied once into separate beta storage', () => {
  assert.equal(env.data.get('iyte-course-planner-beta:2026-fall'), '["math145"]');
  env.clickCourse('phys111');
  assert.deepEqual(JSON.parse(env.data.get('iyte-course-planner-beta:2026-fall')), ['math145', 'phys111']);
  assert.equal(env.data.get('iyte-course-planner:2026-fall'), '["math145"]');
});
check('clearing beta does not clear the original planner or GPA', () => {
  env.node('#clearButton').handlers.click();
  assert.equal(env.data.get('iyte-course-planner-beta:2026-fall'), '[]');
  assert.equal(env.data.get('iyte-course-planner:2026-fall'), '["math145"]');
  assert.equal(env.data.get('iyte_gpa_2021_p2'), JSON.stringify(gpa));
  assert.equal(env.data.get('iyte_grad_2021_p2'), JSON.stringify(tracker));
});
const reopened = setup(Object.fromEntries(env.data));
reopened.planner();
check('reopening a cleared beta does not import the old plan again', () => assert.equal(reopened.node('#statCourses').textContent, '0'));

check('beta year/profile controls do not change graduation preferences', () => {
  env.node('#academicYear').value = '2021';
  env.node('#academicProfile').value = '2';
  env.node('#academicProfile').handlers.change();
  assert.match(env.card('math145'), /Son not: BA/);
  assert.equal(env.data.get('iyte_grad_profile'), '1');
  assert.equal(JSON.parse(env.data.get('iyte-course-planner-beta-context:2026-fall')).profile, 2);
});
check('2026 curriculum is available in beta', () => assert.match(env.node('#academicYear').innerHTML, /value="2026"/));

const { createHash } = require('node:crypto');
check('stable planner files remain byte-for-byte unchanged', () => {
  const baseline = {
  "course-planner/app.js": "91e57816faf95a586720fe3902eb91f9683a7ffd7bcf3062213e34e5b04a0e05",
  "course-planner/index.html": "a17075d9e4cc05b1c21f0d66ed67a560a28bccf27f2da98e7d5489d0c9fccfb1",
  "course-planner/style.css": "8d51cf3a390f423b638a7e8816a600f0a6317972154edda5a1b1bf8e596bc03b"
};
  for (const [path, hash] of Object.entries(baseline)) {
    assert.equal(createHash('sha256').update(fs.readFileSync(root + path)).digest('hex'), hash);
  }
});

check('curriculum notes follow year changes without hiding courses', () => {
  const expected = {
    2019: ['math101', 'phys100', 'ohs101'],
    2020: ['math101', 'phys100', 'ohs101'],
    2021: ['math101', 'phys100', 'ohs101'],
    2022: ['math101', 'phys100', 'ohs101'],
    2023: ['phys100', 'ohs101'],
    2024: ['phys100', 'ohs101'],
    2025: ['ohs101'],
    2026: []
  };
  for (const [year, ids] of Object.entries(expected)) {
    env.node('#academicYear').value = year;
    env.node('#academicYear').handlers.change();
    assert.equal(env.node('#resultCount').textContent, '71 ders');
    const actual = env.ctx.COURSE_PLANNER_DATA.courses.filter(c => env.card(c.id).includes('badge curriculum-note')).map(c => c.id);
    assert.deepEqual([...actual].sort(), [...ids].sort());
    for (const id of ids) assert.match(env.card(id), new RegExp(year + ' müfredatında zorunlu değil'));
  }
});

check('FD and FF show failure, and a passing replacement removes the cross', () => {
  const state = {year:2021, static:{[math]:{grade:'FD'}}, dynamic:{}};
  const failures = setup({iyte_grad_year:'2021',iyte_gpa_2021_p1:JSON.stringify(state)});
  failures.planner();
  for (const grade of ['FD', 'FF']) {
    state.static[math].grade = grade;
    failures.data.set('iyte_gpa_2021_p1', JSON.stringify(state));
    failures.emit('storage','iyte_gpa_2021_p1');
    assert.match(failures.card('math145'), new RegExp('Son not: ' + grade));
    assert.match(failures.card('math145'), /class="course-card [^"]*failed/);
    assert.match(failures.card('math145'), /✗ Başarısız/);
    assert.ok(!failures.card('math145').includes('✓ Tamamlandı'));
  }
  state.static[math].grade = 'CC';
  failures.data.set('iyte_gpa_2021_p1',JSON.stringify(state));
  failures.emit('storage','iyte_gpa_2021_p1');
  assert.match(failures.card('math145'), /✓ Tamamlandı/);
  assert.ok(!failures.card('math145').includes('✗ Başarısız'));
});

check('undergraduate grades do not mark a different graduate course with the same name', () => {
  const quantum = keyFor('PHYS 321');
  const sameTitle = setup({iyte_grad_year:'2021',iyte_gpa_2021_p1:JSON.stringify({year:2021,static:{[quantum]:{grade:'FF'}},dynamic:{}})});
  sameTitle.planner();
  assert.match(sameTitle.card('phys321'), /✗ Başarısız/);
  assert.ok(!sameTitle.card('phys507').includes('Son not:'));
});

check('only the old homepage entry is removed; the return link remains', () => {
  const home = fs.readFileSync(root + 'index.html','utf8');
  const beta = fs.readFileSync(root + 'course-planner-beta/index.html','utf8');
  assert.ok(!home.includes('href="course-planner/"'));
  assert.ok(home.includes('href="course-planner-beta/"'));
  assert.ok(beta.includes('href="../course-planner/">Eski planlayıcıya dön'));
});
console.log(`${checks} integration scenarios passed (Node VM; browser layout not tested).`);

check('term, exclusions, retakes, duplicates and incomplete projections', () => {
  const A=empty.ctx.IYTE_ACADEMIC;
  const rows=[{key:'old',code:'X101',credit:3,grade:'FD'}, {key:'other',code:'Y101',credit:7,grade:'CB'}];
  const p=(code,credit,grade,include=true)=>({course:{code},credit,grade,include});
  let r=A.project([], [p('A',3,'AA'),p('B',1,'FF')]);
  assert.equal(r.termGpa,3);
  assert.equal(A.project([], [p('A',3,'AA'),p('B',1,'FF',false)]).termGpa,4);
  r=A.project(rows,[p('X101',3,'AA')]);
  assert.equal(r.projectedGpa,2.95); // (17.5 + 12) / 10; repeat replaces 1.5 points
  assert.equal(A.project([], [p('A',3,'AA'),p('A',3,'FF')]).termCredits,3);
  assert.equal(A.project([], [p('A',null,'AA')]).termGpa,null);
  assert.equal(A.project([], [p('A',3,'')]).projectedGpa,null);
  assert.equal(A.project([], [p('A',0,'AA')]).termGpa,null);
});
check('planner scenario controls preserve real records and survive refresh', () => {
  const e=setup({iyte_grad_year:'2021',iyte_gpa_2021_p1:JSON.stringify({year:2021,static:{[math]:{grade:'FD'}}})});
  e.planner(); e.clickCourse('math145');
  const real=e.data.get('iyte_gpa_2021_p1');
  const change=(field,value)=>e.node('#miniGpaRows').handlers.change({target:{dataset:{gpaId:'MATH145',field},value,checked:value}});
  change('grade','AA');
  assert.match(e.node('#miniGpaSummary').textContent,/Dönem 4.00/);
  assert.equal(e.data.get('iyte_gpa_2021_p1'),real);
  change('include',false);
  assert.match(e.node('#miniGpaSummary').textContent,/Dönem —/);
  const reload=setup(Object.fromEntries(e.data));reload.planner();
  assert.match(reload.node('#miniGpaRows').innerHTML,/gpa-excluded/);
  reload.node('#academicProfile').value='2';
  reload.node('#academicProfile').handlers.change();
  assert.ok(!reload.node('#miniGpaRows').innerHTML.includes('gpa-excluded'));
});
check('target suggestions do not downgrade grades and report unreachable goals', () => {
  const A=empty.ctx.IYTE_ACADEMIC;
  const rows=[{key:'one',credit:3,grade:'BA',include:true},{key:'two',credit:3,grade:'FF',include:false}];
  const snapshot=JSON.stringify(rows);
  let result=A.targetPlan(rows,4);
  assert.equal(result.maximum,2);assert.equal(result.gpa,2);
  assert.equal(result.suggestions[0].suggested,'AA');
  result=A.targetPlan(rows,1);
  assert.equal(result.suggestions[0].suggested,'BA');
  assert.equal(JSON.stringify(rows),snapshot);
});
check('needed filter excludes completed and noncurriculum courses', () => {
  const e=setup({iyte_grad_year:'2021',iyte_gpa_2021_p1:JSON.stringify({year:2021,static:{[math]:{grade:'AA'}}}),
    ['iyte-course-planner-beta-filter:2026-fall']:'needed'});
  e.planner();
  assert.equal(e.card('math145'),'');assert.equal(e.card('math101'),'');assert.equal(e.card('art201-s1'),'');
  assert.ok(e.node('#courseList').innerHTML.includes('Önkoşul tamamlanmamış: PHYS 222'));
});
check('social metadata keeps known ECTS and ignores unrelated courses',()=>{
  assert.equal(empty.ctx.IYTE_COURSE_METADATA.get('HUM 203').category,'social');
  assert.equal(empty.ctx.IYTE_COURSE_METADATA.get('PHYS 101'),null);
});
console.log(`All ${checks} integration checks passed.`);

check('graduation recognizes social codes and preserves manual overrides',()=>{
  const state={year:2021,dynamic:{0:[{id:'social',code:'ART201',name:'Drawing',credit:3,grade:'AA'}]}};
  const e=setup({iyte_grad_year:'2021',iyte_gpa_2021_p1:JSON.stringify(state)});
  e.graduation();
  assert.match(e.node('#extraCourses').innerHTML,/<option value="social" selected>/);
  assert.match(e.node('#ectsValue').textContent,/^3 \/ /);
  const manual=setup({iyte_grad_year:'2021',iyte_gpa_2021_p1:JSON.stringify(state),
    iyte_grad_2021_p1:JSON.stringify({extras:{'d:social':{category:'other',ects:5}}})});
  manual.graduation();
  assert.match(manual.node('#extraCourses').innerHTML,/<option value="other" selected>/);
  assert.match(manual.node('#ectsValue').textContent,/^5 \/ /);
});
check('target button never writes suggested grades to real inputs or storage',()=>{
  const e=setup({},'?year=2021');
  const grade={value:'FD'}, credit={value:'3'}, name={value:'Test course'};
  const row={dataset:{key:'s0r0'},children:[{},{}],classList:{remove(){}},querySelector(s){
    return {'.grade-select':grade,'.credit-input':credit,'.course-name-input':name,'.c-code':{textContent:'TEST 101'}}[s] || null;
  }};
  e.ctx.document.querySelectorAll=s=>['#semesterContainer tbody tr','tbody tr','tr[data-static="true"]'].includes(s)?[row]:[];
  e.run('assets/js/calculator.js');
  e.node('#targetCourses').handlers.change({target:{dataset:{targetKey:'s0r0'},checked:true}});
  e.node('#targetGPA').value='4';
  const before=JSON.stringify(Object.fromEntries(e.data));
  e.node('#autoFillBtn').handlers.click();
  assert.equal(grade.value,'FD');
  assert.equal(JSON.stringify(Object.fromEntries(e.data)),before);
  assert.match(e.node('#targetResult').innerHTML,/FD → <strong>AA/);
  e.node('#targetGPA').value='';e.node('#autoFillBtn').handlers.click();
  assert.match(e.node('#targetResult').textContent,/hedef gir/);
});
console.log(`All ${checks} checks passed.`);
