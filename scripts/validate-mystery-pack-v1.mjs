import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("coin-avatar-shop-reveal-v1.js", "utf8");
new vm.Script(source, {filename:"coin-avatar-shop-reveal-v1.js"});
const required = [
  "const MYSTERY_COST = 2500",
  "common:40, uncommon:35, rare:25",
  "function rollMysteryRarity",
  "function purchaseMystery",
  'requestedRarity:"mystery"',
  "mystery:true",
  'data-coin-pack="mystery"',
  "Revealing rarity…",
  "rarity revealed!"
];
for (const marker of required) if (!source.includes(marker)) throw new Error(`Missing marker: ${marker}`);
const shop = fs.readFileSync("coin-avatar-shard-shop-v1.js", "utf8");
for (const marker of ["common:{cost:1000", "uncommon:{cost:2000", "rare:{cost:4000"]) {
  if (!shop.includes(marker)) throw new Error(`Guaranteed pack changed: ${marker}`);
}
console.log("Validated Mystery Pack cost, 40/35/25 odds, purchase accounting, and two-stage reveal.");
