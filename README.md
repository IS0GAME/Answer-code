# 📚 Answer Code — คลังเฉลยแบบฝึกหัดและแพลตฟอร์มการสอนอัจฉริยะ (Multi-Book Answer Key & Quiz Platform)

ระบบคลังเฉลยแบบฝึกหัดและแผนการสอนรวมทุกรายวิชา (Multi-Book Library) เช่น ไมโครคอนโทรลเลอร์ (Arduino รหัสวิชา 20105-2105), วงจรไฟฟ้า, ภาษาซี และรายวิชาอื่นๆ พร้อมคำอธิบายเฉลยละเอียด (Explanations), **โหมดเกมตอบคำถามสไตล์ Kahoot (Quiz Show)**, **ระบบสุ่มสร้างชุดข้อสอบ (Exam Builder)**, **ระบบสืบค้นด่วนข้ามวิชา (`Ctrl + K` Spotlight)**, **ระบบติดดาวข้อสอบ (Bookmark ⭐)**, **ระบบอ่านออกเสียงภาษาไทย (TTS 🔊)**, **ตัวสลับธีม Dark / Light / Projector**, และระบบความปลอดภัย Firebase Auth + Firestore Security Rules

---

## ✨ ฟีเจอร์เด่นทั้งหมด (Key Features)

### 1. 📚 รองรับหนังสือและรายวิชาไม่จำกัด (Multi-Book Library)
* จัดเก็บเฉลยของหนังสือ/รายวิชาได้ทุกเล่มในระบบเดียว
* มี Book Selector และระบบตรวจจับรหัสวิชา (เช่น `20105-2105`) หรือชื่อหนังสือ เพื่อสลับเล่มได้ทันที
* หมวดหมู่ (Category Chips) และบทเรียน (Units) จะปรับเปลี่ยนตามเล่มที่เลือกโดยอัตโนมัติ
* รองรับ URL Deep Linking เช่น `index.html?book=20105-2105#unit-3`

### 2. 🎮 โหมดเกมตอบคำถามสไตล์ Kahoot (Live Quiz Show)
* โหมดเกมฉายขึ้นจอภาพ/โปรเจกเตอร์เพื่อจัดกิจกรรมในห้องเรียน
* ตัวเลือก 4 สียักษ์ใหญ่สไตล์ Kahoot (🟥 สามเหลี่ยม-ก, 🟦 สี่เหลี่ยมข้าวหลามตัด-ข, 🟨 วงกลม-ค, 🟩 สี่เหลี่ยมจัตุรัส-ง)
* ตัวนับเวลาถอยหลัง (Timer Countdown) พร้อมแถบสีแอนิเมชัน
* เอฟเฟกต์เสียงสังเคราะห์ (Web Audio API 8-bit Synthesizer) เสียงถูก/ผิด/แท่นรับรางวัล ไม่ต้องโหลดไฟล์เสียงเพิ่ม
* ระบบคำนวณคะแนนตามความเร็วและ Streak โบนัส พร้อมหน้าสรุปคะแนนและแท่นรางวัล (Podium) เมื่อจบเกม

### 3. 🔀 ระบบสุ่มสร้างชุดข้อสอบ (Exam Paper Builder)
* ให้ครูกำหนดจำนวนข้อ (เช่น 10 ข้อ, 20 ข้อ, 30 ข้อ หรือสุ่มทั้งหมด) และกำหนดขอบเขตบทเรียนได้
* เลือกได้ว่าจะเริ่มทำข้อสอบแบบ Interactive Quiz บนหน้าจอ หรือส่งพิมพ์เป็นกระดาษข้อสอบ (Print Exam) ทันที

### 4. ⚡ ระบบค้นหาด่วนข้ามวิชา (Ctrl + K Spotlight Search)
* กดปุ่มลัด `Ctrl + K` (หรือ `Cmd + K`) เพื่อเปิดหน้าต่างค้นหาแบบ Command Palette
* ค้นหาคำถาม คำตอบ หรือคำอธิบาย จาก**หนังสือทุกเล่มในระบบพร้อมกัน**ในเสี้ยววินาที

### 5. ⭐ ระบบติดดาวและบันทึกข้อสอบ (Star Bookmarks)
* สามารถกดติดดาว ★ ที่มุมขวาของข้อสอบแต่ละข้อ เพื่อบันทึกข้อสอบที่ชอบ ข้อสอบที่ออกบ่อย หรือข้อที่นักเรียนมักทำผิด
* มีแท็บกรอง **"★ ข้อสอบที่ติดดาว"** เพื่อเรียกดูเฉพาะข้อที่บันทึกไว้ (บันทึกลง LocalStorage อัตโนมัติ)

### 6. 🔊 ระบบอ่านออกเสียงภาษาไทย (Thai Text-to-Speech)
* มีปุ่มลำโพง 🔊 ท้ายโจทย์และคำอธิบายทุกข้อ เพื่อให้เบราว์เซอร์อ่านออกเสียงภาษาไทย ช่วยเพิ่มความน่าสนใจในการเรียนการสอน

