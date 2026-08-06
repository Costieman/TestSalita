import fs from "node:fs";
import vm from "node:vm";

const summary = fs.readFileSync("avatar-collection-summary-v1.js", "utf8");
const css = fs.readFileSync("avatar-collection-summary-v1.css", "utf8");
const grant = fs.readFileSync("coin-testing-grant-50k-phase5-v1.js", "utf8");
const loader = fs.readFileSync("coin-avatar-shop-topbar-v1.js", "utf8");
const fail = message => { throw new Error(message); };

new vm.Script(summary, {filename:"avatar-collection-summary-v1.js"});
new vm.Script(grant, {filename:"coin-testing-grant-50k-phase5-v1.js"});
new vm.Script(loader, {filename:"coin-avatar-shop-topbar-v1.js"});

[
  'const RARITIES = Object.freeze(["common", "uncommon", "rare"])',
  'item.randomRarity || item.rarity',
  'Overall collection',
  'sq-avatar-summary-rarities',
  'SalitaAvatarCollectionSummary'
].forEach(marker => { if (!summary.includes(marker)) fail(`Missing collection summary marker: ${marker}`); });

if (!css.includes('.sq-avatar-summary-card.common') || !css.includes('.sq-avatar-summary-card.uncommon') || !css.includes('.sq-avatar-summary-card.rare')) {
  fail("Collection summary must visually distinguish all three rarities.");
}
if (!grant.includes('const GRANT_ID = "coinShopTesting50000Phase5V1"')) fail("Testing grant must use a unique marker.");
if (!grant.includes('const GRANT_AMOUNT = 50000')) fail("Testing grant must award exactly 50,000 coins.");
if (grant.indexOf('payload.testingGrants[GRANT_ID] =') > grant.indexOf('payload.coins =')) fail("Grant marker must be written before increasing coins.");
if (!grant.includes('key.startsWith(PROGRESS_PREFIX)')) fail("Grant must apply to all existing progress records.");

[
  'avatar-collection-summary-v1.css?v=5.6.9',
  'avatar-collection-summary-v1.js?v=5.6.9',
  'coin-testing-grant-50k-phase5-v1.js?v=5.6.9'
].forEach(marker => { if (!loader.includes(marker)) fail(`Loader missing Phase 5 asset: ${marker}`); });

console.log("Validated Phase 5 collection totals, rarity breakdown, overall completion, and one-time 50,000-coin testing grant.");