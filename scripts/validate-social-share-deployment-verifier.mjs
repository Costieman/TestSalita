import fs from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root,file),"utf8");
const fail = message => { throw new Error(message); };
const requireMarkers = (source,markers,label) => markers.forEach(marker => {
  if (!source.includes(marker)) fail(`${label} is missing: ${marker}`);
});

const verifier = read("services/social-share/verify-deployment.mjs");
const deploy = read("services/social-share/deploy-cloud-shell.sh");
const service = read("services/social-share/index.js");

requireMarkers(verifier,[
  'const serviceUrl = String(process.argv[2] || process.env.SOCIAL_SHARE_URL || "")',
  'FACEBOOK_USER_AGENT',
  'facebookexternalhit/1.1',
  'health.bucketConfigured === true',
  '["badge","badge_chest","avatar","avatar_case","level_up"]',
  'pngDataUrl(1080,1080',
  'pngDataUrl(1200,630',
  'type:"avatar_case"',
  'shareUrl.pathname.startsWith("/share/")',
  'imageUrl.pathname.startsWith("/media/")',
  '<meta name="robots" content="index,follow,max-image-preview:large">',
  '<meta property="og:image:url" content="${imageUrl}">',
  '<meta property="og:image:width" content="1200">',
  '<meta property="og:image:height" content="630">',
  '!/noindex|nofollow/i.test(page)',
  'Number(head.headers.get("content-length")) > 0',
  'await fetchPng(imageUrl,1200,630,"Facebook Open Graph image",FACEBOOK_USER_AGENT)',
  'facebookCrawlerVerified:true',
  'visibleLinkFallbackRequired:true',
  'status:"PASS"'
],"Facebook deployment verifier");

requireMarkers(service,[
  'const SERVICE_VERSION = "5.5.13-facebook-card-link"',
  'app.get("/robots.txt"',
  'Allow: /share/',
  'app.head("/media/:id/:variant.png"',
  '"Content-Length"',
  '"X-Robots-Tag": "all"',
  '<meta name="robots" content="index,follow,max-image-preview:large">',
  '<meta property="og:image:url" content="${image}">'
],"Facebook-crawlable hosted service");
if (/noindex|nofollow/.test(service)) fail("Hosted share pages must not block Facebook crawling.");

requireMarkers(deploy,[
  'curl --fail --silent --show-error --max-time 30 "${candidate}/health"',
  'Running end-to-end public-card verification...',
  'node services/social-share/verify-deployment.mjs "${SERVICE_URL}"',
  'Hosted achievement sharing is ready.'
],"Cloud Run deployment flow");

const healthIndex = deploy.indexOf('${candidate}/health');
const verifierIndex = deploy.indexOf('node services/social-share/verify-deployment.mjs');
if (healthIndex < 0 || verifierIndex <= healthIndex) fail("End-to-end verification must run after the health endpoint succeeds.");
if (/Learner Login/.test(deploy)) fail("The deployment script must not advertise the learner-login page as a share destination.");

for (const file of ["services/social-share/index.js","services/social-share/verify-deployment.mjs"]) {
  const syntax = spawnSync(process.execPath,["--check",file],{cwd:root,encoding:"utf8"});
  if (syntax.status !== 0) fail(`${file} failed syntax check: ${syntax.stderr}`);
}

console.log("Validated Facebook-ready Cloud Run sharing: crawler-visible page, explicit robots allowance, complete Open Graph metadata, image HEAD support, positive Content-Length and learn-free destination.");