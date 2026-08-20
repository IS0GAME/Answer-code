(function () {
  "use strict";

  var cfg = window.FIREBASE_CONFIG || {};
  var isConfigured = cfg.apiKey && cfg.apiKey.indexOf("YOUR_") !== 0;

  var els = {
    setupScreen: document.getElementById("setupScreen"),
    loginScreen: document.getElementById("loginScreen"),
    pendingScreen: document.getElementById("pendingScreen"),
    appShell: document.getElementById("appShell"),

    loginForm: document.getElementById("loginForm"),
    loginEmail: document.getElementById("loginEmail"),
    loginPassword: document.getElementById("loginPassword"),
    loginError: document.getElementById("loginError"),
    loginSubmit: document.getElementById("loginSubmit"),
    showRegisterLink: document.getElementById("showRegisterLink"),

    registerForm: document.getElementById("registerForm"),
    registerEmail: document.getElementById("registerEmail"),
    registerPassword: document.getElementById("registerPassword"),
    registerPassword2: document.getElementById("registerPassword2"),
    registerError: document.getElementById("registerError"),
    registerSubmit: document.getElementById("registerSubmit"),
    showLoginLink: document.getElementById("showLoginLink"),

    loginCard: document.getElementById("loginCard"),
    registerCard: document.getElementById("registerCard"),

    pendingEmail: document.getElementById("pendingEmail"),
    pendingRetryBtn: document.getElementById("pendingRetryBtn"),
    pendingLogoutBtn: document.getElementById("pendingLogoutBtn"),

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
    hide(els.pendingScreen);
    hide(els.appShell);
    return;
  }

  firebase.initializeApp(cfg);
  var auth = firebase.auth();
  var db = firebase.firestore();

  /* ---------------- Login / register form toggle ---------------- */

  if (els.showRegisterLink) {
    els.showRegisterLink.addEventListener("click", function (e) {
      e.preventDefault();
      hide(els.loginCard);
      show(els.registerCard);
    });
  }
  if (els.showLoginLink) {
    els.showLoginLink.addEventListener("click", function (e) {
      e.preventDefault();
      hide(els.registerCard);
      show(els.loginCard);
    });
  }

  /* ---------------- Error messages ---------------- */

  function friendlyError(code) {
    var map = {
      "auth/invalid-email": "รูปแบบอีเมลไม่ถูกต้อง",
      "auth/user-not-found": "ไม่พบบัญชีนี้ในระบบ",
      "auth/wrong-password": "รหัสผ่านไม่ถูกต้อง",
      "auth/invalid-credential": "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
      "auth/too-many-requests": "ลองผิดหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่",
      "auth/user-disabled": "บัญชีนี้ถูกระงับการใช้งาน",
      "auth/email-already-in-use": "อีเมลนี้มีบัญชีอยู่แล้ว ลองเข้าสู่ระบบแทน",
      "auth/weak-password": "รหัสผ่านสั้นเกินไป (อย่างน้อย 6 ตัวอักษร)",
    };
    return map[code] || "ทำรายการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
  }

  /* ---------------- Login ---------------- */

  function setLoginLoading(loading) {
    els.loginSubmit.disabled = loading;
    els.loginSubmit.textContent = loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ";
  }

  els.loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    els.loginError.style.display = "none";
    setLoginLoading(true);
    auth
      .signInWithEmailAndPassword(els.loginEmail.value.trim(), els.loginPassword.value)
      .catch(function (err) {
        els.loginError.textContent = friendlyError(err.code);
        els.loginError.style.display = "block";
      })
      .finally(function () { setLoginLoading(false); });
  });

  /* ---------------- Register ---------------- */

  function setRegisterLoading(loading) {
    els.registerSubmit.disabled = loading;
    els.registerSubmit.textContent = loading ? "กำลังสมัคร..." : "สมัครสมาชิก";
  }

  if (els.registerForm) {
    els.registerForm.addEventListener("submit", function (e) {
      e.preventDefault();
      els.registerError.style.display = "none";

      var email = els.registerEmail.value.trim();
      var pass = els.registerPassword.value;
      var pass2 = els.registerPassword2.value;

      if (pass !== pass2) {
        els.registerError.textContent = "รหัสผ่านทั้งสองช่องไม่ตรงกัน";
        els.registerError.style.display = "block";
        return;
      }

      setRegisterLoading(true);
      auth.createUserWithEmailAndPassword(email, pass)
        .then(function (cred) {
          return db.collection("users").doc(cred.user.uid).set({
            email: email,
            status: "pending",
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
        })
        .catch(function (err) {
          els.registerError.textContent = friendlyError(err.code);
          els.registerError.style.display = "block";
        })
        .finally(function () { setRegisterLoading(false); });
    });
  }

  /* ---------------- Logout ---------------- */

  function doLogout() { auth.signOut(); }
  if (els.logoutBtn) els.logoutBtn.addEventListener("click", doLogout);
  if (els.pendingLogoutBtn) els.pendingLogoutBtn.addEventListener("click", doLogout);

  /* ---------------- Pending-approval screen ---------------- */

  function showPending(user) {
    hide(els.setupScreen);
    hide(els.loginScreen);
    hide(els.appShell);
    show(els.pendingScreen);
    if (els.pendingEmail) els.pendingEmail.textContent = user.email;
  }

  if (els.pendingRetryBtn) {
    els.pendingRetryBtn.addEventListener("click", function () {
      var user = auth.currentUser;
      if (user) attemptAccess(user);
    });
  }

  /* ---------------- Access attempt: try loading data, react to the result ---------------- */

  function attemptAccess(user) {
    hide(els.setupScreen);
    hide(els.loginScreen);
    hide(els.pendingScreen);
    if (els.userBadge) els.userBadge.textContent = user.email;

    if (!(window.AnswerCodeApp && window.AnswerCodeApp.boot)) return;
    window.AnswerCodeApp.boot({
      onPermissionDenied: function () { showPending(user); },
      onSuccess: function () { show(els.appShell); },
    });
  }

  auth.onAuthStateChanged(function (user) {
    if (user) {
      attemptAccess(user);
    } else {
      hide(els.setupScreen);
      hide(els.pendingScreen);
      hide(els.appShell);
      show(els.loginScreen);
      show(els.loginCard);
      hide(els.registerCard);
      els.loginPassword.value = "";
      if (els.registerForm) els.registerForm.reset();
    }
  });
})();
