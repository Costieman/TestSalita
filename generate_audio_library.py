#!/usr/bin/env python3
"""Generate Salita Quest's permanent Google Cloud Text-to-Speech MP3 library.

Run from the repository root in Google Cloud Shell:
    python3 generate_audio_library.py

The script reads the course directly from app.js, creates reusable Filipino and
British-English MP3 files, and writes audio/audio_manifest.json. Existing files
are skipped, so rerunning it after adding new course material only creates new
clips.
"""

from __future__ import annotations

import hashlib
import json
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from google.cloud import texttospeech

ROOT = Path(__file__).resolve().parent
APP_JS = ROOT / "app.js"
AUDIO_ROOT = ROOT / "audio"
FIL_DIR = AUDIO_ROOT / "fil"
EN_DIR = AUDIO_ROOT / "en"
MANIFEST_PATH = AUDIO_ROOT / "audio_manifest.json"

FIL_LANGUAGE = "fil-PH"
FIL_VOICE = "fil-ph-Neural2-A"
FIL_RATE = 1.0

EN_LANGUAGE = "en-GB"
EN_VOICE = "en-GB-Neural2-B"
EN_RATE = 0.92


def canonical_text(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def clean_js_literal(text: str) -> str:
    """Convert the simple JavaScript object/array literals in app.js to JSON.

    Salita Quest started with JSON-style data, then later course additions used
    normal JavaScript conveniences such as // comments and unquoted object keys.
    This small lexer handles those features without touching text inside strings.
    """
    out: list[str] = []
    index = 0
    length = len(text)
    quote: str | None = None
    escaped = False

    while index < length:
        char = text[index]

        if quote is not None:
            # The course data currently uses double-quoted strings. Keep them
            # byte-for-byte so apostrophes and Filipino punctuation stay intact.
            out.append(char)
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = None
            index += 1
            continue

        if char in {'"', "'"}:
            # Double quotes are already JSON. Single-quoted literals are uncommon
            # in the course data; convert them safely when encountered.
            if char == '"':
                quote = char
                out.append(char)
                index += 1
                continue

            # Parse a JavaScript-style single-quoted string and emit JSON text.
            index += 1
            value_chars: list[str] = []
            single_escaped = False
            while index < length:
                current = text[index]
                if single_escaped:
                    escapes = {"n": "\n", "r": "\r", "t": "\t", "b": "\b", "f": "\f"}
                    value_chars.append(escapes.get(current, current))
                    single_escaped = False
                elif current == "\\":
                    single_escaped = True
                elif current == "'":
                    index += 1
                    break
                else:
                    value_chars.append(current)
                index += 1
            out.append(json.dumps("".join(value_chars), ensure_ascii=False))
            continue

        # Remove // line comments outside strings.
        if char == "/" and index + 1 < length and text[index + 1] == "/":
            index += 2
            while index < length and text[index] not in "\r\n":
                index += 1
            continue

        # Remove /* ... */ comments outside strings too.
        if char == "/" and index + 1 < length and text[index + 1] == "*":
            end = text.find("*/", index + 2)
            index = length if end < 0 else end + 2
            continue

        # Quote bare JavaScript object keys such as {id:"...", module:"..."}.
        if char.isalpha() or char in "_$":
            end = index + 1
            while end < length and (text[end].isalnum() or text[end] in "_$"):
                end += 1
            identifier = text[index:end]

            previous = ""
            for existing in reversed(out):
                stripped = existing.strip()
                if stripped:
                    previous = stripped[-1]
                    break

            look = end
            while look < length and text[look].isspace():
                look += 1

            if previous in "{" + "," and look < length and text[look] == ":":
                out.append(json.dumps(identifier))
                out.append(text[end:look])
                index = look
                continue

            out.append(identifier)
            index = end
            continue

        out.append(char)
        index += 1

    cleaned = "".join(out)

    # JavaScript allows trailing commas; JSON does not. Remove only commas that
    # are outside strings and immediately precede a closing ] or }.
    result: list[str] = []
    index = 0
    quote = None
    escaped = False
    while index < len(cleaned):
        char = cleaned[index]
        if quote is not None:
            result.append(char)
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = None
            index += 1
            continue
        if char == '"':
            quote = char
            result.append(char)
            index += 1
            continue
        if char == ",":
            look = index + 1
            while look < len(cleaned) and cleaned[look].isspace():
                look += 1
            if look < len(cleaned) and cleaned[look] in "]}":
                index += 1
                continue
        result.append(char)
        index += 1

    return "".join(result)


def extract_json_constant(source: str, name: str) -> Any:
    """Extract a JavaScript const object/array assignment from app.js."""
    marker = f"const {name} ="
    marker_index = source.find(marker)
    if marker_index < 0:
        raise ValueError(f"Could not find {marker!r} in app.js")

    start = marker_index + len(marker)
    while start < len(source) and source[start].isspace():
        start += 1

    if start >= len(source) or source[start] not in "[{":
        raise ValueError(f"{name} does not start with an object/array")

    opener = source[start]
    closer = "]" if opener == "[" else "}"
    depth = 0
    quote: str | None = None
    escaped = False

    for index in range(start, len(source)):
        char = source[index]
        if quote is not None:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = None
            continue

        if char in {'"', "'"}:
            quote = char
        elif char == opener:
            depth += 1
        elif char == closer:
            depth -= 1
            if depth == 0:
                literal = source[start : index + 1]
                try:
                    return json.loads(literal)
                except json.JSONDecodeError:
                    return json.loads(clean_js_literal(literal))

    raise ValueError(f"Could not find the end of {name}")


def app_normalise(text: str) -> str:
    value = canonical_text(text).lower()
    value = re.sub(r"[.,!?;:'\"”“]", "", value)
    value = value.replace("-", " ")
    return re.sub(r"\s+", " ", value).strip()


def sentence_for_verb_aspect(item: dict[str, Any], aspect: str) -> str:
    form = canonical_text((item.get("forms") or {}).get(aspect))
    example = canonical_text(item.get("example"))
    if not form:
        return ""
    if app_normalise(form) in app_normalise(example).split(" "):
        return example
    return f"{form[:1].upper()}{form[1:]} ako."


def collect_course_audio(source: str) -> tuple[list[str], list[str]]:
    items = extract_json_constant(source, "ITEMS")
    try:
        dialogues = extract_json_constant(source, "DIALOGUES")
    except ValueError:
        dialogues = {}

    filipino: set[str] = set()
    english: set[str] = set()

    for item in items:
        spoken = canonical_text(item.get("example") or item.get("term") or item.get("root"))
        answer = canonical_text(item.get("natural") or item.get("meaning"))
        if spoken:
            filipino.add(spoken)
        if answer:
            english.add(answer)

        if item.get("kind") == "verb" and isinstance(item.get("forms"), dict):
            for aspect in ("completed", "ongoing", "contemplated"):
                sentence = canonical_text(sentence_for_verb_aspect(item, aspect))
                if sentence:
                    filipino.add(sentence)

    if isinstance(dialogues, dict):
        for dialogue in dialogues.values():
            for line in dialogue.get("lines", []):
                fil = canonical_text(line.get("text"))
                eng = canonical_text(line.get("natural"))
                if fil:
                    filipino.add(fil)
                if eng:
                    english.add(eng)

    return sorted(filipino), sorted(english)


def audio_filename(language: str, text: str) -> str:
    digest = hashlib.sha256(f"{language}\n{text}".encode("utf-8")).hexdigest()[:20]
    return f"{digest}.mp3"


def synthesize(
    client: texttospeech.TextToSpeechClient,
    *,
    text: str,
    language_code: str,
    voice_name: str,
    speaking_rate: float,
    destination: Path,
) -> None:
    response = client.synthesize_speech(
        input=texttospeech.SynthesisInput(text=text),
        voice=texttospeech.VoiceSelectionParams(
            language_code=language_code,
            name=voice_name,
        ),
        audio_config=texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=speaking_rate,
        ),
    )
    destination.write_bytes(response.audio_content)


