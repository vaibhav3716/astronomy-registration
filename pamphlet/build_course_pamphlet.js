/* Builds the A4 Astronomy Course registration pamphlet (PDF for printing, PNG for WhatsApp).
   Usage (from this folder): node build_course_pamphlet.js [registration-url] [contact]
   Needs Google Chrome installed. */
const fs = require("fs"), path = require("path"), vm = require("vm"), { execFileSync } = require("child_process");
const [url = "https://birlaphysics.github.io/astronomy-registration/", contact = ""] = process.argv.slice(2);
const here = __dirname;
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(here, "lib/qrcode.min.js"), "utf8"), ctx);
const q = ctx.qrcode(0, "M"); q.addData(url); q.make();
const html = fs.readFileSync(path.join(here, "course_template.html"), "utf8")
  .replace("{{QR_SVG}}", q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }))
  .replace("{{URL}}", url.replace(/^https?:\/\//, "")).replace("{{CONTACT}}", contact);
const out = path.join(here, "course_pamphlet.html");
fs.writeFileSync(out, html);
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const common = ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--virtual-time-budget=8000", "--allow-file-access-from-files"];
execFileSync(chrome, [...common, "--no-pdf-header-footer", "--print-to-pdf=" + path.join(here, "Course_Pamphlet_A4.pdf"), "file://" + out], { stdio: "ignore" });
execFileSync(chrome, [...common, "--window-size=794,1123", "--force-device-scale-factor=2", "--screenshot=" + path.join(here, "Course_Pamphlet.png"), "file://" + out], { stdio: "ignore" });
console.log("Course pamphlet built for", url);
