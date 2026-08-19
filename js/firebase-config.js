// ===========================================================================
// ตั้งค่า Firebase ของตัวเอง (ฟรี) ก่อนใช้ระบบ login:
//
// 1. ไปที่ https://console.firebase.google.com → สร้างโปรเจกต์ใหม่ (ฟรี)
// 2. ในโปรเจกต์ ไปที่ Build → Authentication → Get started
//    → แท็บ Sign-in method → เปิดใช้ "Email/Password"
// 3. ไปที่ Project settings (รูปเฟือง) → เลื่อนลงหา "Your apps"
//    → กด ไอคอน "</>" (Web app) → ตั้งชื่ออะไรก็ได้ → Register app
// 4. Firebase จะโชว์ก้อนค่า firebaseConfig ให้ — คัดลอกมาแทนที่ค่าด้านล่างนี้ทั้งหมด
// 5. เพิ่มบัญชีครูที่อนุญาตให้ล็อกอิน: Authentication → Users → Add user
//    (กรอกอีเมล + ตั้งรหัสผ่านให้ครูแต่ละคน)
//
// ค่าพวกนี้ไม่ใช่ความลับ (เป็นค่าฝั่ง client ที่ฝังในเว็บอยู่แล้ว) ความปลอดภัยจริง
// มาจากการที่ต้อง sign in ด้วยบัญชีที่สร้างไว้ใน Firebase Console เท่านั้นถึงจะเข้าเว็บได้
// ===========================================================================

window.FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