def generate_language(
    client: texttospeech.TextToSpeechClient,
    *,
    texts: list[str],
    manifest_key: str,
    folder: Path,
    language_code: str,
    voice_name: str,
    speaking_rate: float,
) -> tuple[dict[str, str], int, int]:
    entries: dict[str, str] = {}
    created = 0
    skipped = 0
    folder.mkdir(parents=True, exist_ok=True)

    for number, text in enumerate(texts, start=1):
        filename = audio_filename(manifest_key, text)
        destination = folder / filename
        relative_path = destination.relative_to(ROOT).as_posix()
        entries[text] = relative_path

        if destination.exists() and destination.stat().st_size > 0:
            skipped += 1
            print(f"[{number:03}/{len(texts):03}] skip   {text}")
            continue

        print(f"[{number:03}/{len(texts):03}] create {text}")
        attempts = 0
        while True:
            attempts += 1
            try:
                synthesize(
                    client,
                    text=text,
                    language_code=language_code,
                    voice_name=voice_name,
                    speaking_rate=speaking_rate,
                    destination=destination,
                )
                created += 1
                break
            except Exception as exc:  # noqa: BLE001 - useful command-line reporting
                if attempts >= 3:
                    raise RuntimeError(f"Failed to create audio for: {text}") from exc
                print(f"    temporary error; retrying ({attempts}/3)...")
                time.sleep(attempts * 1.5)

        time.sleep(0.04)

    return entries, created, skipped


