(() => {
  "use strict";

  const TARGET = "./src/features/interface/level-up-mobile-safety-v552.js?v=5.5.3";
  const LOADING_FLAG = "__salitaQuestLevelUpMobileSafetyV552CompatibilityLoading";

  if (window.SalitaLevelUpMobileSafety || window[LOADING_FLAG]) return;
  window[LOADING_FLAG] = true;

  const current = document.currentScript;
  const targetUrl = new URL(TARGET, current?.src || document.baseURI).href;
  if (document.readyState === "loading" && current) {
    document.write(`<script src="${targetUrl}"><\/script>`);
    window[LOADING_FLAG] = false;
    return;
  }

  const script = document.createElement("script");
  script.src = targetUrl;
  script.async = false;
  script.dataset.salitaCompatibilityLoader = "level-up-mobile-safety-v552";
  script.addEventListener("load", () => { window[LOADING_FLAG] = false; }, {once:true});
  script.addEventListener("error", () => {
    window[LOADING_FLAG] = false;
    console.error("Salita Quest could not load the extracted level-up mobile-safety module.");
  }, {once:true});
  (document.head || document.documentElement).appendChild(script);
})();
