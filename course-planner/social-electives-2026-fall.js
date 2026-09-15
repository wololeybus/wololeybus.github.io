/* 2026–2027 Güz sosyal seçmeli dersleri.
 * data-2026-fall.js sonrasında, app.js öncesinde yükleyin.
 * Kaynak: 2026-2027-Güz-Ders-Programı-Seçmeli-Dersler.xlsx
 * Perşeme ve 16-15 yazımları normalize edilmiştir.
 */
(() => {
  "use strict";
  const data = window.COURSE_PLANNER_DATA;
  if (!data || data.termId !== "2026-fall" || !Array.isArray(data.courses)) {
    throw new Error("Önce 2026-fall ders verisi yüklenmelidir.");
  }
  const courses = [
  {
    "id": "art201-s1",
    "code": "ART201",
    "name": "Desen-Skeç — Şube 1",
    "nameEn": "Drawing-Sketch",
    "instructor": "Öğr. Gör. Dr. N. Coşgu ATEŞ",
    "level": "social",
    "socialElective": true,
    "technicalElective": false,
    "section": "1",
    "credit": 3,
    "ects": 3,
    "capacity": 15,
    "room": "Mimarlık B Blok Atölye",
    "note": "Sosyal seçmeli · Şube 1 · Kredi: 3 · AKTS: 3 · Kontenjan: 15. Final tarihi: 08.01.2027.",
    "finalDate": "08.01.2027",
    "sessions": [
      {
        "day": "friday",
        "start": "09:45",
        "end": "12:30"
      }
    ]
  },
  {
    "id": "art201-s2",
    "code": "ART201",
    "name": "Desen-Skeç — Şube 2",
    "nameEn": "Drawing-Sketch",
    "instructor": "Öğr. Gör. Dr. N. Coşgu ATEŞ",
    "level": "social",
    "socialElective": true,
    "technicalElective": false,
    "section": "2",
    "credit": 3,
    "ects": 3,
    "capacity": 15,
    "room": "Mimarlık B Blok Atölye",
    "note": "Sosyal seçmeli · Şube 2 · Kredi: 3 · AKTS: 3 · Kontenjan: 15. Final tarihi: 08.01.2027.",
    "finalDate": "08.01.2027",
    "sessions": [
      {
        "day": "friday",
        "start": "13:30",
        "end": "16:15"
      }
    ]
  },
  {
    "id": "art210-s1",
    "code": "ART210",
    "name": "Batı Müziği ve Estetik — Şube 1",
    "nameEn": "Western Music and Aesthetics",
    "instructor": "Öğr. Gör. Dr. Mahmut SÖZER",
    "level": "social",
    "socialElective": true,
    "technicalElective": false,
    "section": "1",
    "credit": 3,
    "ects": 3,
    "capacity": 36,
    "room": "GKDB Derslik-3",
    "note": "Sosyal seçmeli · Şube 1 · Kredi: 3 · AKTS: 3 · Kontenjan: 36.",
    "finalDate": "",
    "sessions": [
      {
        "day": "monday",
        "start": "13:30",
        "end": "16:15"
      }
    ]
  },
  {
    "id": "art231-s1",
    "code": "ART231",
    "name": "Türk Halk Danslarına Giriş — Şube 1",
    "nameEn": "Introduction to Turkish Folk Dances",
    "instructor": "Öğr. Gör. Nüket DALCI",
    "level": "social",
    "socialElective": true,
    "technicalElective": false,
    "section": "1",
    "credit": 3,
    "ects": 5,
    "capacity": 40,
    "room": "Derslik-1 (Seminer Salonu)",
    "note": "Sosyal seçmeli · Şube 1 · Kredi: 3 · AKTS: 5 · Kontenjan: 40. Final tarihi: 11.01.2027.",
    "finalDate": "11.01.2027",
    "sessions": [
      {
        "day": "monday",
        "start": "09:45",
        "end": "12:30"
      }
    ]
  },
  {
    "id": "art231-s2",
    "code": "ART231",
    "name": "Türk Halk Danslarına Giriş — Şube 2",
    "nameEn": "Introduction to Turkish Folk Dances",
    "instructor": "Öğr. Gör. Nüket DALCI",
    "level": "social",
    "socialElective": true,
    "technicalElective": false,
    "section": "2",
    "credit": 3,
    "ects": 5,
    "capacity": 40,
    "room": "Derslik-1 (Seminer Salonu)",
    "note": "Sosyal seçmeli · Şube 2 · Kredi: 3 · AKTS: 5 · Kontenjan: 40. Final tarihi: 11.01.2027.",
    "finalDate": "11.01.2027",
    "sessions": [
      {
        "day": "monday",
        "start": "13:30",
        "end": "16:15"
      }
    ]
  },
  {
    "id": "art232-s1",
    "code": "ART232",
    "name": "Uygulamalı Türk Halk Dansları — Şube 1",
    "nameEn": "Performing Turkish Folk Dances",
    "instructor": "Öğr. Gör. Nüket DALCI",
    "level": "social",
    "socialElective": true,
    "technicalElective": false,
    "section": "1",
    "credit": 3,
    "ects": 3,
    "capacity": 40,
    "room": "Spor Salonu - Genel Salon",
    "note": "Sosyal seçmeli · Şube 1 · Kredi: 3 · AKTS: 3 · Kontenjan: 40. Final tarihi: 06.01.2027.",
    "finalDate": "06.01.2027",
    "sessions": [
      {
        "day": "wednesday",
        "start": "09:45",
        "end": "12:30"
      }
    ]
  },
  {
    "id": "art240-s1",
    "code": "ART240",
    "name": "Resim Sanatı, Kavramlar ve Kuramlar — Şube 1",
    "nameEn": "Painting Art, Consepts and Theories",
    "instructor": "Öğr. Gör. Dr. N. Coşgu ATEŞ",
    "level": "social",
    "socialElective": true,
    "technicalElective": false,
    "section": "1",
    "credit": 3,
    "ects": 5,
    "capacity": 40,
    "room": "Derslik-1 (Seminer Salonu)",
    "note": "Sosyal seçmeli · Şube 1 · Kredi: 3 · AKTS: 5 · Kontenjan: 40. Final tarihi: 07.01.2027.",
    "finalDate": "07.01.2027",
    "sessions": [
      {
        "day": "thursday",
        "start": "09:45",
        "end": "12:30"
      }
    ]
  },
  {
    "id": "art240-s2",
    "code": "ART240",
    "name": "Resim Sanatı, Kavramlar ve Kuramlar — Şube 2",
    "nameEn": "Painting Art, Consepts and Theories",
    "instructor": "Öğr. Gör. Dr. N. Coşgu ATEŞ",
    "level": "social",
    "socialElective": true,
    "technicalElective": false,
    "section": "2",
    "credit": 3,
    "ects": 5,
    "capacity": 40,
    "room": "Derslik-1 (Seminer Salonu)",
    "note": "Sosyal seçmeli · Şube 2 · Kredi: 3 · AKTS: 5 · Kontenjan: 40. Final tarihi: 07.01.2027.",
    "finalDate": "07.01.2027",
    "sessions": [
      {
        "day": "thursday",
        "start": "13:30",
        "end": "16:15"
      }
    ]
  },
  {
    "id": "hum203-s1",
    "code": "HUM203",
    "name": "Sosyal Antropolojiye Giriş — Şube 1",
    "nameEn": "Introduction to Social Anthropology",
    "instructor": "Doç. Dr. Ozan UŞTUK",
    "level": "social",
    "socialElective": true,
    "technicalElective": false,
    "section": "1",
    "credit": 3,
    "ects": 5,
    "capacity": 40,
    "room": "GKDB Derslik-3",
    "note": "Sosyal seçmeli · Şube 1 · Kredi: 3 · AKTS: 5 · Kontenjan: 40. Final tarihi: 11.01.2027.",
    "finalDate": "11.01.2027",
    "sessions": [
      {
        "day": "monday",
        "start": "09:45",
        "end": "12:30"
      }
    ]
  },
  {
    "id": "hum203-s2",
    "code": "HUM203",
    "name": "Sosyal Antropolojiye Giriş — Şube 2",
    "nameEn": "Introduction to Social Anthropology",
    "instructor": "Doç. Dr. Ozan UŞTUK",
    "level": "social",
    "socialElective": true,
    "technicalElective": false,
    "section": "2",
    "credit": 3,
    "ects": 5,
    "capacity": 40,
    "room": "GKDB Derslik-2",
    "note": "Sosyal seçmeli · Şube 2 · Kredi: 3 · AKTS: 5 · Kontenjan: 40. Final tarihi: 11.01.2027.",
    "finalDate": "11.01.2027",
    "sessions": [
      {
        "day": "monday",
        "start": "13:30",
        "end": "16:15"
      }
    ]
  },
  {
    "id": "hum210-s1",
    "code": "HUM210",
    "name": "Türkçe Yazılı Anlatımın Geliştirilmesi — Şube 1",
    "nameEn": "Development of Written Expressions in Turkish",
    "instructor": "Öğr. Gör. Dr. Doğan EVECEN",
    "level": "social",
    "socialElective": true,
    "technicalElective": false,
    "section": "1",
    "credit": 3,
    "ects": 5,
    "capacity": 35,
    "room": "GKDB Derslik-3",
    "note": "Sosyal seçmeli · Şube 1 · Kredi: 3 · AKTS: 5 · Kontenjan: 35. Final tarihi: 14.01.2027.",
    "finalDate": "14.01.2027",
    "sessions": [
      {
        "day": "thursday",
        "start": "13:30",
        "end": "16:15"
      }
    ]
  },
  {
    "id": "hum213-s1",
    "code": "HUM213",
    "name": "Modern Dünya Tarihi — Şube 1",
    "nameEn": "Modern World History",
    "instructor": "Öğr. Gör. Dr. Mustafa İLTER",
    "level": "social",
    "socialElective": true,
    "technicalElective": false,
    "section": "1",
    "credit": 3,
    "ects": 5,
    "capacity": 35,
    "room": "GKDB Derslik-2",
    "note": "Sosyal seçmeli · Şube 1 · Kredi: 3 · AKTS: 5 · Kontenjan: 35. Final tarihi: 07.01.2027.",
    "finalDate": "07.01.2027",
    "sessions": [
      {
        "day": "thursday",
        "start": "09:45",
        "end": "12:30"
      }
    ]
  },
  {
    "id": "hum213-s2",
    "code": "HUM213",
    "name": "Modern Dünya Tarihi — Şube 2",
    "nameEn": "Modern World History",
    "instructor": "Öğr. Gör. Dr. Mustafa İLTER",
    "level": "social",
    "socialElective": true,
    "technicalElective": false,
    "section": "2",
    "credit": 3,
    "ects": 5,
    "capacity": 35,
    "room": "GKDB Derslik-3",
    "note": "Sosyal seçmeli · Şube 2 · Kredi: 3 · AKTS: 5 · Kontenjan: 35. Final tarihi: 08.01.2027.",
    "finalDate": "08.01.2027",
    "sessions": [
      {
        "day": "friday",
        "start": "09:45",
        "end": "12:30"
      }
    ]
  },
  {
    "id": "hum215-s1",
    "code": "HUM215",
    "name": "Mitoloji — Şube 1",
    "nameEn": "Mythology",
    "instructor": "Öğr. Gör. Dr. Emine YÜKSEL",
    "level": "social",
    "socialElective": true,
    "technicalElective": false,
    "section": "1",
    "credit": 3,
    "ects": 5,
    "capacity": 40,
    "room": "Derslik-1 (Seminer Salonu)",
    "note": "Sosyal seçmeli · Şube 1 · Kredi: 3 · AKTS: 5 · Kontenjan: 40.",
    "finalDate": "",
    "sessions": [
      {
        "day": "friday",
        "start": "09:45",
        "end": "12:30"
      }
    ]
  },
  {
    "id": "hum215-s2",
    "code": "HUM215",
    "name": "Mitoloji — Şube 2",
    "nameEn": "Mythology",
    "instructor": "Öğr. Gör. Dr. Emine YÜKSEL",
    "level": "social",
    "socialElective": true,
    "technicalElective": false,
    "section": "2",
    "credit": 3,
    "ects": 5,
    "capacity": 40,
    "room": "GKDB Derslik-3",
    "note": "Sosyal seçmeli · Şube 2 · Kredi: 3 · AKTS: 5 · Kontenjan: 40.",
    "finalDate": "",
    "sessions": [
      {
        "day": "friday",
        "start": "13:30",
        "end": "16:15"
      }
    ]
  },
  {
    "id": "hum232-s1",
    "code": "HUM232",
    "name": "Görsel İletişim — Şube 1",
    "nameEn": "Visual Communication",
    "instructor": "Doç. Dr. Dikmen YAKALI",
    "level": "social",
    "socialElective": true,
    "technicalElective": false,
    "section": "1",
    "credit": 3,
    "ects": 3,
    "capacity": 40,
    "room": "GKDB Derslik-2",
    "note": "Sosyal seçmeli · Şube 1 · Kredi: 3 · AKTS: 3 · Kontenjan: 40. Final tarihi: 07.01.2027.",
    "finalDate": "07.01.2027",
    "sessions": [
      {
        "day": "thursday",
        "start": "13:30",
        "end": "16:15"
      }
    ]
  },
  {
    "id": "hum251-s1",
    "code": "HUM251",
    "name": "Osmanlı Türkçesi I — Şube 1",
    "nameEn": "Ottoman Turkish I",
    "instructor": "Öğr. Gör. Dr. Yasemin ÖZCAN GÖNÜLAL",
    "level": "social",
    "socialElective": true,
    "technicalElective": false,
    "section": "1",
    "credit": 3,
    "ects": 5,
    "capacity": 40,
    "room": "Derslik-1 (Seminer Salonu)",
    "note": "Sosyal seçmeli · Şube 1 · Kredi: 3 · AKTS: 5 · Kontenjan: 40. Final tarihi: 13.01.2027.",
    "finalDate": "13.01.2027",
    "sessions": [
      {
        "day": "wednesday",
        "start": "09:45",
        "end": "12:30"
      }
    ]
  },
  {
    "id": "hum261-s1",
    "code": "HUM261",
    "name": "Küresel Sürdürülebilirlik — Şube 1",
    "nameEn": "Global Sustainability",
    "instructor": "Doç. Dr. Hatice Eser ÖKTEN KIRAN",
    "level": "social",
    "socialElective": true,
    "technicalElective": false,
    "section": "1",
    "credit": 3,
    "ects": 5,
    "capacity": 40,
    "room": "Derslik-1 (Seminer Salonu)",
    "note": "Sosyal seçmeli · Şube 1 · Kredi: 3 · AKTS: 5 · Kontenjan: 40.",
    "finalDate": "",
    "sessions": [
      {
        "day": "thursday",
        "start": "09:45",
        "end": "12:30"
      }
    ]
  },
  {
    "id": "man216-s1",
    "code": "MAN216",
    "name": "Pazarlamaya Giriş — Şube 1",
    "nameEn": "Introduction to Marketing",
    "instructor": "Öğr. Gör. Ebru ASLAN ÇALLIOĞLU",
    "level": "social",
    "socialElective": true,
    "technicalElective": false,
    "section": "1",
    "credit": 3,
    "ects": 5,
    "capacity": 40,
    "room": "Derslik-1 (Seminer Salonu)",
    "note": "Sosyal seçmeli · Şube 1 · Kredi: 3 · AKTS: 5 · Kontenjan: 40.",
    "finalDate": "",
    "sessions": [
      {
        "day": "tuesday",
        "start": "09:45",
        "end": "12:30"
      }
    ]
  },
  {
    "id": "man216-s2",
    "code": "MAN216",
    "name": "Pazarlamaya Giriş — Şube 2",
    "nameEn": "Introduction to Marketing",
    "instructor": "Öğr. Gör. Ebru ASLAN ÇALLIOĞLU",
    "level": "social",
    "socialElective": true,
    "technicalElective": false,
    "section": "2",
    "credit": 3,
    "ects": 5,
    "capacity": 40,
    "room": "GKDB Derslik-3",
    "note": "Sosyal seçmeli · Şube 2 · Kredi: 3 · AKTS: 5 · Kontenjan: 40.",
    "finalDate": "",
    "sessions": [
      {
        "day": "tuesday",
        "start": "13:30",
        "end": "16:15"
      }
    ]
  },
  {
    "id": "man217-s1",
    "code": "MAN217",
    "name": "Yönetimin Temelleri ve Liderlik — Şube 1",
    "nameEn": "Fundamentals of Management and Leadership",
    "instructor": "Öğr. Gör. Ebru ASLAN ÇALLIOĞLU",
    "level": "social",
    "socialElective": true,
    "technicalElective": false,
    "section": "1",
    "credit": 3,
    "ects": 5,
    "capacity": 40,
    "room": "Derslik-1 (Seminer Salonu)",
    "note": "Sosyal seçmeli · Şube 1 · Kredi: 3 · AKTS: 5 · Kontenjan: 40. Kaynak programda saat 13:30–14:15 olarak belirtilmiştir; (3+0)3 kredi bilgisiyle birlikte kontrol edilmelidir.",
    "finalDate": "",
    "sessions": [
      {
        "day": "wednesday",
        "start": "13:30",
        "end": "14:15"
      }
    ]
  },
  {
    "id": "man231-s1",
    "code": "MAN231",
    "name": "Marka, Patent ve Fikri Haklar — Şube 1",
    "nameEn": "Patent, Trademark Intellectual Industrial Property Law",
    "instructor": "Av. Füsun SİNGİ",
    "level": "social",
    "socialElective": true,
    "technicalElective": false,
    "section": "1",
    "credit": 3,
    "ects": 5,
    "capacity": 40,
    "room": "Derslik-1 (Seminer Salonu)",
    "note": "Sosyal seçmeli · Şube 1 · Kredi: 3 · AKTS: 5 · Kontenjan: 40.",
    "finalDate": "",
    "sessions": [
      {
        "day": "tuesday",
        "start": "13:30",
        "end": "16:15"
      }
    ]
  },
  {
    "id": "sprt201-s1",
    "code": "SPRT201",
    "name": "Tenis I — Şube 1",
    "nameEn": "Tennis I",
    "instructor": "Öğr. Gör. Hakim ÖZGÜR",
    "level": "social",
    "socialElective": true,
    "technicalElective": false,
    "section": "1",
    "credit": 3,
    "ects": 3,
    "capacity": 14,
    "room": "Spor Salonu",
    "note": "Sosyal seçmeli · Şube 1 · Kredi: 3 · AKTS: 3 · Kontenjan: 14. Final tarihi: 13.01.2027.",
    "finalDate": "13.01.2027",
    "sessions": [
      {
        "day": "wednesday",
        "start": "09:45",
        "end": "12:30"
      }
    ]
  },
  {
    "id": "sprt203-s1",
    "code": "SPRT203",
    "name": "Badminton — Şube 1",
    "nameEn": "Badmington",
    "instructor": "Öğr. Gör. Hakim ÖZGÜR",
    "level": "social",
    "socialElective": true,
    "technicalElective": false,
    "section": "1",
    "credit": 3,
    "ects": 3,
    "capacity": 14,
    "room": "Spor Salonu",
    "note": "Sosyal seçmeli · Şube 1 · Kredi: 3 · AKTS: 3 · Kontenjan: 14. Final tarihi: 11.01.2027.",
    "finalDate": "11.01.2027",
    "sessions": [
      {
        "day": "monday",
        "start": "13:30",
        "end": "16:15"
      }
    ]
  },
  {
    "id": "sprt204-s1",
    "code": "SPRT204",
    "name": "Basketbol — Şube 1",
    "nameEn": "Basketball",
    "instructor": "Öğr. Gör. Hakim ÖZGÜR",
    "level": "social",
    "socialElective": true,
    "technicalElective": false,
    "section": "1",
    "credit": 3,
    "ects": 3,
    "capacity": 25,
    "room": "Spor Salonu",
    "note": "Sosyal seçmeli · Şube 1 · Kredi: 3 · AKTS: 3 · Kontenjan: 25. Final tarihi: 12.01.2027.",
    "finalDate": "12.01.2027",
    "sessions": [
      {
        "day": "tuesday",
        "start": "13:30",
        "end": "16:15"
      }
    ]
  },
  {
    "id": "sprt204-s2",
    "code": "SPRT204",
    "name": "Basketbol — Şube 2",
    "nameEn": "Basketball",
    "instructor": "Öğr. Gör. Hakim ÖZGÜR",
    "level": "social",
    "socialElective": true,
    "technicalElective": false,
    "section": "2",
    "credit": 3,
    "ects": 3,
    "capacity": 25,
    "room": "Spor Salonu",
    "note": "Sosyal seçmeli · Şube 2 · Kredi: 3 · AKTS: 3 · Kontenjan: 25. Final tarihi: 14.01.2027.",
    "finalDate": "14.01.2027",
    "sessions": [
      {
        "day": "thursday",
        "start": "13:30",
        "end": "16:15"
      }
    ]
  },
  {
    "id": "sprt211-s1",
    "code": "SPRT211",
    "name": "Su Üstü Sörf Sporları — Şube 1",
    "nameEn": "Surf Sports on the Water",
    "instructor": "Öğr. Gör. Salih RENDE",
    "level": "social",
    "socialElective": true,
    "technicalElective": false,
    "section": "1",
    "credit": 3,
    "ects": 5,
    "capacity": 40,
    "room": "Derslik-1 (Seminer Salonu)",
    "note": "Sosyal seçmeli · Şube 1 · Kredi: 3 · AKTS: 5 · Kontenjan: 40. Final tarihi: 15.01.2027.",
    "finalDate": "15.01.2027",
    "sessions": [
      {
        "day": "friday",
        "start": "13:30",
        "end": "16:15"
      }
    ]
  }
];
  const ids = new Set(courses.map(course => course.id));
  data.courses = data.courses.filter(course => !ids.has(course.id)).concat(courses);
})();