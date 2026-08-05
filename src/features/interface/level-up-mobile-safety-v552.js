(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestLevelUpMobileSafetyV552Installed";
  const RELEASE = "5.5.3";

  function retry() { window.setTimeout(install, 100); }
  function install() {
    if (window[INSTALL_FLAG]) return;
    if (!window.SalitaLevelProgression || !window.SalitaPopupGovernor) { retry(); return; }
    window[INSTALL_FLAG] = true;
    window.SalitaLevelProgression.sanitise();
    window.addEventListener("pageshow", () => {
      window.SalitaLevelProgression.sanitise();
      window.SalitaLevelProgression.requestCelebration();
    });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        window.SalitaLevelProgression.sanitise();
        window.SalitaPopupGovernor.notify();
      }
    });
    document.documentElement.dataset.levelUpSafety = RELEASE;
    window.SalitaLevelUpMobileSafety = Object.freeze({
      version:RELEASE,
      sanitise:window.SalitaLevelProgression.sanitise,
      acknowledge:window.SalitaLevelProgression.sanitise
    });
  }
  install();
})();
