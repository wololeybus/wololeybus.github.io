/*
 * İYTE Fizik Course Planner — 2026–2027 Güz
 *
 * Dönem güncellemek için esas olarak yalnızca bu dosyayı değiştir.
 * Saatler, kullanıcının yüklediği 2026–2027 Güz Fizik Lisans ve Lisansüstü
 * ders programlarından elle aktarılmıştır.
 */
window.COURSE_PLANNER_DATA = {
  termId: "2026-fall",
  termLabel: "2026–2027 Güz",
  department: "İYTE Fizik",
  sourceNote: "Fizik Bölümü 2026–2027 Güz lisans ve lisansüstü ders programları",
  courses: [
    // 1. sınıf
    {
      id: "math145",
      code: "MATH 145",
      name: "Calculus for Engineering and Science I",
      instructor: "Dr.Öğ.Üyesi Bekir Baytaş",
      level: "1",
      sessions: [
        { day: "monday", start: "08:45", end: "10:30" },
        { day: "tuesday", start: "08:45", end: "10:30" },
        { day: "thursday", start: "08:45", end: "10:30" }
      ]
    },
    {
      id: "math101",
      code: "MATH 101",
      name: "Pre Calculus",
      instructor: "Dr. Barış Çiçek",
      level: "1",
      sessions: [
        { day: "friday", start: "08:45", end: "10:30" }
      ]
    },
    {
      id: "phys111",
      code: "PHYS 111",
      name: "General Physics Lab I",
      instructor: "Doç.Dr. Günnur Güler",
      level: "1",
      sessions: [
        { day: "tuesday", start: "10:45", end: "12:30" }
      ]
    },
    {
      id: "chem141",
      code: "CHEM 141",
      name: "General Chemistry Lab I",
      instructor: "Dr. Emre Y. Göl",
      level: "1",
      sessions: [
        { day: "thursday", start: "10:45", end: "12:30" }
      ]
    },
    {
      id: "chem121",
      code: "CHEM 121",
      name: "General Chemistry I",
      instructor: "Dr. Emre Y. Göl",
      level: "1",
      sessions: [
        { day: "wednesday", start: "13:30", end: "16:15" }
      ]
    },
    {
      id: "eng101",
      code: "ENG 101",
      name: "Reading and Writing Skills I",
      instructor: "Öğ.Gör. Müge Çalışkan · Öğ.Gör. Paul Newton",
      level: "1",
      sessions: [
        { day: "friday", start: "13:30", end: "16:15" }
      ]
    },
    {
      id: "phys101",
      code: "PHYS 101",
      name: "General Physics I",
      instructor: "Birden fazla şube",
      level: "1",
      note: "Kaynak PDF'de PHYS 101 için (4+0)4 / AKTS 5 ve (2+2)3 / AKTS 6 yapıları ile farklı şubeler aynı zaman hücresinde listeleniyor. Planner ortak görünen saat bloğunu kullanır.",
      sessions: [
        { day: "tuesday", start: "15:30", end: "17:15" },
        { day: "thursday", start: "15:30", end: "17:15" }
      ]
    },
    {
      id: "ohs101",
      code: "OHS 101",
      name: "Occupational Health and Safety I",
      instructor: "—",
      level: "1",
      sessions: [
        { day: "wednesday", start: "16:30", end: "17:15" }
      ]
    },
    {
      id: "phys100",
      code: "PHYS 100",
      name: "Orientation to Physics Program and Research",
      instructor: "Prof.Dr. A.Devrim Güçlü",
      room: "Fizik Bölümü Seminer Salonu",
      level: "1",
      sessions: [
        { day: "friday", start: "16:30", end: "17:15" }
      ]
    },

    // 2. sınıf
    {
      id: "math265",
      code: "MATH 265",
      name: "Basic Linear Algebra",
      instructor: "Dr. Sinem Benli Göral",
      level: "2",
      sessions: [
        { day: "tuesday", start: "09:45", end: "12:30" }
      ]
    },
    {
      id: "phys203",
      code: "PHYS 203",
      name: "Classical Mechanics I",
      instructor: "Dr.Öğ.Üyesi Heesueng Cho",
      room: "Mat. Bölümü Z11",
      level: "2",
      sessions: [
        { day: "monday", start: "13:30", end: "15:15" },
        { day: "wednesday", start: "13:30", end: "15:15" }
      ]
    },
    {
      id: "math255",
      code: "MATH 255",
      name: "Differential Equations",
      instructor: "Prof. Nasser Aghazadeh · Dr. Barış Çiçek · Dr. Kemal Cem Yılmaz · Dr. Tina Beşeri Sevim · Dr. Aylin Bozacı Serdal",
      level: "2",
      sessions: [
        { day: "tuesday", start: "13:30", end: "15:15" },
        { day: "thursday", start: "13:30", end: "15:15" }
      ]
    },
    {
      id: "turk201",
      code: "TURK 201",
      name: "Turkish Language I",
      instructor: "Dr. Yasemin Gönülal",
      level: "2",
      sessions: [
        { day: "friday", start: "13:30", end: "15:15" }
      ]
    },
    {
      id: "phys201",
      code: "PHYS 201",
      name: "Waves and Optics",
      instructor: "Doç.Dr. Enver Tarhan",
      room: "Mat. Bölümü Z11",
      level: "2",
      sessions: [
        { day: "monday", start: "15:30", end: "17:15" },
        { day: "wednesday", start: "15:30", end: "17:15" }
      ]
    },
    {
      id: "hist201",
      code: "HIST 201",
      name: "Principles of Kemal Ataturk I",
      instructor: "Dr. Mustafa İlter",
      level: "2",
      sessions: [
        { day: "friday", start: "15:30", end: "17:15" }
      ]
    },

    // 3. sınıf
    {
      id: "phys315",
      code: "PHYS 315",
      name: "Numerical Methods in Physics",
      instructor: "Dr.Öğ.Üyesi Gürcan Aral",
      room: "Fizik Bölümü F1",
      level: "3",
      sessions: [
        { day: "tuesday", start: "08:45", end: "10:30" },
        { day: "thursday", start: "08:45", end: "10:30" }
      ]
    },
    {
      id: "phys305",
      code: "PHYS 305",
      name: "Experiments in Modern Physics",
      instructor: "Prof.Dr. Lütfi Özyüzer",
      level: "3",
      sessions: [
        { day: "friday", start: "08:45", end: "12:30" }
      ]
    },
    {
      id: "phys341",
      code: "PHYS 341",
      name: "Advanced Physics Internship",
      instructor: "Prof.Dr. Günnur Aygün",
      level: "3",
      technicalElective: true,
      note: "Kaynak çizelgede PHYS 341 Salı günü 08:45–12:30 ve 13:30–15:15 saat hücrelerinde yer alıyor.",
      sessions: [
        { day: "tuesday", start: "08:45", end: "12:30" },
        { day: "tuesday", start: "13:30", end: "15:15" }
      ]
    },
    {
      id: "phys301",
      code: "PHYS 301",
      name: "Electromagnetic Theory I",
      instructor: "Dr.Öğ.Üyesi Heesueng Cho",
      room: "Fizik Bölümü Seminer Salonu",
      level: "3",
      sessions: [
        { day: "monday", start: "10:45", end: "12:30" },
        { day: "wednesday", start: "10:45", end: "12:30" }
      ]
    },
    {
      id: "phys321",
      code: "PHYS 321",
      name: "Quantum Mechanics I",
      instructor: "Doç.Dr. Özgür Çakır",
      room: "Fizik Bölümü F1",
      level: "3",
      sessions: [
        { day: "tuesday", start: "13:30", end: "15:15" },
        { day: "thursday", start: "13:30", end: "15:15" }
      ]
    },
    {
      id: "phys342",
      code: "PHYS 342",
      name: "Physics Internship",
      instructor: "Prof.Dr. Günnur Aygün",
      level: "3",
      technicalElective: true,
      sessions: [
        { day: "tuesday", start: "16:30", end: "17:15" }
      ]
    },

    // 4. sınıf
    {
      id: "phys499",
      code: "PHYS 499",
      name: "Cooperative Education Course",
      instructor: "Prof.Dr. Günnur Aygün",
      level: "4",
      technicalElective: true,
      sessions: [
        { day: "monday", start: "08:45", end: "12:30" },
        { day: "monday", start: "13:30", end: "15:15" }
      ]
    },
    {
      id: "phys461",
      code: "PHYS 461",
      name: "Research Project I (1+4)",
      instructor: "—",
      level: "4",
      technicalElective: true,
      sessions: [
        { day: "friday", start: "08:45", end: "09:30" }
      ]
    },
    {
      id: "phys495",
      code: "PHYS 495",
      name: "Medical Physics",
      instructor: "Doç.Dr. Günnur Güler",
      room: "Fizik Bölümü F1",
      technicalElective: true,
      level: "4",
      sessions: [
        { day: "wednesday", start: "09:45", end: "12:30" }
      ]
    },
    {
      id: "phys431",
      code: "PHYS 431",
      name: "Condensed Matter Physics I",
      instructor: "Doç.Dr. Enver Tarhan",
      room: "Fizik Bölümü F1",
      level: "4",
      sessions: [
        { day: "tuesday", start: "10:45", end: "12:30" },
        { day: "thursday", start: "10:45", end: "11:30" }
      ]
    },
    {
      id: "phys415",
      code: "PHYS 415",
      name: "Computer Interface for Physics Experiments",
      instructor: "Prof.Dr. Lütfi Özyüzer",
      room: "Fizik Bölümü F2",
      level: "4",
      technicalElective: true,
      sessions: [
        { day: "thursday", start: "13:30", end: "16:15" }
      ]
    },
    {
      id: "phys498",
      code: "PHYS 498",
      name: "Supplementary Curricular Courses",
      instructor: "Doç.Dr. Günnur Güler",
      level: "4",
      technicalElective: true,
      sessions: [
        { day: "friday", start: "13:30", end: "16:15" }
      ]
    },
    {
      id: "phys480",
      code: "PHYS 480",
      name: "Int.to General Relativity & Cosmology",
      instructor: "Doç.Dr. Shahram Jalalzadeh",
      room: "Fizik Bölümü F1",
      level: "4",
      technicalElective: true,
      sessions: [
        { day: "monday", start: "14:30", end: "17:15" }
      ]
    },
    {
      id: "phys452",
      code: "PHYS 452",
      name: "Introduction to Particle Physics",
      instructor: "Prof.Dr. Recai Erdem",
      room: "Fizik Bölümü F1",
      level: "4",
      sessions: [
        { day: "tuesday", start: "15:30", end: "17:15" },
        { day: "thursday", start: "16:30", end: "17:15" }
      ]
    },

    // Lisansüstü — kullanıcı bu dersleri teknik seçmeli olarak alabiliyor.
    {
      id: "phys591",
      code: "PHYS 591",
      name: "Graduate Seminar I",
      instructor: "Prof.Dr. A.Devrim Güçlü",
      level: "graduate",
      technicalElective: true,
      sessions: [
        { day: "monday", start: "08:45", end: "10:30" }
      ]
    },
    {
      id: "phys592",
      code: "PHYS 592",
      name: "Graduate Seminar II",
      instructor: "Prof.Dr. A.Devrim Güçlü",
      level: "graduate",
      technicalElective: true,
      sessions: [
        { day: "tuesday", start: "08:45", end: "10:30" }
      ]
    },
    {
      id: "phys519",
      code: "PHYS 519",
      name: "Surface Analysis Techniques",
      instructor: "Prof.Dr. Orhan Öztürk",
      level: "graduate",
      technicalElective: true,
      sessions: [
        { day: "wednesday", start: "09:45", end: "12:30" }
      ]
    },
    {
      id: "phys522",
      code: "PHYS 522",
      name: "Advanced Experimental Methods",
      instructor: "Prof.Dr. Lütfi Özyüzer",
      level: "graduate",
      technicalElective: true,
      sessions: [
        { day: "wednesday", start: "09:45", end: "12:30" }
      ]
    },
    {
      id: "phys530",
      code: "PHYS 530",
      name: "Quantum Optics",
      instructor: "Doç.Dr. Özgür Çakır",
      level: "graduate",
      technicalElective: true,
      sessions: [
        { day: "friday", start: "09:45", end: "12:30" }
      ]
    },
    {
      id: "phys534",
      code: "PHYS 534",
      name: "Molecular Spectroscopy Techniques",
      instructor: "Doç.Dr. Günnur Güler",
      level: "graduate",
      technicalElective: true,
      sessions: [
        { day: "friday", start: "09:45", end: "12:30" }
      ]
    },
    {
      id: "phys506",
      code: "PHYS 506",
      name: "Electromagnetic Theory II",
      instructor: "Doç.Dr. Shahram Jalalzadeh",
      level: "graduate",
      technicalElective: true,
      sessions: [
        { day: "monday", start: "10:45", end: "12:30" },
        { day: "wednesday", start: "13:30", end: "15:15" }
      ]
    },
    {
      id: "phys503",
      code: "PHYS 503",
      name: "Analytical Mechanics",
      instructor: "Prof.Dr. Recai Erdem",
      level: "graduate",
      technicalElective: true,
      sessions: [
        { day: "tuesday", start: "10:45", end: "12:30" },
        { day: "thursday", start: "10:45", end: "12:30" }
      ]
    },
    {
      id: "phys507",
      code: "PHYS 507",
      name: "Quantum Mechanics I",
      instructor: "Prof.Dr. Nejat Bulut",
      level: "graduate",
      technicalElective: true,
      sessions: [
        { day: "tuesday", start: "13:30", end: "17:15" }
      ]
    },
    {
      id: "phys523",
      code: "PHYS 523",
      name: "Fundamentals of Solar Cells",
      instructor: "Prof.Dr. Günnur Aygün",
      level: "graduate",
      technicalElective: true,
      sessions: [
        { day: "thursday", start: "13:30", end: "17:15" }
      ]
    },
    {
      id: "phys542",
      code: "PHYS 542",
      name: "Quantum Theory of Many Particle Systems II",
      instructor: "Prof.Dr. Nejat Bulut",
      level: "graduate",
      technicalElective: true,
      sessions: [
        { day: "thursday", start: "13:30", end: "16:15" }
      ]
    },
    {
      id: "phys511",
      code: "PHYS 511",
      name: "Condensed Matter Physics I",
      instructor: "Prof.Dr. Nejat Bulut",
      level: "graduate",
      technicalElective: true,
      sessions: [
        { day: "friday", start: "13:30", end: "16:15" }
      ]
    },
    {
      id: "phys556",
      code: "PHYS 556",
      name: "Quantum Field Theory II",
      instructor: "Dr.Öğ.Üyesi Heesueng Cho",
      level: "graduate",
      technicalElective: true,
      sessions: [
        { day: "friday", start: "13:30", end: "16:15" }
      ]
    },
    {
      id: "phys513",
      code: "PHYS 513",
      name: "Physics of Semiconductors",
      instructor: "Prof.Dr. Günnur Aygün",
      level: "graduate",
      technicalElective: true,
      sessions: [
        { day: "wednesday", start: "14:30", end: "17:15" }
      ]
    },
    {
      id: "phys504",
      code: "PHYS 504",
      name: "Statistical Machanics",
      instructor: "Prof.Dr. A.Devrim Güçlü",
      level: "graduate",
      technicalElective: true,
      sessions: [
        { day: "monday", start: "15:30", end: "17:15" },
        { day: "wednesday", start: "15:30", end: "17:15" }
      ]
    }
  ]
};
