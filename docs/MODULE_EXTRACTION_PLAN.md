# Module Extraction Plan

## Objective

The contract inventory establishes the compatibility surface that must remain stable while Salita Quest moves from root-level browser scripts to explicit feature modules. Physical relocation should now proceed incrementally rather than through a repository-wide move.

## Evidence from the inventory

The current application contains 58 discovered runtime files connected through 147 dependency edges. The scanner records 21 storage contracts and 36 Salita custom events. Seventeen feature files have sufficiently low coupling for controlled extraction, while core engine, loader, and high-coupling files should remain in place until adapters exist.

For Cebuano, `bisaya-app-loader.js` is the executed loader and `app.js` is a fetched, transformed engine source. The inventory includes both because both are runtime inputs; they must not be interpreted as two directly executed initial scripts.

## First extraction: mobile level-up safety — completed on the extraction branch

The first physical move is `level-up-mobile-safety-v552.js` because it is loaded by both courses, has no storage operations, no direct shared-engine dependencies, and a low static coupling score.

Target structure:

```text
src/features/interface/level-up-mobile-safety-v552.js
level-up-mobile-safety-v552.js  # temporary compatibility loader
```

The first extraction pull request should:

1. Copy the implementation to the feature path without changing behavior.
2. Convert the root file into a minimal ordered compatibility loader.
3. Point current course manifests and mobile refresh directly to the feature path while retaining the versioned root compatibility URL for older cached documents.
4. Add the new feature path to the service-worker cache.
5. Extend validators to confirm that the compatibility loader loads exactly one implementation and does not duplicate event listeners.
6. Run all Tagalog, Bisaya, avatar, economy, navigation, and installed-app validation suites.

The compatibility loader remains for the r54 cache release. Current manifests already use the feature path; a later pull request can remove the root shim after older installed clients have crossed this boundary.

## Subsequent low-coupling sequence

After the first move is verified, the next candidates should be extracted separately or in narrowly related families:

1. `pronunciation-release-control.js` — completed as `src/features/audio/pronunciation-release-control.js`, with the root compatibility URL retained through r55.
2. `clean-topbar.js` and `compact-desktop-layout.js` — completed as separate modules under `src/features/interface/`, with both root compatibility URLs retained through r56.
3. `even-progress-rail.js` — completed as `src/features/progression/even-progress-rail.js`, with the root compatibility URL retained through r57.
4. `avatar-catalogue-v1.js` and `avatar-progression-migration-v1.js` — completed as paired modules under `src/features/avatar/`, with both root compatibility URLs retained through r58.
5. `avatar-artwork-registry-v554.js` — completed as `src/features/avatar/avatar-artwork-registry-v554.js`, with the root compatibility URL retained through r59.
6. `achievement-sharing-router-v3.js` — completed as `src/features/sharing/achievement-sharing-router-v3.js`, with the v2 entry loader and root v3 compatibility URL retained through r60.

These rankings are migration guidance rather than proof of independence. Static analysis cannot fully resolve computed DOM selectors, dynamically constructed storage keys, or runtime mutation timing. Each proposed move therefore still requires targeted browser validation.

## Files that should not move yet

`app.js`, `profile-app.js`, `profile-emblem-control.js`, `bisaya-app-loader.js`, and `src/app/course-bootstrap.js` are structural owners or loaders. `bisaya-review-regions.js`, `exercise-fixes-v545.js`, `daily-goal-refinement.js`, `adaptive-scenarios.js`, `badge-catalogue-v2.js`, `key-run-refinement.js`, and `ui-quality-fixes.js` have substantial direct coupling to the shared engine or DOM.

Before extracting these files, introduce an explicit engine adapter that owns access to learner state, persistence, navigation, rendering, exercises, audio, and popup coordination. The adapter should expose documented methods rather than reproducing the current browser-global surface.

## Non-negotiable compatibility rules

- Do not rename or reinterpret storage keys during a file move.
- Do not change custom-event names or payload semantics.
- Preserve DOM IDs and selectors until callers have migrated to an explicit component interface.
- Preserve script execution order unless a validator proves the new dependency model.
- Keep one implementation owner for each feature; compatibility loaders must not install duplicate listeners.
- Do not combine physical relocation with feature redesign.
- Keep the original repository backup and the modular-bootstrap rollback point available throughout the migration.

7. `home-reward-coordinator.js` — completed as `src/features/progression/home-reward-coordinator.js`, with the root compatibility URL retained through r61.

8. `facebook-share-link-v1.js` — completed as `src/features/sharing/facebook-share-link-v1.js`, with the root compatibility URL retained through r62.

9. `economy-tracking-phase6-v1.js` — completed as `src/features/economy/economy-tracking-phase6-v1.js`, with the root compatibility URL retained through r63.

10. `avatar-collection-tabs-phase6-1-v1.js` — completed as `src/features/avatar/avatar-collection-tabs-phase6-1-v1.js`, with the root compatibility URL retained through r64.

11. `avatar-collection-summary-v1.js` — completed as `src/features/avatar/avatar-collection-summary-v1.js`, with the root compatibility URL retained through r65.

12. `collection-key-translation-hotfix.js` — completed as `src/features/interface/collection-key-translation-hotfix.js`, with the root compatibility URL retained through r66.

13. `popup-governor-v1.js` — completed as `src/features/interface/popup-governor-v1.js`, with the root compatibility URL retained through r67.

14. `level-avatar-rewards-v1.js` — completed as `src/features/avatar/level-avatar-rewards-v1.js`, with the root compatibility URL retained through r68.

15. `avatar-progression-hotfix-v551.js` — split into `src/features/avatar/avatar-progression-model-v551.js` and `src/adapters/navigation/avatar-collections-navigation-v551.js`; the root file remains an ordered readiness coordinator through r69.

16. `coin-avatar-shop-badges-v1.js` — adapter-led split into `src/adapters/badges/coin-shop-badge-runtime-v1.js` and `src/features/economy/coin-avatar-shop-badges-v1.js`; the historical root remains the ordered compatibility coordinator through r70.

17. `incorrect-order-feedback.js` — adapter-led split into `src/adapters/exercise/incorrect-order-feedback-runtime-v1.js` and `src/features/exercise/incorrect-order-feedback.js`; the historical root remains the ordered compatibility coordinator through r71.

18. `long-term-badges-v1.js` — adapter-led split into `src/adapters/badges/badge-catalogue-runtime-v1.js` and `src/features/badges/long-term-badges-v1.js`; the historical root remains the ordered compatibility coordinator through r72.

19. `avatar-case-v1.js` — adapter-led split into `src/adapters/avatar/avatar-case-profile-runtime-v1.js` and `src/features/avatar/avatar-case-v1.js`; the historical root remains the ordered compatibility coordinator through r73.
