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
  "daily-goal-refinement.js",
  "even-progress-rail.js",
  "level-progression-v2.js",
  "adaptive-scenarios.js",
  "desktop-navigation-refinement.js",
  "service-worker.js"
]) new vm.Script(read(file), {filename:file});

// Prove that every submitted Quick Review item increments the Daily Quest once.
{
  const context = {
    state: {
      dailyActivity: {date:"today", answers:0, correct:0, reviews:0, sessions:0, questsClaimed:[], chestClaimed:false},
      studyDates: []
    },
    DEFAULT_STATE: {
      dailyActivity: {date:null, answers:0, correct:0, reviews:0, sessions:0, questsClaimed:[], chestClaimed:false}
    },
    DAILY_QUESTS: [
      {id:"session", target:1, metric:a=>a.sessions || 0},
      {id:"correct", target:5, metric:a=>a.correct || 0},
      {id:"review", target:3, metric:a=>a.reviews || 0}
    ],
    session: {mode:"quick"},
    ensureDailyActivity() { return context.state.dailyActivity; },
    questProgress(quest) { return Math.min(quest.target, quest.metric(context.state.dailyActivity)); },
    recordDailyAnswer(correct) {
      context.state.dailyActivity.answers += 1;
      if (correct) context.state.dailyActivity.correct += 1;
    },
    finishSession() { context.finished = true; },
    saveState() { context.saved = (context.saved || 0) + 1; },
    claimDailyQuestRewards() {},
    renderDailyQuests() {},
    updateAll() {},
    setTimeout,
    clearTimeout,
    console
  };
  context.window = context;
  vm.createContext(context);
  new vm.Script(read("daily-goal-refinement.js"), {filename:"daily-goal-refinement.js"}).runInContext(context);
  context.recordDailyAnswer(true, false);
  if (context.state.dailyActivity.quickReviewItems !== 1) fail("A submitted Quick Review item did not increment quickReviewItems exactly once.");
  if (context.state.dailyActivity.answers !== 1 || context.state.dailyActivity.correct !== 1) fail("The Quick Review wrapper did not preserve the original answer tracking.");
  context.session = {mode:"daily"};
  context.finishSession();
  if (context.state.dailyActivity.dailySessions !== 1) fail("A completed Daily Session did not increment dailySessions.");
}

const rail = read("even-progress-rail.js");
requireMarkers(rail, [
  "visualProgress(points, milestones)",
  "(index + 1) / count * 100",
  "progress-complete",
  "progress-approaching",
  "progress-future",
  "dot.textContent = String(number)"
], "World Progress state runtime");

const railCss = read("world-progress-status.css");
requireMarkers(railCss, [
  ".progress-complete .mastery-dot",
  "background: #137f70",
  ".progress-approaching .mastery-dot",
  "background: #f59e0b",
  "animation: worldProgressApproach",
  ".progress-future .mastery-dot",
  "#7f1d1d"
], "World Progress state styling");

const level = read("level-progression-v2.js");
requireMarkers(level, [
  "const MAX_LEVEL = 99",
  "const requirementFor = level =>",
  ".12*safe*safe",
  "function newSystem()",
  "lastKnownLevel",
  "pendingLevelUp",
  "levelUpsSeen",
  "const homeActive =",
  "async function renderCelebration",
  "window.SalitaPopupGovernor",
  "acknowledge_before_level_popup",
  "level-up-avatar",
  "Level 99 · MAX"
], "Governed Level 99 progression");
const totalXpTo99 = Array.from({length:98}, (_, index) => {
  const currentLevel = index + 1;
  return Math.round(180 + 8 * currentLevel + 0.12 * currentLevel * currentLevel);
}).reduce((sum, value) => sum + value, 0);
if (totalXpTo99 < 80000) fail(`Level 99 is too quick to reach: ${totalXpTo99} total XP.`);

const levelCss = read("level-progression-v2.css");
requireMarkers(levelCss, [
  ".player-level-badge",
  "place-items: center",
  ".level-up-celebration",
  ".level-up-avatar",
  "@keyframes levelEmblemImpact"
], "Level presentation");

