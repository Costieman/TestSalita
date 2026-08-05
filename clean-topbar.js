(() => {
  "use strict";

  const TARGET = "./src/features/interface/clean-topbar.js?v=5.4.21";
  const LOADING_FLAG = "__salitaQuestCleanTopbarCompatibilityLoading";

  if (window.__salitaQuestCleanTopbarInstalled || window[LOADING_FLAG]) return;
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
  script.dataset.salitaCompatibilityLoader = "clean-topbar";
  script.addEventListener("load", () => { window[LOADING_FLAG] = false; }, {once:true});
  script.addEventListener("error", () => {
    window[LOADING_FLAG] = false;
    console.error("Salita Quest could not load the extracted clean-topbar module.");
  }, {once:true});
  (document.head || document.documentElement).appendChild(script);
})();
