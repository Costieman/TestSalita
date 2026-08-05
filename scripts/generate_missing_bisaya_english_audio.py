#!/usr/bin/env python3
"""Generate only missing English answer audio used by Bisaya Hands-Free Review."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COURSE_PATH = ROOT / "languages" / "cebuano" / "course.json"
MODULE_MANIFEST_PATH = ROOT / "languages" / "cebuano" / "modules" / "manifest.json"
AUDIO_MANIFEST_PATH = ROOT / "audio" / "audio_manifest.json"
OUTPUT_DIR = ROOT / "audio" / "en"
FAILED_PATH = OUTPUT_DIR / "failed-bisaya-english.jsonl"

LANGUAGE_CODE = "en-GB"
VOICE_NAME = "en-GB-Neural2-B"
SPEAKING_RATE = 0.92
TRANSIENT_RETRIES = 4


def normalise(value: object) -> str:
    return " ".join(str(value or "").split()).strip()


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def required_english_texts() -> list[str]:
    course = load_json(COURSE_PATH)
    module_manifest = load_json(MODULE_MANIFEST_PATH)

    items = list(course.get("items", []))

    for filename in module_manifest.get("packs", []):
        pack = load_json(MODULE_MANIFEST_PATH.parent / filename)
        items.extend(pack.get("items", []))

    # This matches the app's handsFreeEnglish(item):
    # item.natural || item.meaning
    result: list[str] = []
    seen: set[str] = set()

    for item in items:
        text = normalise(item.get("natural") or item.get("meaning"))
        if text and text not in seen:
            seen.add(text)
            result.append(text)

    return result


def filename_for(text: str) -> str:
    digest = hashlib.sha256(normalise(text).encode("utf-8")).hexdigest()[:20]
    return f"bisaya-en-{digest}.mp3"


def load_manifest() -> dict:
    manifest = load_json(AUDIO_MANIFEST_PATH)
    manifest.setdefault("voices", {})
    manifest.setdefault("entries", {})
    manifest["voices"].setdefault(
        LANGUAGE_CODE,
        {
            "name": VOICE_NAME,
            "speakingRate": SPEAKING_RATE,
        },
    )
    manifest["entries"].setdefault(LANGUAGE_CODE, {})
    return manifest


def save_manifest(manifest: dict) -> None:
    AUDIO_MANIFEST_PATH.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def append_failure(text: str, error: Exception) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    record = {
        "text": text,
        "errorType": type(error).__name__,
        "message": str(error),
        "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    with FAILED_PATH.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record, ensure_ascii=False) + "\n")


def make_client():
    try:
        from google.cloud import texttospeech
    except ImportError as exc:
        raise SystemExit(
            'Install the client first: pip install "google-cloud-texttospeech>=2.29.0"'
        ) from exc

    return texttospeech, texttospeech.TextToSpeechClient()


def synthesise(client, texttospeech, text: str, output: Path) -> None:
    response = client.synthesize_speech(
        input=texttospeech.SynthesisInput(text=text),
        voice=texttospeech.VoiceSelectionParams(
            language_code=LANGUAGE_CODE,
            name=VOICE_NAME,
        ),
        audio_config=texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=SPEAKING_RATE,
        ),
    )

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(response.audio_content)


def synthesise_with_retries(client, texttospeech, text: str, output: Path) -> None:
    from google.api_core import exceptions as google_exceptions

    for attempt in range(1, TRANSIENT_RETRIES + 1):
        try:
            synthesise(client, texttospeech, text, output)
            return
        except (
            google_exceptions.ServiceUnavailable,
            google_exceptions.TooManyRequests,
            google_exceptions.DeadlineExceeded,
            google_exceptions.InternalServerError,
        ):
            if attempt >= TRANSIENT_RETRIES:
                raise
            wait_seconds = min(20, 2**attempt)
            print(f"  ↳ temporary error; retrying in {wait_seconds}s")
            time.sleep(wait_seconds)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Generate only the first N missing clips",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="List missing clips without calling Google Cloud",
    )
    args = parser.parse_args()

    if not os.getenv("GOOGLE_CLOUD_PROJECT") and not args.dry_run:
        raise SystemExit("Set GOOGLE_CLOUD_PROJECT before generating audio.")

    manifest = load_manifest()
    entries: dict[str, str] = manifest["entries"][LANGUAGE_CODE]
    required = required_english_texts()

    missing = [
        text
        for text in required
        if text not in entries
        or not entries[text]
        or not (ROOT / entries[text]).exists()
    ]

    if args.limit > 0:
        missing = missing[: args.limit]

    print(f"Unique Bisaya English answers: {len(required)}")
    print(f"Existing covered answers: {len(required) - len(missing)}")
    print(f"Clips to generate: {len(missing)}")

    if args.dry_run:
        for number, text in enumerate(missing, 1):
            print(f"{number:03d}. {text}")
        return 0

    texttospeech, client = make_client()
    generated = 0
    failed = 0

    for number, text in enumerate(missing, 1):
        print(f"[{number}/{len(missing)}] {text}")

        relative = Path("audio") / "en" / filename_for(text)
        output = ROOT / relative

        try:
            synthesise_with_retries(client, texttospeech, text, output)
        except Exception as error:
            failed += 1
            append_failure(text, error)
            print(f"  ↳ SKIPPED: {type(error).__name__}: {error}")
            continue

        entries[text] = relative.as_posix()
        save_manifest(manifest)
        generated += 1
        print(f"  ↳ created {relative}")

    save_manifest(manifest)

    print()
    print(f"Summary: {generated} generated, {failed} skipped")
    print(f"Updated: {AUDIO_MANIFEST_PATH.relative_to(ROOT)}")
    if failed:
        print(f"Review: {FAILED_PATH.relative_to(ROOT)}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