const scenarios = read("adaptive-scenarios.js");
requireMarkers(scenarios, [
  "const QUESTIONS_PER_SCENARIO = 5",
  "function practicedItems(moduleIds)",
  "state.itemState?.[item.id]?.seen",
  "function scenarioAvailability(scenario)",
  "function buildScenarioQueue(scenario)",
  "function startScenario(scenario)",
  "adaptiveScenarioGrid",
  "scenarioProgress",
  "percent >= 80"
], "Adaptive scenarios");
const scenarioBlock = scenarios.slice(scenarios.indexOf("const SCENARIOS = ["), scenarios.indexOf("function retry()"));
const scenarioCount = (scenarioBlock.match(/\bid:"/g) || []).length;
if (scenarioCount < 9) fail(`Expected at least nine adaptive situations; found ${scenarioCount}.`);

const fluidCss = read("fluid-desktop-app.css");
requireMarkers(fluidCss, [
  "grid-template-columns: clamp(210px, 15vw, 270px)",
  ".main-area",
  "padding: 0 clamp(16px, 2vw, 38px)",
  "@media (min-width: 1001px) and (max-width: 1320px)",
  ".learn-layout",
  "minmax(0, 1fr)"
], "Fluid desktop shell");

const navigation = read("desktop-navigation-refinement.js");
requireMarkers(navigation, [
  "__salitaQuestPersistentNavigationV1Installed",
  'const RELEASE = "5.5.10-persistent-navigation"',
  "REQUIRED_DESKTOP_VIEWS",
  "REQUIRED_MOBILE_MORE_VIEWS",
  'badgesView.id="badgesView"',
  'action:"avatar-collection"',
  "nav.dataset.persistentNavigation=RELEASE",
  "grid.dataset.persistentNavigation=RELEASE",
  'switchView("badges")',
  'new CustomEvent("salita:open-avatar-collection"',
  "switchViewWithPersistentNavigation",
  "aria-current",
  "scrollIntoView",
  "window.SalitaQuestPersistentNavigation"
], "Persistent navigation and collection routes");
if (navigation.includes("salitaQuestDesktopNavigationCollapsed")) fail("Persistent navigation must not retain the old collapsed-sidebar preference.");
if (navigation.includes("localStorage.setItem(STORAGE_KEY")) fail("Persistent navigation must not persist an icon-only sidebar state.");

const navigationCss = read("desktop-navigation-refinement.css");
requireMarkers(navigationCss, [
  "--sq-persistent-sidebar-width",
  "@media (min-width: 861px)",
  "position: fixed !important",
  "height: 100dvh !important",
  ".sidebar .nav-list",
  "overflow-y: auto !important",
  ".sidebar .nav-item > span:last-child",
  ".main-area",
  "margin-left: var(--sq-persistent-sidebar-width) !important",
  "@media (min-width: 861px) and (max-width: 1180px)",
  "@media (max-width: 860px)",
  ".mobile-nav",
  ".mobile-menu-sheet",
  ".badges-page-hero",
  ".badges-page-shelf .badge-shelf"
], "Persistent navigation and small-desktop styling");
if (navigationCss.includes("body.desktop-nav-collapsed .app-shell")) fail("Persistent navigation CSS must not restore the retired icon rail.");
if (navigationCss.includes("grid-template-columns: 78px minmax(0, 1fr)")) fail("Persistent navigation CSS must keep labels visible at laptop widths.");

for (const htmlFile of ["app.html", "bisaya.html"]) {
  const html = read(htmlFile);
  requireMarkers(html, [
    "world-progress-status.css?v=5.4.21",
    "fluid-desktop-app.css?v=5.4.21",
    "adaptive-scenarios.css?v=5.4.21",
    "adaptive-scenarios.js?v=5.4.21"
  ], `${htmlFile} progression release`);
  for (const [asset, kind] of [
    ["level-progression-v2.css", "Level Progression styles"],
    ["desktop-navigation-refinement.css", "navigation styles"],
    ["level-progression-v2.js", "Level Progression runtime"],
    ["desktop-navigation-refinement.js", "navigation runtime"]
  ]) {
    const pattern = new RegExp(`${asset.replaceAll(".", "\\.")}\\?v=(?:5\\.4\\.21|5\\.5\\.2|5\\.5\\.3)`);
    if (!pattern.test(html)) fail(`${htmlFile} progression release is missing ${kind}.`);
  }
  const mobileIndex = html.indexOf("mobile-session-refinement.js?v=5.4.21");
  const adaptiveIndex = html.indexOf("adaptive-scenarios.js?v=5.4.21");
  const levelMatch = html.match(/level-progression-v2\.js\?v=(?:5\.4\.21|5\.5\.2|5\.5\.3)/);
  const navigationMatch = html.match(/desktop-navigation-refinement\.js\?v=(?:5\.4\.21|5\.5\.2|5\.5\.3)/);
  const levelIndex = levelMatch ? levelMatch.index : -1;
  const navigationIndex = navigationMatch ? navigationMatch.index : -1;
  if (!(mobileIndex >= 0 && adaptiveIndex > mobileIndex && levelIndex > adaptiveIndex && navigationIndex > levelIndex)) {
    fail(`${htmlFile} must load mobile state, scenarios, governed Level 99, then the final navigation wrapper.`);
  }
}

const serviceWorker = read("service-worker.js");
requireMarkers(serviceWorker, [
  'const PREVIOUS_CACHE_NAME = "salita-quest-v5-5-9-avatar-case-r51"',
  'const CACHE_NAME = "salita-quest-v5-5-10-persistent-navigation-r52"',
  '"./world-progress-status.css"',
  '"./level-progression-v2.js"',
  '"./level-progression-v2.css"',
  '"./fluid-desktop-app.css"',
  '"./adaptive-scenarios.js"',
  '"./adaptive-scenarios.css"',
  '"./desktop-navigation-refinement.js"',
  '"./desktop-navigation-refinement.css"'
], "Offline progression release");

console.log(`Validated live Quick Review item counting, World Progress states, ${totalXpTo99} XP to Level 99, governed acknowledgement-before-render level celebrations, ${scenarioCount} adaptive scenarios, persistent labelled navigation, dedicated Badges and Avatar Collection routes, small-desktop safety, both courses and offline delivery.`);
