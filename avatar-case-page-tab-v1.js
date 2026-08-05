(() => {
  "use strict";

  if (window.__salitaAvatarCasePageTabV1Installed) return;
  window.__salitaAvatarCasePageTabV1Installed = true;

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
    }[character]));
  }

  function imagePath(item) {
    try {
      return window.SalitaAvatarArtwork?.getAvatarImagePath?.(item.id) ||
        window.getAvatarImagePath?.(item.id) || item.image;
    } catch {
      return item.image;
    }
  }

  function ensureStyles() {
    if (document.querySelector('link[data-avatar-case-page-tab-style]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "./avatar-case-page-tab-v1.css?v=1";
    link.dataset.avatarCasePageTabStyle = "true";
    document.head.appendChild(link);
  }

  function ensurePanel(view) {
    let panel = view.querySelector(".avatar-page-case-panel");
    if (panel) return panel;
    panel = document.createElement("section");
    panel.className = "avatar-page-case-panel";
    panel.setAttribute("aria-labelledby", "avatarPageCaseTitle");
    const detail = view.querySelector(".avatar-page-detail");
    const content = view.querySelector(".avatar-page-content");
    view.insertBefore(panel, detail || content || null);
    return panel;
  }

  function slotMarkup(item, index) {
    if (!item) {
      return `<button class="avatar-page-case-slot is-empty" type="button" data-avatar-page-case-edit aria-label="Choose an avatar for empty display case slot ${index + 1}">
        <span class="avatar-page-case-empty-mark">＋</span><strong>Add avatar</strong><small>Empty slot</small>
      </button>`;
    }
    return `<article class="avatar-page-case-slot" data-avatar-page-case-id="${item.id}">
      <div class="avatar-page-case-art"><img src="${esc(imagePath(item))}" data-sq-avatar-id="${item.id}" alt="${esc(item.name)}"></div>
      <div class="avatar-page-case-copy"><strong>${esc(item.name)}</strong><small>${esc(item.rarity)} · ${esc(item.category)}</small></div>
    </article>`;
  }

  function renderCase(view) {
    const api = window.SalitaQuestAvatarCase;
    const panel = ensurePanel(view);
    const avatars = api?.getAvatars?.() || [];
    const slots = Array.from({length:4}, (_, index) => slotMarkup(avatars[index] || null, index));
    panel.innerHTML = `
      <div class="avatar-page-case-heading">
        <div><p>FAVOURITE COLLECTION</p><h3 id="avatarPageCaseTitle">Avatar Display Case</h3><span>Show four favourite unlocked avatars without changing your equipped avatar.</span></div>
        <strong class="avatar-page-case-count">${avatars.length} / 4</strong>
      </div>
      <div class="avatar-page-case-slots">${slots.join("")}</div>
      <div class="avatar-page-case-actions">
        <button type="button" data-avatar-page-case-edit>${avatars.length ? "Edit Display Case" : "Choose avatars"}</button>
        <button class="primary" type="button" data-share-avatar-case ${avatars.length ? "" : "disabled"}>Share Display Case</button>
      </div>`;
    window.SalitaAvatarArtwork?.repair?.(panel);
  }

  function activateCase(view, button) {
    view.querySelectorAll("[data-avatar-page-filter]").forEach(item => item.classList.toggle("is-active", item === button));
    view.querySelector(".avatar-page-content")?.setAttribute("hidden", "");
    const detail = view.querySelector(".avatar-page-detail");
    if (detail) detail.hidden = true;
    const search = view.querySelector(".avatar-page-search");
    if (search) search.hidden = true;
    const panel = ensurePanel(view);
    panel.classList.add("is-active");
    renderCase(view);
  }

  function deactivateCase(view) {
    view.querySelector(".avatar-page-case-panel")?.classList.remove("is-active");
    view.querySelector(".avatar-page-content")?.removeAttribute("hidden");
    const search = view.querySelector(".avatar-page-search");
    if (search) search.hidden = false;
  }

  function installIntoView(view) {
    const toolbar = view.querySelector(".avatar-page-toolbar");
    if (!toolbar) return false;
    let button = toolbar.querySelector('[data-avatar-page-filter="case"]');
    if (!button) {
      button = document.createElement("button");
      button.className = "avatar-page-filter";
      button.type = "button";
      button.dataset.avatarPageFilter = "case";
      button.textContent = "Display Case";
      toolbar.insertBefore(button, toolbar.firstChild);
    }
    ensurePanel(view);
    renderCase(view);
    return true;
  }

  document.addEventListener("click", event => {
    const view = event.target.closest("#avatarsView");
    if (!view) return;
    const filter = event.target.closest("[data-avatar-page-filter]");
    if (filter?.dataset.avatarPageFilter === "case") {
      event.preventDefault();
      event.stopImmediatePropagation();
      activateCase(view, filter);
      return;
    }
    if (filter) deactivateCase(view);
    if (event.target.closest("[data-avatar-page-case-edit]")) {
      event.preventDefault();
      window.SalitaQuestAvatarCase?.openPicker?.();
    }
  }, true);

  document.addEventListener("salita:avatar-case-changed", () => {
    const view = document.getElementById("avatarsView");
    if (view) renderCase(view);
  });
  document.addEventListener("salita:avatar-case-ready", () => {
    const view = document.getElementById("avatarsView");
    if (view) renderCase(view);
  });
  document.addEventListener("salita:view-changed", event => {
    if (event.detail?.view !== "avatars") return;
    const view = document.getElementById("avatarsView");
    if (view) installIntoView(view);
  });

  ensureStyles();
  const timer = window.setInterval(() => {
    const view = document.getElementById("avatarsView");
    if (!view) return;
    installIntoView(view);
    window.clearInterval(timer);
  }, 120);
})();
