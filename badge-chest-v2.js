(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestBadgeChestV2Installed";
  const MAX_CHEST_BADGES = 6;
  const RENDER_EVENT = "salita:badges-rendered";
  const CHANGE_EVENT = "salita:badge-chest-changed";
  const PICKER_ID = "badgeChestPickerV2";

  function retry() {
    window.setTimeout(install, 100);
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[character]));
  }

  function notify(message) {
    try {
      if (typeof toast === "function") {
        toast(message);
        return;
      }
    } catch {}
    console.info(message);
  }

  function badgeById(id) {
    try {
      return BADGES.find(badge => badge.id === id) || null;
    } catch {
      return null;
    }
  }

  function isEarned(badge) {
    try {
      return Boolean(badge?.test?.(state));
    } catch {
      return false;
    }
  }

  function earnedBadges() {
    const earnedAt = badgeState().earnedAt;
    return BADGES.filter(isEarned).sort((left, right) => {
      const dateOrder = String(earnedAt[right.id] || "").localeCompare(String(earnedAt[left.id] || ""));
      return dateOrder || String(left.name || "").localeCompare(String(right.name || ""));
    });
  }

  function badgeState() {
    const data = state.badgeProgress || (state.badgeProgress = {});
    data.earnedAt = data.earnedAt && typeof data.earnedAt === "object" ? data.earnedAt : {};
    data.chestIds = Array.isArray(data.chestIds)
      ? [...new Set(data.chestIds.filter(Boolean))]
      : [];
    return data;
  }

  function cleanChest({save = true} = {}) {
    const data = badgeState();
    const earnedIds = new Set(earnedBadges().map(badge => badge.id));
    const cleaned = data.chestIds.filter(id => earnedIds.has(id)).slice(0, MAX_CHEST_BADGES);
    const changed = cleaned.join("|") !== data.chestIds.join("|") || data.chestInitialized !== true;
    data.chestIds = cleaned;
    data.chestInitialized = true;
    if (changed && save) saveState();
    return [...data.chestIds];
  }

  function setIds(ids, {announce = true} = {}) {
    const earnedIds = new Set(earnedBadges().map(badge => badge.id));
    const next = [...new Set((Array.isArray(ids) ? ids : []).filter(id => earnedIds.has(id)))].slice(0, MAX_CHEST_BADGES);
    const data = badgeState();
    const changed = next.join("|") !== data.chestIds.join("|") || data.chestInitialized !== true;
    data.chestIds = next;
    data.chestInitialized = true;
    if (changed) saveState();
    refresh();
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, {detail: {ids: [...next]}}));
    if (changed && announce) notify(`${next.length} badge${next.length === 1 ? "" : "s"} saved to your Badge Chest.`);
    return [...next];
  }

  function getIds() {
    return cleanChest();
  }

  function getBadges() {
    return getIds().map(badgeById).filter(Boolean);
  }

  function fallbackArt(badge) {
    try {
      if (typeof badgeArt === "function") return badgeArt(badge.id);
    } catch {}
    return `<span>${escapeHTML(badge.icon || "🏅")}</span>`;
  }

  function visualMarkup(badge, className = "") {
    return `<div class="badge-share-visual ${className}">
      <img src="${escapeHTML(badge.image || `badges/${badge.id}.png`)}" alt="" loading="lazy">
      <span>${fallbackArt(badge)}</span>
    </div>`;
  }

  function attachImageFallbacks(root) {
    root?.querySelectorAll(".badge-share-visual img").forEach(image => {
      image.addEventListener("load", () => image.parentElement?.classList.add("has-custom-art"), {once: true});
      image.addEventListener("error", () => image.remove(), {once: true});
    });
  }

  function ensurePanel() {
    let panel = document.getElementById("badgeChestPanel");
    if (panel) return panel;
    panel = document.createElement("section");
    panel.id = "badgeChestPanel";
    panel.className = "badge-chest-panel";
    panel.setAttribute("aria-labelledby", "badgeChestTitle");
    const summary = document.querySelector("#badgesView .badges-page-summary");
    const shelf = document.querySelector("#badgesView .badges-page-shelf");
    const host = summary || shelf;
    if (host?.parentNode) host.parentNode.insertBefore(panel, host);
    else document.getElementById("badgesView")?.appendChild(panel);
    return panel;
  }

  function renderChest() {
    const panel = ensurePanel();
    if (!panel) return;
    const badges = getBadges();
    const slots = Array.from({length: MAX_CHEST_BADGES}, (_, index) => {
      const badge = badges[index];
      if (!badge) {
        return `<button class="badge-chest-slot empty" type="button" data-open-badge-picker aria-label="Choose a badge for empty slot ${index + 1}">
          <span>＋</span><small>Choose an earned badge</small>
        </button>`;
      }
      return `<article class="badge-chest-slot filled" data-chest-badge-id="${escapeHTML(badge.id)}">
        ${visualMarkup(badge, "badge-chest-visual")}
        <div class="badge-chest-slot-copy">
          <strong>${escapeHTML(badge.name)}</strong>
          <small>${escapeHTML(badge.category || "Achievement")}</small>
        </div>
        <div class="badge-chest-slot-controls" aria-label="Arrange ${escapeHTML(badge.name)}">
          <button type="button" data-chest-move="-1" title="Move earlier" aria-label="Move ${escapeHTML(badge.name)} earlier" ${index === 0 ? "disabled" : ""}>←</button>
          <button type="button" data-chest-move="1" title="Move later" aria-label="Move ${escapeHTML(badge.name)} later" ${index === badges.length - 1 ? "disabled" : ""}>→</button>
          <button type="button" data-chest-remove title="Remove from chest" aria-label="Remove ${escapeHTML(badge.name)} from chest">×</button>
        </div>
      </article>`;
    }).join("");

    panel.innerHTML = `
      <div class="badge-chest-header">
        <div>
          <p class="eyebrow">YOUR PROUDEST ACHIEVEMENTS</p>
          <h3 id="badgeChestTitle">Badge Chest</h3>
          <p>Choose and arrange up to six earned badges. Your order is used on the shared chest card.</p>
        </div>
        <div class="badge-chest-header-actions">
          <button class="secondary-btn" type="button" data-open-badge-picker>Choose badges</button>
          <button class="primary-btn badge-chest-share" type="button" data-share-badge-chest ${badges.length ? "" : "disabled"}>Share Badge Chest</button>
        </div>
      </div>
      <div class="badge-chest-grid">${slots}</div>
      <p class="badge-chest-spread-note">${badges.length} of ${MAX_CHEST_BADGES} slots selected. Shared posts invite others to <strong>start learning free with Salita Quest</strong>.</p>`;

    attachImageFallbacks(panel);
  }

  function decorateBadgeCards() {
    const selected = new Set(getIds());
    const full = selected.size >= MAX_CHEST_BADGES;
    document.querySelectorAll("#badgeShelf .badge-catalogue-card.earned").forEach(card => {
      const id = card.dataset.badgeId || "";
      const badge = badgeById(id);
      const copy = card.querySelector(".badge-catalogue-copy");
      if (!badge || !copy) return;
      let actions = copy.querySelector(".badge-card-share-actions");
      if (!actions) {
        actions = document.createElement("div");
        actions.className = "badge-card-share-actions";
        copy.appendChild(actions);
      }
      const pinned = selected.has(id);
      const signature = `${id}:${pinned ? "selected" : full ? "full" : "available"}`;
      if (actions.dataset.signature === signature) return;
      actions.dataset.signature = signature;
      actions.innerHTML = `
        <button type="button" class="secondary-btn" data-badge-chest-toggle="${escapeHTML(id)}" ${full && !pinned ? "disabled" : ""}>
          ${pinned ? "Remove from chest" : full ? "Chest full" : "Add to chest"}
        </button>
        <button type="button" class="text-btn" data-share-badge="${escapeHTML(id)}">Share badge</button>`;
    });
  }

  function ensurePicker() {
    let modal = document.getElementById(PICKER_ID);
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = PICKER_ID;
    modal.className = "badge-picker-modal";
    modal.hidden = true;
    modal.innerHTML = `
      <div class="badge-picker-backdrop" data-close-badge-picker></div>
      <section class="badge-picker-card" role="dialog" aria-modal="true" aria-labelledby="badgePickerTitle">
        <button class="badge-picker-close" type="button" data-close-badge-picker aria-label="Close">×</button>
        <div class="badge-picker-heading">
          <p class="eyebrow">BADGE CHEST</p>
          <h2 id="badgePickerTitle">Choose your six badges</h2>
          <p>Select earned badges, then save. Existing choices stay in their current order; new choices are added afterward.</p>
          <strong id="badgePickerCount">0 / ${MAX_CHEST_BADGES} selected</strong>
        </div>
        <div id="badgePickerGrid" class="badge-picker-grid"></div>
        <p id="badgePickerStatus" class="badge-picker-status" role="status"></p>
        <div class="badge-picker-actions">
          <button class="secondary-btn" type="button" data-clear-badge-picker>Clear all</button>
          <span></span>
          <button class="secondary-btn" type="button" data-close-badge-picker>Cancel</button>
          <button class="primary-btn" type="button" data-save-badge-picker>Save Badge Chest</button>
        </div>
      </section>`;
    document.body.appendChild(modal);
    return modal;
  }

  function updatePickerCount(modal) {
    const count = modal?.__draftIds?.size || 0;
    const node = modal?.querySelector("#badgePickerCount");
    if (node) node.textContent = `${count} / ${MAX_CHEST_BADGES} selected`;
  }

  function renderPicker(modal) {
    const grid = modal.querySelector("#badgePickerGrid");
    const draft = modal.__draftIds;
    const badges = earnedBadges();
    grid.innerHTML = badges.length ? badges.map(badge => {
      const checked = draft.has(badge.id);
      return `<label class="badge-picker-option ${checked ? "selected" : ""}">
        <input type="checkbox" data-picker-badge="${escapeHTML(badge.id)}" ${checked ? "checked" : ""}>
        ${visualMarkup(badge, "badge-picker-visual")}
        <span><strong>${escapeHTML(badge.name)}</strong><small>${escapeHTML(badge.category || "Achievement")}</small></span>
        <b>${checked ? "Selected" : "Choose"}</b>
      </label>`;
    }).join("") : `<div class="badge-picker-empty">Earn a badge first, then return here to choose it.</div>`;
    attachImageFallbacks(grid);
    updatePickerCount(modal);
  }

  function openPicker() {
    const modal = ensurePicker();
    modal.__draftIds = new Set(getIds());
    const status = modal.querySelector("#badgePickerStatus");
    if (status) status.textContent = "";
    renderPicker(modal);
    modal.hidden = false;
    document.body.classList.add("badge-picker-open");
  }

  function closePicker() {
    const modal = document.getElementById(PICKER_ID);
    if (modal) modal.hidden = true;
    document.body.classList.remove("badge-picker-open");
  }

  function togglePickerBadge(input) {
    const modal = input.closest(`#${PICKER_ID}`);
    const id = input.dataset.pickerBadge || "";
    if (!modal || !id) return;
    const draft = modal.__draftIds || (modal.__draftIds = new Set());
    const status = modal.querySelector("#badgePickerStatus");
    if (input.checked && !draft.has(id)) {
      if (draft.size >= MAX_CHEST_BADGES) {
        input.checked = false;
        if (status) status.textContent = `Choose no more than ${MAX_CHEST_BADGES} badges. Remove one before adding another.`;
        return;
      }
      draft.add(id);
    } else if (!input.checked) {
      draft.delete(id);
    }
    if (status) status.textContent = "";
    renderPicker(modal);
  }

  function toggleBadge(id) {
    const current = getIds();
    const index = current.indexOf(id);
    if (index >= 0) {
      current.splice(index, 1);
      setIds(current);
      return;
    }
    if (current.length >= MAX_CHEST_BADGES) {
      notify("Your Badge Chest already contains six achievements. Choose badges to replace one.");
      openPicker();
      return;
    }
    current.push(id);
    setIds(current);
  }

  function removeBadge(id) {
    setIds(getIds().filter(item => item !== id));
  }

  function moveBadge(id, delta) {
    const current = getIds();
    const index = current.indexOf(id);
    const target = index + Number(delta || 0);
    if (index < 0 || target < 0 || target >= current.length) return;
    [current[index], current[target]] = [current[target], current[index]];
    setIds(current, {announce: false});
  }

  function refresh() {
    renderChest();
    decorateBadgeCards();
  }

  function handleClick(event) {
    const toggle = event.target.closest?.("[data-badge-chest-toggle]");
    if (toggle) {
      event.preventDefault();
      toggleBadge(toggle.dataset.badgeChestToggle || "");
      return;
    }
    if (event.target.closest?.("[data-open-badge-picker]")) {
      event.preventDefault();
      openPicker();
      return;
    }
    const slot = event.target.closest?.("[data-chest-badge-id]");
    if (slot && event.target.closest?.("[data-chest-remove]")) {
      event.preventDefault();
      removeBadge(slot.dataset.chestBadgeId || "");
      return;
    }
    const move = slot?.querySelector ? event.target.closest?.("[data-chest-move]") : null;
    if (slot && move) {
      event.preventDefault();
      moveBadge(slot.dataset.chestBadgeId || "", move.dataset.chestMove);
      return;
    }
    if (event.target.closest?.("[data-close-badge-picker]")) {
      event.preventDefault();
      closePicker();
      return;
    }
    if (event.target.closest?.("[data-clear-badge-picker]")) {
      event.preventDefault();
      const modal = document.getElementById(PICKER_ID);
      if (!modal) return;
      modal.__draftIds = new Set();
      renderPicker(modal);
      return;
    }
    if (event.target.closest?.("[data-save-badge-picker]")) {
      event.preventDefault();
      const modal = document.getElementById(PICKER_ID);
      if (!modal) return;
      setIds([...modal.__draftIds]);
      closePicker();
    }
  }

  function handleChange(event) {
    const input = event.target.closest?.("[data-picker-badge]");
    if (input) togglePickerBadge(input);
  }

  function install() {
    try {
      if (typeof state === "undefined" || typeof BADGES === "undefined" || typeof saveState !== "function") {
        retry();
        return;
      }
    } catch {
      retry();
      return;
    }
    if (window[INSTALL_FLAG]) return;
    if (!document.getElementById("badgeShelf")) {
      retry();
      return;
    }
    window[INSTALL_FLAG] = true;
    cleanChest();
    ensurePicker();
    document.addEventListener("click", handleClick);
    document.addEventListener("change", handleChange);
    window.addEventListener(RENDER_EVENT, refresh);
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !document.getElementById(PICKER_ID)?.hidden) closePicker();
    });
    window.SalitaQuestBadgeChest = {
      maxBadges: MAX_CHEST_BADGES,
      getIds,
      getBadges,
      setIds,
      refresh,
      openPicker
    };
    refresh();
  }

  install();
})();