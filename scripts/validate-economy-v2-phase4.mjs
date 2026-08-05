import fs from "node:fs";
import vm from "node:vm";

const nav = fs.readFileSync("desktop-navigation-refinement.js", "utf8");
const css = fs.readFileSync("coin-avatar-shard-shop-v1.css", "utf8");
const shop = fs.readFileSync("coin-avatar-shard-shop-v1.js", "utf8");
const mystery = fs.readFileSync("coin-avatar-shop-reveal-v1.js", "utf8");
const fail = message => { throw new Error(message); };

new vm.Script(nav, {filename:"desktop-navigation-refinement.js"});
new vm.Script(shop, {filename:"coin-avatar-shard-shop-v1.js"});

[
  'const PHASE4_RELEASE = "economy-v2-phase4-shop-navigation"',
  'action:"shop",label:"Shop"',
  'action:"shop",icon:"🛍️",label:"Shop"',
  'data-sq-nav-action="shop"',
  "window.SalitaCoinAvatarShop",
  "shop.open()",
  "closeMobileNavigation()",
  "requiredMenuActions:REQUIRED_MENU_ACTIONS",
  "openShop"
].forEach(marker => {
  if (!nav.includes(marker)) fail(`Missing Phase 4 navigation marker: ${marker}`);
});

if ((nav.match(/action:"shop"/g) || []).length < 2) {
  fail("Shop must be created in both desktop and mobile navigation.");
}
if (!nav.includes("document.querySelectorAll('[data-sq-nav-action=\"shop\"]')")) {
  fail("Shop navigation actions must share one safe click handler.");
}
if (nav.includes("new MutationObserver(installButton)") || nav.includes("new MutationObserver(installTopbar")) {
  fail("Phase 4 must not restore the crashing broad shop-button observer.");
}
if (!css.includes("z-index:2147483550")) fail("Shop overlay must sit above normal views and collection layers.");
if (!css.includes("grid-template-columns:repeat(4")) fail("Desktop shop must present all four packs clearly.");
if (!css.includes(".sq-coin-pack.mystery")) fail("Mystery Pack must have a distinct Phase 4 presentation.");

[
  "common:{cost:1000",
  "uncommon:{cost:2000",
  "rare:{cost:4000"
].forEach(marker => {
  if (!shop.includes(marker)) fail(`Guaranteed pack contract changed: ${marker}`);
});
if (!mystery.includes("const MYSTERY_COST = 2500")) fail("Mystery Pack cost changed.");
if (!mystery.includes("const MYSTERY_ODDS = Object.freeze({common:40, uncommon:35, rare:25})")) fail("Mystery odds changed.");
if (!mystery.includes("item.levelReward == null")) fail("Guaranteed level avatars must remain outside random pools.");

[
  "const balanceChanged = current !== lastKnownBalance",
  "if (balanceChanged) updateOpenShop()",
  'const mysteryCard = grid.querySelector(".sq-coin-pack.mystery")',
  "grid.insertBefore(mysteryCard, rareCard || null)"
].forEach(marker => {
  if (!shop.includes(marker)) fail(`Missing Mystery menu stability guard: ${marker}`);
});
if (shop.includes("internalBalanceWrite = false;\n    updateOpenShop();")) {
  fail("The open shop must not rebuild every polling cycle.");
}

console.log("Validated stable desktop/mobile Shop navigation, preserved Mystery card rendering, topmost overlay presentation, and unchanged Economy v2 pack rules.");
