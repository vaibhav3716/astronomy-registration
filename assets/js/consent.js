/* Builds the parent / guardian consent form (A4) for the stargazing trip, pre-filled with
   the student's details. The parent signs it and the student submits it with the acknowledgement. */
(function () {
  const INDIGO = [0, 0, 0], TEAL = [0, 0, 0], SLATE = [60, 60, 60], LINE = [140, 140, 140], BAR = [225, 225, 225];

  // pass an existing jsPDF document to add the form as its last page (printed with the acknowledgement)
  window.buildConsentForm = function (d, logoDataUrl, into) {
    const cfg = window.SITE_CONFIG;
    const { jsPDF } = window.jspdf;
    const doc = into || new jsPDF({ unit: "mm", format: "a4" });
    if (into) doc.addPage();
    const W = 210, M = 15, CW = W - 2 * M;
    let y = 10;

    // letterhead
    if (logoDataUrl) {
      const lw = 136, lh = lw * 183 / 1043;
      doc.addImage(logoDataUrl, "JPEG", (W - lw) / 2, y, lw, lh);
      y += lh + 2;
    }
    doc.setDrawColor(...INDIGO); doc.setLineWidth(0.6); doc.line(M, y, W - M, y);
    y += 6;
    doc.setFont("helvetica", "bold"); doc.setFontSize(11.5); doc.setTextColor(...TEAL);
    doc.text("DEPARTMENT OF PHYSICS", W / 2, y, { align: "center" });
    y += 6.5;
    doc.setFontSize(15.5); doc.setTextColor(...INDIGO);
    doc.text("Parent / Guardian Consent Form", W / 2, y, { align: "center" });
    y += 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...SLATE);
    doc.text("Star Party (stargazing trip)  |  Registration ID: " + d.id, W / 2, y, { align: "center" });
    y += 5;

    // student and trip details (pre-filled)
    const rows = [
      ["Student's name", d.fullName],
      ["Class / Department", d.classYear + ", " + d.department],
      ["College", d.institution],
      ["Student's mobile", d.phone],
      ["Parent / Guardian", d.guardianName + ", " + d.guardianPhone],
      ["Venue", ""],
      ["Date", ""],
      ["Travel", "Bus from college, to the site and back"],
    ];
    doc.setFontSize(9.5);
    rows.forEach((r, i) => {
      const blank = r[0] === "Venue" || r[0] === "Date";   // left empty, to be filled in with a pen
      const val = blank ? [] : doc.splitTextToSize(String(r[1] || "-"), CW - 44);
      const h = blank ? 9 : Math.max(5.4, 4.2 * val.length + 1.3);
      if (i % 2 === 0) { doc.setFillColor(244, 244, 244); doc.rect(M, y, CW, h, "F"); }
      doc.setFont("helvetica", "bold"); doc.setTextColor(...SLATE); doc.text(r[0], M + 3, y + 4);
      doc.setFont("helvetica", "normal"); doc.setTextColor(25, 30, 50);
      if (blank) { doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.25); doc.line(M + 42, y + 7, r[0] === "Date" ? M + 100 : W - M - 3, y + 7); }
      else doc.text(val, M + 42, y + 4);
      y += h;
    });
    y += 5;

    // consent statement
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(25, 30, 50);
    const para = "I, ____________________________________ (Parent / Guardian), give my consent for my ward " + d.fullName +
      " to take part in the Star Party organised by the Department of Physics, B. K. Birla College of Arts, Science & Commerce, Kalyan, " +
      "including the night spent outdoors at the observing site and travel to and from the site by bus from the college. " +
      "My ward and I have read and agree to the following:";
    const pl = doc.splitTextToSize(para, CW);
    doc.text(pl, M, y); y += pl.length * 4.6 + 2;

    const rules = [
      "My ward will follow all rules and instructions laid down by the teachers and organisers, stay with the group at all times, and will not leave the group or the site without permission.",
      "My ward will not take part in any activity that could harm himself / herself or anyone else, and will not cause any mishap. Alcohol, tobacco and drugs are strictly not allowed, and no one may go near the water's edge.",
      "The college and the organisers are not responsible for the loss of, or damage to, jewellery, cash, mobile phones or any other personal belongings. Valuables should not be brought on the trip.",
      "The organisers will take reasonable care of all participants. The college and the organisers are not liable for any mishap, injury or loss that results from my ward not following the rules and instructions.",
      "In a medical emergency the organisers may give first aid or take my ward to the nearest medical facility, and will inform me. Medical conditions / allergies: " + (d.medical || "none declared") + ".",
      "The fee is not refundable once paid.",
    ];
    doc.setFontSize(9.4);
    rules.forEach((r, i) => {
      const lines = doc.splitTextToSize(r, CW - 7);
      doc.setFont("helvetica", "bold"); doc.text((i + 1) + ".", M, y);
      doc.setFont("helvetica", "normal"); doc.text(lines, M + 6, y);
      y += lines.length * 4.2 + 1.6;
    });
    y += 4;

    // signatures
    doc.setDrawColor(...INDIGO); doc.setLineWidth(0.4); doc.rect(M, y, CW, 48);
    doc.setFillColor(...BAR); doc.rect(M, y, CW, 6.5, "FD");
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(0, 0, 0);
    doc.text("SIGNATURES", M + 3, y + 4.5);
    doc.setFont("helvetica", "normal"); doc.setTextColor(25, 30, 50); doc.setFontSize(9.8);
    const sy = y + 14, col2 = M + CW / 2 + 4;
    doc.text("Parent / Guardian's name: ____________________________", M + 3, sy);
    doc.text("Relationship: ____________________", col2 + 10, sy);
    doc.text("Mobile: ____________________________", M + 3, sy + 9);
    doc.text("Date: ____ / ____ / ________", col2 + 10, sy + 9);
    doc.line(M + 3, sy + 25, M + 75, sy + 25);
    doc.line(col2 + 10, sy + 25, W - M - 3, sy + 25);
    doc.setFontSize(8.5); doc.setTextColor(...SLATE);
    doc.text("Signature of Parent / Guardian", M + 39, sy + 29, { align: "center" });
    doc.text("Signature of student (" + d.fullName + ")", (col2 + 10 + W - M - 3) / 2, sy + 29, { align: "center" });
    y += 53;

    // office use
    doc.setDrawColor(...LINE); doc.setLineWidth(0.3); doc.rect(M, y, CW, 13);
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...INDIGO);
    doc.text("FOR OFFICE USE", M + 3, y + 5);
    doc.setFont("helvetica", "normal"); doc.setTextColor(25, 30, 50);
    doc.rect(M + 3, y + 7.3, 3.5, 3.5); doc.text("Signed consent form received", M + 8.5, y + 10.2);
    doc.text("Received by: ________________   Sign: ____________   Date: ___ / ___ / _____", M + 62, y + 10.2);
    y += 18;

    doc.setFont("helvetica", "bold"); doc.setFontSize(9.2); doc.setTextColor(0, 0, 0);
    const note = doc.splitTextToSize("Submit this form, signed by your parent or guardian, together with the printed acknowledgement at the Physics Department within " +
      cfg.submitWithinDays + " days. Until both are submitted, your registration is not complete.", CW);
    doc.text(note, W / 2, y, { align: "center" });

    if (d.test) {
      if (doc.GState) doc.setGState(new doc.GState({ opacity: 0.18 }));
      doc.setTextColor(120, 120, 120); doc.setFont("helvetica", "bold"); doc.setFontSize(54);
      doc.text("TEST ONLY", W / 2, 150, { align: "center", angle: 30 });
      if (doc.GState) doc.setGState(new doc.GState({ opacity: 1 }));
    }
    doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(110, 110, 110);
    doc.text("Generated online on " + d.submittedAt + " for registration " + d.id + ".", W / 2, 293.5, { align: "center" });
    return doc;
  };
})();
