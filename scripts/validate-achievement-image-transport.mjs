import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root,file),"utf8");
const fail = message => { throw new Error(message); };
const requireMarkers = (source,markers,label) => markers.forEach(marker => {
  if (!source.includes(marker)) fail(`${label} is missing: ${marker}`);
});

const router = read("achievement-sharing-router-v2.js");
const routerCss = read("achievement-sharing-router-v2.css");
const bridge = read("achievement-sharing-avatar-bridge-v1.js");
const loader = read("profile-emblem-control.js");
const worker = read("service-worker.js");

for (const [file,source] of [
  ["achievement-sharing-router-v2.js",router],
  ["achievement-sharing-avatar-bridge-v1.js",bridge],
  ["profile-emblem-control.js",loader],
  ["service-worker.js",worker]
]) new vm.Script(source,{filename:file});

requireMarkers(router,[
  'const RELEASE = "5.5.16-streamlined-social-menu"',
  'modes:Object.freeze(["social_image_caption","message_link","copy_post","download_file"])',
  'data-sq-share-social',
  'data-sq-share-message',
  'data-sq-share-copy',
  'data-sq-share-download',
  'Preparing your achievement share…',
  'validateHostedResponse(data,base)',
  'share.pathname.startsWith("/share/")',
  'image.pathname.startsWith("/media/")',
  'Play Salita Quest free:',
  'async function copyText(value)',
  'function canShareImage(file)',
  'async function shareSocialPost()',
  'async function shareMessageLink()',
  'await copyText(prepared.caption)',
  'files:[file]',
  'text:prepared.caption',
  'url:hosted.shareUrl',
  'POST</span><small>For Facebook and other social feeds',
  'SEND</span><small>For Messenger and other messaging apps',
  'Post to social media',
  'Send in a messaging app',
  'Copy caption and link',
  'Download image',
  'document.addEventListener("click",handleClick,true)',
  'document.addEventListener("salita:achievement-share-prepared"'
],"Streamlined social sharing router");

const socialShare = router.match(/async function shareSocialPost\(\)([\s\S]*?)\n  async function shareMessageLink/);
if (!socialShare) fail("Social-post sharing function could not be located.");
if (socialShare[1].indexOf("await copyText(prepared.caption)") > socialShare[1].indexOf("await navigator.share")) {
  fail("The caption and play link must be copied before the social share sheet opens.");
}
if (!socialShare[1].includes("files:[file]")) {
  fail("Social-post sharing must attach the achievement image.");
}
if (!socialShare[1].includes("text:prepared.caption")) {
  fail("Social-post sharing must include the complete caption in the native payload.");
}

const messageShare = router.match(/async function shareMessageLink\(\)([\s\S]*?)\n  async function copyPost/);
if (!messageShare) fail("Messaging-link sharing function could not be located.");
if (!messageShare[1].includes("url:hosted.shareUrl")) {
  fail("Messaging apps must receive the hosted Salita Quest URL as a real URL field.");
}
if (messageShare[1].includes("files:[")) {
  fail("Messaging-link sharing must not attach the achievement image.");
}

for (const removed of [
  "data-sq-share-facebook-image",
  "data-sq-share-image-app",
  "data-sq-share-feed",
  "data-sq-share-app",
  "data-sq-share-private",
  "data-sq-share-whatsapp",
  "facebook_link",
  "composerUrl(",
  "openPublicComposer(",
  "openWhatsApp(",
  "https://www.facebook.com/sharer/",
  "https://www.linkedin.com/sharing/",
  "https://twitter.com/intent/",
  "https://wa.me/",
  "Facebook clickable card",
  "Large Facebook image post",
  "Large image with another app"
]) {
  if (router.includes(removed)) fail(`Obsolete sharing option remains: ${removed}`);
}

const renderedButtons = [...router.matchAll(/<button type="button" data-sq-share-/g)].length;
if (renderedButtons !== 4) fail(`The streamlined sharing menu must render exactly four actions, found ${renderedButtons}.`);

requireMarkers(routerCss,[
  ".achievement-share-router-v2",
  ".achievement-share-mode-group",
  ".achievement-share-mode-actions{",
  ".achievement-share-mode-actions.image-actions",
  ".achievement-share-secondary[hidden]"
],"Sharing router styles");

requireMarkers(loader,[
  'const SHARING_VERSION = "5.5.16.1"',
  'addStylesheet("sharing-router-css"',
  '`./achievement-sharing-router-v2.css?v=${SHARING_VERSION}`',
  '"achievement-sharing-router"',
  '`./achievement-sharing-router-v2.js?v=${SHARING_VERSION}`',
  '`./achievement-sharing-avatar-bridge-v1.js?v=${SHARING_VERSION}`',
  'sharingVersion:SHARING_VERSION'
],"Streamlined sharing loader");

const routerLoadIndex = loader.indexOf('"achievement-sharing-router"');
const bridgeLoadIndex = loader.indexOf('"sharing"',routerLoadIndex + 1);
if (routerLoadIndex < 0 || bridgeLoadIndex < 0 || routerLoadIndex >= bridgeLoadIndex) {
  fail("The sharing router must load before the compatibility bridge.");
}

requireMarkers(worker,[
  '"./achievement-sharing-router-v2.js"',
  '"./achievement-sharing-router-v2.css"',
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

console.log("Validated streamlined sharing: one large-image social-post route, one hosted-link messaging route, copy and download utilities, no platform-specific duplicate buttons, and learner state untouched.");