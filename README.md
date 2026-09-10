# HangMate 🤙 • College Matchmaker

A full-stack college matchmaking platform built for effortless **manual pairing** and **automated email notifications**.

---

## 🌟 Features

- **Mobile Registration Portal (`/`)**:
  - Full Name, Email (any personal or college email), Phone/WhatsApp, Instagram Handle.
  - Gender & Year of study.
  - Music taste & Hobbies with interactive quick-tag chips.
  - Personality picker (🧘 Introvert, 🌿 Ambivert, ⚡ Extrovert).
  - **Privacy Guarantee Badge**: *"THIS INFO WON'T BE SHARED WITH ANYONE ELSE. FEEL FREE."*
  - Excluded: Department and "Looking for" fields.

- **Admin Manual Matchmaking Studio (`/admin.html`)**:
  - **Dual Slot Workbench**: Click Student 1 (Slot A), click Student 2 (Slot B).
  - **Live Vibe Check**: Side-by-side music, hobbies, year, and personality compatibility preview.
  - **1-Click Pair 💖**: Pairs them up instantly.
  - **Undo / Unpair**: Frees both students back to the pool in 1 click.
  - **Filters & Search**: Filter pool by Gender, Year, Personality, or search anything.
  - **Email Preview**: Inspect the exact styled HTML email each student will receive.
  - **Automated Dispatch**: Click "Send Email Now" or "🚀 Send All Pending Emails".
  - **CSV Export**: Download all participant submissions anytime.

---

## 🚀 How to Run Locally

1. Open your terminal in this folder:
   ```bash
   cd C:\Users\vabsd\.gemini\antigravity\scratch\HangMate
   ```
2. Start the server:
   ```bash
   npm start
   ```
3. Open your browser:
   - **Student Registration Page**: [http://localhost:3000](http://localhost:3000)
   - **Admin Matchmaker Studio**: [http://localhost:3000/admin.html](http://localhost:3000/admin.html)
   - **Default Admin Password**: `collegematch2026` (changeable in `.env`)

---

## 📧 How to Send Real Emails (Gmail)

By default, HangMate runs in **Simulation Mode** (it generates the full HTML emails and lets you preview them in the browser without any setup).

To send real emails to students' inboxes via your Gmail:
1. Go to your Google Account -> **Security** -> Enable **2-Step Verification**.
2. Search for **App Passwords** (or visit [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)).
3. Generate a password for "HangMate" (it gives you a 16-character code).
4. Open `.env` in this folder and fill:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_16_character_app_password
   FROM_EMAIL="HangMate Organizer <your_email@gmail.com>"
   ```
5. Restart the server (`npm start`). All match emails will now be delivered live!

---

## 🌐 How to Put it Online for Students

To let everyone in your college access the form from their phones:
1. Push this folder to a GitHub repository.
2. Sign up on [Render.com](https://render.com) (Free Tier).
3. Create a **New Web Service**, connect your repo, set:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables: Add `ADMIN_PASSWORD` and your `SMTP` credentials.
4. You'll get a public link like `https://hangmate.onrender.com` to share on WhatsApp and Instagram stories!
