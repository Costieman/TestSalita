(() => {
  "use strict";

  const API = "SalitaCoinShopBadgeRuntimeV1";
  const PROFILE_STORE = "salitaQuestLocalProfilesV1";
  const ACTIVE_PROFILE = "salitaQuestActiveProfileId";
  if (window[API]) return;

  const globalValue = name => {
    try { return eval(`typeof ${name} !== "undefined" ? ${name} : undefined`); }
    catch { return undefined; }
  };
  const state = () => globalValue("state") || window.state || {};
  const catalogue = () => globalValue("BADGES") || window.BADGES || null;
  const model = () => window.SalitaAvatarModel || null;
  const n = value => Math.max(0, Math.floor(Number(value || 0)));

  function activeProfile() {
    try {
      const id = sessionStorage.getItem(ACTIVE_PROFILE);
      const store = JSON.parse(localStorage.getItem(PROFILE_STORE) || "null");
      return store?.profiles?.find(item => item.id === id) || null;
    } catch { return null; }
  }

  function economyMetric(key) {
    return n(state().coinEconomy?.[key]);
  }

  function ownedCount(rarity) {
    try {
      const owned = new Set(activeProfile()?.avatarCollection?.ownedAvatarIds || []);
      return model()?.list({rarity}).filter(item => owned.has(item.id)).length || 0;
    } catch { return 0; }
  }

  function totalCount(rarity) {
    try { return model()?.list({rarity}).length || 0; }
    catch { return 0; }
  }

  function ready() {
    return Array.isArray(catalogue()) && Boolean(model());
  }

  function remove(ids) {
    const list = catalogue();
    if (!Array.isArray(list)) return 0;
    let removed = 0;
    for (let index = list.length - 1; index >= 0; index -= 1) {
      if (!ids.has(list[index]?.id)) continue;
      list.splice(index, 1);
      removed += 1;
    }
    return removed;
  }

  function register(definitions) {
    const list = catalogue();
    if (!Array.isArray(list)) return 0;
    const ids = new Set(list.map(item => item.id));
    list.push(...definitions.filter(item => !ids.has(item.id)));
    return list.length;
  }

  function refresh(options) {
    try { (globalValue("syncEarned") || window.syncEarned)?.(options); }
    catch {}
    try { (globalValue("renderCatalogue") || window.renderCatalogue)?.(); }
    catch {}
  }

  function announce(total) {
    document.dispatchEvent(new CustomEvent("salita:coin-shop-badges-ready", {detail:{total}}));
  }

  window[API] = Object.freeze({ready, remove, register, economyMetric, ownedCount, totalCount, refresh, announce});
})();
