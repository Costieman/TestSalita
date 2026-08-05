# Salita Quest modular architecture

## Refactor baseline

The pre-refactor repository is preserved on `backup/pre-modular-refactor-2026-08-05`, pinned to commit `1f954fec0af3e8dd3fecf699565aae94d4b0df75`.

The modular refactor is incremental. Existing learner profiles, progress, mastery, rewards, badges, economy data, course content, audio files, and offline behaviour must remain compatible throughout the migration.

## Phase 1: bootstrap boundary

The first phase removes duplicated course-startup logic from `app.html` and `bisaya.html` without moving legacy feature files.

- `src/config/course-manifest.js` owns course configuration, asset versions, and strict loading order.
- `src/app/course-bootstrap.js` owns profile validation, progress handoff, source-document retrieval, cache fallback, course transformation, and document assembly.
- `app.html` and `bisaya.html` become thin course entry points.

This phase deliberately retains the existing root-level CSS and JavaScript paths. Moving those files before their dependencies are mapped would introduce unnecessary risk because many currently communicate through browser globals and load-order side effects.

## Target modules

| Module | Responsibility | May depend on |
| --- | --- | --- |
| App shell | Entry points, routing, navigation, layout, initialization | Config, UI, data services |
| Learning content | Vocabulary, sentences, lessons, curriculum data | Shared schemas only |
| Lesson engine | Exercise selection, lesson flow, answer validation | Learning content, audio, progress |
| Audio | Recorded audio lookup, playback, TTS fallback | Config, shared utilities |
| Progress and mastery | XP, coins, streaks, mastery and persistence | Data services, shared schemas |
| Map progression | Regions, location state and unlock rules | Progress and mastery, learning content |
| Review | Standard review, hands-free review and spaced repetition | Lesson engine, audio, progress |
| Achievements | Badge families, tiers, triggers and reward presentation | Progress and mastery, UI |
| UI | Reusable components, feedback, dialogs and responsive layout | Shared utilities only |
| Data services | Storage adapters, migrations, import/export and future backend integration | Shared schemas, config |
| Config | Constants, feature flags, asset manifests and environment values | No feature module |
| Shared | Pure utilities, events, validation and schemas | No feature module |

## Dependency rules

1. A module owns its internal state and exposes a small public interface.
2. Feature modules must not read or mutate another module's private storage directly.
3. Persistent storage keys and schema migrations belong to data services.
4. Load order must be explicit; new hidden dependencies through browser globals are prohibited.
5. Shared utilities must remain domain-neutral and free of application state.
6. Course data must remain separate from lesson-engine behaviour.
7. Refactor commits should change structure or behaviour, not both, unless tests demonstrate equivalence.

## Migration sequence

1. Centralize course startup and asset order.
2. Inventory browser globals, storage keys, DOM contracts and cross-file calls.
3. Extract persistence behind a data-service interface while preserving existing keys.
4. Extract progress, mastery and reward calculations from UI rendering.
5. Separate lesson content from exercise generation and validation.
6. Consolidate UI styles and components by feature rather than by successive hotfix.
7. Move assets only after references are generated from manifests.
8. Remove compatibility shims after stored learner data has been migrated and verified.

## Compatibility constraints

During the migration, the following are treated as public contracts:

- `salitaQuestLocalProfilesV1`
- `salitaQuestActiveProfileId`
- `salitaQuestActiveCourse`
- `salitaQuestProgress`
- `salitaQuestBaseProgressOwner`
- `salitaQuestProgress.profile.*`
- the current Tagalog and Cebuano asset order
- the pinned source course document and cached-document fallbacks
- service-worker offline navigation and audio range handling

Changes to these contracts require an explicit migration and rollback procedure.
