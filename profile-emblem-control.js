(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestProfileEmblemControlInstalled";
  const RELEASE_VERSION = "5.5.6";
  const AVATAR_CASE_VERSION = "5.5.9";
  const SHARING_VERSION = "5.5.20.1";
  const BADGE_EXPANSION_VERSION = "5.6.0";
  const COIN_SHOP_VERSION = "5.6.4";
  let assetPromise = null;

  function addStylesheet(key, href) {
    if (document.querySelector(`link[data-sq-avatar-asset="${key}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.sqAvatarAsset = key;
    document.head.appendChild(link);
  }

  function loadScript(key, src, errorMessage) {
    const existing = document.querySelector(`script[data-sq-avatar-asset="${key}"]`);
    if (existing?.dataset.loaded === "true") return Promise.resolve();
    if (existing) return new Promise((resolve, reject) => {
      existing.addEventListener("load", resolve, {once:true});
      existing.addEventListener("error", reject, {once:true});
    });
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.dataset.sqAvatarAsset = key;
      script.onload = () => { script.dataset.loaded = "true"; resolve(); };
      script.onerror = () => {
        console.warn(errorMessage);
        reject(new Error(errorMessage));
      };
      document.body.appendChild(script);
    });
  }

  function loadAvatarProgressionAssets() {
    if (assetPromise) return assetPromise;
    addStylesheet("collection-css", `./avatar-collection-screen-v1.css?v=${RELEASE_VERSION}`);
    addStylesheet("case-css", `./avatar-case-v1.css?v=${AVATAR_CASE_VERSION}`);
    addStylesheet("weekly-css", `./weekly-avatar-shard-rewards-v1.css?v=${RELEASE_VERSION}`);
    addStylesheet("unlock-css", `./avatar-unlock-celebration-v1.css?v=${RELEASE_VERSION}`);
    addStylesheet("hotfix-css", `./avatar-progression-hotfix-v551.css?v=${RELEASE_VERSION}`);
    addStylesheet("sharing-router-css", `./achievement-sharing-router-v2.css?v=${SHARING_VERSION}`);
    addStylesheet("coin-shop-css", `./coin-avatar-shard-shop-v1.css?v=${COIN_SHOP_VERSION}`);
    addStylesheet("coin-shop-topbar-css", `./coin-avatar-shop-topbar-v1.css?v=${COIN_SHOP_VERSION}`);

    assetPromise = (async () => {
      if (!window.SalitaAvatarModel) {
        await loadScript("catalogue", `./avatar-catalogue-v1.js?v=${RELEASE_VERSION}`, "Avatar catalogue could not be loaded.");
      }
      await loadScript("artwork-runtime", `./avatar-artwork-registry-v554.js?v=${RELEASE_VERSION}`, "Avatar artwork resolver could not be loaded.");
      await loadScript("hotfix-runtime", `./avatar-progression-hotfix-v551.js?v=${RELEASE_VERSION}`, "Avatar progression compatibility could not be loaded.");
      await window.SalitaAvatarHotfixReady;
      await window.SalitaAvatarArtworkReady;
      await loadScript("migration", `./avatar-progression-migration-v1.js?v=${RELEASE_VERSION}`, "Avatar progression migration could not be loaded.");
      await loadScript("collection", `./avatar-collection-screen-v1.js?v=${RELEASE_VERSION}`, "Avatar collection screen could not be loaded.");
      await loadScript("case", `./avatar-case-v1.js?v=${AVATAR_CASE_VERSION}`, "Avatar Case could not be loaded.");
      await loadScript("weekly", `./weekly-avatar-shard-rewards-v1.js?v=${RELEASE_VERSION}`, "Weekly avatar rewards could not be loaded.");
      await loadScript("level", `./level-avatar-rewards-v1.js?v=${RELEASE_VERSION}`, "Level avatar rewards could not be loaded.");
      await loadScript("unlock", `./avatar-unlock-celebration-v1.js?v=${RELEASE_VERSION}`, "Avatar unlock celebration could not be loaded.");
      await loadScript(
        "achievement-sharing-router",
        `./achievement-sharing-router-v2.js?v=${SHARING_VERSION}`,
        "Achievement sharing choices could not be loaded."
      );
      await loadScript(
        "sharing",
        `./achievement-sharing-avatar-bridge-v1.js?v=${SHARING_VERSION}`,
        "Avatar-aware sharing could not be loaded."
      );
      await loadScript(
        "long-term-badges",
        `./long-term-badges-v1.js?v=${BADGE_EXPANSION_VERSION}`,
        "Long-term badge catalogue could not be loaded."
      );
      await loadScript(
        "coin-avatar-shop",
        `./coin-avatar-shard-shop-v1.js?v=${COIN_SHOP_VERSION}`,
        "Coin avatar shard shop could not be loaded."
      );
      await loadScript(
        "coin-avatar-shop-badges",
        `./coin-avatar-shop-badges-v1.js?v=${COIN_SHOP_VERSION}`,
        "Coin shop badge catalogue could not be loaded."
      );
      await loadScript(
        "coin-avatar-shop-topbar",
        `./coin-avatar-shop-topbar-v1.js?v=${COIN_SHOP_VERSION}`,
        "Topbar shard shop control could not be loaded."
      );
      window.SalitaAvatarArtwork?.syncEquipped();
      document.dispatchEvent(new CustomEvent("salita:avatar-progression-ready", {
        detail:{version:RELEASE_VERSION,avatarCaseVersion:AVATAR_CASE_VERSION,sharingVersion:SHARING_VERSION,badgeExpansionVersion:BADGE_EXPANSION_VERSION,coinShopVersion:COIN_SHOP_VERSION}
      }));
    })().catch(error => console.warn("Salita Quest avatar progression did not fully load", error));
    return assetPromise;
  }

  function retry() { window.setTimeout(install, 90); }

  function install() {
    const host = document.querySelector(".sq-profile-control");
    const originalButton = host?.querySelector(".sq-profile-button");
    const menu = host?.querySelector(".sq-profile-menu");
    const desktopMark = document.querySelector(".sidebar .brand-mark");
    const mobileMark = document.querySelector(".mobile-brand-mark");
    if (!host || !originalButton || !menu || !desktopMark || !mobileMark) {
      retry();
      return;
    }
    if (window[INSTALL_FLAG]) return;
    window[INSTALL_FLAG] = true;

    const originalImage = originalButton.querySelector("img");
    const avatarId = originalImage?.dataset.sqAvatarId || originalImage?.dataset.avatarId || "anahaw";
    const item = window.SalitaAvatarModel?.get?.(avatarId);
    const imageSource = window.SalitaAvatarArtwork?.getAvatarImagePath?.(avatarId)
      || item?.image
      || "avatars/canonical/anahaw.png";
    const triggers = [];

    function positionMenu(trigger) {
      const rect = trigger.getBoundingClientRect();
      const width = Math.min(260, window.innerWidth - 24);
      let left = Math.max(12, rect.left);
      if (left + width > window.innerWidth - 12) left = window.innerWidth - width - 12;
      menu.style.left = `${left}px`;
      menu.style.top = `${Math.min(window.innerHeight - 20, rect.bottom + 10)}px`;
      menu.style.right = "auto";
      menu.style.bottom = "auto";
      menu.style.width = `${width}px`;
    }

    function syncExpanded() {
      triggers.forEach(trigger => trigger.setAttribute("aria-expanded", String(!menu.hidden)));
    }

    function makeTrigger(anchor, mobile) {
      anchor.innerHTML = `<img src="${imageSource}" alt="" aria-hidden="true" data-sq-avatar-id="${avatarId}">`;
      anchor.classList.add("sq-profile-emblem-trigger");
      anchor.dataset.profileEmblem = mobile ? "mobile" : "desktop";
      anchor.setAttribute("role", "button");
      anchor.setAttribute("tabindex", "0");
      anchor.setAttribute("aria-label", "Open learner menu");
      anchor.setAttribute("aria-expanded", "false");
      triggers.push(anchor);
      window.SalitaAvatarArtwork?.repair(anchor);
      const open = event => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        if (menu.hidden) positionMenu(anchor);
        originalButton.click();
        syncExpanded();
      };
      anchor.addEventListener("click", open, true);
      anchor.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") open(event);
      }, true);
    }

    makeTrigger(desktopMark, false);
    makeTrigger(mobileMark, true);
    new MutationObserver(syncExpanded).observe(menu, {attributes:true, attributeFilter:["hidden"]});
    window.addEventListener("resize", () => {
      if (menu.hidden) return;
      positionMenu(window.matchMedia("(max-width: 1000px)").matches ? mobileMark : desktopMark);
    }, {passive:true});
    document.addEventListener("salita:avatar-equipped", event => {
      const id = event.detail?.avatarId || event.detail?.avatar?.id;
      const name = event.detail?.avatar?.name || "";
      triggers.forEach(trigger => {
        const image = trigger.querySelector("img");
        if (image && id) window.SalitaAvatarArtwork?.bind(image, id, {alt:name});
      });
    });

    window.SalitaAvatarArtwork?.syncEquipped();
    const version = document.querySelector(".version-label");
    if (version) version.textContent = document.body.dataset.course === "cebuano"
      ? "Bisaya Foundation 0.3 · Canonical avatars 5.5.6"
      : "Version 5.5.6 · Canonical avatars";
    document.documentElement.dataset.salitaRelease = RELEASE_VERSION;
  }

  loadAvatarProgressionAssets();
  install();
})();