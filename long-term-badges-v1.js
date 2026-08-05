(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestLongTermBadgesV1Installed";
  const LOADING_FLAG = "__salitaQuestLongTermBadgesV1CompatibilityLoading";
  const RETRY_MS = 120;
  const ADAPTER_URL = "./src/adapters/badges/badge-catalogue-runtime-v1.js?v=5.6.0";
  const FEATURE_URL = "./src/features/badges/long-term-badges-v1.js?v=5.6.0";
  if (window[INSTALL_FLAG]) return;
  window[INSTALL_FLAG] = true;

  function retry() {
    window.setTimeout(install, RETRY_MS);
  }

  function loadDependency(apiName, target, marker) {
    if (window[apiName]) return Promise.resolve(window[apiName]);
    const selector = `script[data-sq-long-term-badge-dependency="${marker}"]`;
    const existing = document.querySelector(selector);
    if (existing) {
      return new Promise((resolve, reject) => {
        existing.addEventListener("load", () => resolve(window[apiName]), {once:true});
        existing.addEventListener("error", reject, {once:true});
      });
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = new URL(target, document.currentScript?.src || document.baseURI).href;
      script.async = false;
      script.dataset.sqLongTermBadgeDependency = marker;
      script.addEventListener("load", () => resolve(window[apiName]), {once:true});
      script.addEventListener("error", () => reject(new Error(`Long-term badge dependency could not load: ${target}`)), {once:true});
      (document.head || document.documentElement).appendChild(script);
    });
  }

  function loadMissingDependencies() {
    if (window[LOADING_FLAG]) return;
    window[LOADING_FLAG] = true;
    const current = document.currentScript;
    if (document.readyState === "loading" && current) {
      const base = current.src || document.baseURI;
      if (!window.SalitaBadgeCatalogueRuntimeV1) document.write(`<script src="${new URL(ADAPTER_URL, base).href}"><\/script>`);
      if (!window.SalitaLongTermBadgesV1) document.write(`<script src="${new URL(FEATURE_URL, base).href}"><\/script>`);
      window[LOADING_FLAG] = false;
      retry();
      return;
    }
    Promise.resolve()
      .then(() => loadDependency("SalitaBadgeCatalogueRuntimeV1", ADAPTER_URL, "runtime-v1"))
      .then(() => loadDependency("SalitaLongTermBadgesV1", FEATURE_URL, "feature-v1"))
      .then(() => { window[LOADING_FLAG] = false; install(); })
      .catch(error => {
        window[LOADING_FLAG] = false;
        console.warn("Salita Quest long-term badges could not load", error);
      });
  }

  function install() {
    const runtime = window.SalitaBadgeCatalogueRuntimeV1;
    const feature = window.SalitaLongTermBadgesV1;
    if (!runtime || !feature) {
      loadMissingDependencies();
      return;
    }
    if (!feature.install(runtime)) retry();
  }

  install();
})();
