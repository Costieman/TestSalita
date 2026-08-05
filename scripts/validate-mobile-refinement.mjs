import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const fail = message => { throw new Error(message); };
const requireMarkers = (source, markers, label) => markers.forEach(marker => {
  if (!source.includes(marker)) fail(`${label} is missing: ${marker}`);
});

const runtime = read("mobile-session-refinement.js");
new vm.Script(runtime, {filename:"mobile-session-refinement.js"});
requireMarkers(runtime, [
  '__salitaQuestMobileSessionRefinementInstalled',
  'const MOBILE_QUERY = "(max-width: 1000px)"',
  '"badges"',
  'const RAIL_FREE_MOBILE_VIEWS = new Set(["review", "audioReview"])',
  'className = "mobile-phrase-mastery"',
  'originalProgressButton.dataset.mobileMore = "true"',
  'openMobileMenu()',
  'dot.textContent = mobile ? String(number)',
  'mobile-session-active',
  'mobile-session-idle',
  'masteryRail.style.display',
  'feedbackBox.scrollIntoView',
  'finishSessionForMobile'
], "Mobile runtime");

const css = read("mobile-session-refinement.css");
requireMarkers(css, [
  '@media (max-width: 1000px)',
  '.mastery-rail-shell .mastery-label',
  '.mastery-rail-shell .mastery-milestone > small',
  'body.mobile-session-active .mastery-rail-shell',
  'body.mobile-session-active .lesson-card',
  'body.mobile-session-active .lesson-content',
  'overflow-y: auto !important',
  'body.mobile-session-active .lesson-footer',
  'position: fixed !important',
  'inset: auto 0 0 0 !important',
  '@media (max-width: 390px)',
  '@media (prefers-reduced-motion: reduce)'
], "Mobile styling");
if (css.includes('body.mobile-session-active .lesson-card {\n    min-height: 100dvh')) {
  fail("Active mobile lesson cards must not force the old full-viewport minimum height.");
}

const manifestSource = read("src/config/course-manifest.js");
new vm.Script(manifestSource, {filename:"src/config/course-manifest.js"});
const manifestContext = {window:{}};
vm.createContext(manifestContext);
vm.runInContext(manifestSource, manifestContext, {filename:"src/config/course-manifest.js"});
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
  if (!course.styles.includes('mobile-session-refinement.css?v=5.4.21')) {
    fail(`${htmlFile} mobile assets is missing mobile-session-refinement.css?v=5.4.21`);
  }
  if (!course.scripts.includes('mobile-session-refinement.js?v=5.4.21')) {
    fail(`${htmlFile} mobile assets is missing mobile-session-refinement.js?v=5.4.21`);
  }
  if (!course.scripts.some(path => /^desktop-navigation-refinement\.js\?v=(?:5\.4\.21|5\.5\.2|5\.5\.3)$/.test(path))) {
    fail(`${htmlFile} mobile assets is missing the desktop navigation refinement runtime.`);
  }
  const launcher = course.scripts.indexOf('lesson-side-launcher.js?v=5.4.21');
  const mobile = course.scripts.indexOf('mobile-session-refinement.js?v=5.4.21');
  if (!(launcher >= 0 && mobile > launcher)) fail(`${htmlFile} must load mobile refinement after the lesson launcher.`);
}
const tagalogScripts = courseManifest.courses.tagalog.scripts;
const appProfile = tagalogScripts.findIndex(path => /^profile-app\.js\?v=(?:5\.4\.21|5\.5\.2|5\.5\.3|5\.5\.4)$/.test(path));
const appMobile = tagalogScripts.indexOf('mobile-session-refinement.js?v=5.4.21');
if (!(appProfile > appMobile)) fail("Tagalog must load profile controls after mobile refinement.");
if (!read("bisaya-app-loader.js").includes('loadScript("./profile-app.js')) fail("Bisaya must load profile controls through its course loader.");

const serviceWorker = read("service-worker.js");
requireMarkers(serviceWorker, [
  'const CACHE_NAME = "salita-quest-',
  '"./mobile-session-refinement.js"',
  '"./mobile-session-refinement.css"',
  '"./desktop-navigation-refinement.js"'
], "Mobile offline release");

const index = read("index.html");
if (!index.includes('service-worker.js?v=5.4.29')) fail("The profile gate does not request the current service worker.");

console.log("Validated numbered-only mobile World Progress, rail-free review screens, fixed lesson actions, compact mastery, More navigation including Badges, profile controls in both modular course architectures, and offline delivery.");
