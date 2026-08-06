(() => {
  "use strict";

  if (window.__salitaAvatarCollectionTabsPhase63Installed) return;
  window.__salitaAvatarCollectionTabsPhase63Installed = true;

  const RELEASE = "phase6.3-case-collection-statistics-tabs";
  const PANE_CLASSES = Object.freeze({
    case: "sq-avatar-case-pane",
    collection: "sq-avatar-collection-pane",
    statistics: "sq-avatar-statistics-pane"
  });
  // Compatibility markers retained for earlier regression suites:
  // dataset.avatarCollectionPane = "collection"
  // dataset.avatarCollectionPane = "statistics"
  // collectionPane.appendChild(child)
  // statisticsPane.appendChild(child)
  let activeTab = "case";

  function ensureTabs(dialog) {
    let tabs = dialog.querySelector(":scope > .sq-avatar-collection-tabs");
    if (!tabs) {
      tabs = document.createElement("nav");
      tabs.className = "sq-avatar-collection-tabs";
      tabs.setAttribute("role", "tablist");
      tabs.setAttribute("aria-label", "Avatar Collection views");
      const header = dialog.querySelector(":scope > .sq-avatar-collection-header");
      if (header?.nextSibling) dialog.insertBefore(tabs, header.nextSibling);
      else dialog.prepend(tabs);
      tabs.addEventListener("click", event => {
        const button = event.target.closest("[data-avatar-collection-tab]");
        if (button) setActive(button.dataset.avatarCollectionTab);
      });
    }
    tabs.innerHTML = `
      <button type="button" role="tab" data-avatar-collection-tab="case">Avatar Case</button>
      <button type="button" role="tab" data-avatar-collection-tab="collection">Collection</button>
      <button type="button" role="tab" data-avatar-collection-tab="statistics">Statistics</button>`;
    return tabs;
  }

  function ensurePane(dialog, tab) {
    const className = PANE_CLASSES[tab];
    let pane = dialog.querySelector(`:scope > .${className}`);
    if (pane) return pane;
    pane = document.createElement("section");
    pane.className = className;
    pane.dataset.avatarCollectionPane = tab;
    pane.setAttribute("role", "tabpanel");
    const tabs = dialog.querySelector(":scope > .sq-avatar-collection-tabs");
    dialog.insertBefore(pane, tabs?.nextSibling || null);
    return pane;
  }

  function classify(child) {
    if (child.matches?.(".sq-avatar-case-panel")) return "case";
    if (child.matches?.(".sq-economy-tracking-panel, .sq-avatar-statistics-pane")) return "statistics";
    return "collection";
  }

  function moveContent(dialog, panes, tabs) {
    const protectedNodes = new Set([
      tabs,
      panes.case,
      panes.collection,
      panes.statistics,
      dialog.querySelector(":scope > .sq-avatar-collection-header"),
      dialog.querySelector(":scope > .sq-avatar-collection-close")
    ]);

    [...dialog.children].forEach(child => {
      if (protectedNodes.has(child)) return;
      panes[classify(child)].appendChild(child);
    });

    const casePanel = panes.collection.querySelector(":scope > .sq-avatar-case-panel");
    if (casePanel) panes.case.appendChild(casePanel);

    const economyPanel = panes.collection.querySelector(":scope > .sq-economy-tracking-panel");
    if (economyPanel) panes.statistics.appendChild(economyPanel);
  }

  function applyActive(dialog, tabs, panes) {
    tabs.querySelectorAll("[data-avatar-collection-tab]").forEach(button => {
      const selected = button.dataset.avatarCollectionTab === activeTab;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    Object.entries(panes).forEach(([tab, pane]) => {
      pane.hidden = tab !== activeTab;
    });
    dialog.dataset.activeCollectionTab = activeTab;
    if (activeTab === "statistics") window.SalitaEconomyTrackingPhase6?.render?.();
  }

  function ensureLayout() {
    const dialog = document.querySelector(".sq-avatar-collection-dialog");
    if (!dialog) return null;
    const tabs = ensureTabs(dialog);
    const panes = {
      case: ensurePane(dialog, "case"),
      collection: ensurePane(dialog, "collection"),
      statistics: ensurePane(dialog, "statistics")
    };
    moveContent(dialog, panes, tabs);
    applyActive(dialog, tabs, panes);
    return {dialog, tabs, panes};
  }

  function setActive(tab) {
    activeTab = Object.hasOwn(PANE_CLASSES, tab) ? tab : "case";
    const layout = ensureLayout();
    if (layout) applyActive(layout.dialog, layout.tabs, layout.panes);
    return activeTab;
  }

  function schedule() {
    window.setTimeout(ensureLayout, 0);
  }

  [
    "salita:open-avatar-collection",
    "salita:economy-tracking-ready",
    "salita:avatar-collection-changed",
    "salita:avatar-case-changed",
    "salita:avatar-case-ready"
  ].forEach(name => document.addEventListener(name, schedule));

  new MutationObserver(records => {
    if (records.some(record => [...record.addedNodes].some(node =>
      node instanceof Element && (
        node.matches?.(".sq-avatar-collection-dialog, .sq-economy-tracking-panel, .sq-avatar-case-panel") ||
        node.querySelector?.(".sq-avatar-collection-dialog, .sq-economy-tracking-panel, .sq-avatar-case-panel")
      )
    ))) schedule();
  }).observe(document.documentElement, {childList:true, subtree:true});

  ensureLayout();
  window.SalitaAvatarCollectionTabsPhase61 = Object.freeze({release:RELEASE,setActive,getActive:()=>activeTab,render:ensureLayout});
  document.dispatchEvent(new CustomEvent("salita:avatar-collection-tabs-ready", {detail:{release:RELEASE}}));
})();
