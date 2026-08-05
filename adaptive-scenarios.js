(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestAdaptiveScenariosInstalled";
  const QUESTIONS_PER_SCENARIO = 5;

  const SCENARIOS = [
    {
      id:"first-meeting",
      icon:"👋",
      title:"First Meeting",
      description:"Greet someone, introduce yourself, share where you are from, and respond naturally.",
      modules:["greetings","introductions","origin","wellbeing"],
      setting:"You are meeting someone for the first time."
    },
    {
      id:"asking-help",
      icon:"❓",
      title:"Asking for Help",
      description:"Say that you do not understand, ask for repetition, and clarify a word or place.",
      modules:["questions","greetings"],
      setting:"A conversation becomes difficult and you need help."
    },
    {
      id:"finding-place",
      icon:"🧭",
      title:"Finding Your Way",
      description:"Ask where something is, understand a location, and keep the exchange moving.",
      modules:["questions","origin","grammar"],
      setting:"You are looking for a person or place in an unfamiliar area."
    },
    {
      id:"market-visit",
      icon:"🧺",
      title:"Market Visit",
      description:"Ask what is available, state what you want, ask the price, and complete a purchase.",
      modules:["food","questions"],
      setting:"You are buying food and drinks at a busy market."
    },
    {
      id:"home-visit",
      icon:"🏠",
      title:"Visiting a Home",
      description:"Talk about where people and things are and respond politely inside a home.",
      modules:["origin","grammar","greetings"],
      setting:"A friend has invited you into their home."
    },
    {
      id:"making-plans",
      icon:"📅",
      title:"Making Plans",
      description:"Use actions, time expressions, and particles to discuss what happens next.",
      modules:["verbs","grammar","questions"],
      setting:"You and a friend are deciding what to do later."
    },
    {
      id:"spanish-square",
      icon:"🟠",
      title:"Spanish Connections",
      description:"Recognise and use familiar Spanish-origin vocabulary inside Filipino grammar.",
      modules:["spanish","greetings","food"],
      setting:"You are chatting in a plaza where familiar borrowed words appear naturally."
    },
    {
      id:"mixed-workday",
      icon:"💼",
      title:"Natural Mixed Conversation",
      description:"Navigate a practical work-style exchange using natural mixed language and Filipino structure.",
      modules:["taglish","verbs","questions"],
      setting:"A colleague asks for an update and you respond naturally."
    },
    {
      id:"day-out",
      icon:"🌆",
      title:"A Full Day Out",
      description:"Combine greetings, directions, food, actions, and follow-up questions in one challenge.",
      modules:["greetings","questions","food","verbs"],
      setting:"You spend a day meeting people, travelling, and buying what you need."
    }
  ];

  function retry() {
    window.setTimeout(install, 90);
  }

  function practicedItems(moduleIds) {
    const allowed = new Set(moduleIds);
    return ITEMS.filter(item =>
      allowed.has(item.module) &&
      Number(state.itemState?.[item.id]?.seen || 0) > 0 &&
      (item.example || item.term || item.root) &&
      (item.natural || item.meaning)
    );
  }

  function scenarioAvailability(scenario) {
    const availableModules = scenario.modules.filter(moduleId => ITEMS.some(item => item.module === moduleId));
    const byModule = Object.fromEntries(availableModules.map(moduleId => [moduleId, practicedItems([moduleId]).length]));
    const total = practicedItems(availableModules).length;
    const primaryReady = availableModules.slice(0, 2).every(moduleId => Number(byModule[moduleId] || 0) >= 2);
    const unlocked = availableModules.length >= 2 && primaryReady && total >= QUESTIONS_PER_SCENARIO;
    return {unlocked, total, availableModules, byModule};
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function shuffled(values) {
    const copy = [...values];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const other = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[other]] = [copy[other], copy[index]];
    }
    return copy;
  }

  function phrase(item) {
    return String(item.example || item.term || item.root || "").trim();
  }

  function meaning(item) {
    return String(item.natural || item.meaning || "").trim();
  }

  function buildScenarioQueue(scenario) {
    const pool = practicedItems(scenario.modules);
    if (pool.length < QUESTIONS_PER_SCENARIO) return [];

    const selected = [];
    scenario.modules.forEach(moduleId => {
      const candidate = shuffled(pool.filter(item => item.module === moduleId && !selected.includes(item)))[0];
      if (candidate) selected.push(candidate);
    });
    shuffled(pool).forEach(item => {
      if (selected.length < QUESTIONS_PER_SCENARIO && !selected.includes(item)) selected.push(item);
    });

    const finalItems = selected.slice(0, QUESTIONS_PER_SCENARIO);
    const phrasePool = unique(pool.map(phrase));
    const meaningPool = unique(pool.map(meaning));

    return finalItems.map((item, index) => {
      const targetPhrase = phrase(item);
      const targetMeaning = meaning(item);
      const asksForPhrase = index % 2 === 0;
      if (asksForPhrase) {
        const distractors = shuffled(phrasePool.filter(value => value !== targetPhrase)).slice(0, 2);
        return {
          id:`scenario_${scenario.id}_${index}_${item.id}`,
          prompt:`${scenario.setting} You need to communicate: “${targetMeaning}”`,
          context:"Choose the phrase that best fits this moment.",
          answers:[targetPhrase],
          choices:shuffled([targetPhrase, ...distractors]),
          hint:item.hint || "Choose the phrase you have already practised.",
          explanation:`A natural answer here is: ${targetPhrase}`,
          audio:null,
          itemId:item.id
        };
      }

      const distractors = shuffled(meaningPool.filter(value => value !== targetMeaning)).slice(0, 2);
      return {
        id:`scenario_${scenario.id}_${index}_${item.id}`,
        prompt:`${scenario.setting} Someone says: “${targetPhrase}”`,
        context:"Choose what the speaker means in this situation.",
        answers:[targetMeaning],
        choices:shuffled([targetMeaning, ...distractors]),
        hint:item.hint || "Recall the meaning from your earlier practice.",
        explanation:`“${targetPhrase}” means “${targetMeaning}.”`,
        audio:targetPhrase,
        itemId:item.id
      };
    });
  }

  function ensureProgress() {
    if (!state.scenarioProgress || typeof state.scenarioProgress !== "object") state.scenarioProgress = {};
    return state.scenarioProgress;
  }

  function startScenario(scenario) {
    const availability = scenarioAvailability(scenario);
    if (!availability.unlocked) {
      toast("Practise more of the related topics before starting this scenario.");
      return;
    }

    const queue = buildScenarioQueue(scenario);
    if (queue.length < QUESTIONS_PER_SCENARIO) {
      toast("This scenario needs five practised phrases before it can begin.");
      return;
    }

    session = {
      mode:"boss",
      label:`Scenario · ${scenario.title}`,
      scenarioId:scenario.id,
      scenarioTitle:scenario.title,
      queue,
      index:0,
      xp:0,
      correct:0,
      answered:0,
      combo:0,
      boss:true
    };
    switchView("learn");
    loadBossExercise();
  }

  function scenarioRequirementText(scenario, availability) {
    const firstTwo = availability.availableModules.slice(0, 2).map(moduleId => {
      const module = MODULES.find(item => item.id === moduleId);
      return `${module?.title || moduleId}: ${Math.min(2, availability.byModule[moduleId] || 0)}/2`;
    });
    return firstTwo.join(" · ") || "More lesson content is coming soon";
  }

  function renderScenarios() {
    const grid = document.getElementById("adaptiveScenarioGrid");
    if (!grid) return;
    const progress = ensureProgress();

    grid.innerHTML = SCENARIOS.map((scenario, index) => {
      const availability = scenarioAvailability(scenario);
      const record = progress[scenario.id] || {};
      const best = Number(record.bestPercent || 0);
      const status = record.passed ? `Cleared · ${best}% best` : availability.unlocked ? `${availability.total} learned phrases ready` : scenarioRequirementText(scenario, availability);
      const moduleNames = availability.availableModules.map(moduleId => MODULES.find(item => item.id === moduleId)?.title || moduleId);
      return `<article class="adaptive-scenario-card ${availability.unlocked ? "unlocked" : "locked"} ${record.passed ? "passed" : ""}">
        <div class="adaptive-scenario-number">${index + 1}</div>
        <div class="adaptive-scenario-icon" aria-hidden="true">${availability.unlocked ? scenario.icon : "🔒"}</div>
        <div class="adaptive-scenario-copy">
          <p class="eyebrow">Scenario ${index + 1}</p>
          <h3>${escapeHTML(scenario.title)}</h3>
          <p>${escapeHTML(scenario.description)}</p>
          <div class="adaptive-scenario-topics">${moduleNames.map(name => `<span>${escapeHTML(name)}</span>`).join("")}</div>
          <small>${escapeHTML(status)}</small>
        </div>
        <button class="${availability.unlocked ? "primary-btn" : "secondary-btn"}" type="button" data-scenario-id="${scenario.id}" ${availability.unlocked ? "" : "disabled"}>${record.passed ? "Play again" : "Start scenario"}</button>
      </article>`;
    }).join("");
  }

  function rebuildBossView() {
    const view = document.getElementById("bossView");
    if (!view) return false;
    view.innerHTML = `
      <section class="adaptive-scenario-hero">
        <div>
          <p class="eyebrow">Conversation gates</p>
          <h2>Practise real situations</h2>
          <p>Each scenario uses only language this learner has already encountered. New situations unlock as relevant topics become familiar.</p>
        </div>
        <div class="adaptive-scenario-summary"><strong>${SCENARIOS.length}</strong><span>adaptive situations</span></div>
      </section>
      <section id="adaptiveScenarioGrid" class="adaptive-scenario-grid" aria-label="Conversation scenarios"></section>
      <div class="adaptive-scenario-compat" hidden>
        <span id="bossStatus"></span>
        <button id="startBossBtn" type="button"></button>
        <p id="bossUnlockNote"></p>
      </div>`;

    view.addEventListener("click", event => {
      const button = event.target.closest("[data-scenario-id]");
      if (!button) return;
      const scenario = SCENARIOS.find(item => item.id === button.dataset.scenarioId);
      if (scenario) startScenario(scenario);
    });
    return true;
  }

  function install() {
    try {
      if (
        typeof state === "undefined" ||
        typeof ITEMS === "undefined" ||
        typeof MODULES === "undefined" ||
        typeof session === "undefined" ||
        typeof currentExercise === "undefined" ||
        typeof switchView !== "function" ||
        typeof renderExercise !== "function" ||
        typeof loadBossExercise !== "function" ||
        typeof finishSession !== "function" ||
        typeof updateBoss !== "function" ||
        typeof saveState !== "function"
      ) {
        retry();
        return;
      }
    } catch {
      retry();
      return;
    }

    if (window[INSTALL_FLAG]) return;
    window[INSTALL_FLAG] = true;
    ensureProgress();
    rebuildBossView();

    loadBossExercise = function loadAdaptiveScenarioExercise() {
      if (!session || session.index >= session.queue.length) {
        finishSession();
        return;
      }
      const question = session.queue[session.index];
      currentExercise = {
        item:{id:question.itemId || question.id, module:"boss", origin:"Mixed"},
        mode:"boss",
        type:`Scenario ${session.index + 1} of ${session.queue.length}`,
        prompt:question.prompt,
        context:question.context || "Choose the most natural response.",
        answers:question.answers,
        hint:question.hint,
        explanation:question.explanation,
        choices:question.choices,
        audio:question.audio || null
      };
      selectedChoice = null;
      renderExercise(currentExercise);
      const moduleLabel = document.getElementById("lessonModule");
      if (moduleLabel) moduleLabel.textContent = session.scenarioTitle || session.label || "Conversation Scenario";
    };

    const baseRenderExercise = renderExercise;
    renderExercise = function renderExerciseWithScenarioTitle(exercise) {
      const result = baseRenderExercise.apply(this, arguments);
      if (session?.boss && session?.scenarioTitle) {
        const moduleLabel = document.getElementById("lessonModule");
        if (moduleLabel) moduleLabel.textContent = session.scenarioTitle;
      }
      return result;
    };

    const baseFinishSession = finishSession;
    finishSession = function finishAdaptiveScenario() {
      const scenarioId = session?.scenarioId;
      const scenarioTitle = session?.scenarioTitle;
      const answered = Number(session?.answered || 0);
      const correct = Number(session?.correct || 0);
      const percent = answered ? Math.round(correct / answered * 100) : 0;
      const result = baseFinishSession.apply(this, arguments);

      if (scenarioId) {
        const progress = ensureProgress();
        const previous = progress[scenarioId] || {attempts:0,bestPercent:0,passed:false};
        progress[scenarioId] = {
          attempts:Number(previous.attempts || 0) + 1,
          bestPercent:Math.max(Number(previous.bestPercent || 0), percent),
          passed:Boolean(previous.passed || percent >= 80),
          lastPlayedAt:new Date().toISOString()
        };
        saveState();
        renderScenarios();

        const title = document.getElementById("sessionCompleteTitle");
        const message = document.getElementById("sessionCompleteMessage");
        if (title) title.textContent = percent >= 80 ? `${scenarioTitle} cleared!` : `${scenarioTitle} practised`;
        if (message) message.textContent = percent >= 80
          ? "You handled this situation successfully. New scenarios will use more of your learned language."
          : "Review the missed phrases and try this situation again when they return.";
      }
      return result;
    };

    const baseUpdateBoss = updateBoss;
    updateBoss = function updateAdaptiveScenarios() {
      try { baseUpdateBoss.apply(this, arguments); } catch {}
      renderScenarios();
    };

    renderScenarios();
  }

  install();
})();