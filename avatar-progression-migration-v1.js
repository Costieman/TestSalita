(() => {
  "use strict";

  const root = typeof window !== "undefined" ? window : globalThis;
  const TARGET = "./src/features/avatar/avatar-progression-migration-v1.js?v=5.5.6";
  const LOADING_FLAG = "__salitaQuestAvatarMigrationCompatibilityLoading";

  if (root.SalitaAvatarProgressionMigration || root[LOADING_FLAG]) return;
  if (typeof document === "undefined") return;
  root[LOADING_FLAG] = true;

  const current = document.currentScript;
  const targetUrl = new URL(TARGET, current?.src || document.baseURI).href;
  if (document.readyState === "loading" && current) {
    document.write(`<script src="${targetUrl}"><\/script>`);
    root[LOADING_FLAG] = false;
    return;
  }

  const script = document.createElement("script");
  script.src = targetUrl;
  script.async = false;
  script.dataset.salitaCompatibilityLoader = "avatar-progression-migration";
  script.addEventListener("load", () => { root[LOADING_FLAG] = false; }, {once:true});
  script.addEventListener("error", () => {
    root[LOADING_FLAG] = false;
    console.error("Salita Quest could not load the extracted avatar progression migration module.");
  }, {once:true});
  (document.head || document.documentElement).appendChild(script);
})();
