import fs from "node:fs";
import vm from "node:vm";

const read = path => fs.readFileSync(path,"utf8");
const shop = read("coin-avatar-shard-shop-v1.js");
const reveal = read("coin-avatar-shop-reveal-v1.js");
const revealCss = read("coin-avatar-shop-reveal-v1.css");
const rarityCss = read("coin-avatar-reveal-rarity-v1.css");
const testingGrant = read("coin-testing-grant-100k-v1.js");
const badges = read("coin-avatar-shop-badges-v1.js");
const loader = read("profile-emblem-control.js");
const weekly = read("weekly-avatar-shard-rewards-v1.js");
const topbar = read("coin-avatar-shop-topbar-v1.js");

for (const [name,source] of [["shop",shop],["reveal",reveal],["testingGrant",testingGrant],["badges",badges],["loader",loader],["topbar",topbar]]) {
  new vm.Script(source,{filename:name});
}

const required = [
  [shop,"common:{cost:1000"],[shop,"uncommon:{cost:2000"],[shop,"rare:{cost:4000"],
  [shop,"const SHARDS_PER_PACK = 25"],[shop,"Math.floor(Math.random() * pool.length)"],
  [shop,"!account.collection.ownedAvatarIds.includes(item.id)"],
  [shop,"function spendCoins(cost)"],[shop,"state.coins = after"],
  [shop,"saveProgress();"],[shop,"refreshWalletUI();"],
  [shop,"coinValue"],[shop,"mobileCoinValue"],[shop,"salita:coin-balance-changed"],
  [shop,"No shards were awarded"],
  [shop,"coin-avatar-shop-reveal-v1.js?v=5.6.4"],
  [shop,"coin-avatar-shop-reveal-v1.css?v=5.6.4"],
  [loader,"coin-avatar-shard-shop-v1.js"],[loader,"coin-avatar-shop-badges-v1.js"],
  [loader,'const COIN_SHOP_VERSION = "5.6.4"'],
  [reveal,'const GRANT_AMOUNT = 10000'],[reveal,'coinShopAnimation10000V1'],
  [reveal,'payload.testingGrants[GRANT_ID]'],[reveal,'payload.coins ='],
  [reveal,'salita:coin-shard-pack-purchased'],[reveal,'Choosing your avatar'],
  [reveal,'detail.before'],[reveal,'detail.after'],[reveal,'Avatar complete!'],
  [revealCss,'.sq-coin-reveal-colour'],[revealCss,'clip-path'],
  [revealCss,'.sq-coin-reveal.complete'],[revealCss,'sq-complete-burst'],
  [topbar,'coin-avatar-reveal-rarity-v1.css?v=5.6.6'],
  [topbar,'coin-testing-grant-100k-v1.js?v=5.6.8'],
  [topbar,'host.dataset.rarity = rarity'],
  [testingGrant,'const GRANT_AMOUNT = 100000'],
  [testingGrant,'coinShopTesting100000V1'],
  [testingGrant,'if (payload.testingGrants[GRANT_ID]) return false'],
  [testingGrant,'payload.coins ='],
  [testingGrant,'salita:coin-balance-changed'],
  [rarityCss,'.sq-coin-reveal-art{background:#d6dcda}'],
  [rarityCss,'data-rarity="common"'],[rarityCss,'#c5e2f7'],
  [rarityCss,'data-rarity="uncommon"'],[rarityCss,'#f5caca'],
  [rarityCss,'data-rarity="rare"'],[rarityCss,'#cbe8ce'],
  [rarityCss,'.sq-coin-reveal-colour{background:#d6dcda}'],
  [badges,"lt_coins_500000"],[badges,"lt_coins_1000000"],
  [badges,"chain(\"coins_spent\""],[badges,"chain(\"packs\""],
  [badges,"chain(\"common_owned\""],[badges,"chain(\"uncommon_owned\""],[badges,"chain(\"rare_owned\""]
];
for (const [source,token] of required) if (!source.includes(token)) throw new Error(`Missing required token: ${token}`);

if (!weekly.includes("const KEY_TARGET = 6")) throw new Error("Weekly key target changed");
if (!weekly.includes("Rewards are never assigned randomly")) throw new Error("Weekly targeted-choice rule changed");
if (!weekly.includes("model.weeklyShardAward")) throw new Error("Weekly rarity award logic changed");
if (shop.includes("avatarWeeklyRewards") || shop.includes("KEY_TARGET")) throw new Error("Coin shop must not mutate weekly key rewards");
if (topbar.includes("MutationObserver")) throw new Error("Disabled topbar runtime must not restore a document-wide observer");

const spendIndex = shop.indexOf("if (!spendCoins(pack.cost))");
const shardWriteIndex = shop.indexOf("account.collection.shards[item.id] = after");
if (spendIndex < 0 || shardWriteIndex < 0 || spendIndex > shardWriteIndex) {
  throw new Error("Coins must be deducted successfully before shards are awarded");
}

const grantMarkerIndex = reveal.indexOf("if (payload.testingGrants[GRANT_ID]) return false");
const grantWriteIndex = reveal.indexOf("payload.coins =");
if (grantMarkerIndex < 0 || grantWriteIndex < grantMarkerIndex) throw new Error("Original testing grant must remain one-time and marker governed");

const grant100kMarkerIndex = testingGrant.indexOf("if (payload.testingGrants[GRANT_ID]) return false");
const grant100kWriteIndex = testingGrant.indexOf("payload.coins =");
if (grant100kMarkerIndex < 0 || grant100kWriteIndex < grant100kMarkerIndex) throw new Error("100k testing grant must be one-time and marker governed");

console.log("Coin avatar shard shop validation passed.");
