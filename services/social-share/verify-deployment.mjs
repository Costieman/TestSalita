import zlib from "node:zlib";

const serviceUrl = String(process.argv[2] || process.env.SOCIAL_SHARE_URL || "").trim().replace(/\/$/,"");
const allowedOrigin = String(process.env.SALITA_APP_ORIGIN || "https://costieman.github.io").trim().replace(/\/$/,"");
const FACEBOOK_USER_AGENT = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

function fail(message) {
  throw new Error(message);
}

function assert(condition,message) {
  if (!condition) fail(message);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type,data) {
  const typeBuffer = Buffer.from(type,"ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length,0);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer,data])),0);
  return Buffer.concat([length,typeBuffer,data,checksum]);
}

function solidPng(width,height,[red,green,blue,alpha = 255]) {
  const signature = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width,0);
  ihdr.writeUInt32BE(height,4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const row = Buffer.alloc(1 + width * 4);
  for (let x = 0; x < width; x += 1) {
    const offset = 1 + x * 4;
    row[offset] = red;
    row[offset + 1] = green;
    row[offset + 2] = blue;
    row[offset + 3] = alpha;
  }
  const raw = Buffer.alloc(row.length * height);
  for (let y = 0; y < height; y += 1) row.copy(raw,y * row.length);
  return Buffer.concat([
    signature,
    pngChunk("IHDR",ihdr),
    pngChunk("IDAT",zlib.deflateSync(raw,{level:9})),
    pngChunk("IEND",Buffer.alloc(0))
  ]);
}

function pngDataUrl(width,height,color) {
  return `data:image/png;base64,${solidPng(width,height,color).toString("base64")}`;
}

function pngDimensions(buffer) {
  const signature = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
  assert(buffer.length >= 24 && buffer.subarray(0,8).equals(signature),"Hosted image is not a valid PNG.");
  return {width:buffer.readUInt32BE(16),height:buffer.readUInt32BE(20)};
}

async function jsonResponse(response,label) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) fail(`${label} failed (${response.status}): ${data.message || "unknown response"}`);
  return data;
}

