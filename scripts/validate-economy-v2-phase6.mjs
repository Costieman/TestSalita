import fs from "node:fs";
import vm from "node:vm";

const rootLoader = fs.readFileSync("economy-tracking-phase6-v1.js","utf8");
const js = fs.readFileSync("src/features/economy/economy-tracking-phase6-v1.js","utf8");
const css = fs.readFileSync("economy-tracking-phase6-v1.css","utf8");
const loader = fs.readFileSync("coin-avatar-shop-topbar-v1.js","utf8");
const fail = message => { throw new Error(message); };

new vm.Script(rootLoader,{filename:"economy-tracking-phase6-v1.js"});
new vm.Script(js,{filename:"src/features/economy/economy-tracking-phase6-v1.js"});

[
  "lifetimeEarned",
  "lifetimeSpent",
  "shardPacksPurchased",
  "mysteryPacksPurchased",
  "packsByRarity",
  "sq-economy-tracking-panel",
  "salita:coin-shard-pack-purchased"
].forEach(marker => { if (!js.includes(marker)) fail(`Missing Phase 6 tracking marker: ${marker}`); });

if (!css.includes("grid-template-columns:repeat(2,minmax(0,1fr))!important")) fail("Phone Avatar Case must use a fixed 2 by 2 grid.");
if (!css.includes("aspect-ratio:1/1")) fail("Phone Avatar Case must remain square.");
if (!css.includes("@keyframes sqAvatarCaseShine")) fail("Avatar Case shine animation is missing.");
if (!css.includes("prefers-reduced-motion:reduce")) fail("Avatar Case shine must respect reduced motion.");
if (!loader.includes("economy-tracking-phase6-v1.css?v=5.7.0")) fail("Phase 6 stylesheet is not loaded.");
if (!loader.includes("src/features/economy/economy-tracking-phase6-v1.js?v=5.7.3")) fail("Extracted Phase 6 runtime is not loaded.");

console.log("Validated Phase 6 economy tracking and the square 2 by 2 shiny phone Avatar Case.");
