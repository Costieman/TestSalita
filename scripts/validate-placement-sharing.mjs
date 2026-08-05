import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const fail = message => { throw new Error(message); };

for (const file of [
  "placement-onboarding-v1.js",
  "badge-catalogue-v2.js",
  "badge-chest-v2.js",
  "src/config/course-manifest.js",
  "service-worker.js"
]) new vm.Script(read(file), {filename: file});

const placement = read("placement-onboarding-v1.js");
for (const marker of [
  "const TEST_LENGTH = 20",
  '"A1","A2","A3","B1","B2","B3"',
  "basic:12,intermediate:6,advanced:2",
  "basic:2,intermediate:6,advanced:12",
  "No XP or mastery is awarded during placement",
  "Earlier regions remain available",
  "data.accessPoints = moduleAccessFor(level)",
  "Math.max(actual,access)",
  'state.settings.beginnerMode = level === "beginner"',
  "if (!event.target.checked) openModal({retake:true})",
  "initialiseExistingLearner",
  "existing-progress"
]) if (!placement.includes(marker)) fail(`Missing placement marker: ${marker}`);
if (/state\.xp\s*[+\-]?=/.test(placement)) fail("Placement runtime must not award or rewrite XP");
if (/mastery\s*:/.test(placement) || /itemState\[[^\]]+\]\s*=/.test(placement)) fail("Placement runtime must not manufacture item mastery");

const placementCss = read("placement-onboarding-v1.css");
for (const marker of [".placement-modal", ".placement-level-grid", ".placement-answer-grid", ".placement-settings-card", "@media (max-width:700px)"]) {
  if (!placementCss.includes(marker)) fail(`Missing placement style: ${marker}`);
}

const catalogue = read("badge-catalogue-v2.js");
for (const marker of [
  "ADDITIONAL_BADGES",
  "badgeProgress",
  "earnedAt",
  "renderCatalogue",
  'new CustomEvent("salita:badges-rendered"'
]) if (!catalogue.includes(marker)) fail(`Missing badge catalogue marker: ${marker}`);

const badgeCss = read("badge-catalogue-v2.css");
for (const marker of ["#badgesView {", "overflow-x:hidden", "badge-catalogue-grid", "badge-catalogue-card"]) {
  if (!badgeCss.includes(marker)) fail(`Missing badge catalogue style: ${marker}`);
}

const chest = read("badge-chest-v2.js");
for (const marker of [
  "const MAX_CHEST_BADGES = 6",
  "data.chestIds",
  "Choose badges",
  "Share Badge Chest",
  "Add to chest",
  "Share badge",
  "data-picker-badge",
  "SalitaQuestBadgeChest"
]) if (!chest.includes(marker)) fail(`Missing stable Badge Chest marker: ${marker}`);
if (chest.includes("MutationObserver")) fail("Badge Chest must not observe and rewrite its own shelf mutations.");

const manifestContext = {window:{}};
vm.createContext(manifestContext);
vm.runInContext(read("src/config/course-manifest.js"), manifestContext, {filename:"src/config/course-manifest.js"});
const courseManifest = manifestContext.window.SalitaQuestCourseManifest;
if (!courseManifest?.courses) fail("The modular course manifest was not installed.");

