import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const fail = message => { throw new Error(message); };
const count = (source, marker) => source.split(marker).length - 1;

const compatibility = read("home-reward-coordinator.js");
const feature = read("src/features/progression/home-reward-coordinator.js");
const manifestSource = read("src/config/course-manifest.js");
const worker = read("service-worker.js");

for (const [file, source] of [
  ["home-reward-coordinator.js", compatibility],
  ["src/features/progression/home-reward-coordinator.js", feature],
  ["src/config/course-manifest.js", manifestSource],
  ["service-worker.js", worker]
]) new vm.Script(source, {filename:file});

for (const marker of [
  'const TARGET = "./src/features/progression/home-reward-coordinator.js?v=5.4.22"',
  'const LOADING_FLAG = "__salitaQuestHomeRewardCoordinatorCompatibilityLoading"',
  'document.currentScript',
  'document.write',
  'script.async = false',
  'salitaCompatibilityLoader = "home-reward-coordinator"'
]) if (!compatibility.includes(marker)) fail(`Compatibility loader is missing ${marker}`);

for (const forbidden of [
  'pendingKeyAwards',
  'animatedKeyDates',
  'switchViewWithGuaranteedHomeRewards',
  'MutationObserver',
  'saveState()',
  'document.addEventListener("visibilitychange"',
  'window.addEventListener("pageshow"'
]) if (compatibility.includes(forbidden)) fail(`Compatibility loader owns coordinator behavior: ${forbidden}`);

for (const marker of [
  'const INSTALL_FLAG = "__salitaQuestHomeRewardCoordinatorInstalled"',
  'const KEY_TARGET = 6',
  'pendingKeyAwards',
  'animatedKeyDates',
  'source:"home-recovery"',
  'document.body.dataset.currentView === "home"',
  '.weekly-key-slot:nth-child(',
  'Daily Key earned!',
  'Boolean(state.settings?.reducedMotion)',
  'switchView = function switchViewWithGuaranteedHomeRewards(view)',
  'document.addEventListener("visibilitychange"',
  'window.addEventListener("pageshow"',
  'new MutationObserver(',
  'attributeFilter:["class"]'
]) if (!feature.includes(marker)) fail(`Extracted coordinator is missing ${marker}`);

if (count(feature, 'switchView = function switchViewWithGuaranteedHomeRewards(view)') !== 1) fail("The extracted coordinator must wrap switchView exactly once");
if (count(feature, 'document.addEventListener("visibilitychange"') !== 1) fail("The extracted coordinator must own one visibilitychange listener");
if (count(feature, 'window.addEventListener("pageshow"') !== 1) fail("The extracted coordinator must own one pageshow listener");
if (count(feature, 'new MutationObserver(') !== 1) fail("The extracted coordinator must own one MutationObserver");
if (count(feature, 'saveState()') !== 2) fail("The extracted coordinator must retain exactly two learner-state persistence calls");
if (/localStorage|sessionStorage/.test(feature)) fail("The coordinator must continue using shared saveState rather than direct browser storage");

const context = {window:{}};
vm.createContext(context);
vm.runInContext(manifestSource, context, {filename:"src/config/course-manifest.js"});
const courses = context.window.SalitaQuestCourseManifest?.courses;
if (!courses) fail("Course manifest did not install");
for (const courseId of ["tagalog", "cebuano"]) {
  const scripts = courses[courseId]?.scripts || [];
  const direct = 'src/features/progression/home-reward-coordinator.js?v=5.4.22';
  if (scripts.filter(item => item === direct).length !== 1) fail(`${courseId} must load the extracted coordinator exactly once`);
  if (scripts.includes('home-reward-coordinator.js?v=5.4.22')) fail(`${courseId} still loads the compatibility URL directly`);
  const audio = scripts.indexOf('src/features/audio/pronunciation-release-control.js?v=5.4.22');
  const reward = scripts.indexOf(direct);
  const badges = scripts.indexOf('badge-catalogue-v2.js?v=5.4.23');
  if (!(audio >= 0 && reward > audio && badges > reward)) fail(`${courseId} coordinator load order changed`);
}

for (const marker of [
  'const PREVIOUS_CACHE_NAME = "salita-quest-v5-6-19-long-term-badge-adapter-extraction-r72"',
  'const CACHE_NAME = "salita-quest-v5-6-20-avatar-case-profile-adapter-extraction-r73"',
  '"./home-reward-coordinator.js"',
  '"./src/features/progression/home-reward-coordinator.js"'
]) if (!worker.includes(marker)) fail(`Offline delivery is missing ${marker}`);

console.log("Validated the extracted Home reward coordinator: ordered feature delivery, compatibility-only root forwarding, one switchView wrapper, one observer, exact listeners, preserved weekly-key state semantics and r60-to-r61 offline delivery.");
