(() => {
  "use strict";

  const TARGET = "./src/features/interface/collection-key-translation-hotfix.js?v=5.5.11";
  const LOADING_FLAG = "__salitaCollectionKeyTranslationHotfixCompatibilityLoading";

  if (window.__salitaQuestCollectionKeyTranslationHotfixV2 || window[LOADING_FLAG]) return;
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
  script.dataset.salitaCompatibilityLoader = "collection-key-translation-hotfix";
  script.addEventListener("load", () => { window[LOADING_FLAG] = false; }, {once:true});
  script.addEventListener("error", () => {
    window[LOADING_FLAG] = false;
    console.warn("Collection, key and translation compatibility hotfix could not be loaded.");
  }, {once:true});
  (document.head || document.documentElement).appendChild(script);
})();
