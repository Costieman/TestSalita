(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestPronunciationReleaseControlInstalled";
  const BUTTON_SELECTOR = "#audioBtn";
  let lastPointerRelease = 0;
  let playbackPending = false;
  let primedContext = null;

  function retry() {
    window.setTimeout(install, 80);
  }

  function primeAudio() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      primedContext ||= new AudioContextClass();
      if (primedContext.state === "suspended") primedContext.resume().catch(() => {});
    } catch {}
  }

  async function activate(button) {
    if (!button || playbackPending || button.disabled || button.classList.contains("hidden")) return;
    const phrase = String(button.dataset.text || "").trim();
    if (!phrase) {
      if (typeof toast === "function") toast("Pronunciation is not available for this phrase yet.");
      return;
    }

    playbackPending = true;
    const original = button.textContent;
    button.dataset.releasePlayback = "true";
    button.setAttribute("aria-busy", "true");
    primeAudio();

    try {
      const result = typeof speakFilipino === "function" ? speakFilipino(phrase, button) : null;
      if (result && typeof result.then === "function") await result;
    } catch (error) {
      console.error("Pronunciation playback failed", error);
      if (typeof toast === "function") toast("Audio could not play. Release the button once more or check the device volume.");
    } finally {
      playbackPending = false;
      button.disabled = false;
      button.removeAttribute("aria-busy");
      button.textContent = /replay/i.test(button.textContent || "") ? button.textContent : (original || "🔊 Hear pronunciation");
    }
  }

  function install() {
    try {
      if (typeof speakFilipino !== "function") {
        retry();
        return;
      }
    } catch {
      retry();
      return;
    }
    if (window[INSTALL_FLAG]) return;
    window[INSTALL_FLAG] = true;

    document.addEventListener("pointerup", event => {
      const button = event.target.closest?.(BUTTON_SELECTOR);
      if (!button || event.button > 0) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      lastPointerRelease = performance.now();
      activate(button);
    }, true);

    document.addEventListener("click", event => {
      const button = event.target.closest?.(BUTTON_SELECTOR);
      if (!button) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const keyboardActivation = event.detail === 0;
      if (keyboardActivation || performance.now() - lastPointerRelease > 650) activate(button);
    }, true);

    document.addEventListener("pointerdown", event => {
      if (event.target.closest?.(BUTTON_SELECTOR)) primeAudio();
    }, {capture:true, passive:true});

    try { loadStaticAudioManifest?.(); } catch {}
  }

  install();
})();
