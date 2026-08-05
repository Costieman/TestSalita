(() => {
  "use strict";

  if (window.__salitaDailyKeyWeekdayReconciliationV3Installed) return;
  window.__salitaDailyKeyWeekdayReconciliationV3Installed = true;

  const KEY_TARGET = 6;
  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function appState() {
    try { return typeof state !== "undefined" ? state : window.state || null; }
    catch { return window.state || null; }
  }

  function localDateKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function validDateKey(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
  }

  function readProfileWeekly() {
    try {
      const store = JSON.parse(localStorage.getItem("salitaQuestLocalProfilesV1") || "null");
      const activeId = sessionStorage.getItem("salitaQuestActiveProfileId");
      return store?.profiles?.find(profile => profile.id === activeId)?.avatarWeeklyRewards || null;
    } catch { return null; }
  }

  function combinedWeeklyState() {
    const profileWeekly = readProfileWeekly();
    const legacyWeekly = appState()?.weeklyAvatarChest;
    const keyDates = [...new Set([
      ...(Array.isArray(profileWeekly?.keyDates) ? profileWeekly.keyDates : []),
      ...(Array.isArray(legacyWeekly?.keyDates) ? legacyWeekly.keyDates : [])
    ].filter(validDateKey))].sort();
    const claims = [profileWeekly?.claims, legacyWeekly?.claims]
      .filter(value => value && typeof value === "object")
      .flatMap(value => Object.values(value));
    const consumed = new Set(claims.flatMap(claim => Array.isArray(claim?.keyDates) ? claim.keyDates.filter(validDateKey) : []));
    return {keyDates, consumed, claims};
  }

  function unclaimedKeyDates() {
    const {keyDates, consumed} = combinedWeeklyState();
    return keyDates.filter(date => !consumed.has(date)).slice(-KEY_TARGET);
  }

  function hasUnclaimedReward() {
    return unclaimedKeyDates().length >= KEY_TARGET;
  }

  function setText(node, value) {
    if (node && node.textContent !== value) node.textContent = value;
  }

  function patchDailyKeys() {
    const host = document.getElementById("questChest");
    if (!host) return;
    const dates = unclaimedKeyDates();
    const count = Math.min(KEY_TARGET, dates.length);
    const ready = count >= KEY_TARGET;
    const title = host.querySelector("#questChestTitle, .weekly-key-copy strong");
    const text = host.querySelector("#questChestText, .weekly-key-copy small");
    const meter = host.querySelector(".weekly-key-meter");
    const status = host.querySelector("#questChestStatus, .weekly-key-action");

    if (meter) {
      const label = `${count} of ${KEY_TARGET} Daily Keys collected`;
      if (meter.getAttribute("aria-label") !== label) meter.setAttribute("aria-label", label);
      [...meter.children].forEach((slot, index) => {
        const collected = index < count;
        slot.classList.toggle("collected", collected);
        setText(slot, collected ? "🔑" : "");
      });
    }

    if (ready) {
      host.classList.add("weekly-ready", "unlocked");
      host.classList.remove("locked", "weekly-claimed");
      setText(title, "Weekly avatar reward ready!");
      setText(text, "Six Daily Keys collected. Choose an eligible avatar reward.");
      if (status && !status.querySelector('[data-weekly-shard-action="choose"]')) {
        status.innerHTML = '<button class="weekly-chest-button" type="button" data-weekly-shard-action="choose">Choose avatar</button>';
      }
    } else {
      setText(title, `Daily Keys collected · ${count}/${KEY_TARGET}`);
    }
    host.dataset.reconciledKeyCount = String(count);
    host.dataset.reconciledKeyDates = dates.join(",");
  }

  function patchMomentumWeekday() {
    const today = DAY_NAMES[new Date().getDay()];
    const candidates = [...document.querySelectorAll("section, article, div")].filter(node =>
      /weekly momentum/i.test(node.textContent || "") && node.children.length > 0
    );
    const host = candidates.sort((a,b) => a.textContent.length - b.textContent.length)[0];
    if (!host) return;
    const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const value = String(node.nodeValue || "");
      const next = value.replace(/\b(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\b/g, today);
      if (next !== value) node.nodeValue = next;
    }
    host.dataset.localWeekday = today;
    host.dataset.localDate = localDateKey();
  }

  let scheduled = false;
  function schedule(delay = 0) {
    if (delay) return void window.setTimeout(() => schedule(), delay);
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      patchDailyKeys();
      patchMomentumWeekday();
    });
  }

  ["salita:state-changed", "salita:daily-quests-rendered", "salita:weekly-chest-rendered", "salita:weekly-key-earned"].forEach(name => {
    document.addEventListener(name, () => schedule());
  });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) schedule(); });
  window.addEventListener("focus", () => schedule());
  document.addEventListener("DOMContentLoaded", () => schedule(), {once:true});

  window.SalitaDailyKeyReconciliation = Object.freeze({
    version:3,
    currentLocalDate:localDateKey,
    unclaimedKeyDates,
    hasUnclaimedReward,
    refresh:patchDailyKeys
  });

  schedule();
  schedule(250);
  schedule(900);
})();
