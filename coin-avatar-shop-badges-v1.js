(() => {
  "use strict";

  if (window.__salitaCoinAvatarShopBadgesV1Installed) return;
  window.__salitaCoinAvatarShopBadgesV1Installed = true;

  const ADAPTER_URL = "./src/adapters/badges/coin-shop-badge-runtime-v1.js?v=5.6.4";
  const FEATURE_URL = "./src/features/economy/coin-avatar-shop-badges-v1.js?v=5.6.4";

  function loadDependency(apiName, target, marker) {
    if (window[apiName]) return Promise.resolve(window[apiName]);
    const selector = `script[data-sq-coin-shop-badge-dependency="${marker}"]`;
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
      script.dataset.sqCoinShopBadgeDependency = marker;
      script.addEventListener("load", () => resolve(window[apiName]), {once:true});
      script.addEventListener("error", () => reject(new Error(`Coin shop badge dependency could not load: ${target}`)), {once:true});
      (document.head || document.documentElement).appendChild(script);
    });
  }

  function install() {
    const runtime = window.SalitaCoinShopBadgeRuntimeV1;
    const feature = window.SalitaCoinShopBadgeFamilyV1;
    if (!runtime || !feature) {
      Promise.resolve()
        .then(() => loadDependency("SalitaCoinShopBadgeRuntimeV1", ADAPTER_URL, "runtime-v1"))
        .then(() => loadDependency("SalitaCoinShopBadgeFamilyV1", FEATURE_URL, "family-v1"))
        .then(install)
        .catch(error => console.warn("Salita Quest coin shop badges could not load", error));
      return;
    }
    if (!feature.install(runtime)) window.setTimeout(install, 120);
  }

  install();
})();
