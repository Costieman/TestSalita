import fs from "node:fs";

const read = path => fs.readFileSync(path, "utf8");
const manifest = JSON.parse(read("manifest.webmanifest"));
const start = read("start.html");
const appShell = read("app.html");
const hotfix = read("collection-key-translation-hotfix.js");

const failures = [];
const requireCheck = (condition, message) => {
  if (!condition) failures.push(message);
};

requireCheck(manifest.start_url === "./start.html", "PWA start_url must use the isolated onboarding page");
requireCheck(start.includes("Create a new learner"), "Onboarding must offer a new learner path");
requireCheck(start.includes("Restore a backup"), "Onboarding must offer backup restore");
requireCheck(start.includes("Continue on this device"), "Onboarding must offer existing local profiles");
requireCheck(start.includes("salitaQuestLocalProfilesV1"), "Restore must recognise the local profile store");
requireCheck(!start.includes("localStorage.clear("), "Onboarding must never clear unrelated browser storage");
requireCheck(appShell.includes("collection-key-translation-hotfix.js"), "Tagalog shell must load the targeted hotfix");
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
