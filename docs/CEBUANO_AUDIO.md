# Cebuano audio with Google Cloud Gemini-TTS

Salita Quest does not substitute Tagalog pronunciation for Cebuano. Verified Cebuano clips are stored as static MP3 files and indexed in `audio/audio_manifest.json` under the `ceb-PH` language code.

## Current Google Cloud support

Google Cloud Gemini-TTS lists Cebuano (Philippines), `ceb-PH`, as a Preview language. The repository generator defaults to:

- model: `gemini-3.1-flash-tts-preview`
- language: `ceb-PH`
- voice: `Kore`
- output: MP3

Because Gemini-TTS and Cebuano support are Preview features, availability, pricing, model names and required permissions can change. Check the current Google Cloud documentation before a large generation run.

## Google Cloud prerequisites

1. Create or choose a Google Cloud project.
2. Enable billing.
3. Enable Cloud Text-to-Speech and Vertex AI.
4. Give the authenticated user `roles/aiplatform.user`.
5. Set the project:

```bash
export GOOGLE_CLOUD_PROJECT="$(gcloud config get-value project)"
export GOOGLE_CLOUD_REGION="global"
```

Cloud Shell already supplies Google credentials. On a normal computer, authenticate Application Default Credentials with:

```bash
gcloud auth application-default login
```

## Install the Python client

```bash
python3 -m pip install --upgrade "google-cloud-texttospeech>=2.29.0"
```

## Preview or test

```bash
python3 scripts/generate_cebuano_google_audio.py --dry-run
python3 scripts/generate_cebuano_google_audio.py --limit 5
```

Listen to the test clips and confirm accent, pacing and word stress before generating the complete library.

## Generate or resume every missing clip

```bash
python3 scripts/generate_cebuano_google_audio.py
```

The generator is resumable. It:

- leaves existing MP3 files untouched unless `--force` is used;
- updates `audio/audio_manifest.json` after every generated or reused entry;
- maps punctuation-only aliases such as `Palihug` and `Palihug.` to the same recording where possible;
- retries temporary rate-limit, service and timeout failures;
- retries terminal-punctuation safety false positives with normalised text and a neutral reading prompt;
- records phrases that still fail in `audio/ceb-PH/failed.jsonl`;
- continues through the rest of the library rather than terminating the whole run.

At the end it prints a summary such as:

```text
Summary: 218 generated, 129 aliases reused, 3 skipped
Review skipped phrases in audio/ceb-PH/failed.jsonl
```

A non-empty failure log should be reviewed before committing the library. The file contains phrase text and Google support codes but no credentials.

## Recover after the earlier aborting generator

Update the repository before resuming:

```bash
cd ~/SalitaQuest-current
git pull --ff-only origin main
python3 scripts/generate_cebuano_google_audio.py
```

Previously completed files are detected automatically. Do not use `--force` unless the approved voice or delivery should be regenerated.

## Voice and delivery controls

Choose another Gemini-TTS voice:

```bash
python3 scripts/generate_cebuano_google_audio.py --voice Callirrhoe
```

Adjust the delivery prompt:

```bash
python3 scripts/generate_cebuano_google_audio.py \
  --prompt "Speak natural conversational Cebuano from the Philippines slowly and clearly for a beginner learner. Do not translate."
```

## Verification and GitHub upload

```bash
find audio/ceb-PH -type f -name "*.mp3" | wc -l
cat audio/ceb-PH/failed.jsonl 2>/dev/null || true
git status --short audio/ceb-PH audio/audio_manifest.json
```

Commit the MP3 files and manifest on a separate audio branch. Do not commit service-account keys, access tokens, downloaded credential JSON or `.env` files.

The browser app only receives generated MP3 files. It never receives a Google Cloud API key.
