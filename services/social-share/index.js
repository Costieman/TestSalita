import crypto from "node:crypto";
import express from "express";
import {Storage} from "@google-cloud/storage";

const PORT = Number(process.env.PORT || 8080);
const BUCKET_NAME = String(process.env.SHARE_BUCKET || "").trim();
const APP_URL = String(process.env.PUBLIC_APP_URL || "https://costieman.github.io/SalitaQuest/").trim();
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_UPLOADS_PER_HOUR = Number(process.env.MAX_UPLOADS_PER_HOUR || 30);
const SERVICE_VERSION = "5.5.13-facebook-card-link";
const SHARE_TYPE_META = Object.freeze({
  badge: {label:"BADGE EARNED", defaultTitle:"Salita Quest badge"},
  badge_chest: {label:"BADGE CHEST", defaultTitle:"Salita Quest Badge Chest"},
  avatar: {label:"AVATAR COLLECTION", defaultTitle:"Salita Quest avatar"},
  avatar_case: {label:"AVATAR CASE", defaultTitle:"Salita Quest Avatar Case"},
  level_up: {label:"LEVEL UP", defaultTitle:"Salita Quest level milestone"}
});
const ALLOWED_ORIGINS = new Set(
  String(process.env.ALLOWED_ORIGINS || "https://costieman.github.io,http://localhost:8000,http://127.0.0.1:8000")
    .split(",")
    .map(value => value.trim().replace(/\/$/, ""))
    .filter(Boolean)
);

const storage = new Storage();
const bucket = BUCKET_NAME ? storage.bucket(BUCKET_NAME) : null;
const uploadWindows = new Map();
const app = express();

app.set("trust proxy", true);
app.disable("x-powered-by");
app.use(express.json({limit: "24mb"}));

if (!BUCKET_NAME) console.warn("SHARE_BUCKET is not configured. Uploads will return 503.");

function cleanText(value, maxLength = 180) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function safeId(value) {
  const id = String(value || "");
  return /^[A-Za-z0-9_-]{20,40}$/.test(id) ? id : "";
}

function normaliseShareType(value) {
  const type = cleanText(value, 32).toLowerCase().replace(/[^a-z0-9_]/g, "");
  return Object.hasOwn(SHARE_TYPE_META, type) ? type : "badge";
}

function originAllowed(origin) {
  if (!origin) return true;
  try {
    return ALLOWED_ORIGINS.has(new URL(origin).origin);
  } catch {
    return false;
  }
}

function requestBase(req) {
  const forwardedProto = String(req.get("x-forwarded-proto") || "").split(",")[0].trim();
  return `${forwardedProto || req.protocol || "https"}://${req.get("host")}`;
}

function appLink(campaign, id) {
  const url = new URL(APP_URL);
  url.searchParams.set("ref", campaign || "achievement-share");
  url.searchParams.set("share", id);
  return url.toString();
}

function allowUpload(req) {
  const key = String(req.ip || req.socket.remoteAddress || "unknown");
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  const recent = (uploadWindows.get(key) || []).filter(timestamp => timestamp >= hourAgo);
  if (recent.length >= MAX_UPLOADS_PER_HOUR) return false;
  recent.push(now);
  uploadWindows.set(key, recent);
  return true;
}

function decodePngDataUrl(value, fieldName, expectedWidth, expectedHeight) {
  const match = /^data:image\/png;base64,([A-Za-z0-9+/=\r\n]+)$/.exec(String(value || ""));
  if (!match) throw new Error(`${fieldName} must be a PNG data URL.`);
  const buffer = Buffer.from(match[1], "base64");
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) throw new Error(`${fieldName} is empty or too large.`);
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!buffer.subarray(0, 8).equals(signature)) throw new Error(`${fieldName} is not a valid PNG.`);
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (width !== expectedWidth || height !== expectedHeight) {
    throw new Error(`${fieldName} must be ${expectedWidth}×${expectedHeight}px.`);
  }
  return buffer;
}

