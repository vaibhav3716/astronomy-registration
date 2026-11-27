/* Puts what people type into a proper, consistent format before it is saved or printed.
   "vaibhav", "VAIBHAV", "VaIbhaV"  ->  "Vaibhav".  The same rules run in apps-script/Code.gs. */
(function (root) {
  const SMALL = new Set(["of", "and", "the", "for", "in", "at", "on", "to", "de"]);
  // degree / class short forms written the usual way
  const SHORT = { fy: "FY", sy: "SY", ty: "TY", fe: "FE", se: "SE", te: "TE", be: "BE", me: "ME",
    ba: "BA", ma: "MA", bsc: "BSc", msc: "MSc", bcom: "BCom", mcom: "MCom", bms: "BMS", baf: "BAF",
    bbi: "BBI", bfm: "BFM", bba: "BBA", mba: "MBA", bca: "BCA", mca: "MCA", bmm: "BMM", bed: "BEd",
    med: "MEd", phd: "PhD", it: "IT", cs: "CS", ai: "AI", ds: "DS", hsc: "HSC", ssc: "SSC", xi: "XI", xii: "XII",
    kalyan: "Kalyan", bk: "B. K.", "b.k": "B. K.", "b.k.": "B. K." };

  const squash = s => String(s == null ? "" : s).replace(/\s+/g, " ").trim();

  // capitalise one word, keeping hyphens, apostrophes and initials (a.k. -> A.K.)
  function capWord(w) {
    return w.toLowerCase().replace(/(^|[-'.(/])([a-zÀ-ɏ])/g, (m, p, c) => p + c.toUpperCase());
  }

  // names of people and places: every word capitalised
  function name(s) {
    return squash(s).split(" ").map(capWord).join(" ").replace(/\b([A-Z])\.(?=[A-Z])/g, "$1. ");
  }

  // titles such as college names and departments: small words stay lower case
  function title(s) {
    return squash(s).split(" ").map((w, i) => {
      const key = w.toLowerCase();
      if (SHORT[key]) return SHORT[key];
      if (i > 0 && SMALL.has(key)) return key;
      if (key === "&") return "&";
      return capWord(w);
    }).join(" ").replace(/\b([A-Z])\.(?=[A-Z])/g, "$1. ");
  }

  // class / year: known short forms (FY, BSc, BCom ...) fixed, other words capitalised
  function classYear(s) {
    return squash(s).split(" ").map(w => SHORT[w.toLowerCase()] || (w.length <= 3 && /^[a-z]+$/i.test(w) ? w.toUpperCase() : capWord(w))).join(" ");
  }

  // free text: first letter capital, the rest left as written
  function sentence(s) { s = squash(s); return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  const lower = s => squash(s).toLowerCase();
  const upper = s => squash(s).toUpperCase();
  const digits = s => String(s == null ? "" : s).replace(/\D/g, "");

  root.FMT = { name, title, classYear, sentence, lower, upper, digits };
})(typeof window !== "undefined" ? window : this);
