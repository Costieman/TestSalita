(() => {
  "use strict";

  if (window.__salitaCoinAvatarRevealV1Installed) return;
  window.__salitaCoinAvatarRevealV1Installed = true;

  const GRANT_ID = "coinShopAnimation10000V1";
  const GRANT_AMOUNT = 10000;
  const PROGRESS_PREFIX = "salitaQuestProgress";
  const PROFILE_STORE = "salitaQuestLocalProfilesV1";
  const ACTIVE_PROFILE = "salitaQuestActiveProfileId";
  const MYSTERY_COST = 2500;
  const SHARDS_PER_PACK = 25;
  const MYSTERY_ODDS = Object.freeze({common:40, uncommon:35, rare:25});
  const STARTER_RANDOM_RARITY = "common";
  const sleep = ms => new Promise(resolve => window.setTimeout(resolve, ms));

  function globalValue(name) {
    try { return eval(`typeof ${name} !== "undefined" ? ${name} : undefined`); }
    catch { return undefined; }
  }

  function shopRandomPoolActive() {
    const backdrop = document.querySelector(".sq-coin-shop-backdrop");
    return Boolean(backdrop && !backdrop.hidden);
  }

  function installRandomPoolModel() {
    const model = window.SalitaAvatarModel;
    if (!model || model.phase3RandomPools) return model;

    const catalogue = Object.freeze(model.catalogue.map(item => Object.freeze(
      model.starterIds.includes(item.id)
        ? {...item, randomRarity:STARTER_RANDOM_RARITY, shardRequirement:100}
        : {...item, randomRarity:item.rarity}
    )));
    const byId = Object.freeze(Object.fromEntries(catalogue.map(item => [item.id, item])));
    const get = value => byId[model.normaliseId(value)] || null;

    function list(filters = {}) {
      if (shopRandomPoolActive() && ["common", "uncommon", "rare"].includes(filters.rarity)) {
        return catalogue.filter(item => (item.randomRarity || item.rarity) === filters.rarity && item.levelReward == null)
          .filter(item => Object.entries(filters).every(([key, value]) => key === "rarity" || value == null || item[key] === value));
      }
      return catalogue.filter(item => Object.entries(filters).every(([key, value]) => value == null || item[key] === value));
    }

    function normaliseCollectionState(input = {}, fallbackAvatarId = "") {
      const source = input && typeof input === "object" ? input : {};
      const collection = model.normaliseCollectionState(source, fallbackAvatarId);
      const ownedAvatarIds = collection.ownedAvatarIds;
      for (const id of model.starterIds) {
        const amount = ownedAvatarIds.includes(id) ? 100 : Math.max(0, Math.min(100, Math.floor(Number(source.shards?.[id]) || 0)));
        if (amount > 0) collection.shards[id] = amount;
      }
      return collection;
    }

    function progress(value, state = {}) {
      const item = get(value);
      if (!item) return null;
      const collection = normaliseCollectionState(state);
      const owned = collection.ownedAvatarIds.includes(item.id);
      const required = item.shardRequirement || 0;
      const shards = owned ? required : Math.max(0, Number(collection.shards[item.id]) || 0);
      const percent = required === 0 ? (owned ? 100 : 0) : Math.min(100, Math.round(shards / required * 100));
      return Object.freeze({avatarId:item.id, owned, shards, required, percent});
    }

    window.SalitaAvatarCatalogue = catalogue;
    window.SalitaAvatarModel = Object.freeze({...model, phase3RandomPools:true, catalogue, byId, get, list, normaliseCollectionState, progress});
    document.dispatchEvent(new CustomEvent("salita:avatar-random-pools-ready"));
    return window.SalitaAvatarModel;
  }

  function appState() { return globalValue("state") || window.state || null; }
  function saveProgress() {
    const saveState = globalValue("saveState") || window.saveState;
    if (typeof saveState === "function") saveState();
    else if (appState()) localStorage.setItem(PROGRESS_PREFIX, JSON.stringify(appState()));
  }
  function balance() { return Math.max(0, Math.floor(Number(appState()?.coins || 0))); }
  function refreshWallet() {
    try { (globalValue("updateGlobalUI") || window.updateGlobalUI)?.(); } catch {}
    const amount = String(balance());
    ["coinValue", "mobileCoinValue"].forEach(id => {
      const node = document.getElementById(id);
      if (node) node.textContent = amount;
    });
    document.dispatchEvent(new CustomEvent("salita:coin-balance-changed", {detail:{coins:balance()}}));
  }

  function grantPayload(payload) {
    if (!payload || typeof payload !== "object") return false;
    payload.testingGrants = payload.testingGrants && typeof payload.testingGrants === "object" ? payload.testingGrants : {};
    if (payload.testingGrants[GRANT_ID]) return false;
    payload.coins = Math.max(0, Math.floor(Number(payload.coins || 0))) + GRANT_AMOUNT;
    payload.testingGrants[GRANT_ID] = {amount:GRANT_AMOUNT,grantedAt:new Date().toISOString()};
    return true;
  }

  function awardTestingCoins() {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key || !key.startsWith(PROGRESS_PREFIX)) continue;
      try {
        const payload = JSON.parse(localStorage.getItem(key) || "null");
        if (grantPayload(payload)) localStorage.setItem(key, JSON.stringify(payload));
      } catch {}
    }
    const state = appState();
    if (grantPayload(state)) {
      saveProgress();
      refreshWallet();
    }
  }

  function readAccount() {
    try {
      const store = JSON.parse(localStorage.getItem(PROFILE_STORE) || "null");
      const activeId = sessionStorage.getItem(ACTIVE_PROFILE);
      const profile = store?.profiles?.find(item => item.id === activeId);
      const model = installRandomPoolModel();
      if (!store || !profile || !model) return null;
      const collection = model.normaliseCollectionState(profile.avatarCollection, profile.avatarId);
      return {store, profile, model, collection};
    } catch { return null; }
  }

  function writeAccount(account) {
    account.profile.avatarCollection = account.collection;
    if (account.collection.equippedAvatarId) account.profile.avatarId = account.collection.equippedAvatarId;
    account.store.updatedAt = new Date().toISOString();
    localStorage.setItem(PROFILE_STORE, JSON.stringify(account.store));
  }

  function eligible(account, rarity) {
    const claimedLevels = new Set((account.collection.levelRewardsClaimed || []).map(Number));
    return account.model.list({rarity}).filter(item => {
      if (account.collection.ownedAvatarIds.includes(item.id)) return false;
      if (item.levelReward && !claimedLevels.has(Number(item.levelReward))) return false;
      return true;
    });
  }

  function rollMysteryRarity(account) {
    const available = Object.keys(MYSTERY_ODDS).filter(rarity => eligible(account, rarity).length);
    if (!available.length) return null;
    const total = available.reduce((sum, rarity) => sum + MYSTERY_ODDS[rarity], 0);
    let roll = Math.random() * total;
    for (const rarity of available) {
      roll -= MYSTERY_ODDS[rarity];
      if (roll < 0) return rarity;
    }
    return available[available.length - 1];
  }

  function purchaseMystery() {
    const state = appState();
    const account = readAccount();
    if (!state || !account) return {ok:false,message:"The shop is not ready yet."};
    if (balance() < MYSTERY_COST) return {ok:false,message:`You need ${MYSTERY_COST.toLocaleString()} coins.`};
    const actualRarity = rollMysteryRarity(account);
    if (!actualRarity) return {ok:false,message:"Every available avatar has already been collected."};
    const pool = eligible(account, actualRarity);
    const item = pool[Math.floor(Math.random() * pool.length)];
    const before = Math.max(0, Number(account.collection.shards[item.id]) || 0);
    const after = Math.min(item.shardRequirement, before + SHARDS_PER_PACK);
    const unlocked = after >= item.shardRequirement;

    state.coins = balance() - MYSTERY_COST;
    account.collection.shards[item.id] = after;
    if (unlocked && !account.collection.ownedAvatarIds.includes(item.id)) {
      account.collection.ownedAvatarIds.push(item.id);
      account.collection.pendingUnlocks.push({avatarId:item.id,source:"coin_mystery_pack",unlockedAt:new Date().toISOString(),seen:false});
    }
    state.coinEconomy = state.coinEconomy && typeof state.coinEconomy === "object" ? state.coinEconomy : {};
    const economy = state.coinEconomy;
    economy.lifetimeSpent = Math.max(0, Number(economy.lifetimeSpent || 0)) + MYSTERY_COST;
    economy.shardPacksPurchased = Math.max(0, Number(economy.shardPacksPurchased || 0)) + 1;
    economy.mysteryPacksPurchased = Math.max(0, Number(economy.mysteryPacksPurchased || 0)) + 1;
    economy.packsByRarity = economy.packsByRarity && typeof economy.packsByRarity === "object" ? economy.packsByRarity : {};
    economy.packsByRarity[actualRarity] = Math.max(0, Number(economy.packsByRarity[actualRarity] || 0)) + 1;
    economy.purchaseHistory = Array.isArray(economy.purchaseHistory) ? economy.purchaseHistory : [];
    economy.purchaseHistory.push({rarity:actualRarity,requestedRarity:"mystery",mystery:true,avatarId:item.id,cost:MYSTERY_COST,shards:SHARDS_PER_PACK,before,after,unlocked,purchasedAt:new Date().toISOString()});
    economy.purchaseHistory = economy.purchaseHistory.slice(-100);

    writeAccount(account);
    saveProgress();
    refreshWallet();
    try { (globalValue("syncEarned") || window.syncEarned)?.(); } catch {}
    document.dispatchEvent(new CustomEvent("salita:avatar-collection-changed", {detail:{avatarId:item.id,source:"coin_mystery_pack"}}));
    document.dispatchEvent(new CustomEvent("salita:coin-shard-pack-purchased", {detail:{rarity:actualRarity,actualRarity,requestedRarity:"mystery",mystery:true,avatar:item,cost:MYSTERY_COST,before,after,unlocked,coinsRemaining:balance()}}));
    return {ok:true,item,actualRarity,before,after,unlocked,coinsRemaining:balance()};
  }

  function installMysteryCard() {
    const grid = document.querySelector(".sq-coin-shop-grid");
    if (!grid || grid.querySelector('[data-coin-pack="mystery"]')) return;
    const card = document.createElement("article");
    card.className = "sq-coin-pack mystery";
    card.innerHTML = `<span class="sq-coin-pack-icon">🎁</span><h3>Mystery pack</h3><strong>25 random shards</strong><p>40% Common · 35% Uncommon · 25% Rare</p><button type="button" data-coin-pack="mystery">${MYSTERY_COST.toLocaleString()} coins</button>`;
    const rare = grid.querySelector(".sq-coin-pack.rare");
    grid.insertBefore(card, rare || null);
    const button = card.querySelector("button");
    button.disabled = balance() < MYSTERY_COST;
    button.addEventListener("click", event => {
      event.stopPropagation();
      const result = purchaseMystery();
      const message = document.querySelector(".sq-coin-shop-message");
      if (message) message.textContent = result.ok
        ? `${result.item.name} received 25 ${result.actualRarity} shards. ${result.coinsRemaining.toLocaleString()} coins remain.`
        : result.message;
      button.disabled = balance() < MYSTERY_COST;
    });
  }

  function imagePath(item) {
    return window.SalitaAvatarArtwork?.getAvatarImagePath?.(item.id) || item.image || `avatars/canonical/${item.id}.png`;
  }

  function ensureReveal() {
    let host = document.querySelector(".sq-coin-reveal-backdrop");
    if (host) return host;
    host = document.createElement("div");
    host.className = "sq-coin-reveal-backdrop";
    host.hidden = true;
    host.innerHTML = `<section class="sq-coin-reveal" role="dialog" aria-modal="true" aria-live="polite"><p class="sq-coin-reveal-kicker">RANDOM AVATAR</p><h2 class="sq-coin-reveal-title">Choosing your avatar…</h2><div class="sq-mystery-gift" hidden aria-hidden="true">🎁</div><div class="sq-coin-reveal-art"><img class="sq-coin-reveal-base" alt=""><div class="sq-coin-reveal-colour"><img alt=""></div><div class="sq-coin-reveal-shine" aria-hidden="true"></div></div><strong class="sq-coin-reveal-name"></strong><div class="sq-coin-reveal-track"><span></span></div><p class="sq-coin-reveal-progress"></p><div class="sq-coin-reveal-burst" aria-hidden="true">★</div><button class="sq-coin-reveal-done" type="button" hidden>Continue</button></section>`;
    document.body.appendChild(host);
    host.querySelector(".sq-coin-reveal-done").addEventListener("click", () => { host.hidden = true; });
    return host;
  }

  function showCandidate(host, item) {
    const src = imagePath(item);
    const base = host.querySelector(".sq-coin-reveal-base");
    const colour = host.querySelector(".sq-coin-reveal-colour img");
    base.src = src;
    base.alt = item.name || "Random avatar";
    colour.src = src;
    colour.alt = "";
    host.querySelector(".sq-coin-reveal-name").textContent = item.name || item.id;
  }

  async function runReveal(detail) {
    const host = ensureReveal();
    const model = installRandomPoolModel();
    if (!model || !detail?.avatar) return;
    const finalItem = detail.avatar;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const gift = host.querySelector(".sq-mystery-gift");
    const art = host.querySelector(".sq-coin-reveal-art");

    host.hidden = false;
    host.classList.remove("complete", "mystery-reveal");
    host.querySelector(".sq-coin-reveal-done").hidden = true;
    host.querySelector(".sq-coin-reveal-track span").style.width = "0%";
    host.querySelector(".sq-coin-reveal-colour").style.clipPath = "inset(100% 0 0 0)";

    if (detail.mystery) {
      host.classList.add("mystery-reveal");
      host.querySelector(".sq-coin-reveal-kicker").textContent = "MYSTERY PACK";
      host.querySelector(".sq-coin-reveal-title").textContent = "Revealing rarity…";
      host.querySelector(".sq-coin-reveal-progress").textContent = "40% Common · 35% Uncommon · 25% Rare";
      gift.hidden = false;
      art.hidden = true;
      await sleep(reduced ? 10 : 900);
      gift.hidden = true;
      art.hidden = false;
      host.dataset.rarity = detail.actualRarity || detail.rarity;
      host.querySelector(".sq-coin-reveal-title").textContent = `${String(detail.actualRarity || detail.rarity).toUpperCase()} rarity revealed!`;
      host.querySelector(".sq-coin-reveal-progress").textContent = "Now choosing your avatar…";
      await sleep(reduced ? 10 : 650);
    } else {
      host.querySelector(".sq-coin-reveal-kicker").textContent = "RANDOM AVATAR";
      gift.hidden = true;
      art.hidden = false;
    }

    const candidates = model.list({rarity:detail.actualRarity || detail.rarity});
    host.querySelector(".sq-coin-reveal-title").textContent = "Choosing your avatar…";
    host.querySelector(".sq-coin-reveal-progress").textContent = "Searching the collection";
    const cycles = reduced ? 1 : 12;
    for (let index = 0; index < cycles; index += 1) {
      showCandidate(host, candidates[Math.floor(Math.random() * candidates.length)] || finalItem);
      await sleep(reduced ? 10 : 85 + index * 12);
    }

    showCandidate(host, finalItem);
    host.querySelector(".sq-coin-reveal-title").textContent = `${finalItem.name} selected!`;
    host.querySelector(".sq-coin-reveal-progress").textContent = `${detail.before}% → ${detail.after}% complete`;
    host.querySelector(".sq-coin-reveal-track span").style.width = `${detail.before}%`;
    host.querySelector(".sq-coin-reveal-colour").style.clipPath = `inset(${100 - detail.before}% 0 0 0)`;
    await sleep(reduced ? 10 : 350);
    host.querySelector(".sq-coin-reveal-track span").style.width = `${detail.after}%`;
    host.querySelector(".sq-coin-reveal-colour").style.clipPath = `inset(${100 - detail.after}% 0 0 0)`;
    await sleep(reduced ? 10 : 1100);

    if (detail.unlocked) {
      host.classList.add("complete");
      host.querySelector(".sq-coin-reveal-title").textContent = "Avatar complete!";
      host.querySelector(".sq-coin-reveal-progress").textContent = `${finalItem.name} is now unlocked.`;
    } else {
      host.querySelector(".sq-coin-reveal-title").textContent = "+25 avatar shards!";
      host.querySelector(".sq-coin-reveal-progress").textContent = `${detail.after}% of ${finalItem.name} is now in colour.`;
    }
    host.querySelector(".sq-coin-reveal-done").hidden = false;
    host.querySelector(".sq-coin-reveal-done").focus();
  }

  document.addEventListener("salita:coin-shard-pack-purchased", event => runReveal(event.detail));

  function install() {
    if (!window.SalitaAvatarModel || !appState()) {
      window.setTimeout(install, 120);
      return;
    }
    installRandomPoolModel();
    awardTestingCoins();
    ensureReveal();
    installMysteryCard();
    const shop = document.querySelector(".sq-coin-shop-grid");
    if (shop) new MutationObserver(installMysteryCard).observe(shop, {childList:true});
    else window.setInterval(installMysteryCard, 600);
  }

  install();
})();