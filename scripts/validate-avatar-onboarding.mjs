import fs from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const fail = message => { throw new Error(message); };
const read = path => fs.readFileSync(new URL(path, root), "utf8");

const index = read("index.html");
const profileApp = read("profile-app.js");

if (!index.includes('src="src/features/avatar/avatar-catalogue-v1.js?v=5.5.0"')) {
  fail("Profile gate must load the central avatar catalogue.");
}
if (!index.includes('model.list({rarity:"starter"})')) {
  fail("Profile creation must derive its choices from the starter rarity.");
}
if (!index.includes("starters.length !== 4")) {
  fail("Profile creation must require exactly four starter avatars.");
}
if (!index.includes("model.starterIds.includes(selectedId)")) {
  fail("Profile creation must reject non-starter avatar IDs.");
}
if (!index.includes("avatarCollection")) {
  fail("New profiles must initialise avatar collection data.");
}
if (!index.includes("model.normaliseCollectionState(profile.avatarCollection, profile.avatarId)")) {
  fail("Existing profiles must migrate while preserving their current avatar.");
}
if (index.includes("AVATARS=[")) {
  fail("The legacy hard-coded eight-avatar onboarding list must not remain.");
}

if (!profileApp.includes("./src/features/avatar/avatar-catalogue-v1.js?v=5.5.4") && !profileApp.includes("./src/features/avatar/avatar-catalogue-v1.js?v=5.5.0")) {
  fail("The in-app profile control must load the central avatar catalogue.");
}
if (!profileApp.includes("data-avatar-choice")) {
  fail("The learner menu must offer unlocked-avatar selection.");
}
if (!profileApp.includes("ownedAvatarIds.includes(item.id)")) {
  fail("The learner menu must reject locked avatar selections.");
}
if (!profileApp.includes('new CustomEvent("salita:avatar-equipped"')) {
  fail("Avatar changes must publish the avatar-equipped event.");
}

const indexScripts = [...index.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map(match => match[1])
  .filter(Boolean);
if (!indexScripts.length) fail("Profile gate inline script was not found.");
for (const [position, source] of indexScripts.entries()) {
  new vm.Script(source, {filename:`index-inline-${position + 1}.js`});
}
new vm.Script(profileApp, {filename:"profile-app.js"});

console.log("Starter avatar onboarding validation passed: four flora starters, existing-avatar migration and unlocked-avatar switching.");
