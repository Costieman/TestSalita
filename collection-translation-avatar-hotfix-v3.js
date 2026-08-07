(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestCollectionTranslationAvatarHotfixV3";
  if (window[INSTALL_FLAG]) return;
  window[INSTALL_FLAG] = true;

  const PLACEHOLDERS = new Set([
    "part of the expression",
    "part-of-the-expression",
    "expression part",
    "grammar component",
    "component of the expression"
  ]);

  function ensureAvatarCaseStyles() {
    if (document.querySelector('link[data-sq-avatar-case-desktop-safety]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "./avatar-case-desktop-safety.css?v=5.5.11";
    link.dataset.sqAvatarCaseDesktopSafety = "true";
    document.head.appendChild(link);
  }

  function ensureScript({flag, selector, src, datasetKey, message}) {
    if (window[flag] || document.querySelector(selector)) return;
    const script = document.createElement("script");
    script.src = src;
    script.dataset[datasetKey] = "true";
    script.onerror = () => console.warn(message);
    document.body.appendChild(script);
  }

  function ensureMysteryRarityRoll() {
    ensureScript({
      flag:"__salitaMysteryRarityRollV1Installed",
      selector:'script[data-sq-mystery-rarity-roll]',
      src:"./mystery-rarity-roll-v1.js?v=5.5.11",
      datasetKey:"sqMysteryRarityRoll",
      message:"Enhanced Mystery Pack rarity roll could not be loaded."
    });
  }

  function ensureAvatarCollectionPage() {
    if (!document.querySelector('link[data-sq-avatar-collection-page]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "./avatar-collection-page-v2.css?v=5.5.12";
      link.dataset.sqAvatarCollectionPage = "true";
      document.head.appendChild(link);
    }
    ensureScript({
      flag:"__salitaQuestAvatarCollectionPageV2Installed",
      selector:'script[data-sq-avatar-collection-page]',
      src:"./avatar-collection-page-v2.js?v=5.5.12",
      datasetKey:"sqAvatarCollectionPage",
      message:"Avatar Collection page could not be loaded."
    });
  }

  function ensureAvatarCollectionExtras() {
    ensureScript({
      flag:"__salitaAvatarCasePageTabV1Installed",
      selector:'script[data-sq-avatar-case-page-tab]',
      src:"./avatar-case-page-tab-v1.js?v=1.1",
      datasetKey:"sqAvatarCasePageTab",
      message:"Avatar Display Case tab could not be loaded."
    });
    ensureScript({
      flag:"__salitaAvatarCardActionsV1Installed",
      selector:'script[data-sq-avatar-card-actions]',
      src:"./avatar-card-actions-v1.js?v=1.1",
      datasetKey:"sqAvatarCardActions",
      message:"Avatar card actions could not be loaded."
    });
  }

  function isPlaceholder(value) {
    return PLACEHOLDERS.has(String(value ?? "").trim().toLowerCase());
  }

  function cleanTokenTranslations() {
    try {
      if (typeof ITEMS === "undefined" || !Array.isArray(ITEMS)) return;
      ITEMS.forEach(item => {
        const tokens = item?.analysis?.tokens;
        if (!Array.isArray(tokens)) return;
        tokens.forEach(token => {
          if (!Array.isArray(token) || token.length < 2 || !isPlaceholder(token[1])) return;
          token[1] = tokens.length === 1 && item.meaning
            ? item.meaning
            : "Translation pending content review";
        });
      });
    } catch (error) {
      console.warn("Could not validate direct translations", error);
    }
  }

  function patchRenderedTranslations(root = document) {
    if (!root || !document.createTreeWalker) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const matches = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (isPlaceholder(node.nodeValue)) matches.push(node);
    }
    matches.forEach(node => {
      const row = node.parentElement?.closest("[data-token], .token-row, .breakdown-row, li, tr, .analysis-token");
      node.nodeValue = "Translation pending content review";
      row?.classList.add("sq-translation-review-needed");
    });
  }

  function patchCollectionModal(root = document) {
    const selector = ".sq-avatar-case-picker, .avatar-collection-modal, [data-avatar-collection-modal], #avatarCollectionModal";
    const modals = [];
    if (root instanceof Element && root.matches(selector)) modals.push(root);
    root.querySelectorAll?.(selector).forEach(modal => modals.push(modal));
    modals.forEach(modal => {
      modal.classList.add("sq-desktop-collection-safe");
      modal.querySelectorAll("img").forEach(image => {
        image.style.objectFit = "contain";
        image.style.objectPosition = "center";
        image.style.transform = "none";
      });
    });
  }

  let queued = false;
  function schedulePatch(root = document) {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(() => {
      queued = false;
      patchRenderedTranslations(root);
      patchCollectionModal(root);
    });
  }

  ensureAvatarCaseStyles();
  ensureMysteryRarityRoll();
  ensureAvatarCollectionPage();
  ensureAvatarCollectionExtras();
  cleanTokenTranslations();

  const observer = new MutationObserver(records => {
    const relevant = records.some(record => [...record.addedNodes].some(node => node.nodeType === Node.ELEMENT_NODE));
    if (relevant) schedulePatch(document);
  });
  observer.observe(document.documentElement, {subtree:true, childList:true});
  document.addEventListener("DOMContentLoaded", () => schedulePatch(document), {once:true});
  schedulePatch(document);
})();