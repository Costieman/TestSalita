(() => {
  "use strict";

  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__salitaAvatarArtworkRegistryV556Installed || window.__salitaAvatarArtworkRegistryCompatibilityLoading) return;
  window.__salitaAvatarArtworkRegistryCompatibilityLoading = true;

  const source = "./src/features/avatar/avatar-artwork-registry-v554.js?v=5.5.6";
  const clearLoadingFlag = () => { delete window.__salitaAvatarArtworkRegistryCompatibilityLoading; };

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
