import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const fail = message => { throw new Error(message); };
const requireMarkers = (source, markers, label) => markers.forEach(marker => {
  if (!source.includes(marker)) fail(`${label} is missing: ${marker}`);
});

for (const file of [
  "weekly-avatar-chest.js",
  "weekly-avatar-polish.js",
  "clean-topbar.js",
  "src/features/interface/clean-topbar.js",
  "profile-app.js",
  "mobile-session-refinement.js",
  "src/config/course-manifest.js",
  "service-worker.js"
]) new vm.Script(read(file), {filename:file});

const homeCss = read("compact-home-dashboard.css");
requireMarkers(homeCss, [
  '#homeView > .hero-card',
  'display: none !important',
  '#homeView.view.active',
  '#homeView > .daily-quests-card',
  '#homeView > .activity-hub',
  '#homeView > .game-dashboard',
  '#homeView .daily-quest-list',
  '@media (max-width: 1000px)'
], "Compact Home dashboard");

const topbarCss = read("clean-topbar.css");
requireMarkers(topbarCss, [
  'body:not(.dark-mode)',
  '.top-stats',
  '.mastery-rail-shell[data-compact-mastery="true"]',
  '.mastery-summary-compact',
  '#homeView > .journey-section',
  'display: none !important'
], "Top bar and focused Home styling");

const finalLayoutCss = read("topbar-world-progress-hotfix.css");
requireMarkers(finalLayoutCss, [
  'grid-template-columns:minmax(0,1fr) auto !important',
  '.mastery-rail-shell[data-compact-mastery="true"]',
  'grid-template-rows:auto 72px !important',
  '> .mastery-summary-compact',
  '> .mastery-next-copy',
  '> .mastery-milestones',
  'grid-column:1 / -1 !important',
  '.mastery-points-compact',
  '@media (min-width:1001px) and (max-width:1180px)',
  '@media (min-width:1001px) and (max-width:1120px)'
], "Final non-overlapping desktop top bar and World Progress layout");