async function fetchPng(url,expectedWidth,expectedHeight,label,userAgent = "SalitaQuestDeploymentVerifier/1.0") {
  const head = await fetch(url,{method:"HEAD",headers:{Accept:"image/png","User-Agent":userAgent},redirect:"follow"});
  assert(head.ok,`${label} HEAD returned ${head.status}.`);
  assert(String(head.headers.get("content-type") || "").startsWith("image/png"),`${label} HEAD did not return image/png.`);
  assert(Number(head.headers.get("content-length")) > 0,`${label} HEAD did not expose a positive Content-Length.`);

  const response = await fetch(url,{headers:{Accept:"image/png","User-Agent":userAgent},redirect:"follow"});
  assert(response.ok,`${label} returned ${response.status}.`);
  assert(String(response.headers.get("content-type") || "").startsWith("image/png"),`${label} did not return image/png.`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const dimensions = pngDimensions(buffer);
  assert(dimensions.width === expectedWidth && dimensions.height === expectedHeight,
    `${label} must be ${expectedWidth}×${expectedHeight}, received ${dimensions.width}×${dimensions.height}.`);
}

async function main() {
  assert(serviceUrl,"Usage: node services/social-share/verify-deployment.mjs https://SERVICE-URL");
  const base = new URL(serviceUrl);
  assert(base.protocol === "https:","The hosted sharing service must use HTTPS.");

  const healthResponse = await fetch(`${serviceUrl}/health`,{headers:{Accept:"application/json"},cache:"no-store"});
  const health = await jsonResponse(healthResponse,"Health check");
  assert(health.ok === true,"Health response did not report ok=true.");
  assert(health.bucketConfigured === true,"Hosted share storage is not configured.");
  const expectedTypes = ["badge","badge_chest","avatar","avatar_case","level_up"];
  for (const type of expectedTypes) assert(health.supportedTypes?.includes(type),`Health response is missing share type: ${type}`);

  const robots = await fetch(`${serviceUrl}/robots.txt`,{headers:{"User-Agent":FACEBOOK_USER_AGENT}});
  assert(robots.ok,"robots.txt is not publicly available.");
  assert((await robots.text()).includes("Allow: /share/"),"robots.txt does not allow hosted share pages.");

  const title = `Salita Quest Facebook preview test ${new Date().toISOString()}`;
  const description = "A temporary verification card confirming public achievement sharing is ready.";
  const uploadResponse = await fetch(`${serviceUrl}/api/share-cards`,{
    method:"POST",
    credentials:"omit",
    headers:{"Content-Type":"application/json",Accept:"application/json",Origin:allowedOrigin},
    body:JSON.stringify({
      type:"avatar_case",
      title,
      description,
      learnerName:"Release verifier",
      course:"Tagalog",
      campaign:"facebook-preview-verification",
      squareImageDataUrl:pngDataUrl(1080,1080,[15,118,110,255]),
      ogImageDataUrl:pngDataUrl(1200,630,[7,20,39,255])
    })
  });
  const card = await jsonResponse(uploadResponse,"Share-card creation");

  const shareUrl = new URL(card.shareUrl || "");
  const imageUrl = new URL(card.imageUrl || "");
  const squareImageUrl = new URL(card.squareImageUrl || "");
  const appUrl = new URL(card.appUrl || "");
  assert(shareUrl.origin === base.origin && shareUrl.pathname.startsWith("/share/"),"Share URL is not a public hosted achievement page.");
  assert(imageUrl.origin === base.origin && imageUrl.pathname.startsWith("/media/"),"Open Graph image URL is invalid.");
  assert(squareImageUrl.origin === base.origin && squareImageUrl.pathname.startsWith("/media/"),"Square image URL is invalid.");
  assert(appUrl.protocol === "https:","Learn-free destination is not HTTPS.");

  const pageResponse = await fetch(shareUrl,{headers:{Accept:"text/html","User-Agent":FACEBOOK_USER_AGENT},redirect:"follow"});
  assert(pageResponse.ok,`Facebook crawler request returned ${pageResponse.status}.`);
  assert(String(pageResponse.headers.get("x-robots-tag") || "").toLowerCase() === "all","Share page does not explicitly allow social crawling.");
  const page = await pageResponse.text();
  assert(page.includes('<meta name="robots" content="index,follow,max-image-preview:large">'),"Public page does not allow large social-image previews.");
  assert(!/noindex|nofollow/i.test(page),"Public page still blocks Facebook crawling.");
  assert(page.includes(`<meta property="og:url" content="${shareUrl}">`),"Public page is missing its canonical Open Graph URL.");
  assert(page.includes(`<meta property="og:image" content="${imageUrl}">`),"Public page is missing its Open Graph achievement image.");
  assert(page.includes(`<meta property="og:image:url" content="${imageUrl}">`),"Public page is missing og:image:url.");
  assert(page.includes('<meta property="og:image:width" content="1200">'),"Public page is missing the Open Graph width.");
  assert(page.includes('<meta property="og:image:height" content="630">'),"Public page is missing the Open Graph height.");
  assert(page.includes('Start learning a Filipino language free'),"Public page is missing the learn-free call to action.");
  assert(page.includes(`href="${String(appUrl).replace(/&/g,"&amp;")}"`) || page.includes(`href="${appUrl}"`),"Public page does not link to the Salita Quest destination.");
  assert(!/Learner Login/i.test(page),"Public achievement page incorrectly exposes the Learner Login preview.");

  await fetchPng(imageUrl,1200,630,"Facebook Open Graph image",FACEBOOK_USER_AGENT);
  await fetchPng(squareImageUrl,1080,1080,"Square achievement image");

  console.log(JSON.stringify({
    status:"PASS",
    facebookCrawlerVerified:true,
    visibleLinkFallbackRequired:true,
    serviceUrl,
    version:health.version,
    bucketConfigured:health.bucketConfigured,
    supportedTypes:health.supportedTypes,
    shareUrl:String(shareUrl),
    imageUrl:String(imageUrl),
    appUrl:String(appUrl)
  },null,2));
}

main().catch(error => {
  console.error(`Hosted sharing verification failed: ${error.message}`);
  process.exitCode = 1;
});