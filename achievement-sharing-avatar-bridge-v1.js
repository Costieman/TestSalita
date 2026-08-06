(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestAchievementSharingAvatarCompatibilityV558Installed";
  const RELEASE = "5.5.11-explicit-sharing-router";

  if (window[INSTALL_FLAG]) return;
  window[INSTALL_FLAG] = true;

  function controller() {
    return window.SalitaQuestAchievementSharing || null;
  }

  function activeProfile() {
    try {
      const profileStore = JSON.parse(localStorage.getItem("salitaQuestLocalProfilesV1") || "null");
      const profileId = sessionStorage.getItem("salitaQuestActiveProfileId");
      return profileStore?.profiles?.find(item => item.id === profileId) || null;
    } catch {
      return null;
    }
  }

  function equippedAvatar() {
    const profile = activeProfile();
    const id = profile?.avatarCollection?.equippedAvatarId || profile?.avatarId || "anahaw";
    return window.SalitaAvatarModel?.get?.(id) || window.SalitaAvatarModel?.get?.("anahaw") || null;
  }

  function ownsAvatar(id) {
    const item = window.SalitaAvatarModel?.get?.(id);
    const profile = activeProfile();
    if (!item || !profile) return false;
    try {
      const state = window.SalitaAvatarModel?.normaliseCollectionState?.(profile.avatarCollection, profile.avatarId) || profile.avatarCollection || {};
      const owned = new Set(state.ownedAvatarIds || []);
      if (profile.avatarId) owned.add(profile.avatarId);
      return owned.has(item.id);
    } catch {
      return false;
    }
  }

  function canonicalAvatarPath(id = null) {
    const item = id ? window.SalitaAvatarModel?.get?.(id) : equippedAvatar();
    try {
      return window.SalitaAvatarArtwork?.getAvatarImagePath?.(item?.id || id || "anahaw") ||
        window.getAvatarImagePath?.(item?.id || id || "anahaw") ||
        item?.image ||
        "avatars/canonical/anahaw.png";
    } catch {
      return item?.image || "avatars/canonical/anahaw.png";
    }
  }

  function decorateCard(card) {
    if (!card || card.querySelector("[data-share-avatar]")) return;
    const id = card.querySelector("[data-sq-avatar-id]")?.dataset.sqAvatarId || "";
    if (!ownsAvatar(id)) return;
    const actions = card.querySelector(".sq-avatar-detail-actions");
    if (!actions) return;
    const button = document.createElement("button");
    button.className = "sq-avatar-detail-share secondary-btn";
    button.type = "button";
    button.dataset.shareAvatar = id;
    button.textContent = "Share avatar";
    actions.insertBefore(button, actions.lastElementChild || null);
  }

  function decorateAvatarDetails(scope = document) {
    if (scope?.matches?.(".sq-avatar-detail-card")) decorateCard(scope);
    scope?.querySelectorAll?.(".sq-avatar-detail-card").forEach(decorateCard);
  }

  const compatibilityApi = Object.freeze({
    release:RELEASE,
    equippedAvatar,
    canonicalAvatarPath,
    openBadge(...args) { return controller()?.openBadge?.(...args); },
    openChest(...args) { return controller()?.openChest?.(...args); },
    openAvatar(...args) { return controller()?.openAvatar?.(...args); },
    openAvatarCase(...args) { return controller()?.openAvatarCase?.(...args); },
    openLevel(...args) { return controller()?.openLevel?.(...args); }
  });

  // Compatibility only. This bridge deliberately does not replace the shared
  // controller, install click handlers, or choose a sharing transport.
  window.SalitaAchievementAvatarBridge = compatibilityApi;
  document.documentElement.dataset.avatarSharingBridge = RELEASE;

  decorateAvatarDetails();
  new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof Element) decorateAvatarDetails(node);
      }
    }
  }).observe(document.documentElement, {childList:true, subtree:true});

  document.addEventListener("salita:avatar-collection-changed", () => {
    window.setTimeout(() => decorateAvatarDetails(),30);
  });

  if (!document.querySelector('script[data-facebook-share-link]')) {
    const script = document.createElement("script");
    script.src = "./facebook-share-link-v1.js?v=1.0.0";
    script.dataset.facebookShareLink = "true";
    script.onerror = () => console.warn("Facebook share link formatting could not be loaded.");
    document.body.appendChild(script);
  }

  document.dispatchEvent(new CustomEvent("salita:avatar-sharing-bridge-ready", {
    detail:{release:RELEASE, compatibilityOnly:true, transportOwner:false}
  }));
})();
