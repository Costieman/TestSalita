#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const REQUIRE_ASSETS = process.argv.includes('--require-assets');
const MANIFEST_PATH = path.join(ROOT, 'avatars/canonical/manifest.json');
const INVENTORY_PATH = path.join(ROOT, 'docs/avatar-source-inventory.csv');
const ID_MAP_PATH = path.join(ROOT, 'docs/avatar-canonical-id-map.csv');
const EXPECTED_COUNT = 48;

const errors = [];
const warnings = [];
const checks = [];

function check(condition, message) {
  checks.push({ message, passed: Boolean(condition) });
  if (!condition) errors.push(message);
}

function warn(condition, message) {
  if (!condition) warnings.push(message);
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/);
  if (!lines.length) return [];
  const headers = lines[0].split(',');
  return lines.slice(1).filter(Boolean).map((line) => {
    const values = line.split(',');
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

function duplicates(values) {
  const seen = new Set();
  const repeated = new Set();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated];
}

function readPngDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(signature)) {
    throw new Error('not a valid PNG signature');
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

for (const requiredPath of [MANIFEST_PATH, INVENTORY_PATH, ID_MAP_PATH]) {
  check(fs.existsSync(requiredPath), `Required mapping file exists: ${path.relative(ROOT, requiredPath)}`);
}

if (errors.length) {
  console.error(JSON.stringify({ status: 'FAIL', errors, warnings, checks }, null, 2));
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
const inventory = parseCsv(fs.readFileSync(INVENTORY_PATH, 'utf8'));
const idMap = parseCsv(fs.readFileSync(ID_MAP_PATH, 'utf8'));
const avatars = Array.isArray(manifest.avatars) ? manifest.avatars : [];
const aliases = manifest.aliases && typeof manifest.aliases === 'object' ? manifest.aliases : {};
const policy = manifest.canonicalImagePolicy || {};

check(manifest.sourceArchive?.fileCount === EXPECTED_COUNT, `Manifest source archive declares ${EXPECTED_COUNT} files`);
check(inventory.length === EXPECTED_COUNT, `Source inventory contains exactly ${EXPECTED_COUNT} rows`);
check(idMap.length === EXPECTED_COUNT, `Canonical ID map contains exactly ${EXPECTED_COUNT} rows`);
check(avatars.length === EXPECTED_COUNT, `Manifest contains exactly ${EXPECTED_COUNT} avatar records`);

const fields = {
  ids: avatars.map((item) => item.id),
  orders: avatars.map((item) => item.order),
  sourcePaths: avatars.map((item) => item.sourceArchivePath),
  sourceFilenames: avatars.map((item) => item.sourceFilename),
  sourceHashes: avatars.map((item) => item.sourceSha256),
  canonicalFilenames: avatars.map((item) => item.canonicalFilename),
  canonicalPaths: avatars.map((item) => item.canonicalPath),
};

for (const [label, values] of Object.entries(fields)) {
  check(duplicates(values).length === 0, `No duplicate ${label}`);
  check(values.every((value) => value !== null && value !== undefined && value !== ''), `No blank ${label}`);
}

check(
  avatars.every((item, index) => item.order === index),
  'Avatar order is contiguous from 0 through 47',
);
check(
  avatars.every((item) => item.canonicalFilename === `${item.id}.png`),
  'Every canonical filename is ID-based and ends in .png',
);
check(
  avatars.every((item) => item.canonicalPath === `avatars/canonical/${item.id}.png`),
  'Every canonical path is inside avatars/canonical/',
);
check(
  avatars.every((item) => Number(item.sourceWidth) >= 512 && Number(item.sourceHeight) >= 512),
  'Every source master is at least 512 × 512',
);
check(policy.format === 'PNG', 'Canonical image policy requires PNG');
check(Number(policy.minimumWidth) >= 512, 'Canonical minimum width is at least 512 pixels');
check(Number(policy.minimumHeight) >= 512, 'Canonical minimum height is at least 512 pixels');
check(policy.preserveTransparency === true, 'Canonical image policy preserves transparency');
check(policy.upscalingAllowed === false, 'Canonical image policy forbids upscaling');

const inventoryByPath = new Map(inventory.map((row) => [row.archive_path, row]));
const mappedSourcePaths = new Set();
for (const avatar of avatars) {
  const row = inventoryByPath.get(avatar.sourceArchivePath);
  check(Boolean(row), `Inventory contains source for ${avatar.id}: ${avatar.sourceArchivePath}`);
  if (!row) continue;
  mappedSourcePaths.add(avatar.sourceArchivePath);
  check(row.filename === avatar.sourceFilename, `Source filename matches inventory for ${avatar.id}`);
  check(row.sha256 === avatar.sourceSha256, `Source SHA-256 matches inventory for ${avatar.id}`);
  check(Number(row.width_px) === Number(avatar.sourceWidth), `Source width matches inventory for ${avatar.id}`);
  check(Number(row.height_px) === Number(avatar.sourceHeight), `Source height matches inventory for ${avatar.id}`);
  check(row.format === 'PNG', `Source format is PNG for ${avatar.id}`);
  check(row.has_alpha_channel === 'true', `Source has alpha channel for ${avatar.id}`);
}

check(mappedSourcePaths.size === EXPECTED_COUNT, 'Every inventory source is mapped exactly once');
check(
  inventory.every((row) => mappedSourcePaths.has(row.archive_path)),
  'No source inventory row is orphaned',
);

const manifestById = new Map(avatars.map((avatar) => [avatar.id, avatar]));
for (const row of idMap) {
  const avatar = manifestById.get(row.id);
  check(Boolean(avatar), `ID map record exists in manifest: ${row.id}`);
  if (!avatar) continue;
  for (const field of ['name', 'category', 'rarity', 'unlockSource', 'sourceArchivePath', 'sourceFilename', 'sourceSha256', 'canonicalFilename', 'canonicalPath']) {
    check(String(avatar[field] ?? '') === String(row[field] ?? ''), `ID map ${field} matches manifest for ${row.id}`);
  }
  check(String(avatar.levelReward ?? '') === String(row.levelReward ?? ''), `ID map levelReward matches manifest for ${row.id}`);
  check(String(avatar.shardRequirement ?? '') === String(row.shardRequirement ?? ''), `ID map shardRequirement matches manifest for ${row.id}`);
}

const validIds = new Set(fields.ids);
check(
  Object.values(aliases).every((target) => validIds.has(target)),
  'Every historical alias resolves to a canonical stable ID',
);
check(
  Object.keys(aliases).every((alias) => !validIds.has(alias) || aliases[alias] === alias),
  'Aliases do not replace an existing canonical identity',
);
check(
  Array.isArray(manifest.starterIds) && manifest.starterIds.join(',') === 'anahaw,orchid,jade,rafflesia',
  'Starter avatar identity set is unchanged',
);

const assetResults = [];
for (const avatar of avatars) {
  const assetPath = path.join(ROOT, avatar.canonicalPath);
  if (!fs.existsSync(assetPath)) {
    assetResults.push({ id: avatar.id, present: false });
    continue;
  }
  try {
    const dimensions = readPngDimensions(assetPath);
    assetResults.push({ id: avatar.id, present: true, ...dimensions });
    check(dimensions.width >= policy.minimumWidth, `${avatar.id} canonical width is at least ${policy.minimumWidth}px`);
    check(dimensions.height >= policy.minimumHeight, `${avatar.id} canonical height is at least ${policy.minimumHeight}px`);
  } catch (error) {
    assetResults.push({ id: avatar.id, present: true, error: error.message });
    errors.push(`${avatar.id} canonical asset is invalid: ${error.message}`);
  }
}

const presentAssets = assetResults.filter((item) => item.present).length;
if (REQUIRE_ASSETS) {
  check(presentAssets === EXPECTED_COUNT, `All ${EXPECTED_COUNT} canonical assets are present`);
} else {
  warn(presentAssets === 0, `${presentAssets} canonical assets are already present; mapping-only mode expected none before upload`);
}

const report = {
  status: errors.length ? 'FAIL' : 'PASS',
  stage: REQUIRE_ASSETS ? 'mapping-and-assets' : 'mapping-only',
  expectedAvatarCount: EXPECTED_COUNT,
  manifestAvatarCount: avatars.length,
  sourceInventoryCount: inventory.length,
  uniqueStableIds: new Set(fields.ids).size,
  uniqueSourceHashes: new Set(fields.sourceHashes).size,
  uniqueCanonicalPaths: new Set(fields.canonicalPaths).size,
  aliasCount: Object.keys(aliases).length,
  sourceMinimumDimensions: {
    width: Math.min(...avatars.map((item) => Number(item.sourceWidth))),
    height: Math.min(...avatars.map((item) => Number(item.sourceHeight))),
  },
  canonicalImagePolicy: policy,
  canonicalAssetsPresent: presentAssets,
  canonicalAssetRequirementApplied: REQUIRE_ASSETS,
  errors,
  warnings,
  checksPassed: checks.filter((item) => item.passed).length,
  checksFailed: checks.filter((item) => !item.passed).length,
};

console.log(JSON.stringify(report, null, 2));
process.exit(errors.length ? 1 : 0);
