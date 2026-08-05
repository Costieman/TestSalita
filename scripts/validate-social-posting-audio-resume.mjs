import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {spawnSync} from "node:child_process";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const fail = message => { throw new Error(message); };
const requireMarkers = (source, markers, label) => markers.forEach(marker => {
  if (!source.includes(marker)) fail(`${label} is missing: ${marker}`);
});
const requirePatterns = (source, patterns, label) => patterns.forEach(([pattern, description]) => {
  if (!pattern.test(source)) fail(`${label} is missing: ${description}`);
});

for (const file of ["social-connections-v2.js", "achievement-sharing-v4.js", "src/config/course-manifest.js", "service-worker.js"]) {
  new vm.Script(read(file), {filename: file});
}

const layout = read("badge-layout-v3.css");
requireMarkers(layout, [
  "#badgesView #badgeShelf > .badge.badge-catalogue-card",
  "grid-template-columns:92px minmax(0,1fr) !important",
  "grid-column:1 !important",
  "grid-column:2 !important",
  "position:static !important",
  "grid-template-columns:76px minmax(0,1fr) !important"
], "Final badge geometry");
if (!layout.includes(".badge-visual-shell") || !layout.includes(".badge-catalogue-copy")) {
  fail("Badge art and copy are not independently positioned");
}

