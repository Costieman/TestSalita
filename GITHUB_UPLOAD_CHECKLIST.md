# Salita Quest — GitHub upload checklist

## Before upload
- Confirm the app opens from `index.html` or via `server.py`.
- Export a progress backup from your current working app before replacing it.
- Do **not** commit any private API keys or `.env` files.

## Suggested repository structure
- `index.html`
- `app.js`
- `style.css`
- `icons/`
- `server.py`
- `manifest.webmanifest`
- `service-worker.js`
- documentation files

## Recommended first GitHub commit
```bash
git init
git add .
git commit -m "Initial commit: Salita Quest v5.1 GitHub-ready build"
```

## Optional next steps
- Add a repository description and screenshots.
- Enable GitHub Pages if you want a browser-hosted static version.
- Keep portable JSON import/export in the app so progress remains easy to migrate.
