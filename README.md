# Монгол Улсын Наадам 2026 — Хурдан морины бүртгэл

Nationwide version of the Nalaikh registration app. Rebranded, and updated
per your latest requests: **free registration, no admin approval step,
unique numbering capped at 1500.**

## What's different from nalaikh2026

- Title/branding text changed to "Монгол Улсын Наадам 2026" everywhere.
- Firebase config in `src/firebase/db.js` is a **placeholder** — plug in a
  brand-new Firebase project so this event's data never mixes with
  Nalaikh's.
- **Free of charge**: no payment screen, no bank-transfer step, no
  "waiting for approval" screen. A horse is confirmed the instant it's
  registered.
- **One horse = one number**: the old "reuse the same number across age
  groups" logic is gone. Every registration gets its own brand-new number.
- **1500 cap**: numbers are handed out 1 → 1500. Once #1500 is taken, the
  next registration attempt fails with a clear "бүртгэл дүүрсэн" message
  (enforced atomically in `getNextHorseNumber()` in `src/firebase/db.js`,
  so it's safe even with many people registering at once).
- Admin panel no longer has an "approve" button — everything is
  auto-confirmed, so the panel is just for browsing/exporting registrations
  and deleting duplicates/mistakes.
- Age groups, admin login, CSV export, and the registration-deadline
  setting are otherwise unchanged.

## Changing the notification email (onki2024 → yukisydney2019@gmail.com)

The app has **no email address hardcoded in the code** — the destination
inbox is configured inside the EmailJS template itself, not in `App.jsx`.
To point notifications at `yukisydney2019@gmail.com`:

1. Go to https://dashboard.emailjs.com → **Email Templates**.
2. Open the template with ID `template_76xsdxs` (the one this app calls).
3. Find the **"To email"** field in the template settings and change it
   from `onki2024@gmail.com` to `yukisydney2019@gmail.com`.
4. Save. No code change or redeploy needed — the next registration will
   email the new address.

(If you'd rather use a completely separate EmailJS service/template for
this nationwide app instead of reusing the Nalaikh one, create a new
template on emailjs.com and swap `service_id`/`template_id`/`user_id` in
the `fetch(...)` call inside `saveHorse()` in `src/App.jsx`.)

## 1. Create the new Firebase project

1. Go to https://console.firebase.google.com → **Add project** → name it
   e.g. `mongol-naadam-2026`.
2. Enable **Firestore Database** (production mode, any region close to you,
   e.g. `asia-southeast1`).
3. In **Project settings → General → Your apps**, add a **Web app** and copy
   the config object it gives you.
4. Paste those values into `src/firebase/db.js`, replacing the six
   `"REPLACE_ME"` fields.
5. In Firestore **Rules**, use the same rules you use for the Nalaikh
   project (open read/write for `users`, `horses`, `meta` collections, or
   whatever access rules you currently run).

## 2. Local install & test

```bash
npm install
npm run dev
```

## 3. Build & deploy to Netlify

```bash
npm run build
```

Push this folder to a new GitHub repo (e.g. `mongol-naadam-2026`), then
connect it to a new Netlify site the same way you did for
`nalaikh.netlify.app`. The `public/_redirects` file is already included for
SPA routing.

## 4. Admin login

Same as Nalaikh app by default:
- Admin user: `admin`
- Admin pass: `naadam2026`
- Explainer code: `tailbar2026`

Change these in `src/App.jsx` (top constants: `ADMIN_USER`, `ADMIN_PASS`,
`EXPLAINER_CODE`) if you want separate credentials from the Nalaikh app.

## 5. Age groups

Currently identical to Nalaikh (Даага, Шүдлэн, Хязаалан, Соёолон, Их нас,
Азарга, Сонгомол дээд/дунд/бага) — edit `AGE_GROUPS` in `src/App.jsx` if the
nationwide event needs different categories.

## 6. Registration cap (1500)

`MAX_HORSES` is exported from `src/firebase/db.js` (currently `1500`).
Change that single constant if the cap ever needs to move.

