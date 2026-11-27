/**
 * Registration backend for the Astronomy Course & Stargazing Trip website.
 * Department of Physics, B. K. Birla College, Kalyan.
 *
 * Paste this into a Google Sheet's Extensions > Apps Script, then
 * Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone).
 * Copy the web-app URL into assets/js/config.js (appsScriptUrl).
 *
 * Every registration becomes one row in the "Registrations" sheet.
 * Payment screenshots are saved in a private Google Drive folder; the row links to the file.
 */
const CONFIG = {
  SHEET_NAME: 'Registrations',
  FOLDER_NAME: 'Astronomy Registration - Payment Screenshots',
  ID_PREFIX: 'BKBCK-',
  FEE_COURSE: 1000,   // course package, stargazing trip included
  FEE_TRIP: 1000,     // stargazing trip only
  TRIP_SEATS: 0,      // 0 = no limit; set a number to close registration automatically
  MIN_AGE: 16,
  MAX_FILE_MB: 5
};

const HEADERS = [
  'Registration ID', 'Submitted at', 'Student / Teacher', 'Full name', 'Age', 'Gender', 'Mobile', 'Email',
  'In-house / Outside', 'College', 'Class / Year', 'Department / Stream', 'Student ID', 'City / Area',
  'Course package', 'Trip', 'Amount (Rs)', 'Payment mode', 'UPI transaction ID', 'Paid from', 'Screenshot',
  'Parent / Guardian', 'Parent / Guardian mobile', 'Medical notes',
  // filled in by the office
  'Payment Verified / Received (Y/N)', 'Receipt no.', 'Signed consent form received (Y/N)', 'Verified by', 'Office notes'
];

function doGet(e) {
  const sheet = getSheet_();
  return json_({ ok: true, tripSeats: CONFIG.TRIP_SEATS, tripRegistered: countTrip_(sheet) });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return json_({ ok: false, error: 'The server is busy.' });
  try {
    const d = JSON.parse(e.postData.contents);
    const err = validate_(d);
    if (err) return json_({ ok: false, error: err });

    const sheet = getSheet_();
    if (CONFIG.TRIP_SEATS > 0 && countTrip_(sheet) >= CONFIG.TRIP_SEATS)
      return json_({ ok: false, error: 'Sorry, all seats on the stargazing trip are now full.' });

    // the course package includes the trip, so every registration takes a trip seat
    d.programmes.trip = true;
    const amount = d.programmes.course ? CONFIG.FEE_COURSE : CONFIG.FEE_TRIP;
    if (d.paymentMode === 'online' && utrUsed_(sheet, d.utr))
      return json_({ ok: false, error: 'This UPI transaction ID has already been used for another registration.' });

    const id = nextId_();
    let fileCell = '', fileName = '';

    if (d.paymentMode === 'online') {
      const bytes = Utilities.base64Decode(d.file.data);
      const ext = (d.file.name.match(/\.[A-Za-z0-9]+$/) || [''])[0].toLowerCase();
      fileName = id + '_' + safe_(d.fullName).replace(/\s+/g, '_') + ext;
      const file = getFolder_().createFile(Utilities.newBlob(bytes, d.file.type, fileName));
      fileCell = '=HYPERLINK("' + file.getUrl() + '","' + fileName + '")';
    }

    const submittedAt = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd MMM yyyy, hh:mm a');
    sheet.appendRow([
      id, submittedAt, d.role === 'Teacher' ? 'Teacher' : 'Student', safe_(d.fullName), d.age, safe_(d.gender), "'" + d.phone, safe_(d.email),
      safe_(d.collegeType), safe_(d.institution), safe_(d.classYear), safe_(d.department), safe_(d.studentId), safe_(d.city),
      d.programmes.course ? 'Yes' : '', 'Yes', amount,
      d.paymentMode === 'online' ? 'Online (UPI)' : 'Cash', d.utr ? "'" + d.utr : '', safe_(d.payerName), fileCell,
      safe_(d.guardianName), d.guardianPhone ? "'" + d.guardianPhone : '', safe_(d.medical),
      '', '', '', '', ''
    ]);
    return json_({ ok: true, id: id, submittedAt: submittedAt, amount: amount, fileName: fileName });
  } catch (err) {
    return json_({ ok: false, error: 'Server error: ' + err.message });
  } finally {
    lock.releaseLock();
  }
}

function validate_(d) {
  const phone = /^[6-9]\d{9}$/;
  if (!d || !d.programmes || (!d.programmes.course && !d.programmes.trip)) return 'Choose the course package or the trip.';
  if (!d.fullName || String(d.fullName).trim().length < 3) return 'Full name is missing.';
  const age = parseInt(d.age, 10);
  if (!age || age < CONFIG.MIN_AGE) return 'The minimum age is ' + CONFIG.MIN_AGE + ' years.';
  if (!phone.test(d.phone)) return 'Mobile number is not valid.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email || '')) return 'Email address is not valid.';
  const teacher = d.role === 'Teacher';
  if (!d.institution || !d.department || (!teacher && !d.classYear)) return 'College, class and department are needed.';
  if (!teacher && (!d.guardianName || !phone.test(d.guardianPhone || ''))) return 'Parent or guardian name and mobile are needed.';
  if (d.paymentMode !== 'online' && d.paymentMode !== 'cash') return 'Choose a payment method.';
  if (d.paymentMode === 'online') {
    if (!/^\d{12}$/.test(d.utr || '')) return 'The UPI transaction ID must be 12 digits.';
    if (!d.file || !d.file.data) return 'The payment screenshot is missing.';
    if (!/\.(png|jpe?g|webp|heic|heif|pdf)$/i.test(d.file.name || '')) return 'The screenshot must be a PNG, JPG, WEBP, HEIC or PDF file.';
    if (d.file.data.length * 0.75 > CONFIG.MAX_FILE_MB * 1024 * 1024) return 'The screenshot is larger than ' + CONFIG.MAX_FILE_MB + ' MB.';
  }
  return '';
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(CONFIG.SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#1F2A6B').setFontColor('#ffffff');
  }
  return sh;
}

function getFolder_() {
  const it = DriveApp.getFoldersByName(CONFIG.FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(CONFIG.FOLDER_NAME);
}

// Registration numbers come from a counter stored with the script (not from the row count),
// so a number is never given twice, even if rows are deleted or sorted. doPost holds a lock,
// so two people submitting at the same moment cannot get the same number.
function nextId_() {
  const props = PropertiesService.getScriptProperties();
  const n = Number(props.getProperty('LAST_ID') || 0) + 1;
  props.setProperty('LAST_ID', String(n));
  return CONFIG.ID_PREFIX + (n < 10 ? '0' + n : String(n));   // BKBCK-01 ... BKBCK-99, then BKBCK-100
}

function countTrip_(sheet) {
  const rows = sheet.getLastRow() - 1;
  if (rows <= 0) return 0;
  return sheet.getRange(2, HEADERS.indexOf('Trip') + 1, rows, 1).getValues().filter(r => r[0] === 'Yes').length;
}

function utrUsed_(sheet, utr) {
  const rows = sheet.getLastRow() - 1;
  if (rows <= 0 || !utr) return false;
  const col = HEADERS.indexOf('UPI transaction ID') + 1;
  return sheet.getRange(2, col, rows, 1).getValues().some(r => String(r[0]).replace(/\D/g, '') === utr);
}

// stop text from being read as a spreadsheet formula
function safe_(v) {
  v = String(v || '').trim().slice(0, 200);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
