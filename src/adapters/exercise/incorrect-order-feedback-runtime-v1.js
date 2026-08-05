(() => {
  "use strict";

  const API = "SalitaIncorrectOrderFeedbackRuntimeV1";
  if (window[API]) return;
  let hooksBound = false;

  const lookup = name => {
    try { return eval(`typeof ${name} !== "undefined" ? ${name} : undefined`); }
    catch { return undefined; }
  };

  const assign = (name, value) => {
    try { eval(`${name} = value`); return true; }
    catch {
      try { window[name] = value; return true; }
      catch { return false; }
    }
  };

  function ready() {
    return lookup("state") !== undefined &&
      lookup("currentExercise") !== undefined &&
      lookup("sentenceBuilderState") !== undefined &&
      typeof lookup("renderFeedback") === "function" &&
      typeof lookup("renderSentenceBuilder") === "function" &&
      typeof lookup("updateSentenceBuilderUI") === "function";
  }

  function currentExerciseValue() {
    return lookup("currentExercise") ?? window.currentExercise ?? null;
  }

  function builderState() {
    return lookup("sentenceBuilderState") ?? window.sentenceBuilderState ?? null;
  }

  function reducedMotion() {
    const source = lookup("state") ?? window.state ?? null;
    return Boolean(source?.settings?.reducedMotion) || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function applyCorrectOrder(ids) {
    const builder = builderState();
    if (!builder) return false;
    builder.selected = ids;
    builder.locked = true;
    const update = lookup("updateSentenceBuilderUI") || window.updateSentenceBuilderUI;
    if (typeof update === "function") update();
    return true;
  }

  function bindHooks({beforeRenderSentenceBuilder, aroundRenderFeedback} = {}) {
    if (hooksBound) return true;
    if (!ready()) return false;

    const baseRenderSentenceBuilder = lookup("renderSentenceBuilder");
    const baseRenderFeedback = lookup("renderFeedback");
    const wrappedRenderSentenceBuilder = function renderSentenceBuilderWithIncorrectOrderFeedback() {
      beforeRenderSentenceBuilder?.apply(this, arguments);
      return baseRenderSentenceBuilder.apply(this, arguments);
    };
    const wrappedRenderFeedback = function renderFeedbackWithIncorrectOrderFeedback() {
      const thisArg = this;
      const args = Array.from(arguments);
      const invokeBase = () => baseRenderFeedback.apply(thisArg, args);
      return typeof aroundRenderFeedback === "function"
        ? aroundRenderFeedback.call(thisArg, {args, invokeBase})
        : invokeBase();
    };

    if (!assign("renderSentenceBuilder", wrappedRenderSentenceBuilder) || !assign("renderFeedback", wrappedRenderFeedback)) return false;
    hooksBound = true;
    return true;
  }

  window[API] = Object.freeze({ready, currentExercise:currentExerciseValue, builderState, reducedMotion, applyCorrectOrder, bindHooks});
})();
