(function () {
  "use strict";

  var cfg = window.FIREBASE_CONFIG || {};
  var isConfigured = cfg.apiKey && cfg.apiKey.indexOf("YOUR_") !== 0;

  var els = {
    setupScreen: document.getElementById("setupScreen"),
    loginScreen: document.getElementById("loginScreen"),
    deniedScreen: document.getElementById("deniedScreen"),
    adminShell: document.getElementById("adminShell"),

    loginForm: document.getElementById("loginForm"),
    loginEmail: document.getElementById("loginEmail"),
    loginPassword: document.getElementById("loginPassword"),
    loginError: document.getElementById("loginError"),
    loginSubmit: document.getElementById("loginSubmit"),

    deniedEmail: document.getElementById("deniedEmail"),
    deniedLogoutBtn: document.getElementById("deniedLogoutBtn"),

    userBadge: document.getElementById("userBadge"),
    logoutBtn: document.getElementById("logoutBtn"),

    pendingList: document.getElementById("pendingList"),
    approvedList: document.getElementById("approvedList"),
  };

  function show(el) { if (el) el.style.display = ""; }
  function hide(el) { if (el) el.style.display = "none"; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  if (!isConfigured) {
    show(els.setupScreen);
    hide(els.loginScreen);
    hide(els.deniedScreen);
    hide(els.adminShell);
    return;
  }

  firebase.initializeApp(cfg);
  var auth = firebase.auth();
  var db = firebase.firestore();

  /* ---------------- Login ---------------- */

  function friendlyError(code) {
    var map = {
      "auth/invalid-email": "รูปแบบอีเมลไม่ถูกต้อง",
      "auth/user-not-found": "ไม่พบบัญชีนี้ในระบบ",
      "auth/wrong-password": "รหัสผ่านไม่ถูกต้อง",
      "auth/invalid-credential": "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
      "auth/too-many-requests": "ลองผิดหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่",
      "auth/user-disabled": "บัญชีนี้ถูกระงับการใช้งาน",
    };
    return map[code] || "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
  }

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

  function renderPending(docs) {
    if (docs.length === 0) {
      els.pendingList.innerHTML = '<div class="admin-empty">ไม่มีคำขอรออนุมัติ</div>';
      return;
    }
    els.pendingList.innerHTML = docs.map(function (d) {
      var data = d.data();
      return (
        '<div class="admin-row">' +
        '<span class="admin-row-email">' + esc(data.email) + "</span>" +
        '<span class="admin-row-meta">' + esc(fmtDate(data.createdAt)) + "</span>" +
        '<span class="admin-row-actions">' +
        '<button class="admin-btn approve" data-action="approve" data-uid="' + esc(d.id) + '">อนุมัติ</button>' +
        '<button class="admin-btn reject" data-action="reject" data-uid="' + esc(d.id) + '">ปฏิเสธ</button>' +
        "</span></div>"
      );
    }).join("");
  }

  function renderApproved(docs) {
    if (docs.length === 0) {
      els.approvedList.innerHTML = '<div class="admin-empty">ยังไม่มีผู้ใช้ที่อนุมัติแล้ว</div>';
      return;
    }
    els.approvedList.innerHTML = docs.map(function (d) {
      var data = d.data();
      return (
        '<div class="admin-row">' +
        '<span class="admin-row-email">' + esc(data.email) + "</span>" +
        '<span class="admin-row-actions">' +
        '<button class="admin-btn revoke" data-action="revoke" data-uid="' + esc(d.id) + '">เพิกถอน</button>' +
        "</span></div>"
      );
    }).join("");
  }

  function loadLists() {
    return Promise.all([
      db.collection("users").where("status", "==", "pending").get(),
      db.collection("users").where("status", "==", "approved").get(),
    ]).then(function (results) {
      renderPending(results[0].docs);
      renderApproved(results[1].docs);
    });
  }

  /* ---------------- Actions ---------------- */

  var actionsWired = false;
  function wireActions() {
    if (actionsWired) return;
    actionsWired = true;
    document.body.addEventListener("click", function (e) {
      var btn = e.target.closest(".admin-btn");
      if (!btn) return;
      var uid = btn.getAttribute("data-uid");
      var action = btn.getAttribute("data-action");
      btn.disabled = true;

      var op;
      if (action === "approve") {
        op = db.collection("users").doc(uid).update({ status: "approved" });
      } else if (action === "reject" || action === "revoke") {
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
      hide(els.setupScreen);
      hide(els.deniedScreen);
      hide(els.adminShell);
      show(els.loginScreen);
      els.loginPassword.value = "";
      return;
    }

    if (els.userBadge) els.userBadge.textContent = user.email;

    // Probe: only an admin can query the users collection per Firestore rules.
    // permission-denied here means "not an admin", not a real error.
    db.collection("users").where("status", "==", "pending").get()
      .then(function (pendingSnap) {
        hide(els.setupScreen);
        hide(els.loginScreen);
        hide(els.deniedScreen);
        show(els.adminShell);
        wireActions();
        renderPending(pendingSnap.docs);
        return db.collection("users").where("status", "==", "approved").get();
      })
      .then(function (approvedSnap) {
        renderApproved(approvedSnap.docs);
      })
      .catch(function (err) {
        if (err && err.code === "permission-denied") {
          hide(els.setupScreen);
          hide(els.loginScreen);
          hide(els.adminShell);
          show(els.deniedScreen);
          if (els.deniedEmail) els.deniedEmail.textContent = user.email;
        } else {
          alert("เกิดข้อผิดพลาด: " + err.message);
        }
      });
  });
})();
