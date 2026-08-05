#!/usr/bin/env python3
"""Serve Salita Quest and optionally generate natural speech through OpenAI.

Set OPENAI_API_KEY before starting to enable natural speech. Generated MP3 files
are cached in ./audio_cache so the same phrase is not requested repeatedly.
"""

from __future__ import annotations

import hashlib
import json
import os
import sys
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
CACHE = ROOT / "audio_cache"
CACHE.mkdir(exist_ok=True)
HOST = os.getenv("SALITA_HOST", "127.0.0.1")
PORT = int(os.getenv("SALITA_PORT", "8000"))
MODEL = os.getenv("SALITA_TTS_MODEL", "gpt-4o-mini-tts")
VOICE = os.getenv("SALITA_TTS_VOICE", "coral")
INSTRUCTIONS = (
    "Speak in natural conversational Filipino with clear Metro Manila pronunciation. "
    "Sound like a warm, patient language tutor. Speak slightly slower than ordinary conversation, "
    "but keep natural rhythm and emotion. Pronounce Tagalog-English code-switching naturally."
)


def json_bytes(data: dict) -> bytes:
    return json.dumps(data, ensure_ascii=False).encode("utf-8")


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store" if self.path.startswith("/api/") else "no-cache")
        super().end_headers()

    def do_GET(self) -> None:
        if urlparse(self.path).path == "/api/health":
            payload = json_bytes({
                "ok": True,
                "natural_voice": bool(os.getenv("OPENAI_API_KEY")),
                "model": MODEL,
                "voice": VOICE,
            })
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        super().do_GET()

    def do_POST(self) -> None:
        if urlparse(self.path).path != "/api/speech":
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            self._json_error(HTTPStatus.SERVICE_UNAVAILABLE, "OPENAI_API_KEY is not set")
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            data = json.loads(self.rfile.read(length) or b"{}")
            text = str(data.get("text", "")).strip()
        except (ValueError, json.JSONDecodeError):
            self._json_error(HTTPStatus.BAD_REQUEST, "Invalid JSON")
            return

        if not text or len(text) > 500:
            self._json_error(HTTPStatus.BAD_REQUEST, "Text must contain 1–500 characters")
            return

        cache_key = hashlib.sha256(f"{MODEL}|{VOICE}|{INSTRUCTIONS}|{text}".encode("utf-8")).hexdigest()
        path = CACHE / f"{cache_key}.mp3"

        try:
            if not path.exists():
                from openai import OpenAI
                client = OpenAI(api_key=api_key)
                with client.audio.speech.with_streaming_response.create(
                    model=MODEL,
                    voice=VOICE,
                    input=text,
                    instructions=INSTRUCTIONS,
                    response_format="mp3",
                ) as response:
                    response.stream_to_file(path)
            audio = path.read_bytes()
        except ImportError:
            self._json_error(HTTPStatus.SERVICE_UNAVAILABLE, "Install dependencies with: pip install -r requirements.txt")
            return
        except Exception as exc:
            print(f"Speech generation failed: {exc}", file=sys.stderr)
            self._json_error(HTTPStatus.BAD_GATEWAY, "Speech generation failed")
            return

        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "audio/mpeg")
        self.send_header("Content-Length", str(len(audio)))
        self.end_headers()
        self.wfile.write(audio)

    def _json_error(self, status: HTTPStatus, message: str) -> None:
        payload = json_bytes({"ok": False, "error": message})
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


if __name__ == "__main__":
    print(f"Salita Quest: http://{HOST}:{PORT}")
    if os.getenv("OPENAI_API_KEY"):
        print("Natural AI voice: enabled")
    else:
        print("Natural AI voice: disabled (set OPENAI_API_KEY to enable it)")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
