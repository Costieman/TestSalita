(() => {
  "use strict";

  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__salitaQuestAchievementSharingRouterV3Installed || window.__salitaQuestAchievementSharingRouterV3CompatibilityLoading) return;
  window.__salitaQuestAchievementSharingRouterV3CompatibilityLoading = true;

  const source = "./src/features/sharing/achievement-sharing-router-v3.js?v=5.5.21";
  const clearLoadingFlag = () => { delete window.__salitaQuestAchievementSharingRouterV3CompatibilityLoading; };

  if (document.readyState === "loading" && document.currentScript) {
    const safeSource = source.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    document.write(`<script src="${safeSource}"><\/script>`);
    clearLoadingFlag();
    return;
  }

  const script = document.createElement("script");
  script.src = source;
  script.async = false;
  script.onload = clearLoadingFlag;
  script.onerror = clearLoadingFlag;
  (document.head || document.documentElement).appendChild(script);
})();
