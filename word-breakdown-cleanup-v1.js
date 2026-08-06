(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestWordBreakdownCleanupV2";
  if (window[INSTALL_FLAG]) return;
  window[INSTALL_FLAG] = true;

  function normalise(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase();
  }

  function textNodes(root) {
    if (!root || !document.createTreeWalker) return [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    return nodes;
  }

  function findFeedbackMeaning(root = document) {
    for (const node of textNodes(root)) {
      const text = String(node.nodeValue || "").replace(/\s+/g, " ").trim();
      const match = text.match(/^(.+?)\s+means\s+[“\"](.+?)[”\"]\.?$/i);
      if (!match) continue;
      const source = match[1].trim();
      const meaning = match[2].trim();
      if (source && meaning) return {source, meaning};
    }
    return null;
  }

  function findBreakdownPanel() {
    const heading = textNodes(document).find(node => normalise(node.nodeValue) === "word by word");
    if (!heading) return null;
    let panel = heading.parentElement;
    for (let depth = 0; panel && depth < 8; depth += 1, panel = panel.parentElement) {
      const text = normalise(panel.textContent);
      if (text.includes("word by word") && text.includes("direct translation")) return panel;
    }
    return null;
  }

  function findGrid(panel) {
    const candidates = [...panel.querySelectorAll("div, ul, section")]
      .filter(element => element.children.length >= 2)
      .filter(element => {
        const style = getComputedStyle(element);
        return style.display === "grid" || style.display === "flex";
      })
      .sort((a, b) => b.children.length - a.children.length);
    return candidates[0] || null;
  }

  function createSingleCard(source, meaning) {
    const card = document.createElement("div");
    card.dataset.sqSingleWordBreakdown = "true";
    card.setAttribute("aria-label", `${source}: ${meaning}`);
    card.style.gridColumn = "1 / -1";
    card.style.width = "100%";
    card.style.boxSizing = "border-box";
    card.style.borderRadius = "22px";
    card.style.padding = "18px 22px";
    card.style.textAlign = "center";
    card.style.background = "#173f37";
    card.style.border = "2px solid #4db6a0";

    const sourceNode = document.createElement("strong");
    sourceNode.textContent = source;
    sourceNode.style.display = "block";
    sourceNode.style.fontSize = "1.35rem";
    sourceNode.style.marginBottom = "8px";

    const meaningNode = document.createElement("div");
    meaningNode.textContent = meaning;
    meaningNode.style.fontSize = "1.05rem";
    meaningNode.style.lineHeight = "1.35";

    card.append(sourceNode, meaningNode);
    return card;
  }

  function collapseSingleWordBreakdown() {
    const result = findFeedbackMeaning(document);
    if (!result || result.source.split(/\s+/).filter(Boolean).length !== 1) return;

    const panel = findBreakdownPanel();
    if (!panel) return;

    const signature = `${result.source}\u0000${result.meaning}`;
    if (panel.dataset.sqSingleWordSignature === signature) return;

    const grid = findGrid(panel);
    if (!grid) return;

    grid.replaceChildren(createSingleCard(result.source, result.meaning));
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "minmax(0, 1fr)";
    grid.style.gap = "0";
    grid.dataset.sqSingleWordGrid = "true";
    panel.dataset.sqSingleWordSignature = signature;
  }

  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      collapseSingleWordBreakdown();
    });
  }

  new MutationObserver(records => {
    if (records.some(record => record.addedNodes.length || record.removedNodes.length || record.type === "characterData")) schedule();
  }).observe(document.documentElement, {subtree: true, childList: true, characterData: true});

  document.addEventListener("DOMContentLoaded", schedule, {once: true});
  document.addEventListener("salita:exercise-rendered", schedule);
  document.addEventListener("salita:answer-rendered", schedule);
  schedule();
})();