const connections = read("social-connections-v2.js");
requireMarkers(connections, [
  "salitaQuestSocialApiBase",
  "SALITA_SOCIAL_API_BASE",
  "DEFAULT_API_BASE",
  'fetch(`${base}/health`',
  "No account setup required.",
  "Progress sharing is ready.",
  "data-open-badges",
  "developerMode()",
  "/api/social/connections?profileId=",
  "/oauth/${encodeURIComponent(provider)}/start",
  "/api/social/posts",
  'credentials:"include"',
  "event.origin!==origin",
  "salita-social-oauth",
  "SalitaQuestSocialConnections"
], "Seamless connected-account runtime");
requirePatterns(connections, [
  [/data\.bucketConfigured\s*===\s*false/, "hosted storage readiness check"],
  [/async function ensureHosted\s*\(/, "shared hosted-readiness gate"],
  [/hosted previews are offline; device sharing and downloads still work/i, "learner-safe offline fallback"],
  [/version:3\s*,\s*release:RELEASE/, "versioned sharing-service API"]
], "Stable sharing-service runtime");
if (connections.includes("/healthz")) fail("Connected-account runtime must avoid Cloud Run's reserved health path");
if (connections.includes("Share service not configured")) fail("Normal learners must not see service setup errors");
if (connections.includes("Deploy the Salita Quest share service")) fail("Normal learners must not receive infrastructure instructions");

const sharing = read("achievement-sharing-v4.js");
requireMarkers(sharing, [
  "avatarPath()",
  "drawBadgeVisual",
  "buildBadgeCard",
  "buildChestCard",
  "buildAvatarCard",
  "buildAvatarCaseCard",
  "buildLevelCard",
  "buildOpenGraphCard",
  "START LEARNING FREE",
  "CHOOSE TAGALOG OR CEBUANO",
  "createHostedShare",
  "/api/share-cards",
  "squareImageDataUrl",
  "ogImageDataUrl",
  "www.facebook.com/sharer/sharer.php",
  "twitter.com/intent/tweet",
  "www.linkedin.com/sharing/share-offsite",
  "https://wa.me/",
  "navigator.canShare?.({files: [file]})",
  "data-share-badge-chest",
  "data-share-badge",
  "data-share-avatar",
  "data-share-avatar-case",
  "data-share-current-level",
  "data-share-level-v4",
  "salita:avatar-unlock-animation-started",
  "salita:level-updated",
  "salita:popup-finished",
  "SalitaQuestAchievementSharing"
], "Unified achievement-sharing runtime");
requirePatterns(sharing, [
  [/function makeCanvas\s*\(\s*width\s*=\s*1080\s*,\s*height\s*=\s*1080\s*\)/, "configurable square canvas factory"],
  [/makeCanvas\s*\(\s*1200\s*,\s*630\s*\)/, "1200 × 630 Open Graph canvas"],
  [/async function openAvatar\s*\(/, "individual avatar sharing entry point"],
  [/async function openAvatarCase\s*\(/, "Avatar Case sharing entry point"],
  [/type\s*:\s*"avatar"/, "avatar share-card type"],
  [/type\s*:\s*"avatar_case"/, "Avatar Case share-card type"],
  [/type\s*:\s*"level_up"/, "level-up share-card type"],
  [/ownedAvatar\s*\(\s*id\s*\)/, "owned-avatar guard"],
  [/avatarCaseItems\s*\(\s*\)/, "owned Avatar Case item resolver"],
  [/canonicalAvatarPath\s*\(/, "canonical avatar artwork resolver"],
  [/Hosted preview unavailable\. The card is still ready for device sharing or download\./, "non-silent hosted-preview fallback"],
  [/version:6\s*,\s*release:RELEASE/, "single versioned achievement-sharing API"]
], "Stable unified achievement-sharing runtime");
if (/MutationObserver[\s\S]{0,500}level-up-celebration/.test(sharing)) {
  fail("Level sharing must use production level events rather than observing celebration DOM");
}

const manifestContext = {window:{}};
vm.createContext(manifestContext);
vm.runInContext(read("src/config/course-manifest.js"), manifestContext, {filename:"src/config/course-manifest.js"});
const courseManifest = manifestContext.window.SalitaQuestCourseManifest;
if (!courseManifest?.courses) fail("The modular course manifest was not installed.");

for (const [htmlFile, courseId] of [["app.html", "tagalog"], ["bisaya.html", "cebuano"]]) {
  const html = read(htmlFile);
  const inline = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(match => match[1].trim()).filter(Boolean);
  inline.forEach((source, index) => new vm.Script(source, {filename: `${htmlFile}#inline-${index + 1}`}));
  for (const marker of [
    "src/config/course-manifest.js?v=5.6.0",
    "src/app/course-bootstrap.js?v=5.6.0",
    `courseId: "${courseId}"`
  ]) if (!html.includes(marker)) fail(`${htmlFile} does not load ${marker}`);
  const course = courseManifest.courses[courseId];
  if (!course) fail(`${courseId} is missing from the course manifest.`);
  for (const asset of [
    "badge-layout-v3.css?v=5.4.25",
    "badge-chest-v2.css?v=5.4.29",
    "social-connections-v2.css?v=5.4.27",
    "achievement-sharing-v4.css?v=5.4.29"
  ]) if (!course.styles.includes(asset)) fail(`${htmlFile} does not load ${asset}`);
  for (const asset of [
    "badge-chest-v2.js?v=5.4.29",
    "social-connections-v2.js?v=5.4.27",
    "achievement-sharing-v4.js?v=5.4.29"
  ]) if (!course.scripts.includes(asset)) fail(`${htmlFile} does not load ${asset}`);
  const chestIndex = course.scripts.indexOf("badge-chest-v2.js?v=5.4.29");
  const connectionsIndex = course.scripts.indexOf("social-connections-v2.js?v=5.4.27");
  const sharingIndex = course.scripts.indexOf("achievement-sharing-v4.js?v=5.4.29");
  if (!(chestIndex >= 0 && connectionsIndex > chestIndex && sharingIndex > connectionsIndex)) {
    fail(`${htmlFile} must load chest state, sharing service and final achievement sharing in that order`);
  }
  for (const obsolete of ["badge-sharing-v1", "social-posting-v2", "achievement-sharing-v3", "social-links-v1"]) {
    if ([...course.styles, ...course.scripts].some(asset => asset.includes(obsolete))) fail(`${htmlFile} still loads obsolete ${obsolete}`);
  }
}

const worker = read("service-worker.js");
requireMarkers(worker, [
  'const PREVIOUS_CACHE_NAME = "salita-quest-v5-6-19-long-term-badge-adapter-extraction-r72"',
  'const CACHE_NAME = "salita-quest-v5-6-20-avatar-case-profile-adapter-extraction-r73"',
  '"./badge-layout-v3.css"',
  '"./badge-chest-v2.js"',
  '"./badge-chest-v2.css"',
  '"./social-connections-v2.js"',
  '"./social-connections-v2.css"',
  '"./achievement-sharing-v4.js"',
  '"./achievement-sharing-v4.css"',
  '"./avatar-case-v1.js"',
  '"./avatar-case-v1.css"',
  '"./desktop-navigation-refinement.js"',
  '"./desktop-navigation-refinement.css"',
  '"./src/config/course-manifest.js"',
  '"./src/app/course-bootstrap.js"'
], "Offline social release");

const generator = read("scripts/generate_cebuano_google_audio.py");
requireMarkers(generator, [
  "def spoken_form(text: str)",
  "def existing_alias(text: str",
  'FAILED_PATH = OUTPUT_DIR / "failed.jsonl"',
  "TRANSIENT_RETRIES = 4",
  "retrying punctuation-normalised text",
  "temporary Google Cloud error",
  "append_failure(text, error",
  "Summary: {generated} generated, {reused} aliases reused, {failed} skipped",
  "save_audio_manifest(manifest)"
], "Resumable Cebuano generator");

const compile = spawnSync("python3", ["-m", "py_compile", "scripts/generate_cebuano_google_audio.py"], {encoding: "utf8"});
if (compile.status !== 0) fail(`Cebuano generator does not compile: ${compile.stderr}`);
const dryRun = spawnSync("python3", ["scripts/generate_cebuano_google_audio.py", "--dry-run", "--limit", "1"], {encoding: "utf8"});
if (dryRun.status !== 0) fail(`Cebuano dry run failed: ${dryRun.stderr}`);
if (!dryRun.stdout.includes("Cebuano phrases discovered:") || !dryRun.stdout.includes("Clips to generate or map:")) {
  fail("Cebuano dry run did not report resumable work");
}

const socialDocs = read("docs/SOCIAL_CONNECTIONS.md");
requireMarkers(socialDocs, ["True connected accounts", "w_member_social", "TikTok's Content Posting API", "secure HTTPS service", "GET /api/social/connections", "POST /api/social/posts"], "Social connection documentation");
const audioDocs = read("docs/CEBUANO_AUDIO.md");
requireMarkers(audioDocs, ["The generator is resumable", "punctuation-only aliases", "failed.jsonl", "git pull --ff-only origin main"], "Cebuano recovery documentation");
const audit = read("docs/CODE_AUDIT_2026-07-30.md");
requireMarkers(audit, ["Self-triggering Badge Chest observer", "Three modules competing", "Pinned source document plus string injection", "No full browser interaction suite"], "Code audit");

console.log("Validated non-overlapping badge cards, one shared badge/avatar/Avatar Case/level controller, hosted-service fallbacks, production level events, resumable Cebuano generation, modular course loading and r53 offline delivery.");