async function saveObject(path, body, contentType, cacheControl = "public,max-age=31536000,immutable") {
  await bucket.file(path).save(body, {
    resumable: false,
    validation: "crc32c",
    metadata: {contentType, cacheControl}
  });
}

async function readMetadata(id) {
  const [buffer] = await bucket.file(`cards/${id}.json`).download();
  return JSON.parse(buffer.toString("utf8"));
}

app.use((req, res, next) => {
  const origin = req.get("origin") || "";
  if (origin && originAllowed(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Vary", "Origin");
    res.set("Access-Control-Allow-Credentials", "true");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Allow-Methods", "GET,HEAD,POST,OPTIONS");
  }
  if (req.method === "OPTIONS") return originAllowed(origin) ? res.sendStatus(204) : res.sendStatus(403);
  next();
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    version: SERVICE_VERSION,
    bucketConfigured: Boolean(bucket),
    supportedTypes: Object.keys(SHARE_TYPE_META)
  });
});

app.get("/robots.txt", (_req, res) => {
  res.type("text/plain").set("Cache-Control", "public,max-age=3600").send("User-agent: *\nAllow: /share/\nAllow: /media/\n");
});

app.post("/api/share-cards", async (req, res) => {
  if (!bucket) return res.status(503).json({message: "Share storage is not configured."});
  if (!originAllowed(req.get("origin") || "")) return res.status(403).json({message: "Origin not allowed."});
  if (!allowUpload(req)) return res.status(429).json({message: "Too many share cards were created from this connection. Try again later."});

  try {
    const square = decodePngDataUrl(req.body.squareImageDataUrl, "squareImageDataUrl", 1080, 1080);
    const openGraph = decodePngDataUrl(req.body.ogImageDataUrl, "ogImageDataUrl", 1200, 630);
    const id = crypto.randomBytes(18).toString("base64url");
    const type = normaliseShareType(req.body.type);
    const typeMeta = SHARE_TYPE_META[type];
    const title = cleanText(req.body.title, 100) || typeMeta.defaultTitle;
    const description = cleanText(req.body.description, 220) || "A language-learning achievement earned with Salita Quest.";
    const campaign = cleanText(req.body.campaign, 50).replace(/[^A-Za-z0-9_-]/g, "") || "achievement-share";
    const learnerName = cleanText(req.body.learnerName, 40);
    const course = cleanText(req.body.course, 40);
    const metadata = {
      id,
      type,
      shareLabel: typeMeta.label,
      title,
      description,
      learnerName,
      course,
      campaign,
      createdAt: new Date().toISOString(),
      serviceVersion: SERVICE_VERSION,
      appUrl: appLink(campaign, id)
    };

    await Promise.all([
      saveObject(`images/${id}-square.png`, square, "image/png"),
      saveObject(`images/${id}-og.png`, openGraph, "image/png"),
      saveObject(`cards/${id}.json`, JSON.stringify(metadata), "application/json")
    ]);

    const base = requestBase(req);
    return res.status(201).json({
      id,
      type,
      shareUrl: `${base}/share/${id}`,
      imageUrl: `${base}/media/${id}/og.png`,
      squareImageUrl: `${base}/media/${id}/square.png`,
      appUrl: metadata.appUrl
    });
  } catch (error) {
    console.error("Share-card upload failed", error);
    return res.status(400).json({message: error.message || "The share card could not be stored."});
  }
});

async function sendImage(req, res, headOnly = false) {
  if (!bucket) return res.sendStatus(503);
  const id = safeId(req.params.id);
  const variant = req.params.variant === "square" ? "square" : req.params.variant === "og" ? "og" : "";
  if (!id || !variant) return res.sendStatus(404);

  const file = bucket.file(`images/${id}-${variant}.png`);
  try {
    const [metadata] = await file.getMetadata();
    const headers = {
      "Content-Type": "image/png",
      "Cache-Control": "public,max-age=31536000,immutable",
      "Accept-Ranges": "bytes",
      "X-Robots-Tag": "all",
      "X-Content-Type-Options": "nosniff"
    };
    if (Number(metadata.size) > 0) headers["Content-Length"] = String(metadata.size);
    res.set(headers);
    if (headOnly) return res.status(200).end();
    const stream = file.createReadStream();
    stream.on("error", error => {
      console.error("Image read failed", error);
      if (!res.headersSent) res.sendStatus(error.code === 404 ? 404 : 500);
      else res.destroy(error);
    });
    stream.pipe(res);
  } catch (error) {
    console.error("Image metadata read failed", error);
    return res.sendStatus(error.code === 404 ? 404 : 500);
  }
}

