# Salita Quest

Salita Quest is a local-first language-learning app for **Tagalog** and **Cebuano / Bisaya**. It combines active recall, spaced repetition, structured mastery, short daily practice, audio review, learner profiles, progression rewards and offline installation.

Current release: **5.5.10 — Persistent Navigation**.

## Core learning system

- Stable item IDs preserve learner progress between releases.
- Phrase mastery progresses through Seen, Familiar, Usable, Flexible and Mastered.
- Long-term mastery grows after successful delayed recall.
- Daily Sessions combine due review, familiar material and limited new content.
- Quick Review uses encountered material only.
- Sentence builders reveal the correct order after submission.
- Adaptive scenarios draw from material the learner has already encountered.
- Tagalog and Cebuano progress remain separate within each learner profile.

## Learner profiles and progress

Salita Quest supports multiple local learner profiles. Each profile stores:

- Tagalog and Cebuano course progress;
- mastery, due dates and item history;
- XP, coins and streaks;
- placement and access settings;
- account-wide avatar ownership, shards, weekly keys, equipped identity and Avatar Case.

Progress can be moved through JSON backup/import and transfer codes. The profile lock is local rather than server-authenticated, so progress remains tied to the browser origin and device unless exported.

## Placement and access

New learners can begin as complete beginners or estimate a level before taking a 20-question placement check. Placement changes **content access only**. It does not award XP, manufacture mastery or mark unseen material as learned. Earlier regions remain available, and existing learners keep their progress.

## Avatar collection

The app contains **48 canonical 512 × 512 PNG avatars** under `avatars/canonical/`.

- One manifest and one stable catalogue define all avatar identities.
- Historical aliases resolve to the same stable IDs.
- The collection is shared by Tagalog and Bisaya.
- Four flora avatars are available as starter choices.
- Daily Keys contribute to learner-selected weekly shard rewards.
- Levels 10–90 grant selected Common and Uncommon avatars.
- Level 99 grants the Golden Salita Crest.
- Locked avatars reveal colour as shard progress increases.
- Owned avatars can be equipped at any time.
- A separate four-slot Avatar Case displays favourite owned avatars without changing the equipped avatar.
- Avatar Case entries can be reordered, removed and shared as one collection card.

The runtime uses direct canonical PNG paths. It does not extract sprites, redraw avatar art through canvas, rewrite image sources globally or fall back to raw GitHub artwork.

## Badges

Badges have a dedicated catalogue and a six-slot Badge Chest. The catalogue shows **earned badges first, ordered newest to oldest**, followed by available and locked badges. Learners can select, order and share earned badges.

## Persistent navigation

Release 5.5.10 keeps the main routes available throughout long pages and removes the laptop-width icon-only rail.

- Desktop screens above 860 px use a fixed full-height sidebar with visible labels.
- The route list scrolls internally on short screens without moving the page.
- Badges and Avatar Collection / Avatar Case are permanent menu destinations.
- The active destination uses `aria-current="page"` and remains visible in the sidebar.
- Small-desktop layouts wrap top-bar stats, headings, controls and multi-column learning views instead of overlapping.
- Mobile keeps the fixed bottom navigation, sticky app bar and a scrollable More sheet containing Badges and Avatars.

The navigation release does not alter learner progress, rewards, ownership, mastery or profile storage.

## Hosted achievement sharing

`achievement-sharing-v4.js` is the single card and platform hand-off controller for:

- individual badges;
- the Badge Chest;
- individual owned avatars;
- newly unlocked avatars;
- the four-slot Avatar Case;
- level-up milestones and the current learner level.

It renders a 1080 × 1080 square card and a **1200 × 630 Open Graph version**. Cards include a visible **START LEARNING FREE** invitation.

The optional Cloud Run service in `services/social-share/` hosts Open Graph images and public share pages for social platforms. Deploy it with:

```bash
chmod +x services/social-share/deploy-cloud-shell.sh
./services/social-share/deploy-cloud-shell.sh
```

Hosted sharing works without connected social accounts. If the hosted service is unavailable, generated cards can still be shared through the device or downloaded, and public web composers can use the Salita Quest app link. Direct connected-account publishing would require provider applications, OAuth credentials and approved scopes.

## Audio

Pronunciation activates on **pointer release**, with keyboard activation retained and touch-generated clicks deduplicated.

Static audio is indexed through `audio/audio_manifest.json`. Release 5.5.7 connects the complete released Bisaya course to recorded audio:

- 177 unique released Cebuano spoken texts are covered;
- 176 English Hands-Free answers are covered;
- 296 Cebuano MP3 files support 356 manifest entries through safe aliases;
- 138 Bisaya-specific British-English MP3 files extend the existing English library;
- Cebuano pronunciation never falls back to Tagalog audio.

The audio manifest is precached. MP3 files use cache-first delivery after their first successful playback, including support for browser range requests, so previously played clips remain available offline.

The Cebuano generator is resumable and uses Google Cloud Gemini-TTS:

```bash
export GOOGLE_CLOUD_PROJECT="$(gcloud config get-value project)"
export GOOGLE_CLOUD_REGION="global"
python3 scripts/generate_cebuano_google_audio.py
```

The British-English generator creates only missing Bisaya Hands-Free answers and preserves existing files:

```bash
export GOOGLE_CLOUD_PROJECT="$(gcloud config get-value project)"
python3 scripts/generate_missing_bisaya_english_audio.py
```

See `docs/CEBUANO_AUDIO.md` for setup and recovery details.

## Offline installation

