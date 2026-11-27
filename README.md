# Registration website: Astronomy Course & Stargazing Trip

Department of Physics, B. K. Birla College of Arts, Science & Commerce, Kalyan.

A free one-page website (GitHub Pages) with a registration form. Registrations are saved to a
Google Sheet, and payment screenshots to Google Drive, through a free Google Apps Script.

## What is in this folder

| File | What it does |
|---|---|
| `index.html` | The page: course, trip, fees and the registration form |
| `assets/js/config.js` | **The only file you normally edit**: fees, dates, place, UPI details, seat limit, contact |
| `assets/js/app.js` | Form logic: totals, checks, upload, submit, download pop-up |
| `assets/js/receipt.js` | Builds the acknowledgement PDF |
| `assets/js/consent.js` | Builds the parental consent form PDF |
| `assets/css/style.css` | Look and feel |
| `assets/img/` | College logo, emblem and astronomy photos |
| `apps-script/Code.gs` | The Google Sheet back end (paste into Apps Script) |

## Step 1: Add the payment details (when ready)

Open `assets/js/config.js` and fill in **one** of:

- `upi.id`: for example `"physicsdept@okaxis"`. The page then draws a QR code with the exact amount
  (Rs 1000) already filled in, and shows a "Pay with UPI app" button on phones.
- `upi.qrImage`: if you only have a QR image, put it in `assets/img/` (for example `upi-qr.png`)
  and set `qrImage: "assets/img/upi-qr.png"`. Payers then type the amount themselves.

Also fill in the trip date, course start date, cash-payment timings and `contact`.

## Step 2: Create the Google Sheet back end (about 10 minutes, free)

1. In Google Drive create a new Google Sheet, named for example "Astronomy Registrations".
2. In the Sheet choose **Extensions > Apps Script**. Delete the sample code and paste all of
   `apps-script/Code.gs`. Check `FEE_COURSE` and `FEE_TRIP` at the top. They must match `config.js`. `TRIP_SEATS` is 0 (no limit); put a number there if you ever want registration to close automatically.
3. Click **Deploy > New deployment**, choose type **Web app**, and set:
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy** and allow the permissions it asks for (Sheets and Drive).
5. Copy the **Web app URL** (it ends in `/exec`) into `config.js` as `appsScriptUrl`.

Until `appsScriptUrl` is filled in, the site runs in **test mode**: nothing is saved, and the PDF is
stamped "TEST ONLY".

If you change `Code.gs` later, use **Deploy > Manage deployments > Edit > Version: New version**.
This keeps the same URL.

## Step 3: Publish on GitHub Pages (free)

1. Sign in at github.com and create a new **public** repository, for example `astronomy-registration`
   (do not add a README).
2. In Terminal, from this folder:
   ```bash
   cd Registration_Website
   git init -b main
   git add .
   git commit -m "Registration website"
   git remote add origin https://github.com/YOUR-USERNAME/astronomy-registration.git
   git push -u origin main
   ```
3. On GitHub open **Settings > Pages**, set *Source* to **Deploy from a branch**, branch **main**,
   folder **/ (root)**, and save.
4. After about a minute the site is live at `https://vaibhav3716.github.io/astronomy-registration/`.

To update the site later, edit the files, then run `git add . && git commit -m "Update" && git push`.

## Day-to-day use (office)

- Each registration is one row in the **Registrations** sheet with a sequential ID (`BKBCK-01`, `BKBCK-02`, ...).
  Online payments link to the uploaded screenshot.
- Students download two PDFs after registering: the acknowledgement and a parental consent form pre-filled with their details.
  A student is registered for the trip only after handing in **both** (the consent form signed by a parent or guardian).
- When a student brings the acknowledgement and the signed consent form:
  - **Cash:** collect the fee, fill in and sign the "For office use" box, keep the page, sign the
    student's copy at the bottom and hand it back with the receipt.
  - **Online:** match the UTR on the acknowledgement with your UPI app or bank statement and with the
    screenshot, tick "Online transaction verified", sign, and return the student's copy.
- Fill in the last columns of the sheet (verified/received, receipt no., verified by).
- The QR code on each acknowledgement holds the ID, name, amount, payment mode and UTR, so any QR
  scanner can read it.
- A UPI transaction ID that has already been used is refused.

## Notes

- Payment screenshots are stored in your own Google Drive folder
  "Astronomy Registration - Payment Screenshots". They are private to you.
- Browsers do not allow a website to stop someone from closing a tab. After submitting, the page
  shows a pop-up that cannot be closed until the PDF is downloaded, asks for confirmation before
  the tab is closed, reloaded or navigated away, and catches the Back button. A student who
  closes the tab anyway can reopen the site on the same device and click "Download your
  acknowledgement again".
- Photo credits: star trails (International Gemini Observatory/NOIRLab/NSF/AURA/T. Matsopoulos,
  CC BY 4.0); Orion Nebula (NASA, ESA, M. Robberto, public domain); Pleiades (NASA, ESA,
  AURA/Caltech, Palomar Observatory, public domain); Andromeda (Benjamin Inouye, CC BY 4.0); Dobsonian
  telescope (James Stewart, public domain); sky charts from Stellarium (GPL) with art by Johan Meuris
  (Free Art License). The college logo is from bkbck.edu.in.
