import fs from "node:fs";
import vm from "node:vm";

const js = fs.readFileSync("src/features/avatar/avatar-collection-tabs-phase6-1-v1.js", "utf8");
const css = fs.readFileSync("avatar-collection-tabs-phase6-1-v1.css", "utf8");
const loader = fs.readFileSync("coin-avatar-shop-topbar-v1.js", "utf8");
const fail = message => { throw new Error(message); };

new vm.Script(js, {filename:"src/features/avatar/avatar-collection-tabs-phase6-1-v1.js"});

[
  'data-avatar-collection-tab="collection"',
  'data-avatar-collection-tab="statistics"',
  'dataset.avatarCollectionPane = "statistics"',
  'dataset.avatarCollectionPane = "collection"',
  'activeTab === "statistics"',
  'window.SalitaEconomyTrackingPhase6?.render?.()'
].forEach(marker => { if (!js.includes(marker)) fail(`Missing tabs marker: ${marker}`); });

[
  'grid-template-columns:1fr 1fr',
  '.sq-avatar-statistics-pane',
  'grid-template-columns:repeat(2,minmax(0,1fr))!important',
  'grid-template-rows:repeat(2,minmax(0,auto))!important',
  'overflow:visible!important',
  'aspect-ratio:1/1!important',
  '.sq-avatar-case-body:not([hidden])'
].forEach(marker => { if (!css.includes(marker)) fail(`Missing layout marker: ${marker}`); });

if (css.includes('overflow-y:auto') || css.includes('overflow-y:scroll')) fail("Avatar Case must not use an internal vertical scrollbar.");
if (!loader.includes('avatar-collection-tabs-phase6-1-v1.css?v=5.7.1')) fail("Phase 6.1 CSS is not loaded.");
if (!loader.includes('avatar-collection-tabs-phase6-1-v1.js?v=5.7.1')) fail("Phase 6.1 JS is not loaded.");

console.log("Validated separate Statistics tab and fully visible collapsible 2x2 phone Avatar Case without internal scrolling.");
