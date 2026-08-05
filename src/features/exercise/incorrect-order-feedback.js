(() => {
  "use strict";

  const API = "SalitaIncorrectOrderFeedbackV1";
  if (window[API]) return;
  let installed = false;
  let revealRunId = 0;

  function normaliseToken(value) {
    return String(value || "")
      .toLocaleLowerCase()
      .replace(/[.,!?;:“”"'()]/g, "")
      .trim();
  }

  function correctTargetTokens(runtime) {
    const exercise = runtime.currentExercise();
    const targetTokens = exercise?.sentenceBuilder?.targetTokens;
    if (Array.isArray(targetTokens) && targetTokens.length) return targetTokens;
    return String(exercise?.answers?.[0] || "")
      .replace(/[.,!?;:“”"()]/g, "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }

  function correctTileIds(runtime) {
    const targetTokens = correctTargetTokens(runtime);
    const available = (runtime.builderState()?.tiles || []).map(tile => ({
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

  function animateCorrectSentenceOrder(runtime, previousPositions) {
    const built = document.getElementById("builtSentence");
    if (!built) return;
    const reduced = runtime.reducedMotion();
    built.classList.remove("incorrect-order-correcting");
    built.classList.add("correct-order-revealed");
    built.setAttribute("data-correct-order-label", "Correct order");
    built.querySelectorAll(".selected-word-tile").forEach((tile, index) => {
      tile.classList.add("correct-order-tile");
      if (reduced || typeof tile.animate !== "function") return;
      const key = normaliseToken(tile.textContent);
      const previous = previousPositions.get(key)?.shift();
      const current = tile.getBoundingClientRect();
      const from = previous
        ? {transform:`translate(${previous.left - current.left}px, ${previous.top - current.top}px) scale(.96)`,opacity:.58}
        : {transform:"translateY(12px) scale(.82)",opacity:0};
      tile.animate([from,{transform:"translate(0, 0) scale(1)",opacity:1}],{
        duration:460,
        delay:index * 55,
        easing:"cubic-bezier(.2, .82, .22, 1)",
        fill:"both"
      });
    });
  }

  function revealCorrectSentenceOrder(runtime, correct, previousPositions) {
    if (correct || !sentenceBuilderIsVisible()) return;
    const orderedIds = correctTileIds(runtime);
    if (!orderedIds.length) return;
    const built = document.getElementById("builtSentence");
    if (!built) return;
    const runId = ++revealRunId;
    const itemId = runtime.currentExercise()?.item?.id;
    const reduced = runtime.reducedMotion();
    built.classList.add("incorrect-order-correcting");
    window.setTimeout(() => {
      if (runId !== revealRunId || runtime.currentExercise()?.item?.id !== itemId) return;
      runtime.applyCorrectOrder(orderedIds);
      animateCorrectSentenceOrder(runtime, previousPositions);
    }, reduced ? 0 : 170);
  }

  function install(runtime = window.SalitaIncorrectOrderFeedbackRuntimeV1) {
    if (installed) return true;
    if (!runtime?.ready?.()) return false;
    const bound = runtime.bindHooks({
      beforeRenderSentenceBuilder() {
        clearCorrectOrderPresentation();
      },
      aroundRenderFeedback({args, invokeBase}) {
        const correct = args[0];
        const previousPositions = !correct && sentenceBuilderIsVisible()
          ? captureSelectedTilePositions()
          : new Map();
        const result = invokeBase();
        revealCorrectSentenceOrder(runtime, correct, previousPositions);
        return result;
      }
    });
    if (!bound) return false;
    installed = true;
    return true;
  }

  window[API] = Object.freeze({install, normaliseToken, correctTargetTokens, correctTileIds});
})();
