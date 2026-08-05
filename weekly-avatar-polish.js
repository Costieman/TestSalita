(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestWeeklyAvatarPolishInstalled";
  const KEY_TARGET = 6;
  let pendingPlaybackTimer = 0;
  let playingPendingAward = false;

  function retryInstall() {
    window.setTimeout(installPolish, 80);
  }

  function installPolish() {
    try {
      if (
        typeof state === "undefined" ||
        typeof DAILY_QUESTS === "undefined" ||
        typeof ensureDailyActivity !== "function" ||
        typeof claimDailyQuestRewards !== "function" ||
        typeof renderDailyQuests !== "function" ||
        typeof switchView !== "function" ||
        typeof saveState !== "function" ||
        !state.weeklyAvatarChest
      ) {
        retryInstall();
        return;
      }
    } catch {
      retryInstall();
      return;
    }

    if (window[INSTALL_FLAG]) return;
    window[INSTALL_FLAG] = true;

    function parseDateKey(key) {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ""));
      return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12) : new Date();
    }

    function localDateKey(date) {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
    }

    function weekKeyForDate(value) {
      const date = parseDateKey(value);
      date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
      return localDateKey(date);
    }

    function activityDate() {
      return ensureDailyActivity().date || localDateKey(new Date());
    }

    function weeklyState() {
      return state.weeklyAvatarChest || (state.weeklyAvatarChest = {});
    }

    function keyDates() {
      const weekly = weeklyState();
      weekly.keyDates = Array.isArray(weekly.keyDates) ? [...new Set(weekly.keyDates.filter(Boolean))] : [];
      return weekly.keyDates;
    }

    function pendingAwards() {
      const weekly = weeklyState();
      weekly.pendingKeyAwards = Array.isArray(weekly.pendingKeyAwards)
        ? weekly.pendingKeyAwards.filter(award => award && award.date && award.week)
        : [];
      return weekly.pendingKeyAwards;
    }

    function animatedDates() {
      const weekly = weeklyState();
      weekly.animatedKeyDates = Array.isArray(weekly.animatedKeyDates)
        ? [...new Set(weekly.animatedKeyDates.filter(Boolean))]
        : [];
      return weekly.animatedKeyDates;
    }

    function keysThisWeek() {
      const week = weekKeyForDate(activityDate());
      return keyDates().filter(key => weekKeyForDate(key) === week).length;
    }

    function allFourWinsComplete() {
      const activity = ensureDailyActivity();
      return DAILY_QUESTS.length === 4 && DAILY_QUESTS.every(quest => activity.questsClaimed.includes(quest.id));
    }

    function removePendingAwardForDate(date) {
      const awards = pendingAwards();
      const next = awards.filter(award => award.date !== date);
      if (next.length === awards.length) return false;
      weeklyState().pendingKeyAwards = next;
      return true;
    }

    function removePrematureTodayKey() {
      if (allFourWinsComplete()) return false;
      const date = activityDate();
      const dates = keyDates();
      const index = dates.indexOf(date);
      let changed = false;
      if (index >= 0) {
        dates.splice(index, 1);
        changed = true;
      }
      if (removePendingAwardForDate(date)) changed = true;
      return changed;
    }

    function queuePendingKeyAward(count, date = activityDate()) {
      const weekly = weeklyState();
      const awards = pendingAwards();
      if (animatedDates().includes(date) || awards.some(award => award.date === date)) return false;
      awards.push({
        date,
        week: weekKeyForDate(date),
        count: Math.max(1, Math.min(KEY_TARGET, Number(count) || 1)),
        queuedAt: new Date().toISOString()
      });
      weekly.pendingKeyAwards = awards;
      return true;
    }

    function recoverMissedTodayAnimation() {
      const date = activityDate();
      if (!allFourWinsComplete() || !keyDates().includes(date)) return false;
      return queuePendingKeyAward(Math.min(KEY_TARGET, keysThisWeek()), date);
    }

    function setFourWinsHeading() {
      const heading = document.querySelector(".daily-quests-card .quest-card-header h3");
      if (heading) heading.textContent = "4 small wins";
    }

    function correctDailyKeyMessage() {
      setFourWinsHeading();
      const chest = document.getElementById("questChest");
      if (!chest || chest.classList.contains("weekly-ready") || chest.classList.contains("weekly-claimed")) return;

      const date = activityDate();
      const earned = keyDates().includes(date);
      const count = Math.min(KEY_TARGET, keysThisWeek());
      chest.classList.toggle("unlocked", earned);
      chest.classList.toggle("locked", !earned);

      const title = document.getElementById("questChestTitle");
      const text = document.getElementById("questChestText");
      const status = document.getElementById("questChestStatus");
      if (title) title.textContent = earned ? `Daily Key collected · ${count}/${KEY_TARGET}` : `Earn today’s Daily Key · ${count}/${KEY_TARGET}`;
      if (text) text.textContent = earned ? "Return on another day and complete all four quests to collect the next key." : "Complete all four Daily Quests to add one key to this week.";
      if (status) status.innerHTML = `<span class="weekly-key-status">${earned ? "✓" : "🔒"}</span>`;
    }

    function isHomeActive() {
      const home = document.getElementById("homeView");
      return Boolean(home?.classList.contains("active")) && document.body.dataset.currentView !== "learn";
    }

    function playDailyKeyChime() {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const context = new AudioContextClass();
        const notes = [659.25, 783.99, 1046.5];
        const start = context.currentTime + 0.04;
        notes.forEach((frequency, index) => {
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          oscillator.type = index === 2 ? "triangle" : "sine";
          oscillator.frequency.setValueAtTime(frequency, start + index * 0.13);
          gain.gain.setValueAtTime(0.0001, start + index * 0.13);
          gain.gain.exponentialRampToValueAtTime(index === 2 ? 0.16 : 0.11, start + index * 0.13 + 0.025);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + index * 0.13 + 0.42);
          oscillator.connect(gain);
          gain.connect(context.destination);
          oscillator.start(start + index * 0.13);
          oscillator.stop(start + index * 0.13 + 0.46);
        });
        window.setTimeout(() => context.close().catch(() => {}), 1200);
      } catch {}
    }

    function createCelebrationLayer(count) {
      document.querySelector(".daily-key-celebration")?.remove();
      const layer = document.createElement("div");
      layer.className = "daily-key-celebration";
      layer.setAttribute("aria-live", "polite");
      layer.innerHTML = `
        <div class="daily-key-celebration-glow" aria-hidden="true"></div>
        <div class="daily-key-celebration-banner" role="status">
          <span>Daily Key earned!</span>
          <strong>${count} of ${KEY_TARGET} keys this week</strong>
        </div>
        <div class="daily-key-spark-field" aria-hidden="true"></div>`;
      document.body.appendChild(layer);

      const field = layer.querySelector(".daily-key-spark-field");
      for (let index = 0; index < 22; index += 1) {
        const spark = document.createElement("i");
        const angle = (360 / 22) * index + (index % 2 ? 7 : -4);
        const distance = 105 + (index % 5) * 18;
        spark.style.setProperty("--spark-angle", `${angle}deg`);
        spark.style.setProperty("--spark-distance", `${distance}px`);
        spark.style.setProperty("--spark-delay", `${(index % 6) * 22}ms`);
        field.appendChild(spark);
      }
      requestAnimationFrame(() => layer.classList.add("show"));
      return layer;
    }

    function burstImpact(target) {
      const rect = target.getBoundingClientRect();
      const burst = document.createElement("div");
      burst.className = "daily-key-impact-burst";
      burst.style.left = `${rect.left + rect.width / 2}px`;
      burst.style.top = `${rect.top + rect.height / 2}px`;
      burst.innerHTML = Array.from({length:12}, (_, index) => {
        const angle = index * 30;
        return `<i style="--impact-angle:${angle}deg"></i>`;
      }).join("");
      document.body.appendChild(burst);
      window.setTimeout(() => burst.remove(), 900);
    }

    function restoreTargetSlot(target) {
      target.textContent = "🔑";
      target.classList.add("collected");
      target.classList.remove("pending-key-arrival");
      target.classList.remove("key-arrival");
      void target.offsetWidth;
      target.classList.add("key-arrival");
      const meter = target.closest(".weekly-key-meter");
      const chest = target.closest(".quest-chest");
      meter?.classList.remove("key-meter-impact");
      chest?.classList.remove("key-chest-impact");
      void target.offsetWidth;
      meter?.classList.add("key-meter-impact");
      chest?.classList.add("key-chest-impact");
      burstImpact(target);
      window.setTimeout(() => {
        target.classList.remove("key-arrival");
        meter?.classList.remove("key-meter-impact");
        chest?.classList.remove("key-chest-impact");
      }, 1100);
    }

    function animateDailyKeyAward(count) {
      return new Promise(resolve => {
        const target = document.querySelector(`.weekly-key-slot:nth-child(${Math.max(1, count)})`);
        if (!target || !isHomeActive()) {
          resolve(false);
          return;
        }

        target.classList.remove("key-arrival", "collected");
        target.classList.add("pending-key-arrival");
        target.textContent = "";

        const reduced = Boolean(state.settings?.reducedMotion) || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
        const layer = createCelebrationLayer(count);
        playDailyKeyChime();

        if (reduced) {
          window.setTimeout(() => {
            restoreTargetSlot(target);
            layer.classList.add("leaving");
            window.setTimeout(() => layer.remove(), 420);
            resolve(true);
          }, 900);
          return;
        }

        const targetRect = target.getBoundingClientRect();
        const startX = window.innerWidth / 2;
        const startY = Math.min(window.innerHeight * 0.48, targetRect.top - 95);
        const endX = targetRect.left + targetRect.width / 2;
        const endY = targetRect.top + targetRect.height / 2;
        const dx = endX - startX;
        const dy = endY - startY;

        const key = document.createElement("div");
        key.className = "daily-key-award daily-key-award-grand";
        key.textContent = "🔑";
        key.setAttribute("aria-hidden", "true");
        key.style.left = `${startX}px`;
        key.style.top = `${startY}px`;
        document.body.appendChild(key);

        const animation = key.animate([
          {opacity:0,transform:"translate(-50%,-50%) scale(.15) rotate(-28deg)",filter:"brightness(1) blur(2px)"},
          {opacity:1,transform:"translate(-50%,-50%) scale(1.38) rotate(8deg)",filter:"brightness(2.05) blur(0)",offset:.18},
          {opacity:1,transform:"translate(-50%,-58%) scale(1.12) rotate(-6deg)",filter:"brightness(1.5)",offset:.34},
          {opacity:1,transform:"translate(-50%,-54%) scale(1.24) rotate(5deg)",filter:"brightness(1.72)",offset:.46},
          {opacity:1,transform:`translate(calc(-50% + ${dx * .25}px),calc(-54% + ${dy * .12}px)) scale(1.02) rotate(32deg)`,filter:"brightness(1.6)",offset:.62},
          {opacity:1,transform:`translate(calc(-50% + ${dx * .72}px),calc(-54% + ${dy * .62}px)) scale(.76) rotate(235deg)`,filter:"brightness(1.45)",offset:.82},
          {opacity:1,transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.42) rotate(360deg)`,filter:"brightness(2.2)",offset:.94},
          {opacity:0,transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.12) rotate(390deg)`,filter:"brightness(2.8)"}
        ],{duration:2350,easing:"cubic-bezier(.18,.78,.18,1)",fill:"forwards"});

        window.setTimeout(() => layer.classList.add("key-in-flight"), 1080);
        window.setTimeout(() => layer.classList.add("leaving"), 1850);

        animation.finished.catch(() => {}).finally(() => {
          key.remove();
          restoreTargetSlot(target);
          window.setTimeout(() => layer.remove(), 500);
          resolve(true);
        });
      });
    }

    function currentWeekPendingAward() {
      const week = weekKeyForDate(activityDate());
      return pendingAwards().find(award => award.week === week) || null;
    }

    function markAwardPlayed(award) {
      const weekly = weeklyState();
      weekly.pendingKeyAwards = pendingAwards().filter(item => item.date !== award.date);
      const played = animatedDates();
      if (!played.includes(award.date)) played.push(award.date);
      weekly.animatedKeyDates = played.slice(-180);
      saveState();
    }

    async function playPendingAwardOnHome() {
      window.clearTimeout(pendingPlaybackTimer);
      if (playingPendingAward || !isHomeActive()) return;
      const award = currentWeekPendingAward();
      if (!award) return;

      playingPendingAward = true;
      renderDailyQuests();
      await new Promise(resolve => window.setTimeout(resolve, 320));
      const played = await animateDailyKeyAward(award.count);
      if (played) markAwardPlayed(award);
      playingPendingAward = false;

      if (currentWeekPendingAward() && isHomeActive()) {
        pendingPlaybackTimer = window.setTimeout(playPendingAwardOnHome, 600);
      }
    }

    function schedulePendingPlayback(delay = 320) {
      window.clearTimeout(pendingPlaybackTimer);
      pendingPlaybackTimer = window.setTimeout(playPendingAwardOnHome, delay);
    }

    const baseClaimDailyQuestRewards = claimDailyQuestRewards;
    claimDailyQuestRewards = function claimDailyQuestRewardsWithDeferredKeyFlight(celebrate = false) {
      const before = keysThisWeek();
      const result = baseClaimDailyQuestRewards(celebrate);
      const valid = allFourWinsComplete();
      const removed = removePrematureTodayKey();
      const after = keysThisWeek();
      let changed = removed;

      if (valid && after > before) {
        changed = queuePendingKeyAward(Math.min(KEY_TARGET, after)) || changed;
      }
      if (changed) saveState();

      if (valid && after > before && isHomeActive()) schedulePendingPlayback(420);
      return result;
    };

    const baseRenderDailyQuests = renderDailyQuests;
    renderDailyQuests = function renderDailyQuestsWithFourWinsHeading() {
      baseRenderDailyQuests();
      correctDailyKeyMessage();
    };

    const baseSwitchView = switchView;
    switchView = function switchViewWithPendingKeyAward(view) {
      const result = baseSwitchView.apply(this, arguments);
      if (view === "home") schedulePendingPlayback(480);
      return result;
    };

    let changed = removePrematureTodayKey();
    changed = recoverMissedTodayAnimation() || changed;
    if (changed) saveState();
    setFourWinsHeading();
    renderDailyQuests();
    if (isHomeActive()) schedulePendingPlayback(520);
  }

  installPolish();
})();