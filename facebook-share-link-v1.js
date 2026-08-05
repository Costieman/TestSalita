(() => {
  "use strict";
  const TARGET = "./src/features/sharing/facebook-share-link-v1.js?v=1.0.0";
  const LOADING_FLAG = "__salitaFacebookShareLinkV1CompatibilityLoading";
  if (window.__salitaFacebookShareLinkV1Installed || window[LOADING_FLAG]) return;
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
  script.dataset.salitaCompatibilityLoader = "facebook-share-link-v1";
  script.addEventListener("load", () => { window[LOADING_FLAG] = false; }, {once:true});
  script.addEventListener("error", () => {
    window[LOADING_FLAG] = false;
    console.warn("Facebook share link formatting could not be loaded.");
  }, {once:true});
  (document.head || document.documentElement).appendChild(script);
})();