### 7. 🖨️ ระบบพิมพ์และส่งออก PDF (Print & PDF Export)
* **ฉบับใบงานนักเรียน (Student Test Paper):** ซ่อนเฉลยและคำอธิบายทั้งหมด พิมพ์เฉพาะหัวข้อโจทย์และช่องตัวเลือก
* **ฉบับเฉลยสำหรับผู้สอน (Teacher Master Key):** พิมพ์พร้อมเฉลยและคำอธิบายอย่างเป็นระเบียบ

### 8. 🌓 ตัวสลับธีมหน้าจอ (Dark / Light / Projector Mode)
* ☀️ **Light Mint (ค่าเริ่มต้น):** ธีมสว่าง คมชัด เรียบหรู
* 🌙 **Dark Cyberpunk:** โหมดมืด สบายตา โทนดำ-เขียว-ทองแดง
* 📽️ **High-Contrast (Projector Mode):** ขาว-ดำ คอนทราสต์สูง สำหรับฉายโปรเจกเตอร์ในห้องเรียนที่มีแสงจ้า

### 9. 🤖 AI Prompt Generator สำหรับสร้าง JSON จากหนังสือเล่มใหม่
* มีไฟล์ [`PROMPT_SEED_GENERATOR.md`](PROMPT_SEED_GENERATOR.md) ให้ Copy ไปสั่งงาน AI (Gemini / ChatGPT / Claude) แปลง PDF หรือข้อความจากหนังสือเรียนเล่มใดๆ ให้ออกมาเป็น JSON พร้อมอัปโหลด

### 10. 🛠️ เครื่องมือ Drag & Drop Seed และ Backup JSON (`seed.html`)
* รองรับการลากไฟล์ `.json` มาปล่อย (Drag & Drop) หรือเลือกไฟล์จากเครื่อง
* มีปุ่ม **"💾 Backup JSON"** ดาวน์โหลดข้อมูลหนังสือแต่ละเล่มเก็บสำรองไว้ในเครื่องได้ทันที

---

## ⌨️ ปุ่มลัดแป้นพิมพ์ (Keyboard Shortcuts)

| ปุ่มลัด | การทำงาน |
|---|---|
| `Ctrl + K` / `Cmd + K` | เปิดหน้าต่างค้นหาด่วน (Spotlight Search) |
| `H` | สลับโหมด ซ่อน/แสดงเฉลย (Toggle Answer Key) |
| `P` | เปิดหน้าต่างพิมพ์หรือส่งออก PDF |
| `1` / `2` / `3` / `4` (หรือ `A/B/C/D`) | ตอบคำถาม ก, ข, ค, ง ในโหมดเกม Kahoot |
| `Enter` / `Space` | ไปยังข้อถัดไปในโหมดเกม Kahoot |
| `Escape` | ปิดหน้าต่าง Modal หรือออกจากโหมดเกม |

---

## 🚀 ขั้นตอนการติดตั้งและตั้งค่าระบบ (Setup Guide)

### 1. Firebase Authentication & Web App Config
1. สร้างโปรเจกต์ที่ [Firebase Console](https://console.firebase.google.com)
2. เปิดใช้งาน **Authentication → Email/Password**
3. คัดลอกคอนฟิกไปวางในไฟล์ [`js/firebase-config.js`](js/firebase-config.js):
   ```javascript
   window.FIREBASE_CONFIG = {
     apiKey: "AIzaSy...",
     authDomain: "your-app.firebaseapp.com",
     projectId: "your-app",
     storageBucket: "your-app.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```

### 2. Firestore Security Rules
1. ไปที่เมนู **Firestore Database → Rules** แล้วใส่โค้ด:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null &&
        exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    function isApproved() {
      return request.auth != null &&
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status == 'approved';
    }
    match /answerkey/{docId} {
      allow read: if isApproved() || isAdmin();
      allow write: if isAdmin();
    }
    match /users/{uid} {
      allow read: if request.auth != null && (request.auth.uid == uid || isAdmin());
      allow create: if request.auth != null && request.auth.uid == uid && request.resource.data.status == 'pending';
      allow update, delete: if isAdmin();
    }
    match /admins/{uid} {
      allow read, write: if false;
    }
  }
}
```

### 3. แต่งตั้งแอดมินคนแรก & Seed ข้อมูล
1. สมัครสมาชิกผ่านหน้าเว็บหลัก [`index.html`](index.html)
2. ไปที่ Firebase Console → สร้างเอกสารใน collection `admins` โดยใช้ Document ID เป็น UID ของคุณ
3. สร้างเอกสารใน collection `users/{UID}` และตั้งค่า `status: "approved"`
4. เข้าหน้า [`seed.html`](seed.html) ล็อกอินและกดอัปโหลดหนังสือเริ่มต้นหรือ Custom JSON ได้ทันที!
