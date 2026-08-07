import fs from "node:fs";

const path = "app.html";
const html = fs.readFileSync(path, "utf8");
const marker = '<script src="home-reward-coordinator.js?v=5.4.22"><\\/script>';
const insertion = `${marker}<script src="daily-key-reward-priority-v1.js?v=1.0.0"><\\/script>`;

if (html.includes("daily-key-reward-priority-v1.js")) {
  console.log("Daily Key priority guard already installed.");
  process.exit(0);
}
if (!html.includes(marker)) throw new Error("Could not find home reward coordinator insertion point in app.html");
fs.writeFileSync(path, html.replace(marker, insertion));
console.log("Installed Daily Key priority guard before badge scripts.");
