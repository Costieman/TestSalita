(() => {
  "use strict";

  if (window.__salitaAvatarCollectionScreenInstalled) return;
  window.__salitaAvatarCollectionScreenInstalled = true;

  const PROFILE_STORE = "salitaQuestLocalProfilesV1";
  const ACTIVE_PROFILE = "salitaQuestActiveProfileId";
  const RARITY_ORDER = ["starter", "common", "uncommon", "rare", "special"];
  const RARITY_LABELS = {
    starter:"Starter flora",
    common:"Common plants",
    uncommon:"Uncommon flowers and treasures",
    rare:"Rare Philippine animals",
    special:"Special prestige"
  };

  let model = null;
  let store = null;
  let profile = null;
  let collection = null;
  let root = null;
  let detail = null;
  let previousFocus = null;

  const esc = value => String(value ?? "").replace(/[&<>'"]/g, character => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;"
  }[character]));

  function waitForModel() {
    if (window.SalitaAvatarModel) return Promise.resolve(window.SalitaAvatarModel);
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const timer = window.setInterval(() => {
        attempts += 1;
        if (window.SalitaAvatarModel) {
          window.clearInterval(timer);
          resolve(window.SalitaAvatarModel);
        } else if (attempts >= 100) {
          window.clearInterval(timer);
          reject(new Error("Avatar catalogue was not available."));
        }
      }, 80);
    });
  }

  function readStore() {
    try {
      const value = JSON.parse(localStorage.getItem(PROFILE_STORE) || "null");
      return value && Array.isArray(value.profiles) ? value : {schemaVersion:1, profiles:[]};
    } catch {
      return {schemaVersion:1, profiles:[]};
    }
  }

  function writeStore() {
    if (!store) return;
    store.schemaVersion = 1;
    store.updatedAt = new Date().toISOString();
    localStorage.setItem(PROFILE_STORE, JSON.stringify(store));
  }

  function refreshProfile() {
    store = readStore();
    const activeId = sessionStorage.getItem(ACTIVE_PROFILE);
    profile = store.profiles.find(item => item.id === activeId) || null;
    if (!profile || !model) return false;
    collection = model.normaliseCollectionState(profile.avatarCollection, profile.avatarId);
    profile.avatarCollection = collection;
    if (collection.equippedAvatarId) profile.avatarId = collection.equippedAvatarId;
    writeStore();
    return true;
  }

  function revealPercent(percent) {
    if (percent >= 100) return 100;
    return Math.max(0, Math.floor(percent / 25) * 25);
  }

  function unlockRequirement(item) {
    if (item.rarity === "starter") return "Starter choice";
    if (item.levelReward === 99) return "Reach Level 99";
    if (item.levelReward) return `Reach Level ${item.levelReward} or collect shards`;
    if (item.rarity === "common") return "Complete one successful weekly reward box";
    if (item.rarity === "uncommon") return "Collect 100 shards across two weekly boxes";
    if (item.rarity === "rare") return "Collect 100 shards across four weekly boxes";
    return "Special reward";
  }

  function categoryDescription(item) {
    if (item.category === "animal") return "A collectible avatar inspired by the wildlife of the Philippines.";
    if (item.category === "object") return "A collectible avatar inspired by Philippine culture and design.";
    if (item.category === "special") return "A prestige avatar reserved for an exceptional Salita Quest milestone.";
    return "A collectible avatar inspired by Philippine flora.";
  }

  function stateFor(item) {
    const progress = model.progress(item.id, collection);
    const owned = Boolean(progress?.owned);
    const equipped = owned && collection.equippedAvatarId === item.id;
    const reveal = revealPercent(progress?.percent || 0);
    return {progress, owned, equipped, reveal};
  }

  function cardMarkup(item) {
    const state = stateFor(item);
    const required = item.shardRequirement || 0;
    const shards = state.owned ? required : state.progress?.shards || 0;
    const status = state.equipped ? "Equipped" : state.owned ? "Unlocked" : state.reveal ? `${state.reveal}% found` : "Locked";
    const action = state.equipped ? "Equipped" : state.owned ? "Equip avatar" : "View requirement";
    const progressLabel = required ? `${shards} / ${required} shards` : state.owned ? "Owned" : "Not selected";
    const progressWidth = state.owned ? 100 : state.reveal;
    const maskTop = 100 - progressWidth;

    return `
      <article class="sq-avatar-card ${state.owned ? "is-owned" : "is-locked"} ${state.equipped ? "is-equipped" : ""}" data-avatar-card="${item.id}">
        <button class="sq-avatar-card-open" type="button" data-avatar-detail="${item.id}" aria-label="View ${esc(item.name)} details">
          <div class="sq-avatar-card-art" style="--avatar-mask-top:${maskTop}%">
            <span class="sq-avatar-status-badge">${esc(status)}</span>
            <img class="sq-avatar-grey" src="${esc(item.image)}" data-sq-avatar-id="${item.id}" alt="">
            <img class="sq-avatar-colour" src="${esc(item.image)}" data-sq-avatar-id="${item.id}" alt="">
          </div>
          <div class="sq-avatar-card-copy">
            <strong title="${esc(item.name)}">${esc(item.name)}</strong>
            <small>${esc(item.rarity)} · ${esc(item.category)}</small>
          </div>
          <div class="sq-avatar-progress-track" aria-hidden="true"><div class="sq-avatar-progress-fill" style="--avatar-progress:${progressWidth}%"></div></div>
          <div class="sq-avatar-progress-text"><span>${esc(progressLabel)}</span><span>${progressWidth}%</span></div>
        </button>
        <button class="sq-avatar-card-action" type="button" data-avatar-action="${item.id}" ${state.equipped ? "disabled" : ""}>${esc(action)}</button>
      </article>`;
  }

  function render() {
    if (!root || !refreshProfile()) return;
    const ownedCount = collection.ownedAvatarIds.length;
    const partialCount = model.catalogue.filter(item => {
      const progress = model.progress(item.id, collection);
      return !progress.owned && progress.shards > 0;
    }).length;

    root.querySelector(".sq-avatar-collection-summary").innerHTML = `
      <span class="sq-avatar-summary-pill">${ownedCount} of ${model.catalogue.length} unlocked</span>
      <span class="sq-avatar-summary-pill">${partialCount} in progress</span>
      <span class="sq-avatar-summary-pill">Equipped: ${esc(model.get(collection.equippedAvatarId)?.name || "None")}</span>`;

    root.querySelector(".sq-avatar-collection-scroll").innerHTML = RARITY_ORDER.map(rarity => {
      const items = model.list({rarity});
      const unlocked = items.filter(item => stateFor(item).owned).length;
      return `
        <section class="sq-avatar-rarity-section" data-rarity="${rarity}">
          <div class="sq-avatar-rarity-heading"><h3>${esc(RARITY_LABELS[rarity])}</h3><span>${unlocked} / ${items.length} unlocked</span></div>
          <div class="sq-avatar-grid-full">${items.map(cardMarkup).join("")}</div>
        </section>`;
    }).join("");
    window.SalitaAvatarArtwork?.repair(root);
  }

  function syncVisibleAvatar(item) {
    document.querySelectorAll(".sq-profile-button img,.sq-profile-identity img,.sq-profile-emblem-trigger img,.player-avatar img").forEach(image => {
      image.dataset.sqAvatarId = item.id;
      if (window.SalitaAvatarArtwork) {
        window.SalitaAvatarArtwork.bind(image,item.id,{alt:item.name});
      } else {
        image.src = item.image;
        image.alt = item.name;
      }
    });
    document.querySelectorAll("[data-avatar-choice]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.avatarChoice === item.id));
    });
  }

  function equipAvatar(id) {
    if (!refreshProfile()) return false;
    const item = model.get(id);
    if (!item || !collection.ownedAvatarIds.includes(item.id)) return false;
    collection.equippedAvatarId = item.id;
    profile.avatarCollection = collection;
    profile.avatarId = item.id;
    writeStore();
    syncVisibleAvatar(item);
    document.dispatchEvent(new CustomEvent("salita:avatar-equipped", {detail:{avatarId:item.id, avatar:item}}));
    document.dispatchEvent(new CustomEvent("salita:avatar-collection-changed", {detail:{avatarId:item.id}}));
    render();
    if (detail && !detail.hidden) openDetail(item.id);
    return true;
  }

  function openDetail(id) {
    if (!refreshProfile()) return;
    const item = model.get(id);
    if (!item) return;
    const state = stateFor(item);
    const required = item.shardRequirement || 0;
    const shards = state.owned ? required : state.progress?.shards || 0;
    const detailImageStyle = state.owned ? "" : `filter:grayscale(1) saturate(0);opacity:${state.reveal ? ".82" : ".55"}`;
    detail.innerHTML = `
      <div class="sq-avatar-detail-card" role="document">
        <img src="${esc(item.image)}" data-sq-avatar-id="${item.id}" alt="${esc(item.name)}" style="${detailImageStyle}">
        <h3>${esc(item.name)}</h3>
        <div class="sq-avatar-detail-meta">${esc(item.rarity)} · ${esc(item.category)}</div>
        <p>${esc(categoryDescription(item))}</p>
        <p><strong>Unlock:</strong> ${esc(unlockRequirement(item))}</p>
        <p><strong>Progress:</strong> ${required ? `${shards} of ${required} shards` : state.owned ? "Unlocked" : "Not owned"}</p>
        <div class="sq-avatar-detail-actions">
          <button class="sq-avatar-detail-close" type="button" data-detail-close>Close</button>
          <button class="sq-avatar-detail-equip" type="button" data-detail-equip="${item.id}" ${!state.owned || state.equipped ? "disabled" : ""}>${state.equipped ? "Equipped" : state.owned ? "Equip avatar" : "Locked"}</button>
        </div>
      </div>`;
    window.SalitaAvatarArtwork?.repair(detail);
    detail.hidden = false;
    detail.querySelector("[data-detail-close]")?.focus();
  }

  function closeDetail() {
    if (detail) detail.hidden = true;
  }

  function open() {
    if (!root) return;
    previousFocus = document.activeElement;
    render();
    root.hidden = false;
    document.documentElement.style.overflow = "hidden";
    root.querySelector(".sq-avatar-collection-close")?.focus();
  }

  function close() {
    closeDetail();
    if (!root) return;
    root.hidden = true;
    document.documentElement.style.overflow = "";
    previousFocus?.focus?.();
  }

  function buildScreen() {
    root = document.createElement("div");
    root.className = "sq-avatar-collection-backdrop";
    root.hidden = true;
    root.innerHTML = `
      <section class="sq-avatar-collection-dialog" role="dialog" aria-modal="true" aria-labelledby="sqAvatarCollectionTitle">
        <header class="sq-avatar-collection-header">
          <div><p>ACCOUNT-WIDE COLLECTION</p><h2 id="sqAvatarCollectionTitle">Avatar Collection</h2><p>Unlock Philippine-inspired avatars and equip any one you own.</p></div>
          <button class="sq-avatar-collection-close" type="button" aria-label="Close avatar collection">×</button>
        </header>
        <div class="sq-avatar-collection-summary"></div>
        <div class="sq-avatar-collection-scroll"></div>
      </section>`;

    detail = document.createElement("div");
    detail.className = "sq-avatar-detail";
    detail.hidden = true;
    detail.setAttribute("role", "dialog");
    detail.setAttribute("aria-modal", "true");

    document.body.append(root, detail);

    root.addEventListener("click", event => {
      if (event.target === root || event.target.closest(".sq-avatar-collection-close")) {
        close();
        return;
      }
      const action = event.target.closest("[data-avatar-action]");
      if (action) {
        const item = model.get(action.dataset.avatarAction);
        if (item && stateFor(item).owned) equipAvatar(item.id);
        else if (item) openDetail(item.id);
        return;
      }
      const info = event.target.closest("[data-avatar-detail]");
      if (info) openDetail(info.dataset.avatarDetail);
    });

    detail.addEventListener("click", event => {
      if (event.target === detail || event.target.closest("[data-detail-close]")) closeDetail();
      const equip = event.target.closest("[data-detail-equip]");
      if (equip && !equip.disabled) equipAvatar(equip.dataset.detailEquip);
    });

    document.addEventListener("keydown", event => {
      if (event.key !== "Escape") return;
      if (detail && !detail.hidden) closeDetail();
      else if (root && !root.hidden) close();
    });

    document.addEventListener("salita:avatar-collection-changed", render);
    document.addEventListener("salita:open-avatar-collection", open);
  }

  function installLauncher() {
    const attach = () => {
      const menu = document.querySelector(".sq-profile-menu");
      if (!menu) return false;
      if (menu.querySelector("[data-avatar-collection]")) return true;
      const button = document.createElement("button");
      button.className = "sq-profile-action";
      button.type = "button";
      button.dataset.avatarCollection = "true";
      button.textContent = "Avatar collection";
      button.addEventListener("click", event => {
        event.stopPropagation();
        open();
      });
      const courseButton = menu.querySelector("[data-course]");
      menu.insertBefore(button, courseButton || null);
      return true;
    };

    if (attach()) return;
    const observer = new MutationObserver(() => {
      if (attach()) observer.disconnect();
    });
    observer.observe(document.documentElement, {childList:true, subtree:true});
  }

  waitForModel().then(value => {
    model = value;
    buildScreen();
    installLauncher();
    window.SalitaAvatarCollectionScreen = Object.freeze({open, close, render, equip:equipAvatar});
  }).catch(error => console.warn("Salita Quest avatar collection could not start", error));
})();
