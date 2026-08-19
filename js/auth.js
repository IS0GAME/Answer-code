(function () {
  "use strict";

  var cfg = window.FIREBASE_CONFIG || {};
  var isConfigured = cfg.apiKey && cfg.apiKey.indexOf("YOUR_") !== 0;

  var els = {
    setupScreen: document.getElementById("setupScreen"),
    loginScreen: document.getElementById("loginScreen"),
    appShell: document.getElementById("appShell"),
    loginForm: document.getElementById("loginForm"),
    loginEmail: document.getElementById("loginEmail"),
    loginPassword: document.getElementById("loginPassword"),
    loginError: document.getElementById("loginError"),
    loginSubmit: document.getElementById("loginSubmit"),
    userBadge: document.getElementById("userBadge"),
    logoutBtn: document.getElementById("logoutBtn"),
  };

  function show(el) { if (el) el.style.display = ""; }
  function hide(el) { if (el) el.style.display = "none"; }

  if (!isConfigured) {
    // No Firebase project wired up yet — tell the developer clearly instead of
    // failing silently or (worse) letting anyone in.
    show(els.setupScreen);
    hide(els.loginScreen);
    hide(els.appShell);
    return;
  }

  firebase.initializeApp(cfg);
  var auth = firebase.auth();

  function setLoading(loading) {
    els.loginSubmit.disabled = loading;
    els.loginSubmit.textContent = loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ";
  }

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

  els.loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    els.loginError.style.display = "none";
    setLoading(true);
    auth
      .signInWithEmailAndPassword(els.loginEmail.value.trim(), els.loginPassword.value)
      .catch(function (err) {
        els.loginError.textContent = friendlyError(err.code);
        els.loginError.style.display = "block";
      })
      .finally(function () { setLoading(false); });
  });

  if (els.logoutBtn) {
    els.logoutBtn.addEventListener("click", function () { auth.signOut(); });
  }

  auth.onAuthStateChanged(function (user) {
    if (user) {
      hide(els.setupScreen);
      hide(els.loginScreen);
      show(els.appShell);
      if (els.userBadge) els.userBadge.textContent = user.email;
      if (window.AnswerCodeApp && !window.AnswerCodeApp._booted) {
        window.AnswerCodeApp._booted = true;
        window.AnswerCodeApp.boot();
      }
    } else {
      hide(els.setupScreen);
      hide(els.appShell);
      show(els.loginScreen);
      els.loginPassword.value = "";
    }
  });
})();
