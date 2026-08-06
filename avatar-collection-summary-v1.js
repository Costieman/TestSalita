(() => {
  "use strict";

  if (window.__salitaAvatarCollectionSummaryV1Installed) return;
  window.__salitaAvatarCollectionSummaryV1Installed = true;

  const PROFILE_STORE = "salitaQuestLocalProfilesV1";
  const ACTIVE_PROFILE = "salitaQuestActiveProfileId";
  const RARITIES = Object.freeze(["common", "uncommon", "rare"]);

  function readCollection() {
    try {
      const store = JSON.parse(localStorage.getItem(PROFILE_STORE) || "null");
      const activeId = sessionStorage.getItem(ACTIVE_PROFILE);
      const profile = store?.profiles?.find(item => item.id === activeId);
      const model = window.SalitaAvatarModel;
      if (!profile || !model) return null;
      return {model, collection:model.normaliseCollectionState(profile.avatarCollection, profile.avatarId)};
    } catch {
      return null;
    }
  }

  function counts() {
    const account = readCollection();
    if (!account) return null;
    const owned = new Set(account.collection.ownedAvatarIds || []);
    const rows = RARITIES.map(rarity => {
      const avatars = account.model.catalogue.filter(item => (item.randomRarity || item.rarity) === rarity);
      return {rarity, total:avatars.length, collected:avatars.filter(item => owned.has(item.id)).length};
    });
    return {
      rows,
      total:rows.reduce((sum, row) => sum + row.total, 0),
      collected:rows.reduce((sum, row) => sum + row.collected, 0)
    };
  }

  function render() {
    const host = document.querySelector(".sq-avatar-collection");
    const header = host?.querySelector(".sq-avatar-collection-header");
    if (!host || !header) return false;
    const data = counts();
    if (!data) return false;

    let summary = host.querySelector(".sq-avatar-collection-summary");
    if (!summary) {
      summary = document.createElement("section");
      summary.className = "sq-avatar-collection-summary";
      summary.setAttribute("aria-label", "Avatar collection progress");
      header.insertAdjacentElement("afterend", summary);
    }

    const percent = data.total ? Math.round(data.collected / data.total * 100) : 0;
    summary.innerHTML = `
      <div class="sq-avatar-summary-overall">
        <div><span>Overall collection</span><strong>${data.collected} / ${data.total}</strong></div>
        <div class="sq-avatar-summary-track" aria-label="${percent}% complete"><span style="width:${percent}%"></span></div>
        <small>${percent}% complete</small>
      </div>
      <div class="sq-avatar-summary-rarities">
        ${data.rows.map(row => `<div class="sq-avatar-summary-card ${row.rarity}"><span>${row.rarity}</span><strong>${row.collected} / ${row.total}</strong></div>`).join("")}
      </div>`;
    return true;
  }

  function scheduleRender() {
    window.requestAnimationFrame?.(render) || window.setTimeout(render, 0);
  }

  document.addEventListener("salita:open-avatar-collection", () => window.setTimeout(render, 80));
  document.addEventListener("salita:avatar-collection-changed", scheduleRender);
  document.addEventListener("salita:avatar-progression-ready", scheduleRender);
  document.addEventListener("salita:avatar-random-pools-ready", scheduleRender);
  window.setInterval(() => {
    const host = document.querySelector(".sq-avatar-collection");
    if (host && !host.hidden) render();
  }, 1000);

  window.SalitaAvatarCollectionSummary = Object.freeze({render, counts});
})();