import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const fail = message => { throw new Error(message); };
const requireMarkers = (source, markers, label) => markers.forEach(marker => {
  if (!source.includes(marker)) fail(`${label} is missing: ${marker}`);
});
const requirePatterns = (source, patterns, label) => patterns.forEach(([pattern, description]) => {
  if (!pattern.test(source)) fail(`${label} is missing: ${description}`);
});

const chestRuntime = read("badge-chest-v2.js");
const shareRuntime = read("achievement-sharing-v4.js");
const manifestSource = read("src/config/course-manifest.js");
new vm.Script(chestRuntime, {filename: "badge-chest-v2.js"});
new vm.Script(shareRuntime, {filename: "achievement-sharing-v4.js"});
new vm.Script(manifestSource, {filename: "src/config/course-manifest.js"});

requireMarkers(chestRuntime, [
  "__salitaQuestBadgeChestV2Installed",
  "const MAX_CHEST_BADGES = 6",
  'const RENDER_EVENT = "salita:badges-rendered"',
  "function cleanChest",
  "function setIds",
  "function openPicker",
  "data-open-badge-picker",
  "data-picker-badge",
  "data-save-badge-picker",
  "data-badge-chest-toggle",
  "data-chest-remove",
  "data-chest-move",
  "actions.dataset.signature",
  "SalitaQuestBadgeChest"
], "Stable Badge Chest controller");
if (chestRuntime.includes("MutationObserver")) fail("Badge Chest must not use a self-triggering shelf MutationObserver.");
if (chestRuntime.includes("earnedBadges().slice(0, MAX_CHEST_BADGES)")) fail("Badge Chest must not silently auto-fill all six slots.");

requireMarkers(shareRuntime, [
  "__salitaQuestAchievementSharingV6Installed",
  "function openBadge",
  "function openChest",
  "function openAvatar",
  "function openAvatarCase",
  "function openLevel",
  "buildBadgeCard",
  "buildChestCard",
  "buildAvatarCard",
  "buildAvatarCaseCard",
  "buildLevelCard",
  "buildOpenGraphCard",
  "START LEARNING FREE",
  "CHOOSE TAGALOG OR CEBUANO",
  "/api/share-cards",
  "squareImageDataUrl",
  "ogImageDataUrl",
  "www.facebook.com/sharer/sharer.php",
  "www.linkedin.com/sharing/share-offsite",
  "navigator.canShare?.({files: [file]})",
  "salita:level-updated",
  "salita:popup-finished",
  "salita:avatar-unlock-animation-started",
  "Share level up",
  "Share avatar",
  "Share Avatar Case",
  "SalitaQuestAchievementSharing"
], "Single-owner achievement sharing");
requirePatterns(shareRuntime, [
  [/event\.detail\?\.type\s*!==\s*"level_up"/, "production popup-governor level completion filter"],
  [/ownedAvatar\s*\(\s*id\s*\)/, "owned-avatar sharing guard"],
  [/avatarCaseItems\s*\(\s*\)/, "owned Avatar Case resolver"],
  [/data-share-avatar-case/, "Avatar Case sharing action"],
  [/data-share-current-level/, "persistent current-level sharing entry point"],
  [/version:6\s*,\s*release:RELEASE/, "single versioned sharing controller"]
], "Stable badge/avatar/Avatar Case/level sharing");
if (/MutationObserver[\s\S]{0,500}level-up-celebration/.test(shareRuntime)) {
  fail("Level sharing must not depend on observing level-up celebration DOM.");
}

const fakePanel = {
  innerHTML: "",
  querySelectorAll: () => []
};
const fakePicker = {
  hidden: true,
  __draftIds: new Set(),
  innerHTML: "",
  querySelector: () => null,
  querySelectorAll: () => [],
  classList: {add() {}, remove() {}},
  setAttribute() {}
};
const fakeShelf = {};
const fakeHost = {parentNode: {insertBefore() {}}};
const documentListeners = {};
const windowListeners = {};
const documentStub = {
  body: {appendChild() {}, classList: {add() {}, remove() {}}},
  getElementById(id) {
    if (id === "badgeShelf") return fakeShelf;
    if (id === "badgeChestPanel") return fakePanel;
    if (id === "badgeChestPickerV2") return fakePicker;
    return null;
  },
  querySelector(selector) {
    if (selector === "#badgesView .badges-page-summary") return fakeHost;
    return null;
  },
  querySelectorAll() { return []; },
  createElement() { return fakePicker; },
  addEventListener(type, handler) { documentListeners[type] = handler; }
};
const state = {badgeProgress: {chestIds: ["alpha", "missing", "alpha"], earnedAt: {alpha: "2026-01-01"}}};
const badges = Array.from({length: 8}, (_, index) => ({
  id: ["alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta", "locked"][index],
  name: `Badge ${index + 1}`,
  test: () => index < 7
}));
let saves = 0;
const context = {
  window: {
    setTimeout,
    addEventListener(type, handler) { windowListeners[type] = handler; },
    dispatchEvent() {}
  },
  document: documentStub,
  state,
  BADGES: badges,
  saveState() { saves += 1; },
  CustomEvent: class CustomEvent { constructor(type, options) { this.type = type; this.detail = options?.detail; } },
  console,
  setTimeout,
  clearTimeout
};
context.window.window = context.window;
vm.runInNewContext(chestRuntime, context, {filename: "badge-chest-v2.behavior.js"});
const api = context.window.SalitaQuestBadgeChest;
if (!api) fail("Badge Chest API was not installed in the deterministic harness.");
const cleaned = api.getIds();
if (cleaned.join("|") !== "alpha") fail(`Existing chest cleanup failed: ${cleaned.join("|")}`);
const limited = api.setIds(["alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta", "locked"], {announce: false});
if (limited.length !== 6) fail(`Badge Chest did not enforce six slots: ${limited.length}`);
if (limited.includes("locked")) fail("Unearned badges were accepted into the Badge Chest.");
if (new Set(limited).size !== limited.length) fail("Duplicate badges were accepted into the Badge Chest.");
if (saves < 1) fail("Badge Chest changes were not persisted.");

