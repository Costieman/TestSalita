import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

function readText(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function normalise(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function check(condition, message) {
  if (!condition) errors.push(message);
}

function isMp3(filePath) {
  const buffer = fs.readFileSync(filePath).subarray(0, 3);
  return buffer.length >= 2 && (
    buffer.toString("ascii") === "ID3" ||
    (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)
  );
}

const course = readJson("languages/cebuano/course.json");
const moduleManifest = readJson("languages/cebuano/modules/manifest.json");
const packs = (moduleManifest.packs || []).map(name =>
  readJson(path.posix.join("languages/cebuano/modules", name))
);
const items = [
  ...(course.items || []),
  ...packs.flatMap(pack => pack.items || [])
];

const requiredCebuano = new Set();
const requiredEnglish = new Set();
for (const item of items) {
  const cebuano = normalise(item.example || item.term || item.root);
  const english = normalise(item.natural || item.meaning);
  if (cebuano) requiredCebuano.add(cebuano);
  if (english) requiredEnglish.add(english);
}

const audioManifest = readJson("audio/audio_manifest.json");
const entries = audioManifest.entries || {};
const voices = audioManifest.voices || {};
const cebuanoEntries = entries["ceb-PH"] || {};
const englishEntries = entries["en-GB"] || {};

check(Object.keys(cebuanoEntries).length > 0, "audio manifest has no ceb-PH entries");
check(Object.keys(englishEntries).length > 0, "audio manifest has no en-GB entries");
check(voices["en-GB"]?.name === "en-GB-Neural2-B", "en-GB voice must remain en-GB-Neural2-B");
if (voices["ceb-PH"]) {
  check(voices["ceb-PH"].name === "Kore", "optional ceb-PH voice metadata must identify Kore");
}

function validateRequired(required, language, languageEntries) {
  for (const text of required) {
    const relativePath = languageEntries[text];
    check(Boolean(relativePath), `${language} is missing required text: ${JSON.stringify(text)}`);
  }
}

validateRequired(requiredCebuano, "ceb-PH", cebuanoEntries);
validateRequired(requiredEnglish, "en-GB", englishEntries);

function validateManifestLibrary(language, languageEntries, requiredPrefix) {
  for (const [text, relativePath] of Object.entries(languageEntries)) {
    check(Boolean(normalise(text)), `${language} contains an empty manifest key`);
    check(typeof relativePath === "string" && relativePath.length > 0,
      `${language} has an empty path for ${JSON.stringify(text)}`);
    if (typeof relativePath !== "string" || !relativePath) continue;

    const normalPath = path.posix.normalize(relativePath);
    check(normalPath === relativePath && !normalPath.startsWith("../"),
      `${language} has an unsafe path: ${relativePath}`);
    check(relativePath.startsWith(requiredPrefix),
      `${language} path leaves ${requiredPrefix}: ${relativePath}`);
    check(relativePath.toLowerCase().endsWith(".mp3"),
      `${language} path is not an MP3: ${relativePath}`);

    const absolutePath = path.join(ROOT, relativePath);
    if (!fs.existsSync(absolutePath)) {
      errors.push(`${language} manifest path does not exist: ${relativePath}`);
      continue;
    }

    const size = fs.statSync(absolutePath).size;
    check(size > 512, `${language} audio file is unexpectedly small: ${relativePath} (${size} bytes)`);
    check(isMp3(absolutePath), `${language} audio file lacks an MP3 signature: ${relativePath}`);
  }
}

validateManifestLibrary("ceb-PH", cebuanoEntries, "audio/ceb-PH/");
validateManifestLibrary("en-GB", englishEntries, "audio/en/");

const referencedCebuanoPaths = new Set(Object.values(cebuanoEntries));
const cebuanoFiles = fs.readdirSync(path.join(ROOT, "audio/ceb-PH"))
  .filter(name => name.endsWith(".mp3"))
  .map(name => `audio/ceb-PH/${name}`);
for (const relativePath of cebuanoFiles) {
  check(referencedCebuanoPaths.has(relativePath), `unreferenced Cebuano MP3: ${relativePath}`);
}

const referencedEnglishPaths = new Set(Object.values(englishEntries));
const bisayaEnglishFiles = fs.readdirSync(path.join(ROOT, "audio/en"))
  .filter(name => name.startsWith("bisaya-en-") && name.endsWith(".mp3"))
  .map(name => `audio/en/${name}`);
for (const relativePath of bisayaEnglishFiles) {
  check(referencedEnglishPaths.has(relativePath), `unreferenced Bisaya-English MP3: ${relativePath}`);
}

const bisayaLoader = readText("bisaya-app-loader.js");
check(bisayaLoader.includes('staticAudioUrl(text,"ceb-PH")'),
  "Bisaya pronunciation does not resolve static ceb-PH audio");
check(bisayaLoader.includes("Tagalog voice substitution is disabled"),
  "Bisaya runtime no longer explicitly blocks Tagalog voice substitution");

const appSource = readText("app.js");
check(appSource.includes('handsFreeSpeak(handsFreeEnglish(item),"en-GB",runId)'),
  "Hands-Free Review does not request en-GB answer audio");

const serviceWorker = readText("service-worker.js");
check(serviceWorker.includes('"./audio/audio_manifest.json"'),
  "service worker does not precache the audio manifest");
check(serviceWorker.includes("function isSameOriginAudio"),
  "service worker lacks the audio request classifier");
check(serviceWorker.includes("audioCacheFirst"),
  "service worker lacks cache-first audio delivery");
check(serviceWorker.includes('const PREVIOUS_CACHE_NAME = "salita-quest-v5-6-19-long-term-badge-adapter-extraction-r72"'),
  "service worker no longer records the pre-modular persistent-navigation boundary");
check(serviceWorker.includes('const CACHE_NAME = "salita-quest-v5-6-20-avatar-case-profile-adapter-extraction-r73"'),
  "service-worker cache revision is not the modular-bootstrap release");
check(serviceWorker.includes('"./src/config/course-manifest.js"') && serviceWorker.includes('"./src/app/course-bootstrap.js"'),
  "service worker does not precache the modular course bootstrap");

const audioReleaseNotes = readText("docs/releases/5.5.7-complete-bisaya-audio.md");
check(audioReleaseNotes.includes("salita-quest-v5-5-7-complete-bisaya-audio-r49"),
  "audio release lineage no longer records the complete Bisaya audio cache");

const workflow = readText(".github/workflows/validate-bisaya.yml");
check(workflow.includes("node scripts/validate-bisaya-audio-library.mjs"),
  "Bisaya workflow does not run the complete audio validator");

const cebuanoGenerator = readText("scripts/generate_cebuano_google_audio.py");
check(cebuanoGenerator.includes('LANGUAGE_CODE = "ceb-PH"'),
  "Cebuano generator language code changed unexpectedly");
check(cebuanoGenerator.includes('DEFAULT_VOICE = "Kore"'),
  "Cebuano generator voice changed unexpectedly");

const englishGenerator = readText("scripts/generate_missing_bisaya_english_audio.py");
check(englishGenerator.includes('VOICE_NAME = "en-GB-Neural2-B"'),
  "Bisaya-English generator voice changed unexpectedly");
check(englishGenerator.includes('item.get("natural") or item.get("meaning")'),
  "Bisaya-English generator no longer matches Hands-Free English selection");

if (errors.length) {
  console.error(`Bisaya audio validation failed (${errors.length} issue${errors.length === 1 ? "" : "s"}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Bisaya audio validation passed");
console.log(`- released items: ${items.length}`);
console.log(`- required Cebuano spoken texts: ${requiredCebuano.size}`);
console.log(`- required English answers: ${requiredEnglish.size}`);
console.log(`- ceb-PH manifest entries: ${Object.keys(cebuanoEntries).length}`);
console.log(`- en-GB manifest entries: ${Object.keys(englishEntries).length}`);
console.log(`- Cebuano MP3 files: ${cebuanoFiles.length}`);
console.log(`- Bisaya-English MP3 files: ${bisayaEnglishFiles.length}`);
