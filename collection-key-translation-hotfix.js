(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestCollectionKeyTranslationHotfixV2";
  if (window[INSTALL_FLAG]) return;
  window[INSTALL_FLAG] = true;

  const KEY_TARGET = 6;
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

  function dateKeyToNumber(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
    if (!match) return null;
    return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  function localCalendarKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function todayKey() {
    return localCalendarKey(new Date());
  }

  function installLocalCalendarFix() {
    try {
      window.todayKey = () => localCalendarKey(new Date());
      window.studyWeekDays = function studyWeekDaysLocalCalendar() {
        const today = new Date();
        const day = (today.getDay() + 6) % 7;
        const monday = new Date(today);
        monday.setHours(12, 0, 0, 0);
        monday.setDate(today.getDate() - day);
        const todayLocal = localCalendarKey(today);
        return Array.from({length:7}, (_, index) => {
          const date = new Date(monday);
          date.setDate(monday.getDate() + index);
          const key = localCalendarKey(date);
          return {
            key,
            label:["M","T","W","T","F","S","S"][index],
            studied:(state.studyDates || []).includes(key),
            today:key === todayLocal
          };
        });
      };
      window.updateStudyStreak = function updateStudyStreakLocalCalendar() {
        const today = localCalendarKey(new Date());
        if (state.lastStudyDate === today) return;
        const yesterday = new Date();
        yesterday.setHours(12, 0, 0, 0);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = localCalendarKey(yesterday);
        state.streak = state.lastStudyDate === yesterdayKey ? state.streak + 1 : 1;
        state.bestStreak = Math.max(state.bestStreak, state.streak);
        state.lastStudyDate = today;
      };
      document.documentElement.dataset.localCalendarFix = "v1";
      if (typeof ensureDailyActivity === "function") ensureDailyActivity();
      if (typeof updateHome === "function") updateHome();
      if (typeof renderProgress === "function") renderProgress();
    } catch (error) {
      console.warn("Could not install local calendar timing fix", error);
    }
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

  function canonicalRunDates() {
    try {
      if (typeof state === "undefined") return null;
      const chest = state.weeklyAvatarChest;
      if (!chest || typeof chest !== "object") return [];
      const consumed = new Set((Array.isArray(chest.keyRunClaims) ? chest.keyRunClaims : [])
        .flatMap(claim => Array.isArray(claim?.keyDates) ? claim.keyDates : []));
      const available = [...new Set((Array.isArray(chest.keyDates) ? chest.keyDates : [])
        .filter(date => date && !consumed.has(date)))]
        .filter(date => dateKeyToNumber(date) != null)
        .sort();
      if (!available.length) return [];

      const latest = available[available.length - 1];
      const latestNumber = dateKeyToNumber(latest);
      const todayNumber = dateKeyToNumber(todayKey());
      if (latestNumber == null || todayNumber == null || (todayNumber - latestNumber) / 86400000 > 1) return [];

      const run = [latest];
      for (let index = available.length - 2; index >= 0; index -= 1) {
        const candidate = available[index];
        const candidateNumber = dateKeyToNumber(candidate);
        const firstNumber = dateKeyToNumber(run[0]);
        if (candidateNumber == null || firstNumber == null || (firstNumber - candidateNumber) / 86400000 !== 1) break;
        run.unshift(candidate);
      }
      return run.slice(-KEY_TARGET);
    } catch {
      return null;
    }
  }

  function patchKeyCard() {
    const host = document.getElementById("questChest");
    const dates = canonicalRunDates();
    if (!host || dates == null) return;
    const count = Math.min(KEY_TARGET, dates.length);
    const title = host.querySelector("#questChestTitle, strong");
    if (title && count < KEY_TARGET) title.textContent = `Daily Keys collected · ${count}/${KEY_TARGET}`;
    const meter = host.querySelector(".weekly-key-meter");
    if (!meter) return;
    meter.setAttribute("aria-label", `${count} of ${KEY_TARGET} consecutive Daily Keys collected`);
    [...meter.children].forEach((slot, index) => {
      slot.classList.toggle("collected", index < count);
      slot.textContent = index < count ? "🔑" : "";
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
      patchKeyCard();
      patchCollectionModal(root);
    });
  }

  ensureAvatarCaseStyles();
  ensureMysteryRarityRoll();
  ensureAvatarCollectionPage();
  ensureAvatarCollectionExtras();
  installLocalCalendarFix();
  cleanTokenTranslations();
  const observer = new MutationObserver(records => {
    const relevant = records.some(record => [...record.addedNodes].some(node => node.nodeType === Node.ELEMENT_NODE));
    if (relevant) schedulePatch(document);
  });
  observer.observe(document.documentElement, {subtree:true, childList:true});

  document.addEventListener("DOMContentLoaded", () => schedulePatch(document), {once:true});
  document.addEventListener("salita:state-changed", patchKeyCard);
  document.addEventListener("salita:daily-quests-rendered", patchKeyCard);
  schedulePatch(document);
})();