const manifestContext = {window:{}};
vm.createContext(manifestContext);
vm.runInContext(manifestSource, manifestContext, {filename:"src/config/course-manifest.js"});
const courseManifest = manifestContext.window.SalitaQuestCourseManifest;
if (!courseManifest?.courses) fail("The modular course manifest was not installed.");

for (const [htmlFile, courseId] of [["app.html", "tagalog"], ["bisaya.html", "cebuano"]]) {
  const html = read(htmlFile);
  const inline = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1].trim())
    .filter(Boolean);
  inline.forEach((source, index) => new vm.Script(source, {filename: `${htmlFile}#inline-${index + 1}`}));
  requireMarkers(html, [
    "src/config/course-manifest.js?v=5.6.0",
    "src/app/course-bootstrap.js?v=5.6.0",
    `courseId: "${courseId}"`
  ], `${htmlFile} modular badge loader`);
  const course = courseManifest.courses[courseId];
  if (!course) fail(`${courseId} is missing from the course manifest.`);
  for (const asset of [
    "badge-chest-v2.css?v=5.4.29",
    "achievement-sharing-v4.css?v=5.4.29"
  ]) if (!course.styles.includes(asset)) fail(`${htmlFile} is missing stable badge style ${asset}`);
  for (const asset of [
    "badge-chest-v2.js?v=5.4.29",
    "achievement-sharing-v4.js?v=5.4.29"
  ]) if (!course.scripts.includes(asset)) fail(`${htmlFile} is missing stable badge runtime ${asset}`);
  for (const obsolete of [
    "badge-sharing-v1.js",
    "social-links-v1.js",
    "social-posting-v2.js",
    "achievement-sharing-v3.js"
  ]) if ([...course.styles, ...course.scripts].some(asset => asset.includes(obsolete))) fail(`${htmlFile} still loads obsolete runtime ${obsolete}`);
  const catalogue = course.scripts.indexOf("badge-catalogue-v2.js?v=5.4.23");
  const chest = course.scripts.indexOf("badge-chest-v2.js?v=5.4.29");
  const connections = course.scripts.indexOf("social-connections-v2.js?v=5.4.27");
  const sharing = course.scripts.indexOf("achievement-sharing-v4.js?v=5.4.29");
  if (!(catalogue >= 0 && chest > catalogue && connections > chest && sharing > connections)) {
    fail(`${htmlFile} does not preserve catalogue → chest → service → sharing ownership order.`);
  }
}

const catalogue = read("badge-catalogue-v2.js");
requireMarkers(catalogue, [
  'new CustomEvent("salita:badges-rendered"',
  "renderCatalogue()"
], "Badge catalogue render boundary");

const worker = read("service-worker.js");
requireMarkers(worker, [
  'const PREVIOUS_CACHE_NAME = "salita-quest-v5-6-19-long-term-badge-adapter-extraction-r72"',
  'const CACHE_NAME = "salita-quest-v5-6-20-avatar-case-profile-adapter-extraction-r73"',
  '"./badge-chest-v2.js"',
  '"./badge-chest-v2.css"',
  '"./achievement-sharing-v4.js"',
  '"./achievement-sharing-v4.css"',
  '"./avatar-case-v1.js"',
  '"./avatar-case-v1.css"',
  '"./desktop-navigation-refinement.js"',
  '"./desktop-navigation-refinement.css"',
  '"./src/config/course-manifest.js"',
  '"./src/app/course-bootstrap.js"'
], "Badge and Avatar Case stability offline release");
for (const obsolete of [
  '"./badge-sharing-v1.js"',
  '"./social-links-v1.js"',
  '"./social-posting-v2.js"',
  '"./achievement-sharing-v3.js"'
]) if (worker.includes(obsolete)) fail(`Offline cache still carries obsolete asset ${obsolete}`);

const index = read("index.html");
if (!index.includes('service-worker.js?v=5.4.29')) fail("Profile gate does not request the stable service worker.");

console.log("Validated preserved six-slot Badge Chest state, deterministic selection rules, one badge/avatar/Avatar Case/level sharing owner, production level events, modular loader order and r53 offline delivery.");