def main() -> int:
    if not APP_JS.exists():
        print("ERROR: Run this from the SalitaQuest repository root.", file=sys.stderr)
        return 1

    source = APP_JS.read_text(encoding="utf-8")
    filipino_texts, english_texts = collect_course_audio(source)

    print("Salita Quest Google audio generator")
    print(f"Filipino clips needed: {len(filipino_texts)}")
    print(f"English clips needed:  {len(english_texts)}")
    print(f"Total clips:           {len(filipino_texts) + len(english_texts)}")
    print()
    print(f"Filipino voice: {FIL_VOICE}")
    print(f"English voice:  {EN_VOICE} at {EN_RATE:.2f}x")
    print()

    AUDIO_ROOT.mkdir(exist_ok=True)
    client = texttospeech.TextToSpeechClient()

    fil_entries, fil_created, fil_skipped = generate_language(
        client,
        texts=filipino_texts,
        manifest_key=FIL_LANGUAGE,
        folder=FIL_DIR,
        language_code=FIL_LANGUAGE,
        voice_name=FIL_VOICE,
        speaking_rate=FIL_RATE,
    )

    en_entries, en_created, en_skipped = generate_language(
        client,
        texts=english_texts,
        manifest_key=EN_LANGUAGE,
        folder=EN_DIR,
        language_code=EN_LANGUAGE,
        voice_name=EN_VOICE,
        speaking_rate=EN_RATE,
    )

    manifest = {
        "version": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "voices": {
            FIL_LANGUAGE: {"name": FIL_VOICE, "speakingRate": FIL_RATE},
            EN_LANGUAGE: {"name": EN_VOICE, "speakingRate": EN_RATE},
        },
        "entries": {
            FIL_LANGUAGE: fil_entries,
            EN_LANGUAGE: en_entries,
        },
    }
    MANIFEST_PATH.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print()
    print("Finished!")
    print(f"Filipino: {fil_created} created, {fil_skipped} already existed")
    print(f"English:  {en_created} created, {en_skipped} already existed")
    print(f"Manifest: {MANIFEST_PATH.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