for (const [htmlFile, courseId] of [["app.html", "tagalog"], ["bisaya.html", "cebuano"]]) {
  const html = read(htmlFile);
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(match => match[1].trim()).filter(Boolean);
  scripts.forEach((source, index) => new vm.Script(source, {filename: `${htmlFile}#inline-${index + 1}`}));
  for (const marker of [
    "src/config/course-manifest.js?v=5.6.0",
    "src/app/course-bootstrap.js?v=5.6.0",
    `courseId: "${courseId}"`
  ]) if (!html.includes(marker)) fail(`${htmlFile} does not load ${marker}`);

  const course = courseManifest.courses[courseId];
  if (!course) fail(`${courseId} is missing from the course manifest.`);
  for (const asset of [
    "badge-catalogue-v2.css?v=5.4.23",
    "badge-chest-v2.css?v=5.4.29",
    "placement-onboarding-v1.css?v=5.4.23"
  ]) if (!course.styles.includes(asset)) fail(`${htmlFile} does not load ${asset}`);
  for (const asset of [
    "badge-catalogue-v2.js?v=5.4.23",
    "badge-chest-v2.js?v=5.4.29",
    "placement-onboarding-v1.js?v=5.4.23"
  ]) if (!course.scripts.includes(asset)) fail(`${htmlFile} does not load ${asset}`);
  const catalogueIndex = course.scripts.indexOf("badge-catalogue-v2.js?v=5.4.23");
  const chestIndex = course.scripts.indexOf("badge-chest-v2.js?v=5.4.29");
  const placementIndex = course.scripts.indexOf("placement-onboarding-v1.js?v=5.4.23");
  if (!(catalogueIndex >= 0 && chestIndex > catalogueIndex && placementIndex > chestIndex)) {
    fail(`${htmlFile} must load catalogue, stable Badge Chest, then placement.`);
  }
  for (const obsolete of ["badge-sharing-v1", "social-links-v1"]) {
    if ([...course.styles, ...course.scripts].some(asset => asset.includes(obsolete))) fail(`${htmlFile} still loads obsolete ${obsolete}`);
  }
}

const worker = read("service-worker.js");
for (const asset of [
  '"./badge-chest-v2.js"',
  '"./badge-chest-v2.css"',
  '"./placement-onboarding-v1.js"',
  '"./placement-onboarding-v1.css"',
  '"./avatar-case-v1.js"',
  '"./avatar-case-v1.css"',
  '"./desktop-navigation-refinement.js"',
  '"./desktop-navigation-refinement.css"',
  '"./exercise-fixes-v545.js"',
  '"./src/config/course-manifest.js"',
  '"./src/app/course-bootstrap.js"'
]) if (!worker.includes(asset)) fail(`Offline cache is missing ${asset}`);
if (!worker.includes('const PREVIOUS_CACHE_NAME = "salita-quest-v5-6-19-long-term-badge-adapter-extraction-r72"')) {
  fail("Previous service-worker cache boundary is missing");
}
if (!worker.includes('const CACHE_NAME = "salita-quest-v5-6-20-avatar-case-profile-adapter-extraction-r73"')) {
  fail("Current modular-bootstrap service-worker cache is missing");
}

const index = read("index.html");
const indexScripts = [...index.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1].trim())
  .filter(Boolean);
indexScripts.forEach((source, scriptIndex) => new vm.Script(source, {filename:`index.html#inline-${scriptIndex + 1}`}));
if (!index.includes("profile-shell.css?v=5.4.25") || !index.includes("service-worker.js?v=5.4.29")) {
  fail("Profile gate was not advanced to the stable profile release");
}
for (const marker of [
  'const ACTIVE_COURSE = "salitaQuestActiveCourse"',
  "Which language will you be learning today?",
  'data-course-choice="cebuano"',
  'data-course-choice="tagalog"',
  "Choose the course before any placement questions begin.",
  "function renderCourseChoice(profile)",
  "function openCourse(profile, course)",
  "renderCourseChoice(active)",
  "loadProgress(saved, courseId)",
  'courseId === "cebuano"',
  "Create and choose language",
  'courseProgressKey(profile.id, "tagalog")'
]) if (!index.includes(marker)) fail(`Profile language-choice marker missing: ${marker}`);
if (index.includes('window.location.replace(`app.html?profile=${encodeURIComponent(active.id)}`)')) {
  fail("Returning learners must choose Tagalog or Bisaya before a course and placement test opens");
}
if (!index.includes('localStorage.setItem(OWNER, `${profile.id}:${courseId}`)')) {
  fail("The profile gate must preserve separate Tagalog and Bisaya progress ownership");
}

const readme = read("README.md");
for (const marker of [
  "20-question placement check",
  "content access only",
  "Badge Chest",
  "validate-placement-sharing.mjs"
]) if (!readme.includes(marker)) fail(`README is missing: ${marker}`);

console.log("Validated pre-placement Tagalog/Bisaya choice, per-course local progress, 20-question placement, non-destructive content access, badge catalogue render boundary, stable Badge Chest ownership, modular language loaders and r53 offline release.");
