#!/usr/bin/env python3
"""Patch Salita Quest so the app uses the generated static MP3 library first.

Run once from the repository root after generate_audio_library.py has created
`audio/audio_manifest.json` and the MP3 folders.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
APP = ROOT / "app.js"
SW = ROOT / "service-worker.js"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if new in text:
        print(f"skip: {label} already applied")
        return text
    if old not in text:
        raise SystemExit(f"Could not find expected code for: {label}")
    print(f"patch: {label}")
    return text.replace(old, new, 1)


app = APP.read_text(encoding="utf-8")

app = replace_once(
    app,
    'const APP_VERSION = "5.2.0";',
    'const APP_VERSION = "5.3.0";',
    "app version",
)

app = replace_once(
    app,
    'const audioCache = new Map();\nconst HANDS_FREE_MAX_SECONDS = 118;',
    '''const audioCache = new Map();
let staticAudioManifest = null;
let staticAudioManifestPromise = null;

async function loadStaticAudioManifest() {
  if (staticAudioManifest) return staticAudioManifest;
  if (!location.protocol.startsWith("http")) return null;
  if (!staticAudioManifestPromise) {
    staticAudioManifestPromise = fetch("./audio/audio_manifest.json", {cache:"no-store"})
      .then(response => {
        if (!response.ok) throw new Error("Audio manifest unavailable");
        return response.json();
      })
      .then(data => (staticAudioManifest = data))
      .catch(() => null)
      .finally(() => { staticAudioManifestPromise = null; });
  }
  return staticAudioManifestPromise;
}

async function staticAudioUrl(text, lang) {
  const manifest = await loadStaticAudioManifest();
  const path = manifest?.entries?.[lang]?.[String(text || "").replace(/\\s+/g," ").trim()];
  return path ? `./${path}` : null;
}

const HANDS_FREE_MAX_SECONDS = 118;''',
    "static audio manifest loader",
)

old_hands = '''async function handsFreeSpeak(text,lang,runId) {
  if(handsFreeReview.runId!==runId || !handsFreeReview.playing)return false;
  if(lang==="fil-PH" && state.settings.naturalVoice && location.protocol.startsWith("http")){
    try{
      let url=audioCache.get(text);
      if(!url){const response=await fetch("/api/speech",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text})});if(!response.ok)throw new Error("Natural voice unavailable");const blob=await response.blob();url=URL.createObjectURL(blob);audioCache.set(text,url);}
      if(handsFreeReview.runId!==runId)return false;
      if(activeAudio){activeAudio.pause();activeAudio=null;}
      const audio=new Audio(url);activeAudio=audio;
      const ok=await new Promise(resolve=>{
        let settled=false;const finish=value=>{if(settled)return;settled=true;handsFreeReview.currentSpeechResolve=null;resolve(value);};
        handsFreeReview.currentSpeechResolve=()=>finish(false);audio.onended=()=>finish(true);audio.onerror=()=>finish(false);audio.play().catch(()=>finish(false));
      });
      if(activeAudio===audio)activeAudio=null;
      if(ok)return handsFreeReview.runId===runId && handsFreeReview.playing;
    }catch{}
  }
  if(!("speechSynthesis" in window))return false;
  return await new Promise(resolve=>{
    let settled=false;const finish=value=>{if(settled)return;settled=true;handsFreeReview.currentSpeechResolve=null;resolve(value);};
    handsFreeReview.currentSpeechResolve=()=>finish(false);
    speechSynthesis.cancel();
    const utterance=new SpeechSynthesisUtterance(text);utterance.lang=lang;utterance.rate=lang==="fil-PH"?.78:.9;utterance.pitch=1;
    const voices=speechSynthesis.getVoices();
    const preferred=lang==="fil-PH"?(voices.find(v=>v.lang.toLowerCase().startsWith("fil"))||voices.find(v=>v.lang.toLowerCase().startsWith("tl"))):voices.find(v=>v.lang.toLowerCase().startsWith("en-us"))||voices.find(v=>v.lang.toLowerCase().startsWith("en"));
    if(preferred)utterance.voice=preferred;utterance.onend=()=>finish(true);utterance.onerror=()=>finish(false);speechSynthesis.speak(utterance);
  });
}'''

new_hands = '''async function handsFreeSpeak(text,lang,runId) {
  if(handsFreeReview.runId!==runId || !handsFreeReview.playing)return false;

  if(state.settings.naturalVoice && location.protocol.startsWith("http")){
    try{
      const staticUrl=await staticAudioUrl(text,lang);
      if(staticUrl){
        if(handsFreeReview.runId!==runId)return false;
        if(activeAudio){activeAudio.pause();activeAudio=null;}
        const audio=new Audio(staticUrl);activeAudio=audio;
        const ok=await new Promise(resolve=>{
          let settled=false;const finish=value=>{if(settled)return;settled=true;handsFreeReview.currentSpeechResolve=null;resolve(value);};
          handsFreeReview.currentSpeechResolve=()=>finish(false);audio.onended=()=>finish(true);audio.onerror=()=>finish(false);audio.play().catch(()=>finish(false));
        });
        if(activeAudio===audio)activeAudio=null;
        if(ok)return handsFreeReview.runId===runId && handsFreeReview.playing;
      }
    }catch{}
  }

  if(lang==="fil-PH" && state.settings.naturalVoice && location.protocol.startsWith("http")){
    try{
      let url=audioCache.get(text);
      if(!url){const response=await fetch("/api/speech",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text})});if(!response.ok)throw new Error("Natural voice unavailable");const blob=await response.blob();url=URL.createObjectURL(blob);audioCache.set(text,url);}
      if(handsFreeReview.runId!==runId)return false;
      if(activeAudio){activeAudio.pause();activeAudio=null;}
      const audio=new Audio(url);activeAudio=audio;
      const ok=await new Promise(resolve=>{
        let settled=false;const finish=value=>{if(settled)return;settled=true;handsFreeReview.currentSpeechResolve=null;resolve(value);};
        handsFreeReview.currentSpeechResolve=()=>finish(false);audio.onended=()=>finish(true);audio.onerror=()=>finish(false);audio.play().catch(()=>finish(false));
      });
      if(activeAudio===audio)activeAudio=null;
      if(ok)return handsFreeReview.runId===runId && handsFreeReview.playing;
    }catch{}
  }

  if(!("speechSynthesis" in window))return false;
  return await new Promise(resolve=>{
    let settled=false;const finish=value=>{if(settled)return;settled=true;handsFreeReview.currentSpeechResolve=null;resolve(value);};
    handsFreeReview.currentSpeechResolve=()=>finish(false);
    speechSynthesis.cancel();
    const utterance=new SpeechSynthesisUtterance(text);utterance.lang=lang;utterance.rate=lang==="fil-PH"?.78:.9;utterance.pitch=1;
    const voices=speechSynthesis.getVoices();
    const preferred=lang==="fil-PH"?(voices.find(v=>v.lang.toLowerCase().startsWith("fil"))||voices.find(v=>v.lang.toLowerCase().startsWith("tl"))):voices.find(v=>v.lang.toLowerCase().startsWith("en-gb"))||voices.find(v=>v.lang.toLowerCase().startsWith("en"));
    if(preferred)utterance.voice=preferred;utterance.onend=()=>finish(true);utterance.onerror=()=>finish(false);speechSynthesis.speak(utterance);
  });
}'''
app = replace_once(app, old_hands, new_hands, "hands-free static MP3 playback")

app = replace_once(
    app,
    'const checked=await handsFreeSpeak(handsFreeEnglish(item),"en-US",runId);',
    'const checked=await handsFreeSpeak(handsFreeEnglish(item),"en-GB",runId);',
    "British English hands-free locale",
)

old_speak = '''async function speakFilipino(text, sourceButton=null) {
  const btn=sourceButton || document.getElementById("audioBtn");
  const originalButtonText=btn?.textContent || "🔊";
  if(activeAudio){activeAudio.pause();activeAudio=null;}
  if(state.settings.naturalVoice && location.protocol.startsWith("http")) {
    try {
      if(btn){btn.disabled=true;btn.textContent="Generating audio…";}
      let url=audioCache.get(text);
      if(!url){
        const response=await fetch("/api/speech",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text})});
        if(!response.ok) throw new Error("Natural voice unavailable");
        const blob=await response.blob();url=URL.createObjectURL(blob);audioCache.set(text,url);
      }
      activeAudio=new Audio(url);await activeAudio.play();
      if(btn){btn.textContent=sourceButton?originalButtonText:"🔊 Replay pronunciation";btn.disabled=false;}return;
    } catch(err) {
      if(btn){btn.disabled=false;btn.textContent=sourceButton?originalButtonText:"🔊 Hear pronunciation";}
      toast("Natural voice is unavailable; using the browser voice instead.");
    }
  }
  fallbackSpeech(text);
}'''

new_speak = '''async function speakFilipino(text, sourceButton=null) {
  const btn=sourceButton || document.getElementById("audioBtn");
  const originalButtonText=btn?.textContent || "🔊";
  if(activeAudio){activeAudio.pause();activeAudio=null;}
  if(state.settings.naturalVoice && location.protocol.startsWith("http")) {
    try {
      if(btn){btn.disabled=true;btn.textContent="Loading audio…";}
      const staticUrl=await staticAudioUrl(text,"fil-PH");
      if(staticUrl){
        activeAudio=new Audio(staticUrl);await activeAudio.play();
        if(btn){btn.textContent=sourceButton?originalButtonText:"🔊 Replay pronunciation";btn.disabled=false;}return;
      }

      let url=audioCache.get(text);
      if(!url){
        const response=await fetch("/api/speech",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text})});
        if(!response.ok) throw new Error("Natural voice unavailable");
        const blob=await response.blob();url=URL.createObjectURL(blob);audioCache.set(text,url);
      }
      activeAudio=new Audio(url);await activeAudio.play();
      if(btn){btn.textContent=sourceButton?originalButtonText:"🔊 Replay pronunciation";btn.disabled=false;}return;
    } catch(err) {
      if(btn){btn.disabled=false;btn.textContent=sourceButton?originalButtonText:"🔊 Hear pronunciation";}
      toast("Recorded voice is unavailable; using the browser voice instead.");
    }
  }
  fallbackSpeech(text);
}'''
app = replace_once(app, old_speak, new_speak, "lesson/dictionary static Filipino MP3 playback")

old_health = '''async function checkVoiceService() {
  const status=document.getElementById("voiceStatus");if(!status)return;
  if(!state.settings.naturalVoice){status.textContent="Natural voice is turned off.";status.className="voice-status";return;}
  if(!location.protocol.startsWith("http")){status.textContent="Open the app through server.py to use the natural voice. Browser voice is currently active.";status.className="voice-status warning";return;}
  try {
    const res=await fetch("/api/health",{cache:"no-store"});const data=await res.json();
    status.textContent=data.natural_voice?"Natural AI voice is ready. Audio is generated once and cached locally.":"The app server is running, but OPENAI_API_KEY is not set. Browser voice is active.";
    status.className=`voice-status ${data.natural_voice?"ready":"warning"}`;
  } catch {
    status.textContent="Natural voice service was not detected. Browser voice is active.";status.className="voice-status warning";
  }
}'''

new_health = '''async function checkVoiceService() {
  const status=document.getElementById("voiceStatus");if(!status)return;
  if(!state.settings.naturalVoice){status.textContent="Recorded natural voices are turned off.";status.className="voice-status";return;}
  if(!location.protocol.startsWith("http")){status.textContent="Open the hosted app to use the recorded voice library. Browser voice is currently active.";status.className="voice-status warning";return;}
  const manifest=await loadStaticAudioManifest();
  if(manifest){
    const filCount=Object.keys(manifest.entries?.["fil-PH"]||{}).length;
    const enCount=Object.keys(manifest.entries?.["en-GB"]||{}).length;
    status.textContent=`Google voice library ready · ${filCount} Filipino + ${enCount} British English clips.`;
    status.className="voice-status ready";return;
  }
  try {
    const res=await fetch("/api/health",{cache:"no-store"});const data=await res.json();
    status.textContent=data.natural_voice?"Natural voice service is ready.":"Recorded voice library not found. Browser voice is active.";
    status.className=`voice-status ${data.natural_voice?"ready":"warning"}`;
  } catch {
    status.textContent="Recorded voice library not found. Browser voice is active.";status.className="voice-status warning";
  }
}'''
app = replace_once(app, old_health, new_health, "voice-library status")

APP.write_text(app, encoding="utf-8")

sw = SW.read_text(encoding="utf-8")
sw = replace_once(
    sw,
    'const CACHE_NAME = "salita-quest-v5-2-hands-free";',
    'const CACHE_NAME = "salita-quest-v5-3-google-audio";',
    "service-worker cache version",
)
SW.write_text(sw, encoding="utf-8")

print("\nDone. Salita Quest now prefers the generated Google MP3 library.")
print("Next: git status, then commit and push the app + audio folder.")
