/* Builds the registration acknowledgement PDF (A4) with jsPDF.
   Top part: submitted at the Physics Department (signed by the clerk / verifier).
   Bottom strip: student's copy, signed and handed back as proof. */
(function () {
  // black and white only (prints the same on any printer)
  const INDIGO = [0, 0, 0], TEAL = [0, 0, 0], SLATE = [60, 60, 60], LINE = [140, 140, 140], GOLD = [0, 0, 0], BAR = [225, 225, 225];

  function rs(n) { return "Rs. " + Number(n).toLocaleString("en-IN") + "/-"; }

  function programmesText(p) {
    const cfg = window.SITE_CONFIG;
    return p.course
      ? "Astronomy Course (incl. Star Party)  (" + rs(cfg.fees.course) + ")"
      : "Star Party (Stargazing) only (" + rs(cfg.fees.trip) + ")";
  }
  function programmesShort(p) { return p.course ? "Astronomy Course (incl. Star Party)" : "Star Party (Stargazing) only"; }

  // draw a QR code as vector squares (crisp when printed)
  function drawQR(doc, text, x, y, size) {
    const q = qrcode(0, "M"); q.addData(text); q.make();
    const n = q.getModuleCount(), quiet = 2, cell = size / (n + 2 * quiet);
    doc.setFillColor(255, 255, 255); doc.rect(x, y, size, size, "F");
    doc.setFillColor(0, 0, 0);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++)
      if (q.isDark(r, c)) doc.rect(x + (c + quiet) * cell, y + (r + quiet) * cell, cell + 0.02, cell + 0.02, "F");
  }

  window.buildAcknowledgement = function (d, logoDataUrl) {
    const cfg = window.SITE_CONFIG;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = 210, M = 14, CW = W - 2 * M;
    let y = 10;

    // letterhead
    if (logoDataUrl) {
      const lw = 136, lh = lw * 183 / 1043;
      doc.addImage(logoDataUrl, "JPEG", (W - lw) / 2, y, lw, lh);
      y += lh + 2;
    } else {
      doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(...INDIGO);
      doc.text("B. K. BIRLA COLLEGE OF ARTS, SCIENCE & COMMERCE, KALYAN", W / 2, y + 6, { align: "center" });
      y += 12;
    }
    doc.setDrawColor(...INDIGO); doc.setLineWidth(0.6); doc.line(M, y, W - M, y);
    y += 6;
    doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(...TEAL);
    doc.text("DEPARTMENT OF PHYSICS", W / 2, y, { align: "center" });
    y += 7;
    doc.setFontSize(16); doc.setTextColor(...INDIGO);
    doc.text("Registration Acknowledgement", W / 2, y, { align: "center" });
    y += 3;
    // what they registered for, in bold, right under the heading
    const what = d.programmes.course
      ? "ASTRONOMY COURSE  (incl. Star Party)"
      : "STAR PARTY (STARGAZING) ONLY";
    doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.6);
    doc.roundedRect(M + 22, y, CW - 44, 8, 2, 2, "S");
    doc.setFont("helvetica", "bold"); doc.setFontSize(11.5); doc.setTextColor(0, 0, 0);
    doc.text(what, W / 2, y + 5.6, { align: "center" });
    y += 11;

    // registration id block with QR code
    const qrText = ["BKBCK", d.id, d.fullName, d.amount, d.paymentMode, d.utr || "-"].join("|");
    const boxY = y;
    doc.setFillColor(245, 245, 245); doc.setDrawColor(...LINE); doc.setLineWidth(0.3);
    doc.roundedRect(M, boxY, CW, 26, 2, 2, "FD");
    drawQR(doc, qrText, W - M - 24.5, boxY + 1, 24);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...SLATE);
    doc.text("REGISTRATION ID", M + 4, boxY + 7);
    doc.setFont("helvetica", "bold"); doc.setFontSize(17); doc.setTextColor(...INDIGO);
    doc.text(d.id, M + 4, boxY + 15);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...SLATE);
    doc.text("Submitted on " + d.submittedAt, M + 4, boxY + 21.5);
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...TEAL);
    doc.text("Amount: " + rs(d.amount), M + 95, boxY + 11);
    doc.setFontSize(10); doc.setTextColor(...INDIGO);
    doc.text(d.paymentMode === "online" ? "Paid online (UPI)" : "To be paid in cash", M + 95, boxY + 18);
    y = boxY + 31;

    // details table
    const rows = [
      ["Full name", d.fullName],
      ["Age / Gender", d.age + (d.gender ? " / " + d.gender : "")],
      ["Mobile", d.phone],
      ["Email", d.email],
      ["College", (d.collegeType === "In-house" ? "In-house: " : "Outside: ") + d.institution],
      d.role === "Teacher" ? ["Role / Department", "Teacher, " + d.department]
        : ["Class / Department", d.classYear + ", " + d.department + (d.studentId ? "   (Student ID: " + d.studentId + ")" : "")],
      ["City / Area", d.city],
      ["Programme", programmesText(d.programmes)],
    ];
    if (d.programmes.course) rows.push(["Certificate", "Given after attending the lectures and appearing for the exam"]);
    if (d.role !== "Teacher") rows.push(["Parent / Guardian", d.guardianName + ", " + d.guardianPhone + " (emergency contact)"]);
    rows.push(["Star Party", (d.programmes.course ? "Included. Date and venue will be announced; fill them in on the consent form. "
      : "Date: " + cfg.trip.date + ". ") + "Travel: bus from college"]);
    if (d.medical) rows.push(["Medical notes", d.medical]);
    if (d.paymentMode === "online") {
      rows.push(["UPI transaction ID", d.utr + (d.payerName ? "   (paid from: " + d.payerName + ")" : "")]);
      rows.push(["Screenshot uploaded", d.screenshotName || "-"]);
    } else {
      rows.push(["Pay at", cfg.cash.place]);
    }

    const labelW = 46;
    doc.setFontSize(10);
    rows.forEach((r, i) => {
      const val = doc.splitTextToSize(String(r[1] || "-"), CW - labelW - 4);
      const h = Math.max(5.5, 4.4 * val.length + 1.4);
      if (i % 2 === 0) { doc.setFillColor(244, 244, 244); doc.rect(M, y, CW, h, "F"); }
      doc.setFont("helvetica", "bold"); doc.setTextColor(...SLATE);
      doc.text(r[0], M + 3, y + 4.3);
      doc.setFont("helvetica", "normal"); doc.setTextColor(25, 30, 50);
      doc.text(val, M + labelW, y + 4.3);
      y += h;
    });
    doc.setDrawColor(...LINE); doc.line(M, y, W - M, y);
    y += 5;

    // office use box
    const boxH = 34;
    doc.setDrawColor(...INDIGO); doc.setLineWidth(0.5);
    doc.rect(M, y, CW, boxH);
    doc.setFillColor(...BAR); doc.rect(M, y, CW, 6.5, "FD");
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(0, 0, 0);
    doc.text("FOR OFFICE USE ONLY", M + 3, y + 4.5);
    doc.text(d.paymentMode === "online" ? "Online payment verification" : "Cash payment", W - M - 3, y + 4.5, { align: "right" });
    doc.setTextColor(25, 30, 50); doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    const oy = y + 13;
    if (d.paymentMode === "online") {
      doc.rect(M + 3, oy - 3.4, 4, 4); doc.text("Online transaction verified (UTR " + d.utr + ", " + rs(d.amount) + ")", M + 9.5, oy);
      doc.text("Receipt No.: ______________", M + 3, oy + 9);
      doc.text("Date: ____ / ____ / ________", M + 70, oy + 9);
      doc.text("Verified by (name): ______________________", M + 3, oy + 18);
    } else {
      doc.text("Amount received: Rs. ______________", M + 3, oy);
      doc.text("Receipt No.: ______________", M + 3, oy + 9);
      doc.text("Date: ____ / ____ / ________", M + 70, oy + 9);
      doc.text("Received by (name): ______________________", M + 3, oy + 18);
    }
    doc.line(W - M - 50, y + boxH - 7, W - M - 4, y + boxH - 7);
    doc.setFontSize(8.5); doc.setTextColor(...SLATE);
    doc.text(d.paymentMode === "online" ? "Signature of verifying staff & stamp" : "Signature of Clerk & stamp", W - M - 27, y + boxH - 3, { align: "center" });
    y += boxH + 5;

    // instructions
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...INDIGO);
    doc.text("What to do next", M, y); y += 4.8;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9.2); doc.setTextColor(40, 45, 60);
    const steps = d.paymentMode === "online"
      ? ["Bring the PRINTOUT of this acknowledgement and the PARENTAL CONSENT FORM signed by your parent or guardian to the " + cfg.cash.place + " within " + cfg.submitWithinDays + " days.",
         "The office will check your UPI payment, sign the box above, keep this page and the consent form, and return the student's copy below with your receipt."]
      : ["Bring the PRINTOUT of this acknowledgement, the PARENTAL CONSENT FORM signed by your parent or guardian, and " + rs(d.amount) + " in cash to the " + cfg.cash.place + " (" + cfg.cash.timing + ") within " + cfg.submitWithinDays + " days.",
         "The clerk will sign the box above, keep this page and the consent form, and return the student's copy below with your fee receipt."];
    if (d.role === "Teacher") {
      steps[0] = steps[0].replace(" and the PARENTAL CONSENT FORM signed by your parent or guardian", "").replace(", the PARENTAL CONSENT FORM signed by your parent or guardian,", "");
      steps[1] = steps[1].replace(" and the consent form", "");
      steps.push("Your registration is complete once the office signs the box above.");
    } else {
      steps[0] = steps[0].replace("PARENTAL CONSENT FORM signed", "PARENTAL CONSENT FORM (the last page of this PDF) signed");
      steps.push("Until both the acknowledgement and the signed consent form are submitted, your registration is NOT complete.");
    }
    // course registrants: WhatsApp group QR beside the steps
    const wa = cfg.whatsappGroup, showWa = !!(wa && wa.url && d.programmes.course && d.paymentMode === "online");
    if (showWa) steps.push("Join the course WhatsApp group for class updates: scan the QR code on the right or open " + wa.url);
    const stepsTop = y, stepW = showWa ? CW - 30 : CW;
    steps.forEach((s, i) => {
      const lines = doc.splitTextToSize((i + 1) + ". " + s, stepW);
      doc.text(lines, M, y); y += lines.length * 4.1 + 0.8;
    });
    if (showWa) {
      const qs = 24, qx = W - M - qs, qy = stepsTop - 6;
      drawQR(doc, wa.url, qx, qy, qs);
      doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(0, 0, 0);
      doc.text("WhatsApp group", qx + qs / 2, qy + qs + 3, { align: "center" });
      y = Math.max(y, qy + qs + 5);
    }

    // cut line
    y = Math.max(y + 3, 230);
    doc.setLineDashPattern([1.5, 1.5], 0); doc.setDrawColor(...SLATE); doc.setLineWidth(0.3);
    doc.line(M, y, W - M, y); doc.setLineDashPattern([], 0);
    doc.setFontSize(8); doc.setTextColor(...SLATE);
    doc.text("cut here - student's copy", W / 2, y - 1.5, { align: "center" });
    y += 5;

    // student's copy
    doc.setFillColor(...BAR); doc.setDrawColor(0, 0, 0); doc.rect(M, y, CW, 6.5, "FD");
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(0, 0, 0);
    doc.text("STUDENT'S COPY  |  Department of Physics, B. K. Birla College, Kalyan", M + 3, y + 4.5);
    y += 11;
    doc.setTextColor(25, 30, 50); doc.setFontSize(9.5);
    const sc = [
      ["Registration ID", d.id], ["Name", d.fullName],
      ["Programme", programmesShort(d.programmes)],
      ["Amount", rs(d.amount) + (d.paymentMode === "online" ? "  (UPI, UTR " + d.utr + ")" : "  (cash)")],
      ["Receipt No.", "____________________"],
    ];
    const top = y;
    sc.forEach(r => {
      doc.setFont("helvetica", "bold"); doc.text(r[0] + ":", M + 2, y);
      doc.setFont("helvetica", "normal"); doc.text(doc.splitTextToSize(r[1], 82)[0], M + 30, y);
      y += 5.4;
    });
    // signature and stamp box
    const bw = 56, bx = W - M - bw, by = top - 4, bh = 27;
    doc.setDrawColor(...LINE); doc.setLineWidth(0.3); doc.rect(bx, by, bw, bh);
    doc.setFontSize(8); doc.setTextColor(...SLATE);
    doc.text(d.paymentMode === "online" ? "Payment verified" : "Fee received", bx + bw / 2, by + 4, { align: "center" });
    doc.text("Sign & stamp of " + (d.paymentMode === "online" ? "verifying staff" : "Clerk"), bx + bw / 2, by + bh - 2.5, { align: "center" });

    // TEST stamp (drawn last, semi-transparent, so it sits over everything)
    if (d.test) {
      if (doc.GState) doc.setGState(new doc.GState({ opacity: 0.18 }));
      doc.setTextColor(120, 120, 120); doc.setFont("helvetica", "bold"); doc.setFontSize(54);
      doc.text("TEST ONLY", W / 2, 140, { align: "center", angle: 30 });
      doc.setFontSize(30);
      doc.text("NOT A REGISTRATION", W / 2 + 6, 158, { align: "center", angle: 30 });
      if (doc.GState) doc.setGState(new doc.GState({ opacity: 1 }));
    }

    // footer
    const footer = () => {
      doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(110, 110, 110);
      doc.text("Generated online on " + d.submittedAt + ". The registration ID and QR code are unique to this registration.", W / 2, 293.5, { align: "center" });
    };
    footer();

    // page 2: the uploaded payment screenshot, so the office can check it against the UTR
    if (d.paymentMode === "online" && d.screenshotImage) {
      doc.addPage();
      doc.setFillColor(...BAR); doc.setDrawColor(0, 0, 0); doc.rect(M, 14, CW, 8, "FD");
      doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(0, 0, 0);
      doc.text("ATTACHMENT: UPI PAYMENT SCREENSHOT", M + 3, 19.5);
      doc.text(d.id, W - M - 3, 19.5, { align: "right" });
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(25, 30, 50);
      doc.text("Name: " + d.fullName + "     UTR: " + d.utr + "     Amount: " + rs(d.amount) + "     File: " + (d.screenshotName || "-"), M, 29);
      const im = d.screenshotImage, maxW = CW, maxH = 240;
      const k = Math.min(maxW / im.w, maxH / im.h);
      const iw = im.w * k, ih = im.h * k;
      doc.setDrawColor(...LINE); doc.rect((W - iw) / 2 - 1, 35 - 1, iw + 2, ih + 2);
      doc.addImage(im.data, "JPEG", (W - iw) / 2, 35, iw, ih);
      if (d.test) {
        if (doc.GState) doc.setGState(new doc.GState({ opacity: 0.18 }));
        doc.setTextColor(120, 120, 120); doc.setFont("helvetica", "bold"); doc.setFontSize(54);
        doc.text("TEST ONLY", W / 2, 160, { align: "center", angle: 30 });
        if (doc.GState) doc.setGState(new doc.GState({ opacity: 1 }));
      }
      footer();
    }
    return doc;
  };
})();
