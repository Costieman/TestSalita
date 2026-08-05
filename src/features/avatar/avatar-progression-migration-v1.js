(() => {
  "use strict";

  const root = typeof window !== "undefined" ? window : globalThis;
  const PROFILE_STORE = "salitaQuestLocalProfilesV1";
  const PROFILE_PROGRESS_PREFIX = "salitaQuestProgress.profile.";
  const MIGRATION_VERSION = 1;
  const MAX_KEY_HISTORY = 180;
  const LEGACY_VARIANT_SUFFIX = /-(sunrise|islands|midnight)$/i;

  function safeParse(value) {
    if (!value || typeof value !== "string") return null;
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }

  function validDateKey(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
  }

  function cleanDateKeys(values) {
    return [...new Set((Array.isArray(values) ? values : []).filter(validDateKey))]
      .sort()
      .slice(-MAX_KEY_HISTORY);
  }

  function resolveLegacyAvatarId(value, model) {
    if (!value || !model?.get) return "";
    const direct = model.get(value.avatarId || value.id || value.rewardId);
    if (direct) return direct.id;
    const rewardId = String(value.rewardId || value.id || "").replace(LEGACY_VARIANT_SUFFIX, "");
    return model.get(rewardId)?.id || "";
  }

  function normaliseWeekly(value, model) {
    const source = value && typeof value === "object" ? value : {};
    const claims = {};
    if (source.claims && typeof source.claims === "object") {
      for (const [weekKey, claim] of Object.entries(source.claims)) {
        if (!validDateKey(weekKey) || !claim || typeof claim !== "object") continue;
        const avatarId = resolveLegacyAvatarId(claim, model);
        const item = model.get(avatarId);
        if (!item) continue;
        claims[weekKey] = {
          avatarId:item.id,
          rarity:item.rarity,
          shardsAwarded:Math.max(0, Number(claim.shardsAwarded) || 0),
          before:Math.max(0, Number(claim.before) || 0),
          after:Math.max(0, Number(claim.after) || 0),
          unlocked:Boolean(claim.unlocked),
          claimedAt:claim.claimedAt || null,
          keyDates:cleanDateKeys(claim.keyDates).slice(0, 6),
          migratedLegacy:Boolean(claim.migratedLegacy),
          sourceCourse:claim.sourceCourse || null
        };
      }
    }
    return {version:1, keyDates:cleanDateKeys(source.keyDates), claims};
  }

  function mergeLegacyWeeklyState(weekly, collection, legacy, model, course, now) {
    if (!legacy || typeof legacy !== "object") return {claimsAdded:0, avatarsPreserved:0, keysAdded:0};

    const beforeKeyCount = weekly.keyDates.length;
    weekly.keyDates = cleanDateKeys([
      ...weekly.keyDates,
      ...(Array.isArray(legacy.keyDates) ? legacy.keyDates : [])
    ]);

    let claimsAdded = 0;
    let avatarsPreserved = 0;
    const preserveAvatar = avatarId => {
      const item = model.get(avatarId);
      if (!item) return false;
      if (!collection.ownedAvatarIds.includes(item.id)) {
        collection.ownedAvatarIds.push(item.id);
        avatarsPreserved += 1;
      }
      if (item.shardRequirement) collection.shards[item.id] = item.shardRequirement;
      return true;
    };

    if (legacy.claims && typeof legacy.claims === "object") {
      for (const [weekKey, claim] of Object.entries(legacy.claims)) {
        if (!validDateKey(weekKey) || !claim || typeof claim !== "object") continue;
        const avatarId = resolveLegacyAvatarId(claim, model);
        const item = model.get(avatarId);
        if (!item) continue;
        preserveAvatar(item.id);
        if (weekly.claims[weekKey]) continue;
        const before = Math.max(0, Number(collection.shards[item.id]) || 0);
        const after = item.shardRequirement || 100;
        weekly.claims[weekKey] = {
          avatarId:item.id,
          rarity:item.rarity,
          shardsAwarded:Math.max(0, after - before),
          before,
          after,
          unlocked:true,
          claimedAt:claim.claimedAt || now,
          keyDates:cleanDateKeys(claim.keyDates).slice(0, 6),
          migratedLegacy:true,
          sourceCourse:course
        };
        claimsAdded += 1;
      }
    }

    for (const reward of Array.isArray(legacy.unlockedRewards) ? legacy.unlockedRewards : []) {
      const avatarId = resolveLegacyAvatarId(
        typeof reward === "string" ? {rewardId:reward} : reward,
        model
      );
      preserveAvatar(avatarId);
    }

    return {
      claimsAdded,
      avatarsPreserved,
      keysAdded:Math.max(0, weekly.keyDates.length - beforeKeyCount)
    };
  }

  function migrateProfile(profile, courseStates, model, now = new Date().toISOString()) {
    if (!profile || !model?.normaliseCollectionState) return {profile, changed:false, report:null};

    const existingVersion = Number(profile.avatarProgressionMigration?.version || 0);
    const collection = model.normaliseCollectionState(profile.avatarCollection, profile.avatarId);
    const weekly = normaliseWeekly(profile.avatarWeeklyRewards, model);
    const before = JSON.stringify({
      avatarId:profile.avatarId || null,
      collection,
      weekly,
      migration:profile.avatarProgressionMigration || null
    });

    const totals = {claimsAdded:0, avatarsPreserved:0, keysAdded:0};
    if (existingVersion < MIGRATION_VERSION) {
      for (const [course, state] of Object.entries(courseStates || {})) {
        const result = mergeLegacyWeeklyState(
          weekly,
          collection,
          state?.weeklyAvatarChest,
          model,
          course,
          now
        );
        totals.claimsAdded += result.claimsAdded;
        totals.avatarsPreserved += result.avatarsPreserved;
        totals.keysAdded += result.keysAdded;
      }
    }

    profile.avatarCollection = model.normaliseCollectionState(collection, profile.avatarId);
    profile.avatarWeeklyRewards = normaliseWeekly(weekly, model);
    if (profile.avatarCollection.equippedAvatarId) {
      profile.avatarId = profile.avatarCollection.equippedAvatarId;
    }
    profile.avatarProgressionMigration = {
      version:MIGRATION_VERSION,
      completedAt:profile.avatarProgressionMigration?.completedAt || now,
      lastVerifiedAt:now,
      sourceStatesPreserved:true,
      claimsAdded:Math.max(
        Number(profile.avatarProgressionMigration?.claimsAdded || 0),
        totals.claimsAdded
      ),
      avatarsPreserved:Math.max(
        Number(profile.avatarProgressionMigration?.avatarsPreserved || 0),
        totals.avatarsPreserved
      ),
      keysAdded:Math.max(
        Number(profile.avatarProgressionMigration?.keysAdded || 0),
        totals.keysAdded
      )
    };

    const after = JSON.stringify({
      avatarId:profile.avatarId || null,
      collection:profile.avatarCollection,
      weekly:profile.avatarWeeklyRewards,
      migration:profile.avatarProgressionMigration
    });
    return {profile, changed:before !== after, report:{...totals, version:MIGRATION_VERSION}};
  }

  function progressStatesForProfile(storage, profileId) {
    const result = {};
    const candidates = [
      ["tagalog", `${PROFILE_PROGRESS_PREFIX}${profileId}.tagalog`],
      ["tagalog_legacy", `${PROFILE_PROGRESS_PREFIX}${profileId}`],
      ["cebuano", `${PROFILE_PROGRESS_PREFIX}${profileId}.cebuano`]
    ];
    for (const [course, key] of candidates) {
      const parsed = safeParse(storage.getItem(key));
      if (parsed) result[course] = parsed;
    }
    return result;
  }

  function migrateStorage(storage, model, now = new Date().toISOString()) {
    if (!storage || !model) return {changed:false, profilesMigrated:0, reports:[]};
    const store = safeParse(storage.getItem(PROFILE_STORE));
    if (!store || !Array.isArray(store.profiles)) return {changed:false, profilesMigrated:0, reports:[]};

    let changed = false;
    const reports = [];
    for (const profile of store.profiles) {
      const result = migrateProfile(profile, progressStatesForProfile(storage, profile.id), model, now);
      if (result.changed) changed = true;
      reports.push({profileId:profile.id, ...result.report});
    }

    if (changed) {
      store.schemaVersion = Math.max(1, Number(store.schemaVersion) || 1);
      store.updatedAt = now;
      storage.setItem(PROFILE_STORE, JSON.stringify(store));
    }
    return {changed, profilesMigrated:reports.length, reports};
  }

  root.SalitaAvatarProgressionMigration = Object.freeze({
    version:MIGRATION_VERSION,
    safeParse,
    resolveLegacyAvatarId,
    normaliseWeekly,
    mergeLegacyWeeklyState,
    migrateProfile,
    migrateStorage
  });

  if (typeof window === "undefined" || typeof localStorage === "undefined") return;

  function install() {
    const model = window.SalitaAvatarModel;
    if (!model) {
      window.setTimeout(install, 80);
      return;
    }
    try {
      const result = migrateStorage(localStorage, model);
      document.dispatchEvent(new CustomEvent("salita:avatar-progression-migrated", {detail:result}));
    } catch (error) {
      console.warn("Salita Quest avatar progression migration could not complete", error);
    }
  }

  install();
})();
