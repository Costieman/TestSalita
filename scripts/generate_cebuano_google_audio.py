#!/usr/bin/env python3
"""Generate verified Cebuano audio clips with Google Cloud Gemini-TTS.

Requires:
  pip install "google-cloud-texttospeech>=2.29.0"
  gcloud auth application-default login  # not needed inside authenticated Cloud Shell
  export GOOGLE_CLOUD_PROJECT="your-project-id"

Cloud requirements:
  - Cloud Text-to-Speech API enabled
  - billing enabled
  - roles/aiplatform.user for the authenticated principal

The script writes MP3 files beneath audio/ceb-PH and updates
`audio/audio_manifest.json` using Salita Quest's existing manifest format.
Generation is resumable: existing clips are reused, punctuation-only aliases can
share one recording, transient API failures are retried, and rejected phrases are
logged without stopping the rest of the run.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import time
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[1]
COURSE_PATH = ROOT / "languages" / "cebuano" / "course.json"
MANIFEST_PATH = ROOT / "languages" / "cebuano" / "modules" / "manifest.json"
AUDIO_MANIFEST_PATH = ROOT / "audio" / "audio_manifest.json"
OUTPUT_DIR = ROOT / "audio" / "ceb-PH"
FAILED_PATH = OUTPUT_DIR / "failed.jsonl"
LANGUAGE_CODE = "ceb-PH"
DEFAULT_MODEL = "gemini-3.1-flash-tts-preview"
DEFAULT_VOICE = "Kore"
DEFAULT_PROMPT = (
    "Speak natural conversational Cebuano from the Philippines clearly and warmly. "
    "Use a moderate learning pace, preserve normal Cebuano stress and rhythm, and do not translate the text."
)
FALLBACK_PROMPT = (
    "Read the supplied Cebuano text exactly once for a language-learning app. "
    "Use natural Philippine Cebuano pronunciation at a moderate pace. Do not add or translate anything."
)
TRANSIENT_RETRIES = 4


def normalise(text: str) -> str:
    return " ".join(str(text or "").split()).strip()


def spoken_form(text: str) -> str:
    """Return a pronunciation-equivalent key for terminal punctuation aliases."""
    value = normalise(text)
    simplified = re.sub(r"[\s.!?…。！？]+$", "", value).strip()
    return simplified or value


def iter_course_texts() -> Iterable[str]:
    course = json.loads(COURSE_PATH.read_text(encoding="utf-8"))
    module_manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    packs = []
    for name in module_manifest.get("packs", []):
        path = MANIFEST_PATH.parent / name
        packs.append(json.loads(path.read_text(encoding="utf-8")))

    for item in [*course.get("items", []), *(item for pack in packs for item in pack.get("items", []))]:
        for field in ("term", "example", "root"):
            value = normalise(item.get(field, ""))
            if value:
                yield value

    dialogues = [course.get("dialogue"), *(pack.get("dialogue") for pack in packs)]
    for dialogue in dialogues:
        if not dialogue:
            continue
        for line in dialogue.get("lines", []):
            value = normalise(line.get("text", ""))
            if value:
                yield value


def unique_texts() -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for text in iter_course_texts():
        if text not in seen:
            seen.add(text)
            result.append(text)
    return result


def filename_for(text: str) -> str:
    digest = hashlib.sha256(spoken_form(text).encode("utf-8")).hexdigest()[:20]
    return f"ceb-{digest}.mp3"


def load_audio_manifest() -> dict:
    if AUDIO_MANIFEST_PATH.exists():
        data = json.loads(AUDIO_MANIFEST_PATH.read_text(encoding="utf-8"))
    else:
        data = {"version": 1, "entries": {}}
    data.setdefault("entries", {}).setdefault(LANGUAGE_CODE, {})
    return data


def save_audio_manifest(manifest: dict) -> None:
    AUDIO_MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    AUDIO_MANIFEST_PATH.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def existing_alias(text: str, entries: dict[str, str]) -> str | None:
    direct = entries.get(text)
    if direct and (ROOT / direct).exists():
        return direct
    key = spoken_form(text).casefold()
    for alias, relative in entries.items():
        if spoken_form(alias).casefold() == key and relative and (ROOT / relative).exists():
            return relative
    canonical_path = Path("audio") / LANGUAGE_CODE / filename_for(text)
    if (ROOT / canonical_path).exists():
        return canonical_path.as_posix()
    return None


def append_failure(text: str, error: Exception, attempt_text: str) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    support_code = ""
    match = re.search(r"Support codes?:\s*([0-9, ]+)", str(error), flags=re.IGNORECASE)
    if match:
        support_code = match.group(1).strip()
    record = {
        "text": text,
        "attemptText": attempt_text,
        "errorType": type(error).__name__,
        "message": str(error),
        "supportCode": support_code,
        "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    with FAILED_PATH.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record, ensure_ascii=False) + "\n")


def make_client():
    try:
        from google.api_core.client_options import ClientOptions
        from google.cloud import texttospeech
    except ImportError as exc:
        raise SystemExit('Install the client first: pip install "google-cloud-texttospeech>=2.29.0"') from exc

    region = os.getenv("GOOGLE_CLOUD_REGION", "global")
    endpoint = "texttospeech.googleapis.com" if region == "global" else f"{region}-texttospeech.googleapis.com"
    return texttospeech, texttospeech.TextToSpeechClient(client_options=ClientOptions(api_endpoint=endpoint))


def synthesize(client, texttospeech, text: str, output: Path, model: str, voice_name: str, prompt: str) -> None:
    request_input = texttospeech.SynthesisInput(text=text, prompt=prompt)
    voice = texttospeech.VoiceSelectionParams(
        language_code=LANGUAGE_CODE,
        name=voice_name,
        model_name=model,
    )
    audio_config = texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3)
    response = client.synthesize_speech(input=request_input, voice=voice, audio_config=audio_config)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(response.audio_content)


def synthesize_with_retries(client, texttospeech, text: str, output: Path, model: str, voice: str, prompt: str) -> str:
    from google.api_core import exceptions as google_exceptions

    attempt_text = text
    attempt_prompt = prompt
    used_fallback = False
    transient_attempt = 0

    while True:
        try:
            synthesize(client, texttospeech, attempt_text, output, model, voice, attempt_prompt)
            return attempt_text
        except google_exceptions.InvalidArgument:
            simplified = spoken_form(text)
            if not used_fallback and simplified and simplified != text:
                used_fallback = True
                attempt_text = simplified
                attempt_prompt = FALLBACK_PROMPT
                print(f"  ↳ retrying punctuation-normalised text: {simplified}")
                continue
            raise
        except (
            google_exceptions.ServiceUnavailable,
            google_exceptions.TooManyRequests,
            google_exceptions.DeadlineExceeded,
            google_exceptions.InternalServerError,
        ):
            transient_attempt += 1
            if transient_attempt >= TRANSIENT_RETRIES:
                raise
            wait_seconds = min(20, 2 ** transient_attempt)
            print(f"  ↳ temporary Google Cloud error; retrying in {wait_seconds}s")
            time.sleep(wait_seconds)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--voice", default=DEFAULT_VOICE)
    parser.add_argument("--prompt", default=DEFAULT_PROMPT)
    parser.add_argument("--limit", type=int, default=0, help="Generate only the first N missing clips")
    parser.add_argument("--force", action="store_true", help="Regenerate clips already present")
    parser.add_argument("--dry-run", action="store_true", help="List work without calling Google Cloud")
    args = parser.parse_args()

    if not os.getenv("GOOGLE_CLOUD_PROJECT") and not args.dry_run:
        raise SystemExit("Set GOOGLE_CLOUD_PROJECT before generating audio.")

    manifest = load_audio_manifest()
    entries: dict[str, str] = manifest["entries"][LANGUAGE_CODE]
    texts = unique_texts()
    missing = [
        text for text in texts
        if args.force or text not in entries or not (ROOT / entries.get(text, "")).exists()
    ]
    if args.limit > 0:
        missing = missing[: args.limit]

    print(f"Cebuano phrases discovered: {len(texts)}")
    print(f"Clips to generate or map: {len(missing)}")
    if args.dry_run:
        for text in missing:
            alias = existing_alias(text, entries)
            print(f"{text}{'  [reuse existing audio]' if alias and not args.force else ''}")
        return 0

    texttospeech, client = make_client()
    generated = 0
    reused = 0
    failed = 0

    for index, text in enumerate(missing, start=1):
        print(f"[{index}/{len(missing)}] {text}")
        if not args.force:
            alias = existing_alias(text, entries)
            if alias:
                entries[text] = alias
                save_audio_manifest(manifest)
                reused += 1
                print(f"  ↳ reused {alias}")
                continue

        relative = Path("audio") / LANGUAGE_CODE / filename_for(text)
        output = ROOT / relative
        try:
            synthesize_with_retries(client, texttospeech, text, output, args.model, args.voice, args.prompt)
        except Exception as error:  # Continue the library while retaining a reviewable failure record.
            failed += 1
            append_failure(text, error, spoken_form(text))
            print(f"  ↳ SKIPPED: {type(error).__name__}: {error}")
            continue

        entries[text] = relative.as_posix()
        save_audio_manifest(manifest)
        generated += 1

    save_audio_manifest(manifest)
    print(f"Updated {AUDIO_MANIFEST_PATH.relative_to(ROOT)}")
    print(f"Summary: {generated} generated, {reused} aliases reused, {failed} skipped")
    if failed:
        print(f"Review skipped phrases in {FAILED_PATH.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
