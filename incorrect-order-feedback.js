(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestIncorrectOrderFeedbackInstalled";
  const LOADING_FLAG = "__salitaQuestIncorrectOrderFeedbackCompatibilityLoading";
  const RETRY_MS = 60;
  const ADAPTER_URL = "./src/adapters/exercise/incorrect-order-feedback-runtime-v1.js?v=5.4.21";
  const FEATURE_URL = "./src/features/exercise/incorrect-order-feedback.js?v=5.4.21";
  if (window[INSTALL_FLAG]) return;
  window[INSTALL_FLAG] = true;

  function retry() {
    window.setTimeout(install, RETRY_MS);
  }

  function loadDependency(apiName, target, marker) {
    if (window[apiName]) return Promise.resolve(window[apiName]);
    const selector = `script[data-sq-incorrect-order-dependency="${marker}"]`;
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
      script.dataset.sqIncorrectOrderDependency = marker;
      script.addEventListener("load", () => resolve(window[apiName]), {once:true});
      script.addEventListener("error", () => reject(new Error(`Incorrect-order feedback dependency could not load: ${target}`)), {once:true});
      (document.head || document.documentElement).appendChild(script);
    });
  }

  function loadMissingDependencies() {
    if (window[LOADING_FLAG]) return;
    window[LOADING_FLAG] = true;
    const current = document.currentScript;
    if (document.readyState === "loading" && current) {
      const base = current.src || document.baseURI;
      if (!window.SalitaIncorrectOrderFeedbackRuntimeV1) document.write(`<script src="${new URL(ADAPTER_URL, base).href}"><\/script>`);
      if (!window.SalitaIncorrectOrderFeedbackV1) document.write(`<script src="${new URL(FEATURE_URL, base).href}"><\/script>`);
      window[LOADING_FLAG] = false;
      retry();
      return;
    }
    Promise.resolve()
      .then(() => loadDependency("SalitaIncorrectOrderFeedbackRuntimeV1", ADAPTER_URL, "runtime-v1"))
      .then(() => loadDependency("SalitaIncorrectOrderFeedbackV1", FEATURE_URL, "feature-v1"))
      .then(() => { window[LOADING_FLAG] = false; install(); })
      .catch(error => {
        window[LOADING_FLAG] = false;
        console.warn("Salita Quest incorrect-order feedback could not load", error);
      });
  }

  function install() {
    const runtime = window.SalitaIncorrectOrderFeedbackRuntimeV1;
    const feature = window.SalitaIncorrectOrderFeedbackV1;
    if (!runtime || !feature) {
      loadMissingDependencies();
      return;
    }
    if (!feature.install(runtime)) retry();
  }

  install();
})();
