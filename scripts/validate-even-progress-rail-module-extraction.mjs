import fs from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), "utf8");
const fail = message => { throw new Error(message); };
const requireMarkers = (source, markers, label) => markers.forEach(marker => {
  if (!source.includes(marker)) fail(`${label} is missing ${marker}`);
});

const loaderPath = "even-progress-rail.js";
const modulePath = "src/features/progression/even-progress-rail.js";
const loader = read(loaderPath);
const moduleSource = read(modulePath);
const manifestSource = read("src/config/course-manifest.js");
const refresh = read("mobile-refresh.html");
const worker = read("service-worker.js");

new vm.Script(loader, {filename:loaderPath});
new vm.Script(moduleSource, {filename:modulePath});
new vm.Script(worker, {filename:"service-worker.js"});

requireMarkers(loader, [
  'const TARGET = "./src/features/progression/even-progress-rail.js?v=5.4.21"',
  "document.currentScript",
  "document.write",
  "script.async = false",
  "salitaCompatibilityLoader"
], "Progress-rail compatibility loader");
if (loader.includes('renderMasteryRail =') || loader.includes('window.addEventListener("resize"')) {
  fail("The root progress-rail compatibility loader must not own runtime behavior");
}

requireMarkers(moduleSource, [
  'const INSTALL_FLAG = "__salitaQuestEvenProgressRailInstalled"',
  'typeof MODULES === "undefined"',
  'typeof renderMasteryRail !== "function"',
  'typeof totalLearningPoints !== "function"',
  "function visualProgress(points, milestones)",
  "function applyEvenSpacing()",
  'document.getElementById("masteryMilestones")',
  'node.dataset.evenMilestone = String(number)',
  'host.style.setProperty("--world-progress"',
  "renderMasteryRailWithEvenMilestones",
  'window.addEventListener("resize", applyEvenSpacing, {passive:true})'
], "Extracted progress-rail module");
if ((moduleSource.match(/renderMasteryRail\s*=\s*function/g) || []).length !== 1) {
  fail("The extracted progress rail must install exactly one renderMasteryRail wrapper");
}
if ((moduleSource.match(/window\.addEventListener\("resize"/g) || []).length !== 1) {
  fail("The extracted progress rail must own exactly one resize listener");
}
if (/\b(?:localStorage|sessionStorage)\b/.test(moduleSource)) {
  fail("The progress rail must not access learner storage");
}

const context = {window:{}};
vm.createContext(context);
vm.runInContext(manifestSource, context, {filename:"src/config/course-manifest.js"});
const courses = context.window.SalitaQuestCourseManifest?.courses;
const expected = "src/features/progression/even-progress-rail.js?v=5.4.21";
if (!courses) fail("Course manifest was not installed");
for (const courseId of ["tagalog", "cebuano"]) {
  const scripts = courses[courseId]?.scripts || [];
  const topbar = scripts.indexOf("src/features/interface/clean-topbar.js?v=5.4.21");
  const rail = scripts.indexOf(expected);
  const mastery = scripts.indexOf("mastery-feedback.js?v=5.4.21");
  if (!(topbar >= 0 && rail > topbar && mastery > rail)) {
    fail(`${courseId} does not preserve topbar → progress rail → mastery order`);
  }
  if (scripts.includes("even-progress-rail.js?v=5.4.21")) {
    fail(`${courseId} still loads the root progress-rail compatibility URL directly`);
  }
}

if (!refresh.includes(modulePath)) fail("Mobile refresh does not fetch the extracted progress rail");
requireMarkers(worker, [
  'const PREVIOUS_CACHE_NAME = "salita-quest-v5-6-19-long-term-badge-adapter-extraction-r72"',
  'const CACHE_NAME = "salita-quest-v5-6-20-avatar-case-profile-adapter-extraction-r73"',
  '"./even-progress-rail.js"',
  '"./src/features/progression/even-progress-rail.js"'
], "Progress-rail offline contract");

console.log("Even progress-rail extraction validation passed: direct progression module, compatibility-only root loader, one wrapper, one resize listener and r57 offline delivery.");
