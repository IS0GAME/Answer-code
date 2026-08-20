(function () {
  "use strict";

  var cfg = window.FIREBASE_CONFIG || {};
  var isConfigured = cfg.apiKey && cfg.apiKey.indexOf("YOUR_") !== 0;

  var els = {
    setupScreen: document.getElementById("setupScreen"),
    loginScreen: document.getElementById("loginScreen"),
    checkingScreen: document.getElementById("checkingScreen"),
    pendingScreen: document.getElementById("pendingScreen"),
    rejectedScreen: document.getElementById("rejectedScreen"),
    appShell: document.getElementById("appShell"),

    loginCard: document.getElementById("loginCard"),
    registerCard: document.getElementById("registerCard"),
    forgotCard: document.getElementById("forgotCard"),

    loginForm: document.getElementById("loginForm"),
    loginEmail: document.getElementById("loginEmail"),
    loginPassword: document.getElementById("loginPassword"),
    loginError: document.getElementById("loginError"),
    loginSubmit: document.getElementById("loginSubmit"),
    showRegisterLink: document.getElementById("showRegisterLink"),
    showForgotLink: document.getElementById("showForgotLink"),

    registerForm: document.getElementById("registerForm"),
    registerEmail: document.getElementById("registerEmail"),
    registerPassword: document.getElementById("registerPassword"),
    registerPassword2: document.getElementById("registerPassword2"),
    registerError: document.getElementById("registerError"),
    registerSubmit: document.getElementById("registerSubmit"),
    showLoginLink: document.getElementById("showLoginLink"),

    forgotForm: document.getElementById("forgotForm"),
    forgotEmail: document.getElementById("forgotEmail"),
    forgotError: document.getElementById("forgotError"),
    forgotSuccess: document.getElementById("forgotSuccess"),
    forgotSubmit: document.getElementById("forgotSubmit"),
    backToLoginLink: document.getElementById("backToLoginLink"),

    pendingEmail: document.getElementById("pendingEmail"),
    pendingRetryBtn: document.getElementById("pendingRetryBtn"),
    pendingLogoutBtn: document.getElementById("pendingLogoutBtn"),

    rejectedEmail: document.getElementById("rejectedEmail"),
    rejectedRetryBtn: document.getElementById("rejectedRetryBtn"),
    rejectedLogoutBtn: document.getElementById("rejectedLogoutBtn"),

    userBadge: document.getElementById("userBadge"),
    logoutBtn: document.getElementById("logoutBtn"),
  };

  function show(el) { if (el) el.style.display = ""; }
  function hide(el) { if (el) el.style.display = "none"; }

  function hideAllGates() {
    hide(els.setupScreen);
    hide(els.loginScreen);
    hide(els.checkingScreen);
    hide(els.pendingScreen);
    hide(els.rejectedScreen);
    hide(els.appShell);
  }

  if (!isConfigured) {
    // No Firebase project wired up yet — tell the developer clearly instead of
    // failing silently or (worse) letting anyone in.
    hideAllGates();
    show(els.setupScreen);
    return;
  }

  firebase.initializeApp(cfg);
  var auth = firebase.auth();
  var db = firebase.firestore();

  /* ---------------- Card switching (login / register / forgot password) ---------------- */

  function showCard(card) {
    hide(els.loginCard);
    hide(els.registerCard);
    hide(els.forgotCard);
    show(card);
  }

  if (els.showRegisterLink) {
    els.showRegisterLink.addEventListener("click", function (e) { e.preventDefault(); showCard(els.registerCard); });
  }
  if (els.showLoginLink) {
    els.showLoginLink.addEventListener("click", function (e) { e.preventDefault(); showCard(els.loginCard); });
  }
  if (els.showForgotLink) {
    els.showForgotLink.addEventListener("click", function (e) { e.preventDefault(); showCard(els.forgotCard); });
  }
  if (els.backToLoginLink) {
    els.backToLoginLink.addEventListener("click", function (e) { e.preventDefault(); showCard(els.loginCard); });
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

  /* ---------------- Logout ---------------- */

  function doLogout() { auth.signOut(); }
  if (els.logoutBtn) els.logoutBtn.addEventListener("click", doLogout);
  if (els.pendingLogoutBtn) els.pendingLogoutBtn.addEventListener("click", doLogout);
  if (els.rejectedLogoutBtn) els.rejectedLogoutBtn.addEventListener("click", doLogout);

  /* ---------------- Pending / rejected screens ---------------- */

  function showPending(user) {
    hideAllGates();
    show(els.pendingScreen);
    if (els.pendingEmail) els.pendingEmail.textContent = user.email;
  }

  function showRejected(user) {
    hideAllGates();
    show(els.rejectedScreen);
    if (els.rejectedEmail) els.rejectedEmail.textContent = user.email;
  }

  if (els.pendingRetryBtn) {
    els.pendingRetryBtn.addEventListener("click", function () {
      if (auth.currentUser) attemptAccess(auth.currentUser);
    });
  }
  if (els.rejectedRetryBtn) {
    els.rejectedRetryBtn.addEventListener("click", function () {
      if (auth.currentUser) attemptAccess(auth.currentUser);
    });
  }

  /* ---------------- Access attempt ---------------- */
  // 1. Try loading the answer key directly — this is the real permission check.
  // 2. If denied, look up the user's own registration record (they always have
  //    read access to their own `users/{uid}` doc) to tell pending apart from
  //    rejected, instead of showing one generic "wait" screen for both.

  function attemptAccess(user) {
    hideAllGates();
    show(els.checkingScreen);
    if (els.userBadge) els.userBadge.textContent = user.email;

    if (!(window.AnswerCodeApp && window.AnswerCodeApp.boot)) return;
    window.AnswerCodeApp.boot({
      onPermissionDenied: function () {
        db.collection("users").doc(user.uid).get()
          .then(function (snap) {
            var status = snap.exists ? snap.data().status : null;
            if (status === "rejected") showRejected(user);
            else showPending(user); // "pending", or no record found yet
          })
          .catch(function () { showPending(user); });
      },
      onSuccess: function () {
        hideAllGates();
        show(els.appShell);
      },
    });
  }

  auth.onAuthStateChanged(function (user) {
    if (user) {
      attemptAccess(user);
    } else {
      hideAllGates();
      show(els.loginScreen);
      showCard(els.loginCard);
      els.loginPassword.value = "";
      if (els.registerForm) els.registerForm.reset();
      if (els.forgotForm) els.forgotForm.reset();
      if (els.forgotSuccess) els.forgotSuccess.style.display = "none";
    }
  });
})();
