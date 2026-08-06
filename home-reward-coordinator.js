(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestHomeRewardCoordinatorInstalled";
  const KEY_TARGET = 6;
  let timer = 0;
  let playing = false;

  function retry() {
    window.setTimeout(install, 90);
  }

  function keyState() {
    const chest = state.weeklyAvatarChest || (state.weeklyAvatarChest = {});
    chest.keyDates = Array.isArray(chest.keyDates) ? [...new Set(chest.keyDates.filter(Boolean))].sort() : [];
    chest.pendingKeyAwards = Array.isArray(chest.pendingKeyAwards) ? chest.pendingKeyAwards.filter(item => item?.date) : [];
    chest.animatedKeyDates = Array.isArray(chest.animatedKeyDates) ? [...new Set(chest.animatedKeyDates.filter(Boolean))] : [];
    return chest;
  }

  function today() {
    try { return ensureDailyActivity().date || todayKey(); }
    catch { return new Date().toISOString().slice(0, 10); }
  }

  function allQuestsComplete() {
    try {
      const activity = ensureDailyActivity();
      return DAILY_QUESTS.length === 4 && DAILY_QUESTS.every(quest => activity.questsClaimed.includes(quest.id));
    } catch { return false; }
  }

  function recoverMissedAward() {
    const chest = keyState();
    const date = today();
    if (!allQuestsComplete() || !chest.keyDates.includes(date) || chest.animatedKeyDates.includes(date)) return false;
    if (chest.pendingKeyAwards.some(item => item.date === date)) return false;
    const recent = chest.keyDates.slice(-KEY_TARGET);
    chest.pendingKeyAwards.push({date, count:Math.max(1, Math.min(KEY_TARGET, recent.length)), queuedAt:new Date().toISOString(), source:"home-recovery"});
    saveState();
    return true;
  }

  function homeVisible() {
    const home = document.getElementById("homeView");
    return document.visibilityState !== "hidden" && document.body.dataset.currentView === "home" && home?.classList.contains("active");
  }

  function visibleTarget(count) {
    const target = document.querySelector(`.weekly-key-slot:nth-child(${Math.max(1, Math.min(KEY_TARGET, count))})`);
    if (!target) return null;
    const rect = target.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 ? target : null;
  }

  async function waitForTarget(count, timeout = 4500) {
    const started = performance.now();
    while (performance.now() - started < timeout) {
      if (!homeVisible()) return null;
      const target = visibleTarget(count);
      if (target) return target;
      try { renderDailyQuests(); } catch {}
      await new Promise(resolve => window.setTimeout(resolve, 120));
    }
    return null;
  }

  function rewardLayer(count) {
    document.querySelector(".daily-key-celebration.reward-coordinator")?.remove();
    const layer = document.createElement("div");
    layer.className = "daily-key-celebration reward-coordinator";
    layer.setAttribute("aria-live", "polite");
    layer.innerHTML = `<div class="daily-key-celebration-glow" aria-hidden="true"></div><div class="daily-key-celebration-banner" role="status"><span>Daily Key earned!</span><strong>${count} of ${KEY_TARGET} keys in a row</strong></div><div class="daily-key-spark-field" aria-hidden="true"></div>`;
    const field = layer.querySelector(".daily-key-spark-field");
    for (let index = 0; index < 22; index += 1) {
      const spark = document.createElement("i");
      spark.style.setProperty("--spark-angle", `${(360 / 22) * index}deg`);
      spark.style.setProperty("--spark-distance", `${105 + (index % 5) * 18}px`);
      spark.style.setProperty("--spark-delay", `${(index % 6) * 22}ms`);
      field.appendChild(spark);
    }
    document.body.appendChild(layer);
    requestAnimationFrame(() => layer.classList.add("show"));
    return layer;
  }

  function finishTarget(target) {
    target.textContent = "🔑";
    target.classList.add("collected", "key-arrival");
    target.classList.remove("pending-key-arrival");
    target.closest(".weekly-key-meter")?.classList.add("key-meter-impact");
    target.closest(".quest-chest")?.classList.add("key-chest-impact");
  }

  async function animate(award, target) {
    target.classList.remove("collected", "key-arrival");
    target.classList.add("pending-key-arrival");
    target.textContent = "";
    const layer = rewardLayer(award.count);
    const reduced = Boolean(state.settings?.reducedMotion) || matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      await new Promise(resolve => setTimeout(resolve, 850));
      finishTarget(target);
      layer.remove();
      return true;
    }

    const rect = target.getBoundingClientRect();
    const startX = innerWidth / 2;
    const startY = innerHeight * .46;
    const dx = rect.left + rect.width / 2 - startX;
    const dy = rect.top + rect.height / 2 - startY;
    const key = document.createElement("div");
    key.className = "daily-key-award daily-key-award-grand";
    key.textContent = "🔑";
    key.style.left = `${startX}px`;
    key.style.top = `${startY}px`;
    document.body.appendChild(key);
    const motion = key.animate([
      {opacity:0,transform:"translate(-50%,-50%) scale(.2) rotate(-25deg)"},
      {opacity:1,transform:"translate(-50%,-50%) scale(1.4) rotate(8deg)",offset:.22},
      {opacity:1,transform:`translate(calc(-50% + ${dx * .32}px),calc(-50% + ${dy * .16}px)) scale(1.05) rotate(80deg)`,offset:.62},
      {opacity:1,transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.42) rotate(360deg)`,offset:.94},
      {opacity:0,transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.12) rotate(390deg)`}
    ], {duration:2350,easing:"cubic-bezier(.18,.78,.18,1)",fill:"forwards"});
    setTimeout(() => layer.classList.add("key-in-flight"), 1050);
    setTimeout(() => layer.classList.add("leaving"), 1840);
    await motion.finished.catch(() => {});
    key.remove();
    finishTarget(target);
    setTimeout(() => layer.remove(), 520);
    return true;
  }

  function markPlayed(award) {
    const chest = keyState();
    chest.pendingKeyAwards = chest.pendingKeyAwards.filter(item => item.date !== award.date);
    if (!chest.animatedKeyDates.includes(award.date)) chest.animatedKeyDates.push(award.date);
    chest.animatedKeyDates = chest.animatedKeyDates.slice(-240);
    saveState();
  }

  async function playPending() {
    clearTimeout(timer);
    if (playing || !homeVisible()) return;
    recoverMissedAward();
    const award = keyState().pendingKeyAwards[0];
    if (!award) return;
    playing = true;
    try {
      renderDailyQuests();
      const target = await waitForTarget(award.count);
      if (!target || !homeVisible()) return;
      if (await animate(award, target)) markPlayed(award);
    } finally {
      playing = false;
      if (keyState().pendingKeyAwards.length && homeVisible()) schedule(700);
    }
  }

  function schedule(delay = 800) {
    clearTimeout(timer);
    timer = window.setTimeout(playPending, delay);
  }

  function install() {
    try {
      if (typeof state === "undefined" || typeof switchView !== "function" || typeof renderDailyQuests !== "function" || typeof saveState !== "function") {
        retry(); return;
      }
    } catch { retry(); return; }
    if (window[INSTALL_FLAG]) return;
    window[INSTALL_FLAG] = true;

    const baseSwitchView = switchView;
    switchView = function switchViewWithGuaranteedHomeRewards(view) {
      const result = baseSwitchView.apply(this, arguments);
      if (view === "home") schedule(900);
      return result;
    };

    document.addEventListener("visibilitychange", () => { if (!document.hidden && homeVisible()) schedule(700); });
    window.addEventListener("pageshow", () => { if (homeVisible()) schedule(900); });
    const observer = new MutationObserver(() => { if (homeVisible() && keyState().pendingKeyAwards.length) schedule(500); });
    observer.observe(document.getElementById("homeView") || document.body, {subtree:true,childList:true,attributes:true,attributeFilter:["class"]});

    recoverMissedAward();
    if (homeVisible()) schedule(1000);
  }

  install();
})();
