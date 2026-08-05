(() => {
  "use strict";

  const RELEASE = "5.5.6";
  const MODEL_URL = "./src/features/avatar/avatar-progression-model-v551.js?v=5.5.6";
  const NAVIGATION_URL = "./src/adapters/navigation/avatar-collections-navigation-v551.js?v=5.5.6";

  function loadDependency(apiName, target, marker) {
    if (window[apiName]) return Promise.resolve(window[apiName]);
    const selector = `script[data-sq-avatar-hotfix-dependency="${marker}"]`;
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
      script.dataset.sqAvatarHotfixDependency = marker;
      script.addEventListener("load", () => resolve(window[apiName]), {once:true});
      script.addEventListener("error", () => reject(new Error(`Avatar hotfix dependency could not load: ${target}`)), {once:true});
      (document.head || document.documentElement).appendChild(script);
    });
  }

  window.SalitaAvatarHotfixReady = Promise.resolve()
    .then(async () => {
      await loadDependency("SalitaAvatarProgressionModelV551", MODEL_URL, "model-v551");
      await loadDependency("SalitaAvatarCollectionsNavigationV551", NAVIGATION_URL, "navigation-v551");
      const modelApi = window.SalitaAvatarProgressionModelV551;
      const navigationApi = window.SalitaAvatarCollectionsNavigationV551;
      if (!modelApi?.patch || !navigationApi?.install) throw new Error("Avatar hotfix adapters are unavailable");
      const model = modelApi.patch();
      navigationApi.install();
      return model;
    })
    .catch(error => {
      console.warn("Salita Quest avatar progression compatibility could not complete", error);
      window.SalitaAvatarCollectionsNavigationV551?.install?.();
      return window.SalitaAvatarModel;
    });
})();
