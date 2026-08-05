# Salita Quest hosted achievement sharing

Facebook, LinkedIn, X and WhatsApp build link previews by fetching Open Graph metadata from a public URL. They cannot see a canvas or `blob:` image created only inside the learner's browser. This Cloud Run service stores the generated achievement card privately in Cloud Storage and serves a unique public page whose `og:image` is that exact card.

## What it provides

- `POST /api/share-cards` accepts a 1080×1080 square PNG and a 1200×630 Open Graph PNG.
- `GET /share/:id` serves immutable Open Graph and Twitter Card metadata.
- `GET /media/:id/og.png` serves the landscape social preview.
- `GET /media/:id/square.png` serves the square achievement card.
- Each landing page includes a **Start learning a Filipino language free** call-to-action.
- Objects are kept in a private Cloud Storage bucket and streamed by Cloud Run.

The shared service contract recognizes these achievement types:

- `badge`
- `badge_chest`
- `avatar`
- `avatar_case`
- `level_up`

Each type receives an appropriate landing-page label while preserving the title, learner name, course and campaign supplied by the browser controller. `avatar_case` is included in the service contract now so the planned four-avatar showcase can use the same system without another backend migration.

The upload endpoint restricts browser origins, validates PNG dimensions and signatures, limits image size, and applies a basic per-IP hourly limit. The deployment script adds a 365-day Cloud Storage lifecycle rule.

## Deployment boundary

Changes under `services/social-share/` do not update an already-running Cloud Run revision automatically. After merging a service change, redeploy from the repository root:

```bash
chmod +x services/social-share/deploy-cloud-shell.sh
./services/social-share/deploy-cloud-shell.sh
```

The script prints and verifies the HTTPS Cloud Run URL. The browser app uses the built-in Salita Quest service URL unless a developer override is deliberately configured.

## Platform behavior

- **Facebook / LinkedIn / X / WhatsApp:** share the unique hosted page; supported platform crawlers receive the 1200×630 card through Open Graph metadata.
- **Instagram / TikTok:** receive the actual 1080×1080 image through device sharing, or the learner can download the card.
- **Hosted service unavailable:** the generated square card remains available for device sharing and download, and web composers use the Salita Quest app link rather than failing silently.
- **Connected-account publishing:** remains a separate OAuth/provider-permission project. This service solves public card hosting and link previews without storing provider tokens.

## Health response

`GET /health` reports:

- service readiness;
- the deployed service version;
- whether the private storage bucket is configured;
- the supported achievement types.

The browser treats a missing bucket as hosted-preview unavailability and keeps local sharing fallbacks active.

## Environment variables

- `SHARE_BUCKET` — private Cloud Storage bucket.
- `PUBLIC_APP_URL` — Salita Quest invitation destination.
- `ALLOWED_ORIGINS` — comma-separated browser origins allowed to upload.
- `MAX_UPLOADS_PER_HOUR` — simple per-instance upload limit; default `30`.
