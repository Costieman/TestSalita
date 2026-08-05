#!/usr/bin/env python3
"""Apply the Salita Quest v5.4 Local Learner Profiles patch."""
from pathlib import Path
import shutil
import sys

PATCH_DIR = Path(__file__).resolve().parent
ROOT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.cwd()

required = ["index.html", "app.js", "style.css", "service-worker.js"]
missing = [name for name in required if not (ROOT / name).exists()]
if missing:
    raise SystemExit(f"Not a Salita Quest project directory; missing: {', '.join(missing)}")

backup = ROOT / "pre-v5.4-login-backup"
backup.mkdir(exist_ok=True)
for name in ["index.html", "service-worker.js"]:
    shutil.copy2(ROOT / name, backup / name)

app_html = ROOT / "app.html"
if not app_html.exists():
    shutil.copy2(ROOT / "index.html", app_html)

for name in ["index.html", "profile-shell.css", "profile-shell.js", "service-worker.js"]:
    shutil.copy2(PATCH_DIR / name, ROOT / name)

avatar_dest = ROOT / "avatars"
avatar_dest.mkdir(exist_ok=True)
for image in (PATCH_DIR / "avatars").glob("*.png"):
    shutil.copy2(image, avatar_dest / image.name)

print("Salita Quest v5.4 Local Learner Profiles applied.")
print(f"Backup created at: {backup}")
print("Serve the project over http(s), then test profile creation, login, logout and progress migration.")
