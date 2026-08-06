(() => {
  "use strict";

  const RELEASE = "5.5.6";
  const STARTER_IDS = new Set(["anahaw", "orchid", "jade", "rafflesia"]);
  const unique = values => [...new Set(Array.isArray(values) ? values : [])];

  function patchModel() {
    const base = window.SalitaAvatarModel;
    if (!base) throw new Error("Avatar catalogue did not load before the progression compatibility layer");
    if (base.hotfixRelease === RELEASE) return base;

    const starterIds = Object.freeze([...(base.starterIds || STARTER_IDS)]);
    const catalogue = Object.freeze(base.catalogue.map((source, order) => {
      const starter = STARTER_IDS.has(source.id);
      return Object.freeze({
        ...source,
        order,
        starter,
        rarity:starter ? "common" : source.rarity,
        weeklyRarity:starter ? "common" : (source.weeklyRarity || source.rarity),
        collectionGroups:starter ? Object.freeze(["starter", "common"]) : Object.freeze([source.rarity]),
        unlockSource:starter ? "starter_or_weekly" : source.unlockSource,
        shardRequirement:starter ? 100 : source.shardRequirement
      });
    }));
    const byId = Object.freeze(Object.fromEntries(catalogue.map(item => [item.id, item])));
    const aliases = base.aliases || {};
    const weeklyShardAwards = Object.freeze({...base.weeklyShardAwards, common:100, uncommon:50, rare:25});

    function normaliseId(value) {
      const key = String(value || "").trim().toLowerCase().replace(/[’']/g, "")
        .replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
      return aliases[key] || key;
    }
    const get = value => byId[normaliseId(value)] || null;
    function list(filters = {}) {
      return catalogue.filter(item => Object.entries(filters).every(([key, value]) => {
        if (value == null) return true;
        if (key === "rarity" && value === "starter") return item.starter === true;
        return item[key] === value;
      }));
    }
    function cleanIds(values) {
      return unique((Array.isArray(values) ? values : []).map(normaliseId).filter(id => byId[id]));
    }
    function cleanShards(values) {
      const result = {};
      Object.entries(values && typeof values === "object" ? values : {}).forEach(([rawId, rawAmount]) => {
        const id = normaliseId(rawId);
        const item = byId[id];
        if (!item || item.shardRequirement === 0) return;
        result[id] = Math.max(0, Math.min(item.shardRequirement, Math.floor(Number(rawAmount) || 0)));
      });
      return result;
    }
    function cleanPending(values) {
      const result = [];
      const seen = new Set();
      (Array.isArray(values) ? values : []).forEach(entry => {
        const avatarId = normaliseId(entry?.avatarId);
        if (!byId[avatarId] || entry?.animationSeen === true) return;
        const clean = {...entry, avatarId};
        const key = [avatarId, clean.source || "", clean.level || "", clean.weekKey || ""].join("|");
        if (seen.has(key)) return;
        seen.add(key);
        result.push(clean);
      });
      return result;
    }
    function normaliseCollectionState(input = {}, fallbackAvatarId = "") {
      const source = input && typeof input === "object" ? input : {};
      const fallback = normaliseId(source.equippedAvatarId || fallbackAvatarId);
      const ownedAvatarIds = cleanIds(source.ownedAvatarIds);
      if (fallback && byId[fallback] && !ownedAvatarIds.includes(fallback)) ownedAvatarIds.push(fallback);
      const shards = cleanShards(source.shards);
      ownedAvatarIds.forEach(id => {
        const item = byId[id];
        if (item?.shardRequirement) shards[id] = item.shardRequirement;
      });
      return {
        version:2,
        equippedAvatarId:fallback && byId[fallback] ? fallback : null,
        ownedAvatarIds,
        shards,
        pendingUnlocks:cleanPending(source.pendingUnlocks),
        levelRewardsClaimed:unique((Array.isArray(source.levelRewardsClaimed) ? source.levelRewardsClaimed : [])
          .map(Number).filter(level => Number.isInteger(level) && level >= 1 && level <= 99)),
        needsStarterChoice:source.needsStarterChoice == null ? !fallback : Boolean(source.needsStarterChoice)
      };
    }
    function progress(value, state = {}) {
      const item = get(value);
      if (!item) return null;
      const collection = normaliseCollectionState(state);
      const owned = collection.ownedAvatarIds.includes(item.id);
      const shards = owned ? item.shardRequirement : Math.max(0, Number(collection.shards[item.id]) || 0);
      const percent = item.shardRequirement === 0
        ? (owned ? 100 : 0)
        : Math.min(100, Math.round(shards / item.shardRequirement * 100));
      return Object.freeze({avatarId:item.id, owned, shards, required:item.shardRequirement, percent});
    }
    function weeklyShardAward(value) {
      const item = get(value);
      return weeklyShardAwards[item?.weeklyRarity || item?.rarity || String(value || "")] || 0;
    }
    const levelRewards = Object.freeze(Object.fromEntries(
      catalogue.filter(item => item.levelReward).map(item => [item.levelReward, item.id])
    ));
    const model = Object.freeze({
      ...base,
      version:2,
      hotfixRelease:RELEASE,
      catalogue,
      byId,
      starterIds,
      weeklyShardAwards,
      levelRewards,
      normaliseId,
      get,
      list,
      weeklyShardAward,
      normaliseCollectionState,
      progress
    });
    window.SalitaAvatarCatalogue = catalogue;
    window.SalitaAvatarModel = model;
    document.dispatchEvent(new CustomEvent("salita:avatar-model-hotfixed", {detail:{release:RELEASE}}));
    return model;
  }

  function collectionsIcon() {
    return `<svg class="pictogram" viewBox="0 0 64 64" aria-hidden="true">
      <rect x="9" y="10" width="20" height="20" rx="5" fill="none" stroke="currentColor" stroke-width="4"/>
      <rect x="35" y="10" width="20" height="20" rx="5" fill="none" stroke="currentColor" stroke-width="4"/>
      <rect x="9" y="36" width="20" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="4"/>
      <rect x="35" y="36" width="20" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="4"/>
    </svg>`;
  }

  function installCollectionsNavigation() {
    if (window.__salitaQuestCollectionsNavigationV551Installed) return;
    const navButton = document.querySelector('.sidebar .nav-item[data-view="badges"]');
    const badgesView = document.getElementById("badgesView");
    const main = document.querySelector(".main-area");
    const settingsView = document.getElementById("settingsView");
    if (!navButton || !badgesView || !main || !settingsView || typeof switchView !== "function") {
      window.setTimeout(installCollectionsNavigation, 100);
      return;
    }
    window.__salitaQuestCollectionsNavigationV551Installed = true;
    navButton.dataset.view = "collections";
    navButton.title = "Collections";
    navButton.setAttribute("aria-label", "Collections");
    navButton.innerHTML = `<span class="nav-art collections-nav-art">${collectionsIcon()}</span><span>Collections</span>`;

    let view = document.getElementById("collectionsView");
    if (!view) {
      view = document.createElement("section");
      view.id = "collectionsView";
      view.className = "view collections-view";
      view.innerHTML = `
        <section class="collections-page-hero"><div><p class="eyebrow">YOUR COLLECTIBLES</p><h2>Collections</h2>
        <p>Open your achievement badges or choose an avatar from your account-wide collection.</p></div>
        <div class="collections-page-emblem" aria-hidden="true">${collectionsIcon()}</div></section>
        <div class="collections-choice-grid">
          <button type="button" class="collections-choice-card badges" data-open-badge-collection>
            <span class="collections-choice-icon">🏅</span><span><strong>Badges</strong>
            <small>Achievements, milestones and your Badge Chest</small></span><b>Open ›</b></button>
          <button type="button" class="collections-choice-card avatars" data-open-avatar-collection-main>
            <span class="collections-choice-icon">🦅</span><span><strong>Avatars</strong>
            <small>48 Philippine-inspired avatars and shard progress</small></span><b>Open ›</b></button>
        </div>`;
      main.insertBefore(view, settingsView);
    }
    const mobileButton = document.querySelector('.mobile-more-grid [data-view="badges"]');
    if (mobileButton) {
      mobileButton.dataset.view = "collections";
      mobileButton.innerHTML = `<span>🎒</span><strong>Collections</strong><small>Badges and avatars</small>`;
    }
    const baseSwitchView = switchView;
    switchView = function switchViewWithCollections(viewName) {
      const result = baseSwitchView.apply(this, arguments);
      const active = viewName === "collections" || viewName === "badges";
      document.querySelectorAll(".sidebar .nav-item").forEach(button => {
        if (button === navButton) button.classList.toggle("active", active);
        else if (active) button.classList.remove("active");
      });
      if (viewName === "collections") {
        document.getElementById("viewTitle")?.replaceChildren(document.createTextNode("Collections"));
        document.getElementById("mobileViewTitle")?.replaceChildren(document.createTextNode("Collections"));
      }
      return result;
    };
    const openCollections = event => {
      event?.preventDefault();
      event?.stopPropagation();
      event?.stopImmediatePropagation?.();
      if (typeof closeMobileMenu === "function") closeMobileMenu();
      switchView("collections");
    };
    navButton.addEventListener("click", openCollections, true);
    mobileButton?.addEventListener("click", openCollections, true);
    view.querySelector("[data-open-badge-collection]")?.addEventListener("click", () => {
      switchView("badges");
      if (typeof renderBadges === "function") renderBadges();
    });
    view.querySelector("[data-open-avatar-collection-main]")?.addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("salita:open-avatar-collection"));
    });
  }

  window.SalitaAvatarHotfixReady = Promise.resolve().then(() => {
    const model = patchModel();
    installCollectionsNavigation();
    return model;
  }).catch(error => {
    console.warn("Salita Quest avatar progression compatibility could not complete", error);
    installCollectionsNavigation();
    return window.SalitaAvatarModel;
  });
})();
