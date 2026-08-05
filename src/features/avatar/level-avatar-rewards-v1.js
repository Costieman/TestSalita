(() => {
  "use strict";

  const root = typeof window !== "undefined" ? window : globalThis;
  const PROFILE_STORE = "salitaQuestLocalProfilesV1";
  const ACTIVE_PROFILE = "salitaQuestActiveProfileId";
  const ACTIVE_COURSE = "salitaQuestActiveCourse";
  const INSTALL_FLAG = "__salitaQuestLevelAvatarRewardsV3Installed";
  const RELEASE = "5.5.3";
  const MILESTONE_LEVELS = Object.freeze([10,20,30,40,50,60,70,80,90,99]);

  function milestoneUnlockKey(entry = {}) {
    return [entry.avatarId || "", entry.source || "level_milestone", Number(entry.level) || ""].join("|");
  }
  function applyMilestoneRewards(level, sourceCollection, model, options = {}) {
    if (!model?.normaliseCollectionState || !model?.levelRewards) throw new Error("Avatar model is required");
    const safeLevel = Math.max(1, Math.min(99, Math.floor(Number(level) || 1)));
    const collection = model.normaliseCollectionState(sourceCollection);
    const claimed = new Set(collection.levelRewardsClaimed || []);
    const acknowledged = new Set((options.acknowledgedLevels || []).map(Number));
    const history = new Set(options.unlockHistoryKeys || []);
    const owned = new Set(collection.ownedAvatarIds || []);
    const pending = Array.isArray(collection.pendingUnlocks) ? [...collection.pendingUnlocks] : [];
    const awarded = [];
    const processed = [];
    const now = options.now || new Date().toISOString();
    const course = options.course || "tagalog";

    MILESTONE_LEVELS.forEach(milestone => {
      if (milestone > safeLevel || claimed.has(milestone) || acknowledged.has(milestone)) return;
      const item = model.get(model.levelRewards[milestone]);
      if (!item) return;
      const standard = milestone < 99 && ["common", "uncommon"].includes(item.weeklyRarity || item.rarity);
      const summit = milestone === 99 && item.id === "golden_salita_crest" && item.rarity === "special";
      if (!standard && !summit) return;

      claimed.add(milestone);
      acknowledged.add(milestone);
      processed.push({level:milestone, avatarId:item.id});
      if (owned.has(item.id)) return;

      owned.add(item.id);
      if (item.shardRequirement > 0) collection.shards[item.id] = item.shardRequirement;
      const entry = {
        avatarId:item.id, source:"level_milestone", level:milestone, course,
        unlockedAt:now, animationSeen:false
      };
      const key = milestoneUnlockKey(entry);
      if (!history.has(key) && !pending.some(existing => milestoneUnlockKey(existing) === key)) pending.push(entry);
      awarded.push({level:milestone, avatarId:item.id, avatar:item});
    });

    collection.ownedAvatarIds = [...owned];
    collection.levelRewardsClaimed = [...claimed].sort((a,b) => a-b);
    collection.pendingUnlocks = pending;
    return Object.freeze({
      level:safeLevel,
      collection,
      awarded:Object.freeze(awarded),
      processed:Object.freeze(processed),
      acknowledged:Object.freeze(processed),
      acknowledgedLevels:Object.freeze([...acknowledged].sort((a,b) => a-b))
    });
  }

  function weeklyEvidence(profile, avatarId, requirement = 100) {
    let after = 0;
    let unlocked = false;
    Object.values(profile?.avatarWeeklyRewards?.claims || {}).forEach(claim => {
      if (claim?.avatarId !== avatarId) return;
      after = Math.max(after, Number(claim.after) || 0);
      unlocked ||= claim.unlocked === true || after >= requirement;
    });
    return {after:Math.min(requirement, after), unlocked};
  }
  function nonLevelEvidence(profile, avatarId) {
    return (Array.isArray(profile?.avatarUnlockHistory) ? profile.avatarUnlockHistory : [])
      .some(entry => entry?.avatarId === avatarId && entry?.source && entry.source !== "level_milestone");
  }
  function repairFutureMilestones(profile, level, model) {
    if (!profile || !model) return {changed:false, removed:[]};
    const safeLevel = Math.max(1, Math.min(99, Math.floor(Number(level) || 1)));
    const collection = model.normaliseCollectionState(profile.avatarCollection, profile.avatarId);
    const rewardState = profile.avatarMilestoneRewards && typeof profile.avatarMilestoneRewards === "object"
      ? profile.avatarMilestoneRewards : {version:3, claims:{}, acknowledgedLevels:[]};
    const claimMap = rewardState.claims && typeof rewardState.claims === "object" ? rewardState.claims : {};
    const future = new Set((collection.levelRewardsClaimed || []).filter(value => value > safeLevel && MILESTONE_LEVELS.includes(value)));
    Object.keys(claimMap).map(Number).filter(value => value > safeLevel && MILESTONE_LEVELS.includes(value)).forEach(value => future.add(value));
    (rewardState.acknowledgedLevels || []).map(Number).filter(value => value > safeLevel && MILESTONE_LEVELS.includes(value)).forEach(value => future.add(value));
    if (!future.size) return {changed:false, removed:[]};

    const falseLevels = [...future].sort((a,b) => a-b);
    const falseSet = new Set(falseLevels);
    collection.levelRewardsClaimed = collection.levelRewardsClaimed.filter(value => !falseSet.has(value));
    collection.pendingUnlocks = (collection.pendingUnlocks || []).filter(entry =>
      !(entry?.source === "level_milestone" && falseSet.has(Number(entry?.level)))
    );
    profile.avatarUnlockHistory = (Array.isArray(profile.avatarUnlockHistory) ? profile.avatarUnlockHistory : []).filter(entry =>
      !(entry?.source === "level_milestone" && falseSet.has(Number(entry?.level)))
    );

    const removed = [];
    falseLevels.forEach(milestone => {
      delete claimMap[String(milestone)];
      const item = model.get(model.levelRewards[milestone]);
      if (!item) return;
      removed.push({level:milestone, avatarId:item.id});
      const weekly = weeklyEvidence(profile, item.id, item.shardRequirement || 100);
      const preserve = collection.equippedAvatarId === item.id || weekly.unlocked || nonLevelEvidence(profile, item.id);
      if (!preserve) {
        collection.ownedAvatarIds = collection.ownedAvatarIds.filter(id => id !== item.id);
        if (weekly.after > 0) collection.shards[item.id] = weekly.after;
        else delete collection.shards[item.id];
      } else if (item.shardRequirement) {
        if (!collection.ownedAvatarIds.includes(item.id)) collection.ownedAvatarIds.push(item.id);
        collection.shards[item.id] = item.shardRequirement;
      }
    });

    rewardState.version = 3;
    rewardState.claims = claimMap;
    rewardState.acknowledgedLevels = (rewardState.acknowledgedLevels || []).map(Number)
      .filter(levelValue => !falseSet.has(levelValue) && MILESTONE_LEVELS.includes(levelValue));
    rewardState.highestLevelObserved = safeLevel;
    rewardState.repairedAt = new Date().toISOString();
    rewardState.repairedFutureLevels = falseLevels;
    profile.avatarCollection = model.normaliseCollectionState(collection, profile.avatarId);
    profile.avatarMilestoneRewards = rewardState;
    return {changed:true, removed};
  }

  root.SalitaLevelAvatarRewardLogic = Object.freeze({
    version:2, release:RELEASE, milestoneLevels:MILESTONE_LEVELS,
    applyMilestoneRewards, repairFutureMilestones, milestoneUnlockKey
  });

  if (typeof document === "undefined" || typeof window === "undefined") return;
  if (window[INSTALL_FLAG]) return;

  let model = null;
  let syncTimer = 0;
  let syncing = false;
  let lastCheckedLevel = 0;

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
  function activeCourse() {
    return document.body.dataset.course || sessionStorage.getItem(ACTIVE_COURSE) || "tagalog";
  }
  function actualCurrentLevel() {
    if (!window.__salitaQuestLevelProgressionV2Installed || typeof levelInfo !== "function") return null;
    try {
      const value = Number(levelInfo()?.level);
      return Number.isFinite(value) ? Math.max(1, Math.min(99, Math.floor(value))) : null;
    } catch { return null; }
  }
  function placementSuppressed(reason) {
    return String(reason || "").includes("placement") ||
      document.documentElement.dataset.placementUpdating === "true" ||
      document.body.classList.contains("placement-open");
  }
  function unlockHistoryKeys(profile) {
    return (Array.isArray(profile?.avatarUnlockHistory) ? profile.avatarUnlockHistory : [])
      .map(milestoneUnlockKey);
  }
  function announce(result) {
    if (!result.awarded.length) return;
    document.dispatchEvent(new CustomEvent("salita:avatar-milestones-awarded", {
      detail:{level:result.level, rewards:result.awarded, governed:true, release:RELEASE}
    }));
  }
  function syncForLevel(_requestedLevel, reason = "level_update") {
    if (syncing || !model || placementSuppressed(reason)) return null;
    const safeLevel = actualCurrentLevel();
    if (safeLevel == null) return null;
    syncing = true;
    try {
      const store = readStore();
      const activeId = sessionStorage.getItem(ACTIVE_PROFILE);
      const profile = store.profiles.find(item => item.id === activeId);
      if (!profile) return null;

      const before = JSON.stringify(profile);
      const repair = repairFutureMilestones(profile, safeLevel, model);
      const rewardState = profile.avatarMilestoneRewards && typeof profile.avatarMilestoneRewards === "object"
        ? profile.avatarMilestoneRewards : {version:3, claims:{}, acknowledgedLevels:[], highestLevelObserved:1};
      const result = applyMilestoneRewards(safeLevel, profile.avatarCollection, model, {
        course:activeCourse(),
        now:new Date().toISOString(),
        acknowledgedLevels:rewardState.acknowledgedLevels || [],
        unlockHistoryKeys:unlockHistoryKeys(profile)
      });
      profile.avatarCollection = result.collection;
      if (result.collection.equippedAvatarId) profile.avatarId = result.collection.equippedAvatarId;
      rewardState.version = 3;
      rewardState.claims = rewardState.claims && typeof rewardState.claims === "object" ? rewardState.claims : {};
      rewardState.acknowledgedLevels = [...new Set(result.acknowledgedLevels)].sort((a,b) => a-b);
      rewardState.highestLevelObserved = Math.max(Number(rewardState.highestLevelObserved || 1), safeLevel);
      rewardState.lastCheckedCourse = activeCourse();
      rewardState.lastCheckedAt = new Date().toISOString();
      result.processed.forEach(reward => {
        rewardState.claims[String(reward.level)] ||= {
          avatarId:reward.avatarId, course:activeCourse(), claimedAt:new Date().toISOString(), reason
        };
      });
      profile.avatarMilestoneRewards = rewardState;

      if (before !== JSON.stringify(profile)) writeStore(store);
      lastCheckedLevel = safeLevel;
      if (repair.changed) {
        document.dispatchEvent(new CustomEvent("salita:avatar-milestones-repaired", {
          detail:{level:safeLevel, removed:repair.removed, release:RELEASE}
        }));
      }
      if (result.awarded.length) {
        document.dispatchEvent(new CustomEvent("salita:avatar-collection-changed", {
          detail:{source:"level_milestone", level:safeLevel, rewards:result.awarded}
        }));
        announce(result);
      }
      return result;
    } finally {
      syncing = false;
    }
  }
  function scheduleSync(reason = "scheduled", delay = 100) {
    window.clearTimeout(syncTimer);
    syncTimer = window.setTimeout(() => syncForLevel(null, reason), delay);
  }
  function install() {
    model = window.SalitaAvatarModel || null;
    if (!model || !window.__salitaQuestLevelProgressionV2Installed || typeof levelInfo !== "function") {
      window.setTimeout(install, 100);
      return;
    }
    if (window[INSTALL_FLAG]) return;
    window[INSTALL_FLAG] = true;
    scheduleSync("initial_governed_sync", 220);
    document.addEventListener("salita:level-updated", () => {
      if (document.documentElement.dataset.placementUpdating === "true" || document.body.classList.contains("placement-open")) return;
      scheduleSync("level_event", 40);
    });
    document.addEventListener("salita:course-progress-restored", () => scheduleSync("course_restore", 180));
    document.addEventListener("salita:placement-finished", () => scheduleSync("post_placement_refresh", 1600));
    window.SalitaLevelAvatarRewards = Object.freeze({
      version:3, release:RELEASE,
      sync:() => syncForLevel(null, "manual_sync"),
      grantForLevel:() => syncForLevel(null, "manual_sync"),
      getLastCheckedLevel:() => lastCheckedLevel
    });
  }
  install();
})();
