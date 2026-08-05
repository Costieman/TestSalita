(() => {
  "use strict";

  const API_NAME = "SalitaAvatarCaseProfileRuntimeV1";
  const PROFILE_STORE = "salitaQuestLocalProfilesV1";
  const ACTIVE_PROFILE = "salitaQuestActiveProfileId";
  if (window[API_NAME]) return;

  function model() {
    return window.SalitaAvatarModel || null;
  }

  function readStore() {
    try {
      const value = JSON.parse(localStorage.getItem(PROFILE_STORE) || "null");
      return value && Array.isArray(value.profiles) ? value : {schemaVersion:1, profiles:[]};
    } catch {
      return {schemaVersion:1, profiles:[]};
    }
  }

  function activeRecord() {
    const store = readStore();
    const profileId = sessionStorage.getItem(ACTIVE_PROFILE);
    const profile = store.profiles.find(item => item.id === profileId) || null;
    return {store, profile};
  }

  function ownedIds(profile = activeRecord().profile) {
    if (!profile || !model()) return [];
    const collection = model().normaliseCollectionState(profile.avatarCollection, profile.avatarId);
    return [...new Set(collection.ownedAvatarIds || [])];
  }

  function cleanIds(values, max = 4, profile = activeRecord().profile) {
    const owned = new Set(ownedIds(profile));
    const result = [];
    for (const raw of Array.isArray(values) ? values : []) {
      const item = model()?.get?.(raw);
      if (!item || !owned.has(item.id) || result.includes(item.id)) continue;
      result.push(item.id);
      if (result.length >= Math.max(1, Math.floor(Number(max) || 4))) break;
    }
    return result;
  }

  function getIds(max = 4) {
    const {profile} = activeRecord();
    if (!profile) return [];
    const legacy = profile.avatarCollection?.caseAvatarIds;
    return cleanIds(profile.avatarCaseIds || legacy || [], max, profile);
  }

  function getAvatars(max = 4) {
    return getIds(max).map(id => model()?.get?.(id)).filter(Boolean);
  }

  function persist(ids, options = {}) {
    const {store, profile} = activeRecord();
    if (!profile) return [];
    const max = Math.max(1, Math.floor(Number(options.max) || 4));
    const cleaned = cleanIds(ids, max, profile);
    profile.avatarCaseIds = cleaned;
    if (profile.avatarCollection && Object.hasOwn(profile.avatarCollection,"caseAvatarIds")) {
      delete profile.avatarCollection.caseAvatarIds;
    }
    store.schemaVersion = Math.max(1, Number(store.schemaVersion || 1));
    store.updatedAt = new Date().toISOString();
    localStorage.setItem(PROFILE_STORE, JSON.stringify(store));
    return cleaned;
  }

  window[API_NAME] = Object.freeze({
    profileStoreKey:PROFILE_STORE,
    activeProfileKey:ACTIVE_PROFILE,
    model,
    activeRecord,
    ownedIds,
    cleanIds,
    getIds,
    getAvatars,
    persist
  });
})();
