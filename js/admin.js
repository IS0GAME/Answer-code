(function () {
  "use strict";

  var cfg = window.FIREBASE_CONFIG || {};
  var isConfigured = cfg.apiKey && cfg.apiKey.indexOf("YOUR_") !== 0;

  var els = {
    setupScreen: document.getElementById("setupScreen"),
    loginScreen: document.getElementById("loginScreen"),
    checkingScreen: document.getElementById("checkingScreen"),
    deniedScreen: document.getElementById("deniedScreen"),
    adminShell: document.getElementById("adminShell"),

    loginCard: document.getElementById("loginCard"),
    forgotCard: document.getElementById("forgotCard"),

    loginForm: document.getElementById("loginForm"),
    loginEmail: document.getElementById("loginEmail"),
    loginPassword: document.getElementById("loginPassword"),
    loginError: document.getElementById("loginError"),
    loginSubmit: document.getElementById("loginSubmit"),
    showForgotLink: document.getElementById("showForgotLink"),
    backToLoginLink: document.getElementById("backToLoginLink"),

    forgotForm: document.getElementById("forgotForm"),
    forgotEmail: document.getElementById("forgotEmail"),
    forgotError: document.getElementById("forgotError"),
    forgotSuccess: document.getElementById("forgotSuccess"),
    forgotSubmit: document.getElementById("forgotSubmit"),

    deniedEmail: document.getElementById("deniedEmail"),
    deniedLogoutBtn: document.getElementById("deniedLogoutBtn"),

    userBadge: document.getElementById("userBadge"),
    logoutBtn: document.getElementById("logoutBtn"),

    pendingList: document.getElementById("pendingList"),
    approvedList: document.getElementById("approvedList"),
    rejectedList: document.getElementById("rejectedList"),
  };

  function show(el) { if (el) el.style.display = ""; }
  function hide(el) { if (el) el.style.display = "none"; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function hideAllGates() {
    hide(els.setupScreen);
    hide(els.loginScreen);
    hide(els.checkingScreen);
    hide(els.deniedScreen);
    hide(els.adminShell);
  }

  if (!isConfigured) {
    hideAllGates();
    show(els.setupScreen);
    return;
  }

  firebase.initializeApp(cfg);
  var auth = firebase.auth();
  var db = firebase.firestore();
  var functionsAvailable = !!(window.firebase && firebase.functions);
  var removeUserFn = functionsAvailable ? firebase.functions().httpsCallable("removeUser") : null;

  /* ---------------- Card switching (login / forgot password) ---------------- */

  function showCard(card) {
    hide(els.loginCard);
    hide(els.forgotCard);
    show(card);
  }
  if (els.showForgotLink) {
    els.showForgotLink.addEventListener("click", function (e) { e.preventDefault(); showCard(els.forgotCard); });
  }
  if (els.backToLoginLink) {
    els.backToLoginLink.addEventListener("click", function (e) { e.preventDefault(); showCard(els.loginCard); });
  }

  /* ---------------- Errors ---------------- */

  function friendlyError(code) {
    var map = {
      "auth/invalid-email": "รูปแบบอีเมลไม่ถูกต้อง",
      "auth/user-not-found": "ไม่พบบัญชีนี้ในระบบ",
      "auth/wrong-password": "รหัสผ่านไม่ถูกต้อง",
      "auth/invalid-credential": "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
      "auth/too-many-requests": "ลองผิดหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่",
      "auth/user-disabled": "บัญชีนี้ถูกระงับการใช้งาน",
    };
    return map[code] || "ทำรายการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
  }

  /* ---------------- Login ---------------- */

  function setLoading(loading) {
    els.loginSubmit.disabled = loading;
    els.loginSubmit.textContent = loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ";
  }

  els.loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    els.loginError.style.display = "none";
    setLoading(true);
    auth.signInWithEmailAndPassword(els.loginEmail.value.trim(), els.loginPassword.value)
      .catch(function (err) {
        els.loginError.textContent = friendlyError(err.code);
        els.loginError.style.display = "block";
      })
      .finally(function () { setLoading(false); });
  });

  /* ---------------- Forgot password ---------------- */

  function setForgotLoading(loading) {
    els.forgotSubmit.disabled = loading;
    els.forgotSubmit.textContent = loading ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน";
  }

  if (els.forgotForm) {
    els.forgotForm.addEventListener("submit", function (e) {
      e.preventDefault();
      els.forgotError.style.display = "none";
      els.forgotSuccess.style.display = "none";
      setForgotLoading(true);
      auth.sendPasswordResetEmail(els.forgotEmail.value.trim())
        .then(function () {
          els.forgotSuccess.textContent = "ส่งอีเมลรีเซ็ตรหัสผ่านแล้ว ตรวจสอบกล่องจดหมาย (รวมถึงถังขยะ/สแปม)";
          els.forgotSuccess.style.display = "block";
          els.forgotForm.reset();
        })
        .catch(function (err) {
          els.forgotError.textContent = friendlyError(err.code);
          els.forgotError.style.display = "block";
        })
        .finally(function () { setForgotLoading(false); });
    });
  }

  function doLogout() { auth.signOut(); }
  if (els.logoutBtn) els.logoutBtn.addEventListener("click", doLogout);
  if (els.deniedLogoutBtn) {
    els.deniedLogoutBtn.addEventListener("click", function (e) { e.preventDefault(); doLogout(); });
  }

  /* ---------------- Rendering ---------------- */

  function fmtDate(ts) {
    if (!ts || !ts.toDate) return "";
    try {
      return ts.toDate().toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
    } catch (e) { return ""; }
  }

  function row(email, meta, buttonsHtml) {
    return (
      '<div class="admin-row">' +
      '<span class="admin-row-email">' + esc(email) + "</span>" +
      (meta ? '<span class="admin-row-meta">' + esc(meta) + "</span>" : "") +
      '<span class="admin-row-actions">' + buttonsHtml + "</span></div>"
    );
  }

  function renderPending(docs) {
    if (docs.length === 0) { els.pendingList.innerHTML = '<div class="admin-empty">ไม่มีคำขอรออนุมัติ</div>'; return; }
    els.pendingList.innerHTML = docs.map(function (d) {
      var data = d.data();
      return row(data.email, fmtDate(data.createdAt),
        '<button class="admin-btn approve" data-action="approve" data-uid="' + esc(d.id) + '">อนุมัติ</button>' +
        '<button class="admin-btn reject" data-action="reject" data-uid="' + esc(d.id) + '">ปฏิเสธ</button>');
    }).join("");
  }

  function renderApproved(docs) {
    if (docs.length === 0) { els.approvedList.innerHTML = '<div class="admin-empty">ยังไม่มีผู้ใช้ที่อนุมัติแล้ว</div>'; return; }
    els.approvedList.innerHTML = docs.map(function (d) {
      var data = d.data();
      return row(data.email, null,
        '<button class="admin-btn revoke" data-action="revoke" data-uid="' + esc(d.id) + '">เพิกถอน</button>');
    }).join("");
  }

  function renderRejected(docs) {
    if (docs.length === 0) { els.rejectedList.innerHTML = '<div class="admin-empty">ไม่มีคำขอที่ถูกปฏิเสธ</div>'; return; }
    els.rejectedList.innerHTML = docs.map(function (d) {
      var data = d.data();
      return row(data.email, "บัญชี login ถูกลบแล้ว",
        '<button class="admin-btn reject" data-action="delete" data-uid="' + esc(d.id) + '">ลบข้อมูลออกจากระบบ</button>');
    }).join("");
  }

  function loadLists() {
    return Promise.all([
      db.collection("users").where("status", "==", "pending").get(),
      db.collection("users").where("status", "==", "approved").get(),
      db.collection("users").where("status", "==", "rejected").get(),
    ]).then(function (results) {
      renderPending(results[0].docs);
      renderApproved(results[1].docs);
      renderRejected(results[2].docs);
    });
  }

  /* ---------------- Actions ---------------- */

  var CONFIRM_MESSAGES = {
    reject: "ปฏิเสธคำขอนี้? ระบบจะลบบัญชี login ของผู้สมัครทันที กู้คืนไม่ได้ ต้องสมัครใหม่หากจะให้สิทธิ์ภายหลัง",
    revoke: "เพิกถอนสิทธิ์ผู้ใช้นี้? ระบบจะลบบัญชี login ทันที กู้คืนไม่ได้ ต้องสมัครใหม่หากจะให้สิทธิ์ภายหลัง",
    delete: "ลบข้อมูลนี้ออกจากระบบถาวร? (บัญชี login ถูกลบไปแล้วตั้งแต่ตอนปฏิเสธ/เพิกถอน ปุ่มนี้แค่ล้างรายการนี้ออกจากหน้าจอ)",
  };

  var actionsWired = false;
  function wireActions() {
    if (actionsWired) return;
    actionsWired = true;
    document.body.addEventListener("click", function (e) {
      var btn = e.target.closest(".admin-btn");
      if (!btn) return;
      var uid = btn.getAttribute("data-uid");
      var action = btn.getAttribute("data-action");

      if (CONFIRM_MESSAGES[action] && !window.confirm(CONFIRM_MESSAGES[action])) return;

      btn.disabled = true;
      var op;
      if (action === "approve") {
        op = db.collection("users").doc(uid).update({ status: "approved" });
      } else if (action === "reject" || action === "revoke") {
        if (!removeUserFn) {
          alert("ไม่พบ Cloud Function สำหรับลบบัญชี ตรวจสอบว่า deploy functions แล้วและโหลด firebase-functions-compat.js ใน admin.html (ดู README)");
          btn.disabled = false;
          return;
        }
        op = removeUserFn({ uid: uid });
      } else if (action === "delete") {
        op = db.collection("users").doc(uid).delete();
      } else {
        return;
      }

      op.then(loadLists).catch(function (err) {
        alert("ทำรายการไม่สำเร็จ: " + err.message);
        btn.disabled = false;
      });
    });
  }

  /* ---------------- Boot: is this user an admin? ---------------- */

  auth.onAuthStateChanged(function (user) {
    if (!user) {
      hideAllGates();
      show(els.loginScreen);
      showCard(els.loginCard);
      els.loginPassword.value = "";
      if (els.forgotForm) els.forgotForm.reset();
      if (els.forgotSuccess) els.forgotSuccess.style.display = "none";
      return;
    }

    hideAllGates();
    show(els.checkingScreen);
    if (els.userBadge) els.userBadge.textContent = user.email;

    // Probe: only an admin can query the users collection per Firestore rules.
    // permission-denied here means "not an admin", not a real error.
    db.collection("users").where("status", "==", "pending").get()
      .then(function (pendingSnap) {
        hideAllGates();
        show(els.adminShell);
        wireActions();
        renderPending(pendingSnap.docs);
        return Promise.all([
          db.collection("users").where("status", "==", "approved").get(),
          db.collection("users").where("status", "==", "rejected").get(),
        ]);
      })
      .then(function (results) {
        renderApproved(results[0].docs);
        renderRejected(results[1].docs);
      })
      .catch(function (err) {
        if (err && err.code === "permission-denied") {
          hideAllGates();
          show(els.deniedScreen);
          if (els.deniedEmail) els.deniedEmail.textContent = user.email;
        } else {
          hideAllGates();
          show(els.deniedScreen);
          if (els.deniedEmail) els.deniedEmail.textContent = user.email;
          alert("เกิดข้อผิดพลาด: " + err.message);
        }
      });
  });
})();
