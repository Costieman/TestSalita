# Salita Quest code audit — 30 July 2026

## Scope

This audit focused first on the reported learner-facing failures around Badge Chest editing and individual badge sharing, then reviewed the surrounding loading, event, offline and social-sharing architecture for duplicated ownership and avoidable complexity.

The review was a static architecture and behavior-boundary audit of the repository. Release validation now includes a deterministic Badge Chest state harness, but the project does not yet have full browser automation. That limitation is recorded below rather than hidden.

## Failures found and corrected in release 5.4.29

### 1. Self-triggering Badge Chest observer

The original `badge-sharing-v1.js` watched the complete badge shelf with a `MutationObserver`. Its callback rewrote every `.badge-card-share-actions` element with `innerHTML`, which created another shelf mutation and scheduled the callback again. This could keep the shelf in a render loop and made add, remove and share controls unreliable.

**Correction:** `badge-chest-v2.js` has no shelf observer. The catalogue emits one explicit `salita:badges-rendered` event after a completed render, and the chest controller decorates the finished cards idempotently.

### 2. Three modules competing for the same sharing controls

The active build loaded all of the following:

- `badge-sharing-v1.js`;
- `social-posting-v2.js`;
- `achievement-sharing-v3.js`.

All three could react to `[data-share-badge]`, two created or reused the same social modal, and each kept separate internal share state. Correctness depended on capture phase, load order and `stopImmediatePropagation()` rather than a clear owner.

**Correction:** `achievement-sharing-v4.js` is the sole owner of individual badge, Badge Chest and level-up sharing. It uses one uniquely named modal and one state object. The obsolete handlers are no longer loaded or cached.

### 3. Badge Chest was silently filled and then appeared locked

The old chest controller automatically filled all six slots with the newest earned badges on first run. Once full, every other badge displayed **Chest full**, so learners could not understand how to replace one.

**Correction:** existing selections are preserved, but an unconfigured chest is no longer silently filled. A visible **Choose badges** editor lets learners select, clear and replace up to six earned badges before saving.

### 4. No clear replacement workflow

Small arrow and remove buttons were the only practical way to alter the chest. Empty slots were passive and badge cards were the only place to add another badge.

**Correction:** empty slots and the header open the same explicit picker. Add/remove controls on individual earned badge cards remain available for quick changes, while the picker is the primary replacement workflow.

### 5. Redundant local social-profile panel

`social-links-v1.js` stored optional Facebook, Instagram, TikTok, X, YouTube and LinkedIn profile URLs. It did not connect accounts or publish posts, and its wording overlapped with the actual sharing-service screen.

**Correction:** the module is removed from the active loaders and offline cache. `social-connections-v2.js` remains the service-status and future OAuth boundary.

### 6. Offline cache retained superseded runtimes

The service worker cached all old badge and sharing modules even after newer compatibility layers were added. An installed app could therefore continue to serve inactive or conflicting files.

**Correction:** cache `salita-quest-v5-4-badge-stability-r42` includes only the active Badge Chest and achievement-sharing modules.

## Ownership after consolidation

| Area | Owner | Responsibility |
|---|---|---|
| Badge definitions and earned status | `badge-catalogue-v2.js` | Badge catalogue, metrics, earned timestamps and one render-complete event |
| Badge Chest | `badge-chest-v2.js` | Selected IDs, six-slot limit, picker, add/remove/reorder and persistence |
| Achievement cards and destinations | `achievement-sharing-v4.js` | Badge, chest and level card rendering; hosted preview; platform hand-off |
| Sharing-service status and future OAuth | `social-connections-v2.js` | Built-in API URL, health status and provider-connection boundary |
| Hosted Open Graph pages | `services/social-share/` | Store square/OG images and expose public crawler-readable share pages |

No active module should intercept another module's learner control. Communication now uses explicit APIs and events.

## Code removed from the active build

The following legacy files are superseded and are deleted in this release:

- `badge-sharing-v1.js` and `badge-sharing-v1.css`;
- `social-posting-v2.js` and `social-posting-v2.css`;
- `achievement-sharing-v3.js` and `achievement-sharing-v3.css`;
- `social-links-v1.js` and `social-links-v1.css`.

Their behavior is either consolidated into v2/v4 modules or intentionally removed because it did not provide real account connection.

## Deferred structural risks

These require separate releases because changing them together with the Badge Chest repair would increase regression risk.

### A. Pinned source document plus string injection

`app.html` and `bisaya.html` fetch a historical raw `index.html` commit, then inject many styles and scripts with string replacements. This makes the active application difficult to understand from any one file, and a small source-format change can break injection.

**Recommended next step:** create a maintained application shell in the repository and load course data into it directly. Retire the pinned raw-document fetch after parity tests.

### B. Global function wrapping

Many modules replace globals such as `switchView`, `renderBadges`, `updateGlobalUI`, `recordDailyAnswer` and `recordDailySession`. Behavior depends on installation order and every wrapper correctly forwarding arguments and return values.

**Recommended next step:** introduce a small event bus and stable domain APIs. Modules should subscribe to events rather than replace one another's functions.

### C. Release versions are scattered

Version strings are duplicated across loaders, the profile gate, the service worker and multiple validators. Most CI failures in recent releases were stale version assertions rather than functional regressions.

**Recommended next step:** add one release manifest used by loaders and validation scripts.

### D. Patch-style CSS accumulation

The application loads multiple generations of corrective styles, often with `!important`. This makes layout ownership and cascade order difficult to reason about.

**Recommended next step:** consolidate styles by feature after screenshot and responsive parity tests, starting with Badges and Settings.

### E. No full browser interaction suite

Static marker tests can confirm ownership and syntax but cannot prove that a real click, modal, canvas, service worker and social popup work together in Chrome, Edge and mobile browsers.

**Recommended next step:** add Playwright smoke tests for:

1. opening Badges;
2. choosing and replacing chest badges;
3. reloading and confirming persistence;
4. opening an individual badge share card;
5. opening the Badge Chest share card;
6. completing a synthetic level-up and seeing the optional prompt;
7. mobile navigation and picker behavior.

## Release validation added now

`scripts/validate-badge-stability.mjs` checks:

- JavaScript syntax for both new controllers;
- no Badge Chest `MutationObserver`;
- no silent six-badge auto-fill;
- preservation, duplicate removal, earned-only filtering and six-slot limiting in a deterministic VM harness;
- one active badge/chest/level sharing owner;
- correct loader order in Tagalog and Bisaya;
- absence of obsolete modules from loaders and offline cache;
- the current profile-gate and service-worker release.

## Suggested cleanup sequence

1. Merge and manually smoke-test release 5.4.29.
2. Add browser automation before another broad feature release.
3. Replace the pinned-document loader with a maintained shell.
4. Convert global wrappers to events/domain APIs feature by feature.
5. Introduce a central release manifest.
6. Consolidate CSS only after visual regression coverage exists.

This sequence prioritizes learner reliability over deleting code quickly. Code is removed when ownership and parity are demonstrated, not merely because it appears old.
