(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestIncorrectOrderFeedbackInstalled";
  let revealRunId = 0;

  function retryInstall() {
    window.setTimeout(installIncorrectOrderFeedback, 60);
  }

  function installIncorrectOrderFeedback() {
    try {
      if (
        typeof state === "undefined" ||
        typeof currentExercise === "undefined" ||
        typeof sentenceBuilderState === "undefined" ||
        typeof renderFeedback !== "function" ||
        typeof renderSentenceBuilder !== "function" ||
        typeof updateSentenceBuilderUI !== "function"
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

    function normaliseToken(value) {
      return String(value || "")
        .toLocaleLowerCase()
        .replace(/[.,!?;:“”"'()]/g, "")
        .trim();
    }

    function correctTargetTokens() {
      const targetTokens = currentExercise?.sentenceBuilder?.targetTokens;
      if (Array.isArray(targetTokens) && targetTokens.length) return targetTokens;
      return String(currentExercise?.answers?.[0] || "")
        .replace(/[.,!?;:“”"()]/g, "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    }

    function correctTileIds() {
      const targetTokens = correctTargetTokens();
      const available = (sentenceBuilderState.tiles || []).map(tile => ({
        id: tile.id,
        key: normaliseToken(tile.word),
        used: false
      }));

      const ordered = [];
      for (const token of targetTokens) {
        const key = normaliseToken(token);
        const match = available.find(tile => !tile.used && tile.key === key);
        if (!match) return [];
        match.used = true;
        ordered.push(match.id);
      }
      return ordered;
    }

    function sentenceBuilderIsVisible() {
      const builder = document.getElementById("sentenceBuilder");
      return Boolean(builder && !builder.classList.contains("hidden"));
    }

    function clearCorrectOrderPresentation() {
      revealRunId += 1;
      const built = document.getElementById("builtSentence");
      if (!built) return;
      built.classList.remove("incorrect-order-correcting", "correct-order-revealed");
      built.removeAttribute("data-correct-order-label");
    }

    function captureSelectedTilePositions() {
      const built = document.getElementById("builtSentence");
      if (!built) return new Map();
      const positions = new Map();
      built.querySelectorAll(".selected-word-tile").forEach(tile => {
        const key = normaliseToken(tile.textContent);
        if (!positions.has(key)) positions.set(key, []);
        positions.get(key).push(tile.getBoundingClientRect());
      });
      return positions;
    }

    function animateCorrectSentenceOrder(previousPositions) {
      const built = document.getElementById("builtSentence");
      if (!built) return;
      const reducedMotion = Boolean(state?.settings?.reducedMotion) || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      built.classList.remove("incorrect-order-correcting");
      built.classList.add("correct-order-revealed");
      built.setAttribute("data-correct-order-label", "Correct order");

      built.querySelectorAll(".selected-word-tile").forEach((tile, index) => {
        tile.classList.add("correct-order-tile");
        if (reducedMotion || typeof tile.animate !== "function") return;

        const key = normaliseToken(tile.textContent);
        const previous = previousPositions.get(key)?.shift();
        const current = tile.getBoundingClientRect();
        const from = previous
          ? {
              transform: `translate(${previous.left - current.left}px, ${previous.top - current.top}px) scale(.96)`,
              opacity: .58
            }
          : {transform: "translateY(12px) scale(.82)", opacity: 0};

        tile.animate(
          [from, {transform: "translate(0, 0) scale(1)", opacity: 1}],
          {
            duration: 460,
            delay: index * 55,
            easing: "cubic-bezier(.2, .82, .22, 1)",
            fill: "both"
          }
        );
      });
    }

    function revealCorrectSentenceOrder(correct, previousPositions) {
      if (correct || !sentenceBuilderIsVisible()) return;
      const orderedIds = correctTileIds();
      if (!orderedIds.length) return;

      const built = document.getElementById("builtSentence");
      if (!built) return;

      const runId = ++revealRunId;
      const itemId = currentExercise?.item?.id;
      const reducedMotion = Boolean(state?.settings?.reducedMotion) || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      built.classList.add("incorrect-order-correcting");

      window.setTimeout(() => {
        if (runId !== revealRunId || currentExercise?.item?.id !== itemId) return;
        sentenceBuilderState.selected = orderedIds;
        sentenceBuilderState.locked = true;
        updateSentenceBuilderUI();
        animateCorrectSentenceOrder(previousPositions);
      }, reducedMotion ? 0 : 170);
    }

    const baseRenderSentenceBuilder = renderSentenceBuilder;
    renderSentenceBuilder = function renderSentenceBuilderWithCorrectOrderReset(builder) {
      clearCorrectOrderPresentation();
      return baseRenderSentenceBuilder(builder);
    };

    const baseRenderFeedback = renderFeedback;
    renderFeedback = function renderFeedbackWithCorrectSentenceOrder(correct, xpGain, customTitle = null) {
      const previousPositions = !correct && sentenceBuilderIsVisible()
        ? captureSelectedTilePositions()
        : new Map();
      const result = baseRenderFeedback(correct, xpGain, customTitle);
      revealCorrectSentenceOrder(correct, previousPositions);
      return result;
    };
  }

  installIncorrectOrderFeedback();
})();
