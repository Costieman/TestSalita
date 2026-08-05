# TestSalita — isolated functional audit

This repository is a runnable sandbox of the Salita Quest modular refactor.

- Source repository: `Costieman/SalitaQuest`
- Source pull request: `#114`
- Exact source commit: `2793bc413bfe655cbb695a3323140a13810c44fa`
- Live repository changed: **No**
- Live deployment changed: **No**

## Test links

After GitHub Pages deploys:

- App: `https://costieman.github.io/TestSalita/`
- Audit checklist: `https://costieman.github.io/TestSalita/sandbox-audit.html`

## Isolation controls

- Local and session storage keys are prefixed with `__testsalita_v1__:`.
- Cache Storage names begin with `test-salita-sandbox-`.
- The sandbox service worker cannot read or delete live-app caches.
- The mobile refresh page cannot delete live caches or unregister live service workers.
- Every entry page displays a **TESTSANDBOX** banner and the exact source commit.
- The reset button deletes only sandbox profiles, progress, service workers and caches.
- Browser errors are captured and shown in the functional audit checklist.

## What to test

Use the audit checklist to record profiles, both language courses, lessons, feedback, audio, progression, Avatar Collection, Avatar Case, shop, badges, desktop/mobile navigation, refresh persistence and offline behavior.

Do not use this repository as the production source.
