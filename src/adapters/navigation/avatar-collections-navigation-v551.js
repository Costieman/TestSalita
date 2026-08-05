(() => {
  "use strict";
  if (window.SalitaAvatarCollectionsNavigationV551) return;
  const RELEASE = "5.5.6";
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

  window.SalitaAvatarCollectionsNavigationV551 = Object.freeze({release:RELEASE, install:installCollectionsNavigation});
})();
