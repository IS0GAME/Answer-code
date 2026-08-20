# Answer Code

Answer key reference for the Microcontroller (Arduino) course, code 20105-2105 — 16 units,
full explanations, category filters, quiz mode, and self-service registration with admin
approval. Built as a static site (works on GitHub Pages) with Firebase Auth + Firestore
handling access control.

New teachers register themselves with an email and password, then wait for an admin to
approve the account before they can read anything. No shared passwords, no manually
creating every account by hand.

## Why content lives in Firestore, not in this repo

This repo is public — GitHub Pages on a free account requires it. Any file committed here,
including past commits, is permanently readable by anyone regardless of what the UI shows.
A login screen alone does not protect a JSON file sitting in the same repo.

So the answer data itself is stored in Firestore, gated by security rules that require an
approved account to read. This repo only ships the shell (HTML/CSS/JS) — no exam content.

## Project structure

```
.
├── index.html              App shell + login/register/pending screens
├── admin.html               Approval panel (safe to be public — gated by Firestore rules)
├── css/style.css
├── js/
│   ├── firebase-config.js  Firebase project credentials (not secret, see below)
│   ├── auth.js               Login, registration, session state
│   ├── app.js                  Reads from Firestore, renders, search, category filters
│   └── admin.js                 Approve/reject/revoke logic for admin.html
├── seed.html                One-time data upload tool — gitignored, never committed
└── README.md
```

There is no `data/` directory. Content lives in Firestore under `answerkey/data`.

## Setup

### 1. Firebase project + Authentication

1. [console.firebase.google.com](https://console.firebase.google.com) → create a project (free tier).
2. **Build → Authentication → Get started → Sign-in method → enable Email/Password**.
3. **Project settings → Your apps → `</>`** → register a web app, copy the `firebaseConfig` object into `js/firebase-config.js`.

Teachers no longer need accounts created manually — they register themselves through the
site (see below). Create only your own account this way, to become the first admin.

### 2. Firestore

1. **Build → Firestore Database → Create database**, pick a region close to your users.
2. **Rules** tab → replace the default rules with:

```
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
      allow create: if request.auth != null && request.auth.uid == uid
                     && request.resource.data.status == 'pending';
      allow update, delete: if isAdmin();
    }

    match /admins/{uid} {
      allow read, write: if false;
    }
  }
}
```

3. **Publish.**

This gives three tiers: admins can read and write everything; approved users can read the
answer key only; anyone can create their own pending registration record, but nothing else.
The `admins` collection is invisible to clients entirely — it's only checked from within
rule evaluation, never read directly, and only manageable from the Firebase Console.

Add yourself as the first admin:

1. Register an account through the site itself (`index.html` → สมัครสมาชิก).
2. **Authentication → Users** → click your account → copy the **User UID**.
3. **Firestore Database → Start collection** → collection ID `admins` → document ID: paste
   the UID → add any field, e.g. `role` (string) = `admin` → **Save**.

An admin account does not need a `users/{uid}` document with `status: approved` — `isAdmin()`
already grants full read access on its own.

### 3. Load the answer data

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/seed.html`, log in with **the admin account**, click **upload**.
This writes the full dataset to `answerkey/data` in Firestore. Re-run it only when content
changes — normal use of the site never touches this page.

`seed.html` embeds the full dataset inline and is excluded via `.gitignore`. Do not remove
that exclusion.

### 4. Deploy

```bash
git remote add origin https://github.com/<user>/<repo>.git
git branch -M main
git push -u origin main
```

**Settings → Pages → Source: Deploy from a branch → `main` / `(root)` → Save.**
Site goes live at `https://<user>.github.io/<repo>/` within a few minutes.

Then, in Firebase: **Authentication → Settings → Authorized domains** → add
`<user>.github.io`. Registration and login will not work on the deployed site until this
is set.

## Local development

```bash
python3 -m http.server 8000
```

Serving over HTTP is required — `fetch`/Firestore calls fail when `index.html` is opened
directly from disk.

## Approving new teachers

New registrations sit in `pending` until an admin acts on them.

1. Open `admin.html`, log in with an admin account.
2. Pending requests appear under **รออนุมัติ** with **อนุมัติ** (approve) and **ปฏิเสธ**
   (reject) buttons.
3. Approving sets their status to `approved` — they get in the next time they check (the
   pending screen on their end has a **ตรวจสอบอีกครั้ง** retry button, no reload needed).
4. Rejecting sets their status to `rejected`, which is shown to them as a distinct
   "request not approved" screen rather than leaving them stuck on the same pending
   message forever. Their Firebase Authentication account still exists — delete it
   separately from **Authentication → Users** if you don't want them signing in again.
5. Already-approved users appear under **อนุมัติแล้ว** with a **เพิกถอน** (revoke) button,
   which sets their status back to `rejected` the same way.
6. Rejected users appear under **ถูกปฏิเสธ** with **อนุมัติ** (to reconsider and approve
   them after all) and **ลบคำขอ** (permanently delete their `users/{uid}` record — use
   this to clear out entries you never plan to reconsider).

All three of these actions ask for confirmation before running, since they're either
immediately visible to the affected user or hard to undo.

`admin.html` is not linked from anywhere in the app and doesn't need to be — it's protected
by the same Firestore rules as everything else. A non-admin who finds the URL sees a
"not an admin" screen, not the panel.

## Password reset

Both `index.html` and `admin.html` have a "ลืมรหัสผ่าน?" (forgot password) link on the
login form, which sends a standard Firebase password-reset email. No setup required beyond
what's already in Setup §1 — Firebase handles delivery.

## Managing admins

Admin status lives only in the `admins` collection, set via Firebase Console (see Setup §2).
There's no UI for granting admin — intentionally, since it's a rare, high-trust operation.

- Add an admin: create a document in `admins` with their UID.
- Remove an admin: delete that document.

## Updating content

Content is not edited in this repo. To change questions, answers, or categories:

1. Edit your local copy of the source dataset (kept outside this repo).
2. Regenerate `seed.html` from it.
3. Re-run the upload step in Setup §3. This overwrites `answerkey/data` entirely.

Small one-off edits can also be made directly in Firebase Console → Firestore Database →
`answerkey/data`, though the nested structure makes bulk changes there impractical.

## If this repo previously had data committed to it

If an earlier version of this repo committed a data file (e.g. `data/units.json`) before
the Firestore migration, that content is still readable in the commit history even after
deleting the file in a later commit. Rewrite history and force-push:

```bash
git checkout --orphan clean-main
git add -A
git commit -m "Firestore-backed answer key, no content in repo history"
git branch -D main
git branch -m main
git push -u origin main --force
```

Safe to do on a repo with no other collaborators or history worth preserving.

## Stack

Vanilla HTML/CSS/JS, no build step. Firebase Authentication and Firestore (both free tier
at this scale) are the only external dependencies.
