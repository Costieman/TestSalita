(() => {
  "use strict";

  const root = typeof window !== "undefined" ? window : globalThis;
  const PROFILE_STORE = "salitaQuestLocalProfilesV1";
  const ACTIVE_PROFILE = "salitaQuestActiveProfileId";
  const INSTALL_FLAG = "__salitaQuestAvatarUnlockCelebrationV3Installed";
  const RELEASE = "5.5.4";
  // Compatibility marker: const RELEASE = "5.5.3";
  const HISTORY_LIMIT = 100;
  let model = null;
  let retryTimer = 0;

  function entryKey(entry = {}) {
    return [entry.avatarId || "", entry.source || "unknown", entry.level || "", entry.weekKey || ""].join("|");
  }
  function nextPending(sourceCollection, avatarModel, historyEntries = []) {
    if (!avatarModel?.normaliseCollectionState) return null;
    const collection = avatarModel.normaliseCollectionState(sourceCollection);
    const history = new Set((Array.isArray(historyEntries) ? historyEntries : []).map(entryKey));
    const seen = new Set();
    return collection.pendingUnlocks.find(entry => {
      const key = entryKey(entry);
      if (seen.has(key)) return false;
      seen.add(key);
      const item = avatarModel.get(entry?.avatarId);
      return item && collection.ownedAvatarIds.includes(item.id) && entry.animationSeen !== true && !history.has(key);
    }) || null;
  }
  function consumePending(sourceCollection, pendingEntry, avatarModel, now = new Date().toISOString()) {
    const collection = avatarModel.normaliseCollectionState(sourceCollection);
    const targetKey = entryKey(pendingEntry);
    let consumed = null;
    collection.pendingUnlocks = collection.pendingUnlocks.filter(entry => {
      if (entry?.animationSeen === true) return false;
      const same = entryKey(entry) === targetKey || (
        entry?.avatarId === pendingEntry?.avatarId &&
        (entry?.source || "unknown") === (pendingEntry?.source || "unknown") &&
        Number(entry?.level || 0) === Number(pendingEntry?.level || 0)
      );
      if (!same) return true;
      if (!consumed) consumed = {...entry, animationSeen:true, animationSeenAt:now};
      return false;
    });
    return Object.freeze({collection, consumed});
  }

  root.SalitaAvatarUnlockCelebrationLogic = Object.freeze({version:2, release:RELEASE, entryKey, nextPending, consumePending});
  if (typeof document === "undefined" || typeof window === "undefined") return;

  function readStore() {
    try {
      const value = JSON.parse(localStorage.getItem(PROFILE_STORE) || "null");
      return value && Array.isArray(value.profiles) ? value : {schemaVersion:1, profiles:[]};
    } catch { return {schemaVersion:1, profiles:[]}; }
  }
  function writeStore(store) {
    store.schemaVersion = 1;
    store.updatedAt = new Date().toISOString();
    localStorage.setItem(PROFILE_STORE, JSON.stringify(store));
  }
  function activeProfile(store) {
    const id = sessionStorage.getItem(ACTIVE_PROFILE);
    return store.profiles.find(profile => profile.id === id) || null;
  }
  function activeProfileId() { return sessionStorage.getItem(ACTIVE_PROFILE) || "anonymous"; }
  function actualLevel() {
    try {
      const value = Number(typeof levelInfo === "function" ? levelInfo()?.level : NaN);
      return Number.isFinite(value) ? Math.max(1, Math.min(99, Math.floor(value))) : null;
    } catch { return null; }
  }
  function milestoneIsEligible(entry) {
    if (entry?.source !== "level_milestone") return true;
    const required = Number(entry.level);
    const current = actualLevel();
    return Number.isInteger(required) && current != null && required <= current;
  }
  function historyHas(profile, entry) {
    const key = entryKey(entry);
    return (Array.isArray(profile?.avatarUnlockHistory) ? profile.avatarUnlockHistory : []).some(item => entryKey(item) === key);
  }
  function canonicalImage(item) {
    return window.SalitaAvatarArtwork?.getAvatarImagePath?.(item?.id) ||
      window.getAvatarImagePath?.(item?.id) ||
      window.SalitaAvatarAssets?.getAvatarImagePath?.(item?.id) ||
      model?.get?.(item?.id)?.image || item?.image || "";
  }
  function sourceCopy(entry) {
    if (entry?.source === "level_milestone") return {eyebrow:`LEVEL ${entry.level || ""} REWARD`, text:"A milestone avatar has joined your account-wide collection."};
    if (entry?.source === "weekly_reward" || entry?.source === "weekly_keys") return {eyebrow:"WEEKLY REWARD COMPLETE", text:"Your chosen shard target is complete and this avatar is now unlocked."};
    return {eyebrow:"NEW AVATAR UNLOCKED", text:"This avatar has joined your account-wide collection."};
  }
  function installImageFallback(layer, item) {
    const image = layer.querySelector(".sq-avatar-unlock-art img");
    const fallback = layer.querySelector(".sq-avatar-unlock-fallback");
    if (!image) return;
    if (window.SalitaAvatarArtwork) {
      window.SalitaAvatarArtwork.bind(image,item.id,{alt:item.name}).then(() => {
        image.hidden = false;
        if (fallback) fallback.hidden = true;
      }).catch(() => {
        image.hidden = true;
        if (fallback) fallback.hidden = false;
      });
      return;
    }
    image.dataset.retryCount = "0";
    image.addEventListener("load", () => { image.hidden = false; if (fallback) fallback.hidden = true; });
    image.addEventListener("error", () => {
      const retryCount = Number(image.dataset.retryCount || 0);
      if (retryCount < 1) {
        image.dataset.retryCount = "1";
        const source = canonicalImage(item) || "avatars/tarsier.png";
        image.src = `${source}${source.includes("?") ? "&" : "?"}retry=${Date.now()}`;
        return;
      }
      image.hidden = true;
      if (fallback) fallback.hidden = false;
    });
  }
  function buildLayer(item, entry) {
    const copy = sourceCopy(entry);
    const layer = document.createElement("div");
    layer.className = "sq-avatar-unlock-layer";
    layer.setAttribute("role", "dialog");
    layer.setAttribute("aria-modal", "true");
    layer.innerHTML = `<div class="sq-avatar-unlock-rays" aria-hidden="true"></div>
      <section class="sq-avatar-unlock-card">
        <p class="sq-avatar-unlock-eyebrow">${copy.eyebrow}</p>
        <h2>${item.name}</h2>
        <div class="sq-avatar-unlock-art">
          <img src="${canonicalImage(item)}" data-sq-avatar-id="${item.id}" alt="${item.name}">
          <span class="sq-avatar-unlock-fallback" hidden><b>${item.name}</b><small>Artwork unavailable</small></span>
        </div>
        <p>${copy.text}</p>
        <span class="sq-avatar-unlock-meta">${item.starter ? "Starter · Common reward" : `${item.rarity} · ${item.category}`}</span>
        <div class="sq-avatar-unlock-actions">
          <button class="sq-avatar-unlock-add" type="button" data-unlock-add>View collection</button>
          <button class="sq-avatar-unlock-skip" type="button" data-unlock-skip>Close</button>
        </div>
      </section>`;
    installImageFallback(layer, item);
    document.body.appendChild(layer);
    return layer;
  }
  function acknowledgePending(pendingEntry, item) {
    if (!milestoneIsEligible(pendingEntry)) throw new Error("Milestone popup is above the learner's actual level");
    const store = readStore();
    const profile = activeProfile(store);
    if (!profile) throw new Error("Active learner profile is unavailable");
    if (historyHas(profile, pendingEntry)) return true;
    const result = consumePending(profile.avatarCollection, pendingEntry, model);
    profile.avatarCollection = result.collection;
    profile.avatarUnlockHistory = Array.isArray(profile.avatarUnlockHistory) ? profile.avatarUnlockHistory : [];
    profile.avatarUnlockHistory.push({
      avatarId:item.id,
      source:pendingEntry.source || "unknown",
      level:pendingEntry.level || null,
      weekKey:pendingEntry.weekKey || null,
      unlockedAt:pendingEntry.unlockedAt || null,
      animationSeenAt:new Date().toISOString(),
      acknowledgedBeforePopup:true,
      acknowledgedBy:RELEASE
    });
    profile.avatarUnlockHistory = profile.avatarUnlockHistory.slice(-HISTORY_LIMIT);
    writeStore(store);
    document.dispatchEvent(new CustomEvent("salita:avatar-unlock-acknowledged", {detail:{avatarId:item.id, source:pendingEntry.source || "unknown", release:RELEASE}}));
    return true;
  }
  function showUnlock(item, pendingEntry) {
    return new Promise(resolve => {
      const layer = buildLayer(item, pendingEntry);
      let finished = false;
      const finish = openCollection => {
        if (finished) return;
        finished = true;
        layer.remove();
        if (openCollection) {
          if (window.SalitaAvatarCollectionScreen?.open) window.SalitaAvatarCollectionScreen.open();
          else document.dispatchEvent(new CustomEvent("salita:open-avatar-collection"));
        }
        document.dispatchEvent(new CustomEvent("salita:avatar-unlock-animation-finished", {detail:{avatarId:item.id, source:pendingEntry.source || "unknown", release:RELEASE}}));
        resolve();
      };
      document.dispatchEvent(new CustomEvent("salita:avatar-unlock-animation-started", {detail:{avatarId:item.id, source:pendingEntry.source || "unknown", release:RELEASE}}));
      layer.querySelector("[data-unlock-add]")?.addEventListener("click", () => finish(true), {once:true});
      layer.querySelector("[data-unlock-skip]")?.addEventListener("click", () => finish(false), {once:true});
      const escape = event => {
        if (event.key !== "Escape") return;
        document.removeEventListener("keydown", escape);
        finish(false);
      };
      document.addEventListener("keydown", escape);
      layer.querySelector("[data-unlock-add]")?.focus();
    });
  }
  function requestNext() {
    window.clearTimeout(retryTimer);
    const governor = window.SalitaPopupGovernor;
    if (!governor || !model) { schedule(500); return; }
    const profile = activeProfile(readStore());
    if (!profile) return;
    const pendingEntry = nextPending(profile.avatarCollection, model, profile.avatarUnlockHistory);
    if (!pendingEntry) return;
    const item = model.get(pendingEntry.avatarId);
    if (!item) return;
    if (!milestoneIsEligible(pendingEntry)) {
      window.SalitaLevelAvatarRewards?.sync?.();
      schedule(900);
      return;
    }
    governor.enqueue({
      key:`avatar:${activeProfileId()}:${entryKey(pendingEntry)}`,
      type:"avatar_unlock",
      priority:80,
      homeOnly:true,
      canRun:() => milestoneIsEligible(pendingEntry),
      isAcknowledged:() => historyHas(activeProfile(readStore()), pendingEntry),
      acknowledge:() => acknowledgePending(pendingEntry, item),
      show:() => showUnlock(item, pendingEntry)
    });
  }
  function schedule(delay = 500) {
    window.clearTimeout(retryTimer);
    retryTimer = window.setTimeout(requestNext, delay);
  }
  function install() {
    model = window.SalitaAvatarModel || null;
    if (!model || !window.SalitaPopupGovernor) { window.setTimeout(install, 100); return; }
    if (window[INSTALL_FLAG]) return;
    window[INSTALL_FLAG] = true;
    schedule(1000);
    document.addEventListener("salita:avatar-collection-changed", () => schedule(350));
    document.addEventListener("salita:avatar-milestones-awarded", () => schedule(450));
    document.addEventListener("salita:popup-finished", () => schedule(220));
    document.addEventListener("visibilitychange", () => { if (!document.hidden) schedule(250); });
    window.SalitaAvatarUnlockCelebration = Object.freeze({version:3, release:RELEASE, playNext:requestNext, schedule});
  }
  install();
})();
