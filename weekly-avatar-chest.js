(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestWeeklyAvatarChestInstalled";
  const KEY_TARGET = 6;
  const MAX_KEY_HISTORY = 180;

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
    id: `${avatar.id}-${variant.id}`,
    avatarId: avatar.id,
    avatarName: avatar.name,
    src: avatar.src,
    variantId: variant.id,
    variantLabel: variant.label,
    colors: variant.colors,
    title: `${variant.label} ${avatar.name}`
  })));

  function retryInstall() {
    window.setTimeout(installWeeklyChest, 70);
  }

  function installWeeklyChest() {
    try {
      if (
        typeof state === "undefined" ||
        typeof DAILY_QUESTS === "undefined" ||
        typeof ensureDailyActivity !== "function" ||
        typeof renderDailyQuests !== "function" ||
        typeof claimDailyQuestRewards !== "function" ||
        typeof saveState !== "function" ||
        typeof showRewardBurst !== "function" ||
        !DAILY_QUESTS.some(quest => quest.id === "quick_twice")
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

    function escapeHTML(value) {
      return String(value ?? "").replace(/[&<>'"]/g, character => ({
        "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;"
      }[character]));
    }

    function parseDateKey(key) {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ""));
      if (!match) return new Date();
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0, 0);
    }

    function dateKey(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    function weekKeyForDate(dateValue) {
      const date = dateValue instanceof Date ? new Date(dateValue) : parseDateKey(dateValue);
      const mondayOffset = (date.getDay() + 6) % 7;
      date.setDate(date.getDate() - mondayOffset);
      return dateKey(date);
    }

    function currentDateKey() {
      const activity = ensureDailyActivity();
      return activity.date || (typeof todayKey === "function" ? todayKey() : dateKey(new Date()));
    }

    function currentWeekKey() {
      return weekKeyForDate(currentDateKey());
    }

    function ensureWeeklyState() {
      if (!state.weeklyAvatarChest || typeof state.weeklyAvatarChest !== "object") {
        state.weeklyAvatarChest = {};
      }
      const weekly = state.weeklyAvatarChest;
      weekly.keyDates = Array.isArray(weekly.keyDates) ? [...new Set(weekly.keyDates.filter(Boolean))] : [];
      weekly.claims = weekly.claims && typeof weekly.claims === "object" ? weekly.claims : {};
      weekly.unlockedRewards = Array.isArray(weekly.unlockedRewards) ? [...new Set(weekly.unlockedRewards)] : [];
      return weekly;
    }

    function keysForWeek(weekKey = currentWeekKey()) {
      const weekly = ensureWeeklyState();
      return weekly.keyDates.filter(key => weekKeyForDate(key) === weekKey).sort();
    }

    function grantDailyKey(key = currentDateKey()) {
      const weekly = ensureWeeklyState();
      if (weekly.keyDates.includes(key)) return false;
      weekly.keyDates.push(key);
      weekly.keyDates.sort();
      if (weekly.keyDates.length > MAX_KEY_HISTORY) {
        weekly.keyDates = weekly.keyDates.slice(-MAX_KEY_HISTORY);
      }
      return true;
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

    function rewardById(id) {
      return REWARDS.find(reward => reward.id === id) || REWARDS[0];
    }

    function chooseWeeklyReward() {
      const weekly = ensureWeeklyState();
      const unopened = REWARDS.filter(reward => !weekly.unlockedRewards.includes(reward.id));
      const pool = unopened.length ? unopened : REWARDS;
      return pool[randomIndex(pool.length)];
    }

    function currentClaim() {
      return ensureWeeklyState().claims[currentWeekKey()] || null;
    }

    function formatWeekLabel(weekKey) {
      const start = parseDateKey(weekKey);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.toLocaleDateString(undefined, {month:"short", day:"numeric"})}–${end.toLocaleDateString(undefined, {month:"short", day:"numeric"})}`;
    }

    /* Replace the former generic daily chest message with one meaningful Daily Key. */
    claimDailyQuestRewards = function claimDailyQuestRewardsWithWeeklyKey(celebrate = false) {
      const activity = ensureDailyActivity();
      let changed = false;
      let keyGranted = false;

      DAILY_QUESTS.forEach(quest => {
        if (questProgress(quest) >= quest.target && !activity.questsClaimed.includes(quest.id)) {
          activity.questsClaimed.push(quest.id);
          state.coins += quest.reward;
          changed = true;
          if (celebrate) showRewardBurst(quest.icon, `${quest.title} · +${quest.reward} coins`);
        }
      });

      const allComplete = DAILY_QUESTS.every(quest => activity.questsClaimed.includes(quest.id));
      if (allComplete && !activity.chestClaimed) {
        activity.chestClaimed = true;
        state.coins += 20;
        state.xp += 25;
        changed = true;
      }

      /* Also grants today's key when upgrading an already-completed day to this release. */
      if (activity.chestClaimed) {
        keyGranted = grantDailyKey(activity.date || currentDateKey());
        changed = changed || keyGranted;
      }

      if (changed) saveState();

      if (keyGranted && celebrate) {
        const count = Math.min(KEY_TARGET, keysForWeek().length);
        window.setTimeout(() => {
          showRewardBurst("🔑", `Daily Key earned · ${count}/${KEY_TARGET} this week`, true);
        }, 520);
      }
    };

    function keyMeterHTML(count) {
      return `<div class="weekly-key-meter" aria-label="${count} of ${KEY_TARGET} weekly keys collected">${Array.from({length:KEY_TARGET}, (_, index) => `<span class="weekly-key-slot ${index < count ? "collected" : ""}">${index < count ? "🔑" : ""}</span>`).join("")}</div>`;
    }

    function renderWeeklyChest() {
      const chest = document.getElementById("questChest");
      if (!chest) return;

      const activity = ensureDailyActivity();
      const weekKey = currentWeekKey();
      const keyCount = Math.min(KEY_TARGET, keysForWeek(weekKey).length);
      const claim = currentClaim();
      const ready = keyCount >= KEY_TARGET && !claim;
      const dailyKeyEarned = Boolean(activity.chestClaimed);
      const reward = claim ? rewardById(claim.rewardId) : null;

      chest.classList.toggle("locked", !dailyKeyEarned && !ready && !claim);
      chest.classList.toggle("unlocked", dailyKeyEarned || ready || Boolean(claim));
      chest.classList.toggle("weekly-ready", ready);
      chest.classList.toggle("weekly-claimed", Boolean(claim));

      let title = dailyKeyEarned ? `Daily Key collected · ${keyCount}/${KEY_TARGET}` : `Earn today’s Daily Key · ${keyCount}/${KEY_TARGET}`;
      let text = dailyKeyEarned ? "Return on another day and complete all four quests to collect the next key." : "Complete all four Daily Quests to add one key to this week.";
      let action = `<span class="weekly-key-status">${dailyKeyEarned ? "✓" : "🔒"}</span>`;

      if (ready) {
        title = "Weekly chest ready!";
        text = "Six Daily Keys collected. Open the chest to reveal a random collectible avatar.";
        action = '<button class="weekly-chest-button" type="button" data-weekly-chest-action="open">Open chest</button>';
      } else if (claim && reward) {
        title = `${reward.title} unlocked`;
        text = `Weekly collectible for ${formatWeekLabel(weekKey)}. Share it or view it again.`;
        action = '<button class="weekly-chest-button secondary" type="button" data-weekly-chest-action="view">View avatar</button>';
      }

      chest.innerHTML = `
        <div class="weekly-key-icon" aria-hidden="true">${claim ? "🎁" : "🔑"}</div>
        <div class="weekly-key-copy">
          <strong id="questChestTitle">${escapeHTML(title)}</strong>
          <small id="questChestText">${escapeHTML(text)}</small>
          ${keyMeterHTML(keyCount)}
        </div>
        <div id="questChestStatus" class="weekly-key-action">${action}</div>`;
    }

    const baseRenderDailyQuests = renderDailyQuests;
    renderDailyQuests = function renderDailyQuestsWithWeeklyChest() {
      baseRenderDailyQuests();
      renderWeeklyChest();
    };

    function claimWeeklyChest() {
      const weekKey = currentWeekKey();
      const weekly = ensureWeeklyState();
      if (keysForWeek(weekKey).length < KEY_TARGET) return null;
      if (weekly.claims[weekKey]) return rewardById(weekly.claims[weekKey].rewardId);

      const reward = chooseWeeklyReward();
      weekly.claims[weekKey] = {
        rewardId: reward.id,
        claimedAt: new Date().toISOString(),
        keyDates: keysForWeek(weekKey).slice(0, KEY_TARGET)
      };
      if (!weekly.unlockedRewards.includes(reward.id)) weekly.unlockedRewards.push(reward.id);
      saveState();
      showRewardBurst("🎁", `${reward.title} unlocked!`, true);
      renderDailyQuests();
      return reward;
    }

    function ensureModal() {
      let modal = document.getElementById("weeklyAvatarModal");
      if (modal) return modal;
      modal = document.createElement("div");
      modal.id = "weeklyAvatarModal";
      modal.className = "weekly-avatar-modal hidden";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-labelledby", "weeklyAvatarTitle");
      modal.innerHTML = `
        <div class="weekly-avatar-card-shell">
          <button class="weekly-avatar-close" type="button" data-weekly-modal-close aria-label="Close">×</button>
          <p class="eyebrow">Weekly avatar unlocked</p>
          <div class="weekly-avatar-preview" id="weeklyAvatarPreview">
            <span class="weekly-avatar-spark">★</span>
            <img id="weeklyAvatarImage" alt="">
          </div>
          <h2 id="weeklyAvatarTitle"></h2>
          <p id="weeklyAvatarWeek"></p>
          <div class="weekly-avatar-actions">
            <button class="primary-btn" id="shareWeeklyAvatarBtn" type="button">Share social card</button>
            <button class="secondary-btn" type="button" data-weekly-modal-close>Close</button>
          </div>
          <small class="weekly-avatar-privacy">Nothing is posted automatically. Share opens your device’s normal share options.</small>
        </div>`;
      document.body.appendChild(modal);
      modal.addEventListener("click", event => {
        if (event.target === modal || event.target.closest("[data-weekly-modal-close]")) closeModal();
      });
      document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !modal.classList.contains("hidden")) closeModal();
      });
      return modal;
    }

    let activeReward = null;

    function openRewardModal(reward) {
      if (!reward) return;
      activeReward = reward;
      const modal = ensureModal();
      const preview = document.getElementById("weeklyAvatarPreview");
      preview.style.setProperty("--reward-a", reward.colors[0]);
      preview.style.setProperty("--reward-b", reward.colors[1]);
      const image = document.getElementById("weeklyAvatarImage");
      image.src = reward.src;
      image.alt = reward.avatarName;
      document.getElementById("weeklyAvatarTitle").textContent = reward.title;
      document.getElementById("weeklyAvatarWeek").textContent = `Collected with six Daily Keys · ${formatWeekLabel(currentWeekKey())}`;
      document.getElementById("shareWeeklyAvatarBtn").onclick = () => shareReward(reward);
      modal.classList.remove("hidden");
      document.body.classList.add("modal-open");
      window.setTimeout(() => modal.querySelector(".weekly-avatar-close")?.focus(), 30);
    }

    function closeModal() {
      const modal = document.getElementById("weeklyAvatarModal");
      if (!modal) return;
      modal.classList.add("hidden");
      document.body.classList.remove("modal-open");
    }

    function roundedRect(context, x, y, width, height, radius) {
      const r = Math.min(radius, width / 2, height / 2);
      context.beginPath();
      context.moveTo(x + r, y);
      context.arcTo(x + width, y, x + width, y + height, r);
      context.arcTo(x + width, y + height, x, y + height, r);
      context.arcTo(x, y + height, x, y, r);
      context.arcTo(x, y, x + width, y, r);
      context.closePath();
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

      context.fillStyle = "rgba(255,255,255,.12)";
      for (const [x, y, radius] of [[110,120,130],[980,160,190],[890,960,250],[120,920,180]]) {
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      }

      context.fillStyle = "rgba(15,27,52,.82)";
      roundedRect(context, 80, 70, 920, 940, 68);
      context.fill();

      context.fillStyle = "#f7c948";
      roundedRect(context, 390, 118, 300, 58, 29);
      context.fill();
      context.fillStyle = "#14213d";
      context.font = "800 27px system-ui, sans-serif";
      context.textAlign = "center";
      context.fillText("SALITA QUEST", 540, 157);

      context.fillStyle = "rgba(255,255,255,.13)";
      context.beginPath();
      context.arc(540, 470, 255, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "rgba(255,255,255,.96)";
      context.beginPath();
      context.arc(540, 470, 210, 0, Math.PI * 2);
      context.fill();

      const image = await loadImage(reward.src);
      const size = 330;
      context.save();
      context.beginPath();
      context.arc(540, 470, 170, 0, Math.PI * 2);
      context.clip();
      context.drawImage(image, 540 - size / 2, 470 - size / 2, size, size);
      context.restore();

      context.fillStyle = "#f7c948";
      context.font = "900 36px system-ui, sans-serif";
      context.fillText("WEEKLY AVATAR UNLOCKED", 540, 745);
      context.fillStyle = "#ffffff";
      context.font = "900 56px system-ui, sans-serif";
      const title = reward.title.length > 28 ? reward.avatarName : reward.title;
      context.fillText(title, 540, 820);
      if (title !== reward.title) {
        context.font = "700 31px system-ui, sans-serif";
        context.fillStyle = "rgba(255,255,255,.78)";
        context.fillText(`${reward.variantLabel} Edition`, 540, 866);
      }

      context.font = "700 29px system-ui, sans-serif";
      context.fillStyle = "rgba(255,255,255,.82)";
      context.fillText("Collected with 6 Daily Keys", 540, 930);
      context.font = "600 23px system-ui, sans-serif";
      context.fillText(document.body.dataset.course === "cebuano" ? "My Bisaya learning streak" : "My Tagalog learning streak", 540, 968);

      return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Could not create card")), "image/png"));
    }

    async function shareReward(reward) {
      const button = document.getElementById("shareWeeklyAvatarBtn");
      const original = button?.textContent;
      if (button) {
        button.disabled = true;
        button.textContent = "Preparing card…";
      }
      try {
        const blob = await buildSocialCard(reward);
        const file = new File([blob], `salita-quest-${reward.id}.png`, {type:"image/png"});
        const course = document.body.dataset.course === "cebuano" ? "Bisaya" : "Tagalog";
        const caption = `I collected 6 Daily Keys in Salita Quest and unlocked the ${reward.title} avatar while learning ${course}!`;

        if (navigator.share && navigator.canShare?.({files:[file]})) {
          await navigator.share({title:"My Salita Quest weekly avatar", text:caption, files:[file]});
          showRewardBurst("📤", "Share card ready", false);
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
        if (button) {
          button.disabled = false;
          button.textContent = original || "Share social card";
        }
      }
    }

    const chest = document.getElementById("questChest");
    chest?.addEventListener("click", event => {
      const control = event.target.closest("[data-weekly-chest-action]");
      if (!control) return;
      if (control.dataset.weeklyChestAction === "open") {
        openRewardModal(claimWeeklyChest());
      } else {
        const claim = currentClaim();
        if (claim) openRewardModal(rewardById(claim.rewardId));
      }
    });

    ensureWeeklyState();
    claimDailyQuestRewards(false);
    renderDailyQuests();
  }

  installWeeklyChest();
})();
