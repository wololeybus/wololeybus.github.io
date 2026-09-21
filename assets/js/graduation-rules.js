(() => {
  'use strict';
  const curricula = window.CURRICULA;
  const normalize = value => String(value).replace(/\s/g,'').toUpperCase();
  const oldPlanEcts = [
    [6, 2, 7, 5, 2, 5, 3],
    [6, 2, 4, 8, 5, 2, 3, 2],
    [6, 7, 6, 4, 3, 2, 2],
    [7, 2, 7, 7, 3, 2, 2],
    [8, 8, 6, 8],
    [8, 6, 8, 8],
    [9, 9, 6, 6],
    [9, 6, 6, 6, 3]
  ];

  const plan2021Ects = oldPlanEcts.map(semester => [...semester]);
  plan2021Ects[0] = [6, 2, 7, 5, 2, 3, 5];

  const newPlanEcts = [
    [6, 2, 7, 5, 2, 3, 2],
    [6, 2, 5, 8, 5, 2, 3, 2],
    [6, 7, 6, 4, 3, 2, 2],
    [6, 2, 6, 6, 3, 3, 2, 2],
    [7, 6, 6, 7, 4],
    [7, 6, 7, 5, 5],
    [6, 6, 6, 6, 6],
    [6, 6, 6, 6, 6]
  ];

  const plan2025Ects = [
    [2, 5, 2, 2, 7, 5, 2, 3],
    [5, 2, 5, 8, 5, 2, 2, 3],
    [6, 7, 6, 4, 3, 2, 2],
    [6, 2, 6, 6, 3, 3, 2, 2],
    [7, 6, 6, 7, 4],
    [7, 6, 7, 5, 5],
    [6, 6, 6, 6, 6],
    [6, 6, 6, 6, 6]
  ];

  const ectsByYear = {
    2021: plan2021Ects,
    2022: oldPlanEcts,
    2023: newPlanEcts,
    2024: newPlanEcts,
    2025: plan2025Ects
  };


  // Match by course code so omitted GCC and added OHS rows cannot shift ECTS.
  const byYear = {};
  for (const [year, semesters] of Object.entries(ectsByYear)) {
    byYear[year] = Object.fromEntries(curricula[year].semesters.flatMap((sem,si)=>
  sem.courses.map((course,ri)=>[normalize(course.code),semesters[si][ri]])));
  }
  // 2019 plan: https://physics.iyte.edu.tr/wp-content/uploads/sites/83/2023/10/2019_Lisans_E%C4%9FitimPlan%C4%B1-TR.pdf
  byYear[2019] = {...byYear[2021]};
  delete byYear[2019].GCC101;
  byYear[2020] = {...byYear[2019]};
  // 2026 plan: https://physics.iyte.edu.tr/2026-lisans-egitim-plani/
  byYear[2026] = {...byYear[2025],OHS101:1,OHS102:1};
  const requirements = {
    2019:{ects:240,social:3,technical:5},2020:{ects:240,social:3,technical:5},
    2021:{ects:242,social:3,technical:5},2022:{ects:242,social:3,technical:5},
    2023:{ects:240,social:3,technical:9},2024:{ects:240,social:3,technical:9},
    2025:{ects:240,social:3,technical:9},2026:{ects:242,social:3,technical:9}
  };
  function source(year) {
    return Number(year)<=2020 ? 'https://physics.iyte.edu.tr/wp-content/uploads/sites/83/2023/10/2019_Lisans_E%C4%9FitimPlan%C4%B1-TR.pdf'
  : `https://physics.iyte.edu.tr/${Number(year)===2024 ? 2023 : year}-lisans-egitim-plani/`;
  }
  window.IYTE_GRADUATION = {requirements,source,ectsFor:(year,code)=>byYear[year]?.[normalize(code)]};
})();
