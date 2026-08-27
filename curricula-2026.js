(() => {
  'use strict';

  if (!window.CURRICULA || !window.CURRICULA["2025"]) {
    console.error("2026 müfredatı oluşturulamadı: 2025 verisi bulunamadı.");
    return;
  }

  // 2026 planının 3–8. yarıyılları mevcut 2025 verisiyle aynıdır.
  // Bu nedenle 2025'i klonlayıp resmî 2026 planındaki OHS derslerini ekliyoruz.
  const curriculum2026 =
    typeof structuredClone === "function"
      ? structuredClone(window.CURRICULA["2025"])
      : JSON.parse(JSON.stringify(window.CURRICULA["2025"]));

  curriculum2026.year = 2026;

  const semester1 = curriculum2026.semesters[0];
  const semester2 = curriculum2026.semesters[1];

  const ohs101 = {
    code: "OHS 101",
    name: "İş Sağlığı ve Güvenliği I",
    credit: 1,
    editableName: false,
    editableCredit: false
  };

  const ohs102 = {
    code: "OHS 102",
    name: "İş Sağlığı ve Güvenliği I",
    credit: 1,
    editableName: false,
    editableCredit: false
  };

  function insertAfterCourse(semester, targetCode, newCourse) {
    const index = semester.courses.findIndex(course => course.code === targetCode);

    if (index === -1) {
      semester.courses.push(newCourse);
      return;
    }

    semester.courses.splice(index + 1, 0, newCourse);
  }

  insertAfterCourse(semester1, "ENG 101", ohs101);
  insertAfterCourse(semester2, "ENG 102", ohs102);

  window.CURRICULA["2026"] = curriculum2026;
})();
