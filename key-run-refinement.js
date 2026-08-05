(() => {
  "use strict";

  /* Prevent the older calendar-week animation layer from installing. */
  window.__salitaQuestWeeklyAvatarPolishInstalled = true;

  const INSTALL_FLAG = "__salitaQuestKeyRunRefinementInstalled";
  const KEY_TARGET = 6;
  const MAX_HISTORY = 240;

  const AVATARS = [
    {id:"tarsier", name:"Philippine Tarsier", src:"avatars/tarsier.png"},
    {id:"eagle", name:"Philippine Eagle", src:"avatars/eagle.png"},
    {id:"tamaraw", name:"Tamaraw", src:"avatars/tamaraw.png"},
    {id:"peacock", name:"Palawan Peacock-Pheasant", src:"avatars/peacock.png"},
    {id:"orchid", name:"Waling-Waling Orchid", src:"avatars/orchid.png"},
    {id:"jade", name:"Jade Vine", src:"avatars/jade.png"},
    {id:"rafflesia", name:"Philippine Rafflesia", src:"avatars/rafflesia.png"},
    {id:"anahaw", name:"Anahaw", src:"avatars/anahaw.png"}
  ];
  const VARIANTS = [
    {id:"sunrise", label:"Sunrise", colors:["#f7c948", "#ef765e"]},
    {id:"islands", label:"Island", colors:["#19a38f", "#4d89e8"]},
    {id:"midnight", label:"Midnight", colors:["#22345f", "#7d6bd6"]}
  ];
  const REWARDS = AVATARS.flatMap(avatar => VARIANTS.map(variant => ({
    id:`${avatar.id}-${variant.id}`,
    avatarId:avatar.id,
    avatarName:avatar.name,
    src:avatar.src,
    variantId:variant.id,
    variantLabel:variant.label,
    colors:variant.colors,
    title:`${variant.label} ${avatar.name}`
  })));

  let pendingTimer = 0;
  let playing = false;

  function retry() {
    window.setTimeout(install, 80);
  }

  function parseDateKey(key) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ""));
    return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12) : new Date();
  }

  function dayDistance(earlier, later) {
    const start = parseDateKey(earlier);
    const end = parseDateKey(later);
    return Math.round((end - start) / 86400000);
  }

  function todayDateKey() {
    const activity = ensureDailyActivity();
    if (activity?.date) return activity.date;
    if (typeof todayKey === "function") return todayKey();
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  }

  function randomIndex(length) {
    if (length <= 1) return 0;
    if (window.crypto?.getRandomValues) {
      const values = new Uint32Array(1);
      window.crypto.getRandomValues(values);
      return values[0] % length;
    }
    return Math.floor(Math.random() * length);
  }

  function install() {
    try {
      if (
        typeof state === "undefined" ||
        typeof DAILY_QUESTS === "undefined" ||
        typeof ensureDailyActivity !== "function" ||
        typeof claimDailyQuestRewards !== "function" ||
        typeof renderDailyQuests !== "function" ||
        typeof switchView !== "function" ||
        typeof saveState !== "function" ||
        typeof showRewardBurst !== "function" ||
        !state.weeklyAvatarChest
      ) {
        retry();
        return;
      }
    } catch {
      retry();
      return;
    }

    if (window[INSTALL_FLAG]) return;
    window[INSTALL_FLAG] = true;

    function escapeHTML(value) {
      return String(value ?? "").replace(/[&<>'"]/g, character => ({
        "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;"
      }[character]));
    }

    function ensureKeyState() {
      const chest = state.weeklyAvatarChest || (state.weeklyAvatarChest = {});
      chest.keyDates = Array.isArray(chest.keyDates) ? [...new Set(chest.keyDates.filter(Boolean))].sort() : [];
      chest.unlockedRewards = Array.isArray(chest.unlockedRewards) ? [...new Set(chest.unlockedRewards)] : [];
      chest.keyRunClaims = Array.isArray(chest.keyRunClaims) ? chest.keyRunClaims.filter(Boolean) : [];
      chest.pendingKeyAwards = Array.isArray(chest.pendingKeyAwards) ? chest.pendingKeyAwards.filter(award => award?.date) : [];
      chest.animatedKeyDates = Array.isArray(chest.animatedKeyDates) ? [...new Set(chest.animatedKeyDates.filter(Boolean))] : [];

      if (!chest.keyRunClaims.length && chest.claims && typeof chest.claims === "object") {
        chest.keyRunClaims = Object.entries(chest.claims).map(([id, claim]) => ({
          id:`legacy-${id}`,
          rewardId:claim?.rewardId,
          claimedAt:claim?.claimedAt || new Date().toISOString(),
          keyDates:Array.isArray(claim?.keyDates) ? claim.keyDates : []
        })).filter(claim => claim.rewardId);
      }

      if (chest.keyDates.length > MAX_HISTORY) chest.keyDates = chest.keyDates.slice(-MAX_HISTORY);
      return chest;
    }

    function consumedDates() {
      return new Set(ensureKeyState().keyRunClaims.flatMap(claim => Array.isArray(claim.keyDates) ? claim.keyDates : []));
    }

    function currentRunDates() {
      const chest = ensureKeyState();
      const consumed = consumedDates();
      const available = chest.keyDates.filter(date => !consumed.has(date)).sort();
      if (!available.length) return [];

      const latest = available[available.length - 1];
      if (dayDistance(latest, todayDateKey()) > 1) return [];

      const run = [latest];
      for (let index = available.length - 2; index >= 0; index -= 1) {
        const date = available[index];
        if (dayDistance(date, run[0]) !== 1) break;
        run.unshift(date);
      }
      return run;
    }

    function currentRunCount() {
      return Math.min(KEY_TARGET, currentRunDates().length);
    }

    function latestClaim() {
      return [...ensureKeyState().keyRunClaims].sort((a,b) => String(b.claimedAt || "").localeCompare(String(a.claimedAt || "")))[0] || null;
    }

    function rewardById(id) {
      return REWARDS.find(reward => reward.id === id) || REWARDS[0];
    }

    function chooseReward() {
      const chest = ensureKeyState();
      const unopened = REWARDS.filter(reward => !chest.unlockedRewards.includes(reward.id));
      const pool = unopened.length ? unopened : REWARDS;
      return pool[randomIndex(pool.length)];
    }

    function allGoalsComplete() {
      const activity = ensureDailyActivity();
      return DAILY_QUESTS.length === 4 && DAILY_QUESTS.every(quest => activity.questsClaimed.includes(quest.id));
    }

    function reconcileTodayKey() {
      const activity = ensureDailyActivity();
      const chest = ensureKeyState();
      const date = todayDateKey();
      const hasKey = chest.keyDates.includes(date);
      if (!allGoalsComplete()) {
        activity.chestClaimed = false;
        if (hasKey) chest.keyDates = chest.keyDates.filter(item => item !== date);
        chest.pendingKeyAwards = chest.pendingKeyAwards.filter(award => award.date !== date);
        return hasKey;
      }
      return false;
    }

    function keyMeterHTML(count) {
      return `<div class="weekly-key-meter" aria-label="${count} of ${KEY_TARGET} consecutive keys collected">${Array.from({length:KEY_TARGET}, (_, index) => `<span class="weekly-key-slot ${index < count ? "collected" : ""}">${index < count ? "🔑" : ""}</span>`).join("")}</div>`;
    }

    function renderKeyRunChest() {
      const host = document.getElementById("questChest");
      if (!host) return;
      const activity = ensureDailyActivity();
      const runDates = currentRunDates();
      const count = Math.min(KEY_TARGET, runDates.length);
      const ready = count >= KEY_TARGET;
      const earnedToday = ensureKeyState().keyDates.includes(todayDateKey()) && allGoalsComplete();
      const claim = latestClaim();
      const latestReward = claim ? rewardById(claim.rewardId) : null;

      host.classList.toggle("locked", !earnedToday && !ready);
      host.classList.toggle("unlocked", earnedToday || ready || Boolean(claim));
      host.classList.toggle("weekly-ready", ready);
      host.classList.toggle("weekly-claimed", Boolean(claim) && count === 0);

      let title = count ? `Key run · ${count}/${KEY_TARGET}` : `Start a six-key run · 0/${KEY_TARGET}`;
      let text = earnedToday
        ? "Come back tomorrow and complete all four quests. Missing a day resets the current run."
        : "Complete all four Daily Quests today. Six consecutive Daily Keys open a collectible chest.";
      let action = `<span class="weekly-key-status">${earnedToday ? "✓" : "🔒"}</span>`;

      if (ready) {
        title = "Six-key chest ready!";
        text = "Six Daily Keys in a row collected. Open the chest to reveal a random collectible avatar.";
        action = '<button class="weekly-chest-button" type="button" data-key-run-action="open">Open chest</button>';
      } else if (latestReward) {
        text += ` Latest reward: ${latestReward.title}.`;
        action = '<button class="weekly-chest-button secondary" type="button" data-key-run-action="view">View latest</button>';
      }

      host.innerHTML = `
        <div class="weekly-key-icon" aria-hidden="true">${ready ? "🎁" : "🔑"}</div>
        <div class="weekly-key-copy">
          <strong id="questChestTitle">${escapeHTML(title)}</strong>
          <small id="questChestText">${escapeHTML(text)}</small>
          ${keyMeterHTML(count)}
        </div>
        <div id="questChestStatus" class="weekly-key-action">${action}</div>`;
    }

    function queuePendingAward(count, date = todayDateKey()) {
      const chest = ensureKeyState();
      if (chest.animatedKeyDates.includes(date) || chest.pendingKeyAwards.some(award => award.date === date)) return false;
      chest.pendingKeyAwards.push({date, count:Math.max(1, Math.min(KEY_TARGET, count)), queuedAt:new Date().toISOString()});
      return true;
    }

    const baseClaimDailyQuestRewards = claimDailyQuestRewards;
    claimDailyQuestRewards = function claimDailyQuestRewardsWithKeyRun() {
      const chest = ensureKeyState();
      const date = todayDateKey();
      const hadKey = chest.keyDates.includes(date);
      const before = currentRunCount();
      const result = baseClaimDailyQuestRewards(false);
      const changed = reconcileTodayKey();
      const hasKey = ensureKeyState().keyDates.includes(date);
      const after = currentRunCount();

      if (!hadKey && hasKey && allGoalsComplete()) queuePendingAward(after, date);
      if (changed || (!hadKey && hasKey) || after !== before) saveState();
      renderKeyRunChest();
      if (!hadKey && hasKey && isHomeActive()) schedulePlayback(420);
      return result;
    };

    const baseRenderDailyQuests = renderDailyQuests;
    renderDailyQuests = function renderDailyQuestsWithKeyRun() {
      baseRenderDailyQuests();
      const heading = document.querySelector(".daily-quests-card .quest-card-header h3");
      if (heading) heading.textContent = "4 small wins";
      renderKeyRunChest();
    };

    function claimKeyRunChest() {
      const run = currentRunDates();
      if (run.length < KEY_TARGET) return null;
      const chest = ensureKeyState();
      const reward = chooseReward();
      const usedDates = run.slice(0, KEY_TARGET);
      const claim = {
        id:`run-${usedDates[usedDates.length - 1]}-${Date.now()}`,
        rewardId:reward.id,
        claimedAt:new Date().toISOString(),
        keyDates:usedDates
      };
      chest.keyRunClaims.push(claim);
      if (!chest.unlockedRewards.includes(reward.id)) chest.unlockedRewards.push(reward.id);
      saveState();
      showRewardBurst("🎁", `${reward.title} unlocked!`, true);
      renderDailyQuests();
      return reward;
    }

    function ensureModal() {
      let modal = document.getElementById("keyRunAvatarModal");
      if (modal) return modal;
      modal = document.createElement("div");
      modal.id = "keyRunAvatarModal";
      modal.className = "weekly-avatar-modal hidden";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.innerHTML = `
        <div class="weekly-avatar-card-shell">
          <button class="weekly-avatar-close" type="button" data-key-run-close aria-label="Close">×</button>
          <p class="eyebrow">Six-key streak reward</p>
          <div class="weekly-avatar-preview" id="keyRunAvatarPreview"><span class="weekly-avatar-spark">★</span><img id="keyRunAvatarImage" alt=""></div>
          <h2 id="keyRunAvatarTitle"></h2>
          <p id="keyRunAvatarText">Collected with six consecutive Daily Keys.</p>
          <div class="weekly-avatar-actions">
            <button class="primary-btn" id="shareKeyRunAvatarBtn" type="button">Share social card</button>
            <button class="secondary-btn" type="button" data-key-run-close>Close</button>
          </div>
          <small class="weekly-avatar-privacy">Nothing is posted automatically. Share opens your device’s normal share options.</small>
        </div>`;
      document.body.appendChild(modal);
      modal.addEventListener("click", event => {
        if (event.target === modal || event.target.closest("[data-key-run-close]")) closeModal();
      });
      return modal;
    }

    let activeReward = null;

    function openRewardModal(reward) {
      if (!reward) return;
      activeReward = reward;
      const modal = ensureModal();
      const preview = modal.querySelector("#keyRunAvatarPreview");
      preview.style.setProperty("--reward-a", reward.colors[0]);
      preview.style.setProperty("--reward-b", reward.colors[1]);
      const image = modal.querySelector("#keyRunAvatarImage");
      image.src = reward.src;
      image.alt = reward.avatarName;
      modal.querySelector("#keyRunAvatarTitle").textContent = reward.title;
      modal.querySelector("#shareKeyRunAvatarBtn").onclick = () => shareReward(reward);
      modal.classList.remove("hidden");
      document.body.classList.add("modal-open");
    }

    function closeModal() {
      document.getElementById("keyRunAvatarModal")?.classList.add("hidden");
      document.body.classList.remove("modal-open");
    }

    function loadImage(src) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
      });
    }

    async function buildSocialCard(reward) {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1080;
      const context = canvas.getContext("2d");
      const gradient = context.createLinearGradient(0, 0, 1080, 1080);
      gradient.addColorStop(0, reward.colors[0]);
      gradient.addColorStop(1, reward.colors[1]);
      context.fillStyle = gradient;
      context.fillRect(0, 0, 1080, 1080);
      context.fillStyle = "rgba(15,27,52,.84)";
      context.fillRect(75, 75, 930, 930);
      context.fillStyle = "#f7c948";
      context.font = "900 38px system-ui, sans-serif";
      context.textAlign = "center";
      context.fillText("SALITA QUEST · SIX-KEY REWARD", 540, 155);
      context.fillStyle = "rgba(255,255,255,.96)";
      context.beginPath();
      context.arc(540, 470, 220, 0, Math.PI * 2);
      context.fill();
      const image = await loadImage(reward.src);
      context.drawImage(image, 360, 290, 360, 360);
      context.fillStyle = "#ffffff";
      context.font = "900 58px system-ui, sans-serif";
      context.fillText(reward.avatarName, 540, 790);
      context.fillStyle = "#f7c948";
      context.font = "800 34px system-ui, sans-serif";
      context.fillText(`${reward.variantLabel} Edition`, 540, 850);
      context.fillStyle = "rgba(255,255,255,.82)";
      context.font = "700 28px system-ui, sans-serif";
      context.fillText("Collected with 6 Daily Keys in a row", 540, 930);
      return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Could not create card")), "image/png"));
    }

    async function shareReward(reward) {
      const button = document.getElementById("shareKeyRunAvatarBtn");
      const original = button?.textContent;
      if (button) { button.disabled = true; button.textContent = "Preparing card…"; }
      try {
        const blob = await buildSocialCard(reward);
        const file = new File([blob], `salita-quest-${reward.id}.png`, {type:"image/png"});
        const course = document.body.dataset.course === "cebuano" ? "Bisaya" : "Tagalog";
        const caption = `I earned 6 Daily Keys in a row in Salita Quest and unlocked the ${reward.title} avatar while learning ${course}!`;
        if (navigator.share && navigator.canShare?.({files:[file]})) {
          await navigator.share({title:"My Salita Quest six-key reward", text:caption, files:[file]});
        } else {
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = file.name;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
          try { await navigator.clipboard?.writeText(caption); } catch {}
          showRewardBurst("🖼️", "Social card saved · caption copied when supported", false);
        }
      } catch (error) {
        console.error(error);
        showRewardBurst("⚠️", "The social card could not be created on this device", false);
      } finally {
        if (button) { button.disabled = false; button.textContent = original || "Share social card"; }
      }
    }

    function isHomeActive() {
      const home = document.getElementById("homeView");
      return Boolean(home?.classList.contains("active")) && document.body.dataset.currentView === "home";
    }

    function playChime() {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const context = new AudioContextClass();
        const start = context.currentTime + .04;
        [659.25, 783.99, 1046.5].forEach((frequency, index) => {
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          oscillator.frequency.setValueAtTime(frequency, start + index * .13);
          gain.gain.setValueAtTime(.0001, start + index * .13);
          gain.gain.exponentialRampToValueAtTime(index === 2 ? .16 : .11, start + index * .13 + .025);
          gain.gain.exponentialRampToValueAtTime(.0001, start + index * .13 + .42);
          oscillator.connect(gain); gain.connect(context.destination);
          oscillator.start(start + index * .13); oscillator.stop(start + index * .13 + .46);
        });
        window.setTimeout(() => context.close().catch(() => {}), 1200);
      } catch {}
    }

    function createCelebrationLayer(count) {
      document.querySelector(".daily-key-celebration")?.remove();
      const layer = document.createElement("div");
      layer.className = "daily-key-celebration";
      layer.innerHTML = `
        <div class="daily-key-celebration-glow" aria-hidden="true"></div>
        <div class="daily-key-celebration-banner" role="status"><span>Daily Key earned!</span><strong>${count} of ${KEY_TARGET} keys in a row</strong></div>
        <div class="daily-key-spark-field" aria-hidden="true"></div>`;
      document.body.appendChild(layer);
      const field = layer.querySelector(".daily-key-spark-field");
      for (let index = 0; index < 22; index += 1) {
        const spark = document.createElement("i");
        spark.style.setProperty("--spark-angle", `${(360 / 22) * index + (index % 2 ? 7 : -4)}deg`);
        spark.style.setProperty("--spark-distance", `${105 + (index % 5) * 18}px`);
        spark.style.setProperty("--spark-delay", `${(index % 6) * 22}ms`);
        field.appendChild(spark);
      }
      requestAnimationFrame(() => layer.classList.add("show"));
      return layer;
    }

    function restoreTarget(target) {
      target.textContent = "🔑";
      target.classList.add("collected");
      target.classList.remove("pending-key-arrival");
      target.classList.remove("key-arrival");
      void target.offsetWidth;
      target.classList.add("key-arrival");
      target.closest(".weekly-key-meter")?.classList.add("key-meter-impact");
      target.closest(".quest-chest")?.classList.add("key-chest-impact");
      window.setTimeout(() => target.classList.remove("key-arrival"), 1100);
    }

    function animateAward(count) {
      return new Promise(resolve => {
        const target = document.querySelector(`.weekly-key-slot:nth-child(${Math.max(1, count)})`);
        if (!target || !isHomeActive()) { resolve(false); return; }
        target.classList.remove("key-arrival", "collected");
        target.classList.add("pending-key-arrival");
        target.textContent = "";
        const reduced = Boolean(state.settings?.reducedMotion) || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
        const layer = createCelebrationLayer(count);
        playChime();
        if (reduced) {
          window.setTimeout(() => { restoreTarget(target); layer.remove(); resolve(true); }, 900);
          return;
        }
        const targetRect = target.getBoundingClientRect();
        const startX = window.innerWidth / 2;
        const startY = Math.min(window.innerHeight * .48, targetRect.top - 95);
        const dx = targetRect.left + targetRect.width / 2 - startX;
        const dy = targetRect.top + targetRect.height / 2 - startY;
        const key = document.createElement("div");
        key.className = "daily-key-award daily-key-award-grand";
        key.textContent = "🔑";
        key.style.left = `${startX}px`;
        key.style.top = `${startY}px`;
        document.body.appendChild(key);
        const animation = key.animate([
          {opacity:0,transform:"translate(-50%,-50%) scale(.15) rotate(-28deg)"},
          {opacity:1,transform:"translate(-50%,-50%) scale(1.38) rotate(8deg)",offset:.2},
          {opacity:1,transform:`translate(calc(-50% + ${dx * .35}px),calc(-50% + ${dy * .2}px)) scale(1) rotate(70deg)`,offset:.62},
          {opacity:1,transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.42) rotate(360deg)`,offset:.94},
          {opacity:0,transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.12) rotate(390deg)`}
        ], {duration:2350,easing:"cubic-bezier(.18,.78,.18,1)",fill:"forwards"});
        window.setTimeout(() => layer.classList.add("key-in-flight"), 1080);
        window.setTimeout(() => layer.classList.add("leaving"), 1850);
        animation.finished.catch(() => {}).finally(() => {
          key.remove(); restoreTarget(target); window.setTimeout(() => layer.remove(), 500); resolve(true);
        });
      });
    }

    function pendingAward() {
      return ensureKeyState().pendingKeyAwards[0] || null;
    }

    function markPlayed(award) {
      const chest = ensureKeyState();
      chest.pendingKeyAwards = chest.pendingKeyAwards.filter(item => item.date !== award.date);
      if (!chest.animatedKeyDates.includes(award.date)) chest.animatedKeyDates.push(award.date);
      chest.animatedKeyDates = chest.animatedKeyDates.slice(-MAX_HISTORY);
      saveState();
    }

    async function playPendingOnHome() {
      window.clearTimeout(pendingTimer);
      if (playing || !isHomeActive()) return;
      const award = pendingAward();
      if (!award) return;
      playing = true;
      renderDailyQuests();
      await new Promise(resolve => window.setTimeout(resolve, 320));
      const played = await animateAward(award.count);
      if (played) markPlayed(award);
      playing = false;
      if (pendingAward() && isHomeActive()) schedulePlayback(600);
    }

    function schedulePlayback(delay = 320) {
      window.clearTimeout(pendingTimer);
      pendingTimer = window.setTimeout(playPendingOnHome, delay);
    }

    const baseSwitchView = switchView;
    switchView = function switchViewWithKeyRun(view) {
      const result = baseSwitchView.apply(this, arguments);
      if (view === "home") schedulePlayback(480);
      return result;
    };

    document.getElementById("questChest")?.addEventListener("click", event => {
      const control = event.target.closest("[data-key-run-action]");
      if (!control) return;
      if (control.dataset.keyRunAction === "open") openRewardModal(claimKeyRunChest());
      else {
        const claim = latestClaim();
        if (claim) openRewardModal(rewardById(claim.rewardId));
      }
    });

    let changed = reconcileTodayKey();
    const date = todayDateKey();
    if (allGoalsComplete() && ensureKeyState().keyDates.includes(date) && !ensureKeyState().animatedKeyDates.includes(date)) {
      changed = queuePendingAward(currentRunCount(), date) || changed;
    }
    if (changed) saveState();
    renderDailyQuests();
    if (isHomeActive()) schedulePlayback(520);
  }

  install();
})();