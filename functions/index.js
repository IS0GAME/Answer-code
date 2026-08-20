const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Callable function: removeUser({ uid })
 *
 * Deletes a Firebase Authentication account outright and marks the matching
 * `users/{uid}` Firestore record as "rejected". This exists because the
 * client SDK can only ever manage the currently signed-in user's own auth
 * account — deleting someone else's requires the Admin SDK, which only runs
 * in a trusted environment like this function, never in the browser.
 *
 * Only callable by an authenticated user who has a document in the `admins`
 * collection. Everyone else gets permission-denied.
 */
exports.removeUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "ต้องเข้าสู่ระบบก่อน");
  }

  const callerUid = context.auth.uid;
  const adminDoc = await admin.firestore().collection("admins").doc(callerUid).get();
  if (!adminDoc.exists) {
    throw new functions.https.HttpsError("permission-denied", "บัญชีนี้ไม่มีสิทธิ์ผู้ดูแล");
  }

  const targetUid = data && data.uid;
  if (!targetUid || typeof targetUid !== "string") {
    throw new functions.https.HttpsError("invalid-argument", "ไม่พบ uid ของผู้ใช้เป้าหมาย");
  }
  if (targetUid === callerUid) {
    throw new functions.https.HttpsError("failed-precondition", "ไม่สามารถลบบัญชีของตัวเองผ่านฟังก์ชันนี้ได้");
  }

  try {
    await admin.auth().deleteUser(targetUid);
  } catch (err) {
    // Already gone is fine — still make sure Firestore reflects "rejected"
    // below. Any other error is real and should surface to the caller.
    if (err.code !== "auth/user-not-found") throw err;
  }

  await admin.firestore().collection("users").doc(targetUid).set(
    { status: "rejected" },
    { merge: true }
  );

  return { ok: true };
});
