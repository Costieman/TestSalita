(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestAvatarCollectionPageV2Installed";
  if (window[INSTALL_FLAG]) return;
  window[INSTALL_FLAG] = true;

  const PROFILE_STORE = "salitaQuestLocalProfilesV1";
  const ACTIVE_PROFILE = "salitaQuestActiveProfileId";
  const RARITY_ORDER = ["starter", "common", "uncommon", "rare", "special"];
  const RARITY_LABELS = {
    starter:"Starter flora",
    common:"Common collection",
    uncommon:"Uncommon collection",
    rare:"Rare Philippine wildlife",
    special:"Special prestige"
  };

  let model = null;
  let view = null;
  let summary = null;
  let content = null;
  let detail = null;
  let activeFilter = "all";
  let searchTerm = "";

  const esc = value => String(value ?? "").replace(/[&<>'"]/g, character => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;"
  }[character]));

  function readContext() {
    try {
      const store = JSON.parse(localStorage.getItem(PROFILE_STORE) || "null");
      const activeId = sessionStorage.getItem(ACTIVE_PROFILE);
      const profile = store?.profiles?.find(item => item.id === activeId);
      if (!store || !profile || !model) return null;
      const collection = model.normaliseCollectionState(profile.avatarCollection, profile.avatarId);
      profile.avatarCollection = collection;
      if (collection.equippedAvatarId) profile.avatarId = collection.equippedAvatarId;
      store.updatedAt = new Date().toISOString();
      localStorage.setItem(PROFILE_STORE, JSON.stringify(store));
      return {store, profile, collection};
    } catch {
      return null;
    }
  }

  function saveContext(context) {
    context.profile.avatarCollection = context.collection;
    if (context.collection.equippedAvatarId) context.profile.avatarId = context.collection.equippedAvatarId;
    context.store.updatedAt = new Date().toISOString();
    localStorage.setItem(PROFILE_STORE, JSON.stringify(context.store));
  }

  function revealPercent(percent) {
    if (percent >= 100) return 100;
    return Math.max(0, Math.floor(Number(percent || 0) / 25) * 25);
  }

  function statusFor(item, collection) {
    const progress = model.progress(item.id, collection);
    const owned = Boolean(progress?.owned);
    const equipped = owned && collection.equippedAvatarId === item.id;
    const pct = owned ? 100 : revealPercent(progress?.percent || 0);
    return {progress, owned, equipped, pct};
  }

  function unlockText(item) {
    if (item.rarity === "starter") return "Starter avatar";
    if (item.levelReward) return `Level ${item.levelReward} reward`;
    if (item.rarity === "common") return "Common shard pool";
    if (item.rarity === "uncommon") return "Uncommon shard pool";
    if (item.rarity === "rare") return "Rare shard pool";
    return "Special reward";
  }

  function cardMarkup(item, collection) {
    const state = statusFor(item, collection);
    const requirement = Math.max(0, Number(item.shardRequirement || 0));
    const shards = state.owned ? requirement : Math.max(0, Number(state.progress?.shards || 0));
    const status = state.equipped ? "Equipped" : state.owned ? "Unlocked" : state.pct ? `${state.pct}% found` : "Locked";
    const primary = state.equipped ? "Equipped" : state.owned ? "Equip" : "Details";
    return `
      <article class="avatar-page-card ${state.owned ? "is-owned" : "is-locked"} ${state.equipped ? "is-equipped" : ""}" data-avatar-page-card="${item.id}">
        <div class="avatar-page-card-art">
          <span class="avatar-page-status">${esc(status)}</span>
          <img src="${esc(item.image)}" data-sq-avatar-id="${item.id}" alt="${esc(item.name)}" loading="lazy">
        </div>
        <div class="avatar-page-card-copy">
          <strong>${esc(item.name)}</strong>
          <small>${esc(item.rarity)} · ${esc(item.category)}</small>
          <div class="avatar-page-progress"><span style="width:${state.pct}%"></span></div>
          <div class="avatar-page-progress-label"><span>${requirement ? `${shards} / ${requirement} shards` : state.owned ? "Owned" : "Not selected"}</span><span>${state.pct}%</span></div>
        </div>
        <div class="avatar-page-card-actions">
          <button class="${state.owned && !state.equipped ? "primary" : ""}" type="button" data-avatar-page-primary="${item.id}" ${state.equipped ? "disabled" : ""}>${esc(primary)}</button>
          <button type="button" data-avatar-page-detail="${item.id}">Info</button>
        </div>
      </article>`;
  }

  function visibleItems(items) {
    return items.filter(item => {
      if (activeFilter !== "all" && item.rarity !== activeFilter) return false;
      if (!searchTerm) return true;
      return `${item.name} ${item.rarity} ${item.category}`.toLowerCase().includes(searchTerm);
    });
  }

  function render() {
    const context = readContext();
    if (!context || !view) return;
    const {collection} = context;
    const all = model.catalogue;
    const owned = all.filter(item => statusFor(item, collection).owned).length;
    const partial = all.filter(item => {
      const state = statusFor(item, collection);
      return !state.owned && Number(state.progress?.shards || 0) > 0;
    }).length;
    const equipped = model.get(collection.equippedAvatarId);

    summary.innerHTML = `
      <span class="avatar-page-summary-pill">${owned} of ${all.length} unlocked</span>
      <span class="avatar-page-summary-pill">${partial} in progress</span>
      <span class="avatar-page-summary-pill">Equipped: ${esc(equipped?.name || "None")}</span>`;

    content.innerHTML = RARITY_ORDER.map(rarity => {
      const items = visibleItems(model.list({rarity}));
      if (!items.length) return "";
      const rarityAll = model.list({rarity});
      const rarityOwned = rarityAll.filter(item => statusFor(item, collection).owned).length;
      return `
        <section class="avatar-page-rarity" data-avatar-page-rarity="${rarity}">
          <div class="avatar-page-rarity-heading"><h3>${esc(RARITY_LABELS[rarity])}</h3><span>${rarityOwned} / ${rarityAll.length} unlocked</span></div>
          <div class="avatar-page-grid">${items.map(item => cardMarkup(item, collection)).join("")}</div>
        </section>`;
    }).join("") || `<div class="avatar-page-detail"><p>No avatars match this filter.</p></div>`;

    window.SalitaAvatarArtwork?.repair?.(view);
  }

  function equip(id) {
    const context = readContext();
    if (!context) return false;
    const item = model.get(id);
    if (!item || !context.collection.ownedAvatarIds.includes(item.id)) return false;
    context.collection.equippedAvatarId = item.id;
    saveContext(context);
    document.dispatchEvent(new CustomEvent("salita:avatar-equipped", {detail:{avatarId:item.id, avatar:item}}));
    document.dispatchEvent(new CustomEvent("salita:avatar-collection-changed", {detail:{avatarId:item.id, source:"avatar-page-v2"}}));
    render();
    openDetail(item.id);
    return true;
  }

  function openDetail(id) {
    const context = readContext();
    const item = model?.get(id);
    if (!context || !item || !detail) return;
    const state = statusFor(item, context.collection);
    const requirement = Math.max(0, Number(item.shardRequirement || 0));
    const shards = state.owned ? requirement : Math.max(0, Number(state.progress?.shards || 0));
    detail.innerHTML = `
      <div class="avatar-page-detail-inner">
        <img src="${esc(item.image)}" data-sq-avatar-id="${item.id}" alt="${esc(item.name)}">
        <div><h3>${esc(item.name)}</h3><p>${esc(item.rarity)} · ${esc(item.category)}</p><p><strong>Unlock:</strong> ${esc(unlockText(item))}</p><p><strong>Progress:</strong> ${requirement ? `${shards} of ${requirement} shards` : state.owned ? "Unlocked" : "Not owned"}</p></div>
        <button type="button" data-avatar-page-close-detail>Close details</button>
      </div>`;
    detail.hidden = false;
    window.SalitaAvatarArtwork?.repair?.(detail);
    detail.scrollIntoView({block:"nearest", behavior:matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"});
  }

  function ensureView() {
    if (document.getElementById("avatarsView")) return document.getElementById("avatarsView");
    const main = document.querySelector(".main-area");
    const settings = document.getElementById("settingsView");
    if (!main || !settings) return null;
    view = document.createElement("section");
    view.id = "avatarsView";
    view.className = "view avatar-collection-page-v2";
    view.innerHTML = `
      <section class="avatar-page-hero">
        <div><p class="eyebrow">Account-wide collection</p><h2>Your Avatars</h2><p>Unlock Philippine-inspired avatars, track shard progress, and equip any avatar you own.</p></div>
        <div class="avatar-page-emblem"><img alt="" data-avatar-page-emblem></div>
      </section>
      <div class="avatar-page-summary"></div>
      <div class="avatar-page-toolbar" role="toolbar" aria-label="Filter avatar collection">
        <button class="avatar-page-filter is-active" type="button" data-avatar-page-filter="all">All</button>
        ${RARITY_ORDER.map(rarity => `<button class="avatar-page-filter" type="button" data-avatar-page-filter="${rarity}">${rarity[0].toUpperCase()+rarity.slice(1)}</button>`).join("")}
        <span class="avatar-page-toolbar-spacer"></span>
        <input class="avatar-page-search" type="search" placeholder="Search avatars" aria-label="Search avatars">
      </div>
      <div class="avatar-page-detail" hidden></div>
      <div class="avatar-page-content"></div>`;
    main.insertBefore(view, settings);
    summary = view.querySelector(".avatar-page-summary");
    content = view.querySelector(".avatar-page-content");
    detail = view.querySelector(".avatar-page-detail");

    view.addEventListener("click", event => {
      const filter = event.target.closest("[data-avatar-page-filter]");
      if (filter) {
        activeFilter = filter.dataset.avatarPageFilter;
        view.querySelectorAll("[data-avatar-page-filter]").forEach(button => button.classList.toggle("is-active", button === filter));
        render();
        return;
      }
      const primary = event.target.closest("[data-avatar-page-primary]");
      if (primary && !primary.disabled) {
        const id = primary.dataset.avatarPagePrimary;
        const context = readContext();
        const item = model.get(id);
        if (context && item && context.collection.ownedAvatarIds.includes(id)) equip(id);
        else openDetail(id);
        return;
      }
      const info = event.target.closest("[data-avatar-page-detail]");
      if (info) openDetail(info.dataset.avatarPageDetail);
      if (event.target.closest("[data-avatar-page-close-detail]")) detail.hidden = true;
    });
    view.querySelector(".avatar-page-search").addEventListener("input", event => {
      searchTerm = event.target.value.trim().toLowerCase();
      render();
    });
    return view;
  }

  function updateEmblem() {
    const context = readContext();
    const item = context ? model.get(context.collection.equippedAvatarId) : null;
    const image = view?.querySelector("[data-avatar-page-emblem]");
    if (!image || !item) return;
    image.src = item.image;
    image.dataset.sqAvatarId = item.id;
  }

  function open() {
    if (!ensureView()) return false;
    render();
    updateEmblem();
    if (typeof switchView === "function") switchView("avatars");
    else {
      document.querySelectorAll(".view").forEach(node => node.classList.remove("active"));
      view.classList.add("active");
      document.body.dataset.currentView = "avatars";
    }
    const title = document.getElementById("viewTitle");
    const mobileTitle = document.getElementById("mobileViewTitle");
    if (title) title.textContent = "Your Avatars";
    if (mobileTitle) mobileTitle.textContent = "Avatars";
    window.scrollTo({top:0, behavior:"auto"});
    return true;
  }

  function interceptLegacyOpen(event) {
    event.stopImmediatePropagation();
    open();
  }

  function install() {
    model = window.SalitaAvatarModel;
    if (!model || typeof model.catalogue === "undefined" || !document.querySelector(".main-area")) {
      window.setTimeout(install, 100);
      return;
    }
    ensureView();
    document.addEventListener("salita:open-avatar-collection", interceptLegacyOpen, true);
    document.addEventListener("salita:avatar-collection-changed", render);
    document.addEventListener("salita:avatar-equipped", () => { updateEmblem(); render(); });
    window.SalitaAvatarCollectionPage = Object.freeze({open, render, equip});
  }

  install();
})();