Salita Quest is a Progressive Web App. `service-worker.js` precaches the course engine, language packs, interface assets, the audio manifest, the Avatar Case runtime, persistent-navigation assets and all 48 canonical avatars. Audio recordings are cached on first playback rather than forcing hundreds of downloads during installation.

Current cache revision:

```text
salita-quest-v5-5-10-persistent-navigation-r52
```

The recovery page refreshes app caches and service-worker registrations without clearing learner local storage.

## Repository map

### Application entry points

- `index.html` — profile gate
- `app.html` / `app.js` — Tagalog application
- `bisaya.html` / `bisaya-app-loader.js` — Cebuano application
- `languages/cebuano/` — Cebuano course data
- `service-worker.js` — offline delivery

### Profiles, navigation and progression

- `profile-app.js` — learner profile interface
- `profile-emblem-control.js` — shared avatar runtime loader
- `desktop-navigation-refinement.js` — persistent desktop/mobile route completion and active state
- `desktop-navigation-refinement.css` — fixed sidebar, mobile navigation and small-desktop safety
- `placement-onboarding-v1.js` — placement and beginner access
- `level-progression-v2.js` — learner level system
- `popup-governor-v1.js` — queued reward and level popups

### Avatars

- `avatars/canonical/manifest.json` — canonical identity and asset manifest
- `src/features/avatar/avatar-catalogue-v1.js` — stable catalogue, aliases and rewards (`avatar-catalogue-v1.js` remains a compatibility loader)
- `avatar-collection-screen-v1.js` — collection and equip controls
- `avatar-case-v1.js` — four-slot favourite-avatar persistence, picker and ordering
- `weekly-avatar-shard-rewards-v1.js` — weekly shard rewards
- `level-avatar-rewards-v1.js` — level milestones
- `avatar-unlock-celebration-v1.js` — once-only unlock reveals
- `src/features/avatar/avatar-progression-migration-v1.js` — additive legacy migration (`avatar-progression-migration-v1.js` remains a compatibility loader)
- `achievement-sharing-avatar-bridge-v1.js` — compatibility-only delegation to the shared controller

### Badges and sharing

- `badge-catalogue-v2.js` — badge definitions and catalogue
- `badge-chest-v2.js` — Badge Chest selection and ordering
- `achievement-sharing-v4.js` — unified badge, avatar, Avatar Case and level card rendering
- `social-connections-v2.js` — sharing-service status and OAuth-ready contract
- `services/social-share/` — hosted Open Graph service

## Validation

Run the complete canonical avatar and navigation gate:

```bash
node scripts/validate-avatar-progression-v550.mjs
```

Run the focused Avatar Case and persistent-navigation harnesses directly:

```bash
node scripts/validate-avatar-case.mjs
node scripts/validate-persistent-navigation.mjs
```

Run the full application regression suite through the GitHub workflows or individually:

```bash
node scripts/validate-bisaya.mjs
node scripts/validate-ui-quality.mjs
node scripts/validate-home-dashboard.mjs
node scripts/validate-mobile-refinement.mjs
node scripts/validate-key-run-refinement.mjs
node scripts/validate-progression-scenarios-navigation.mjs
node scripts/validate-audio-badge-release.mjs
node scripts/validate-placement-sharing.mjs
node scripts/validate-social-posting-audio-resume.mjs
node scripts/validate-bisaya-audio-library.mjs
node scripts/validate-hosted-achievement-sharing.mjs
node scripts/validate-badge-stability.mjs
```

The persistent-navigation validator checks route completeness, one-controller ownership, fixed full-height desktop geometry, internal sidebar scrolling, permanent mobile access, removal of the icon-only rail and small-desktop wrapping rules. The Avatar Case validator executes profile-state behavior and checks owned-only selection, duplicate rejection, the four-slot limit, persistence, reordering, equipped-avatar independence, sharing and offline delivery. The Bisaya audio validator checks released Cebuano and English coverage, MP3 signatures, manifest paths, runtime language routing, service-worker integration and CI coverage. The canonical avatar validator checks all 48 PNG signatures, dimensions, alpha channels, manifest mappings, runtime consumers, service-worker coverage and the absence of retired sprite/source-rewrite mechanisms.

## Release history and architecture notes

- **5.5.0 — Avatar Progression** introduced the account-wide 48-avatar progression system.
- **5.5.6 — Canonical Avatar Runtime** replaced legacy artwork paths with the direct canonical asset set.
- **5.5.7 — Complete Bisaya Audio** connected complete released Cebuano and English audio coverage with offline replay caching.
- **5.5.8 — Sharing Foundation** replaced competing posting controllers with one badge, avatar and level system.
- **5.5.9 — Avatar Case** added the independent four-slot favourite-avatar showcase and sharing card.
- **5.5.10 — Persistent Navigation** added a labelled full-height computer menu, permanent mobile access and small-desktop layout safeguards.
- `docs/releases/5.5.6-canonical-avatar-runtime.md`
- `docs/releases/5.5.7-complete-bisaya-audio.md`
- `docs/releases/5.5.8-sharing-foundation.md`
- `docs/releases/5.5.9-avatar-case.md`
- `docs/releases/5.5.10-persistent-navigation.md`
- `docs/CODE_AUDIT_2026-07-30.md`
- `docs/SOCIAL_CONNECTIONS.md`
- `docs/CEBUANO_AUDIO.md`

## Privacy

The static app contains no Google Cloud credentials, provider client secrets or social access tokens. Public share cards contain only information deliberately selected for sharing. Learner course progress and PIN data remain local to the browser unless exported.
