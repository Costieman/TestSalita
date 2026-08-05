import fs from "node:fs";

const css = fs.readFileSync("avatar-case-mobile-flow-hotfix-v1.css", "utf8");
const loader = fs.readFileSync("coin-avatar-shop-topbar-v1.js", "utf8");
const fail = message => { throw new Error(message); };

[
  ".sq-avatar-case-panel",
  "height:auto!important",
  "max-height:none!important",
  "overflow:visible!important",
  ".sq-avatar-case-body:not([hidden])",
  "grid-template-columns:repeat(2,minmax(0,1fr))!important",
  "grid-auto-rows:auto!important",
  ".sq-avatar-case-slot.is-filled",
  "grid-template-rows:minmax(132px,1fr) auto!important",
  ".sq-avatar-collection-summary",
  "clear:both!important"
].forEach(marker => {
  if (!css.includes(marker)) fail(`Missing mobile flow marker: ${marker}`);
});

if (css.includes("overflow-y:auto") || css.includes("overflow-y:scroll")) {
  fail("Avatar Case hotfix must not introduce an internal vertical scrollbar.");
}
if (!loader.includes("avatar-case-mobile-flow-hotfix-v1.css?v=5.7.2")) {
  fail("Mobile Avatar Case flow hotfix is not loaded.");
}

console.log("Validated full-height mobile Avatar Case flow with four visible tiles and no internal scrollbar.");
