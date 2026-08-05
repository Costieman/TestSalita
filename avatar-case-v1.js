(() => {
  "use strict";

  const COORDINATOR_FLAG = "__salitaQuestAvatarCaseV1CoordinatorInstalled";
  const LOADING_FLAG = "__salitaQuestAvatarCaseV1CompatibilityLoading";
  const RETRY_MS = 120;
  const ADAPTER_URL = "./src/adapters/avatar/avatar-case-profile-runtime-v1.js?v=5.5.9";
  const FEATURE_URL = "./src/features/avatar/avatar-case-v1.js?v=5.5.9";
  if (window[COORDINATOR_FLAG]) return;
  window[COORDINATOR_FLAG] = true;

  function retry() {
    window.setTimeout(install, RETRY_MS);
  }

  function loadDependency(apiName, target, marker) {
    if (window[apiName]) return Promise.resolve(window[apiName]);
    const selector = `script[data-sq-avatar-case-dependency="${marker}"]`;
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
      script.dataset.sqAvatarCaseDependency = marker;
      script.addEventListener("load", () => resolve(window[apiName]), {once:true});
      script.addEventListener("error", () => reject(new Error(`Avatar Case dependency could not load: ${target}`)), {once:true});
      (document.head || document.documentElement).appendChild(script);
    });
  }

  function loadMissingDependencies() {
    if (window[LOADING_FLAG]) return;
    window[LOADING_FLAG] = true;
    const current = document.currentScript;
    if (document.readyState === "loading" && current) {
      const base = current.src || document.baseURI;
      if (!window.SalitaAvatarCaseProfileRuntimeV1) document.write(`<script src="${new URL(ADAPTER_URL, base).href}"><\/script>`);
      if (!window.SalitaAvatarCaseFeatureV1) document.write(`<script src="${new URL(FEATURE_URL, base).href}"><\/script>`);
      window[LOADING_FLAG] = false;
      retry();
      return;
    }
    Promise.resolve()
      .then(() => loadDependency("SalitaAvatarCaseProfileRuntimeV1", ADAPTER_URL, "profile-runtime-v1"))
      .then(() => loadDependency("SalitaAvatarCaseFeatureV1", FEATURE_URL, "feature-v1"))
      .then(() => { window[LOADING_FLAG] = false; install(); })
      .catch(error => {
        window[LOADING_FLAG] = false;
        console.warn("Salita Quest Avatar Case could not load", error);
      });
  }

  function install() {
    const runtime = window.SalitaAvatarCaseProfileRuntimeV1;
    const feature = window.SalitaAvatarCaseFeatureV1;
    if (!runtime || !feature) {
      loadMissingDependencies();
      return;
    }
    if (!feature.install(runtime)) retry();
  }

  install();
})();
