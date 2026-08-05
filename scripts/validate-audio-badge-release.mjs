import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {spawnSync} from "node:child_process";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root,file),"utf8");
const fail = message => { throw new Error(message); };

for (const file of [
  "pronunciation-release-control.js",
  "src/features/audio/pronunciation-release-control.js",
  "home-reward-coordinator.js",
  "src/features/progression/home-reward-coordinator.js",
  "badge-catalogue-v2.js",
  "src/config/course-manifest.js",
  "service-worker.js"
]) new vm.Script(read(file),{filename:file});

const pronunciationLoader = read("pronunciation-release-control.js");
const pronunciation = read("src/features/audio/pronunciation-release-control.js");
for (const marker of [
  'const BUTTON_SELECTOR = "#audioBtn"',
  'document.addEventListener("pointerup"',
  'event.stopImmediatePropagation()',
  'lastPointerRelease',
  'event.detail === 0',
  'performance.now() - lastPointerRelease > 650',
  'primeAudio()',
  'loadStaticAudioManifest?.()',
  'Audio could not play'
]) if (!pronunciation.includes(marker)) fail(`Missing release-audio marker: ${marker}`);

for (const marker of [
  'const TARGET = "./src/features/audio/pronunciation-release-control.js?v=5.4.22"',
  "document.currentScript",
  "document.write",
  "script.async = false",
  "salitaCompatibilityLoader"
]) if (!pronunciationLoader.includes(marker)) fail(`Missing pronunciation compatibility-loader marker: ${marker}`);

const reward = read("src/features/progression/home-reward-coordinator.js");
for (const marker of [
  '__salitaQuestHomeRewardCoordinatorInstalled',
  'pendingKeyAwards',
  'animatedKeyDates',
  'recoverMissedAward',
  'document.body.dataset.currentView === "home"',
  'waitForTarget',
  'renderDailyQuests()',
  'if (await animate(award, target)) markPlayed(award)',
  'visibilitychange',
  'pageshow',
  'MutationObserver',
  'switchViewWithGuaranteedHomeRewards'
]) if (!reward.includes(marker)) fail(`Missing Home reward marker: ${marker}`);

const badges = read("badge-catalogue-v2.js");
for (const marker of [
  'const ADDITIONAL_BADGES = [',
  'image:`badges/${badge.id}.png`',
  'earnedAt',
  'pendingCelebrations',
  'celebratedIds',
  'groupA = a.earned ? 0 : a.available ? 1 : 2',
  'String(b.earnedAt).localeCompare(String(a.earnedAt))',
  'badge-catalogue-card ${status}',
  'EARNED',
  'AVAILABLE',
  'LOCKED',
  'New badge earned!',
  'switchViewWithBadgeCelebrations',
  'recordDailyAnswerWithBadgeMetrics',
  'recordDailySessionWithBadgeMetrics',
  'new CustomEvent("salita:badges-rendered"'
]) if (!badges.includes(marker)) fail(`Missing badge catalogue marker: ${marker}`);

