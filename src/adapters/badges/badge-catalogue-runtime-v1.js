(() => {
  "use strict";

  const API = "SalitaBadgeCatalogueRuntimeV1";
  const PROFILE_STORE = "salitaQuestLocalProfilesV1";
  const ACTIVE_PROFILE = "salitaQuestActiveProfileId";
  if (window[API]) return;

  const globalValue = name => {
    try { return eval(`typeof ${name} !== "undefined" ? ${name} : undefined`); }
    catch { return undefined; }
  };
  const stateValue = () => globalValue("state") || window.state || null;
  const catalogueValue = () => globalValue("BADGES") || window.BADGES || null;
  const functionValue = name => globalValue(name) || window[name];
  const positive = value => Math.max(0, Number(value || 0));

  function ready() {
    return Array.isArray(catalogueValue()) && Boolean(stateValue());
  }

  function activeProfile() {
    try {
      const id = sessionStorage.getItem(ACTIVE_PROFILE);
      const store = JSON.parse(localStorage.getItem(PROFILE_STORE) || "null");
      return store?.profiles?.find(profile => profile.id === id) || null;
    } catch { return null; }
  }

  function avatarModel() {
    return window.SalitaAvatarModel || null;
  }

  function level() {
    const readLevel = functionValue("levelInfo");
    return typeof readLevel === "function"
      ? positive(readLevel()?.level || 1)
      : positive(stateValue()?.level || stateValue()?.learnerLevel) || 1;
  }

  function learningPoints() {
    const readPoints = functionValue("totalLearningPoints");
    return typeof readPoints === "function"
      ? positive(readPoints())
      : positive(stateValue()?.xp || stateValue()?.totalXp || stateValue()?.learningPoints);
  }

  function refresh(options = {bootstrap:true}) {
    try { functionValue("syncEarned")?.(options); } catch {}
    try { functionValue("renderCatalogue")?.(); } catch {}
  }

  window[API] = Object.freeze({
    ready,
    state:stateValue,
    catalogue:catalogueValue,
    activeProfile,
    avatarModel,
    level,
    learningPoints,
    refresh
  });
})();
