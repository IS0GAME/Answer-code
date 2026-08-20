(function () {
  "use strict";

  var LETTERS = ["ก", "ข", "ค", "ง"];
  var state = { data: null, activeCategory: "all" };

  var els = {
    content: document.getElementById("content"),
    navList: document.querySelector(".unit-nav ul"),
    traceGlow: document.querySelector(".trace-glow"),
    navRoot: document.getElementById("unitNav"),
    catChips: document.getElementById("catChips"),
    searchBox: document.getElementById("searchBox"),
    noResults: document.getElementById("noResults"),
    toggleBtn: document.getElementById("toggleAnswers"),
    specStrip: document.getElementById("specStrip"),
    sidebarFooter: document.getElementById("sidebarFooter"),
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------------- Rendering ---------------- */

  function renderChoice(letter, text, isCorrect) {
    var cls = "choice" + (isCorrect ? " correct" : "");
    var display = text && text.trim()
      ? esc(text)
      : '<span class="img-ph">[ดูรูปภาพประกอบในเอกสารต้นฉบับ]</span>';
    return (
      '<li class="' + cls + '"><span class="letter">' + letter + ".</span> " +
      '<span class="mark">&#10003;</span> ' + display + "</li>"
    );
  }

  function renderMcCard(unitNum, q) {
    var searchBlob = [q.question, LETTERS.map(function (l) { return q.choices[l] || ""; }).join(" "), q.explanation || ""]
      .join(" ").toLowerCase();
    var choicesHtml = LETTERS.map(function (l) {
      return renderChoice(l, q.choices[l], l === q.correct);
    }).join("");
    var noteHtml = q.note ? '<div class="notebox">&#9888; ' + esc(q.note) + "</div>" : "";
    var explainHtml = q.explanation
      ? '<div class="explain"><b>คำอธิบาย</b>&nbsp; ' + esc(q.explanation) + "</div>"
      : "";
    return (
      '<div class="qcard" data-search="' + esc(searchBlob) + '">' +
      '<div class="qhead"><span class="qnum">Q' + q.num + '</span><p class="qtext">' + esc(q.question) + "</p></div>" +
      '<ul class="choices">' + choicesHtml + "</ul>" +
      noteHtml + explainHtml +
      "</div>"
    );
  }

  function renderSaCard(item) {
    var lines = item.a || [];
    var searchBlob = (item.q + " " + lines.join(" ")).toLowerCase();
    var linesHtml = lines.map(function (l) { return "<p>" + esc(l) + "</p>"; }).join("");
    return (
      '<div class="sacard" data-search="' + esc(searchBlob) + '">' +
      '<div class="saq">' + esc(item.q) + "</div>" +
      '<div class="saanswer">' + linesHtml + "</div>" +
      "</div>"
    );
  }

  function categoryLabel(catId) {
    var cat = state.data.categories.find(function (c) { return c.id === catId; });
    return cat ? cat.label : catId;
  }

  function renderUnit(u) {
    var tag = String(u.num).padStart(2, "0");
    var mcHtml = u.mc.map(function (q) { return renderMcCard(u.num, q); }).join("");
    var saHtml = (u.sa || []).map(renderSaCard).join("");
    return (
      '<section class="unit" id="unit-' + u.num + '" data-unit="' + u.num + '" data-category="' + esc(u.category) +
      '" data-title="' + esc(u.title.toLowerCase()) + '">' +
      '<div class="unit-head"><span class="unit-num">' + tag + "</span><h2>" + esc(u.title) + "</h2>" +
      '<span class="unit-cat-tag">' + esc(categoryLabel(u.category)) + "</span></div>" +
      '<span class="part-label">ตอนที่ 1 &middot; แบบฝึกหัดปรนัย (' + u.mc.length + " ข้อ)</span>" +
      mcHtml +
      '<span class="part-label">ตอนที่ 2 &middot; คำถามอัตนัย</span>' +
      saHtml +
      "</section>"
    );
  }

  function renderNav(units) {
    els.navList.innerHTML = units.map(function (u) {
      var tag = String(u.num).padStart(2, "0");
      return (
        '<li data-unit="' + u.num + '" data-category="' + esc(u.category) + '">' +
        '<a href="#unit-' + u.num + '"><span class="unit-tag">' + tag + "</span>" +
        '<span class="unit-label">' + esc(u.title) + "</span></a></li>"
      );
    }).join("");
  }

  function renderCatChips(categories) {
    var chips = ['<button class="cat-chip active" data-cat="all">ทั้งหมด</button>'].concat(
      categories.map(function (c) {
        return '<button class="cat-chip" data-cat="' + esc(c.id) + '">' + esc(c.label) + "</button>";
      })
    );
    els.catChips.innerHTML = chips.join("");
  }

  function renderAll(data) {
    state.data = data;
    document.title = "เฉลยแบบฝึกหัด " + data.meta.course + " — คู่มือครูฝึกสอน";

    var totalMc = data.units.reduce(function (a, u) { return a + u.mc.length; }, 0);
    var totalSa = data.units.reduce(function (a, u) { return a + (u.sa ? u.sa.length : 0); }, 0);

    els.specStrip.innerHTML =
      '<span class="spec-chip">วิชา <b>' + esc(data.meta.course) + "</b></span>" +
      '<span class="spec-chip">รหัส <b>' + esc(data.meta.code) + "</b></span>" +
      '<span class="spec-chip">บอร์ด <b>' + esc(data.meta.board) + "</b></span>" +
      '<span class="spec-chip"><b>' + data.units.length + "</b> หน่วย</span>" +
      '<span class="spec-chip"><b>' + totalMc + "</b> ข้อปรนัย</span>";
    els.sidebarFooter.textContent =
      data.units.length + " หน่วย \u00b7 " + totalMc + " ข้อปรนัย \u00b7 " + totalSa + " ชุดคำถามอัตนัย";

    renderCatChips(data.categories);
    renderNav(data.units);
    els.content.innerHTML = data.units.map(renderUnit).join("");

    wireInteractions();
  }

  /* ---------------- Interactions ---------------- */

  function wireInteractions() {
    var qcards = Array.prototype.slice.call(document.querySelectorAll(".qcard"));
    var sacards = Array.prototype.slice.call(document.querySelectorAll(".sacard"));
    var units = Array.prototype.slice.call(document.querySelectorAll(".unit"));
    var navItems = Array.prototype.slice.call(document.querySelectorAll(".unit-nav li"));

    function applyFilters() {
      var q = els.searchBox.value.trim().toLowerCase();
      var cat = state.activeCategory;
      var anyVisible = false;

      units.forEach(function (unit) {
        var unitCat = unit.getAttribute("data-category");
        var catMatch = cat === "all" || unitCat === cat;

        var unitQcards = unit.querySelectorAll(".qcard");
        var unitSacards = unit.querySelectorAll(".sacard");
        var unitHasTextMatch = !q || unit.getAttribute("data-title").indexOf(q) !== -1;
        var visibleInUnit = 0;

        unitQcards.forEach(function (card) {
          var match = !q || card.getAttribute("data-search").indexOf(q) !== -1;
          card.classList.toggle("hidden-by-search", !match);
          if (match) visibleInUnit++;
        });
        unitSacards.forEach(function (card) {
          var match = !q || card.getAttribute("data-search").indexOf(q) !== -1;
          card.classList.toggle("hidden-by-search", !match);
          if (match) visibleInUnit++;
        });

        var showUnit = catMatch && (visibleInUnit > 0 || unitHasTextMatch || !q);
        unit.classList.toggle("filtered-out", !showUnit);
        if (showUnit) anyVisible = true;

        var navLi = document.querySelector('.unit-nav li[data-unit="' + unit.getAttribute("data-unit") + '"]');
        if (navLi) navLi.classList.toggle("filtered-out", !catMatch);
      });

      els.noResults.style.display = !anyVisible ? "block" : "none";
    }

    els.searchBox.addEventListener("input", applyFilters);

    els.catChips.addEventListener("click", function (e) {
      var btn = e.target.closest(".cat-chip");
      if (!btn) return;
      state.activeCategory = btn.getAttribute("data-cat");
      Array.prototype.forEach.call(els.catChips.children, function (c) {
        c.classList.toggle("active", c === btn);
      });
      applyFilters();
    });

    els.toggleBtn.addEventListener("click", function () {
      var hidden = document.body.classList.toggle("answers-hidden");
      els.toggleBtn.textContent = hidden ? "แสดงเฉลย" : "ซ่อนเฉลย";
      els.toggleBtn.setAttribute("data-state", hidden ? "hidden" : "show");
    });

    /* Scroll-spy trace line */
    var navByUnit = {};
    navItems.forEach(function (li) { navByUnit[li.getAttribute("data-unit")] = li; });

    function setActive(unitNum) {
      navItems.forEach(function (li) { li.classList.remove("active"); });
      var li = navByUnit[unitNum];
      if (!li) return;
      li.classList.add("active");
      var listRect = els.navList.getBoundingClientRect();
      var liRect = li.getBoundingClientRect();
      var top = liRect.top - listRect.top;
      els.traceGlow.style.top = Math.max(0, top - 4) + "px";
      els.traceGlow.style.height = liRect.height + 8 + "px";
    }

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) setActive(entry.target.getAttribute("data-unit"));
          });
        },
        { rootMargin: "-15% 0px -70% 0px", threshold: 0 }
      );
      units.forEach(function (u) { observer.observe(u); });
    }
    window.requestAnimationFrame(function () { setActive("1"); });

    /* Mobile menu */
    var sidebar = document.getElementById("sidebar");
    var menuBtn = document.getElementById("menuBtn");
    var scrim = document.getElementById("scrim");
    function openMenu() { sidebar.classList.add("open"); scrim.classList.add("show"); }
    function closeMenu() { sidebar.classList.remove("open"); scrim.classList.remove("show"); }
    if (menuBtn) menuBtn.addEventListener("click", openMenu);
    if (scrim) scrim.addEventListener("click", closeMenu);
    document.querySelectorAll(".unit-nav a").forEach(function (a) { a.addEventListener("click", closeMenu); });
  }

  /* ---------------- Boot ---------------- */

  function boot(opts) {
    opts = opts || {};
    if (!(window.firebase && firebase.firestore)) {
      els.content.innerHTML =
        '<div class="error-box">ไม่พบ Firestore SDK กรุณาตรวจสอบว่า index.html โหลดสคริปต์ firebase-firestore-compat.js แล้ว</div>';
      return;
    }
    firebase.firestore().collection("answerkey").doc("data").get()
      .then(function (snap) {
        if (!snap.exists) {
          throw new Error("ไม่พบข้อมูลใน Firestore (ยังไม่ได้ seed ข้อมูล — ดู README ส่วน seed.html)");
        }
        return snap.data();
      })
      .then(function (data) {
        renderAll(data);
        if (opts.onSuccess) opts.onSuccess();
      })
      .catch(function (err) {
        if (err && err.code === "permission-denied" && opts.onPermissionDenied) {
          opts.onPermissionDenied();
          return;
        }
        els.content.innerHTML =
          '<div class="error-box">โหลดข้อมูลไม่สำเร็จ (' + esc(err.message) + ") " +
          "หากเพิ่งตั้งค่าระบบใหม่ ตรวจสอบว่า (1) เปิดใช้ Firestore ในโปรเจกต์ Firebase แล้ว " +
          "(2) ตั้งค่า Security Rules ตามที่ README ระบุ และ (3) รัน seed.html เพื่ออัปโหลดข้อมูลเข้า Firestore ครั้งแรกแล้ว</div>";
        if (opts.onSuccess) opts.onSuccess(); // still reveal the shell so the error is visible
      });
  }

  // Exposed so auth.js can trigger loading only after a successful login.
  // If this page is used without the login gate, boot immediately.
  window.AnswerCodeApp = { boot: boot };
  if (!window.ANSWER_CODE_REQUIRES_AUTH) {
    boot();
  }
})();
