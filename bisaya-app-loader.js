(() => {
  "use strict";

  const COURSE_URL = "./languages/cebuano/course.json";
  const MODULE_MANIFEST_URL = "./languages/cebuano/modules/manifest.json";
  const ENGINE_URL = "./app.js";

  function replaceBlock(source, startMarker, endMarker, replacement) {
    const start = source.indexOf(startMarker);
    const end = source.indexOf(endMarker, start + startMarker.length);
    if (start < 0 || end < 0) throw new Error(`Could not replace ${startMarker}`);
    return `${source.slice(0, start)}${replacement}\n\n${source.slice(end)}`;
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Could not load ${src}`));
      document.body.appendChild(script);
    });
  }

  async function loadModulePacks() {
    const manifestResponse = await fetch(MODULE_MANIFEST_URL, {cache:"no-store"});
    if (!manifestResponse.ok) throw new Error(`Cebuano module manifest unavailable (${manifestResponse.status})`);
    const manifest = await manifestResponse.json();
    const packNames = Array.isArray(manifest.packs) ? manifest.packs : [];
    const responses = await Promise.all(packNames.map(name => fetch(`./languages/cebuano/modules/${name}`, {cache:"no-store"})));
    responses.forEach((response, index) => {
      if (!response.ok) throw new Error(`Cebuano module pack ${packNames[index]} unavailable (${response.status})`);
    });
    return Promise.all(responses.map(response => response.json()));
  }

  function normaliseCourse(course, packs) {
    const moduleId = id => id === "codeSwitching" ? "taglish" : id;
    const packedItems = packs.flatMap(pack => Array.isArray(pack.items) ? pack.items : []);
    const items = [...course.items, ...packedItems].map(item => ({...item, module:moduleId(item.module)}));
    const modulesWithContent = new Set(items.map(item => item.module));
    const unavailableThreshold = items.length * 5 + 1;
    let unreleasedRegionReached = false;
    const modules = course.modules.map((module, index) => {
      const id = moduleId(module.id);
      if (index > 0 && (!modulesWithContent.has(id) || unreleasedRegionReached)) unreleasedRegionReached = true;
      return {
        ...module,
        id,
        unlockAt: unreleasedRegionReached ? unavailableThreshold + index : module.unlockAt
      };
    });
    const moduleMeta = {};
    course.map.forEach(place => {
      if (!place.module) return;
      moduleMeta[moduleId(place.module)] = {
        region: place.region,
        x: place.x,
        y: place.y,
        terrain: place.terrain
      };
    });
    return {modules, moduleMeta, items};
  }

  function buildDialogues(modules, packs) {
    const placeholders = Object.fromEntries(modules.map(module => [module.id, {
      title: module.title,
      level: module.id === "greetings" ? "Beginner 1" : "Coming soon",
      note: module.id === "greetings"
        ? "These expressions introduce conversational Cebuano. Regional alternatives are accepted where they remain natural and widely understood."
        : "This region is part of the Bisaya roadmap but its reviewed lesson content has not yet been released.",
      lines: []
    }]));

    placeholders.greetings = {
      title: "Your first Bisaya greeting",
      level: "Beginner 1",
      note: "Maayong buntag is a time-of-day greeting. Kumusta is common and Spanish-derived, while maayo ra ko gives a natural everyday response.",
      lines: [
        {speaker:"A",text:"Maayong buntag!",tokens:[["Maayo-ng","good-LINK"],["buntag","morning"]],literal:"Good morning.",natural:"Good morning!"},
        {speaker:"B",text:"Maayong buntag. Kumusta ka?",tokens:[["Maayo-ng","good-LINK"],["buntag","morning"],["Kumusta","how-are-things"],["ka","you"]],literal:"Good morning. How-are-things you?",natural:"Good morning. How are you?"},
        {speaker:"A",text:"Maayo ra ko, salamat. Ikaw?",tokens:[["Maayo","well"],["ra","just / only"],["ko","I"],["salamat","thanks"],["Ikaw","you"]],literal:"Well just I, thanks. You?",natural:"I’m fine, thank you. And you?"},
        {speaker:"B",text:"Maayo pud. Sige, amping!",tokens:[["Maayo","well"],["pud","also"],["Sige","okay"],["amping","take care"]],literal:"Well also. Okay, take care!",natural:"I’m well too. Okay, take care!"}
      ]
    };

    packs.forEach(pack => {
      if (pack.moduleId && pack.dialogue) placeholders[pack.moduleId] = pack.dialogue;
    });
    return placeholders;
  }

  function buildBossItems() {
    return [
      {prompt:"Someone greets you: ‘Maayong buntag!’ Choose a natural reply.",answers:["maayong buntag","maayong buntag pud"],choices:["Maayong buntag","Dili","Walay sapayan"],hint:"Repeat the morning greeting."},
      {prompt:"Someone asks: ‘Kumusta ka?’",answers:["maayo ra ko","okay ra ko","maayo man ko"],choices:["Maayo ra ko","Maayong gabii","Palihug"],hint:"Choose a natural wellbeing reply."},
      {prompt:"Someone asks: ‘Unsa imong ngalan?’",answers:["ako si lucille","akong ngalan kay lucille","ang akong ngalan kay lucille"],choices:["Ako si Lucille","Maayo ra ko","Data scientist ko"],hint:"Use Ako si ___ or Akong ngalan kay ___."},
      {prompt:"Someone says: ‘Salamat!’",answers:["walay sapayan","way sapayan"],choices:["Walay sapayan","Pasayloa ko","Dili"],hint:"This means ‘You’re welcome’ or ‘No problem’."},
      {prompt:"Someone says: ‘Amping!’",answers:["ikaw pud","ikaw sad"],choices:["Ikaw pud","Maayong buntag","Oo"],hint:"Pud and sad can both mean ‘too’, depending on regional preference."}
    ];
  }

  function buildBadgesSource() {
    return `const BADGES = [
  {id:"first_step",icon:"🌱",name:"First Step",description:"Complete one exercise",test:s=>s.totalAnswers>=1},
  {id:"first_greeting",icon:"👋",name:"First Bisaya Greeting",description:"Reach familiarity with six greeting items",test:s=>countMasteredInModule(s,"greetings",2)>=6},
  {id:"introduced",icon:"🙂",name:"Introduced in Bisaya",description:"Reach familiarity with four introduction patterns",test:s=>countMasteredInModule(s,"introductions",2)>=4},
  {id:"boss_one",icon:"👑",name:"First Bisaya Meeting",description:"Pass the greeting and introduction challenge",test:s=>s.bossWins>=1}
];`;
  }

  function buildHandsFreeSpeechSource() {
    return `async function handsFreeSpeak(text,lang,runId) {
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
  if(!("speechSynthesis" in window))return false;
  const voices=speechSynthesis.getVoices();
  const preferred=lang==="ceb-PH"?voices.find(v=>v.lang.toLowerCase().startsWith("ceb")):voices.find(v=>v.lang.toLowerCase().startsWith("en-gb"))||voices.find(v=>v.lang.toLowerCase().startsWith("en"));
  if(lang==="ceb-PH"&&!preferred)return false;
  return await new Promise(resolve=>{
    let settled=false;const finish=value=>{if(settled)return;settled=true;handsFreeReview.currentSpeechResolve=null;resolve(value);};
    handsFreeReview.currentSpeechResolve=()=>finish(false);speechSynthesis.cancel();
    const utterance=new SpeechSynthesisUtterance(text);utterance.lang=lang;utterance.rate=lang==="ceb-PH"?.78:.9;utterance.pitch=1;
    if(preferred)utterance.voice=preferred;utterance.onend=()=>finish(true);utterance.onerror=()=>finish(false);speechSynthesis.speak(utterance);
  });
}`;
  }

  function buildCebuanoSpeechSource() {
    return `async function speakFilipino(text, sourceButton=null) {
  const btn=sourceButton || document.getElementById("audioBtn");
  const originalButtonText=btn?.textContent || "🔊";
  if(activeAudio){activeAudio.pause();activeAudio=null;}
  if(state.settings.naturalVoice && location.protocol.startsWith("http")) {
    try {
      if(btn){btn.disabled=true;btn.textContent="Loading audio…";}
      const staticUrl=await staticAudioUrl(text,"ceb-PH");
      if(staticUrl){
        activeAudio=new Audio(staticUrl);await activeAudio.play();
        if(btn){btn.textContent=sourceButton?originalButtonText:"🔊 Replay pronunciation";btn.disabled=false;}return;
      }
    } catch {}
  }
  if(btn){btn.disabled=false;btn.textContent=sourceButton?originalButtonText:"🔊 Hear pronunciation";}
  fallbackSpeech(text);
}

function fallbackSpeech(text) {
  if(!("speechSynthesis" in window)){toast("Speech playback is not supported in this browser.");return;}
  const voices=speechSynthesis.getVoices();
  const cebVoice=voices.find(v=>v.lang.toLowerCase().startsWith("ceb"));
  if(!cebVoice){toast("A verified Cebuano voice is not installed yet. Audio remains disabled rather than using Tagalog pronunciation.");return;}
  speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang="ceb-PH";utterance.rate=0.78;utterance.pitch=1;utterance.voice=cebVoice;speechSynthesis.speak(utterance);
}`;
  }

  function buildCebuanoVoiceStatusSource() {
    return `async function checkVoiceService() {
  const status=document.getElementById("voiceStatus");if(!status)return;
  if(!state.settings.naturalVoice){status.textContent="Cebuano audio is turned off.";status.className="voice-status";return;}
  const manifest=location.protocol.startsWith("http")?await loadStaticAudioManifest():null;
  const count=Object.keys(manifest?.entries?.["ceb-PH"]||{}).length;
  if(count){status.textContent=\`Verified Cebuano voice library ready · \${count} clips.\`;status.className="voice-status ready";return;}
  const voices="speechSynthesis" in window?speechSynthesis.getVoices():[];
  const hasCebuano=voices.some(v=>v.lang.toLowerCase().startsWith("ceb"));
  status.textContent=hasCebuano?"A Cebuano browser voice is available.":"Verified Cebuano audio is not installed yet; Tagalog voice substitution is disabled.";
  status.className=\`voice-status \${hasCebuano?"ready":"warning"}\`;
}`;
  }

  function transformEngine(engine, course, packs) {
    const {modules, moduleMeta, items} = normaliseCourse(course, packs);
    const dialogues = buildDialogues(modules, packs);
    const bossItems = buildBossItems();

    let source = engine;
    source = replaceBlock(source, "const MODULES =", "const MODULE_META =", `const MODULES = ${JSON.stringify(modules, null, 2)};`);
    source = replaceBlock(source, "const MODULE_META =", "const ITEMS =", `const MODULE_META = ${JSON.stringify(moduleMeta, null, 2)};`);
    source = replaceBlock(source, "const ITEMS =", "const DIALOGUES =", `const ITEMS = ${JSON.stringify(items, null, 2)};`);
    source = replaceBlock(source, "const DIALOGUES =", "const BOSS_ITEMS =", `const DIALOGUES = ${JSON.stringify(dialogues, null, 2)};`);
    source = replaceBlock(source, "const BOSS_ITEMS =", "const BADGES =", `const BOSS_ITEMS = ${JSON.stringify(bossItems, null, 2)};`);
    source = replaceBlock(source, "const BADGES =", "const APP_VERSION =", buildBadgesSource());
    source = replaceBlock(source, "async function handsFreeSpeak", "async function startHandsFreeReview", buildHandsFreeSpeechSource());
    source = replaceBlock(source, "async function speakFilipino", "async function checkVoiceService", buildCebuanoSpeechSource());
    source = replaceBlock(source, "async function checkVoiceService", "function toast", buildCebuanoVoiceStatusSource());
    source = source.replace(/const APP_VERSION = "[^"]+";/, 'const APP_VERSION = "5.4.15-bisaya-foundation";');
    source = source.replaceAll("Tagalog", "Bisaya");
    source = source.replaceAll("Taglish", "Bisaya-English");
    source = source.replaceAll(" Filipino", " Cebuano");
    source = source.replaceAll('"fil-PH"', '"ceb-PH"');
    source = source.replaceAll("'fil-PH'", "'ceb-PH'");
    return `${source}\n//# sourceURL=bisaya-app.generated.js`;
  }

  function showError(error) {
    console.error(error);
    const main = document.querySelector(".main-area") || document.body;
    main.innerHTML = `<section style="max-width:680px;margin:40px auto;padding:28px;border:1px solid #e5bcbc;border-radius:18px;background:#fff;color:#713434"><h2 style="margin-top:0">Bisaya course could not be loaded</h2><p>The shared Salita Quest interface is available, but the Cebuano course pack or engine could not be prepared. Reload the page after checking the connection.</p></section>`;
  }

  (async () => {
    try {
      const [courseResponse, engineResponse, packs] = await Promise.all([
        fetch(COURSE_URL, {cache:"no-store"}),
        fetch(ENGINE_URL, {cache:"no-store"}),
        loadModulePacks()
      ]);
      if (!courseResponse.ok) throw new Error(`Cebuano course unavailable (${courseResponse.status})`);
      if (!engineResponse.ok) throw new Error(`Shared engine unavailable (${engineResponse.status})`);

      const course = await courseResponse.json();
      const engine = await engineResponse.text();
      const transformed = transformEngine(engine, course, packs);
      const script = document.createElement("script");
      script.textContent = transformed;
      document.body.appendChild(script);

      await loadScript("./exercise-fixes-v545.js?v=5.4.15-bisaya");
      await loadScript("./profile-app.js?v=5.4.15-bisaya");
    } catch (error) {
      showError(error);
    }
  })();
})();
