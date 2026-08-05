(() => {
  "use strict";

  const ENGLISH_VERBS = {
    kain:    {base:"eat", past:"ate", ing:"eating"},
    inom:    {base:"drink", past:"drank", ing:"drinking"},
    punta:   {base:"go", past:"went", ing:"going"},
    alis:    {base:"leave", past:"left", ing:"leaving"},
    dating:  {base:"arrive", past:"arrived", ing:"arriving"},
    uwi:     {base:"go home", past:"went home", ing:"going home"},
    gising:  {base:"wake up", past:"woke up", ing:"waking up"},
    tulog:   {base:"sleep", past:"slept", ing:"sleeping"},
    tingin:  {base:"look", past:"looked", ing:"looking"},
    kuha:    {base:"get something", past:"got something", ing:"getting something"},
    bili:    {base:"buy something", past:"bought something", ing:"buying something"},
    gamit:   {base:"use something", past:"used something", ing:"using something"},
    gawa:    {base:"make something", past:"made something", ing:"making something"},
    tawag:   {base:"call", past:"called", ing:"calling"},
    pasok:   {base:"go to work or school", past:"went to work or school", ing:"going to work or school"},
    tanong:  {base:"ask", past:"asked", ing:"asking"},
    sabi:    {base:"say something", past:"said something", ing:"saying something"},
    bigay:   {base:"give something", past:"gave something", ing:"giving something"},
    dala:    {base:"bring something", past:"brought something", ing:"bringing something"},
    bayad:   {base:"pay", past:"paid", ing:"paying"},
    hintay:  {base:"wait", past:"waited", ing:"waiting"},
    hanap:   {base:"look for something", past:"looked for something", ing:"looking for something"},
    lakad:   {base:"walk", past:"walked", ing:"walking"},
    luto:    {base:"cook", past:"cooked", ing:"cooking"},
    basa:    {base:"read", past:"read", ing:"reading"},
    sulat:   {base:"write", past:"wrote", ing:"writing"},
    trabaho: {base:"work", past:"worked", ing:"working"},
    aral:    {base:"study", past:"studied", ing:"studying"},
    laro:    {base:"play", past:"played", ing:"playing"},
    drive:   {base:"drive", past:"drove", ing:"driving"}
  };

  function clean(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function sentenceContainsForm(sentence, form) {
    const words = clean(sentence)
      .replace(/[.,!?;:“”"()]/g, "")
      .toLowerCase()
      .split(/\s+/);
    return words.includes(clean(form).toLowerCase());
  }

  function generatedEnglish(item, aspect) {
    const forms = ENGLISH_VERBS[item.root] || {
      base: String(item.meaning || item.root).split(" / ")[0],
      past: String(item.meaning || item.root).split(" / ")[0],
      ing: `${String(item.meaning || item.root).split(" / ")[0]}ing`
    };
    if (aspect === "completed") return `I ${forms.past}.`;
    if (aspect === "ongoing") return `I am ${forms.ing}.`;
    return `I will ${forms.base}.`;
  }

  function verbTranslationTarget(item, aspect) {
    const form = item.forms[aspect];
    if (item.example && item.natural && sentenceContainsForm(item.example, form)) {
      return {tagalog: clean(item.example), english: clean(item.natural)};
    }
    return {
      tagalog: `${capitaliseFirst(form)} ako.`,
      english: generatedEnglish(item, aspect)
    };
  }

  generateVerbExercise = function generateVerbTranslationExercise(item, mastery, spoken) {
    if (mastery === 1) {
      return {
        item,
        mode: "meaning",
        type: "Know the root",
        prompt: `What does the root “${item.root}” mean?`,
        context: item.example,
        answers: [item.meaning],
        hint: item.hint,
        explanation: `${item.root} means “${item.meaning}.”`,
        audio: spoken,
        choices: buildChoices(item.meaning, ITEMS.filter(candidate => candidate.kind === "verb").map(candidate => candidate.meaning), 2)
      };
    }

    const stages = ["completed", "ongoing", "contemplated"];
    const aspect = mastery <= 4
      ? stages[Math.min(mastery - 2, 2)]
      : stages[Math.floor(Math.random() * stages.length)];
    const target = verbTranslationTarget(item, aspect);
    const aspectLabels = {
      completed: "completed action",
      ongoing: "ongoing action",
      contemplated: "future or contemplated action"
    };

    return {
      item,
      mode: "sentence-builder",
      type: "Translate into Filipino",
      prompt: `Build the Filipino sentence for: “${target.english}”`,
      context: `Use the ${aspectLabels[aspect]} form. The English sentence fixes the subject and meaning, so one target answer is expected.`,
      answers: [target.tagalog],
      hint: item.hint,
      explanation: `${target.tagalog} · ${item.root}: ${item.forms.completed} / ${item.forms.ongoing} / ${item.forms.contemplated}`,
      audio: mastery >= 4 ? target.tagalog : null,
      sentenceBuilder: buildSentenceOptions(target.tagalog, item),
      choices: null
    };
  };

  function showCorrectBuilderSentence(answer) {
    const builder = document.getElementById("sentenceBuilder");
    const built = document.getElementById("builtSentence");
    if (!builder || !built || builder.classList.contains("hidden")) return;
    const words = sentenceTokens(answer);
    built.innerHTML = words.map(word => `<span class="correct-answer-word">${escapeHTML(word)}</span>`).join("");
    built.setAttribute("aria-label", `Correct answer: ${answer}`);
  }

  renderFeedback = function renderImmediateAnswerFeedback(correct, xpGain, customTitle = null) {
    const box = document.getElementById("feedbackBox");
    if (!box || !currentExercise) return;

    const correctAnswer = currentExercise.answers?.[0] || "";
    box.className = `feedback-box ${correct ? "" : "incorrect"}`.trim();

    document.getElementById("feedbackTitle").textContent = customTitle ||
      (correct ? `Correct +${xpGain} XP` : "Not quite — here is the correct answer");

    if (correct) {
      document.getElementById("feedbackText").textContent = currentExercise.explanation;
      document.getElementById("answerDetail").textContent = "";
    } else {
      document.getElementById("feedbackText").textContent = `Correct answer: ${correctAnswer}`;
      document.getElementById("answerDetail").textContent = currentExercise.hint
        ? `Why: ${currentExercise.hint} This item will return sooner for another try.`
        : "This item will return sooner for another try.";
      showCorrectBuilderSentence(correctAnswer);
    }

    document.getElementById("checkBtn").classList.add("hidden");
    document.getElementById("nextBtn").classList.remove("hidden");
    document.getElementById("answerInput").disabled = true;
    if (!document.getElementById("sentenceBuilder").classList.contains("hidden")) lockSentenceBuilder();
    unlockStructureBox();
  };

  function installSentenceBuilderInteractionRecovery() {
    const flag = "__salitaQuestSentenceBuilderInteractionRecoveryInstalled";
    if (window[flag]) return;
    if (
      typeof updateSentenceBuilderUI !== "function" ||
      typeof removeSelectedWord !== "function" ||
      typeof selectBuilderWord !== "function"
    ) return;
    window[flag] = true;

    const baseUpdateSentenceBuilderUI = updateSentenceBuilderUI;
    updateSentenceBuilderUI = function updateSentenceBuilderUIWithReliableTouchTargets() {
      const result = baseUpdateSentenceBuilderUI.apply(this, arguments);
      const builder = document.getElementById("sentenceBuilder");
      if (!builder || builder.classList.contains("hidden")) return result;

      const unlocked = !sentenceBuilderState.locked;
      const selectedButtons = [...builder.querySelectorAll("#builtSentence .selected-word-tile")];
      selectedButtons.forEach((button, index) => {
        button.dataset.builderSelectedIndex = String(index);
        button.disabled = !unlocked;
        button.setAttribute("aria-label", unlocked
          ? `Remove ${button.textContent || "word"} from the sentence`
          : button.textContent || "Selected word");
      });

      const bankButtons = [...builder.querySelectorAll("#wordBank .word-tile")];
      bankButtons.forEach((button, index) => {
        button.dataset.builderTileIndex = String(index);
        const tile = sentenceBuilderState.tiles[index];
        const used = tile ? sentenceBuilderState.selected.includes(tile.id) : true;
        button.disabled = !unlocked || used;
      });
      return result;
    };

    document.addEventListener("click", event => {
      const selected = event.target.closest?.("#sentenceBuilder .selected-word-tile");
      if (selected && !sentenceBuilderState.locked) {
        const index = Number(selected.dataset.builderSelectedIndex);
        const id = sentenceBuilderState.selected[index];
        if (id) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation?.();
          removeSelectedWord(id);
        }
        return;
      }

      const available = event.target.closest?.("#sentenceBuilder .word-tile");
      if (available && !sentenceBuilderState.locked && !available.classList.contains("used")) {
        const index = Number(available.dataset.builderTileIndex);
        const tile = sentenceBuilderState.tiles[index];
        if (tile && !sentenceBuilderState.selected.includes(tile.id)) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation?.();
          selectBuilderWord(tile.id);
        }
      }
    }, true);

    try { updateSentenceBuilderUI(); } catch {}
  }

  installSentenceBuilderInteractionRecovery();

  const style = document.createElement("style");
  style.textContent = `
    .correct-answer-word {
      display:inline-flex;
      align-items:center;
      min-height:38px;
      margin:3px 5px;
      padding:7px 12px;
      border:2px solid #61a985;
      border-radius:12px;
      background:#e8f8ef;
      color:#173a37;
      font-weight:850;
    }
    #sentenceBuilder .word-tile,
    #sentenceBuilder .selected-word-tile {
      pointer-events:auto;
      touch-action:manipulation;
      -webkit-tap-highlight-color:transparent;
    }
    #sentenceBuilder .selected-word-tile:not(:disabled) {
      cursor:pointer;
    }
    body.dark-mode .feedback-box,
    body.dark-mode .feedback-box h3,
    body.dark-mode .feedback-box p,
    body.dark-mode #feedbackTitle,
    body.dark-mode #feedbackText,
    body.dark-mode #answerDetail {
      color:#173a37 !important;
    }
    body.dark-mode .feedback-box.incorrect {
      background:#fff1f0 !important;
      border-color:#e9aaa5 !important;
    }
    body.dark-mode .feedback-box:not(.incorrect) {
      background:#e9f9f1 !important;
      border-color:#91cdb0 !important;
    }
  `;
  document.head.appendChild(style);
})();