import fs from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), "utf8");
const fail = message => { throw new Error(message); };

const safety = read("level-up-mobile-safety-v552.js");
const app = read("app.html");
const bisaya = read("bisaya.html");
const refresh = read("mobile-refresh.html");
const worker = read("service-worker.js");

new vm.Script(safety, {filename:"level-up-mobile-safety-v552.js"});
new vm.Script(worker, {filename:"service-worker.js"});

for (const required of [
  'const RELEASE = "5.5.2"',
  "STALE_PENDING_MS",
  "system.lastKnownLevel = level",
  "system.lastCelebratedLevel = level",
  "system.pendingLevelUp = null",
  "celebration_dom_inserted",
  ".level-up-celebration",
  "pagehide_during_celebration",
  "hidden_during_celebration",
  "lastCelebrationAcknowledgedBy",
  "SalitaLevelUpMobileSafety"
]) {
  if (!safety.includes(required)) fail(`Mobile level-up safety is missing ${required}`);
}

for (const [name, source] of [["Tagalog", app], ["Bisaya", bisaya]]) {
  for (const required of [
    "profile-emblem-control.js?v=5.5.2",
    "level-progression-v2.js?v=5.5.2",
    "level-up-mobile-safety-v552.js?v=5.5.2",
    "desktop-navigation-refinement.js?v=5.5.2"
  ]) {
    if (!source.includes(required)) fail(`${name} loader is missing ${required}`);
  }
  const levelIndex = source.indexOf("level-progression-v2.js?v=5.5.2");
  const safetyIndex = source.indexOf("level-up-mobile-safety-v552.js?v=5.5.2");
  if (levelIndex < 0 || safetyIndex <= levelIndex) fail(`${name} must load level safety after Level Progression V2`);
}

for (const required of [
  'const RELEASE = "5.5.2"',
  "caches.keys()",
  "caches.delete(key)",
  "navigator.serviceWorker.getRegistrations()",
  "registration.unregister()",
  'updateViaCache:"none"',
  'fetch(url, {cache:"reload"',
  "level-up-mobile-safety-v552.js",
  "Your learner profiles and progress are not deleted"
]) {
  if (!refresh.includes(required)) fail(`Mobile refresh page is missing ${required}`);
}
if (/localStorage\.(?:clear|removeItem)/.test(refresh)) {
  fail("Mobile refresh page must not clear learner localStorage");
}

for (const required of [
  'salita-quest-v5-5-2-mobile-level-safety-r45',
  '"./mobile-refresh.html"',
  '"./level-up-mobile-safety-v552.js"',
  'new Request(event.request, {cache:"reload"})'
]) {
  if (!worker.includes(required)) fail(`Service worker is missing ${required}`);
}

console.log("Mobile Level-Up Hotfix 5.5.2 validation passed: fresh phone runtimes, once-only level acknowledgement, safe cache refresh and preserved learner storage.");
