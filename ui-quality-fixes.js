(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestQualityFixesInstalled";

  function retryInstall() {
    window.setTimeout(installQualityFixes, 60);
  }

  function installQualityFixes() {
    try {
      if (
        typeof state === "undefined" ||
        typeof DEFAULT_STATE === "undefined" ||
        typeof DAILY_QUESTS === "undefined" ||
        typeof ensureDailyActivity !== "function" ||
        typeof renderDailyQuests !== "function" ||
        typeof finishSession !== "function" ||
        typeof showAnswerPop !== "function" ||
        typeof renderFeedback !== "function"
      ) {
        retryInstall();
        return;
      }
    } catch {
      retryInstall();
      return;
    }

    if (window[INSTALL_FLAG]) return;
    window[INSTALL_FLAG] = true;

    DEFAULT_STATE.dailyActivity = {
      ...(DEFAULT_STATE.dailyActivity || {}),
      quickReviews: Number(DEFAULT_STATE.dailyActivity?.quickReviews || 0)
    };

    const baseEnsureDailyActivity = ensureDailyActivity;
    ensureDailyActivity = function ensureDailyActivityWithQuickReviews() {
      const activity = baseEnsureDailyActivity();
      const current = Number(activity.quickReviews);
      activity.quickReviews = Number.isFinite(current) ? current : 0;
      return activity;
    };

    ensureDailyActivity();

    if (!DAILY_QUESTS.some(quest => quest.id === "quick_twice")) {
      DAILY_QUESTS.push({
        id: "quick_twice",
        icon: "⚡",
        title: "Complete 2 Quick Reviews",
        detail: "Finish two short Quick Review sessions today.",
        target: 2,
        reward: 15,
        metric: activity => Number(activity.quickReviews || 0)
      });
    }

    const baseRenderDailyQuests = renderDailyQuests;
    renderDailyQuests = function renderDailyQuestsWithQuickReviewGoal() {
      baseRenderDailyQuests();
      const activity = ensureDailyActivity();
      const completed = DAILY_QUESTS.filter(quest => activity.questsClaimed.includes(quest.id)).length;
      const score = document.getElementById("dailyQuestScore");
      if (score) score.textContent = `${completed}/${DAILY_QUESTS.length}`;
      const chestTitle = document.getElementById("questChestTitle");
      if (chestTitle && !activity.chestClaimed) chestTitle.textContent = `Complete all ${DAILY_QUESTS.length} quests`;
    };

    const baseFinishSession = finishSession;
    finishSession = function finishSessionWithQuickReviewTracking() {
      if (session?.mode === "quick") {
        const activity = ensureDailyActivity();
        activity.quickReviews = Number(activity.quickReviews || 0) + 1;
      }
      return baseFinishSession();
    };

    function flashCorrectSelection() {
      const targets = [];
      const selectedChoice = document.querySelector(".choice-btn.selected");
      if (selectedChoice) targets.push(selectedChoice);

      const sentenceBuilder = document.getElementById("sentenceBuilder");
      if (sentenceBuilder && !sentenceBuilder.classList.contains("hidden")) {
        const builtSentence = sentenceBuilder.querySelector(".built-sentence");
        if (builtSentence) targets.push(builtSentence);
        targets.push(...sentenceBuilder.querySelectorAll(".selected-word-tile"));
      }

      const answerInput = document.getElementById("answerInput");
      if (answerInput && !answerInput.classList.contains("hidden")) targets.push(answerInput);

      targets.forEach(target => {
        target.classList.remove("answer-correct-flash");
        void target.offsetWidth;
        target.classList.add("answer-correct-flash");
        window.setTimeout(() => target.classList.remove("answer-correct-flash"), 950);
      });
    }

    const baseShowAnswerPop = showAnswerPop;
    showAnswerPop = function showAnswerPopWithLightFlash(xpGain, combo) {
      baseShowAnswerPop(xpGain, combo);
      flashCorrectSelection();
    };

    const COMMON_DIRECT_GLOSSES = {
      ako: "I", ko: "I / my", ikaw: "you", ka: "you", mo: "your / by you", siya: "he / she",
      kami: "we (not you)", kita: "we (including you)", kamo: "you all", sila: "they",
      ang: "subject marker", ng: "object marker", og: "object marker", ug: "and / object marker", sa: "at / in / to",
      si: "personal-name marker", mga: "plural marker", ba: "question marker", na: "already / now", pa: "still / yet",
      lang: "only / just", ra: "only / just", rin: "also / too", din: "also / too", pud: "also / too", sad: "also / too",
      po: "respect marker", man: "conversational particle", gyud: "really / definitely", jud: "really / definitely"
    };

    function normaliseGlossKey(value) {
      return String(value || "")
        .toLocaleLowerCase()
        .replace(/[.,!?;:“”"'()]/g, "")
        .replace(/-link$/i, "")
        .trim();
    }

    function buildCourseGlossary() {
      const glossary = new Map(Object.entries(COMMON_DIRECT_GLOSSES));
      for (const item of ITEMS || []) {
        for (const pair of item.analysis?.tokens || []) {
          const key = normaliseGlossKey(pair?.[0]);
          if (key && pair?.[1] && !glossary.has(key)) glossary.set(key, pair[1]);
        }
        const term = normaliseGlossKey(item.term || item.root);
        if (term && !term.includes(" ") && item.meaning && !glossary.has(term)) glossary.set(term, item.meaning);
        for (const [aspect, form] of Object.entries(item.forms || {})) {
          const key = normaliseGlossKey(form);
          if (!key || key.includes(" ")) continue;
          const aspectGloss = aspect === "completed" ? `${item.meaning} · completed` : aspect === "ongoing" ? `${item.meaning} · ongoing` : `${item.meaning} · planned / not yet`;
          if (!glossary.has(key)) glossary.set(key, aspectGloss);
        }
      }
      return glossary;
    }

    function directTranslationPairs() {
      const analysed = currentExercise?.item?.analysis?.tokens;
      if (Array.isArray(analysed) && analysed.length) return analysed;

      const answer = currentExercise?.answers?.[0] || currentExercise?.item?.example || currentExercise?.item?.term || currentExercise?.item?.root || "";
      const words = String(answer).replace(/[.,!?;:“”"()]/g, "").trim().split(/\s+/).filter(Boolean);
      if (!words.length) return [];
      const glossary = buildCourseGlossary();
      return words.map(word => [word, glossary.get(normaliseGlossKey(word)) || "part of the expression"]);
    }

    function renderCorrectWordBreakdown(correct) {
      const feedback = document.getElementById("feedbackBox");
      if (!feedback) return;
      feedback.querySelector(".correct-word-breakdown")?.remove();
      if (!correct) return;

      const pairs = directTranslationPairs();
      if (!pairs.length) return;
      const section = document.createElement("section");
      section.className = "correct-word-breakdown";
      section.setAttribute("aria-label", "Word-by-word direct translation");
      section.innerHTML = `
        <div class="correct-word-breakdown-heading">
          <strong>Word by word</strong>
          <span>Direct translation</span>
        </div>
        <div class="correct-word-grid">
          ${pairs.map(pair => `<span class="correct-word-pair"><strong>${escapeHTML(pair[0])}</strong><small>${escapeHTML(pair[1])}</small></span>`).join("")}
        </div>`;
      feedback.appendChild(section);
    }

    const baseRenderFeedback = renderFeedback;
    renderFeedback = function renderFeedbackWithWordBreakdown(correct, xpGain, customTitle = null) {
      baseRenderFeedback(correct, xpGain, customTitle);
      renderCorrectWordBreakdown(correct);
    };

    if (typeof updateAll === "function") updateAll();
  }

  installQualityFixes();
})();
