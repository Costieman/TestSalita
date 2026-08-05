(() => {
  "use strict";

  const FEATURE_API = "SalitaAvatarCaseFeatureV1";
  if (window[FEATURE_API]) return;

  function install(profileRuntime) {
    if (!profileRuntime || typeof profileRuntime.model !== "function" || !profileRuntime.model()) return false;
    const INSTALL_FLAG = "__salitaQuestAvatarCaseV1Installed";
    const MAX_CASE_AVATARS = 4;
    const RELEASE = "5.5.10-avatar-case-compact";
    const MOBILE_COLLAPSE_QUERY = "(max-width: 650px)";

    if (window[INSTALL_FLAG]) return true;
    window[INSTALL_FLAG] = true;

    let panel = null;
    let picker = null;
    let pickerDraft = [];
    let observer = null;
    let panelExpanded = !(window.matchMedia?.(MOBILE_COLLAPSE_QUERY)?.matches);

    const esc = value => String(value ?? "").replace(/[&<>"']/g, character => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
    }[character]));

    function model() {
    return profileRuntime.model();
  }

  function getIds() {
    return profileRuntime.getIds(MAX_CASE_AVATARS);
  }

  function getAvatars() {
    return profileRuntime.getAvatars(MAX_CASE_AVATARS);
  }

    function persist(ids, options = {}) {
    const cleaned = profileRuntime.persist(ids, {max:MAX_CASE_AVATARS});
    if (options.announce !== false) {
      document.dispatchEvent(new CustomEvent("salita:avatar-case-changed",{
        detail:{avatarIds:[...cleaned],avatars:cleaned.map(id => model()?.get?.(id)).filter(Boolean),release:RELEASE}
      }));
    }
    render();
    return cleaned;
  }

    function setIds(ids, options = {}) {
      return persist(ids,options);
    }

    function move(id, direction) {
      const ids = getIds();
      const index = ids.indexOf(model()?.get?.(id)?.id || id);
      if (index < 0) return ids;
      const target = index + Number(direction || 0);
      if (target < 0 || target >= ids.length) return ids;
      [ids[index],ids[target]] = [ids[target],ids[index]];
      return persist(ids);
    }

    function remove(id) {
      const canonical = model()?.get?.(id)?.id || id;
      return persist(getIds().filter(item => item !== canonical));
    }

    function imagePath(item) {
      try {
        return window.SalitaAvatarArtwork?.getAvatarImagePath?.(item.id) ||
          window.getAvatarImagePath?.(item.id) || item.image;
      } catch {
        return item.image;
      }
    }

    function slotMarkup(item, index) {
      if (!item) {
        return `<button class="sq-avatar-case-slot is-empty" type="button" data-avatar-case-open-picker aria-label="Choose an avatar for empty case slot ${index + 1}">
          <span class="sq-avatar-case-empty-mark">＋</span><strong>Add avatar</strong><small>Empty slot</small>
        </button>`;
      }
      return `<article class="sq-avatar-case-slot is-filled" data-avatar-case-id="${item.id}">
        <div class="sq-avatar-case-art"><img src="${esc(imagePath(item))}" data-sq-avatar-id="${item.id}" alt="${esc(item.name)}"></div>
        <div class="sq-avatar-case-copy"><strong>${esc(item.name)}</strong><small>${esc(item.rarity)} · ${esc(item.category)}</small></div>
      </article>`;
    }

    function ensurePanel() {
      if (panel?.isConnected) return panel;
      const dialog = document.querySelector(".sq-avatar-collection-dialog");
      const summary = dialog?.querySelector(".sq-avatar-collection-summary");
      if (!dialog || !summary) return null;
      panel = document.createElement("section");
      panel.className = "sq-avatar-case-panel";
      panel.setAttribute("aria-labelledby","sqAvatarCaseTitle");
      dialog.insertBefore(panel,summary);
      return panel;
    }

    function setExpanded(expanded, options = {}) {
      panelExpanded = Boolean(expanded);
      if (options.render !== false) render();
      return panelExpanded;
    }

    function toggleExpanded() {
      return setExpanded(!panelExpanded);
    }

    function render() {
      const host = ensurePanel();
      if (!host || !model()) return;
      const avatars = getAvatars();
      const slots = Array.from({length:MAX_CASE_AVATARS},(_,index) => slotMarkup(avatars[index] || null,index));
      host.innerHTML = `
        <button class="sq-avatar-case-heading sq-avatar-case-toggle" type="button" data-avatar-case-toggle aria-expanded="${panelExpanded}" aria-controls="sqAvatarCaseBody">
          <div><p>FAVOURITE COLLECTION</p><h3 id="sqAvatarCaseTitle">Avatar Case</h3><span>Display four favourites without changing your equipped avatar.</span></div>
          <span class="sq-avatar-case-heading-meta"><span class="sq-avatar-case-count">${avatars.length} / ${MAX_CASE_AVATARS}</span><span class="sq-avatar-case-chevron" aria-hidden="true">⌄</span></span>
        </button>
        <div class="sq-avatar-case-body" id="sqAvatarCaseBody" ${panelExpanded ? "" : "hidden"}>
          <div class="sq-avatar-case-slots">${slots.join("")}</div>
          <div class="sq-avatar-case-actions">
            <button class="secondary-btn" type="button" data-avatar-case-open-picker>${avatars.length ? "Edit Avatar Case" : "Choose avatars"}</button>
            <button class="primary-btn" type="button" data-share-avatar-case ${avatars.length ? "" : "disabled"}>Share Avatar Case</button>
          </div>
        </div>`;
      window.SalitaAvatarArtwork?.repair?.(host);
    }

    function ensurePicker() {
      if (picker) return picker;
      picker = document.createElement("div");
      picker.className = "sq-avatar-case-picker";
      picker.hidden = true;
      picker.innerHTML = `
        <div class="sq-avatar-case-picker-backdrop" data-avatar-case-picker-close></div>
        <section class="sq-avatar-case-picker-dialog" role="dialog" aria-modal="true" aria-labelledby="sqAvatarCasePickerTitle">
          <header><div><p>AVATAR CASE</p><h3 id="sqAvatarCasePickerTitle">Choose and arrange four favourites</h3><span>Only avatars already unlocked on this profile are available.</span></div><button type="button" data-avatar-case-picker-close aria-label="Close Avatar Case editor">×</button></header>
          <div class="sq-avatar-case-picker-status" role="status"></div>
          <section class="sq-avatar-case-picker-order" aria-label="Selected Avatar Case order"></section>
          <div class="sq-avatar-case-picker-grid"></div>
          <footer><button class="secondary-btn" type="button" data-avatar-case-picker-close>Cancel</button><button class="primary-btn" type="button" data-avatar-case-picker-save>Save Avatar Case</button></footer>
        </section>`;
      document.body.appendChild(picker);
      picker.addEventListener("click",event => {
        if (event.target.closest("[data-avatar-case-picker-close]")) { closePicker(); return; }
        const moveButton = event.target.closest("[data-avatar-case-draft-move]");
        if (moveButton && !moveButton.disabled) {
          moveDraft(moveButton.dataset.avatarCaseId,Number(moveButton.dataset.avatarCaseDraftMove));
          return;
        }
        const removeButton = event.target.closest("[data-avatar-case-draft-remove]");
        if (removeButton) {
          removeDraft(removeButton.dataset.avatarCaseDraftRemove);
          return;
        }
        const choice = event.target.closest("[data-avatar-case-choice]");
        if (choice) {
          toggleDraft(choice.dataset.avatarCaseChoice);
          return;
        }
        if (event.target.closest("[data-avatar-case-picker-save]")) {
          persist(pickerDraft);
          closePicker();
        }
      });
      return picker;
    }

    function orderMarkup(item, index) {
      return `<article class="sq-avatar-case-order-item" data-avatar-case-order-id="${item.id}">
        <img src="${esc(imagePath(item))}" data-sq-avatar-id="${item.id}" alt="">
        <span><b>${index + 1}</b><strong>${esc(item.name)}</strong><small>${esc(item.rarity)}</small></span>
        <div class="sq-avatar-case-order-controls" aria-label="Arrange ${esc(item.name)}">
          <button type="button" data-avatar-case-draft-move="-1" data-avatar-case-id="${item.id}" ${index === 0 ? "disabled" : ""} aria-label="Move ${esc(item.name)} earlier">←</button>
          <button type="button" data-avatar-case-draft-move="1" data-avatar-case-id="${item.id}" ${index === pickerDraft.length - 1 ? "disabled" : ""} aria-label="Move ${esc(item.name)} later">→</button>
          <button type="button" data-avatar-case-draft-remove="${item.id}" aria-label="Remove ${esc(item.name)} from Avatar Case">×</button>
        </div>
      </article>`;
    }

    function renderPicker() {
      const modal = ensurePicker();
      const owned = profileRuntime.ownedIds().map(id => model()?.get?.(id)).filter(Boolean);
      const order = modal.querySelector(".sq-avatar-case-picker-order");
      const grid = modal.querySelector(".sq-avatar-case-picker-grid");
      const status = modal.querySelector(".sq-avatar-case-picker-status");
      status.textContent = `${pickerDraft.length} of ${MAX_CASE_AVATARS} selected. Arrange the numbered favourites before saving.`;
      order.innerHTML = pickerDraft.length
        ? pickerDraft.map((id,index) => model()?.get?.(id)).filter(Boolean).map((item,index) => orderMarkup(item,index)).join("")
        : `<p class="sq-avatar-case-order-empty">No favourites selected yet.</p>`;
      grid.innerHTML = owned.map(item => {
        const selected = pickerDraft.includes(item.id);
        return `<button class="sq-avatar-case-choice ${selected ? "is-selected" : ""}" type="button" data-avatar-case-choice="${item.id}" aria-pressed="${selected}">
          <img src="${esc(imagePath(item))}" data-sq-avatar-id="${item.id}" alt=""><span><strong>${esc(item.name)}</strong><small>${esc(item.rarity)}</small></span><i>${selected ? "✓" : "＋"}</i>
        </button>`;
      }).join("") || `<p class="sq-avatar-case-no-owned">Unlock an avatar before adding it to your case.</p>`;
      window.SalitaAvatarArtwork?.repair?.(modal);
    }

    function toggleDraft(id) {
      const item = model()?.get?.(id);
      if (!item) return;
      if (pickerDraft.includes(item.id)) pickerDraft = pickerDraft.filter(value => value !== item.id);
      else if (pickerDraft.length < MAX_CASE_AVATARS) pickerDraft.push(item.id);
      else {
        const status = picker?.querySelector(".sq-avatar-case-picker-status");
        if (status) status.textContent = `The Avatar Case holds ${MAX_CASE_AVATARS} favourites. Remove one before adding another.`;
        return;
      }
      renderPicker();
    }

    function moveDraft(id, direction) {
      const canonical = model()?.get?.(id)?.id || id;
      const index = pickerDraft.indexOf(canonical);
      const target = index + Number(direction || 0);
      if (index < 0 || target < 0 || target >= pickerDraft.length) return;
      [pickerDraft[index],pickerDraft[target]] = [pickerDraft[target],pickerDraft[index]];
      renderPicker();
    }

    function removeDraft(id) {
      const canonical = model()?.get?.(id)?.id || id;
      pickerDraft = pickerDraft.filter(value => value !== canonical);
      renderPicker();
    }

    function openPicker() {
      pickerDraft = getIds();
      const modal = ensurePicker();
      renderPicker();
      modal.hidden = false;
      document.body.classList.add("sq-avatar-case-picker-open");
      modal.querySelector("[data-avatar-case-picker-close]")?.focus();
    }

    function closePicker() {
      if (!picker) return;
      picker.hidden = true;
      document.body.classList.remove("sq-avatar-case-picker-open");
    }

    function handleDocumentClick(event) {
      if (event.target.closest("[data-avatar-case-toggle]")) { event.preventDefault(); toggleExpanded(); return; }
      if (event.target.closest("[data-avatar-case-open-picker]")) { event.preventDefault(); openPicker(); }
    }

    function installUi() {
      document.addEventListener("click",handleDocumentClick);
      document.addEventListener("keydown",event => {
        if (event.key === "Escape" && picker && !picker.hidden) closePicker();
      });
      document.addEventListener("salita:avatar-collection-changed",render);
      document.addEventListener("salita:open-avatar-collection",() => window.setTimeout(render,0));
      observer = new MutationObserver(records => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (!(node instanceof Element)) continue;
            if (node.matches?.(".sq-avatar-collection-dialog") || node.querySelector?.(".sq-avatar-collection-dialog")) {
              window.setTimeout(render,0);
              return;
            }
          }
        }
      });
      observer.observe(document.documentElement,{childList:true,subtree:true});
      persist(getIds(),{announce:false});
      render();
      window.SalitaQuestAvatarCase = Object.freeze({
        version:2,release:RELEASE,max:MAX_CASE_AVATARS,getIds,getAvatars,setIds,move,remove,openPicker,render,setExpanded,toggleExpanded,isExpanded:()=>panelExpanded
      });
      document.documentElement.dataset.avatarCase = RELEASE;
      document.dispatchEvent(new CustomEvent("salita:avatar-case-ready",{detail:{release:RELEASE}}));
    }

    installUi();
    return true;
  }

  window[FEATURE_API] = Object.freeze({install});
})();
