import fs from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), "utf8");
const fail = message => { throw new Error(message); };
const requireMarkers = (source, markers, label) => markers.forEach(marker => {
  if (!source.includes(marker)) fail(`${label} is missing ${marker}`);
});

const catalogueLoaderPath = "avatar-catalogue-v1.js";
const catalogueModulePath = "src/features/avatar/avatar-catalogue-v1.js";
const migrationLoaderPath = "avatar-progression-migration-v1.js";
const migrationModulePath = "src/features/avatar/avatar-progression-migration-v1.js";
const catalogueLoader = read(catalogueLoaderPath);
const catalogueModule = read(catalogueModulePath);
const migrationLoader = read(migrationLoaderPath);
const migrationModule = read(migrationModulePath);
const index = read("index.html");
const profileApp = read("profile-app.js");
const emblem = read("profile-emblem-control.js");
const refresh = read("mobile-refresh.html");
const worker = read("service-worker.js");

for (const [path, source] of [
  [catalogueLoaderPath, catalogueLoader],
  [catalogueModulePath, catalogueModule],
  [migrationLoaderPath, migrationLoader],
  [migrationModulePath, migrationModule],
  ["service-worker.js", worker]
]) new vm.Script(source, {filename:path});

requireMarkers(catalogueLoader, [
  'const TARGET = "./src/features/avatar/avatar-catalogue-v1.js?v=5.5.6"',
  "document.currentScript",
  "document.write",
  "script.async = false",
  'salitaCompatibilityLoader = "avatar-catalogue"'
], "Avatar catalogue compatibility loader");
if (catalogueLoader.includes("const records =") || catalogueLoader.includes("root.SalitaAvatarModel =")) {
  fail("The root avatar catalogue loader must not own catalogue behavior");
}

requireMarkers(migrationLoader, [
  'const TARGET = "./src/features/avatar/avatar-progression-migration-v1.js?v=5.5.6"',
  "document.currentScript",
  "document.write",
  "script.async = false",
  'salitaCompatibilityLoader = "avatar-progression-migration"'
], "Avatar migration compatibility loader");
if (/\b(?:localStorage|PROFILE_STORE|migrateStorage|avatar-progression-migrated)\b/.test(migrationLoader)) {
  fail("The root avatar migration loader must not own persistence or event behavior");
}

requireMarkers(catalogueModule, [
  'const SCHEMA_VERSION = 1',
  'const STARTER_IDS = Object.freeze(["anahaw", "orchid", "jade", "rafflesia"])',
  'const MANIFEST_PATH = "avatars/canonical/manifest.json"',
  "function normaliseCollectionState(input = {}, fallbackAvatarId = \"\")",
  "root.SalitaAvatarCatalogue = catalogue",
  "root.SalitaAvatarModel = Object.freeze({"
], "Extracted avatar catalogue");
if (/\b(?:localStorage|sessionStorage)\b/.test(catalogueModule)) fail("Avatar catalogue must remain storage-free");

requireMarkers(migrationModule, [
  'const PROFILE_STORE = "salitaQuestLocalProfilesV1"',
  'const PROFILE_PROGRESS_PREFIX = "salitaQuestProgress.profile."',
  'const MIGRATION_VERSION = 1',
  "function migrateProfile(profile, courseStates, model, now = new Date().toISOString())",
  "function migrateStorage(storage, model, now = new Date().toISOString())",
  "root.SalitaAvatarProgressionMigration = Object.freeze({",
  'document.dispatchEvent(new CustomEvent("salita:avatar-progression-migrated", {detail:result}))'
], "Extracted avatar migration");

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(catalogueModule, sandbox, {filename:catalogueModulePath});
vm.runInContext(migrationModule, sandbox, {filename:migrationModulePath});
const model = sandbox.SalitaAvatarModel;
const migration = sandbox.SalitaAvatarProgressionMigration;
if (!model || model.catalogue.length !== 48) fail("Extracted catalogue must expose exactly 48 avatars");
for (const method of ["normaliseId", "get", "list", "weeklyShardAward", "normaliseCollectionState", "progress"]) {
  if (typeof model[method] !== "function") fail(`Avatar model lost ${method}`);
}
for (const method of ["safeParse", "resolveLegacyAvatarId", "normaliseWeekly", "mergeLegacyWeeklyState", "migrateProfile", "migrateStorage"]) {
  if (typeof migration?.[method] !== "function") fail(`Avatar migration lost ${method}`);
}

