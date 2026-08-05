import fs from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), "utf8");
const fail = message => { throw new Error(message); };

const loaderPath = "pronunciation-release-control.js";
const modulePath = "src/features/audio/pronunciation-release-control.js";
const loader = read(loaderPath);
const moduleSource = read(modulePath);
const manifestSource = read("src/config/course-manifest.js");
const refresh = read("mobile-refresh.html");
const worker = read("service-worker.js");

new vm.Script(loader, {filename:loaderPath});
new vm.Script(moduleSource, {filename:modulePath});
new vm.Script(worker, {filename:"service-worker.js"});

for (const marker of [
  'const TARGET = "./src/features/audio/pronunciation-release-control.js?v=5.4.22"',
  "document.currentScript",
  "document.write",
  "script.async = false",
  "salitaCompatibilityLoader"
]) if (!loader.includes(marker)) fail(`Compatibility loader is missing ${marker}`);

if ((loader.match(/document\.addEventListener/g) || []).length !== 0) {
  fail("The root compatibility loader must not own audio interaction listeners");
}

for (const marker of [
  'const INSTALL_FLAG = "__salitaQuestPronunciationReleaseControlInstalled"',
  'const BUTTON_SELECTOR = "#audioBtn"',
  'document.addEventListener("pointerup"',
  'document.addEventListener("click"',
  'document.addEventListener("pointerdown"',
  "speakFilipino",
  "loadStaticAudioManifest?.()"
]) if (!moduleSource.includes(marker)) fail(`Extracted pronunciation module is missing ${marker}`);

if ((moduleSource.match(/document\.addEventListener/g) || []).length !== 3) {
  fail("The extracted pronunciation module must remain the sole owner of exactly three document listeners");
}

const context = {window:{}};
vm.createContext(context);
vm.runInContext(manifestSource, context, {filename:"src/config/course-manifest.js"});
const courses = context.window.SalitaQuestCourseManifest?.courses;
const expected = "src/features/audio/pronunciation-release-control.js?v=5.4.22";
if (!courses) fail("Course manifest was not installed");
for (const courseId of ["tagalog", "cebuano"]) {
  const scripts = courses[courseId]?.scripts || [];
  const navigation = scripts.indexOf("desktop-navigation-refinement.js?v=5.5.3");
  const pronunciation = scripts.indexOf(expected);
  const reward = scripts.indexOf("src/features/progression/home-reward-coordinator.js?v=5.4.22");
  if (!(navigation >= 0 && pronunciation > navigation && reward > pronunciation)) {
    fail(`${courseId} does not preserve pronunciation runtime order`);
  }
  if (scripts.includes("pronunciation-release-control.js?v=5.4.22")) {
    fail(`${courseId} still loads the root compatibility URL directly`);
  }
}

if (!refresh.includes("src/features/audio/pronunciation-release-control.js")) {
  fail("Mobile refresh does not fetch the extracted pronunciation module");
}

for (const marker of [
  'const PREVIOUS_CACHE_NAME = "salita-quest-v5-6-19-long-term-badge-adapter-extraction-r72"',
  'const CACHE_NAME = "salita-quest-v5-6-20-avatar-case-profile-adapter-extraction-r73"',
  '"./pronunciation-release-control.js"',
  '"./src/features/audio/pronunciation-release-control.js"'
]) if (!worker.includes(marker)) fail(`Service worker is missing ${marker}`);

console.log("Pronunciation release-control extraction validation passed: direct module loading, root compatibility forwarding, one listener owner and r55 offline delivery.");
