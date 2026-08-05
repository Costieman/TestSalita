(() => {
  "use strict";

  if (window.__salitaWeeklyAvatarProjectedUnlockFixV1Installed) return;
  window.__salitaWeeklyAvatarProjectedUnlockFixV1Installed = true;

  const PROFILE_STORE = "salitaQuestLocalProfilesV1";
  const ACTIVE_PROFILE = "salitaQuestActiveProfileId";
  const KEY_TARGET = 6;
  const ELIGIBLE_RARITIES = new Set(["common", "uncommon", "rare"]);

  function dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function weekKeyForDate(date = new Date()) {
    const value = new Date(date);
    const mondayOffset = (value.getDay() + 6) % 7;
    value.setDate(value.getDate() - mondayOffset);
    return dateKey(value);
  }

  function readAccount() {
    try {
      const store = JSON.parse(localStorage.getItem(PROFILE_STORE) || "null");
      const activeId = sessionStorage.getItem(ACTIVE_PROFILE);
      const profile = store?.profiles?.find(item => item.id === activeId);
      const model = window.SalitaAvatarModel;
      if (!store || !profile || !model) return null;

      const collection = model.normaliseCollectionState(profile.avatarCollection, profile.avatarId);
      const sourceWeekly = profile.avatarWeeklyRewards && typeof profile.avatarWeeklyRewards === "object"
        ? profile.avatarWeeklyRewards
        : {};
      const weekly = {
        version:1,
        keyDates:[...new Set((Array.isArray(sourceWeekly.keyDates) ? sourceWeekly.keyDates : [])
          .filter(value => /^\d{4}-\d{2}-\d{2}$/.test(String(value))))].sort(),
        claims:sourceWeekly.claims && typeof sourceWeekly.claims === "object" ? {...sourceWeekly.claims} : {}
      };
      return {store, profile, model, collection, weekly};
    } catch {
      return null;
    }
  }

  function availableRewardKeyDates(weekly) {
    const consumed = new Set(
      Object.values(weekly.claims || {}).flatMap(claim =>
        Array.isArray(claim?.keyDates) ? claim.keyDates : []
      )
    );
    return weekly.keyDates.filter(key => !consumed.has(key)).slice(-KEY_TARGET);
  }

  function saveAccount(account) {
    account.profile.avatarCollection = account.collection;
    account.profile.avatarWeeklyRewards = account.weekly;
    if (account.collection.equippedAvatarId) account.profile.avatarId = account.collection.equippedAvatarId;
    account.store.schemaVersion = 1;
    account.store.updatedAt = new Date().toISOString();
    localStorage.setItem(PROFILE_STORE, JSON.stringify(account.store));
  }

  function syncLegacyClaim(claim, item, weekKey) {
    try {
      if (typeof state === "undefined") return;
      if (!state.weeklyAvatarChest || typeof state.weeklyAvatarChest !== "object") state.weeklyAvatarChest = {};
      state.weeklyAvatarChest.claims = state.weeklyAvatarChest.claims && typeof state.weeklyAvatarChest.claims === "object"
        ? state.weeklyAvatarChest.claims
        : {};
      state.weeklyAvatarChest.claims[weekKey] = {
        rewardId:`${item.id}-shards`,
        avatarId:item.id,
        shardsAwarded:claim.shardsAwarded,
        before:claim.before,
        after:claim.after,
        unlocked:claim.unlocked,
        claimedAt:claim.claimedAt,
        keyDates:claim.keyDates
      };
      if (typeof saveState === "function") saveState();
    } catch {}
  }

  function claimProjectedTarget(id) {
    const account = readAccount();
    if (!account) return null;

    const {model, collection, weekly} = account;
    const rewardKeyDates = availableRewardKeyDates(weekly);
    if (rewardKeyDates.length < KEY_TARGET) return null;

    const weekKey = weekKeyForDate();
    if (weekly.claims[weekKey]) return null;

    const item = model.get(id);
    if (!item || !ELIGIBLE_RARITIES.has(item.rarity) || collection.ownedAvatarIds.includes(item.id)) return null;

    const award = model.weeklyShardAward(item.rarity);
    const before = Math.max(0, Number(collection.shards[item.id]) || 0);
    const after = Math.min(item.shardRequirement, before + award);
    const unlocked = after >= item.shardRequirement;
    collection.shards[item.id] = after;

    if (unlocked) {
      if (!collection.ownedAvatarIds.includes(item.id)) collection.ownedAvatarIds.push(item.id);
      if (!Array.isArray(collection.pendingUnlocks)) collection.pendingUnlocks = [];
      if (!collection.pendingUnlocks.some(entry => entry.avatarId === item.id && entry.seen !== true)) {
        collection.pendingUnlocks.push({
          avatarId:item.id,
          source:"weekly_keys",
          unlockedAt:new Date().toISOString(),
          seen:false
        });
      }
    }

    const claim = {
      avatarId:item.id,
      rarity:item.rarity,
      shardsAwarded:award,
      before,
      after,
      unlocked,
      claimedAt:new Date().toISOString(),
      keyDates:rewardKeyDates,
      migratedLegacy:false
    };

    weekly.claims[weekKey] = claim;
    saveAccount(account);
    syncLegacyClaim(claim, item, weekKey);

    document.dispatchEvent(new CustomEvent("salita:avatar-collection-changed", {
      detail:{avatarId:item.id, source:"weekly_keys", unlocked, shardsAwarded:award}
    }));
    document.dispatchEvent(new CustomEvent("salita:state-changed"));

    try {
      if (typeof showRewardBurst === "function") {
        showRewardBurst(
          unlocked ? "✨" : "🧩",
          unlocked ? `${item.name} unlocked!` : `+${award} shards for ${item.name} · ${after}/${item.shardRequirement}`,
          true
        );
      }
    } catch {}

    document.querySelector("#weeklyAvatarShardModal [data-weekly-shard-close]")?.click();
    window.SalitaWeeklyAvatarRewards?.render?.();
    window.SalitaDailyKeyReconciliation?.refresh?.();
    return claim;
  }

  document.addEventListener("click", event => {
    const target = event.target.closest?.("[data-weekly-avatar-target]");
    if (!target) return;

    const account = readAccount();
    if (!account || availableRewardKeyDates(account.weekly).length < KEY_TARGET) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    claimProjectedTarget(target.dataset.weeklyAvatarTarget);
  }, true);

  window.SalitaWeeklyAvatarProjectedUnlockFix = Object.freeze({
    version:1,
    availableRewardKeyDates,
    claim:claimProjectedTarget
  });
})();
