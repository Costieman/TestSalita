#!/usr/bin/env python3
"""Validate the first Salita Quest modularization boundary."""

from __future__ import annotations

import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "src/config/course-manifest.js"
BOOTSTRAP = ROOT / "src/app/course-bootstrap.js"
SERVICE_WORKER = ROOT / "service-worker.js"


def fail(message: str) -> None:
    raise AssertionError(message)


def read(path: Path) -> str:
    if not path.is_file():
        fail(f"Required file is missing: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def array_values(source: str, variable: str) -> list[str]:
    match = re.search(
        rf"const\s+{re.escape(variable)}\s*=\s*\[(.*?)\];",
        source,
        flags=re.DOTALL,
    )
    if not match:
        fail(f"Could not find asset array: {variable}")
    return re.findall(r'"([^"\n]+)"', match.group(1))


def validate_page(path: str, course_id: str) -> None:
    source = read(ROOT / path)
    required_fragments = (
        'src/config/course-manifest.js?v=5.6.0',
        'src/app/course-bootstrap.js?v=5.6.0',
        f'courseId: "{course_id}"',
    )
    for fragment in required_fragments:
        if fragment not in source:
            fail(f"{path} does not reference {fragment}")
    if "raw.githubusercontent.com" in source:
        fail(f"{path} still contains duplicated source-document bootstrap logic")


def validate_assets(manifest_source: str) -> None:
    expected = {
        "sharedStyles": (23, "ui-quality-fixes.css?v=5.4.21", "achievement-sharing-v4.css?v=5.4.29"),
        "tagalogScripts": (31, "progression-v54.js?v=5.4.21", "src/features/interface/collection-key-translation-hotfix.js?v=5.5.11"),
        "cebuanoScripts": (28, "bisaya-app-loader.js?v=0.3.2", "achievement-sharing-v4.js?v=5.4.29"),
    }

    all_assets: set[str] = set()
    for variable, (count, first, last) in expected.items():
        values = array_values(manifest_source, variable)
        if len(values) != count:
            fail(f"{variable} contains {len(values)} assets; expected {count}")
        if values[0] != first or values[-1] != last:
            fail(f"{variable} load-order boundary changed")
        if len(values) != len(set(values)):
            fail(f"{variable} contains duplicate assets")
        all_assets.update(values)

    for asset in sorted(all_assets):
        relative_path = asset.split("?", 1)[0]
        if not (ROOT / relative_path).is_file():
            fail(f"Manifest references a missing asset: {relative_path}")


def validate_storage_contract(manifest_source: str, bootstrap_source: str) -> None:
    storage_keys = (
        "salitaQuestLocalProfilesV1",
        "salitaQuestActiveProfileId",
        "salitaQuestActiveCourse",
        "salitaQuestProgress",
        "salitaQuestBaseProgressOwner",
        "salitaQuestProgress.profile.",
        "salitaQuestAppDocumentV554",
        "salitaQuestBisayaAppDocumentV554",
    )
    for key in storage_keys:
        if key not in manifest_source:
            fail(f"Storage compatibility key is missing from the manifest: {key}")

    required_behaviour = (
        "saveSharedProgress",
        "prepareProgress",
        "force-cache",
        "document.open()",
        "document.write(assembledDocument)",
        'window.location.replace("./")',
    )
    for fragment in required_behaviour:
        if fragment not in bootstrap_source:
            fail(f"Bootstrap compatibility behaviour is missing: {fragment}")


def validate_service_worker() -> None:
    source = read(SERVICE_WORKER)
    required = (
        'const CACHE_NAME = "salita-quest-v5-6-20-avatar-case-profile-adapter-extraction-r73";',
        '"./src/config/course-manifest.js"',
        '"./src/app/course-bootstrap.js"',
    )
    for fragment in required:
        if fragment not in source:
            fail(f"Service worker is missing: {fragment}")


def validate_javascript_syntax() -> None:
    node = shutil.which("node")
    if not node:
        print("Node.js unavailable; skipped JavaScript syntax checks.")
        return
    for path in (MANIFEST, BOOTSTRAP, SERVICE_WORKER):
        result = subprocess.run(
            [node, "--check", str(path)],
            check=False,
            capture_output=True,
            text=True,
        )
        if result.returncode:
            fail(f"JavaScript syntax check failed for {path.relative_to(ROOT)}:\n{result.stderr}")


def main() -> int:
    manifest_source = read(MANIFEST)
    bootstrap_source = read(BOOTSTRAP)
    validate_page("app.html", "tagalog")
    validate_page("bisaya.html", "cebuano")
    validate_assets(manifest_source)
    validate_storage_contract(manifest_source, bootstrap_source)
    validate_service_worker()
    validate_javascript_syntax()
    print("Modular bootstrap validation passed.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)
