import fs from "node:fs";

const css = fs.readFileSync("avatar-collection-rarity-fill-v1.css", "utf8");
const loader = fs.readFileSync("coin-avatar-shop-topbar-v1.js", "utf8");

const required = [
  '.sq-avatar-card-art::before',
  'clip-path:inset(var(--avatar-mask-top,100%) 0 0 0)',
  '.sq-avatar-rarity-section[data-rarity="common"]',
  '#c5e2f5',
  '.sq-avatar-rarity-section[data-rarity="uncommon"]',
  '#f4caca',
  '.sq-avatar-rarity-section[data-rarity="rare"]',
  '#cde8d0',
  '.sq-avatar-card-art{background:#d1d6d5!important}'
];
for (const token of required) if (!css.includes(token)) throw new Error(`Missing collection fill token: ${token}`);
if (!loader.includes('avatar-collection-rarity-fill-v1.css?v=5.6.7')) throw new Error("Collection rarity stylesheet is not loaded");
if (loader.includes("MutationObserver")) throw new Error("Topbar observer must remain disabled");
console.log("Avatar collection rarity fill validation passed.");
