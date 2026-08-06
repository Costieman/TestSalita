(() => {
  "use strict";

  if (window.__salitaEconomyTrackingPhase6V2Installed) return;
  window.__salitaEconomyTrackingPhase6V2Installed = true;

  const RELEASE = "economy-v2-phase6-tracking-pane";
  let panel = null;

  function globalValue(name) {
    try { return eval(`typeof ${name} !== "undefined" ? ${name} : undefined`); }
    catch { return undefined; }
  }

  function state() {
    return globalValue("state") || window.state || null;
  }

  function normalisedEconomy() {
    const source = state()?.coinEconomy || {};
    const byRarity = source.packsByRarity || {};
    return {
      lifetimeEarned:Math.max(0,Math.floor(Number(source.lifetimeEarned || 0))),
      lifetimeSpent:Math.max(0,Math.floor(Number(source.lifetimeSpent || 0))),
      shardPacksPurchased:Math.max(0,Math.floor(Number(source.shardPacksPurchased || 0))),
      mysteryPacksPurchased:Math.max(0,Math.floor(Number(source.mysteryPacksPurchased || 0))),
      common:Math.max(0,Math.floor(Number(byRarity.common || 0))),
      uncommon:Math.max(0,Math.floor(Number(byRarity.uncommon || 0))),
      rare:Math.max(0,Math.floor(Number(byRarity.rare || 0)))
    };
  }

  function ensurePanel() {
    const dialog = document.querySelector(".sq-avatar-collection-dialog");
    if (!dialog) return null;
    if (panel?.isConnected) return panel;
    panel = dialog.querySelector(".sq-economy-tracking-panel");
    if (panel) return panel;

    panel = document.createElement("section");
    panel.className = "sq-economy-tracking-panel";
    panel.dataset.economyTracking = RELEASE;
    const statisticsPane = dialog.querySelector(":scope > .sq-avatar-statistics-pane");
    if (statisticsPane) statisticsPane.appendChild(panel);
    else dialog.appendChild(panel);
    return panel;
  }

  function card(label, value) {
    return `<article class="sq-economy-tracking-card"><span>${label}</span><strong>${Number(value).toLocaleString()}</strong></article>`;
  }

  function render() {
    const host = ensurePanel();
    if (!host) return;
    const economy = normalisedEconomy();
    host.innerHTML = `<h3>Coin and pack activity</h3><p>Lifetime economy totals for this learner profile.</p><div class="sq-economy-tracking-grid">${[
      card("Coins earned",economy.lifetimeEarned),
      card("Coins spent",economy.lifetimeSpent),
      card("All shard packs",economy.shardPacksPurchased),
      card("Mystery packs",economy.mysteryPacksPurchased),
      card("Common results",economy.common),
      card("Uncommon results",economy.uncommon),
      card("Rare results",economy.rare)
    ].join("")}</div>`;
  }

  function scheduleRender() { window.setTimeout(render,0); }
  ["salita:open-avatar-collection","salita:coin-balance-changed","salita:coin-shard-pack-purchased","salita:avatar-collection-changed","salita:avatar-collection-tabs-ready"].forEach(name => document.addEventListener(name,scheduleRender));

  new MutationObserver(records => {
    if (records.some(record => [...record.addedNodes].some(node => node instanceof Element && (node.matches?.(".sq-avatar-collection-dialog, .sq-avatar-statistics-pane") || node.querySelector?.(".sq-avatar-collection-dialog, .sq-avatar-statistics-pane"))))) scheduleRender();
  }).observe(document.documentElement,{childList:true,subtree:true});

  render();
  window.SalitaEconomyTrackingPhase6 = Object.freeze({release:RELEASE,render,read:normalisedEconomy});
  document.dispatchEvent(new CustomEvent("salita:economy-tracking-ready",{detail:{release:RELEASE}}));
})();
