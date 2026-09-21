(() => {
  "use strict";

  const normalizeCode = value => String(value || "")
    .toLocaleUpperCase("tr-TR")
    .replace(/[^A-ZÇĞİÖŞÜ0-9]/g, "");

  const socialCodes = [
    "ART201", "ART210", "ART231", "ART232", "ART240",
    "HUM203", "HUM210", "HUM213", "HUM215", "HUM232",
    "HUM251", "HUM261", "MAN216", "MAN217", "MAN231",
    "SPRT201", "SPRT203", "SPRT204", "SPRT211"
  ];

  const byCode = Object.fromEntries(
    socialCodes.map(code => [normalizeCode(code), { category: "social" }])
  );

  window.IYTE_COURSE_METADATA = {
    byCode,
    normalizeCode,
    get(code) {
      return byCode[normalizeCode(code)] || null;
    }
  };
})();
