(() => {
  "use strict";

  const DATA = window.COURSE_PLANNER_DATA;

  if (!DATA || !Array.isArray(DATA.courses)) {
    document.body.innerHTML =
      "<p style='padding:2rem;font-family:sans-serif'>Ders verisi yüklenemedi.</p>";
    return;
  }

  const DAYS = [
    { id: "monday", label: "Pazartesi", short: "Pzt" },
    { id: "tuesday", label: "Salı", short: "Sal" },
    { id: "wednesday", label: "Çarşamba", short: "Çar" },
    { id: "thursday", label: "Perşembe", short: "Per" },
    { id: "friday", label: "Cuma", short: "Cum" }
  ];

  const SLOTS = [
    { start: "08:45", end: "09:30" },
    { start: "09:45", end: "10:30" },
    { start: "10:45", end: "11:30" },
    { start: "11:45", end: "12:30" },
    { start: "13:30", end: "14:15" },
    { start: "14:30", end: "15:15" },
    { start: "15:30", end: "16:15" },
    { start: "16:30", end: "17:15" }
  ];

  const STORAGE_KEY =
    `iyte-course-planner-beta:${DATA.termId}`;

  const LEGACY_STORAGE_KEY =
    `iyte-course-planner:${DATA.termId}`;

  const FILTER_KEY =
    `iyte-course-planner-beta-filter:${DATA.termId}`;

  const CONTEXT_KEY =
    `iyte-course-planner-beta-context:${DATA.termId}`;

  const SLOT_HEIGHT = 74;

  /*
   * Aynı sınıftaki dersler farklı renkler alır.
   */
  const COURSE_HUES = [
    210,
    145,
    28,
    275,
    345,
    185,
    55,
    230,
    10,
    310,
    110,
    255,
    165,
    35,
    195
  ];

  /*
   * Sınıf yükseldikçe renkler koyulaşır.
   */
  const LEVEL_LIGHTNESS = {
    "1": 68,
    "2": 60,
    "3": 52,
    "4": 44,
    "graduate": 36
  };

  function courseColor(course) {
    /*
     * data-2026-fall.js içinde önceden
     * renk oluşturulduysa onu kullan.
     */
    if (
      course.color?.background &&
      course.color?.border &&
      course.color?.accent
    ) {
      return {
        ...course.color,

        hue:
          course.color.hue ??
          210,

        lightness:
          LEVEL_LIGHTNESS[
            String(course.level)
          ] ?? 52,

        canvasBackground:
          course.color.canvasBackground ||
          course.color.background,

        canvasAccent:
          course.color.canvasAccent ||
          course.color.accent
      };
    }

    /*
     * Veri dosyasında renk yoksa
     * burada otomatik üret.
     */
    const sameLevelCourses =
      DATA.courses.filter(
        item =>
          item.level ===
          course.level
      );

    const index =
      Math.max(
        0,
        sameLevelCourses.findIndex(
          item =>
            item.id ===
            course.id
        )
      );

    const hue =
      COURSE_HUES[
        index %
        COURSE_HUES.length
      ];

    const lightness =
      LEVEL_LIGHTNESS[
        String(course.level)
      ] ?? 52;

    return {
      hue,
      lightness,

      background:
        `hsla(${hue}, 70%, ${lightness}%, 0.22)`,

      border:
        `hsl(${hue}, 74%, ${Math.min(lightness + 10, 80)}%)`,

      accent:
        `hsl(${hue}, 78%, ${Math.min(lightness + 15, 84)}%)`,

      canvasBackground:
        `hsla(${hue}, 70%, ${lightness}%, 0.20)`,

      canvasAccent:
        `hsl(${hue}, 72%, ${Math.min(lightness + 8, 78)}%)`
    };
  }

  const byId =
    new Map(
      DATA.courses.map(
        course => [
          course.id,
          course
        ]
      )
    );

  let selected =
    new Set(
      loadSelected()
    );

  let activeFilter =
    localStorage.getItem(
      FILTER_KEY
    ) || "all";

  let searchQuery = "";

  let toastTimer = null;

  const PASSING_GRADES =
    new Set(["AA", "BA", "BB", "CB", "CC", "DC", "DD"]);

  function normalizeCourseCode(value) {
    return window.IYTE_COURSE_METADATA?.normalizeCode(value) ||
      String(value || "")
        .toLocaleUpperCase("tr-TR")
        .replace(/[^A-ZÇĞİÖŞÜ0-9]/g, "");
  }

  function normalizeCourseName(value) {
    return normalize(value)
      .replace(/\s*[—–-]\s*sube\s*\d+\s*$/i, "")
      .trim()
      .replace(/\s+/g, " ");
  }

  function loadAcademicContext() {
    const curricula = window.CURRICULA || {};
    const years = Object.keys(curricula).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(CONTEXT_KEY)); } catch {}
    const savedYear = Number(saved?.year ?? localStorage.getItem("iyte_grad_year"));
    const year = years.includes(savedYear) ? savedYear : years.at(-1);
    const savedProfile = Number(saved?.profile ?? localStorage.getItem("iyte_grad_profile"));
    const profile = [1, 2, 3].includes(savedProfile) ? savedProfile : 1;
    return { year, profile };
  }

  let academicContext = loadAcademicContext();

  function loadAcademicStatus() {
    const { year, profile } = academicContext;
    const curriculum = window.CURRICULA?.[String(year)];
    if (!curriculum) return new Map();

    let gpa = null;
    let tracker = null;
    try { gpa = JSON.parse(localStorage.getItem(`iyte_gpa_${year}_p${profile}`)); } catch {}
    try { tracker = JSON.parse(localStorage.getItem(`iyte_grad_${year}_p${profile}`)); } catch {}
    gpa = gpa && Number(gpa.year) === year ? gpa : null;
    tracker = tracker && typeof tracker === "object" ? tracker : {};

    const statuses = new Map();
    const addStatus = (code, name, grade, key) => {
      const manual = tracker.overrides?.[key] || "auto";
      if (!grade && manual === "auto") return;
      const completed = manual === "completed" ||
        (manual !== "pending" && PASSING_GRADES.has(grade));
      const status = { code, name, grade: grade || "", completed, manual, year, profile };
      const normalizedCode = normalizeCourseCode(code);
      if (normalizedCode) statuses.set(normalizedCode, status);
      const normalizedName = normalizeCourseName(name);
      if (normalizedName) statuses.set(`name:${normalizedName}`, status);
    };

    curriculum.semesters.forEach((semester, semesterIndex) => {
      semester.courses.forEach((course, rowIndex) => {
        const key = `s${semesterIndex}r${rowIndex}`;
        const saved = gpa?.static?.[key] || {};
        const elective = tracker.electives?.[key] || {};
        addStatus(course.code, elective.name ?? saved.name ?? course.name, saved.grade, key);
      });

      (gpa?.dynamic?.[semesterIndex] || []).forEach((course, index) => {
        const key = `d:${course.id || `${semesterIndex}_${index}`}`;
        addStatus(course.code, course.name, course.grade, key);
      });
    });

    return statuses;
  }

  let academicStatus = loadAcademicStatus();

  function statusFor(course) {
    return academicStatus.get(normalizeCourseCode(course.code)) ||
      academicStatus.get(`name:${normalizeCourseName(course.name)}`) ||
      (course.nameEn && academicStatus.get(`name:${normalizeCourseName(course.nameEn)}`)) || null;
  }

  const $ =
    selector =>
      document.querySelector(
        selector
      );

  const $$ =
    selector =>
      [
        ...document.querySelectorAll(
          selector
        )
      ];

  const courseList =
    $("#courseList");

  const calendar =
    $("#calendar");

  const selectedList =
    $("#selectedList");

  const conflictsSection =
    $("#conflictsSection");

  const conflictList =
    $("#conflictList");

  const toast =
    $("#toast");

  const modalBackdrop =
    $("#modalBackdrop");

  function loadSelected() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const raw =
        JSON.parse(
          saved ?? localStorage.getItem(LEGACY_STORAGE_KEY) ?? "[]"
        );

      return Array.isArray(raw)
        ? raw.map(id => String(id).trim()).filter(id => byId.has(id))
        : [];
    } catch {
      return [];
    }
  }

  function saveSelected() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        [...selected]
      )
    );
  }

  function normalize(text) {
    return String(
      text || ""
    )
      .toLocaleLowerCase(
        "tr-TR"
      )
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      );
  }

  function levelLabel(course) {
  if (course.socialElective) return "Sosyal seçmeli";
  return course.level === "graduate"
    ? "Lisansüstü"
    : `${course.level}. sınıf`;
}

  function dayLabel(dayId) {
    return (
      DAYS.find(
        day =>
          day.id ===
          dayId
      )?.label ||
      dayId
    );
  }

  function formatSessions(
    course,
    short = false
  ) {
    return course.sessions
      .map(
        session => {
          const day =
            DAYS.find(
              item =>
                item.id ===
                session.day
            );

          return `${
            short
              ? day.short
              : day.label
          } ${session.start}–${session.end}`;
        }
      )
      .join(" · ");
  }

  function getSlotRange(
    session
  ) {
    const startIndex =
      SLOTS.findIndex(
        slot =>
          slot.start ===
          session.start
      );

    const endIndex =
      SLOTS.findIndex(
        slot =>
          slot.end ===
          session.end
      );

    if (
      startIndex < 0 ||
      endIndex <
        startIndex
    ) {
      return null;
    }

    return {
      startIndex,
      endIndex,

      span:
        endIndex -
        startIndex +
        1
    };
  }

  function sessionsOverlap(
    a,
    b
  ) {
    if (
      a.day !== b.day
    ) {
      return false;
    }

    const ar =
      getSlotRange(a);

    const br =
      getSlotRange(b);

    if (!ar || !br) {
      return false;
    }

    return (
      ar.startIndex <=
        br.endIndex &&
      br.startIndex <=
        ar.endIndex
    );
  }

  function pairConflicts(
    courseA,
    courseB
  ) {
    const overlaps = [];

    for (
      const a
      of courseA.sessions
    ) {
      for (
        const b
        of courseB.sessions
      ) {
        if (
          !sessionsOverlap(
            a,
            b
          )
        ) {
          continue;
        }

        const ar =
          getSlotRange(a);

        const br =
          getSlotRange(b);

        const startIndex =
          Math.max(
            ar.startIndex,
            br.startIndex
          );

        const endIndex =
          Math.min(
            ar.endIndex,
            br.endIndex
          );

        overlaps.push({
          day: a.day,

          start:
            SLOTS[
              startIndex
            ].start,

          end:
            SLOTS[
              endIndex
            ].end
        });
      }
    }

    return overlaps;
  }

  function getConflicts() {
    const courses =
      [...selected]
        .map(
          id =>
            byId.get(id)
        )
        .filter(Boolean);

    const conflicts = [];

    for (
      let i = 0;
      i <
        courses.length;
      i++
    ) {
      for (
        let j = i + 1;
        j <
          courses.length;
        j++
      ) {
        const overlaps =
          pairConflicts(
            courses[i],
            courses[j]
          );

        for (
          const overlap
          of overlaps
        ) {
          conflicts.push({
            a: courses[i],
            b: courses[j],
            ...overlap
          });
        }
      }
    }

    return conflicts;
  }

  function conflictCourseIds(
    conflicts
  ) {
    const ids =
      new Set();

    conflicts.forEach(
      conflict => {
        ids.add(
          conflict.a.id
        );

        ids.add(
          conflict.b.id
        );
      }
    );

    return ids;
  }

  function showToast(
    message
  ) {
    toast.textContent =
      message;

    toast.classList.add(
      "show"
    );

    clearTimeout(
      toastTimer
    );

    toastTimer =
      setTimeout(
        () =>
          toast.classList.remove(
            "show"
          ),
        3200
      );
  }

  function addCourse(
    id,
    {
      silent = false
    } = {}
  ) {
    /*
     * Kritik düzeltme:
     * data-course-id içinde
     * boşluk/satır atlaması varsa temizle.
     */
    id =
      String(id).trim();

    const course =
      byId.get(id);

    if (
      !course ||
      selected.has(id)
    ) {
      return;
    }

    const existingConflicts =
      [...selected]

        .map(
          otherId =>
            byId.get(
              otherId
            )
        )

        .filter(Boolean)

        .filter(
          other =>
            pairConflicts(
              course,
              other
            ).length > 0
        );

    selected.add(id);

    saveSelected();

    renderAll();

    if (!silent) {
      if (
        existingConflicts.length
      ) {
        showToast(
          `⚠ ${course.code}, ${
            existingConflicts
              .map(
                c => c.code
              )
              .join(", ")
          } ile çakışıyor. Yine de programa eklendi.`
        );
      } else {
        showToast(
          `${course.code} programa eklendi.`
        );
      }
    }
  }

  function removeCourse(
    id,
    {
      silent = false
    } = {}
  ) {
    id =
      String(id).trim();

    const course =
      byId.get(id);

    if (
      !course ||
      !selected.has(id)
    ) {
      return;
    }

    selected.delete(id);

    saveSelected();

    renderAll();

    if (!silent) {
      showToast(
        `${course.code} programdan kaldırıldı.`
      );
    }
  }

  function toggleCourse(id) {
    id =
      String(id).trim();

    selected.has(id)
      ? removeCourse(id)
      : addCourse(id);
  }

  function matchesFilter(
    course
  ) {if (activeFilter === "social") {
  return course.socialElective === true;
}
    if (
      activeFilter ===
      "all"
    ) {
      return true;
    }

    /*
     * technicalElective: true
     * olan her şey Teknik seçmeli.
     */
    if (
      activeFilter ===
      "technical"
    ) {
      return (
        course.technicalElective ===
        true
      );
    }

    /*
     * Teknik seçmeliler
     * 3. sınıf / 4. sınıf /
     * lisansüstü altında
     * ayrıca gösterilmez.
     */
    if (
      course.technicalElective ===
      true
    ) {
      return false;
    }

    return (
      course.level ===
      activeFilter
    );
  }

  function matchesSearch(
    course
  ) {
    if (!searchQuery) {
      return true;
    }

    const haystack =
      normalize([
        course.code,
        course.name,
        course.instructor,
        course.room,
        course.note
      ].join(" "));

    return haystack.includes(
      normalize(
        searchQuery
      )
    );
  }

  function renderCourseList() {
    const filtered =
      DATA.courses.filter(
        course =>
          matchesFilter(
            course
          ) &&
          matchesSearch(
            course
          )
      );

    $("#resultCount")
      .textContent =
        `${filtered.length} ders`;

    if (!filtered.length) {
      courseList.innerHTML =
        `<div style="padding:22px;color:var(--muted);font-size:.78rem;line-height:1.6">Bu filtrede ders bulunamadı.</div>`;

      return;
    }

    courseList.innerHTML =
      filtered
        .map(
          course => {
            const isSelected =
              selected.has(
                course.id
              );

            const academic = statusFor(course);

            const colors =
              courseColor(
                course
              );

            const badges = [
              `<span class="badge">${escapeHtml(levelLabel(course))}</span>`,

              course.technicalElective
                ? `<span class="badge technical">Teknik seçmeli</span>`
                : "",

              academic?.grade
                ? `<span class="badge grade">Son not: ${escapeHtml(academic.grade)}</span>`
                : "",

              academic?.completed
                ? `<span class="badge completed">✓ Tamamlandı</span>`
                : ""
            ].join("");

            return `
              <article
                class="course-card ${isSelected ? "selected" : ""} ${academic?.completed ? "completed" : ""}"
                draggable="true"
                data-course-id="${course.id}"
                style="border-left:4px solid ${colors.accent}"
              >
                <div>
                  <div class="course-code">
                    ${escapeHtml(course.code)}
                  </div>

                  <div class="course-name">
                    ${escapeHtml(course.name)}
                  </div>

                  <div class="course-meta">
                    ${escapeHtml(course.instructor || "—")}
                  </div>

                  <div class="course-time">
                    ${escapeHtml(formatSessions(course, true))}
                  </div>

                  <div class="badges">
                    ${badges}
                  </div>
                </div>

                <div class="course-actions">
                  <button
                    class="add-course ${isSelected ? "remove" : ""}"
                    type="button"
                    data-action="toggle"
                    data-course-id="${course.id}"
                  >
                    ${isSelected ? "Kaldır" : "Ekle"}
                  </button>

                  <button
                    class="info-button"
                    type="button"
                    data-action="info"
                    data-course-id="${course.id}"
                  >
                    Bilgi
                  </button>
                </div>
              </article>
            `;
          }
        )
        .join("");

    courseList
      .querySelectorAll(
        ".course-card"
      )
      .forEach(
        card => {
          card.addEventListener(
            "dragstart",
            event => {
              const id =
                String(
                  card.dataset
                    .courseId
                ).trim();

              event.dataTransfer
                .setData(
                  "text/plain",
                  id
                );

              event.dataTransfer
                .effectAllowed =
                  "copy";

              card.classList.add(
                "dragging"
              );
            }
          );

          card.addEventListener(
            "dragend",
            () =>
              card.classList.remove(
                "dragging"
              )
          );
        }
      );
  }

  function renderSelected() {
    const courses =
      [...selected]
        .map(
          id =>
            byId.get(id)
        )
        .filter(Boolean);

    $("#selectedCount")
      .textContent =
        `${courses.length} seçili`;

    if (!courses.length) {
      selectedList.innerHTML =
        `<span class="selected-empty">Henüz ders eklenmedi.</span>`;

      return;
    }

    selectedList.innerHTML =
      courses

        .sort(
          (a, b) =>
            a.code.localeCompare(
              b.code,
              "tr"
            )
        )

        .map(
          course => {
            const colors =
              courseColor(
                course
              );

            return `
              <button
                class="selected-chip"
                type="button"
                data-remove-id="${course.id}"
                title="Programdan kaldır"
                style="
                  background:${colors.background};
                  border-color:${colors.border}
                "
              >
                ${escapeHtml(course.code)}
                <span aria-hidden="true">×</span>
              </button>
            `;
          }
        )

        .join("");
  }

  function layoutDayEvents(
    dayId,
    conflicts
  ) {
    const conflictIds =
      conflictCourseIds(
        conflicts
      );

    const events = [];

    for (
      const id
      of selected
    ) {
      const course =
        byId.get(id);

      if (!course) {
        continue;
      }

      course.sessions.forEach(
        (
          session,
          sessionIndex
        ) => {
          if (
            session.day !==
            dayId
          ) {
            return;
          }

          const range =
            getSlotRange(
              session
            );

          if (!range) {
            return;
          }

          events.push({
            course,
            session,
            sessionIndex,
            ...range
          });
        }
      );
    }

    events.sort(
      (a, b) =>
        a.startIndex -
          b.startIndex ||

        b.endIndex -
          a.endIndex ||

        a.course.code.localeCompare(
          b.course.code
        )
    );

    const clusters = [];

    let current = [];

    let clusterEnd = -1;

    for (
      const event
      of events
    ) {
      if (
        !current.length ||
        event.startIndex <=
          clusterEnd
      ) {
        current.push(
          event
        );

        clusterEnd =
          Math.max(
            clusterEnd,
            event.endIndex
          );
      } else {
        clusters.push(
          current
        );

        current = [
          event
        ];

        clusterEnd =
          event.endIndex;
      }
    }

    if (
      current.length
    ) {
      clusters.push(
        current
      );
    }

    const laidOut = [];

    for (
      const cluster
      of clusters
    ) {
      const laneEnds = [];

      for (
        const event
        of cluster
      ) {
        let lane =
          laneEnds.findIndex(
            end =>
              end <
              event.startIndex
          );

        if (
          lane === -1
        ) {
          lane =
            laneEnds.length;

          laneEnds.push(
            event.endIndex
          );
        } else {
          laneEnds[lane] =
            event.endIndex;
        }

        event.lane =
          lane;
      }

      const lanes =
        laneEnds.length;

      cluster.forEach(
        event => {
          event.lanes =
            lanes;

          event.isConflict =
            conflictIds.has(
              event.course.id
            ) &&
            conflicts.some(
              c =>
                (
                  c.a.id ===
                    event.course.id ||
                  c.b.id ===
                    event.course.id
                ) &&
                c.day ===
                  dayId &&
                event.startIndex <=
                  SLOTS.findIndex(
                    s =>
                      s.end ===
                      c.end
                  ) &&
                event.endIndex >=
                  SLOTS.findIndex(
                    s =>
                      s.start ===
                      c.start
                  )
            );

          laidOut.push(
            event
          );
        }
      );
    }

    return laidOut;
  }

  function renderCalendar() {
    const conflicts =
      getConflicts();

    const isEmpty =
      selected.size === 0;

    calendar.innerHTML = `
      <div class="calendar-corner">
        Saat
      </div>

      ${
        DAYS.map(
          day =>
            `<div class="day-header">${day.label}</div>`
        ).join("")
      }

      <div class="time-column">
        ${
          SLOTS.map(
            (
              slot,
              index
            ) =>
              `<div
                class="time-slot"
                style="top:${index * SLOT_HEIGHT}px"
              >
                <span>${slot.start}</span>
                <span class="slot-end">${slot.end}</span>
              </div>`
          ).join("")
        }
      </div>

      ${
        DAYS.map(
          day => {
            const events =
              layoutDayEvents(
                day.id,
                conflicts
              );

            return `
              <div
                class="day-column"
                data-day="${day.id}"
              >
                ${
                  SLOTS.map(
                    (
                      slot,
                      index
                    ) =>
                      `<div
                        class="day-slot"
                        style="top:${index * SLOT_HEIGHT}px"
                        aria-hidden="true"
                      ></div>`
                  ).join("")
                }

                ${
                  events
                    .map(
                      renderEvent
                    )
                    .join("")
                }
              </div>
            `;
          }
        ).join("")
      }

      ${
        isEmpty
          ? `
            <div class="empty-calendar">
              <div>
                Soldaki bir dersi sürükleyip takvime bırak
                veya <strong>Ekle</strong> düğmesine bas.
                Ders, gerçek gün ve saatlerine kendisi yerleşir.
              </div>
            </div>
          `
          : ""
      }
    `;
  }

  function renderEvent(
    event
  ) {
    const top =
      event.startIndex *
        SLOT_HEIGHT +
      4;

    const height =
      event.span *
        SLOT_HEIGHT -
      8;

    const laneWidth =
      100 /
      event.lanes;

    const left =
      event.lane *
      laneWidth;

    const colors =
      courseColor(
        event.course
      );

    const classes = [
      "event",

      event.course.level ===
      "graduate"
        ? "graduate"
        : "",

      event.isConflict
        ? "conflict"
        : ""
    ]
      .filter(Boolean)
      .join(" ");

    const showName =
      height >= 58;

    const showRoom =
      height >= 125 &&
      event.course.room;

    const borderColor =
      event.isConflict
        ? "#d92d20"
        : colors.border;

    /*
     * Ders kendi rengini korur.
     * Çakışma varsa yalnızca
     * kırmızı uyarı çerçevesi gelir.
     */
    const shadow =
      event.isConflict
        ? `0 0 0 2px rgba(217,45,32,.35), inset 4px 0 0 ${colors.accent}`
        : `inset 4px 0 0 ${colors.accent}`;

    return `
      <button
        class="${classes}"
        type="button"
        data-event-course-id="${event.course.id}"
        style="
          top:${top}px;
          height:${height}px;
          left:calc(${left}% + 4px);
          width:calc(${laneWidth}% - 8px);
          background:${colors.background};
          border-color:${borderColor};
          box-shadow:${shadow}
        "
        title="${escapeHtml(
          `${event.course.code} — ${event.course.name}
${formatSessions(event.course)}
Tıklayınca ders bilgisi açılır.`
        )}"
      >
        <span class="event-code">
          ${escapeHtml(event.course.code)}
        </span>

        ${
          showName
            ? `
              <span class="event-name">
                ${escapeHtml(event.course.name)}
              </span>
            `
            : ""
        }

        ${
          showRoom
            ? `
              <span class="event-room">
                ${escapeHtml(event.course.room)}
              </span>
            `
            : ""
        }

        <span
          class="event-remove"
          data-event-remove-id="${event.course.id}"
          aria-label="Dersi kaldır"
        >
          ×
        </span>
      </button>
    `;
  }

  function renderConflicts() {
    const conflicts =
      getConflicts();

    $("#conflictCount")
      .textContent =
        `${conflicts.length} çakışma`;

    conflictsSection.hidden =
      conflicts.length ===
      0;

    conflictList.innerHTML =
      conflicts
        .map(
          conflict => `
            <div class="conflict-item">
              <strong>
                ${escapeHtml(conflict.a.code)}
                ×
                ${escapeHtml(conflict.b.code)}
              </strong>

              <span>
                ${escapeHtml(dayLabel(conflict.day))}
                ${conflict.start}–${conflict.end}
              </span>
            </div>
          `
        )
        .join("");
  }

  function renderStats() {
    const conflicts =
      getConflicts();

    const courses =
      [...selected]
        .map(
          id =>
            byId.get(id)
        )
        .filter(Boolean);

    const dayIds =
      new Set(
        courses.flatMap(
          course =>
            course.sessions.map(
              session =>
                session.day
            )
        )
      );

    const freeDays =
      DAYS.filter(
        day =>
          !dayIds.has(
            day.id
          )
      );

    const technicalCount =
      courses.filter(
        course =>
          course.technicalElective ===
          true
      ).length;

    $("#statCourses")
      .textContent =
        String(
          courses.length
        );

    $("#statDays")
      .textContent =
        dayIds.size
          ? `${dayIds.size} gün`
          : "0 gün";

    $("#statFree")
      .textContent =
        freeDays.length
          ? freeDays
              .map(
                day =>
                  day.short
              )
              .join(", ")
          : "Yok";

    $("#statConflicts")
      .textContent =
        String(
          conflicts.length
        );

    $("#statGradDetail")
      .textContent =
        technicalCount
          ? `${technicalCount} teknik seçmeli seçili`
          : "Teknik seçmeli seçili değil";
  }

  function renderAll() {
    renderCourseList();
    renderSelected();
    renderCalendar();
    renderConflicts();
    renderStats();
    updateFilterButtons();
  }

  function updateFilterButtons() {
    $$(".filter-chip")
      .forEach(
        button => {
          button.classList.toggle(
            "active",
            button.dataset.filter ===
              activeFilter
          );
        }
      );
  }

  function openCourseInfo(
    id
  ) {
    id =
      String(id).trim();

    const course =
      byId.get(id);

    if (!course) {
      return;
    }

    $("#modalCode")
      .textContent =
        course.code;

    $("#modalTitle")
      .textContent =
        course.name;

    $("#modalDetails")
      .innerHTML = `
        <dt>Düzey</dt>
        <dd>
          ${escapeHtml(levelLabel(course))}
          ${
            course.technicalElective
              ? " · Teknik seçmeli"
              : ""
          }
        </dd>

        <dt>Öğretim elemanı</dt>
        <dd>
          ${escapeHtml(course.instructor || "—")}
        </dd>

        <dt>Derslik</dt>
        <dd>
          ${escapeHtml(
            course.room ||
            "Programda belirtilmemiş"
          )}
        </dd>

        <dt>Saatler</dt>
        <dd>
          ${
            course.sessions
              .map(
                session =>
                  `${escapeHtml(dayLabel(session.day))} ${session.start}–${session.end}`
              )
              .join("<br>")
          }
        </dd>
      `;

    $("#modalNote").hidden =
      !course.note;

    $("#modalNote")
      .textContent =
        course.note ||
        "";

    modalBackdrop
      .classList.add(
        "open"
      );

    modalBackdrop
      .setAttribute(
        "aria-hidden",
        "false"
      );
  }

  function closeModal() {
    modalBackdrop
      .classList.remove(
        "open"
      );

    modalBackdrop
      .setAttribute(
        "aria-hidden",
        "true"
      );
  }

  function escapeHtml(
    value
  ) {
    return String(
      value ?? ""
    )
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );
  }

  function resetPlanner() {
    if (
      !selected.size
    ) {
      return;
    }

    if (
      !window.confirm(
        "Seçili tüm dersler programdan kaldırılsın mı?"
      )
    ) {
      return;
    }

    selected.clear();

    saveSelected();

    renderAll();

    showToast(
      "Program temizlendi."
    );
  }

  function exportPng() {
    const courses =
      [...selected]
        .map(
          id =>
            byId.get(id)
        )
        .filter(Boolean);

    if (!courses.length) {
      showToast(
        "PNG oluşturmak için önce en az bir ders ekle."
      );

      return;
    }

    const canvas =
      document.createElement(
        "canvas"
      );

    const ctx =
      canvas.getContext(
        "2d"
      );

    const scale = 2;
    const margin = 36;
    const titleH = 92;
    const timeW = 120;
    const dayW = 260;
    const headerH = 64;
    const rowH = 110;

    const width =
      margin * 2 +
      timeW +
      dayW * 5;

    const height =
      margin * 2 +
      titleH +
      headerH +
      rowH * 8;

    canvas.width =
      width * scale;

    canvas.height =
      height * scale;

    ctx.scale(
      scale,
      scale
    );

    ctx.fillStyle =
      "#ffffff";

    ctx.fillRect(
      0,
      0,
      width,
      height
    );

    ctx.fillStyle =
      "#171717";

    ctx.font =
      "700 30px system-ui, sans-serif";

    ctx.fillText(
      `İYTE Fizik — ${DATA.termLabel}`,
      margin,
      margin + 31
    );

    ctx.font =
      "500 15px system-ui, sans-serif";

    ctx.fillStyle =
      "#666666";

    ctx.fillText(
      "Course Planner",
      margin,
      margin + 58
    );

    const gridTop =
      margin +
      titleH;

    const gridLeft =
      margin;

    ctx.strokeStyle =
      "#cfcfcf";

    ctx.lineWidth = 1;

    ctx.fillStyle =
      "#f4f4f2";

    ctx.fillRect(
      gridLeft,
      gridTop,
      timeW +
        dayW * 5,
      headerH
    );

    ctx.font =
      "700 14px system-ui, sans-serif";

    ctx.fillStyle =
      "#333333";

    ctx.textAlign =
      "center";

    ctx.textBaseline =
      "middle";

    ctx.fillText(
      "Saat",
      gridLeft +
        timeW / 2,
      gridTop +
        headerH / 2
    );

    DAYS.forEach(
      (
        day,
        i
      ) => {
        ctx.fillText(
          day.label,

          gridLeft +
            timeW +
            dayW * i +
            dayW / 2,

          gridTop +
            headerH / 2
        );
      }
    );

    for (
      let r = 0;
      r <= 8;
      r++
    ) {
      const y =
        gridTop +
        headerH +
        rowH * r;

      ctx.beginPath();

      ctx.moveTo(
        gridLeft,
        y
      );

      ctx.lineTo(
        gridLeft +
          timeW +
          dayW * 5,
        y
      );

      ctx.stroke();
    }

    for (
      let c = 0;
      c <= 6;
      c++
    ) {
      const x =
        gridLeft +
        (
          c === 0
            ? 0
            : timeW +
              dayW *
                (c - 1)
        );

      ctx.beginPath();

      ctx.moveTo(
        x,
        gridTop
      );

      ctx.lineTo(
        x,
        gridTop +
          headerH +
          rowH * 8
      );

      ctx.stroke();
    }

    SLOTS.forEach(
      (
        slot,
        r
      ) => {
        const y =
          gridTop +
          headerH +
          rowH * r;

        ctx.fillStyle =
          r % 2 === 0
            ? "#fbfbfa"
            : "#ffffff";

        ctx.fillRect(
          gridLeft +
            timeW,
          y,
          dayW * 5,
          rowH
        );

        ctx.fillStyle =
          "#666666";

        ctx.font =
          "600 13px system-ui, sans-serif";

        ctx.fillText(
          `${slot.start}\n${slot.end}`,

          gridLeft +
            timeW / 2,

          y +
            rowH / 2
        );
      }
    );

    /*
     * Satır arka planlarından sonra
     * grid tekrar çizilir.
     */
    ctx.strokeStyle =
      "#cfcfcf";

    for (
      let r = 0;
      r <= 8;
      r++
    ) {
      const y =
        gridTop +
        headerH +
        rowH * r;

      ctx.beginPath();

      ctx.moveTo(
        gridLeft,
        y
      );

      ctx.lineTo(
        gridLeft +
          timeW +
          dayW * 5,
        y
      );

      ctx.stroke();
    }

    for (
      let c = 0;
      c <= 6;
      c++
    ) {
      const x =
        gridLeft +
        (
          c === 0
            ? 0
            : timeW +
              dayW *
                (c - 1)
        );

      ctx.beginPath();

      ctx.moveTo(
        x,
        gridTop
      );

      ctx.lineTo(
        x,
        gridTop +
          headerH +
          rowH * 8
      );

      ctx.stroke();
    }

    const cellCourses =
      new Map();

    for (
      const course
      of courses
    ) {
      course.sessions.forEach(
        session => {
          const range =
            getSlotRange(
              session
            );

          if (!range) {
            return;
          }

          const dayIndex =
            DAYS.findIndex(
              day =>
                day.id ===
                session.day
            );

          for (
            let slot =
              range.startIndex;

            slot <=
              range.endIndex;

            slot++
          ) {
            const key =
              `${dayIndex}:${slot}`;

            if (
              !cellCourses.has(
                key
              )
            ) {
              cellCourses.set(
                key,
                []
              );
            }

            cellCourses
              .get(key)
              .push(
                course
              );
          }
        }
      );
    }

    ctx.textAlign =
      "left";

    ctx.textBaseline =
      "top";

    for (
      const [
        key,
        cell
      ]
      of cellCourses.entries()
    ) {
      const [
        dayIndex,
        slotIndex
      ] =
        key
          .split(":")
          .map(Number);

      const x =
        gridLeft +
        timeW +
        dayW *
          dayIndex +
        8;

      const y =
        gridTop +
        headerH +
        rowH *
          slotIndex +
        7;

      const hasConflict =
        cell.length > 1;

      const perCourseH =
        Math.max(
          28,
          (
            rowH -
            14
          ) /
            cell.length
        );

      cell.forEach(
        (
          course,
          i
        ) => {
          const cy =
            y +
            i *
              perCourseH;

          const colors =
            courseColor(
              course
            );

          ctx.fillStyle =
            colors.canvasBackground ||
            colors.background;

          ctx.fillRect(
            x,
            cy,
            dayW - 16,
            perCourseH - 4
          );

          ctx.fillStyle =
            colors.canvasAccent ||
            colors.accent;

          ctx.fillRect(
            x,
            cy,
            4,
            perCourseH - 4
          );

          if (
            hasConflict
          ) {
            ctx.strokeStyle =
              "#d92d20";

            ctx.lineWidth =
              2;

            ctx.strokeRect(
              x + 1,
              cy + 1,
              dayW - 18,
              perCourseH - 6
            );
          }

          ctx.fillStyle =
            "#171717";

          ctx.font =
            "700 13px system-ui, sans-serif";

          ctx.fillText(
            course.code,
            x + 10,
            cy + 7
          );

          if (
            perCourseH >
            42
          ) {
            ctx.font =
              "500 11px system-ui, sans-serif";

            ctx.fillStyle =
              "#555555";

            drawWrappedText(
              ctx,
              course.name,
              x + 10,
              cy + 26,
              dayW - 32,
              14,

              Math.max(
                1,
                Math.floor(
                  (
                    perCourseH -
                    33
                  ) /
                    14
                )
              )
            );
          }
        }
      );
    }

    canvas.toBlob(
      blob => {
        if (!blob) {
          return;
        }

        const url =
          URL.createObjectURL(
            blob
          );

        const a =
          document.createElement(
            "a"
          );

        a.href =
          url;

        a.download =
          `iyte-fizik-program-${DATA.termId}.png`;

        document.body
          .appendChild(a);

        a.click();

        a.remove();

        URL.revokeObjectURL(
          url
        );

        showToast(
          "PNG oluşturuldu."
        );
      },

      "image/png"
    );
  }

  function drawWrappedText(
    ctx,
    text,
    x,
    y,
    maxWidth,
    lineHeight,
    maxLines
  ) {
    const words =
      String(text)
        .split(/\s+/);

    let line = "";

    let lineCount = 0;

    for (
      let i = 0;
      i <
        words.length;
      i++
    ) {
      const test =
        line
          ? `${line} ${words[i]}`
          : words[i];

      if (
        ctx.measureText(
          test
        ).width >
          maxWidth &&
        line
      ) {
        ctx.fillText(
          line,
          x,
          y +
            lineCount *
              lineHeight
        );

        lineCount++;

        if (
          lineCount >=
          maxLines
        ) {
          return;
        }

        line =
          words[i];
      } else {
        line =
          test;
      }
    }

    if (
      line &&
      lineCount <
        maxLines
    ) {
      ctx.fillText(
        line,
        x,
        y +
          lineCount *
            lineHeight
      );
    }
  }

  /*
   * Genel click eventleri.
   */
  document.addEventListener(
    "click",
    event => {
      const toggle =
        event.target.closest(
          "[data-action='toggle']"
        );

      if (toggle) {
        toggleCourse(
          String(
            toggle.dataset
              .courseId
          ).trim()
        );

        return;
      }

      const info =
        event.target.closest(
          "[data-action='info']"
        );

      if (info) {
        openCourseInfo(
          String(
            info.dataset
              .courseId
          ).trim()
        );

        return;
      }

      const selectedChip =
        event.target.closest(
          "[data-remove-id]"
        );

      if (
        selectedChip
      ) {
        removeCourse(
          String(
            selectedChip
              .dataset
              .removeId
          ).trim()
        );

        return;
      }

      const removeEvent =
        event.target.closest(
          "[data-event-remove-id]"
        );

      if (
        removeEvent
      ) {
        event.stopPropagation();

        removeCourse(
          String(
            removeEvent
              .dataset
              .eventRemoveId
          ).trim()
        );

        return;
      }

      const eventBlock =
        event.target.closest(
          "[data-event-course-id]"
        );

      if (
        eventBlock
      ) {
        openCourseInfo(
          String(
            eventBlock
              .dataset
              .eventCourseId
          ).trim()
        );
      }
    }
  );

  $("#searchInput")
    .addEventListener(
      "input",
      event => {
        searchQuery =
          event.target
            .value
            .trim();

        renderCourseList();
      }
    );

  $$(".filter-chip")
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            activeFilter =
              button.dataset
                .filter;

            localStorage.setItem(
              FILTER_KEY,
              activeFilter
            );

            renderCourseList();

            updateFilterButtons();
          }
        );
      }
    );

  $("#clearButton")
    .addEventListener(
      "click",
      resetPlanner
    );

  $("#printButton")
    .addEventListener(
      "click",
      () =>
        window.print()
    );

  $("#pngButton")
    .addEventListener(
      "click",
      exportPng
    );

  $("#themeToggle")
    .addEventListener(
      "click",
      () => {
        const root =
          document.documentElement;

        const next =
          root.dataset.theme ===
          "dark"
            ? "light"
            : "dark";

        root.dataset.theme =
          next;

        localStorage.setItem(
          "site-theme",
          next
        );
      }
    );

  calendar.addEventListener(
    "dragover",
    event => {
      event.preventDefault();

      event.dataTransfer
        .dropEffect =
          "copy";

      calendar.classList.add(
        "drop-active"
      );
    }
  );

  calendar.addEventListener(
    "dragleave",
    event => {
      if (
        !calendar.contains(
          event.relatedTarget
        )
      ) {
        calendar
          .classList.remove(
            "drop-active"
          );
      }
    }
  );

  calendar.addEventListener(
    "drop",
    event => {
      event.preventDefault();

      calendar
        .classList.remove(
          "drop-active"
        );

      const id =
        event.dataTransfer
          .getData(
            "text/plain"
          )
          .trim();

      if (id) {
        addCourse(id);
      }
    }
  );

  $("#modalClose")
    .addEventListener(
      "click",
      closeModal
    );

  modalBackdrop
    .addEventListener(
      "click",
      event => {
        if (
          event.target ===
          modalBackdrop
        ) {
          closeModal();
        }
      }
    );

  document.addEventListener(
    "keydown",
    event => {
      if (
        event.key ===
        "Escape"
      ) {
        closeModal();
      }
    }
  );

  $("#termLabel")
    .textContent =
      DATA.termLabel;

  $("#plannerTerm")
    .textContent =
      DATA.termLabel;

  function refreshAcademicStatus() {
    academicContext = loadAcademicContext();
    academicStatus = loadAcademicStatus();
    $("#academicYear").value = String(academicContext.year);
    $("#academicProfile").value = String(academicContext.profile);
    $("#academicNote").textContent = academicStatus.size
      ? "Son notlar ve tamamlanma işaretleri bu yıl ve profilin kayıtlarından okunur."
      : "Bu yıl ve profilde not veya tamamlanma kaydı bulunamadı. GPA hesaplayıcısındaki yıl ve profilini seç.";
    renderCourseList();
  }

  $("#academicYear").innerHTML = Object.keys(window.CURRICULA || {})
    .sort((a, b) => Number(a) - Number(b))
    .map(year => `<option value="${escapeHtml(year)}">${escapeHtml(year)} girişli</option>`)
    .join("");

  ["#academicYear", "#academicProfile"].forEach(selector => {
    $(selector).addEventListener("change", () => {
      localStorage.setItem(CONTEXT_KEY, JSON.stringify({
        year: Number($("#academicYear").value),
        profile: Number($("#academicProfile").value)
      }));
      refreshAcademicStatus();
    });
  });

  window.addEventListener("storage", event => {
    if (event.storageArea === localStorage &&
        (event.key === null || event.key === CONTEXT_KEY || /^iyte_(?:gpa_|grad_)/.test(event.key))) {
      refreshAcademicStatus();
    }
  });
  window.addEventListener("pageshow", refreshAcademicStatus);

  if (localStorage.getItem(STORAGE_KEY) === null) saveSelected();
  refreshAcademicStatus();
  renderAll();

})();
