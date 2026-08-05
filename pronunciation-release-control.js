(() => {
  "use strict";

  const TARGET = "./src/features/audio/pronunciation-release-control.js?v=5.4.22";
  const LOADING_FLAG = "__salitaQuestPronunciationReleaseControlCompatibilityLoading";

  if (window.__salitaQuestPronunciationReleaseControlInstalled || window[LOADING_FLAG]) return;
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
  script.dataset.salitaCompatibilityLoader = "pronunciation-release-control";
  script.addEventListener("load", () => { window[LOADING_FLAG] = false; }, {once:true});
  script.addEventListener("error", () => {
    window[LOADING_FLAG] = false;
    console.error("Salita Quest could not load the extracted pronunciation release-control module.");
  }, {once:true});
  (document.head || document.documentElement).appendChild(script);
})();
