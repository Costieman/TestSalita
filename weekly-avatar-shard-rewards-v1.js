(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestWeeklyAvatarShardsV1Installed";
  const PROFILE_STORE = "salitaQuestLocalProfilesV1";
  const ACTIVE_PROFILE = "salitaQuestActiveProfileId";
  const KEY_TARGET = 6;
  const MAX_KEY_HISTORY = 180;
  const ELIGIBLE_RARITIES = new Set(["common", "uncommon", "rare"]);
  const RARITY_ORDER = {common:0, uncommon:1, rare:2};

  let model = null;
  let baseRenderDailyQuests = null;
  let baseClaimDailyQuestRewards = null;
  let canonicalCollection = null;
  let canonicalWeekly = null;
  let activeFilter = "all";
  let modal = null;

  const esc = value => String(value ?? "").replace(/[&<>'"]/g, character => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;"
  }[character]));

  function loadStyles() {
    if (document.querySelector('link[data-weekly-avatar-shards]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "./weekly-avatar-shard-rewards-v1.css?v=5.5.0";
    link.dataset.weeklyAvatarShards = "true";
    document.head.appendChild(link);
  }

  function parseDateKey(key) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ""));
    if (!match) return new Date();
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0, 0);
  }

  function dateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function weekKeyForDate(dateValue) {
    const date = dateValue instanceof Date ? new Date(dateValue) : parseDateKey(dateValue);
    const mondayOffset = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - mondayOffset);
    return dateKey(date);
  }

  function currentDateKey() {
    try {
      const activity = ensureDailyActivity();
      return activity.date || (typeof todayKey === "function" ? todayKey() : dateKey(new Date()));
    } catch {
      return dateKey(new Date());
    }
  }

  function currentWeekKey() {
    return weekKeyForDate(currentDateKey());
  }

  function formatWeekLabel(weekKey) {
    const start = parseDateKey(weekKey);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString(undefined, {month:"short", day:"numeric"})}–${end.toLocaleDateString(undefined, {month:"short", day:"numeric"})}`;
  }

  function readStore() {
    try {
      const value = JSON.parse(localStorage.getItem(PROFILE_STORE) || "null");
      return value && Array.isArray(value.profiles) ? value : {schemaVersion:1, profiles:[]};
    } catch {
      return {schemaVersion:1, profiles:[]};
    }
  }

  function writeStore(store) {
    store.schemaVersion = 1;
    store.updatedAt = new Date().toISOString();
    localStorage.setItem(PROFILE_STORE, JSON.stringify(store));
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normaliseWeeklyState(value) {
    const source = value && typeof value === "object" ? value : {};
    const keyDates = [...new Set((Array.isArray(source.keyDates) ? source.keyDates : [])
      .filter(key => /^\d{4}-\d{2}-\d{2}$/.test(String(key))))].sort().slice(-MAX_KEY_HISTORY);
    const claims = {};
    if (source.claims && typeof source.claims === "object") {
      Object.entries(source.claims).forEach(([weekKey, claim]) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(weekKey) || !claim || typeof claim !== "object") return;
        const item = model.get(claim.avatarId);
        if (!item) return;
        claims[weekKey] = {
          avatarId:item.id,
          rarity:item.rarity,
          shardsAwarded:Math.max(0, Number(claim.shardsAwarded) || 0),
          before:Math.max(0, Number(claim.before) || 0),
          after:Math.max(0, Number(claim.after) || 0),
          unlocked:Boolean(claim.unlocked),
          claimedAt:claim.claimedAt || new Date().toISOString(),
          keyDates:Array.isArray(claim.keyDates) ? claim.keyDates.slice(0, KEY_TARGET) : [],
          migratedLegacy:Boolean(claim.migratedLegacy)
        };
      });
    }
    return {version:1, keyDates, claims};
  }

  function legacyAvatarId(claim) {
    if (!claim || typeof claim !== "object") return "";
    if (model.get(claim.avatarId)) return model.get(claim.avatarId).id;
    const rewardId = String(claim.rewardId || "");
    const withoutVariant = rewardId.replace(/-(sunrise|islands|midnight)$/i, "");
    return model.get(withoutVariant)?.id || "";
  }

  function mergeLegacyCourseState(weekly, collection) {
    const legacy = typeof state !== "undefined" && state.weeklyAvatarChest && typeof state.weeklyAvatarChest === "object"
      ? state.weeklyAvatarChest
      : null;
    if (!legacy) return false;

    let changed = false;
    const mergedDates = [...new Set([
      ...weekly.keyDates,
      ...(Array.isArray(legacy.keyDates) ? legacy.keyDates : [])
    ].filter(key => /^\d{4}-\d{2}-\d{2}$/.test(String(key))))].sort().slice(-MAX_KEY_HISTORY);
    if (JSON.stringify(mergedDates) !== JSON.stringify(weekly.keyDates)) {
      weekly.keyDates = mergedDates;
      changed = true;
    }

    if (legacy.claims && typeof legacy.claims === "object") {
      Object.entries(legacy.claims).forEach(([weekKey, claim]) => {
        if (weekly.claims[weekKey]) return;
        const avatarId = legacyAvatarId(claim);
        const item = model.get(avatarId);
        if (!item) return;
        const before = Number(collection.shards[item.id]) || 0;
        const after = item.shardRequirement || 100;
        if (!collection.ownedAvatarIds.includes(item.id)) collection.ownedAvatarIds.push(item.id);
        if (item.shardRequirement) collection.shards[item.id] = item.shardRequirement;
        weekly.claims[weekKey] = {
          avatarId:item.id,
          rarity:item.rarity,
          shardsAwarded:Math.max(0, after - before),
          before,
          after,
          unlocked:true,
          claimedAt:claim.claimedAt || new Date().toISOString(),
          keyDates:Array.isArray(claim.keyDates) ? claim.keyDates.slice(0, KEY_TARGET) : [],
          migratedLegacy:true
        };
        changed = true;
      });
    }
    return changed;
  }

  function refreshAccount() {
    const store = readStore();
    const activeId = sessionStorage.getItem(ACTIVE_PROFILE);
    const profile = store.profiles.find(item => item.id === activeId);
    if (!profile || !model) return null;

    const collection = model.normaliseCollectionState(profile.avatarCollection, profile.avatarId);
    const weekly = normaliseWeeklyState(profile.avatarWeeklyRewards);
    mergeLegacyCourseState(weekly, collection);

    profile.avatarCollection = collection;
    profile.avatarWeeklyRewards = weekly;
    if (collection.equippedAvatarId) profile.avatarId = collection.equippedAvatarId;
    writeStore(store);

    canonicalCollection = clone(collection);
    canonicalWeekly = clone(weekly);
    return {store, profile, collection, weekly};
  }

  function preserveRewardStateAfterExternalWrite() {
    if (!canonicalCollection || !canonicalWeekly || !model) return;
    const store = readStore();
    const activeId = sessionStorage.getItem(ACTIVE_PROFILE);
    const profile = store.profiles.find(item => item.id === activeId);
    if (!profile) return;

    const latest = model.normaliseCollectionState(profile.avatarCollection, profile.avatarId);
    const owned = [...new Set([...latest.ownedAvatarIds, ...canonicalCollection.ownedAvatarIds])];
    const shards = {...latest.shards};
    Object.entries(canonicalCollection.shards || {}).forEach(([id, amount]) => {
      shards[id] = Math.max(Number(shards[id]) || 0, Number(amount) || 0);
    });
    const pending = [...(latest.pendingUnlocks || [])];
    (canonicalCollection.pendingUnlocks || []).forEach(entry => {
      if (!pending.some(existing => existing.avatarId === entry.avatarId && !existing.seen)) pending.push(entry);
    });

    const merged = model.normaliseCollectionState({
      ...latest,
      equippedAvatarId:latest.equippedAvatarId || canonicalCollection.equippedAvatarId,
      ownedAvatarIds:owned,
      shards,
      pendingUnlocks:pending,
      levelRewardsClaimed:[...new Set([
        ...(latest.levelRewardsClaimed || []),
        ...(canonicalCollection.levelRewardsClaimed || [])
      ])]
    }, latest.equippedAvatarId || profile.avatarId);

    profile.avatarCollection = merged;
    profile.avatarWeeklyRewards = clone(canonicalWeekly);
    if (merged.equippedAvatarId) profile.avatarId = merged.equippedAvatarId;
    writeStore(store);
    canonicalCollection = clone(merged);
  }

  function keysForWeek(weekly, weekKey = currentWeekKey()) {
    return weekly.keyDates.filter(key => weekKeyForDate(key) === weekKey).sort();
  }

  function currentClaim(weekly) {
    return weekly.claims[currentWeekKey()] || null;
  }

  function keyMeterHTML(count) {
    return `<div class="weekly-key-meter" aria-label="${count} of ${KEY_TARGET} weekly keys collected">${
      Array.from({length:KEY_TARGET}, (_, index) =>
        `<span class="weekly-key-slot ${index < count ? "collected" : ""}">${index < count ? "🔑" : ""}</span>`
      ).join("")
    }</div>`;
  }

  function renderWeeklyChest() {
    const chest = document.getElementById("questChest");
    const account = refreshAccount();
    if (!chest || !account) return;

    const {weekly} = account;
    const activity = ensureDailyActivity();
    const weekKey = currentWeekKey();
    const keyCount = Math.min(KEY_TARGET, keysForWeek(weekly, weekKey).length);
    const claim = currentClaim(weekly);
    const ready = keyCount >= KEY_TARGET && !claim;
    const dailyKeyEarned = Boolean(activity.chestClaimed);
    const item = claim ? model.get(claim.avatarId) : null;

    chest.classList.toggle("locked", !dailyKeyEarned && !ready && !claim);
    chest.classList.toggle("unlocked", dailyKeyEarned || ready || Boolean(claim));
    chest.classList.toggle("weekly-ready", ready);
    chest.classList.toggle("weekly-claimed", Boolean(claim));

    let title = dailyKeyEarned
      ? `Daily Key collected · ${keyCount}/${KEY_TARGET}`
      : `Earn today’s Daily Key · ${keyCount}/${KEY_TARGET}`;
    let text = dailyKeyEarned
      ? "Return on another day and complete all four quests to collect the next key."
      : "Complete all four Daily Quests to add one account-wide key this week.";
    let action = `<span class="weekly-key-status">${dailyKeyEarned ? "✓" : "🔒"}</span>`;

    if (ready) {
      title = "Weekly avatar reward ready!";
      text = "Choose any eligible Common, Uncommon or Rare avatar. Rewards are never assigned randomly.";
      action = '<button class="weekly-chest-button" type="button" data-weekly-shard-action="choose">Choose avatar</button>';
    } else if (claim && item) {
      title = claim.unlocked ? `${item.name} unlocked` : `${claim.after}/${item.shardRequirement} shards for ${item.name}`;
      text = `${claim.shardsAwarded} shards added for ${formatWeekLabel(weekKey)}.`;
      action = '<button class="weekly-chest-button secondary" type="button" data-weekly-shard-action="view">View reward</button>';
    }

    chest.innerHTML = `
      <div class="weekly-key-icon" aria-hidden="true">${claim ? "🎁" : "🔑"}</div>
      <div class="weekly-key-copy">
        <strong id="questChestTitle">${esc(title)}</strong>
        <small id="questChestText">${esc(text)}</small>
        ${keyMeterHTML(keyCount)}
      </div>
      <div id="questChestStatus" class="weekly-key-action">${action}</div>`;
  }

  function eligibleItems(collection) {
    return model.catalogue
      .filter(item => ELIGIBLE_RARITIES.has(item.rarity))
      .filter(item => !collection.ownedAvatarIds.includes(item.id))
      .sort((a, b) => (RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]) || (a.order - b.order));
  }

  function revealPercent(percent) {
    if (percent >= 100) return 100;
    return Math.max(0, Math.floor(percent / 25) * 25);
  }

  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "weeklyAvatarShardModal";
    modal.className = "weekly-avatar-modal weekly-avatar-shard-modal hidden";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "weeklyAvatarShardTitle");
    modal.innerHTML = `
      <div class="weekly-avatar-card-shell weekly-avatar-shard-shell">
        <button class="weekly-avatar-close" type="button" data-weekly-shard-close aria-label="Close">×</button>
        <div id="weeklyAvatarShardContent"></div>
      </div>`;
    document.body.appendChild(modal);

    modal.addEventListener("click", event => {
      if (event.target === modal || event.target.closest("[data-weekly-shard-close]")) {
        closeModal();
        return;
      }
      const filter = event.target.closest("[data-weekly-rarity-filter]");
      if (filter) {
        activeFilter = filter.dataset.weeklyRarityFilter;
        renderChoiceModal();
        return;
      }
      const target = event.target.closest("[data-weekly-avatar-target]");
      if (target) claimTarget(target.dataset.weeklyAvatarTarget);
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !modal.classList.contains("hidden")) closeModal();
    });
    return modal;
  }

  function openModal() {
    ensureModal().classList.remove("hidden");
    document.body.classList.add("modal-open");
    window.setTimeout(() => modal.querySelector(".weekly-avatar-close")?.focus(), 30);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.add("hidden");
    document.body.classList.remove("modal-open");
  }

  function choiceCard(item, collection) {
    const progress = model.progress(item.id, collection);
    const award = model.weeklyShardAward(item.rarity);
    const before = progress.shards;
    const after = Math.min(item.shardRequirement, before + award);
    const reveal = revealPercent(progress.percent);
    const maskTop = 100 - reveal;
    const weeksRemaining = Math.ceil((item.shardRequirement - before) / award);
    return `
      <button class="weekly-avatar-target-card" type="button" data-weekly-avatar-target="${item.id}">
        <span class="weekly-avatar-target-art" style="--weekly-mask-top:${maskTop}%">
          <img class="weekly-avatar-target-grey" src="${esc(item.image)}" alt="">
          <img class="weekly-avatar-target-colour" src="${esc(item.image)}" alt="">
          <span class="weekly-avatar-rarity-tag">${esc(item.rarity)}</span>
        </span>
        <span class="weekly-avatar-target-copy">
          <strong>${esc(item.name)}</strong>
          <small>${before} / ${item.shardRequirement} shards</small>
          <span class="weekly-avatar-target-track"><i style="--weekly-target-progress:${progress.percent}%"></i></span>
          <em>${before ? `${weeksRemaining} reward${weeksRemaining === 1 ? "" : "s"} remaining` : item.rarity === "common" ? "Unlocks this week" : `${weeksRemaining} weekly rewards`}</em>
        </span>
        <span class="weekly-avatar-target-award">+${award}</span>
        <span class="weekly-avatar-target-after">${after >= item.shardRequirement ? "Unlock now" : `Becomes ${after}/${item.shardRequirement}`}</span>
      </button>`;
  }

  function renderChoiceModal() {
    const account = refreshAccount();
    if (!account) return;
    const {collection, weekly} = account;
    const claim = currentClaim(weekly);
    if (claim) {
      renderResultModal(claim);
      return;
    }

    const all = eligibleItems(collection);
    const items = activeFilter === "all" ? all : all.filter(item => item.rarity === activeFilter);
    const content = ensureModal().querySelector("#weeklyAvatarShardContent");
    content.innerHTML = `
      <p class="eyebrow">Six Daily Keys collected</p>
      <h2 id="weeklyAvatarShardTitle">Choose your weekly avatar</h2>
      <p class="weekly-avatar-shard-intro">Select any eligible target. You may continue a previous target or switch to another avatar each week.</p>
      <div class="weekly-avatar-shard-rules">
        <span><strong>Common</strong> +100 · 1 week</span>
        <span><strong>Uncommon</strong> +50 · 2 weeks</span>
        <span><strong>Rare</strong> +25 · 4 weeks</span>
      </div>
      <div class="weekly-avatar-filter-row" role="group" aria-label="Filter avatar rewards">
        ${["all", "common", "uncommon", "rare"].map(filter =>
          `<button type="button" data-weekly-rarity-filter="${filter}" aria-pressed="${String(activeFilter === filter)}">${filter === "all" ? "All eligible" : filter}</button>`
        ).join("")}
      </div>
      <div class="weekly-avatar-target-grid">
        ${items.length ? items.map(item => choiceCard(item, collection)).join("") : '<p class="weekly-avatar-target-empty">No locked avatars remain in this category.</p>'}
      </div>
      <small class="weekly-avatar-choice-note">Your choice is final for this week. No avatar is selected randomly.</small>`;
  }

  function renderResultModal(claim) {
    const item = model.get(claim.avatarId);
    if (!item) return;
    const content = ensureModal().querySelector("#weeklyAvatarShardContent");
    content.innerHTML = `
      <p class="eyebrow">${claim.unlocked ? "Avatar unlocked" : "Shard progress saved"}</p>
      <div class="weekly-avatar-result-art"><img src="${esc(item.image)}" alt="${esc(item.name)}"></div>
      <h2 id="weeklyAvatarShardTitle">${esc(item.name)}</h2>
      <p class="weekly-avatar-result-copy">${claim.unlocked
        ? `You completed ${item.name} and can equip it from the Avatar Collection.`
        : `${claim.shardsAwarded} shards were added. You now have ${claim.after} of ${item.shardRequirement} shards.`}</p>
      <div class="weekly-avatar-result-stats">
        <span><strong>+${claim.shardsAwarded}</strong> ${esc(item.rarity)} shards</span>
        <span><strong>${claim.after}/${item.shardRequirement || 100}</strong> total progress</span>
      </div>
      <div class="weekly-avatar-actions weekly-avatar-result-actions">
        <button class="primary-btn" type="button" data-open-avatar-collection>Open collection</button>
        <button class="secondary-btn" type="button" data-weekly-shard-close>Close</button>
      </div>
      <small class="weekly-avatar-choice-note">${esc(formatWeekLabel(currentWeekKey()))} · chosen by you</small>`;

    content.querySelector("[data-open-avatar-collection]")?.addEventListener("click", () => {
      closeModal();
      document.dispatchEvent(new CustomEvent("salita:open-avatar-collection"));
    }, {once:true});
  }

  function claimTarget(id) {
    const account = refreshAccount();
    if (!account) return null;
    const {store, profile, collection, weekly} = account;
    const weekKey = currentWeekKey();
    if (weekly.claims[weekKey] || keysForWeek(weekly, weekKey).length < KEY_TARGET) return null;

    const item = model.get(id);
    if (!item || !ELIGIBLE_RARITIES.has(item.rarity) || collection.ownedAvatarIds.includes(item.id)) return null;

    const award = model.weeklyShardAward(item.rarity);
    const before = Math.max(0, Number(collection.shards[item.id]) || 0);
    const after = Math.min(item.shardRequirement, before + award);
    const unlocked = after >= item.shardRequirement;
    collection.shards[item.id] = after;

    if (unlocked) {
      if (!collection.ownedAvatarIds.includes(item.id)) collection.ownedAvatarIds.push(item.id);
      if (!collection.pendingUnlocks.some(entry => entry.avatarId === item.id && !entry.seen)) {
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
      keyDates:keysForWeek(weekly, weekKey).slice(0, KEY_TARGET),
      migratedLegacy:false
    };
    weekly.claims[weekKey] = claim;
    profile.avatarCollection = collection;
    profile.avatarWeeklyRewards = weekly;
    writeStore(store);
    canonicalCollection = clone(collection);
    canonicalWeekly = clone(weekly);

    if (!state.weeklyAvatarChest || typeof state.weeklyAvatarChest !== "object") state.weeklyAvatarChest = {};
    state.weeklyAvatarChest.claims = state.weeklyAvatarChest.claims && typeof state.weeklyAvatarChest.claims === "object"
      ? state.weeklyAvatarChest.claims
      : {};
    state.weeklyAvatarChest.claims[weekKey] = {
      rewardId:`${item.id}-shards`,
      avatarId:item.id,
      shardsAwarded:award,
      before,
      after,
      unlocked,
      claimedAt:claim.claimedAt,
      keyDates:claim.keyDates
    };
    if (typeof saveState === "function") saveState();

    document.dispatchEvent(new CustomEvent("salita:avatar-collection-changed", {
      detail:{avatarId:item.id, source:"weekly_keys", unlocked, shardsAwarded:award}
    }));
    if (typeof showRewardBurst === "function") {
      showRewardBurst(
        unlocked ? "✨" : "🧩",
        unlocked ? `${item.name} unlocked!` : `+${award} shards for ${item.name} · ${after}/${item.shardRequirement}`,
        true
      );
    }

    renderDailyQuests();
    renderResultModal(claim);
    openModal();
    return claim;
  }

  function openChoiceModal() {
    activeFilter = "all";
    renderChoiceModal();
    openModal();
  }

  function openCurrentReward() {
    const account = refreshAccount();
    const claim = account ? currentClaim(account.weekly) : null;
    if (!claim) return;
    renderResultModal(claim);
    openModal();
  }

  function install() {
    loadStyles();
    try {
      if (
        window[INSTALL_FLAG] ||
        !window.SalitaAvatarModel ||
        typeof state === "undefined" ||
        typeof ensureDailyActivity !== "function" ||
        typeof renderDailyQuests !== "function" ||
        typeof claimDailyQuestRewards !== "function" ||
        typeof saveState !== "function" ||
        typeof questProgress !== "function" ||
        !Array.isArray(DAILY_QUESTS)
      ) {
        window.setTimeout(install, 100);
        return;
      }
    } catch {
      window.setTimeout(install, 100);
      return;
    }

    window[INSTALL_FLAG] = true;
    model = window.SalitaAvatarModel;
    baseRenderDailyQuests = renderDailyQuests;
    baseClaimDailyQuestRewards = claimDailyQuestRewards;

    claimDailyQuestRewards = function claimDailyQuestRewardsWithAccountKeys(celebrate = false) {
      const before = refreshAccount();
      const beforeCount = before ? before.weekly.keyDates.length : 0;
      baseClaimDailyQuestRewards(celebrate);
      const after = refreshAccount();
      if (after && after.weekly.keyDates.length > beforeCount) {
        document.dispatchEvent(new CustomEvent("salita:weekly-key-earned", {
          detail:{date:currentDateKey(), count:keysForWeek(after.weekly).length}
        }));
      }
      renderWeeklyChest();
    };

    renderDailyQuests = function renderDailyQuestsWithAvatarChoice() {
      baseRenderDailyQuests();
      renderWeeklyChest();
    };

    const chest = document.getElementById("questChest");
    chest?.addEventListener("click", event => {
      const control = event.target.closest("[data-weekly-shard-action]");
      if (!control) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      if (control.dataset.weeklyShardAction === "choose") openChoiceModal();
      else if (control.dataset.weeklyShardAction === "view") openCurrentReward();
    }, true);

    document.addEventListener("salita:avatar-equipped", preserveRewardStateAfterExternalWrite);
    document.addEventListener("salita:avatar-collection-changed", event => {
      if (event.detail?.source !== "weekly_keys") preserveRewardStateAfterExternalWrite();
    });

    refreshAccount();
    baseClaimDailyQuestRewards(false);
    refreshAccount();
    renderDailyQuests();

    window.SalitaWeeklyAvatarRewards = Object.freeze({
      keyTarget:KEY_TARGET,
      open:openChoiceModal,
      render:renderWeeklyChest,
      claim:claimTarget,
      currentWeek:currentWeekKey
    });
  }

  install();
})();