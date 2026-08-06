# TestSalita dependency map

Generated: 2026-08-06T13:07:10.926Z

- Text/code files scanned: **201**
- Statically reachable from app/workflow roots: **163**
- Not statically reachable: **38**
- Custom events mapped: **40**
- Shared globals mapped: **31**

## Important limitation

A file is not safe to remove solely because it is not statically reachable. TestSalita downloads a pinned SalitaQuest document at runtime and resolves inherited relative references locally. Runtime evidence and feature testing remain mandatory.

## Avatar-related files

- `COLLECTION_FILL_CHANGELOG.md` — reachable: **false**; incoming: none found statically
- `achievement-sharing-avatar-bridge-v1.js` — reachable: **true**; incoming: service-worker.js (worker-cache)
- `avatar-artwork-registry-v554.js` — reachable: **true**; incoming: service-worker.js (worker-cache)
- `avatar-case-desktop-safety.css` — reachable: **true**; incoming: collection-key-translation-hotfix.js (html-asset)
- `avatar-case-mobile-flow-hotfix-v1.css` — reachable: **false**; incoming: none found statically
- `avatar-case-page-tab-v1.css` — reachable: **false**; incoming: avatar-case-page-tab-v1.js (html-asset)
- `avatar-case-page-tab-v1.js` — reachable: **false**; incoming: none found statically
- `avatar-case-v1.css` — reachable: **true**; incoming: scripts/validate-avatar-case.mjs (worker-cache), scripts/validate-avatar-progression-v550.mjs (worker-cache), scripts/validate-avatar-runtime-v556.mjs (worker-cache), scripts/validate-badge-stability.mjs (worker-cache), scripts/validate-hosted-achievement-sharing.mjs (worker-cache), scripts/validate-placement-sharing.mjs (worker-cache), scripts/validate-social-posting-audio-resume.mjs (worker-cache), service-worker.js (worker-cache)
- `avatar-case-v1.js` — reachable: **true**; incoming: scripts/validate-avatar-case.mjs (worker-cache), scripts/validate-avatar-progression-v550.mjs (worker-cache), scripts/validate-avatar-runtime-v556.mjs (worker-cache), scripts/validate-badge-stability.mjs (worker-cache), scripts/validate-hosted-achievement-sharing.mjs (worker-cache), scripts/validate-placement-sharing.mjs (worker-cache), scripts/validate-social-posting-audio-resume.mjs (worker-cache), scripts/validate-stage1-popup-governance-v553.mjs (worker-cache), service-worker.js (worker-cache)
- `avatar-catalogue-v1.js` — reachable: **true**; incoming: index.html (html-asset), profile-app.js (html-asset), scripts/validate-avatar-onboarding.mjs (html-asset), service-worker.js (worker-cache)
- `avatar-collection-page-v2.css` — reachable: **true**; incoming: collection-key-translation-hotfix.js (html-asset)
- `avatar-collection-page-v2.js` — reachable: **false**; incoming: none found statically
- `avatar-collection-rarity-fill-v1.css` — reachable: **false**; incoming: none found statically
- `avatar-collection-screen-v1.css` — reachable: **true**; incoming: scripts/validate-avatar-case.mjs (worker-cache), service-worker.js (worker-cache)
- `avatar-collection-screen-v1.js` — reachable: **true**; incoming: service-worker.js (worker-cache)
- `avatar-collection-summary-v1.css` — reachable: **false**; incoming: none found statically
- `avatar-collection-summary-v1.js` — reachable: **false**; incoming: none found statically
- `avatar-collection-tabs-phase6-1-v1.css` — reachable: **false**; incoming: none found statically
- `avatar-collection-tabs-phase6-1-v1.js` — reachable: **false**; incoming: none found statically
- `avatar-progression-hotfix-v551.css` — reachable: **true**; incoming: service-worker.js (worker-cache)
- `avatar-progression-hotfix-v551.js` — reachable: **true**; incoming: service-worker.js (worker-cache)
- `avatar-progression-migration-v1.js` — reachable: **true**; incoming: service-worker.js (worker-cache)
- `avatar-unlock-celebration-v1.css` — reachable: **true**; incoming: service-worker.js (worker-cache)
- `avatar-unlock-celebration-v1.js` — reachable: **true**; incoming: scripts/validate-stage1-popup-governance-v553.mjs (worker-cache), service-worker.js (worker-cache)
- `avatars/canonical/manifest.json` — reachable: **true**; incoming: service-worker.js (worker-cache)
- `coin-avatar-reveal-rarity-v1.css` — reachable: **false**; incoming: none found statically
- `coin-avatar-shard-shop-v1.css` — reachable: **false**; incoming: none found statically
- `coin-avatar-shard-shop-v1.js` — reachable: **false**; incoming: none found statically
- `coin-avatar-shop-badges-v1.js` — reachable: **false**; incoming: none found statically
- `coin-avatar-shop-reveal-v1.css` — reachable: **false**; incoming: coin-avatar-shard-shop-v1.js (html-asset)
- `coin-avatar-shop-reveal-v1.js` — reachable: **false**; incoming: coin-avatar-shard-shop-v1.js (html-asset)
- `coin-avatar-shop-topbar-v1.css` — reachable: **false**; incoming: none found statically
- `coin-avatar-shop-topbar-v1.js` — reachable: **false**; incoming: none found statically
- `collection-key-translation-hotfix.js` — reachable: **true**; incoming: app.html (html-asset)
- `home-reward-coordinator.js` — reachable: **true**; incoming: app.html (html-asset), bisaya.html (html-asset), scripts/validate-audio-badge-release.mjs (worker-cache), service-worker.js (worker-cache)
- `level-avatar-rewards-v1.js` — reachable: **true**; incoming: scripts/validate-stage1-popup-governance-v553.mjs (worker-cache), service-worker.js (worker-cache)
- `scripts/validate-avatar-case.mjs` — reachable: **false**; incoming: none found statically
- `scripts/validate-avatar-catalogue.mjs` — reachable: **false**; incoming: none found statically
- `scripts/validate-avatar-collection-screen.mjs` — reachable: **false**; incoming: none found statically
- `scripts/validate-avatar-hotfix-v551.mjs` — reachable: **false**; incoming: none found statically
- `scripts/validate-avatar-onboarding.mjs` — reachable: **false**; incoming: none found statically
- `scripts/validate-avatar-progression-v550.mjs` — reachable: **false**; incoming: none found statically
- `scripts/validate-avatar-runtime-v556.mjs` — reachable: **false**; incoming: none found statically
- `scripts/validate-avatar-unlock-sharing.mjs` — reachable: **false**; incoming: none found statically
- `scripts/validate-canonical-avatar-mapping.mjs` — reachable: **false**; incoming: none found statically
- `scripts/validate-level-avatar-rewards.mjs` — reachable: **false**; incoming: none found statically
- `scripts/validate-weekly-avatar-shards.mjs` — reachable: **false**; incoming: none found statically
- `weekly-avatar-chest.css` — reachable: **true**; incoming: app.html (html-asset), bisaya.html (html-asset), scripts/validate-home-dashboard.mjs (worker-cache), service-worker.js (worker-cache)
- `weekly-avatar-chest.js` — reachable: **true**; incoming: app.html (html-asset), bisaya.html (html-asset), service-worker.js (worker-cache)
- `weekly-avatar-polish.js` — reachable: **true**; incoming: app.html (html-asset), bisaya.html (html-asset), scripts/validate-home-dashboard.mjs (worker-cache), service-worker.js (worker-cache)
- `weekly-avatar-shard-rewards-v1.css` — reachable: **true**; incoming: service-worker.js (worker-cache), weekly-avatar-shard-rewards-v1.js (html-asset)
- `weekly-avatar-shard-rewards-v1.js` — reachable: **true**; incoming: service-worker.js (worker-cache)

