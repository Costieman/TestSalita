import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root,file),"utf8");
const fail = message => { throw new Error(message); };
const requireMarkers = (source,markers,label) => markers.forEach(marker => {
  if (!source.includes(marker)) fail(`${label} is missing: ${marker}`);
});

const routerShim = read("achievement-sharing-router-v2.js");
const routerRoot = read("achievement-sharing-router-v3.js");
const router = read("src/features/sharing/achievement-sharing-router-v3.js");
const routerCss = read("achievement-sharing-router-v2.css");
const bridge = read("achievement-sharing-avatar-bridge-v1.js");
const loader = read("profile-emblem-control.js");
const worker = read("service-worker.js");

for (const [file,source] of [
  ["achievement-sharing-router-v2.js",routerShim],
  ["achievement-sharing-router-v3.js",routerRoot],
  ["src/features/sharing/achievement-sharing-router-v3.js",router],
  ["achievement-sharing-avatar-bridge-v1.js",bridge],
  ["profile-emblem-control.js",loader],
  ["service-worker.js",worker]
]) new vm.Script(source,{filename:file});

requireMarkers(routerShim,[
  "__salitaQuestAchievementSharingRouterV3Installed",
  'script.src = "./src/features/sharing/achievement-sharing-router-v3.js?v=5.5.21"',
  'script.dataset.sqSharingRouterV3 = "true"',
  'script.async = false'
],"Sharing-router v2 entry loader");

requireMarkers(routerRoot,[
  "__salitaQuestAchievementSharingRouterV3Installed",
  "__salitaQuestAchievementSharingRouterV3CompatibilityLoading",
  'const source = "./src/features/sharing/achievement-sharing-router-v3.js?v=5.5.21"',
  "document.write",
  "script.async = false"
],"Sharing-router root compatibility loader");
for (const forbidden of [
  "document.addEventListener",
  "window.SalitaQuestSharingRouter =",
  "navigator.share",
  "localStorage",
  "sessionStorage"
]) {
  if (routerRoot.includes(forbidden)) fail(`Root compatibility loader owns implementation behavior: ${forbidden}`);
}

requireMarkers(router,[
  'const RELEASE = "5.5.21-mobile-share-desktop-save-only"',
  'modes:Object.freeze(["mobile_native_image_share","desktop_save_only"])',
  'const APP_URL = "https://costieman.github.io/SalitaQuest/"',
  'const QR_DATA_URL = "data:image/png;base64,',
  'const isMobileShareDevice = () =>',
  'async function decorateWithQr(source)',
  'async function copyCaption()',
  'Play Salita Quest free:',
  'async function shareOnMobile()',
  'navigator.share({title:prepared.title,text:caption,files:[file]})',
  'async function saveAchievement()',
  'data-sq-share-main',
  'data-sq-share-save',
  'desktop-save-only',
  'document.addEventListener("click"',
  'document.addEventListener("salita:achievement-share-prepared"',
  'document.addEventListener("salita:achievement-share-closed"',
  'window.SalitaQuestSharingRouter = Object.freeze'
],"Current achievement sharing router module");

if ((router.match(/document\.addEventListener\(/g) || []).length !== 3) {
  fail("The extracted sharing router must own exactly three document listeners.");
}
if (router.includes("localStorage") || router.includes("sessionStorage")) {
  fail("The sharing router must not access learner storage.");
}
if (router.includes("facebook.com/sharer") || router.includes("twitter.com/intent") || router.includes("wa.me/")) {
  fail("The current sharing router must not restore platform-specific duplicate actions.");
}
const mobileMarkup = router.match(/host\.innerHTML = isMobileShareDevice\(\)([\s\S]*?);\n    host\.classList/);
if (!mobileMarkup || !mobileMarkup[1].includes("data-sq-share-main") || !mobileMarkup[1].includes("data-sq-share-save")) {
  fail("Mobile sharing must expose one Share action and one Save action.");
}
if (!mobileMarkup[1].includes(': `<button type="button" data-sq-share-save>Save</button>`')) {
  fail("Desktop sharing must expose Save only.");
}

requireMarkers(routerCss,[
  ".achievement-share-router-v3",
  ".achievement-share-router-v3 button",
  ".achievement-share-router-v3 [data-sq-share-main]",
  ".achievement-share-router-v3 [data-sq-share-save]",
  ".achievement-share-router-v3 button:disabled",
  ".achievement-share-secondary[hidden]",
  "@media(max-width:650px)"
],"Sharing router styles");

requireMarkers(loader,[
  'const SHARING_VERSION = "5.5.20.1"',
  'addStylesheet("sharing-router-css"',
  '`./achievement-sharing-router-v2.css?v=${SHARING_VERSION}`',
  '"achievement-sharing-router"',
  '`./achievement-sharing-router-v2.js?v=${SHARING_VERSION}`',
  '`./achievement-sharing-avatar-bridge-v1.js?v=${SHARING_VERSION}`',
  'sharingVersion:SHARING_VERSION'
],"Current sharing loader");

const routerLoadIndex = loader.indexOf('"achievement-sharing-router"');
const bridgeLoadIndex = loader.indexOf('"sharing"',routerLoadIndex + 1);
if (routerLoadIndex < 0 || bridgeLoadIndex < 0 || routerLoadIndex >= bridgeLoadIndex) {
  fail("The sharing router must load before the compatibility bridge.");
}

requireMarkers(worker,[
  '"./achievement-sharing-router-v2.js"',
  '"./achievement-sharing-router-v2.css"',
  '"./achievement-sharing-router-v3.js"',
  '"./src/features/sharing/achievement-sharing-router-v3.js"',
  '"./profile-emblem-control.js"',
  "self.skipWaiting()",
  "self.clients.claim()"
],"Installed-app sharing delivery");

requireMarkers(bridge,[
  "openAvatarCase(...args)",
  "compatibilityOnly:true, transportOwner:false"
],"Compatibility-only avatar bridge");
if (bridge.includes('document.addEventListener("click"')) {
  fail("The avatar bridge must not intercept sharing actions.");
}

console.log("Validated the extracted sharing chain: v2 entry loader, compatibility-only v3 root, feature-owned QR mobile sharing, desktop Save-only behaviour, no duplicate platform actions, and learner state untouched.");
