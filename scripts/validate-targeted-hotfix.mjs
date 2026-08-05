import fs from "node:fs";

const read = path => fs.readFileSync(path, "utf8");
const manifest = JSON.parse(read("manifest.webmanifest"));
const start = read("start.html");
const courseManifest = read("src/config/course-manifest.js");
const rootLoader = read("collection-key-translation-hotfix.js");
const hotfix = read("src/features/interface/collection-key-translation-hotfix.js");

const failures = [];
const requireCheck = (condition, message) => {
  if (!condition) failures.push(message);
};

requireCheck(manifest.start_url === "./start.html", "PWA start_url must use the isolated onboarding page");
requireCheck(start.includes("Create a learner"), "Onboarding must offer a new learner path");
requireCheck(start.includes("Restore a backup"), "Onboarding must offer backup restore");
requireCheck(start.includes("Continue to your learners"), "Onboarding must offer existing local profiles");
requireCheck(start.includes("salitaQuestLocalProfilesV1"), "Restore must recognise the local profile store");
requireCheck(!start.includes("localStorage.clear("), "Onboarding must never clear unrelated browser storage");
requireCheck(courseManifest.includes("src/features/interface/collection-key-translation-hotfix.js?v=5.5.11"), "Tagalog manifest must load the extracted targeted hotfix");
requireCheck(rootLoader.includes("src/features/interface/collection-key-translation-hotfix.js?v=5.5.11"), "Historical targeted hotfix URL must forward to the feature module");
requireCheck(hotfix.includes("__salitaQuestCollectionKeyTranslationHotfixV2"), "Hotfix must be install-once guarded");
requireCheck(hotfix.includes("consecutive Daily Keys"), "Key display must use consecutive-run semantics");
requireCheck(!hotfix.includes("window.setInterval"), "Hotfix must not add a permanent polling loop");
requireCheck(!hotfix.includes("item.natural"), "A phrase-level natural translation must not replace one token's translation");
requireCheck(!hotfix.includes("item.meaning\n            : item.natural"), "Token translations must not fall back to full phrase translations");

const forbiddenProgressWrites = [
  "state.xp =", "state.coins =", "state.streak =", "state.mastery =",
  "state.items =", "state.review =", "state.badges ="
];
for (const marker of forbiddenProgressWrites) {
  requireCheck(!hotfix.includes(marker), `Targeted hotfix must not modify unrelated progression state: ${marker}`);
}

if (failures.length) {
  console.error("Targeted hotfix validation failed:");
  failures.forEach(message => console.error(`- ${message}`));
  process.exit(1);
}

console.log("Targeted onboarding and hotfix validation passed.");