## Custom avatar events

- `salita:avatar-case-changed` — dispatch: avatar-case-v1.js; listen: avatar-case-page-tab-v1.js
- `salita:avatar-case-ready` — dispatch: avatar-case-v1.js; listen: avatar-case-page-tab-v1.js
- `salita:avatar-collection-changed` — dispatch: avatar-collection-page-v2.js, avatar-collection-screen-v1.js, coin-avatar-shard-shop-v1.js, coin-avatar-shop-reveal-v1.js, level-avatar-rewards-v1.js, weekly-avatar-shard-rewards-v1.js; listen: achievement-sharing-avatar-bridge-v1.js, achievement-sharing-v4.js, avatar-artwork-registry-v554.js, avatar-case-v1.js, avatar-collection-page-v2.js, avatar-collection-screen-v1.js, avatar-collection-summary-v1.js, avatar-unlock-celebration-v1.js, weekly-avatar-shard-rewards-v1.js
- `salita:avatar-collection-tabs-ready` — dispatch: avatar-collection-tabs-phase6-1-v1.js; listen: none
- `salita:avatar-equipped` — dispatch: avatar-collection-page-v2.js, avatar-collection-screen-v1.js, profile-app.js; listen: avatar-artwork-registry-v554.js, avatar-collection-page-v2.js, desktop-navigation-refinement.js, profile-emblem-control.js, weekly-avatar-shard-rewards-v1.js
- `salita:avatar-milestones-awarded` — dispatch: level-avatar-rewards-v1.js; listen: avatar-unlock-celebration-v1.js
- `salita:avatar-milestones-repaired` — dispatch: level-avatar-rewards-v1.js; listen: none
- `salita:avatar-model-hotfixed` — dispatch: avatar-progression-hotfix-v551.js; listen: none
- `salita:avatar-progression-migrated` — dispatch: avatar-progression-migration-v1.js; listen: none
- `salita:avatar-progression-ready` — dispatch: profile-emblem-control.js; listen: avatar-case-v1.js, avatar-collection-summary-v1.js, desktop-navigation-refinement.js
- `salita:avatar-random-pools-ready` — dispatch: coin-avatar-shop-reveal-v1.js; listen: avatar-collection-summary-v1.js
- `salita:avatar-sharing-bridge-ready` — dispatch: achievement-sharing-avatar-bridge-v1.js; listen: none
- `salita:avatar-unlock-acknowledged` — dispatch: avatar-unlock-celebration-v1.js; listen: none
- `salita:avatar-unlock-animation-finished` — dispatch: avatar-unlock-celebration-v1.js; listen: none
- `salita:avatar-unlock-animation-started` — dispatch: avatar-unlock-celebration-v1.js; listen: achievement-sharing-v4.js
- `salita:coin-avatar-shop-ready` — dispatch: coin-avatar-shard-shop-v1.js; listen: none
- `salita:coin-balance-changed` — dispatch: coin-avatar-shard-shop-v1.js, coin-avatar-shop-reveal-v1.js; listen: none
- `salita:coin-shard-pack-purchased` — dispatch: coin-avatar-shard-shop-v1.js, coin-avatar-shop-reveal-v1.js; listen: coin-avatar-shop-reveal-v1.js, coin-avatar-shop-topbar-v1.js, mystery-rarity-roll-v1.js
- `salita:coin-shop-badges-ready` — dispatch: coin-avatar-shop-badges-v1.js; listen: none
- `salita:open-avatar-collection` — dispatch: avatar-progression-hotfix-v551.js, avatar-unlock-celebration-v1.js, desktop-navigation-refinement.js, weekly-avatar-shard-rewards-v1.js; listen: avatar-case-v1.js, avatar-collection-page-v2.js, avatar-collection-screen-v1.js, avatar-collection-summary-v1.js
