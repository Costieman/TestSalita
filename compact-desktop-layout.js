(() => {
  "use strict";

  const TARGET = "./src/features/interface/compact-desktop-layout.js?v=5.4.21";
  const LOADING_FLAG = "__salitaQuestCompactDesktopCompatibilityLoading";

  if (window.__salitaQuestCompactDesktopInstalled || window[LOADING_FLAG]) return;
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
  script.dataset.salitaCompatibilityLoader = "compact-desktop-layout";
  script.addEventListener("load", () => { window[LOADING_FLAG] = false; }, {once:true});
  script.addEventListener("error", () => {
    window[LOADING_FLAG] = false;
    console.error("Salita Quest could not load the extracted compact desktop-layout module.");
  }, {once:true});
  (document.head || document.documentElement).appendChild(script);
})();