app.head("/media/:id/:variant.png", (req, res) => sendImage(req, res, true));
app.get("/media/:id/:variant.png", (req, res) => sendImage(req, res, false));

app.get("/share/:id", async (req, res) => {
  if (!bucket) return res.sendStatus(503);
  const id = safeId(req.params.id);
  if (!id) return res.sendStatus(404);
  try {
    const metadata = await readMetadata(id);
    const base = requestBase(req);
    const canonical = `${base}/share/${id}`;
    const image = `${base}/media/${id}/og.png`;
    const square = `${base}/media/${id}/square.png`;
    const title = escapeHTML(metadata.title);
    const description = escapeHTML(metadata.description);
    const appUrl = escapeHTML(metadata.appUrl || appLink(metadata.campaign, id));
    const learnerLine = [metadata.learnerName, metadata.course].filter(Boolean).map(escapeHTML).join(" · ");
    const shareLabel = escapeHTML(metadata.shareLabel || SHARE_TYPE_META[normaliseShareType(metadata.type)].label);

    res.set({
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public,max-age=300,must-revalidate",
      "X-Robots-Tag": "all",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    });
    res.send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="index,follow,max-image-preview:large">
<title>${title} · Salita Quest</title>
<link rel="canonical" href="${canonical}">
<meta name="description" content="${description}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Salita Quest">
<meta property="og:url" content="${canonical}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${image}">
<meta property="og:image:url" content="${image}">
<meta property="og:image:secure_url" content="${image}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${title}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${image}">
<meta name="twitter:image:alt" content="${title}">
<style>
:root{color-scheme:dark;font-family:Inter,system-ui,sans-serif;background:#071427;color:#fff}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(circle at 80% 10%,#155e63 0,#071427 48%,#040b17 100%);padding:28px}.card{width:min(100%,760px);background:rgba(8,24,42,.94);border:1px solid rgba(111,211,193,.35);border-radius:28px;padding:24px;box-shadow:0 30px 90px rgba(0,0,0,.45)}img{display:block;width:100%;border-radius:20px;border:1px solid rgba(247,201,72,.45)}.copy{padding:24px 6px 6px}.eyebrow{margin:0 0 8px;color:#7ad9c8;font-weight:900;letter-spacing:.14em;font-size:12px}.meta{color:#9eb8b7;font-weight:700}.cta{display:inline-flex;margin-top:20px;padding:15px 22px;border-radius:999px;background:#f7c948;color:#10213b;text-decoration:none;font-weight:950;box-shadow:0 8px 0 #b78419}.cta:active{transform:translateY(3px);box-shadow:0 5px 0 #b78419}h1{font-size:clamp(28px,5vw,48px);margin:0 0 10px}p{line-height:1.55;color:#d5e6e3}</style>
</head>
<body><main class="card"><img src="${square}" alt="${title}"><div class="copy"><p class="eyebrow">SALITA QUEST · ${shareLabel}</p><h1>${title}</h1>${learnerLine ? `<div class="meta">${learnerLine}</div>` : ""}<p>${description}</p><a class="cta" href="${appUrl}">Start learning a Filipino language free →</a></div></main></body>
</html>`);
  } catch (error) {
    console.error("Share page read failed", error);
    res.sendStatus(error.code === 404 ? 404 : 500);
  }
});

app.get("/", (_req, res) => res.redirect(302, APP_URL));
app.listen(PORT, () => console.log(`Salita Quest social share service listening on ${PORT}`));