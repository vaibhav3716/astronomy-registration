/* Builds the A4 pamphlet (PDF for printing, PNG for WhatsApp) with a QR code to the registration page.
   Usage (from this folder):
     node build_pamphlet.js "https://USERNAME.github.io/astronomy-registration/" "Saturday, 12 December 2026" "Contact: Name, 9XXXXXXXXX"
   Needs Google Chrome installed (used to turn the page into PDF / PNG). */
const fs = require("fs"), path = require("path"), vm = require("vm"), { execFileSync } = require("child_process");
const [url = "https://USERNAME.github.io/astronomy-registration/", date = "Date to be announced", contact = ""] = process.argv.slice(2);
const here = __dirname;

// QR code as SVG, using the same qrcode-generator library as the website
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(here, "lib/qrcode.min.js"), "utf8"), ctx);
const q = ctx.qrcode(0, "M"); q.addData(url); q.make();
const svg = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });

const html = fs.readFileSync(path.join(here, "template.html"), "utf8")
  .replace("{{QR_SVG}}", svg).replace("{{URL}}", url.replace(/^https?:\/\//, ""))
  .replace("{{DATE}}", date).replace("{{CONTACT}}", contact);
const out = path.join(here, "pamphlet.html");
fs.writeFileSync(out, html);

const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const common = ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--virtual-time-budget=8000", "--allow-file-access-from-files"];
execFileSync(chrome, [...common, "--no-pdf-header-footer", "--print-to-pdf=" + path.join(here, "StarParty_Pamphlet_A4.pdf"), "file://" + out], { stdio: "ignore" });
// 794 x 1123 CSS px = A4 at 96 dpi; scale 2 gives a sharp image for phones
execFileSync(chrome, [...common, "--window-size=794,1123", "--force-device-scale-factor=2", "--screenshot=" + path.join(here, "StarParty_Pamphlet.png"), "file://" + out], { stdio: "ignore" });
console.log("Pamphlet built for", url);
