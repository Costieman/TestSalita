(() => {
  "use strict";
  if (window.__salitaQuestAchievementSharingRouterV3Installed) return;
  const existing = document.querySelector('script[data-sq-sharing-router-v3]');
  if (existing) return;
  const script = document.createElement("script");
  script.src = "./achievement-sharing-router-v3.js?v=5.5.21";
  script.async = false;
  script.dataset.sqSharingRouterV3 = "true";
  script.onerror = () => console.warn("Stable Share and Save controls could not be loaded.");
  document.body.appendChild(script);
})();