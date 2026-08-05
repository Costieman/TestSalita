(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestPlacementOnboardingV1Installed";
  const TEST_LENGTH = 20;
  const LEVELS = ["beginner","A1","A2","A3","B1","B2","B3"];
  const LABELS = {
    beginner:"Complete beginner",
    A1:"A1 · early beginner",
    A2:"A2 · developing beginner",
    A3:"A3 · high beginner",
    B1:"B1 · practical intermediate",
    B2:"B2 · strong intermediate",
    B3:"B3 · advanced within this course"
  };
  let test = null;

  function retry() { window.setTimeout(install, 100); }
  function esc(value) { return String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch])); }
  function shuffle(list) { const copy=[...list]; for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];} return copy; }

  function placementState() {
    const data = state.placement || (state.placement = {});
    data.version = 1;
    data.accessPoints = Number(data.accessPoints || 0);
    data.history = Array.isArray(data.history) ? data.history : [];
    return data;
  }

  function moduleAccessFor(level) {
    const indexMap = {beginner:0,A1:1,A2:2,A3:4,B1:6,B2:7,B3:Math.max(0,MODULES.length-1)};
    const module = MODULES[Math.min(MODULES.length-1,indexMap[level] ?? 0)];
    return Number(module?.unlockAt || 0);
  }

  function inferredExistingLevel() {
    const actual = typeof totalLearningPoints === "function" ? totalLearningPoints() : 0;
    const thresholds = LEVELS.map(level => [level,moduleAccessFor(level)]).sort((a,b)=>a[1]-b[1]);
    let result = "beginner";
    thresholds.forEach(([level,points])=>{ if(actual >= points) result = level; });
    return result;
  }

  function initialiseExistingLearner() {
    const data = placementState();
    if (data.completedAt || data.decision) return;
    const hasHistory = Number(state.totalAnswers || 0) > 0 || Object.keys(state.itemState || {}).length > 0;
    if (!hasHistory) return;
    const level = inferredExistingLevel();
    data.decision = "existing-progress";
    data.selfEstimate = level;
    data.resultLevel = level;
    data.accessPoints = Math.max(data.accessPoints,moduleAccessFor(level));
    data.completedAt = new Date().toISOString();
    data.history.push({kind:"existing-progress",level,at:data.completedAt});
    saveState();
  }

  function ensureModal() {
    let modal = document.getElementById("placementModal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "placementModal";
    modal.className = "placement-modal hidden";
    modal.setAttribute("role","dialog");
    modal.setAttribute("aria-modal","true");
    modal.setAttribute("aria-labelledby","placementTitle");
    modal.innerHTML = `<div class="placement-backdrop"></div><section class="placement-card"><div id="placementContent"></div></section>`;
    document.body.appendChild(modal);
    modal.addEventListener("click", event => {
      if (event.target.closest("[data-placement-close]")) closeModal();
      const levelButton = event.target.closest("[data-placement-level]");
      if (levelButton) chooseLevel(levelButton.dataset.placementLevel);
      if (event.target.closest("[data-placement-start]")) startTest(modal.dataset.selfLevel || "A1");
      const answer = event.target.closest("[data-placement-answer]");
      if (answer) answerQuestion(Number(answer.dataset.placementAnswer));
      if (event.target.closest("[data-placement-apply]")) applyResult();
      if (event.target.closest("[data-placement-beginner]")) chooseBeginner();
    });
    return modal;
  }

  function openModal({retake=false}={}) {
    const modal = ensureModal();
    modal.dataset.retake = retake ? "true" : "false";
    modal.classList.remove("hidden");
    document.body.classList.add("placement-open");
    renderWelcome(retake);
  }

  function closeModal() {
    const data = placementState();
    if (!data.completedAt && document.getElementById("placementModal")?.dataset.retake !== "true") return;
    document.getElementById("placementModal")?.classList.add("hidden");
    document.body.classList.remove("placement-open");
  }

  function content() { return document.getElementById("placementContent"); }

  function renderWelcome(retake=false) {
    const el = content();
    if (!el) return;
    el.innerHTML = `<div class="placement-intro">
      ${retake ? '<button class="placement-close" type="button" data-placement-close aria-label="Close">×</button>' : ''}
      <p class="eyebrow">${retake ? "RECHECK YOUR STARTING POINT" : "WELCOME TO SALITA QUEST"}</p>
      <h2 id="placementTitle">Where should your journey begin?</h2>
      <p>Start from scratch, or choose the band that sounds closest to you. A 20-question check will then recommend a starting point using basic, intermediate and advanced course language.</p>
      <div class="placement-beginner-choice">
        <button class="primary-btn" type="button" data-placement-beginner>I'm a complete beginner</button>
        <small>Starts at the beginning and switches on Complete Beginner mode.</small>
      </div>
      <div class="placement-divider"><span>or estimate your current level</span></div>
      <div class="placement-level-grid">${["A1","A2","A3","B1","B2","B3"].map(level=>`<button type="button" data-placement-level="${level}"><strong>${level}</strong><small>${LABELS[level].split(" · ")[1]}</small></button>`).join("")}</div>
      <p class="placement-note">A3 and B3 are Salita Quest progression bands rather than official CEFR labels. The test does not award XP or mark phrases as mastered.</p>
    </div>`;
  }

  function chooseLevel(level) {
    if (!LEVELS.includes(level) || level === "beginner") return;
    const modal = ensureModal();
    modal.dataset.selfLevel = level;
    content().innerHTML = `<div class="placement-confirm">
      <button class="placement-close" type="button" data-placement-close aria-label="Close">×</button>
      <p class="eyebrow">YOUR ESTIMATE</p>
      <div class="placement-estimate-badge">${esc(level)}</div>
      <h2>${esc(LABELS[level])}</h2>
      <p>The test will contain 20 questions. Your estimate changes the mix, but the final starting point comes from your answers.</p>
      <button class="primary-btn" type="button" data-placement-start>Start placement check</button>
      <button class="text-btn" type="button" data-placement-close>Not now</button>
    </div>`;
  }

  function eligibleItems() {
    return ITEMS.filter(item => {
      const term = String(item.term || item.root || "").trim();
      const meaning = String(item.meaning || item.natural || "").trim();
      return term && meaning && !term.includes("___") && term.length <= 72 && meaning.length <= 96;
    });
  }

  function tierFor(item) {
    const index = Math.max(0,MODULES.findIndex(module=>module.id===item.module));
    if (index <= 2) return "basic";
    if (index <= 5) return "intermediate";
    return "advanced";
  }

  function distribution(level) {
    return {
      A1:{basic:12,intermediate:6,advanced:2},
      A2:{basic:9,intermediate:7,advanced:4},
      A3:{basic:7,intermediate:8,advanced:5},
      B1:{basic:5,intermediate:8,advanced:7},
      B2:{basic:3,intermediate:7,advanced:10},
      B3:{basic:2,intermediate:6,advanced:12}
    }[level] || {basic:9,intermediate:7,advanced:4};
  }

  function distractors(item, direction, pool) {
    const correct = direction === "toEnglish" ? item.meaning : (item.term || item.root);
    const sameTier = pool.filter(candidate => candidate.id !== item.id && tierFor(candidate) === tierFor(item));
    const values = shuffle(sameTier.length >= 3 ? sameTier : pool.filter(candidate=>candidate.id!==item.id))
      .map(candidate => direction === "toEnglish" ? candidate.meaning : (candidate.term || candidate.root))
      .filter(value => value && value !== correct);
    return [...new Set(values)].slice(0,3);
  }

  function buildQuestions(selfLevel) {
    const pool = eligibleItems();
    const byTier = {basic:[],intermediate:[],advanced:[]};
    pool.forEach(item=>byTier[tierFor(item)].push(item));
    const requested = distribution(selfLevel);
    const selected = [];
    Object.entries(requested).forEach(([tier,count])=>selected.push(...shuffle(byTier[tier]).slice(0,count)));
    while (selected.length < TEST_LENGTH) {
      const candidate = shuffle(pool).find(item=>!selected.some(existing=>existing.id===item.id));
      if (!candidate) break;
      selected.push(candidate);
    }
    return shuffle(selected.slice(0,TEST_LENGTH)).map((item,index)=>{
      const direction = index % 2 === 0 ? "toEnglish" : "toFilipino";
      const prompt = direction === "toEnglish" ? (item.term || item.root) : item.meaning;
      const correct = direction === "toEnglish" ? item.meaning : (item.term || item.root);
      return {item,direction,prompt,correct,choices:shuffle([correct,...distractors(item,direction,pool)]),tier:tierFor(item)};
    });
  }

  function startTest(selfLevel) {
    test = {selfLevel,questions:buildQuestions(selfLevel),index:0,answers:[],startedAt:new Date().toISOString()};
    renderQuestion();
  }

  function renderQuestion() {
    const question = test?.questions[test.index];
    if (!question) { renderResult(); return; }
    const directionLabel = question.direction === "toEnglish" ? "Choose the English meaning" : "Choose the Filipino phrase";
    content().innerHTML = `<div class="placement-test">
      <div class="placement-test-head"><span>${test.index+1} / ${test.questions.length}</span><strong>${esc(directionLabel)}</strong></div>
      <div class="placement-test-progress"><span style="width:${(test.index/test.questions.length)*100}%"></span></div>
      <p class="placement-tier">${question.tier.toUpperCase()} SAMPLE</p>
      <h2>${esc(question.prompt)}</h2>
      <div class="placement-answer-grid">${question.choices.map((choice,index)=>`<button type="button" data-placement-answer="${index}">${esc(choice)}</button>`).join("")}</div>
      <p class="placement-note">No XP or mastery is awarded during placement.</p>
    </div>`;
  }

  function answerQuestion(index) {
    const question = test?.questions[test.index];
    if (!question) return;
    const chosen = question.choices[index];
    test.answers.push({id:question.item.id,tier:question.tier,correct:chosen===question.correct});
    test.index += 1;
    renderQuestion();
  }

  function calculateResult() {
    const weights = {basic:1,intermediate:1.5,advanced:2};
    const earned = test.answers.reduce((sum,answer)=>sum+(answer.correct?weights[answer.tier]:0),0);
    const possible = test.answers.reduce((sum,answer)=>sum+weights[answer.tier],0) || 1;
    const pct = Math.round(earned/possible*100);
    const advancedCorrect = test.answers.filter(answer=>answer.tier==="advanced"&&answer.correct).length;
    let level = pct < 18 ? "beginner" : pct < 35 ? "A1" : pct < 50 ? "A2" : pct < 63 ? "A3" : pct < 75 ? "B1" : pct < 87 ? "B2" : "B3";
    if (level === "B3" && advancedCorrect < 7) level = "B2";
    if (level === "B2" && advancedCorrect < 4) level = "B1";
    return {level,pct,correct:test.answers.filter(answer=>answer.correct).length};
  }

  function renderResult() {
    const result = calculateResult();
    test.result = result;
    const module = MODULES.filter(item=>Number(item.unlockAt||0)<=moduleAccessFor(result.level)).at(-1) || MODULES[0];
    content().innerHTML = `<div class="placement-result">
      <p class="eyebrow">PLACEMENT COMPLETE</p>
      <div class="placement-result-level">${esc(result.level === "beginner" ? "START" : result.level)}</div>
      <h2>${esc(LABELS[result.level])}</h2>
      <p>You answered <strong>${result.correct} of ${test.questions.length}</strong> correctly. Your recommended access point is <strong>${esc(module.title)}</strong>.</p>
      <div class="placement-result-notes"><span>✓ No XP added</span><span>✓ No false mastery</span><span>✓ Earlier regions remain available</span></div>
      <button class="primary-btn" type="button" data-placement-apply>Use this starting point</button>
    </div>`;
  }

  function applyPlacement(level,{kind="test",score=null,selfEstimate=null}={}) {
    const data = placementState();
    const now = new Date().toISOString();
    data.decision = kind;
    data.selfEstimate = selfEstimate;
    data.resultLevel = level;
    data.score = score;
    data.accessPoints = moduleAccessFor(level);
    data.completedAt = now;
    data.history.push({kind,level,score,selfEstimate,at:now});
    state.settings.beginnerMode = level === "beginner";
    if (state.settings.beginnerMode) {
      state.settings.newItems = 2;
      state.settings.sessionLength = 8;
      state.settings.preferProduction = false;
    }
    saveState();
    if (typeof syncSettings === "function") syncSettings();
    if (typeof updateAll === "function") updateAll();
    closeModal();
    try { if (typeof toast === "function") toast(level === "beginner" ? "Complete Beginner mode is ready." : `Placement saved: ${level}.`); } catch {}
  }

  function chooseBeginner() { applyPlacement("beginner",{kind:"beginner-choice"}); }
  function applyResult() { if(test?.result) applyPlacement(test.result.level,{kind:"placement-test",score:test.result.pct,selfEstimate:test.selfLevel}); }

  function ensureSettingsCard() {
    const settingsView = document.getElementById("settingsView");
    if (!settingsView || document.getElementById("placementSettingsCard")) return;
    const card = document.createElement("article");
    card.id = "placementSettingsCard";
    card.className = "panel placement-settings-card";
    card.innerHTML = `<div><p class="eyebrow">STARTING POINT</p><h3>Placement and beginner mode</h3><p id="placementSettingsSummary"></p></div><button class="secondary-btn" type="button" data-retake-placement>Take placement test</button>`;
    const firstPanel = settingsView.querySelector(".panel");
    if (firstPanel) firstPanel.insertAdjacentElement("afterend",card); else settingsView.appendChild(card);
    card.querySelector("[data-retake-placement]").addEventListener("click",()=>openModal({retake:true}));
  }

  function updateSettingsCard() {
    ensureSettingsCard();
    const data = placementState();
    const summary = document.getElementById("placementSettingsSummary");
    if (!summary) return;
    summary.textContent = state.settings.beginnerMode
      ? "Complete Beginner mode is on. New language is introduced slowly from the first region."
      : `Current placement: ${LABELS[data.resultLevel] || "not yet assessed"}. Retaking the test changes content access, not existing mastery.`;
  }

  function install() {
    try {
      if (typeof state === "undefined" || typeof ITEMS === "undefined" || typeof MODULES === "undefined" || typeof saveState !== "function" || typeof unlockedModules !== "function") { retry(); return; }
    } catch { retry(); return; }
    if (window[INSTALL_FLAG]) return;
    window[INSTALL_FLAG] = true;

    initialiseExistingLearner();
    const baseUnlockedModules = unlockedModules;
    unlockedModules = function unlockedModulesWithPlacementAccess() {
      const actual = typeof totalLearningPoints === "function" ? totalLearningPoints() : 0;
      const access = Number(placementState().accessPoints || 0);
      const threshold = Math.max(actual,access);
      return MODULES.filter(module=>threshold >= Number(module.unlockAt || 0));
    };
    unlockedModules.baseWithoutPlacement = baseUnlockedModules;

    const baseSyncSettings = typeof syncSettings === "function" ? syncSettings : null;
    if (baseSyncSettings) {
      syncSettings = function syncSettingsWithPlacement() {
        const result = baseSyncSettings.apply(this,arguments);
        updateSettingsCard();
        return result;
      };
    }

    const beginner = document.getElementById("beginnerSetting");
    beginner?.addEventListener("change", event => {
      window.setTimeout(()=>{
        updateSettingsCard();
        if (!event.target.checked) openModal({retake:true});
      },0);
    });

    ensureSettingsCard();
    updateSettingsCard();
    const data = placementState();
    if (!data.completedAt) window.setTimeout(()=>openModal({retake:false}),650);
  }

  install();
})();
