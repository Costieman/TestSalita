# Salita Quest v5 — Map Edition

A local-first, experiential Tagalog learning game.

## What changed

- Persistent mastery rail across the top of the app.
- Future unlocks are visible in grey; the next region is highlighted.
- Unlock progress is now permanent: mistakes can lower current mastery for review scheduling, but never remove a region you already earned.
- The learning journey is a literal illustrated map with named regions and review camps.
- Major activities use custom SVG pictograms instead of generic emoji-only controls.
- Achievement badges use a custom collectible emblem system.
- Existing v3.2 / v4.x JSON backups still import through the existing migration path.
- All storage remains local-first; no account or cloud login is required.

## Run

For the most reliable PWA/offline behaviour, run `start_app_windows.bat` on Windows or:

```bash
python server.py
```

Then open the address printed by the server.

Opening `index.html` directly also works for the core app, though install/offline caching requires HTTP.

## Progress safety

Before switching from another Salita Quest version, export a JSON backup from Settings. Import it in v5. v5 upgrades every item record with `peakMastery`, initially equal to the imported mastery level.
