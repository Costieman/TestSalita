# Salita Quest v5.2 — Hands-Free Review / GitHub-ready build

This package is a cleaned, repository-ready build of Salita Quest v5 Map Edition.

## Key update in this build
- The **Name Village / Introductions** symbol was simplified by removing the speech-box shape behind the people icon.
- Added a `.gitignore` file for a cleaner repository.
- Added a short GitHub upload checklist.

## Run locally
You can open `index.html` directly, or run:

```bash
python server.py
```

Then open `http://127.0.0.1:8000`.

## Progress compatibility
This build keeps the same local-first import/export workflow as v5 and remains compatible with prior Salita Quest JSON backups.


## v5.2 hands-free review
- Adds a dedicated **2-Minute Audio Review** section.
- Includes only language already started and still below mastery 5.
- Playback order is **Tagalog → 5-second active-recall gap → English answer**.
- The app prioritises due and lower-mastery items and rotates later mixes when more items are active than fit in two minutes.
- Listening does not award mastery automatically; mastery still comes from answering exercises.
- Works with browser speech on GitHub Pages. When running through the optional local `server.py` natural-voice service, Filipino playback can use that voice while English uses the browser voice.