const store = {
  schemaVersion:1,
  profiles:[{id:"p1", avatarId:"anahaw", avatarCollection:{ownedAvatarIds:["anahaw"]}}]
};
const values = new Map([
  ["salitaQuestLocalProfilesV1", JSON.stringify(store)],
  ["salitaQuestProgress.profile.p1.tagalog", JSON.stringify({weeklyAvatarChest:{keyDates:["2026-08-01"], unlockedRewards:["eagle"]}})]
]);
const storage = {
  getItem:key => values.has(key) ? values.get(key) : null,
  setItem:(key, value) => values.set(key, value)
};
const first = migration.migrateStorage(storage, model, "2026-08-05T00:00:00.000Z");
const second = migration.migrateStorage(storage, model, "2026-08-05T00:00:00.000Z");
if (!first.changed || second.changed) fail("Avatar migration must remain additive and idempotent");
const migratedStore = JSON.parse(values.get("salitaQuestLocalProfilesV1"));
if (!migratedStore.profiles[0].avatarCollection.ownedAvatarIds.includes("eagle")) fail("Legacy avatar ownership was not preserved");

requireMarkers(index, ['src="src/features/avatar/avatar-catalogue-v1.js?v=5.5.0"'], "Profile gate catalogue loading");
requireMarkers(profileApp, ['./src/features/avatar/avatar-catalogue-v1.js?v=5.5.4'], "Profile runtime fallback");
requireMarkers(emblem, [
  './src/features/avatar/avatar-catalogue-v1.js?v=${RELEASE_VERSION}',
  './src/features/avatar/avatar-progression-migration-v1.js?v=${RELEASE_VERSION}'
], "Avatar progression asset loader");
const catalogueIndex = emblem.indexOf('await loadScript("catalogue"');
const migrationIndex = emblem.indexOf('await loadScript("migration"');
if (!(catalogueIndex >= 0 && migrationIndex > catalogueIndex)) fail("Avatar migration must remain downstream of catalogue loading");
for (const source of [index, profileApp, emblem, refresh]) {
  if (source.includes('src="avatar-catalogue-v1.js') || source.includes('./avatar-catalogue-v1.js?v=')) {
    fail("A current loader still requests the root avatar catalogue compatibility URL");
  }
  if (source.includes('./avatar-progression-migration-v1.js?v=')) {
    fail("A current loader still requests the root avatar migration compatibility URL");
  }
}
for (const path of [catalogueModulePath, migrationModulePath]) {
  if (!refresh.includes(path)) fail(`Mobile refresh does not fetch ${path}`);
}

requireMarkers(worker, [
  'const PREVIOUS_CACHE_NAME = "salita-quest-v5-6-19-long-term-badge-adapter-extraction-r72"',
  'const CACHE_NAME = "salita-quest-v5-6-20-avatar-case-profile-adapter-extraction-r73"',
  '"./avatar-catalogue-v1.js"',
  '"./src/features/avatar/avatar-catalogue-v1.js"',
  '"./avatar-progression-migration-v1.js"',
  '"./src/features/avatar/avatar-progression-migration-v1.js"'
], "Avatar data and migration offline contract");

console.log("Avatar data/migration extraction validation passed: stable 48-avatar model, idempotent migration, direct current loaders, compatibility-only roots and r58 offline delivery.");
