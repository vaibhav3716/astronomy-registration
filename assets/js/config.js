/* ==========================================================================
   SITE SETTINGS — edit only this file to change fees, dates, UPI details, etc.
   ========================================================================== */
window.SITE_CONFIG = {
  // Google Apps Script web-app URL that saves registrations to your Google Sheet
  // (see README.md, step 2). While this is empty the site runs in TEST MODE:
  // nothing is saved and every acknowledgement is stamped "TEST".
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbzgfLz8igjJJutVNDJcDZK8pWJmCDX8lrkgFMJd0Piw-ikoe9X_JB7W_FxhkuysL3y8/exec",

  // UPI details for online payment (to be filled in later).
  //  - id:      your UPI ID, e.g. "physicsdept@okaxis". If given, the site draws a QR code
  //             with the exact amount already filled in.
  //  - qrImage: OR the path to your own QR image, e.g. "assets/img/upi-qr.png".
  upi: {
    id: "",
    payeeName: "Department of Physics, B K Birla College",
    qrImage: ""
  },

  // Rs. The course package already includes the stargazing trip; the trip can also be taken on its own.
  fees: { course: 1000, trip: 1000 },
  minAge: 16,                              // minimum age; under 18 needs guardian consent

  course: {
    title: "Astronomy Course: Sky, Time and Telescopes",
    start: "To be announced",
    schedule: "Weekly classroom sessions of about 90 minutes, plus observing nights and a hands-on telescope workshop",
    venue: "Department of Physics, B. K. Birla College, Kalyan"
  },

  trip: {
    title: "Star Party Near Tansa",
    date: "19th December, 2026",
    place: "Atma Malik Institute of Technology & Research, Mohili-Aghai, Shahapur (Thane district)",
    mapUrl: "https://share.google/LEMSChtrACBpUne1e",
    reporting: "Reporting time at the college will be shared on WhatsApp"
  },

  cash: {
    place: "Department of Physics, B. K. Birla College, Kalyan",
    timing: "Monday to Saturday, 10:00 AM to 4:00 PM (college working days)",
    note: "Pay the fee at the Physics Department office and get this acknowledgement signed by the clerk."
  },

  // Submit the printed acknowledgement at the Physics Department within this many days
  submitWithinDays: 7,

  contact: {
    name: "",          // e.g. "Coordinator name"
    phone: "",         // e.g. "+91 9XXXXXXXXX"
    email: ""
  }
};