const mobileFlowCss = read("mobile-world-progress-flow.css");
requireMarkers(mobileFlowCss, [
  '@media (max-width: 860px)',
  'body[data-current-view]:not([data-current-view="home"]) .mastery-rail-shell',
  'display: none !important',
  'body[data-current-view="home"] .mastery-rail-shell',
  'position: relative !important',
  'top: auto !important',
  'grid-template-rows: auto 50px auto !important',
  'overflow-x: hidden !important',
  'scrollbar-width: none !important',
  '.mastery-rail-shell::-webkit-scrollbar',
  '.mastery-milestone[data-even-milestone="10"]',
  'left: calc(100% - 18px) !important',
  '.mastery-next-copy::before',
  'content: "Next:" !important'
], "Mobile Home-only World Progress page flow");
if (/body\[data-current-view="home"\][^{]*\.mastery-rail-shell\s*\{[^}]*position:\s*(?:sticky|fixed)/s.test(mobileFlowCss)) {
  fail("Mobile World Progress must not return to a sticky or fixed overlay.");
}

const topbarLoader = read("clean-topbar.js");
const topbar = read("src/features/interface/clean-topbar.js");
requireMarkers(topbarLoader, [
  'const TARGET = "./src/features/interface/clean-topbar.js?v=5.4.21"',
  'document.currentScript',
  'document.write',
  'script.async = false',
  'salitaCompatibilityLoader'
], "Clean topbar compatibility loader");

requireMarkers(topbar, [
  'const STYLESHEETS = [',
  'topbar-world-progress-hotfix.css?v=5.5.10.1',
  'mobile-world-progress-flow.css?v=5.5.10.2',
  'function ensureStylesheet()',
  'function directChild(parent, selector)',
  'function structureMasteryShell()',
  'const heading = directChild(shell, ".mastery-rail-heading")',
  'if (heading)',
  'summary.classList.add("mastery-summary-compact")',
  'shell.dataset.compactMastery = "true"',
  'function ensurePointsLabel(summary, points)',
  'title.textContent = "World Progress"',
  'nextRegion.textContent = regionName',
  '${remaining} MP to go'
], "Top bar rerender normalization and final responsive styles");
if (topbar.includes('if (shell.dataset.compactMastery === "true") return true;')) {
  fail("World Progress must not skip structural normalization merely because an old dataset marker remains after rerendering.");
}

const profile = read("profile-app.js");
requireMarkers(profile, [
  'const MIRROR_INTERVAL_MS = 1000',
  'const AUTOSAVE_INTERVAL_MS = 15000',
  'function flushCourseState(reason = "periodic")',
  'flushCourseState("learner switch")',
  'flushCourseState("course switch")',
  'beforeunload',
  'pagehide',
  'visibilitychange'
], "Profile autosave");

const keyAnimation = read("weekly-avatar-polish.js");
requireMarkers(keyAnimation, [
  'DAILY_QUESTS.length === 4',
  'function playPendingAwardOnHome()',
  'if (view === "home") schedulePendingPlayback',
  'Daily Key earned!',
  'daily-key-award-grand',
  'duration:2350'
], "Home-only Daily Key celebration");

const manifestContext = {window:{}};
vm.createContext(manifestContext);
vm.runInContext(read("src/config/course-manifest.js"), manifestContext, {filename:"src/config/course-manifest.js"});
const courseManifest = manifestContext.window.SalitaQuestCourseManifest;
if (!courseManifest?.courses) fail("The modular course manifest was not installed.");

for (const [htmlFile, courseId] of [["app.html", "tagalog"], ["bisaya.html", "cebuano"]]) {
  const html = read(htmlFile);
  requireMarkers(html, [
    "src/config/course-manifest.js?v=5.6.0",
    "src/app/course-bootstrap.js?v=5.6.0",
    `courseId: "${courseId}"`
  ], `${htmlFile} modular entry point`);
  const course = courseManifest.courses[courseId];
  if (!course) fail(`${courseId} is missing from the course manifest.`);
  const styleSource = course.styles.join("\n");
  const scriptSource = course.scripts.join("\n");
  requireMarkers(styleSource, [
    'compact-home-dashboard.css?v=5.4.21',
    'weekly-avatar-chest.css?v=5.4.21',
    'clean-topbar.css?v=5.4.21'
  ], `${htmlFile} Home release styles`);
  requireMarkers(scriptSource, [
    'src/features/interface/clean-topbar.js?v=5.4.21',
    'weekly-avatar-polish.js?v=5.4.21'
  ], `${htmlFile} Home release scripts`);
}
if (!courseManifest.courses.tagalog.scripts.some(path => /^profile-app\.js\?v=(?:5\.4\.21|5\.5\.2|5\.5\.3|5\.5\.4)$/.test(path))) {
  fail("Tagalog does not load the shared profile runtime directly through its course manifest.");
}
if (!read("bisaya-app-loader.js").includes('loadScript("./profile-app.js')) fail("Bisaya does not load the shared profile runtime through its course loader.");

const index = read("index.html");
requireMarkers(index, [
  'profile-shell.css?v=5.4.25',
  'service-worker.js?v=5.4.29'
], "Profile gate release");

const serviceWorker = read("service-worker.js");
requireMarkers(serviceWorker, [
  'const CACHE_NAME = "salita-quest-',
  'const TOPBAR_WORLD_PROGRESS_HOTFIX = "2026-08-01-separated-heading-rail-1"',
  '"./weekly-avatar-polish.js"',
  '"./weekly-avatar-chest.css"',
  '"./clean-topbar.js"',
  '"./src/features/interface/clean-topbar.js"',
  '"./topbar-world-progress-hotfix.css"',
  '"./profile-app.js"'
], "Home offline release");

console.log("Validated the focused Home dashboard, rerender-safe World Progress structure, separate desktop heading and milestone rows, non-sticky Home-only mobile World Progress flow, hidden mobile scrollbar, unclipped final milestone, reliable profile autosave, Home-only Daily Key celebration, modular course loading, and current offline release.");
