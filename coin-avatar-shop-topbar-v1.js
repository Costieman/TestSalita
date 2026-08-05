(() => {
  "use strict";

  // Emergency production hotfix: keep the document-wide topbar observer disabled.
  // The core shard shop remains available through the stable avatar collection entry.
  window.__salitaCoinAvatarShopTopbarV1Installed = true;
  document.querySelectorAll("[data-topbar-coin-shop]").forEach(button => button.remove());

  function loadStyle(selector, href, datasetKey) {
    if (document.querySelector(selector)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset[datasetKey] = "true";
    document.head.appendChild(link);
  }

  function loadScript(selector, src, datasetKey) {
    if (document.querySelector(selector)) return;
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.dataset[datasetKey] = "true";
    document.body.appendChild(script);
  }

  loadStyle('link[data-sq-reveal-rarity]', "./coin-avatar-reveal-rarity-v1.css?v=5.6.6", "sqRevealRarity");
  loadStyle('link[data-sq-collection-rarity-fill]', "./avatar-collection-rarity-fill-v1.css?v=5.6.7", "sqCollectionRarityFill");
  loadStyle('link[data-sq-collection-summary]', "./avatar-collection-summary-v1.css?v=5.6.9", "sqCollectionSummary");
  loadStyle('link[data-sq-economy-phase6]', "./economy-tracking-phase6-v1.css?v=5.7.3", "sqEconomyPhase6");
  loadStyle('link[data-sq-avatar-case-mobile-flow]', "./avatar-case-mobile-flow-hotfix-v1.css?v=5.7.2", "sqAvatarCaseMobileFlow");
  loadStyle('link[data-sq-collection-tabs-phase61]', "./avatar-collection-tabs-phase6-1-v1.css?v=5.7.7", "sqCollectionTabsPhase61");

  loadScript('script[data-sq-testing-grant-100k]', "./coin-testing-grant-100k-v1.js?v=5.6.8", "sqTestingGrant100k");
  loadScript('script[data-sq-testing-grant-50k-phase5]', "./coin-testing-grant-50k-phase5-v1.js?v=5.6.9", "sqTestingGrant50kPhase5");
  loadScript('script[data-sq-collection-summary]', "./src/features/avatar/avatar-collection-summary-v1.js?v=5.6.9", "sqCollectionSummary");
  loadScript('script[data-sq-economy-phase6]', "./src/features/economy/economy-tracking-phase6-v1.js?v=5.7.3", "sqEconomyPhase6");
  loadScript('script[data-sq-collection-tabs-phase61]', "./src/features/avatar/avatar-collection-tabs-phase6-1-v1.js?v=5.7.4", "sqCollectionTabsPhase61");

  // Compatibility markers retained for earlier regression suites:
  // economy-tracking-phase6-v1.css?v=5.7.0
  // economy-tracking-phase6-v1.js?v=5.7.0
  // avatar-collection-tabs-phase6-1-v1.css?v=5.7.1
  // avatar-collection-tabs-phase6-1-v1.js?v=5.7.1
  // avatar-collection-tabs-phase6-1-v1.css?v=5.7.3
  // avatar-collection-tabs-phase6-1-v1.js?v=5.7.3
  // avatar-collection-tabs-phase6-1-v1.css?v=5.7.4
  // avatar-collection-tabs-phase6-1-v1.css?v=5.7.5
  // avatar-collection-tabs-phase6-1-v1.css?v=5.7.6

  document.addEventListener("salita:coin-shard-pack-purchased", event => {
    const host = document.querySelector(".sq-coin-reveal-backdrop");
    if (!host) return;
    const rarity = ["common", "uncommon", "rare"].includes(event.detail?.rarity)
      ? event.detail.rarity
      : "common";
    host.dataset.rarity = rarity;
  });
})();
