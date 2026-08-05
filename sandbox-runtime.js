(() => {
  "use strict";

  const STORAGE_PREFIX = "__testsalita_v1__:";
  const CACHE_PREFIX = "test-salita-sandbox-";
  const SOURCE_COMMIT = "2793bc413bfe655cbb695a3323140a13810c44fa";
  const SOURCE_PR = 114;
  const originals = {
    getItem: Storage.prototype.getItem,
    setItem: Storage.prototype.setItem,
    removeItem: Storage.prototype.removeItem,
    clear: Storage.prototype.clear,
    key: Storage.prototype.key,
    length: Object.getOwnPropertyDescriptor(Storage.prototype, "length")?.get
  };

  function isScoped(storage) {
    return storage === window.localStorage || storage === window.sessionStorage;
  }

  function scopedKey(key) {
    return STORAGE_PREFIX + String(key);
  }

  function rawKeys(storage) {
    const count = originals.length ? originals.length.call(storage) : 0;
    const keys = [];
    for (let index = 0; index < count; index += 1) {
      const key = originals.key.call(storage, index);
      if (key !== null) keys.push(key);
    }
    return keys;
  }

  Storage.prototype.getItem = function getItem(key) {
    return originals.getItem.call(this, isScoped(this) ? scopedKey(key) : key);
  };

  Storage.prototype.setItem = function setItem(key, value) {
    return originals.setItem.call(this, isScoped(this) ? scopedKey(key) : key, value);
  };

  Storage.prototype.removeItem = function removeItem(key) {
    return originals.removeItem.call(this, isScoped(this) ? scopedKey(key) : key);
  };

  Storage.prototype.key = function key(index) {
    if (!isScoped(this)) return originals.key.call(this, index);
    const keys = rawKeys(this).filter(item => item.startsWith(STORAGE_PREFIX));
    const result = keys[Number(index)] || null;
    return result === null ? null : result.slice(STORAGE_PREFIX.length);
  };

  Storage.prototype.clear = function clear() {
    if (!isScoped(this)) return originals.clear.call(this);
    rawKeys(this)
      .filter(key => key.startsWith(STORAGE_PREFIX))
      .forEach(key => originals.removeItem.call(this, key));
  };

  const runtimeErrors = [];
  function rememberError(type, detail) {
    const entry = {
      type,
      detail: String(detail || "Unknown error").slice(0, 1200),
      page: location.pathname,
      at: new Date().toISOString()
    };
    runtimeErrors.push(entry);
    try {
      const existing = JSON.parse(sessionStorage.getItem("sandboxRuntimeErrorsV1") || "[]");
      existing.push(entry);
      sessionStorage.setItem("sandboxRuntimeErrorsV1", JSON.stringify(existing.slice(-50)));
    } catch {}
    updateErrorCount();
  }

  window.addEventListener("error", event => {
    rememberError("error", event.error?.stack || event.message || "Window error");
  });

  window.addEventListener("unhandledrejection", event => {
    rememberError("unhandledrejection", event.reason?.stack || event.reason || "Unhandled rejection");
  });

  async function reset() {
    localStorage.clear();
    sessionStorage.clear();
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX)).map(key => caches.delete(key)));
    }
    if ("serviceWorker" in navigator) {
      const basePath = new URL("./", location.href).pathname;
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations
          .filter(registration => new URL(registration.scope).pathname.startsWith(basePath))
          .map(registration => registration.unregister())
      );
    }
    location.replace("./index.html?sandboxReset=1");
  }

  function updateErrorCount() {
    const element = document.getElementById("salitaSandboxErrorCount");
    if (!element) return;
    let count = runtimeErrors.length;
    try {
      count = JSON.parse(sessionStorage.getItem("sandboxRuntimeErrorsV1") || "[]").length;
    } catch {}
    element.textContent = `${count} runtime error${count === 1 ? "" : "s"}`;
    element.hidden = count === 0;
  }

  function addBanner() {
    if (document.getElementById("salitaSandboxBanner")) return;
    document.documentElement.dataset.salitaSandbox = "true";
    document.title = `[SANDBOX] ${document.title}`;

    const style = document.createElement("style");
    style.textContent = `
      #salitaSandboxBanner{position:fixed;left:10px;right:10px;bottom:10px;z-index:2147483647;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:10px 12px;border:2px solid #7c2d12;border-radius:14px;background:#fff7ed;color:#431407;font:700 12px/1.35 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 12px 34px rgba(67,20,7,.28)}
      #salitaSandboxBanner strong{font-size:13px}
      #salitaSandboxBanner code{font-size:10px;word-break:break-all}
      #salitaSandboxBanner nav{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
      #salitaSandboxBanner a,#salitaSandboxBanner button{border:1px solid #9a3412;border-radius:9px;background:#fff;color:#7c2d12;padding:6px 9px;font:800 11px system-ui;cursor:pointer;text-decoration:none}
      #salitaSandboxErrorCount{color:#b91c1c}
      @media(max-width:640px){#salitaSandboxBanner{left:5px;right:5px;bottom:5px}#salitaSandboxBanner code{display:none}}
    `;
    document.head.appendChild(style);

    const banner = document.createElement("aside");
    banner.id = "salitaSandboxBanner";
    banner.setAttribute("role", "status");
    banner.innerHTML = `
      <div>
        <strong>TESTSANDBOX — NOT THE LIVE APP</strong><br>
        <span>PR #${SOURCE_PR} snapshot · <code>${SOURCE_COMMIT}</code></span>
      </div>
      <nav>
        <span id="salitaSandboxErrorCount" hidden></span>
        <a href="./sandbox-audit.html">Audit checklist</a>
        <button id="salitaSandboxReset" type="button">Reset sandbox data</button>
      </nav>
    `;
    document.body.appendChild(banner);
    document.getElementById("salitaSandboxReset")?.addEventListener("click", () => {
      if (confirm("Delete only TestSalita sandbox profiles, progress and caches?")) {
        reset().catch(error => alert(`Reset failed: ${error.message}`));
      }
    });
    updateErrorCount();
  }

  window.SalitaSandbox = Object.freeze({
    version: 1,
    sourceCommit: SOURCE_COMMIT,
    sourcePr: SOURCE_PR,
    storagePrefix: STORAGE_PREFIX,
    cachePrefix: CACHE_PREFIX,
    reset,
    errors: () => [...runtimeErrors]
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addBanner, {once: true});
  } else {
    addBanner();
  }
})();
