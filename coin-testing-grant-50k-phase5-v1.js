(() => {
  "use strict";

  if (window.__salitaCoinTestingGrant50kPhase5V1Installed) return;
  window.__salitaCoinTestingGrant50kPhase5V1Installed = true;

  const GRANT_ID = "coinShopTesting50000Phase5V1";
  const GRANT_AMOUNT = 50000;
  const PROGRESS_PREFIX = "salitaQuestProgress";

  function globalValue(name) {
    try { return eval(`typeof ${name} !== "undefined" ? ${name} : undefined`); }
    catch { return undefined; }
  }

  function grant(payload) {
    if (!payload || typeof payload !== "object") return false;
    payload.testingGrants = payload.testingGrants && typeof payload.testingGrants === "object" ? payload.testingGrants : {};
    if (payload.testingGrants[GRANT_ID]) return false;
    payload.testingGrants[GRANT_ID] = {amount:GRANT_AMOUNT, grantedAt:new Date().toISOString()};
    payload.coins = Math.max(0, Math.floor(Number(payload.coins || 0))) + GRANT_AMOUNT;
    return true;
  }

  function applyGrant() {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key || !key.startsWith(PROGRESS_PREFIX)) continue;
      try {
        const payload = JSON.parse(localStorage.getItem(key) || "null");
        if (grant(payload)) localStorage.setItem(key, JSON.stringify(payload));
      } catch {}
    }

    const state = globalValue("state") || window.state;
    if (!grant(state)) return;
    try { (globalValue("saveState") || window.saveState)?.(); }
    catch { localStorage.setItem(PROGRESS_PREFIX, JSON.stringify(state)); }
    try { (globalValue("updateGlobalUI") || window.updateGlobalUI)?.(); } catch {}
    for (const id of ["coinValue", "mobileCoinValue"]) {
      const node = document.getElementById(id);
      if (node) node.textContent = String(state.coins);
    }
    document.dispatchEvent(new CustomEvent("salita:coin-balance-changed", {detail:{coins:state.coins, source:GRANT_ID}}));
  }

  function install() {
    if (!(globalValue("state") || window.state)) {
      window.setTimeout(install, 120);
      return;
    }
    applyGrant();
  }

  install();
})();