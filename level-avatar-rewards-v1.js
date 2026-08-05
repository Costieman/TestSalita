(() => {
  "use strict";
  const TARGET = "./src/features/avatar/level-avatar-rewards-v1.js?v=5.5.6";
  const LOADING_FLAG = "__salitaLevelAvatarRewardsCompatibilityLoading";
  if (window.__salitaQuestLevelAvatarRewardsV3Installed || window[LOADING_FLAG]) return;
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
  script.dataset.salitaCompatibilityLoader = "level-avatar-rewards-v1";
  script.addEventListener("load", () => { window[LOADING_FLAG] = false; }, {once:true});
  script.addEventListener("error", () => {
    window[LOADING_FLAG] = false;
    console.warn("Level avatar rewards compatibility module could not be loaded.");
  }, {once:true});
  (document.head || document.documentElement).appendChild(script);
})();
