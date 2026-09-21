(() => {
  'use strict';
  // Social elective codes and ECTS from the site's 2026 fall catalog.
  const byCode = {
  "ART201": {
    "category": "social",
    "ects": 3
  },
  "ART210": {
    "category": "social",
    "ects": 3
  },
  "ART231": {
    "category": "social",
    "ects": 5
  },
  "ART232": {
    "category": "social",
    "ects": 3
  },
  "ART240": {
    "category": "social",
    "ects": 5
  },
  "HUM203": {
    "category": "social",
    "ects": 5
  },
  "HUM210": {
    "category": "social",
    "ects": 5
  },
  "HUM213": {
    "category": "social",
    "ects": 5
  },
  "HUM215": {
    "category": "social",
    "ects": 5
  },
  "HUM232": {
    "category": "social",
    "ects": 3
  },
  "HUM251": {
    "category": "social",
    "ects": 5
  },
  "HUM261": {
    "category": "social",
    "ects": 5
  },
  "MAN216": {
    "category": "social",
    "ects": 5
  },
  "MAN217": {
    "category": "social",
    "ects": 5
  },
  "MAN231": {
    "category": "social",
    "ects": 5
  },
  "SPRT201": {
    "category": "social",
    "ects": 3
  },
  "SPRT203": {
    "category": "social",
    "ects": 3
  },
  "SPRT204": {
    "category": "social",
    "ects": 3
  },
  "SPRT211": {
    "category": "social",
    "ects": 5
  }
};
  const normalizeCode = value => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g,'');
  window.IYTE_COURSE_METADATA = {byCode,normalizeCode,get:code=>byCode[normalizeCode(code)] || null};
})();
