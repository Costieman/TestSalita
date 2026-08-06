(() => {
  "use strict";

  if (window.__salitaAvatarArtworkRegistryV556Installed) return;
  window.__salitaAvatarArtworkRegistryV556Installed = true;

  const RELEASE = "5.5.6";
  const PROFILE_STORE = "salitaQuestLocalProfilesV1";
  const ACTIVE_PROFILE = "salitaQuestActiveProfileId";

  function slug(value) {
    return String(value || "").trim().toLowerCase().replace(/[’']/g, "")
      .replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  }

  function normaliseId(value) {
    return window.SalitaAvatarModel?.normaliseId?.(value) || slug(value);
  }

  function itemFor(value) {
    return window.SalitaAvatarModel?.get?.(normaliseId(value)) || null;
  }

  function placeholder(value) {
    const item = itemFor(value);
    const label = item?.name || String(value || "Avatar").replace(/_/g, " ");
    const initials = label.split(/\s+/).filter(Boolean).slice(0, 2)
      .map(word => word[0]).join("").toUpperCase() || "SQ";
    const safeLabel = label.replace(/[&<>"']/g, character => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
    }[character]));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" rx="22" fill="#e7f1ed"/><circle cx="64" cy="52" r="30" fill="#c8ddd5"/><text x="64" y="62" text-anchor="middle" font-family="system-ui,sans-serif" font-size="27" font-weight="800" fill="#244842">${initials}</text><text x="64" y="104" text-anchor="middle" font-family="system-ui,sans-serif" font-size="8" font-weight="700" fill="#46645f">${safeLabel.slice(0, 24)}</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function getAvatarImagePath(value) {
    return itemFor(value)?.image || placeholder(value);
  }

  function resolve(value) {
    return Promise.resolve(getAvatarImagePath(value));
  }

  function inferId(image) {
    const direct = image?.dataset?.avatarId || image?.dataset?.sqAvatarId;
    if (direct) return normaliseId(direct);
    const owner = image?.closest?.("[data-avatar-card],[data-avatar-choice],[data-avatar-action],[data-detail-equip]");
    return normaliseId(owner?.dataset.avatarCard || owner?.dataset.avatarChoice || owner?.dataset.avatarAction || owner?.dataset.detailEquip || "");
  }

  function bind(image, value, options = {}) {
    if (!(image instanceof HTMLImageElement)) return Promise.resolve("");
    const id = normaliseId(value || inferId(image));
    const item = itemFor(id);
    if (!item) return Promise.resolve("");

    const source = item.image;
    image.dataset.sqAvatarId = item.id;
    if (options.alt !== undefined) image.alt = options.alt;
    image.onerror = () => {
      image.onerror = null;
      image.dataset.sqAvatarFallback = "true";
      image.src = placeholder(item.id);
    };
    if (image.getAttribute("src") !== source) image.src = source;
    return Promise.resolve(source);
  }

  function repair(scope) {
    if (!scope) return;
    if (scope instanceof HTMLImageElement) {
      const id = inferId(scope);
      if (id) bind(scope, id);
      return;
    }
    scope.querySelectorAll?.("img[data-sq-avatar-id],img[data-avatar-id]").forEach(image => {
      const id = inferId(image);
      if (id) bind(image, id);
    });
  }

  function activeEquippedId() {
    try {
      const store = JSON.parse(localStorage.getItem(PROFILE_STORE) || "null");
      const activeId = sessionStorage.getItem(ACTIVE_PROFILE);
      const profile = store?.profiles?.find?.(item => item.id === activeId);
      return normaliseId(profile?.avatarCollection?.equippedAvatarId || profile?.avatarId || "");
    } catch {
      return "";
    }
  }

  function syncEquipped(value) {
    const id = normaliseId(value || activeEquippedId());
    const item = itemFor(id);
    if (!item) return;
    document.querySelectorAll(
      ".sq-profile-button img,.sq-profile-identity img,.sq-profile-emblem-trigger img,.player-avatar img"
    ).forEach(image => bind(image, item.id, {alt:item.name}));
  }

  function loadImage(source) {
    return new Promise(resolveLoad => {
      const image = new Image();
      image.onload = () => resolveLoad(true);
      image.onerror = () => resolveLoad(false);
      image.src = source;
    });
  }

  async function verifyAll() {
    const catalogue = window.SalitaAvatarModel?.catalogue || [];
    const results = await Promise.all(catalogue.map(async item => ({
      id:item.id,
      source:item.image,
      working:await loadImage(item.image)
    })));
    const failed = results.filter(result => !result.working).map(result => result.id);
    return Object.freeze({release:RELEASE, total:results.length, working:results.length - failed.length, failed:Object.freeze(failed)});
  }

  async function waitForModel() {
    for (let attempt = 0; attempt < 150; attempt += 1) {
      if (window.SalitaAvatarModel?.catalogue?.length === 48) return window.SalitaAvatarModel;
      await new Promise(resolveWait => window.setTimeout(resolveWait, 40));
    }
    return null;
  }

  const api = Object.freeze({
    release:RELEASE,
    manifestPath:"avatars/canonical/manifest.json",
    get paths() {
      return Object.freeze(Object.fromEntries(
        (window.SalitaAvatarModel?.catalogue || []).map(item => [item.id, item.image])
      ));
    },
    spriteCells:Object.freeze({}),
    normaliseId,
    getAvatarImagePath,
    resolve,
    bind,
    repair,
    syncEquipped,
    verifyAll
  });

  window.SalitaAvatarArtwork = api;
  window.getAvatarImagePath = api.getAvatarImagePath;
  window.SalitaAvatarArtworkReady = (async () => {
    await waitForModel();
    syncEquipped();
    document.addEventListener("salita:avatar-equipped", event => {
      syncEquipped(event.detail?.avatarId || event.detail?.avatar?.id);
    });
    document.addEventListener("salita:avatar-collection-changed", () => syncEquipped());
    return api;
  })();
})();
