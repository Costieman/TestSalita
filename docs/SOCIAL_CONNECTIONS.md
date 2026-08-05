# Social accounts and achievement posting

Salita Quest has two separate sharing layers.

## Public platform sharing

The browser app can open user-confirmed sharing experiences without storing social credentials:

- Facebook Share Dialog
- X post composer
- LinkedIn share composer
- WhatsApp invitation
- mobile device sharing for Instagram, TikTok and other installed applications

The Salita Quest posting panel creates a 1080 × 1080 PNG preview first. The learner's selected pixel avatar is used when a custom badge illustration does not yet exist. The learner then deliberately chooses a destination.

Public composer links can share the Salita Quest referral URL and caption. A browser cannot silently attach a locally generated PNG to every desktop social website. The card can be downloaded, sent through the device share API, or uploaded through a connected provider integration.

## True connected accounts

OAuth tokens must never be stored in the static GitHub Pages app. Connected posting therefore requires a secure HTTPS service. The Settings page accepts its URL and expects this contract:

- `GET /api/social/connections?profileId=...`
- `GET /oauth/{provider}/start?profileId=...&returnOrigin=...`
- `DELETE /api/social/connections/{provider}` with `{profileId}`
- `POST /api/social/posts` with `{profileId, provider, title, caption, url, imageDataUrl, imageMime}`

The OAuth callback should close its popup after sending this message to the verified Salita Quest origin:

```js
window.opener.postMessage({
  type: "salita-social-oauth",
  ok: true,
  provider: "instagram"
}, "https://costieman.github.io");
```

The backend is responsible for encrypted token storage, refresh tokens, revocation, CSRF-safe OAuth state, verified redirect origins, rate limits and provider-specific media uploads.

## Provider boundaries

### Facebook

The public Share Dialog is user-confirmed and works without storing a Facebook access token. Meta does not provide ordinary third-party apps with permission to silently publish arbitrary posts to a person's personal Facebook timeline. Connected integrations should therefore retain a user-confirmed sharing step unless a supported Page publishing use case applies.

### Instagram

Programmatic publishing requires a supported professional Instagram account, a Meta developer application, OAuth permissions, media hosted at a URL Meta can retrieve and any required app review. Personal Instagram accounts cannot be treated as universally publishable accounts.

### TikTok

TikTok's Content Posting API requires a registered developer app, user OAuth, approved posting scopes and provider-compliant consent screens. Unaudited direct-post clients can be restricted to private visibility. Photo publishing uses hosted image URLs from a verified domain or the provider's supported upload workflow.

### LinkedIn

Member posting requires LinkedIn OAuth and the `w_member_social` permission. Image posts require registering and uploading the image asset before creating the post.

### X

The public intent composer can prefill text and a URL. Automated account posting requires an X developer project, OAuth and sufficient API access, with media upload handled through the supported media endpoints.

### Google

Google can be connected for identity or future cloud sync, but it is not a destination for badge-image social posts.

## Configuration

After deploying the secure connection service, paste its HTTPS URL under:

`Settings → Connected accounts → Connection service`

The app stores only the service URL locally. Provider access tokens and client secrets belong exclusively in the backend's secret manager.
