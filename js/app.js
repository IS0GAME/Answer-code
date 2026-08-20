(function () {
  "use strict";

  var LETTERS = ["ก", "ข", "ค", "ง"];
  var state = {
    books: [],
    activeBookId: null,
    activeBook: null,
    activeCategory: "all",
    currentSearchQuery: "",
    bookmarks: JSON.parse(localStorage.getItem("answer_code_bookmarks") || "{}"),
    theme: localStorage.getItem("answer_code_theme") || "light",
  };

  /* ---------------- Audio Synthesizer (Retro 8-bit / Kahoot FX) ---------------- */
  var audioCtx = null;
  function getAudioContext() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freq, type, duration, delay) {
    try {
      var ctx = getAudioContext();
      if (!ctx) return;
      delay = delay || 0;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0.18, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    } catch (e) {}
  }

  function soundCorrect() {
    playTone(523.25, "triangle", 0.1, 0);       // C5
    playTone(659.25, "triangle", 0.1, 0.08);    // E5
    playTone(783.99, "triangle", 0.12, 0.16);   // G5
    playTone(1046.50, "triangle", 0.25, 0.24);  // C6
  }

  function soundWrong() {
    playTone(370, "sawtooth", 0.18, 0);         // F#3
    playTone(293.66, "sawtooth", 0.35, 0.15);   // D3
  }

  function soundTick() {
    playTone(880, "sine", 0.04, 0);
  }

  function soundFanfare() {
    playTone(523.25, "triangle", 0.12, 0);
    playTone(659.25, "triangle", 0.12, 0.12);
    playTone(783.99, "triangle", 0.12, 0.24);
    playTone(1046.50, "triangle", 0.4, 0.36);
  }

  /* ---------------- Elements Cache ---------------- */
  var els = {
    content: document.getElementById("content"),
    unitsContainer: document.getElementById("unitsContainer"),
    mainLoading: document.getElementById("mainLoading"),
    navList: document.querySelector(".unit-nav ul"),
    traceGlow: document.querySelector(".trace-glow"),
    catChips: document.getElementById("catChips"),
    searchBox: document.getElementById("searchBox"),
    bookSuggestions: document.getElementById("bookSuggestions"),
    bookSelect: document.getElementById("bookSelect"),
    bookCountBadge: document.getElementById("bookCountBadge"),
    noResults: document.getElementById("noResults"),
    toggleBtn: document.getElementById("toggleAnswers"),
    openPrintModalBtn: document.getElementById("openPrintModalBtn"),
    printModal: document.getElementById("printModal"),
    closePrintModalBtn: document.getElementById("closePrintModalBtn"),
    printExamBtn: document.getElementById("printExamBtn"),
    printKeyBtn: document.getElementById("printKeyBtn"),
    specStrip: document.getElementById("specStrip"),
    sidebarFooter: document.getElementById("sidebarFooter"),
    brandEyebrow: document.getElementById("brandEyebrow"),
    mobileEyebrow: document.getElementById("mobileEyebrow"),
    brandTitle: document.getElementById("brandTitle"),
    brandSub: document.getElementById("brandSub"),
    brandDesc: document.getElementById("brandDesc"),
    pageTitle: document.getElementById("pageTitle"),
    pageKicker: document.getElementById("pageKicker"),
    pageDesc: document.getElementById("pageDesc"),
    themeToggleBtn: document.getElementById("themeToggleBtn"),
    themeIcon: document.getElementById("themeIcon"),
    themeLabel: document.getElementById("themeLabel"),
    spotlightTriggerBtn: document.getElementById("spotlightTriggerBtn"),
    spotlightModal: document.getElementById("spotlightModal"),
    spotlightInput: document.getElementById("spotlightInput"),
    spotlightResults: document.getElementById("spotlightResults"),
    openExamBuilderBtn: document.getElementById("openExamBuilderBtn"),
    examBuilderModal: document.getElementById("examBuilderModal"),
    closeExamModalBtn: document.getElementById("closeExamModalBtn"),
    startExamQuizBtn: document.getElementById("startExamQuizBtn"),
    printExamDirectBtn: document.getElementById("printExamDirectBtn"),
    examCountSelect: document.getElementById("examCountSelect"),
    examScopeSelect: document.getElementById("examScopeSelect"),
    startKahootBtn: document.getElementById("startKahootBtn"),
    kahootArena: document.getElementById("kahootArena"),
    closeKahootBtn: document.getElementById("closeKahootBtn"),
    kahootQNum: document.getElementById("kahootQNum"),
    kahootQText: document.getElementById("kahootQText"),
    kahootExplainCard: document.getElementById("kahootExplainCard"),
    kahootChoiceA: document.getElementById("kahootChoiceA"),
    kahootChoiceB: document.getElementById("kahootChoiceB"),
    kahootChoiceC: document.getElementById("kahootChoiceC"),
    kahootChoiceD: document.getElementById("kahootChoiceD"),
    kahootNextBtn: document.getElementById("kahootNextBtn"),
    kahootTimerBar: document.getElementById("kahootTimerBar"),
    kahootScoreBadge: document.getElementById("kahootScoreBadge"),
    kahootStreakText: document.getElementById("kahootStreakText"),
    kahootBody: document.getElementById("kahootBody"),
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function getCardId(unitNum, qNum) {
    var bCode = (state.activeBook && state.activeBook.meta && state.activeBook.meta.code) || state.activeBookId || "book";
    return bCode + "_u" + unitNum + "_q" + qNum;
  }

  /* ---------------- Thai Text-to-Speech ---------------- */
  function speakThai(text, onEnd) {
    if (!("speechSynthesis" in window)) {
      alert("เบราว์เซอร์ของคุณยังไม่รองรับระบบสังเคราะห์เสียง (Text-to-Speech)");
      return;
    }
    window.speechSynthesis.cancel();
    var cleanText = text.replace(/[\n\r\t]+/g, " ").replace(/[#*`_]+/g, "");
    var utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "th-TH";
    utterance.rate = 1.0;
    if (onEnd) utterance.onend = onEnd;
    window.speechSynthesis.speak(utterance);
  }

  /* ---------------- Rendering ---------------- */

  function renderChoice(letter, text, isCorrect) {
    var cls = "choice" + (isCorrect ? " correct" : "");
    var display = text && text.trim()
      ? esc(text)
      : '<span class="img-ph">[ดูรูปภาพประกอบในเอกสารต้นฉบับ]</span>';
    return (
      '<li class="' + cls + '" data-letter="' + letter + '"><span class="letter">' + letter + ".</span> " +
      '<span class="mark">&#10003;</span> <span class="choice-text">' + display + "</span></li>"
    );
  }

  function renderMcCard(unitNum, q) {
    var cardId = getCardId(unitNum, q.num);
    var isBookmarked = !!state.bookmarks[cardId];
    var choicesText = LETTERS.map(function (l) { return (q.choices && q.choices[l]) || ""; }).join(" ");
    var searchBlob = [(q.question || ""), choicesText, (q.explanation || "")].join(" ").toLowerCase();
    var choicesHtml = LETTERS.map(function (l) {
      var choiceText = q.choices ? q.choices[l] : "";
      return renderChoice(l, choiceText, l === q.correct);
    }).join("");
    var noteHtml = q.note ? '<div class="notebox">&#9888; ' + esc(q.note) + "</div>" : "";
    var explainHtml = q.explanation
      ? '<div class="explain"><b>คำอธิบาย</b>&nbsp; ' + esc(q.explanation) + "</div>"
      : "";

    return (
      '<div class="qcard" id="' + cardId + '" data-card-id="' + cardId + '" data-correct="' + esc(q.correct || "") + '" data-search="' + esc(searchBlob) + '" data-bookmarked="' + (isBookmarked ? 'true' : 'false') + '">' +
      '<div class="qhead">' +
      '<span class="qnum">Q' + q.num + '</span>' +
      '<p class="qtext">' + esc(q.question) + "</p>" +
      '<div class="card-tools">' +
      '<button type="button" class="icon-btn tts-btn" title="อ่านออกเสียง" data-text="' + esc((q.question || "") + " คำอธิบาย: " + (q.explanation || "")) + '">🔊</button>' +
      '<button type="button" class="icon-btn star-btn ' + (isBookmarked ? 'active' : '') + '" title="ติดดาวข้อสอบนี้" data-card-id="' + cardId + '">★</button>' +
      '</div>' +
      "</div>" +
      '<ul class="choices">' + choicesHtml + "</ul>" +
      noteHtml + explainHtml +
      "</div>"
    );
  }

  function renderSaCard(item, unitNum, index) {
    var lines = item.a || [];
    var searchBlob = ((item.q || "") + " " + lines.join(" ")).toLowerCase();
    var linesHtml = lines.map(function (l) { return "<p>" + esc(l) + "</p>"; }).join("");
    return (
      '<div class="sacard" data-search="' + esc(searchBlob) + '">' +
      '<div class="saq" style="display:flex; justify-content:space-between; align-items:center;">' +
      '<span>' + esc(item.q) + '</span>' +
      '<button type="button" class="icon-btn tts-btn" title="อ่านออกเสียง" data-text="' + esc((item.q || "") + " คำตอบ: " + lines.join(" ")) + '">🔊</button>' +
      '</div>' +
      '<div class="saanswer">' + linesHtml + "</div>" +
      "</div>"
    );
  }

  function categoryLabel(catId) {
    if (!state.activeBook || !state.activeBook.categories) return catId;
    var cat = state.activeBook.categories.find(function (c) { return c.id === catId; });
    return cat ? cat.label : catId;
  }

  function renderUnit(u) {
    var tag = String(u.num).padStart(2, "0");
    var mcList = u.mc || [];
    var saList = u.sa || [];
    var mcHtml = mcList.map(function (q) { return renderMcCard(u.num, q); }).join("");
    var saHtml = saList.map(function (item, idx) { return renderSaCard(item, u.num, idx); }).join("");

    var quizBarHtml = mcList.length > 0 ? (
      '<div class="unit-quiz-bar">' +
      '<button type="button" class="quiz-btn quiz-check-btn">✓ ตรวจคำตอบหน่วยนี้</button>' +
      '<button type="button" class="quiz-btn quiz-reset-btn">↺ ล้างคำตอบ</button>' +
      '<span class="unit-score-badge"></span>' +
      '</div>'
    ) : '';

    return (
      '<section class="unit" id="unit-' + u.num + '" data-unit="' + u.num + '" data-category="' + esc(u.category || "general") +
      '" data-title="' + esc((u.title || "").toLowerCase()) + '">' +
      '<div class="unit-head"><span class="unit-num">' + tag + "</span><h2>" + esc(u.title) + "</h2>" +
      '<span class="unit-cat-tag">' + esc(categoryLabel(u.category)) + "</span></div>" +
      quizBarHtml +
      (mcList.length > 0 ? '<span class="part-label">ตอนที่ 1 &middot; แบบฝึกหัดปรนัย (' + mcList.length + " ข้อ)</span>" + mcHtml : "") +
      (saList.length > 0 ? '<span class="part-label">ตอนที่ 2 &middot; คำถามอัตนัย (' + saList.length + " ข้อ)</span>" + saHtml : "") +
      "</section>"
    );
  }

  function renderNav(units) {
    if (!els.navList) return;
    els.navList.innerHTML = units.map(function (u) {
      var tag = String(u.num).padStart(2, "0");
      return (
        '<li data-unit="' + u.num + '" data-category="' + esc(u.category || "general") + '">' +
        '<a href="#unit-' + u.num + '"><span class="unit-tag">' + tag + "</span>" +
        '<span class="unit-label">' + esc(u.title) + "</span></a></li>"
      );
    }).join("");
  }

  function renderCatChips(categories) {
    if (!els.catChips) return;
    var cats = categories || [];
    var chips = [
      '<button class="cat-chip active" data-cat="all">ทั้งหมด</button>',
      '<button class="cat-chip" data-cat="bookmarks" style="color:#B5652D;">★ ข้อสอบที่ติดดาว</button>'
    ].concat(
      cats.map(function (c) {
        return '<button class="cat-chip" data-cat="' + esc(c.id) + '">' + esc(c.label) + "</button>";
      })
    );
    els.catChips.innerHTML = chips.join("");
  }

  /* ---------------- Multi-Book Switcher & Setup ---------------- */

  function populateBookSelect() {
    if (!els.bookSelect) return;
    els.bookSelect.innerHTML = state.books.map(function (b) {
      var code = b.meta && b.meta.code ? b.meta.code : b._docId;
      var course = b.meta && b.meta.course ? b.meta.course : "วิชาไม่ระบุชื่อ";
      return '<option value="' + esc(b._docId) + '">' + esc(code) + " — " + esc(course) + "</option>";
    }).join("");

    if (els.bookCountBadge) {
      els.bookCountBadge.textContent = state.books.length + " เล่ม";
    }
  }

  function populateExamScopeSelect() {
    if (!els.examScopeSelect || !state.activeBook) return;
    var units = state.activeBook.units || [];
    var html = '<option value="all" selected>ทุกหน่วยการเรียนรู้ (ทั้งหมด ' + units.length + ' หน่วย)</option>';
    units.forEach(function (u) {
      html += '<option value="' + u.num + '">หน่วยที่ ' + u.num + ': ' + esc(u.title) + '</option>';
    });
    els.examScopeSelect.innerHTML = html;
  }

  function syncURL(bookCode, targetUnit) {
    try {
      var url = new URL(window.location.href);
      url.searchParams.set("book", bookCode);
      if (targetUnit) {
        url.hash = "unit-" + targetUnit;
      }
      window.history.replaceState(null, "", url.toString());
    } catch (e) {}
  }

  function selectBook(bookId, preserveUnit) {
    var found = state.books.find(function (b) {
      return b._docId === bookId || (b.meta && b.meta.code === bookId);
    });
    if (!found && state.books.length > 0) {
      found = state.books[0];
    }
    if (!found) return;

    state.activeBookId = found._docId;
    state.activeBook = found;
    state.activeCategory = "all";

    if (els.bookSelect && els.bookSelect.value !== found._docId) {
      els.bookSelect.value = found._docId;
    }

    populateExamScopeSelect();

    var meta = found.meta || {};
    var course = meta.course || "รายวิชา";
    var code = meta.code || found._docId;
    var extraInfo = meta.board || meta.description || meta.level || "";
    var units = found.units || [];
    var categories = found.categories || [];

    document.title = "เฉลยแบบฝึกหัด " + course + " (" + code + ") — Answer Code";

    // Update Brand UI
    if (els.brandEyebrow) els.brandEyebrow.textContent = "ANSWER CODE \u00b7 " + code;
    if (els.mobileEyebrow) els.mobileEyebrow.textContent = "REF \u00b7 " + code;
    if (els.brandTitle) {
      els.brandTitle.innerHTML = 'เฉลยแบบฝึกหัด<span>' + esc(course) + "</span>";
    }
    if (els.brandDesc) {
      els.brandDesc.textContent = extraInfo ? "คู่มืออ้างอิง: " + extraInfo : "คู่มืออ้างอิงสำหรับครูผู้สอน";
    }

    // Update Page Header UI
    if (els.pageTitle) els.pageTitle.textContent = "เฉลยแบบฝึกหัด รายวิชา " + course;
    if (els.pageKicker) els.pageKicker.textContent = "รหัสวิชา " + code + (extraInfo ? " \u00b7 " + extraInfo : "");
    if (els.pageDesc) {
      els.pageDesc.textContent =
        "รวมเฉลยและคำอธิบายคำตอบทุกข้อจากแผนการสอน " + units.length + " หน่วย ใช้ปุ่ม \"ซ่อนเฉลย / ซ้อมทำข้อสอบ\" เพื่อทำแบบฝึกหัดและตรวจคำตอบ " +
        "กรองตามหมวดหมู่ หรือกดปุ่ม 🎮 โหมดเกม Kahoot หรือ 🔀 สุ่มชุดข้อสอบด้านบน";
    }

    var totalMc = units.reduce(function (a, u) { return a + (u.mc ? u.mc.length : 0); }, 0);
    var totalSa = units.reduce(function (a, u) { return a + (u.sa ? u.sa.length : 0); }, 0);

    if (els.specStrip) {
      els.specStrip.innerHTML =
        '<span class="spec-chip">วิชา <b>' + esc(course) + "</b></span>" +
        '<span class="spec-chip">รหัส <b>' + esc(code) + "</b></span>" +
        (extraInfo ? '<span class="spec-chip">รายละเอียด <b>' + esc(extraInfo) + "</b></span>" : "") +
        '<span class="spec-chip"><b>' + units.length + "</b> หน่วย</span>" +
        '<span class="spec-chip"><b>' + totalMc + "</b> ข้อปรนัย</span>" +
        (totalSa > 0 ? '<span class="spec-chip"><b>' + totalSa + "</b> ข้ออัตนัย</span>" : "");
    }

    if (els.sidebarFooter) {
      els.sidebarFooter.textContent =
        units.length + " หน่วย \u00b7 " + totalMc + " ข้อปรนัย \u00b7 " + totalSa + " ข้ออัตนัย";
    }

    // Render Content & Navigation
    if (els.mainLoading) els.mainLoading.style.display = "none";
    renderCatChips(categories);
    renderNav(units);

    var targetContainer = els.unitsContainer || els.content;
    targetContainer.innerHTML = units.map(renderUnit).join("");

    // Reset search
    if (els.searchBox) els.searchBox.value = "";
    if (els.bookSuggestions) {
      els.bookSuggestions.innerHTML = "";
      els.bookSuggestions.classList.remove("active");
    }

    syncURL(code, preserveUnit);
    wireInteractions();

    if (preserveUnit) {
      var targetEl = document.getElementById("unit-" + preserveUnit);
      if (targetEl) {
        setTimeout(function () { targetEl.scrollIntoView({ behavior: "smooth" }); }, 150);
      }
    }
  }

  /* ---------------- Search & Suggestions ---------------- */

  function checkBookSuggestions(query) {
    if (!els.bookSuggestions) return;
    var q = (query || "").trim().toLowerCase();
    if (!q || q.length < 2) {
      els.bookSuggestions.innerHTML = "";
      els.bookSuggestions.classList.remove("active");
      return;
    }

    var matches = state.books.filter(function (b) {
      if (b._docId === state.activeBookId) return false;
      var code = (b.meta && b.meta.code ? b.meta.code : b._docId).toLowerCase();
      var course = (b.meta && b.meta.course ? b.meta.course : "").toLowerCase();
      var extra = (b.meta && (b.meta.board || b.meta.description) ? (b.meta.board || b.meta.description) : "").toLowerCase();
      return code.indexOf(q) !== -1 || course.indexOf(q) !== -1 || extra.indexOf(q) !== -1;
    });

    if (matches.length === 0) {
      els.bookSuggestions.innerHTML = "";
      els.bookSuggestions.classList.remove("active");
      return;
    }

    var html = '<div class="book-suggestion-title">💡 พบหนังสืออื่นที่ตรงกับการค้นหา:</div>';
    html += matches.map(function (b) {
      var code = b.meta && b.meta.code ? b.meta.code : b._docId;
      var course = b.meta && b.meta.course ? b.meta.course : "ไม่ระบุชื่อวิชา";
      return (
        '<button class="book-suggestion-item" data-book-id="' + esc(b._docId) + '">' +
        '<span class="book-suggestion-code">' + esc(code) + '</span>' +
        '<span class="book-suggestion-name">' + esc(course) + '</span>' +
        '</button>'
      );
    }).join("");

    els.bookSuggestions.innerHTML = html;
    els.bookSuggestions.classList.add("active");
  }

  /* ---------------- Spotlight Full-Text Global Search (Ctrl + K) ---------------- */

  function openSpotlight() {
    if (!els.spotlightModal) return;
    els.spotlightModal.style.display = "flex";
    if (els.spotlightInput) {
      els.spotlightInput.value = "";
      els.spotlightInput.focus();
    }
    renderSpotlightResults("");
  }

  function closeSpotlight() {
    if (els.spotlightModal) els.spotlightModal.style.display = "none";
  }

  function renderSpotlightResults(query) {
    if (!els.spotlightResults) return;
    var q = (query || "").trim().toLowerCase();
    if (!q || q.length < 2) {
      els.spotlightResults.innerHTML = '<div style="padding:24px; text-align:center; color:var(--ink-faint); font-size:13px;">พิมพ์คำค้นหาเพื่อสืบค้นข้อสอบจากทุกวิชาในระบบ (เช่น ATmega, analogRead, สวิตช์)</div>';
      return;
    }

    var hits = [];
    state.books.forEach(function (book) {
      var bCode = (book.meta && book.meta.code) || book._docId;
      var bCourse = (book.meta && book.meta.course) || "วิชาไม่ระบุ";
      var units = book.units || [];

      units.forEach(function (u) {
        (u.mc || []).forEach(function (qItem) {
          var choicesStr = LETTERS.map(function (l) { return (qItem.choices && qItem.choices[l]) || ""; }).join(" ");
          var fullText = ((qItem.question || "") + " " + choicesStr + " " + (qItem.explanation || "")).toLowerCase();
          if (fullText.indexOf(q) !== -1) {
            hits.push({
              bookId: book._docId,
              bookCode: bCode,
              bookCourse: bCourse,
              unitNum: u.num,
              unitTitle: u.title,
              qNum: qItem.num,
              questionText: qItem.question,
              explanation: qItem.explanation
            });
          }
        });
      });
    });

    if (hits.length === 0) {
      els.spotlightResults.innerHTML = '<div style="padding:24px; text-align:center; color:var(--ink-faint); font-size:13px;">ไม่พบข้อสอบที่ตรงกับคำว่า "' + esc(query) + '"</div>';
      return;
    }

    var html = hits.slice(0, 40).map(function (h, idx) {
      return (
        '<button type="button" class="spotlight-item ' + (idx === 0 ? 'selected' : '') + '" data-book-id="' + esc(h.bookId) + '" data-unit="' + h.unitNum + '">' +
        '<div class="spotlight-item-meta">' +
        '<span class="spotlight-badge">' + esc(h.bookCode) + '</span>' +
        '<span>' + esc(h.bookCourse) + ' &middot; หน่วยที่ ' + h.unitNum + '</span>' +
        '</div>' +
        '<div class="spotlight-text"><b>ข้อที่ ' + h.qNum + '.</b> ' + esc(h.questionText) + '</div>' +
        '</button>'
      );
    }).join("");

    els.spotlightResults.innerHTML = html;
  }

  /* ---------------- Exam Paper Builder ---------------- */

  function getRandomQuestions(count, scope) {
    if (!state.activeBook) return [];
    var pool = [];
    var units = state.activeBook.units || [];

    units.forEach(function (u) {
      if (scope === "all" || String(u.num) === String(scope)) {
        (u.mc || []).forEach(function (q) {
          pool.push({ unitNum: u.num, unitTitle: u.title, q: q });
        });
      }
    });

    // Shuffle pool
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = pool[i]; pool[i] = pool[j]; pool[j] = temp;
    }

    if (count === "all") return pool;
    var num = parseInt(count, 10) || 20;
    return pool.slice(0, num);
  }

  function startExamQuiz() {
    var count = els.examCountSelect ? els.examCountSelect.value : "20";
    var scope = els.examScopeSelect ? els.examScopeSelect.value : "all";
    var selected = getRandomQuestions(count, scope);

    if (selected.length === 0) {
      alert("ไม่พบข้อสอบในขอบเขตที่เลือก");
      return;
    }

    if (els.examBuilderModal) els.examBuilderModal.style.display = "none";

    // Build custom synthetic unit
    var customUnit = {
      num: 99,
      title: "ชุดข้อสอบสุ่ม (" + selected.length + " ข้อ)",
      category: "exam",
      mc: selected.map(function (item, idx) {
        var copy = Object.assign({}, item.q);
        copy.num = idx + 1;
        return copy;
      }),
      sa: []
    };

    var targetContainer = els.unitsContainer || els.content;
    targetContainer.innerHTML = renderUnit(customUnit);

    // Auto-enter practice mode
    document.body.classList.add("answers-hidden");
    if (els.toggleBtn) {
      els.toggleBtn.textContent = "แสดงเฉลยทั้งหมด";
      els.toggleBtn.setAttribute("data-state", "hidden");
    }

    wireInteractions();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------------- Interactive Kahoot Presentation Game Arena ---------------- */

  var kahootState = {
    questions: [],
    currentIndex: 0,
    score: 0,
    streak: 0,
    timerInterval: null,
    timeRemaining: 20,
    totalTime: 20,
    hasAnswered: false,
  };

  function startKahootGame() {
    if (!state.activeBook) return;
    var pool = [];
    (state.activeBook.units || []).forEach(function (u) {
      (u.mc || []).forEach(function (q) {
        if (q.question && q.correct && q.choices) {
          pool.push({ unitNum: u.num, unitTitle: u.title, q: q });
        }
      });
    });

    if (pool.length === 0) {
      alert("ไม่มีข้อสอบปรนัยในหนังสือเล่มนี้สำหรับการเล่นเกม");
      return;
    }

    // Shuffle pool and take up to 15 questions
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = pool[i]; pool[i] = pool[j]; pool[j] = temp;
    }

    kahootState.questions = pool.slice(0, 15);
    kahootState.currentIndex = 0;
    kahootState.score = 0;
    kahootState.streak = 0;

    if (els.kahootArena) els.kahootArena.style.display = "flex";
    loadKahootQuestion();
  }

  function closeKahootGame() {
    if (kahootState.timerInterval) clearInterval(kahootState.timerInterval);
    if (els.kahootArena) els.kahootArena.style.display = "none";
  }

  function loadKahootQuestion() {
    if (kahootState.timerInterval) clearInterval(kahootState.timerInterval);
    kahootState.hasAnswered = false;

    var item = kahootState.questions[kahootState.currentIndex];
    if (!item) {
      showKahootPodium();
      return;
    }

    var q = item.q;
    if (els.kahootQNum) els.kahootQNum.textContent = "คำถามที่ " + (kahootState.currentIndex + 1) + " / " + kahootState.questions.length + " (" + item.unitTitle + ")";
    if (els.kahootQText) els.kahootQText.textContent = q.question || "";
    if (els.kahootScoreBadge) els.kahootScoreBadge.textContent = "คะแนน: " + kahootState.score;
    if (els.kahootStreakText) els.kahootStreakText.textContent = "🔥 Streak: " + kahootState.streak;

    if (els.kahootChoiceA) els.kahootChoiceA.textContent = "ก. " + (q.choices ? (q.choices["ก"] || "-") : "-");
    if (els.kahootChoiceB) els.kahootChoiceB.textContent = "ข. " + (q.choices ? (q.choices["ข"] || "-") : "-");
    if (els.kahootChoiceC) els.kahootChoiceC.textContent = "ค. " + (q.choices ? (q.choices["ค"] || "-") : "-");
    if (els.kahootChoiceD) els.kahootChoiceD.textContent = "ง. " + (q.choices ? (q.choices["ง"] || "-") : "-");

    if (els.kahootExplainCard) {
      els.kahootExplainCard.classList.remove("show");
      els.kahootExplainCard.innerHTML = "<b>เฉลยข้อ " + q.correct + ":</b> " + esc(q.explanation || "ไม่มีคำอธิบายเพิ่มเติม");
    }

    if (els.kahootNextBtn) els.kahootNextBtn.style.display = "none";

    // Reset choice button styles
    document.querySelectorAll(".kahoot-choice").forEach(function (btn) {
      btn.disabled = false;
      btn.classList.remove("reveal-dim", "reveal-correct", "reveal-wrong-selected");
    });

    // Start 20s countdown
    kahootState.timeRemaining = 20;
    kahootState.totalTime = 20;
    updateKahootTimer();

    kahootState.timerInterval = setInterval(function () {
      kahootState.timeRemaining--;
      updateKahootTimer();
      if (kahootState.timeRemaining <= 5 && kahootState.timeRemaining > 0) {
        soundTick();
      }
      if (kahootState.timeRemaining <= 0) {
        clearInterval(kahootState.timerInterval);
        handleKahootAnswer(null); // Time out
      }
    }, 1000);
  }

  function updateKahootTimer() {
    if (!els.kahootTimerBar) return;
    var pct = Math.max(0, (kahootState.timeRemaining / kahootState.totalTime) * 100);
    els.kahootTimerBar.style.width = pct + "%";
  }

  function handleKahootAnswer(selectedLetter) {
    if (kahootState.hasAnswered) return;
    kahootState.hasAnswered = true;
    if (kahootState.timerInterval) clearInterval(kahootState.timerInterval);

    var item = kahootState.questions[kahootState.currentIndex];
    var correctLetter = item.q.correct;
    var isCorrect = selectedLetter === correctLetter;

    if (isCorrect) {
      soundCorrect();
      kahootState.streak++;
      var speedBonus = kahootState.timeRemaining * 40;
      var points = 1000 + speedBonus + (kahootState.streak > 1 ? (kahootState.streak * 100) : 0);
      kahootState.score += points;
    } else {
      soundWrong();
      kahootState.streak = 0;
    }

    if (els.kahootScoreBadge) els.kahootScoreBadge.textContent = "คะแนน: " + kahootState.score;
    if (els.kahootStreakText) els.kahootStreakText.textContent = "🔥 Streak: " + kahootState.streak;

    // Visual reveal
    document.querySelectorAll(".kahoot-choice").forEach(function (btn) {
      btn.disabled = true;
      var letter = btn.getAttribute("data-letter");
      if (letter === correctLetter) {
        btn.classList.add("reveal-correct");
      } else {
        btn.classList.add("reveal-dim");
      }
      if (selectedLetter && letter === selectedLetter && !isCorrect) {
        btn.classList.add("reveal-wrong-selected");
      }
    });

    if (els.kahootExplainCard) els.kahootExplainCard.classList.add("show");
    if (els.kahootNextBtn) {
      els.kahootNextBtn.style.display = "inline-block";
      els.kahootNextBtn.textContent = (kahootState.currentIndex + 1 >= kahootState.questions.length) ? "ดูผลคะแนนรวม 🏆" : "ข้อถัดไป →";
    }
  }

  function showKahootPodium() {
    soundFanfare();
    if (els.kahootBody) {
      els.kahootBody.innerHTML =
        '<div class="kahoot-podium">' +
        '<div class="podium-icon">🏆</div>' +
        '<h1 class="podium-title">จบการแข่งขัน Quiz Show!</h1>' +
        '<p style="color:rgba(255,255,255,0.7); font-size:16px;">ยอดเยี่ยมมาก! สรุปคะแนนรวมทั้งหมดของคุณ</p>' +
        '<div class="podium-score">' + kahootState.score.toLocaleString() + ' แต้ม</div>' +
        '<div style="display:flex; gap:12px; margin-top:16px;">' +
        '<button type="button" class="kahoot-next-btn" id="restartKahootBtn">🎮 เล่นใหม่อีกครั้ง</button>' +
        '<button type="button" class="kahoot-close-btn" id="exitKahootBtn" style="padding:10px 22px; font-size:15px;">✕ ปิดหน้าต่าง</button>' +
        '</div>' +
        '</div>';

      var rBtn = document.getElementById("restartKahootBtn");
      var eBtn = document.getElementById("exitKahootBtn");
      if (rBtn) rBtn.onclick = startKahootGame;
      if (eBtn) eBtn.onclick = closeKahootGame;
    }
  }

  /* ---------------- Theme Switcher ---------------- */

  function applyTheme(themeName) {
    state.theme = themeName;
    localStorage.setItem("answer_code_theme", themeName);
    document.documentElement.setAttribute("data-theme", themeName);

    if (els.themeIcon && els.themeLabel) {
      if (themeName === "dark") {
        els.themeIcon.textContent = "🌙";
        els.themeLabel.textContent = "โหมดมืด (Dark)";
      } else if (themeName === "projector") {
        els.themeIcon.textContent = "📽️";
        els.themeLabel.textContent = "โหมดโปรเจกเตอร์";
      } else {
        els.themeIcon.textContent = "☀️";
        els.themeLabel.textContent = "โหมดสว่าง (Light)";
      }
    }
  }

  function toggleNextTheme() {
    if (state.theme === "light") {
      applyTheme("dark");
    } else if (state.theme === "dark") {
      applyTheme("projector");
    } else {
      applyTheme("light");
    }
  }

  /* ---------------- Wire Interactions ---------------- */

  function wireInteractions() {
    var units = Array.prototype.slice.call(document.querySelectorAll(".unit"));
    var navItems = Array.prototype.slice.call(document.querySelectorAll(".unit-nav li"));

    function applyFilters() {
      var q = els.searchBox ? els.searchBox.value.trim().toLowerCase() : "";
      var cat = state.activeCategory;
      var anyVisible = false;

      checkBookSuggestions(q);

      units.forEach(function (unit) {
        var unitCat = unit.getAttribute("data-category");
        var catMatch = (cat === "all") || (cat === "bookmarks") || (unitCat === cat);

        var unitQcards = unit.querySelectorAll(".qcard");
        var unitSacards = unit.querySelectorAll(".sacard");
        var unitHasTextMatch = !q || unit.getAttribute("data-title").indexOf(q) !== -1;
        var visibleInUnit = 0;

        unitQcards.forEach(function (card) {
          var isCardBookmarked = card.getAttribute("data-bookmarked") === "true";
          var bookmarkMatch = (cat !== "bookmarks") || isCardBookmarked;
          var searchMatch = !q || card.getAttribute("data-search").indexOf(q) !== -1;
          var match = bookmarkMatch && searchMatch;
          card.classList.toggle("hidden-by-search", !match);
          if (match) visibleInUnit++;
        });

        unitSacards.forEach(function (card) {
          var bookmarkMatch = (cat !== "bookmarks");
          var searchMatch = !q || card.getAttribute("data-search").indexOf(q) !== -1;
          var match = bookmarkMatch && searchMatch;
          card.classList.toggle("hidden-by-search", !match);
          if (match) visibleInUnit++;
        });

        var showUnit = catMatch && (visibleInUnit > 0 || (unitHasTextMatch && cat !== "bookmarks") || (!q && cat !== "bookmarks"));
        unit.classList.toggle("filtered-out", !showUnit);
        if (showUnit) anyVisible = true;

        var navLi = document.querySelector('.unit-nav li[data-unit="' + unit.getAttribute("data-unit") + '"]');
        if (navLi) navLi.classList.toggle("filtered-out", !catMatch);
      });

      if (els.noResults) {
        els.noResults.style.display = (!anyVisible && units.length > 0) ? "block" : "none";
      }
    }

    if (els.searchBox) {
      els.searchBox.oninput = applyFilters;
    }

    if (els.catChips) {
      els.catChips.onclick = function (e) {
        var btn = e.target.closest(".cat-chip");
        if (!btn) return;
        state.activeCategory = btn.getAttribute("data-cat");
        Array.prototype.forEach.call(els.catChips.children, function (c) {
          c.classList.toggle("active", c === btn);
        });
        applyFilters();
      };
    }

    if (els.toggleBtn) {
      els.toggleBtn.onclick = function () {
        var hidden = document.body.classList.toggle("answers-hidden");
        els.toggleBtn.textContent = hidden ? "แสดงเฉลยทั้งหมด" : "ซ่อนเฉลย / ซ้อมทำข้อสอบ";
        els.toggleBtn.setAttribute("data-state", hidden ? "hidden" : "show");
      };
    }

    /* Star Bookmarking */
    document.querySelectorAll(".star-btn").forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        var cardId = btn.getAttribute("data-card-id");
        var cardEl = document.getElementById(cardId);
        if (state.bookmarks[cardId]) {
          delete state.bookmarks[cardId];
          btn.classList.remove("active");
          if (cardEl) cardEl.setAttribute("data-bookmarked", "false");
        } else {
          state.bookmarks[cardId] = true;
          btn.classList.add("active");
          if (cardEl) cardEl.setAttribute("data-bookmarked", "true");
        }
        localStorage.setItem("answer_code_bookmarks", JSON.stringify(state.bookmarks));
      };
    });

    /* TTS Audio Speaker */
    document.querySelectorAll(".tts-btn").forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        var text = btn.getAttribute("data-text");
        btn.classList.add("speaking");
        speakThai(text, function () {
          btn.classList.remove("speaking");
        });
      };
    });

    /* Interactive Quiz Selection per Card */
    document.querySelectorAll(".choice").forEach(function (choiceEl) {
      choiceEl.onclick = function () {
        if (!document.body.classList.contains("answers-hidden")) return;
        var qcard = choiceEl.closest(".qcard");
        if (!qcard || qcard.classList.contains("quiz-checked")) return;

        var isAlreadySelected = choiceEl.classList.contains("selected");
        qcard.querySelectorAll(".choice").forEach(function (c) { c.classList.remove("selected"); });

        if (!isAlreadySelected) {
          choiceEl.classList.add("selected");
        }
      };
    });

    /* Interactive Quiz Bar per Unit */
    document.querySelectorAll(".unit-quiz-bar").forEach(function (bar) {
      var unitEl = bar.closest(".unit");
      if (!unitEl) return;

      var checkBtn = bar.querySelector(".quiz-check-btn");
      var resetBtn = bar.querySelector(".quiz-reset-btn");
      var badgeEl = bar.querySelector(".unit-score-badge");

      if (checkBtn) {
        checkBtn.onclick = function () {
          var qcards = unitEl.querySelectorAll(".qcard");
          var total = qcards.length;
          var correctCount = 0;

          qcards.forEach(function (card) {
            var correctLetter = card.getAttribute("data-correct");
            var selectedChoice = card.querySelector(".choice.selected");
            var selectedLetter = selectedChoice ? selectedChoice.getAttribute("data-letter") : null;

            card.classList.add("quiz-checked");

            if (selectedLetter === correctLetter) {
              correctCount++;
            } else if (selectedChoice) {
              selectedChoice.classList.add("wrong");
            }
          });

          if (badgeEl) {
            var pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
            badgeEl.textContent = "🎯 คะแนน: " + correctCount + "/" + total + " (" + pct + "%)";
            badgeEl.className = "unit-score-badge show " + (pct >= 60 ? "pass" : "fail");
            if (pct >= 60) soundCorrect(); else soundWrong();
          }
        };
      }

      if (resetBtn) {
        resetBtn.onclick = function () {
          var qcards = unitEl.querySelectorAll(".qcard");
          qcards.forEach(function (card) {
            card.classList.remove("quiz-checked");
            card.querySelectorAll(".choice").forEach(function (c) {
              c.classList.remove("selected", "wrong");
            });
          });
          if (badgeEl) {
            badgeEl.className = "unit-score-badge";
            badgeEl.textContent = "";
          }
        };
      }
    });

    /* Scroll-spy trace line */
    var navByUnit = {};
    navItems.forEach(function (li) { navByUnit[li.getAttribute("data-unit")] = li; });

    function setActive(unitNum) {
      navItems.forEach(function (li) { li.classList.remove("active"); });
      var li = navByUnit[unitNum];
      if (!li || !els.navList || !els.traceGlow) return;
      li.classList.add("active");
      var listRect = els.navList.getBoundingClientRect();
      var liRect = li.getBoundingClientRect();
      var top = liRect.top - listRect.top;
      els.traceGlow.style.top = Math.max(0, top - 4) + "px";
      els.traceGlow.style.height = (liRect.height + 8) + "px";
    }

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              var uNum = entry.target.getAttribute("data-unit");
              setActive(uNum);
              if (state.activeBook && state.activeBook.meta) {
                syncURL(state.activeBook.meta.code || state.activeBookId, uNum);
              }
            }
          });
        },
        { rootMargin: "-15% 0px -70% 0px", threshold: 0 }
      );
      units.forEach(function (u) { observer.observe(u); });
    }
    window.requestAnimationFrame(function () { setActive("1"); });
  }

  /* ---------------- Global Listeners Setup ---------------- */

  function setupGlobalEvents() {
    applyTheme(state.theme);

    if (els.themeToggleBtn) {
      els.themeToggleBtn.addEventListener("click", toggleNextTheme);
    }

    if (els.bookSelect) {
      els.bookSelect.addEventListener("change", function () {
        selectBook(els.bookSelect.value);
      });
    }

    if (els.bookSuggestions) {
      els.bookSuggestions.addEventListener("click", function (e) {
        var item = e.target.closest(".book-suggestion-item");
        if (!item) return;
        var bookId = item.getAttribute("data-book-id");
        if (bookId) selectBook(bookId);
      });
    }

    /* Print Modal */
    if (els.openPrintModalBtn) els.openPrintModalBtn.addEventListener("click", function () { if (els.printModal) els.printModal.style.display = "flex"; });
    if (els.closePrintModalBtn) els.closePrintModalBtn.addEventListener("click", function () { if (els.printModal) els.printModal.style.display = "none"; });
    if (els.printExamBtn) {
      els.printExamBtn.addEventListener("click", function () {
        if (els.printModal) els.printModal.style.display = "none";
        document.body.classList.add("print-exam");
        window.print();
        window.addEventListener("afterprint", function handler() {
          document.body.classList.remove("print-exam");
          window.removeEventListener("afterprint", handler);
        });
      });
    }
    if (els.printKeyBtn) {
      els.printKeyBtn.addEventListener("click", function () {
        if (els.printModal) els.printModal.style.display = "none";
        document.body.classList.remove("print-exam", "answers-hidden");
        window.print();
      });
    }

    /* Spotlight (Ctrl + K) */
    if (els.spotlightTriggerBtn) els.spotlightTriggerBtn.addEventListener("click", openSpotlight);
    if (els.spotlightInput) {
      els.spotlightInput.addEventListener("input", function () {
        renderSpotlightResults(els.spotlightInput.value);
      });
    }
    if (els.spotlightResults) {
      els.spotlightResults.addEventListener("click", function (e) {
        var item = e.target.closest(".spotlight-item");
        if (!item) return;
        var bId = item.getAttribute("data-book-id");
        var uNum = item.getAttribute("data-unit");
        closeSpotlight();
        selectBook(bId, uNum);
      });
    }

    /* Exam Builder Modal */
    if (els.openExamBuilderBtn) els.openExamBuilderBtn.addEventListener("click", function () { if (els.examBuilderModal) els.examBuilderModal.style.display = "flex"; });
    if (els.closeExamModalBtn) els.closeExamModalBtn.addEventListener("click", function () { if (els.examBuilderModal) els.examBuilderModal.style.display = "none"; });
    if (els.startExamQuizBtn) els.startExamQuizBtn.addEventListener("click", startExamQuiz);
    if (els.printExamDirectBtn) {
      els.printExamDirectBtn.addEventListener("click", function () {
        startExamQuiz();
        setTimeout(function () {
          document.body.classList.add("print-exam");
          window.print();
          window.addEventListener("afterprint", function handler() {
            document.body.classList.remove("print-exam");
            window.removeEventListener("afterprint", handler);
          });
        }, 200);
      });
    }

    /* Kahoot Mode Events */
    if (els.startKahootBtn) els.startKahootBtn.addEventListener("click", startKahootGame);
    if (els.closeKahootBtn) els.closeKahootBtn.addEventListener("click", closeKahootGame);
    if (els.kahootNextBtn) {
      els.kahootNextBtn.addEventListener("click", function () {
        kahootState.currentIndex++;
        loadKahootQuestion();
      });
    }

    document.querySelectorAll(".kahoot-choice").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var letter = btn.getAttribute("data-letter");
        handleKahootAnswer(letter);
      });
    });

    /* Keyboard Shortcuts */
    document.addEventListener("keydown", function (e) {
      // Ctrl + K or Cmd + K -> Open Spotlight
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openSpotlight();
        return;
      }

      // Escape -> Close all modals
      if (e.key === "Escape") {
        closeSpotlight();
        if (els.printModal) els.printModal.style.display = "none";
        if (els.examBuilderModal) els.examBuilderModal.style.display = "none";
        if (els.kahootArena && els.kahootArena.style.display === "flex") closeKahootGame();
        return;
      }

      // If Kahoot game is active, allow 1,2,3,4 or A,B,C,D
      if (els.kahootArena && els.kahootArena.style.display === "flex") {
        if (!kahootState.hasAnswered) {
          if (e.key === "1" || e.key.toLowerCase() === "a") handleKahootAnswer("ก");
          if (e.key === "2" || e.key.toLowerCase() === "b") handleKahootAnswer("ข");
          if (e.key === "3" || e.key.toLowerCase() === "c") handleKahootAnswer("ค");
          if (e.key === "4" || e.key.toLowerCase() === "d") handleKahootAnswer("ง");
        } else if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") {
          if (els.kahootNextBtn && els.kahootNextBtn.style.display !== "none") {
            els.kahootNextBtn.click();
          }
        }
        return;
      }

      // Normal navigation shortcuts when not typing in an input
      var tag = (document.activeElement && document.activeElement.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key.toLowerCase() === "h") {
        if (els.toggleBtn) els.toggleBtn.click();
      } else if (e.key.toLowerCase() === "p") {
        if (els.openPrintModalBtn) els.openPrintModalBtn.click();
      }
    });

    /* Mobile menu */
    var sidebar = document.getElementById("sidebar");
    var menuBtn = document.getElementById("menuBtn");
    var scrim = document.getElementById("scrim");
    function openMenu() { if (sidebar && scrim) { sidebar.classList.add("open"); scrim.classList.add("show"); } }
    function closeMenu() { if (sidebar && scrim) { sidebar.classList.remove("open"); scrim.classList.remove("show"); } }
    if (menuBtn) menuBtn.addEventListener("click", openMenu);
    if (scrim) scrim.addEventListener("click", closeMenu);
    document.addEventListener("click", function (e) {
      if (e.target.closest(".unit-nav a")) closeMenu();
    });
  }

  /* ---------------- Boot ---------------- */

  function boot(opts) {
    opts = opts || {};
    if (!(window.firebase && firebase.firestore)) {
      if (els.content) {
        els.content.innerHTML =
          '<div class="error-box">ไม่พบ Firestore SDK กรุณาตรวจสอบว่า index.html โหลดสคริปต์ firebase-firestore-compat.js แล้ว</div>';
      }
      return;
    }

    setupGlobalEvents();

    firebase.firestore().collection("answerkey").get()
      .then(function (snap) {
        if (snap.empty) {
          throw new Error("ไม่พบข้อมูลใน Firestore (ยังไม่ได้ seed ข้อมูล — ดู README ส่วน seed.html)");
        }

        var books = [];
        var codeSet = {};

        snap.forEach(function (doc) {
          var data = doc.data();
          if (data && (data.units || data.meta)) {
            data._docId = doc.id;
            var code = (data.meta && data.meta.code) ? data.meta.code : doc.id;
            if (!codeSet[code] || doc.id !== "data") {
              codeSet[code] = true;
              books.push(data);
            }
          }
        });

        if (books.length === 0) {
          throw new Error("ไม่พบโครงสร้างข้อมูลหนังสือใน collection 'answerkey'");
        }

        state.books = books;
        populateBookSelect();

        var urlParams = new URLSearchParams(window.location.search);
        var targetBookCode = urlParams.get("book");
        var hash = window.location.hash.replace(/^#/, "");
        var targetUnit = null;

        if (hash.startsWith("unit-")) {
          targetUnit = hash.replace("unit-", "");
        } else if (!targetBookCode && hash) {
          targetBookCode = hash;
        }

        var bookMatch = null;
        if (targetBookCode) {
          bookMatch = books.find(function (b) {
            return b._docId === targetBookCode || (b.meta && b.meta.code === targetBookCode);
          });
        }

        selectBook(bookMatch ? bookMatch._docId : books[0]._docId, targetUnit);

        if (opts.onSuccess) opts.onSuccess();
      })
      .catch(function (err) {
        if (err && err.code === "permission-denied" && opts.onPermissionDenied) {
          opts.onPermissionDenied();
          return;
        }
        if (els.content) {
          els.content.innerHTML =
            '<div class="error-box">โหลดข้อมูลไม่สำเร็จ (' + esc(err.message) + ") " +
            "หากเพิ่งตั้งค่าระบบใหม่ ตรวจสอบว่า (1) เปิดใช้ Firestore ในโปรเจกต์ Firebase แล้ว " +
            "(2) ตั้งค่า Security Rules ตามที่ README ระบุ และ (3) รัน seed.html เพื่ออัปโหลดข้อมูลเข้า Firestore</div>";
        }
        if (opts.onSuccess) opts.onSuccess();
      });
  }

  window.AnswerCodeApp = { boot: boot, selectBook: selectBook, startKahootGame: startKahootGame };
  if (!window.ANSWER_CODE_REQUIRES_AUTH) {
    boot();
  }
})();
