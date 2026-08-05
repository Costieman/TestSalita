(() => {
  "use strict";

  const FLAG = "__salitaQuestLevelProgressionV2Installed";
  const RELEASE = "5.5.3";
  const VERSION = 3;
  const MAX_LEVEL = 99;
  const RANKS = [
    [1,"Starter","Build your first conversational habits."],
    [5,"Explorer","Recognise familiar language across useful situations."],
    [10,"Connector","Link phrases into practical exchanges."],
    [20,"Navigator","Retrieve useful language with growing flexibility."],
    [30,"Conversation Builder","Sustain longer and more varied exchanges."],
    [40,"Language Pathfinder","Choose language confidently across situations."],
    [55,"Fluency Climber","Develop speed, depth, and durable recall."],
    [70,"Confident Speaker","Respond naturally with a broad active toolkit."],
    [85,"Master Communicator","Maintain accurate, flexible communication."],
    [99,"Salita Legend","The summit of the Salita Quest learning journey."]
  ];
  let celebrationTimer = 0;

  const clampLevel = value => Math.max(1,Math.min(MAX_LEVEL,Math.floor(Number(value)||1)));
  const requirementFor = level => {
    const safe = Math.max(1,Math.min(MAX_LEVEL-1,Number(level)||1));
    return Math.round(180+8*safe+.12*safe*safe);
  };
  const rankFor = level => RANKS.reduce((rank,candidate)=>level>=candidate[0]?candidate:rank,RANKS[0]);
  const homeActive = () => Boolean(document.getElementById("homeView")?.classList.contains("active")) && document.body.dataset.currentView === "home";
  const save = reason => {
    try { saveState(); } catch {}
    document.dispatchEvent(new CustomEvent("salita:level-progression-saved",{detail:{reason,release:RELEASE}}));
  };

  function calculateFrom(system) {
    let level = system.baseLevel;
    let remaining = Math.max(0,Number(state.xp||0)-system.baseXp);
    while (level < MAX_LEVEL && remaining >= requirementFor(level)) {
      remaining -= requirementFor(level);
      level += 1;
    }
    const rank = rankFor(level);
    if (level === MAX_LEVEL) return {level,title:rank[1],subtitle:rank[2],inLevel:0,requirement:0,toNext:0,progressPercent:100,maxed:true};
    const requirement = requirementFor(level);
    return {level,title:rank[1],subtitle:rank[2],inLevel:Math.floor(remaining),requirement,toNext:Math.max(0,requirement-Math.floor(remaining)),progressPercent:Math.max(0,Math.min(100,remaining/requirement*100)),maxed:false};
  }

  function newSystem() {
    const xp = Math.max(0,Number(state.xp||0));
    const level = clampLevel(Math.floor(xp/250)+1);
    const equivalent = level===MAX_LEVEL ? 0 : Math.round(((xp%250)/250)*requirementFor(level));
    return {version:VERSION,baseLevel:level,baseXp:Math.max(0,xp-equivalent),lastKnownLevel:level,lastCelebratedLevel:level,levelUpsSeen:{[level]:true},pendingLevelUp:null,migratedAt:new Date().toISOString()};
  }

  function ensureSystem() {
    let system = state.levelProgressionV2;
    if (!system || typeof system !== "object") {
      system = newSystem();
      state.levelProgressionV2 = system;
      save("create_level_system");
      return system;
    }
    let changed = false;
    if (system.version !== VERSION) {
      const celebrated = clampLevel(system.lastCelebratedLevel||system.baseLevel||1);
      system.version = VERSION;
      system.levelUpsSeen = system.levelUpsSeen && typeof system.levelUpsSeen === "object" && !Array.isArray(system.levelUpsSeen) ? system.levelUpsSeen : {};
      for (let level=1; level<=celebrated; level+=1) system.levelUpsSeen[level] = true;
      system.governanceMigratedAt = new Date().toISOString();
      changed = true;
    }
    system.baseLevel = clampLevel(system.baseLevel);
    system.baseXp = Math.max(0,Number(system.baseXp||0));
    system.lastKnownLevel = clampLevel(system.lastKnownLevel||system.baseLevel);
    system.lastCelebratedLevel = clampLevel(system.lastCelebratedLevel||system.baseLevel);
    if (!system.levelUpsSeen || typeof system.levelUpsSeen !== "object" || Array.isArray(system.levelUpsSeen)) {
      system.levelUpsSeen = {};
      changed = true;
    }
    if (changed) save("migrate_level_governance");
    return system;
  }

  function calculateLevel() { return calculateFrom(ensureSystem()); }

  function sanitiseSystem(info=calculateLevel(),reason="runtime") {
    const system = ensureSystem();
    const actual = clampLevel(info.level);
    let changed = false;
    if (system.lastKnownLevel > actual) { system.lastKnownLevel=actual; changed=true; }
    if (system.lastCelebratedLevel > actual) { system.lastCelebratedLevel=actual; changed=true; }
    Object.keys(system.levelUpsSeen).forEach(key=>{
      const level=Number(key);
      if (!Number.isInteger(level)||level<1||level>actual||system.levelUpsSeen[key]!==true) { delete system.levelUpsSeen[key]; changed=true; }
    });
    const entries = (Array.isArray(system.pendingLevelUp)?system.pendingLevelUp:[system.pendingLevelUp]).filter(Boolean)
      .map(entry=>({from:clampLevel(entry.from||system.lastCelebratedLevel),to:clampLevel(entry.to),queuedAt:entry.queuedAt||new Date().toISOString()}))
      .filter(entry=>entry.from<entry.to&&entry.to<=actual&&system.levelUpsSeen[entry.to]!==true);
    const pending = entries.length ? {from:Math.min(...entries.map(entry=>entry.from)),to:Math.max(...entries.map(entry=>entry.to)),queuedAt:entries.map(entry=>entry.queuedAt).sort()[0]} : null;
    if (JSON.stringify(pending)!==JSON.stringify(system.pendingLevelUp||null)) { system.pendingLevelUp=pending; changed=true; }
    if (changed) save(`sanitise_${reason}`);
    return system;
  }

  function queueLevelUp(info) {
    const system = sanitiseSystem(info,"before_queue");
    if (info.level <= system.lastKnownLevel) return false;
    const from = system.pendingLevelUp?.from || system.lastKnownLevel;
    system.lastKnownLevel = info.level;
    if (system.levelUpsSeen[info.level] !== true) system.pendingLevelUp={from,to:info.level,queuedAt:system.pendingLevelUp?.queuedAt||new Date().toISOString()};
    save("queue_level_up");
    return true;
  }

  function acknowledgeLevel(pending) {
    const system = ensureSystem();
    const target = clampLevel(pending.to);
    system.levelUpsSeen[target] = true;
    if (system.pendingLevelUp && clampLevel(system.pendingLevelUp.to)<=target) system.pendingLevelUp=null;
    system.lastKnownLevel=Math.max(system.lastKnownLevel,target);
    system.lastCelebratedLevel=Math.max(system.lastCelebratedLevel,target);
    system.lastCelebrationAcknowledgedAt=new Date().toISOString();
    system.lastCelebrationAcknowledgedBy=RELEASE;
    save("acknowledge_before_level_popup");
  }

  function updateLevelUI(info) {
    const labels={levelValue:info.maxed?"Level 99 · MAX":`Level ${info.level}`,playerLevelTitle:info.title,playerLevelSubtitle:info.subtitle,playerXpText:info.maxed?"Maximum level reached":`${info.inLevel} / ${info.requirement} XP`,playerXpRemaining:info.maxed?"Level 99 summit":`${info.toNext} to next level`,progressLevelTitle:`Level ${info.level} · ${info.title}`};
    Object.entries(labels).forEach(([id,value])=>{const node=document.getElementById(id);if(node)node.textContent=value;});
    ["levelBar","playerXpBar","progressXpBar"].forEach(id=>{const node=document.getElementById(id);if(node)node.style.width=`${info.maxed?100:info.progressPercent}%`;});
    const badge=document.getElementById("playerLevelBadge");
    if (badge) { badge.textContent=String(info.level); badge.dataset.digits=String(String(info.level).length); badge.classList.toggle("max-level",info.maxed); }
    document.body.dataset.learnerLevel=String(info.level);
  }

  async function renderCelebration(pending) {
    const emblem=[...document.querySelectorAll(".sq-profile-emblem-trigger")].find(node=>node.getBoundingClientRect().width>0);
    const imageSource=emblem?.querySelector("img")?.src||document.querySelector(".player-avatar img")?.src||"avatars/tarsier.png";
    const layer=document.createElement("div");
    layer.className="level-up-celebration";
    layer.setAttribute("aria-live","polite");
    layer.innerHTML=`<div class="level-up-backdrop"></div><div class="level-up-rays" aria-hidden="true"></div><div class="level-up-banner"><span>LEVEL UP!</span><strong>Level ${pending.to}</strong><small>${rankFor(pending.to)[1]}</small></div><div class="level-up-avatar"><img src="${imageSource}" alt=""><b>${pending.to}</b></div>`;
    const image=layer.querySelector("img");
    if(image)image.addEventListener("error",()=>{image.src="avatars/tarsier.png";},{once:true});
    document.body.appendChild(layer);
    requestAnimationFrame(()=>layer.classList.add("show"));
    await new Promise(resolve=>window.setTimeout(resolve,1700));
    layer.classList.add("leaving");
    await new Promise(resolve=>window.setTimeout(resolve,420));
    layer.remove();
    emblem?.classList.add("level-up-emblem-impact");
    window.setTimeout(()=>emblem?.classList.remove("level-up-emblem-impact"),900);
  }

  function profileScope() {
    return `${sessionStorage.getItem("salitaQuestActiveProfileId")||"anonymous"}:${document.body.dataset.course||sessionStorage.getItem("salitaQuestActiveCourse")||"tagalog"}`;
  }

  function requestCelebration() {
    const governor=window.SalitaPopupGovernor;
    if (!governor||!homeActive()) return;
    const system=sanitiseSystem(calculateLevel(),"request");
    const pending=system.pendingLevelUp;
    if (!pending||system.levelUpsSeen[pending.to]===true) return;
    governor.enqueue({key:`level:${profileScope()}:${pending.to}`,type:"level_up",priority:100,homeOnly:true,isAcknowledged:()=>ensureSystem().levelUpsSeen[pending.to]===true,acknowledge:()=>acknowledgeLevel(pending),show:()=>renderCelebration(pending)});
  }
  function scheduleCelebration(delay=450) { window.clearTimeout(celebrationTimer); celebrationTimer=window.setTimeout(requestCelebration,delay); }

  function install() {
    try {
      if (typeof state==="undefined"||typeof levelInfo!=="function"||typeof updateGlobalUI!=="function"||typeof switchView!=="function"||typeof saveState!=="function"||!window.SalitaPopupGovernor) { window.setTimeout(install,80); return; }
    } catch { window.setTimeout(install,80); return; }
    if (window[FLAG]) return;
    window[FLAG]=true;
    ensureSystem();
    levelInfo=calculateLevel;
    const baseUpdate=updateGlobalUI;
    updateGlobalUI=function(){const result=baseUpdate.apply(this,arguments);const info=calculateLevel();const changed=queueLevelUp(info);updateLevelUI(info);document.dispatchEvent(new CustomEvent("salita:level-updated",{detail:{level:info.level,changed,release:RELEASE}}));if((changed||ensureSystem().pendingLevelUp)&&homeActive())scheduleCelebration();return result;};
    const baseSwitch=switchView;
    switchView=function(view){const result=baseSwitch.apply(this,arguments);document.dispatchEvent(new CustomEvent("salita:view-changed",{detail:{view}}));if(view==="home")scheduleCelebration(350);return result;};
    const version=document.querySelector(".version-label");
    if(version)version.textContent=document.body.dataset.course==="cebuano"?"Bisaya Foundation 0.3 · Governed rewards 5.5.3":"Version 5.5.3 · Governed rewards";
    updateGlobalUI();
    if(homeActive())scheduleCelebration(650);
    window.SalitaLevelProgression=Object.freeze({version:VERSION,release:RELEASE,calculate:calculateLevel,sanitise:()=>sanitiseSystem(calculateLevel(),"manual"),requestCelebration});
  }
  install();
})();
