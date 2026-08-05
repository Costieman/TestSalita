import fs from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), "utf8");
const fail = message => { throw new Error(message); };

const loaderPath = "level-up-mobile-safety-v552.js";
const modulePath = "src/features/interface/level-up-mobile-safety-v552.js";
const loader = read(loaderPath);
const safety = read(modulePath);
const manifestSource = read("src/config/course-manifest.js");
const refresh = read("mobile-refresh.html");
const worker = read("service-worker.js");

new vm.Script(loader, {filename:loaderPath});
new vm.Script(safety, {filename:modulePath});
new vm.Script(worker, {filename:"service-worker.js"});

for (const required of [
  'const TARGET = "./src/features/interface/level-up-mobile-safety-v552.js?v=5.5.3"',
  "document.currentScript",
  "document.write",
  "script.async = false",
  "salitaCompatibilityLoader"
]) {
  if (!loader.includes(required)) fail(`Compatibility loader is missing ${required}`);
}

for (const required of [
  'const INSTALL_FLAG = "__salitaQuestLevelUpMobileSafetyV552Installed"',
  'const RELEASE = "5.5.3"',
  "window.SalitaLevelProgression",
  "window.SalitaPopupGovernor",
  'window.addEventListener("pageshow"',
  'document.addEventListener("visibilitychange"',
  "window.SalitaLevelUpMobileSafety"
]) {
  if (!safety.includes(required)) fail(`Extracted module is missing ${required}`);
}

const context = {window:{}};
vm.createContext(context);
vm.runInContext(manifestSource, context, {filename:"src/config/course-manifest.js"});
const courses = context.window.SalitaQuestCourseManifest?.courses;
if (!courses) fail("Course manifest was not installed");
const expected = "src/features/interface/level-up-mobile-safety-v552.js?v=5.5.3";
for (const courseId of ["tagalog", "cebuano"]) {
  const scripts = courses[courseId]?.scripts || [];
  const level = scripts.indexOf("level-progression-v2.js?v=5.5.3");
  const safetyIndex = scripts.indexOf(expected);
  if (level < 0 || safetyIndex <= level) fail(`${courseId} must load the extracted safety module after level progression`);
  if (scripts.includes("level-up-mobile-safety-v552.js?v=5.5.3")) fail(`${courseId} still loads the root compatibility URL`);
}

if (!refresh.includes("src/features/interface/level-up-mobile-safety-v552.js")) {
  fail("Mobile refresh does not fetch the extracted module directly");
}
if (/localStorage\.(?:clear|removeItem)\(/.test(refresh)) {
  fail("Mobile refresh must not clear learner local storage");
}

for (const required of [
  'const PREVIOUS_CACHE_NAME = "salita-quest-v5-6-19-long-term-badge-adapter-extraction-r72"',
  'const CACHE_NAME = "salita-quest-v5-6-20-avatar-case-profile-adapter-extraction-r73"',
  '"./level-up-mobile-safety-v552.js"',
  '"./src/features/interface/level-up-mobile-safety-v552.js"'
]) {
  if (!worker.includes(required)) fail(`Service worker is missing ${required}`);
}

console.log("Level-up mobile-safety extraction validation passed: direct module loading, root compatibility forwarding, single implementation ownership and r54 offline delivery.");
