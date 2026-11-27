(function () {
  const cfg = window.SITE_CONFIG;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const form = $("#regForm");
  const TEST = !cfg.appsScriptUrl;
  const MAX_FILE = 5 * 1024 * 1024;
  const OK_TYPES = ["image/png", "image/jpeg", "image/webp", "image/heic", "image/heif", "application/pdf"];
  const OK_EXT = /\.(png|jpe?g|webp|heic|heif|pdf)$/i;
  const STORE_KEY = "bkbc-astro-registration";
  const HOME_COLLEGE = "B. K. Birla College, Kalyan";
  const DECLARATIONS = ["agreeInfo", "agreeConduct", "agreeLiability", "agreeRules", "agreeAck"];
  let logoDataUrl = null, docs = null, got = { ack: true, consent: true };

  /* ---------- fill text from config ---------- */
  const get = (path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), cfg);
  $$("[data-text]").forEach(el => { const v = get(el.dataset.text); if (v !== undefined && v !== "") el.textContent = v; });
  const fees = { course: cfg.fees.course, trip: cfg.fees.trip };
  $$("[data-fee]").forEach(el => el.textContent = fees[el.dataset.fee].toLocaleString("en-IN"));
  const c = cfg.contact;
  if (c.name || c.phone || c.email)
    $("#contactLine").innerHTML = "Contact: " + [c.name, c.phone && `<a href="tel:${c.phone.replace(/\s/g, "")}">${c.phone}</a>`, c.email && `<a href="mailto:${c.email}">${c.email}</a>`].filter(Boolean).join(" &middot; ");
  if (TEST) $("#testBanner").hidden = false;
  if (cfg.trip.mapUrl) { const a = $("#mapLink"); a.href = cfg.trip.mapUrl; a.hidden = false; }

  // logo for the PDFs (same-origin file)
  fetch("assets/img/bkbc-logo.jpg").then(r => r.blob()).then(b => new Promise(res => {
    const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b);
  })).then(u => logoDataUrl = u).catch(() => {});

  /* ---------- dynamic parts of the form ---------- */
  // the course package includes the stargazing trip
  const isCourse = () => form.programme.value === "course";
  // teachers register without Class / Year, Student ID, parent details or the consent form
  const isTeacher = () => form.role.value === "teacher";
  const total = () => isCourse() ? fees.course : (form.programme.value === "trip" ? fees.trip : 0);

  function upiUri(amount) {
    const p = new URLSearchParams({ pa: cfg.upi.id, pn: cfg.upi.payeeName, am: amount.toFixed(2), cu: "INR", tn: "Astronomy registration" });
    return "upi://pay?" + p.toString().replace(/\+/g, "%20");
  }
  function drawPayQR(amount) {
    const holder = $("#qrHolder");
    if (cfg.upi.id) {
      const q = qrcode(0, "M"); q.addData(upiUri(amount)); q.make();
      holder.innerHTML = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
      $("#upiLine").textContent = "UPI ID: " + cfg.upi.id;
      const btn = $("#upiButton"); btn.href = upiUri(amount);
      btn.hidden = !/Android|iPhone|iPad/i.test(navigator.userAgent);
    } else if (cfg.upi.qrImage) {
      holder.innerHTML = `<img src="${cfg.upi.qrImage}" alt="UPI QR code">`;
      $("#upiLine").textContent = "Enter the amount shown above in your UPI app.";
    } else {
      holder.textContent = "UPI QR code will appear here once the payment details are added.";
      $("#upiLine").textContent = "";
    }
  }
  function update() {
    const t = total();
    $("#totalAmount").textContent = t.toLocaleString("en-IN");
    $$(".amount-now").forEach(e => e.textContent = t.toLocaleString("en-IN"));
    $("#comboNote").hidden = !isCourse();
    $("#certNote").hidden = !isCourse();
    $("#collegeNameField").hidden = form.collegeType.value !== "outside";
    $("#classYearField").hidden = isTeacher();
    $("#studentIdField").hidden = isTeacher();
    $("#guardianFields").hidden = isTeacher();
    showRole(form, isTeacher());
    const mode = form.paymentMode.value;
    $("#onlineBlock").hidden = mode !== "online";
    $("#cashBlock").hidden = mode !== "cash";
    if (mode === "online") drawPayQR(t);
  }
  // show the student or the teacher wording inside an element
  function showRole(root, teacher) {
    $$(".only-student", root).forEach(e => e.hidden = teacher);
    $$(".only-teacher", root).forEach(e => e.hidden = !teacher);
  }
  form.addEventListener("input", update);
  form.addEventListener("change", update);

  // screenshot preview + checks
  $("#screenshot").addEventListener("change", e => {
    const f = e.target.files[0], box = $("#shotPreview");
    if (!f) { box.hidden = true; return; }
    const err = fileProblem(f);
    box.hidden = false;
    if (err) { box.innerHTML = `<span style="color:#C62828">${err}</span>`; return; }
    const size = (f.size / 1024 / 1024).toFixed(2) + " MB";
    if (f.type.startsWith("image/") && !/heic|heif/i.test(f.type)) {
      box.innerHTML = `<img alt="Payment screenshot preview"><span>${f.name}<br><small>${size}</small></span>`;
      box.querySelector("img").src = URL.createObjectURL(f);
    } else box.innerHTML = `<span>&#128196; ${f.name}<br><small>${size}</small></span>`;
  });
  function fileProblem(f) {
    if (!(OK_TYPES.includes(f.type) || OK_EXT.test(f.name))) return "Please upload a PNG, JPG, JPEG, WEBP, HEIC or PDF file.";
    if (f.size > MAX_FILE) return "The file is larger than 5 MB. Please upload a smaller screenshot.";
    return "";
  }

  /* ---------- upload zone: drag and drop ---------- */
  const dz = $(".dropzone");
  ["dragenter", "dragover"].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add("drag"); }));
  ["dragleave", "drop"].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove("drag"); }));
  dz.addEventListener("drop", e => {
    if (!e.dataTransfer.files.length) return;
    const dt = new DataTransfer(); dt.items.add(e.dataTransfer.files[0]);
    $("#screenshot").files = dt.files; $("#screenshot").dispatchEvent(new Event("change"));
  });

  /* ---------- mock run (test mode only): sample details + a sample UPI screenshot ---------- */
  function demoScreenshot(amount, utr) {
    const c = document.createElement("canvas"); c.width = 540; c.height = 960;
    const g = c.getContext("2d");
    g.fillStyle = "#ffffff"; g.fillRect(0, 0, 540, 960);
    g.fillStyle = "#1a73e8"; g.fillRect(0, 0, 540, 70);
    g.fillStyle = "#fff"; g.font = "bold 26px sans-serif"; g.fillText("UPI Payment (DEMO)", 24, 45);
    g.fillStyle = "#0f9d58"; g.beginPath(); g.arc(270, 210, 70, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#fff"; g.lineWidth = 14; g.beginPath(); g.moveTo(232, 212); g.lineTo(260, 240); g.lineTo(312, 182); g.stroke();
    g.fillStyle = "#202124"; g.textAlign = "center";
    g.font = "bold 58px sans-serif"; g.fillText("₹" + amount.toLocaleString("en-IN"), 270, 360);
    g.font = "28px sans-serif"; g.fillStyle = "#0f9d58"; g.fillText("Payment successful", 270, 410);
    g.fillStyle = "#5f6368"; g.font = "22px sans-serif";
    g.fillText("To: " + (cfg.upi.payeeName || "Department of Physics"), 270, 470);
    g.fillText(cfg.upi.id ? "UPI ID: " + cfg.upi.id : "UPI ID: physicsdept@upi (demo)", 270, 505);
    g.textAlign = "left"; g.fillStyle = "#f1f3f4"; g.fillRect(30, 560, 480, 230);
    g.font = "21px sans-serif";
    const rows = [["UPI transaction ID", utr], ["From", "Riya Sharma (demo)"], ["Date", new Date().toLocaleString("en-IN")], ["Status", "Completed"]];
    rows.forEach((r, i) => { g.fillStyle = "#5f6368"; g.fillText(r[0], 50, 610 + i * 50); g.fillStyle = "#202124"; g.fillText(r[1], 250, 610 + i * 50); });
    g.fillStyle = "#d93025"; g.font = "bold 24px sans-serif"; g.textAlign = "center";
    g.fillText("SAMPLE SCREENSHOT FOR TESTING ONLY", 270, 880);
    return new Promise(r => c.toBlob(b => r(new File([b], "demo_upi_payment.png", { type: "image/png" })), "image/png"));
  }
  if (TEST) {
    $("#demoBar").hidden = false;
    $("#demoFill").addEventListener("click", async () => {
      const set = (n, v) => { form.elements[n].value = v; };
      form.querySelector("input[name=programme][value=course]").checked = true;
      set("fullName", "Riya Sharma"); set("age", "19"); set("gender", "Female"); set("phone", "9876543210");
      set("email", "riya.sharma@example.com");
      form.querySelector("input[name=role][value=student]").checked = true;
      form.querySelector("input[name=collegeType][value=inhouse]").checked = true;
      set("classYear", "FY BSc"); set("department", "Physics"); set("studentId", "BKB2026-0421"); set("city", "Kalyan West");
      set("guardianName", "Sunil Sharma"); set("guardianPhone", "9123456780");
      form.querySelector("input[name=paymentMode][value=online]").checked = true;
      update();
      const utr = "4" + String(Math.floor(Math.random() * 1e11)).padStart(11, "0");
      set("utr", utr); set("payerName", "GPay");
      const dt = new DataTransfer(); dt.items.add(await demoScreenshot(total(), utr));
      $("#screenshot").files = dt.files; $("#screenshot").dispatchEvent(new Event("change"));
      DECLARATIONS.forEach(n => form[n].checked = true);
      $("#shotPreview").scrollIntoView({ block: "center" });
    });
  }

  /* ---------- validation ---------- */
  function validate() {
    const errs = [];
    $$(".invalid", form).forEach(e => e.classList.remove("invalid"));
    $$("[data-error]").forEach(e => e.textContent = "");
    const bad = (name, msg) => {
      const el = form.elements[name];
      const wrap = el && el.closest && (el.closest(".field") || el.closest(".check"));
      if (wrap) wrap.classList.add("invalid");
      errs.push(msg);
    };
    const v = n => (form.elements[n].value || "").trim();
    const phoneOK = s => /^[6-9]\d{9}$/.test(s);

    if (!form.programme.value) { errs.push("Choose the Astronomy Course package or the Star Party only."); $('[data-error="programme"]').textContent = "Choose an option."; }
    if (v("fullName").length < 3) bad("fullName", "Enter your full name.");
    const age = parseInt(v("age"), 10);
    if (!age) bad("age", "Enter your age.");
    else if (age < cfg.minAge) bad("age", `The minimum age is ${cfg.minAge} years.`);
    if (!phoneOK(v("phone"))) bad("phone", "Enter a valid 10-digit mobile number.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("email"))) bad("email", "Enter a valid email address.");
    if (!form.role.value) { errs.push("Choose whether you are a student or a teacher."); $('[data-error="role"]').textContent = "Choose one."; }
    if (!form.collegeType.value) { errs.push("Choose whether you are from B. K. Birla College or from another college."); $('[data-error="collegeType"]').textContent = "Choose one."; }
    if (form.collegeType.value === "outside" && v("collegeName").length < 3) bad("collegeName", "Enter the name of your college.");
    if (!isTeacher() && !v("classYear")) bad("classYear", "Enter your Class / Year.");
    if (!v("department")) bad("department", "Enter your Department / Stream.");
    if (!v("city")) bad("city", "Enter your city or area.");
    if (!isTeacher()) {
      if (v("guardianName").length < 3) bad("guardianName", "Enter your parent or guardian's name.");
      if (!phoneOK(v("guardianPhone"))) bad("guardianPhone", "Enter your parent or guardian's 10-digit mobile number.");
      else if (v("guardianPhone") === v("phone")) bad("guardianPhone", "Your parent or guardian's number must be different from your own.");
    }
    const mode = form.paymentMode.value;
    if (!mode) { errs.push("Choose a payment method: online (UPI) or cash."); $('[data-error="paymentMode"]').textContent = "Choose a payment method."; }
    if (mode === "online") {
      if (!/^\d{12}$/.test(v("utr"))) bad("utr", "Enter the 12-digit UPI transaction ID (UTR) from your payment app.");
      const f = $("#screenshot").files[0];
      if (!f) bad("screenshot", "Upload a screenshot of your UPI payment (PNG, JPG or PDF).");
      else if (fileProblem(f)) bad("screenshot", fileProblem(f));
    }
    DECLARATIONS.forEach(n => { if (!form[n].checked) bad(n, "Please tick all the declarations."); });
    return [...new Set(errs)];
  }

  /* ---------- submit ---------- */
  const fileToBase64 = f => new Promise((res, rej) => {
    const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(",")[1]); fr.onerror = rej; fr.readAsDataURL(f);
  });
  const nowText = () => new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const errs = validate(), box = $("#formErrors");
    if (errs.length) {
      box.innerHTML = "<b>Please fix the following:</b><ul>" + errs.map(x => `<li>${x}</li>`).join("") + "</ul>";
      box.hidden = false; box.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    box.hidden = true;
    const val = n => (form.elements[n] ? form.elements[n].value || "" : "").trim();
    const online = form.paymentMode.value === "online";
    const inhouse = form.collegeType.value === "inhouse";
    const teacher = isTeacher();
    const data = {
      fullName: val("fullName"), age: val("age"), gender: val("gender"), phone: val("phone"), email: val("email"),
      role: teacher ? "Teacher" : "Student",
      collegeType: inhouse ? "In-house" : "Outside",
      institution: inhouse ? HOME_COLLEGE : val("collegeName"),
      classYear: teacher ? "" : val("classYear"), department: val("department"), studentId: teacher ? "" : val("studentId"), city: val("city"),
      programmes: { course: isCourse(), trip: true }, amount: total(),
      guardianName: teacher ? "" : val("guardianName"), guardianPhone: teacher ? "" : val("guardianPhone"), medical: val("medical"),
      paymentMode: form.paymentMode.value,
      utr: online ? val("utr") : "", payerName: online ? val("payerName") : "",
      screenshotName: "", submittedAt: nowText(), test: TEST
    };
    const submitBtn = $("#submitBtn");
    submitBtn.disabled = true; $("#busy").hidden = false;
    try {
      const f = $("#screenshot").files[0];
      if (TEST) {
        await new Promise(r => setTimeout(r, 600));
        data.id = "TEST-" + Math.random().toString(36).slice(2, 7).toUpperCase();
        if (f && online) data.screenshotName = f.name;
      } else {
        const payload = Object.assign({}, data);
        if (f && online) payload.file = { name: f.name, type: f.type || "application/octet-stream", data: await fileToBase64(f) };
        // text/plain avoids a CORS pre-flight request, which Apps Script cannot answer
        const res = await fetch(cfg.appsScriptUrl, { method: "POST", body: JSON.stringify(payload) });
        const out = await res.json();
        if (!out.ok) throw new Error(out.error || "The registration could not be saved.");
        data.id = out.id; data.submittedAt = out.submittedAt || data.submittedAt; data.screenshotName = out.fileName || (f ? f.name : "");
      }
      data.screenshotImage = await screenshotForPdf(f, data.paymentMode);
      finish(data);
    } catch (err) {
      box.innerHTML = "<b>Your registration was not submitted.</b> " + (err.message || err) + " Please try again. If it keeps failing, contact the Physics Department.";
      box.hidden = false; box.scrollIntoView({ behavior: "smooth", block: "center" });
    } finally {
      $("#busy").hidden = true; submitBtn.disabled = false;
    }
  });

  // a small JPEG copy of the screenshot to print on the acknowledgement (images only)
  function screenshotForPdf(f, mode) {
    if (mode !== "online" || !f || !/^image\/(png|jpeg|webp)$/.test(f.type)) return Promise.resolve(null);
    return new Promise(res => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, 900 / Math.max(img.width, img.height));
        const c = document.createElement("canvas"); c.width = img.width * k; c.height = img.height * k;
        const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
        res({ data: c.toDataURL("image/jpeg", 0.85), w: c.width, h: c.height });
      };
      img.onerror = () => res(null);
      img.src = URL.createObjectURL(f);
    });
  }

  /* ---------- acknowledgement + consent form: both must be downloaded before leaving ---------- */
  const allGot = () => got.ack && got.consent;
  window.addEventListener("beforeunload", e => { if (!allGot()) { e.preventDefault(); e.returnValue = ""; return ""; } });

  function makeDocs(data) {
    docs = {
      ack: window.buildAcknowledgement(data, logoDataUrl), ackName: "Acknowledgement_" + data.id + ".pdf",
      consent: data.role === "Teacher" ? null : window.buildConsentForm(data, logoDataUrl), consentName: "Parental_Consent_Form_" + data.id + ".pdf"
    };
  }
  function refreshModal() {
    $("#ackDownload").classList.toggle("done", got.ack);
    $("#consentDownload").classList.toggle("done", got.consent);
    $("#ackClose").disabled = !allGot();
    $("#ackCloseHint").textContent = allGot()
      ? (docs.consent ? "Both downloaded. Print the acknowledgement and get the consent form signed by your parent or guardian." : "Downloaded. Print it and bring it to the Physics Department.")
      : (docs.consent ? "You can close this window after downloading both." : "You can close this window after downloading.");
  }
  function finish(data) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(Object.assign({}, data, { screenshotImage: null }))); } catch (_) {}
    makeDocs(data);
    const teacher = data.role === "Teacher";
    got = { ack: false, consent: teacher };   // teachers have no consent form
    $("#consentDownload").hidden = teacher;
    $("#ackDownload").textContent = teacher ? "Download acknowledgement (PDF)" : "1. Download acknowledgement (PDF)";
    showRole($("#ackModal"), teacher);
    form.reset(); update();
    $$("input, select, button", form).forEach(el => el.disabled = true);
    $("#ackId").textContent = data.id;
    refreshModal();
    $("#ackModal").hidden = false;
    document.body.style.overflow = "hidden";
    history.pushState({ ack: true }, "");
  }
  $("#ackDownload").addEventListener("click", () => { docs.ack.save(docs.ackName); got.ack = true; refreshModal(); });
  $("#consentDownload").addEventListener("click", () => { docs.consent.save(docs.consentName); got.consent = true; refreshModal(); });
  $("#ackClose").addEventListener("click", () => {
    if (!allGot()) return;
    $("#ackModal").hidden = true; document.body.style.overflow = "";
    $$("input, select, button", form).forEach(el => el.disabled = false);   // allow registering another person
    showPrevious();
  });
  // the Back button should not slip past the downloads either
  window.addEventListener("popstate", () => {
    if (!allGot()) { history.pushState({ ack: true }, ""); $("#ackModal").hidden = false; }
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !allGot()) e.preventDefault(); });

  /* ---------- registered earlier on this device ---------- */
  function showPrevious() {
    let prev = null;
    try { prev = JSON.parse(localStorage.getItem(STORE_KEY) || "null"); } catch (_) {}
    if (!prev) return;
    $("#prevId").textContent = prev.id;
    $("#previousBanner").hidden = false;
    $("#prevDownload").onclick = () => { makeDocs(prev); docs.ack.save(docs.ackName); };
    $("#prevConsent").onclick = () => { makeDocs(prev); if (docs.consent) docs.consent.save(docs.consentName); };
    $("#prevConsent").hidden = prev.role === "Teacher";
  }
  showPrevious();
  update();
})();