const badgeCount = (badges.match(/\{id:"/g) || []).length;
if (badgeCount < 20) fail(`Expected at least 20 additional badge definitions; found ${badgeCount}`);

const badgeCss = read("badge-catalogue-v2.css");
for (const marker of [
  '.badge-catalogue-grid',
  '.badge-catalogue-card.earned',
  '.badge-catalogue-card.available',
  '.badge-catalogue-card.locked',
  '.badge-custom-image',
  '.badge-earned-celebration',
  '.badge-earned-medal',
  '.badge-nav-impact',
  '@media (max-width:1000px)',
  '@media (prefers-reduced-motion:reduce)'
]) if (!badgeCss.includes(marker)) fail(`Missing badge style: ${marker}`);

const manifestSource = read("src/config/course-manifest.js");
const manifestContext = {window:{}};
vm.createContext(manifestContext);
vm.runInContext(manifestSource,manifestContext,{filename:"src/config/course-manifest.js"});
const courseManifest = manifestContext.window.SalitaQuestCourseManifest;
if (!courseManifest?.courses) fail("The modular course manifest was not installed.");

for (const [htmlFile,courseId] of [["app.html","tagalog"],["bisaya.html","cebuano"]]) {
  const html = read(htmlFile);
  const inline = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(match=>match[1].trim()).filter(Boolean);
  inline.forEach((source,index)=>new vm.Script(source,{filename:`${htmlFile}#${index+1}`}));
  for (const marker of [
    "src/config/course-manifest.js?v=5.6.0",
    "src/app/course-bootstrap.js?v=5.6.0",
    `courseId: "${courseId}"`
  ]) if (!html.includes(marker)) fail(`${htmlFile} does not load ${marker}`);

  const course = courseManifest.courses[courseId];
  if (!course) fail(`${courseId} is missing from the course manifest.`);
  if (!course.styles.includes('badge-catalogue-v2.css?v=5.4.23')) fail(`${htmlFile} does not load badge-catalogue-v2.css?v=5.4.23`);
  for (const asset of [
    'src/features/audio/pronunciation-release-control.js?v=5.4.22',
    'src/features/progression/home-reward-coordinator.js?v=5.4.22',
    'badge-catalogue-v2.js?v=5.4.23'
  ]) if (!course.scripts.includes(asset)) fail(`${htmlFile} does not load ${asset}`);
  const nav = course.scripts.findIndex(asset => /^desktop-navigation-refinement\.js\?v=(?:5\.4\.21|5\.5\.2|5\.5\.3)$/.test(asset));
  const audio = course.scripts.indexOf('src/features/audio/pronunciation-release-control.js?v=5.4.22');
  const rewardIndex = course.scripts.indexOf('src/features/progression/home-reward-coordinator.js?v=5.4.22');
  const catalogue = course.scripts.indexOf('badge-catalogue-v2.js?v=5.4.23');
  if (!(nav >= 0 && audio > nav && rewardIndex > audio && catalogue > rewardIndex)) fail(`${htmlFile} has incorrect final runtime order`);
}

const serviceWorker = read("service-worker.js");
for (const asset of [
  'const CACHE_NAME = "salita-quest-',
  '"./pronunciation-release-control.js"',
  '"./src/features/audio/pronunciation-release-control.js"',
  '"./home-reward-coordinator.js"',
  '"./src/features/progression/home-reward-coordinator.js"',
  '"./badge-catalogue-v2.js"',
  '"./badge-catalogue-v2.css"'
]) if (!serviceWorker.includes(asset)) fail(`Offline cache missing ${asset}`);

const generator = read("scripts/generate_cebuano_google_audio.py");
for (const marker of [
  'LANGUAGE_CODE = "ceb-PH"',
  'DEFAULT_MODEL = "gemini-3.1-flash-tts-preview"',
  'DEFAULT_VOICE = "Kore"',
  'VoiceSelectionParams(',
  'model_name=model',
  'audio_manifest.json',
  '--dry-run',
  'GOOGLE_CLOUD_PROJECT'
]) if (!generator.includes(marker)) fail(`Missing Cebuano generator marker: ${marker}`);

const compile = spawnSync("python3",["-m","py_compile","scripts/generate_cebuano_google_audio.py"],{encoding:"utf8"});
if (compile.status !== 0) fail(`Cebuano generator does not compile: ${compile.stderr}`);

const readme = read("README.md");
for (const marker of [
  '5.5.0 — Avatar Progression',
  'pointer release',
  'earned badges first, ordered newest to oldest',
  'Google Cloud Gemini-TTS',
  'docs/CEBUANO_AUDIO.md',
  'validate-audio-badge-release.mjs'
]) if (!readme.includes(marker)) fail(`README is missing ${marker}`);

console.log("Validated release-based pronunciation, Home-only key recovery, ordered complete badge catalogue, badge celebrations, custom-art paths, Cebuano Gemini-TTS generator, modular language loaders and offline delivery.");
