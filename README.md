# Answer Code

Answer key reference for the Microcontroller (Arduino) course, code 20105-2105 — 16 units,
full explanations, category filters, quiz mode, and email/password login. Built as a static
site (works on GitHub Pages) with Firebase Auth + Firestore handling access control.

## Why content lives in Firestore, not in this repo

This repo is public — GitHub Pages on a free account requires it. Any file committed here,
including past commits, is permanently readable by anyone regardless of what the UI shows.
A login screen alone does not protect a JSON file sitting in the same repo.

So the answer data itself is stored in Firestore, gated by security rules that require
authentication to read. This repo only ships the shell (HTML/CSS/JS) — no exam content.

## Project structure

```
.
├── index.html              App shell + login screen
├── css/style.css
├── js/
│   ├── firebase-config.js  Firebase project credentials (not secret, see below)
│   ├── auth.js              Login/logout, session state
│   └── app.js                Reads from Firestore, renders, search, category filters
├── seed.html                One-time data upload tool — gitignored, never committed
└── README.md
```

There is no `data/` directory. Content lives in Firestore under `answerkey/data`.

## Setup

### 1. Firebase project + Authentication

1. [console.firebase.google.com](https://console.firebase.google.com) → create a project (free tier).
2. **Build → Authentication → Get started → Sign-in method → enable Email/Password**.
3. **Project settings → Your apps → `</>`** → register a web app, copy the `firebaseConfig` object into `js/firebase-config.js`.
4. **Authentication → Users → Add user** for each teacher who needs access.

### 2. Firestore

1. **Build → Firestore Database → Create database**, pick a region close to your users.
2. **Rules** tab → replace the default rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
  }
}
```

3. **Publish.**

This gives every logged-in user read access, but write access only to accounts listed in
an `admins` collection. Add yourself as the first admin:

1. **Authentication → Users** → click your account → copy the **User UID**.
2. **Firestore Database → Start collection** → collection ID `admins` → document ID: paste
   the UID → add any field, e.g. `role` (string) = `admin` → **Save**.

Any other authenticated user can read the answer key but gets a permission-denied error if
they try to write — including running `seed.html`, which requires an admin account.

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
`<user>.github.io`. Login will not work on the deployed site until this is set.

## Local development

```bash
python3 -m http.server 8000
```

Serving over HTTP is required — `fetch`/Firestore calls fail when `index.html` is opened
directly from disk.

## Managing teacher accounts

Firebase Console → Authentication → Users. No code changes needed.

- Add: **Add user**, set a temporary password. Read-only by default.
- Grant write access: add a document to Firestore's `admins` collection with the user's
  UID as the document ID (see Setup §2). Most teacher accounts should not have this.
- Revoke: **Delete user** (and their `admins/{uid}` document, if present).
- Suspend: **Disable account**.

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
