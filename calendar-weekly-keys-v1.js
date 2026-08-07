(() => {
  "use strict";

  if (window.__salitaQuestCalendarWeeklyKeysV1Installed) return;
  window.__salitaQuestCalendarWeeklyKeysV1Installed = true;
  window.__salitaQuestWeeklyAvatarPolishInstalled = true;
  document.documentElement.dataset.weeklyKeyMode = "calendar";

  const KEY_TARGET = 5;
  const DAY_LABELS = ["M","T","W","T","F","S","S"];
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

  function retry() { window.setTimeout(install, 80); }
  function localKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
  }
  function parseKey(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
    return match ? new Date(Number(match[1]), Number(match[2])-1, Number(match[3]), 12) : new Date();
  }
  function mondayKey(value = localKey()) {
    const date = parseKey(value);
    date.setDate(date.getDate() - ((date.getDay()+6)%7));
    return localKey(date);
  }
  function weekKeys(value = localKey()) {
    const monday = parseKey(mondayKey(value));
    return Array.from({length:7}, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate()+index);
      return localKey(date);
    });
  }
  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));
  }
  function chestState() {
    const chest = state.weeklyAvatarChest || (state.weeklyAvatarChest = {});
    chest.keyDates = Array.isArray(chest.keyDates) ? [...new Set(chest.keyDates.filter(Boolean))].sort() : [];
    chest.pendingKeyAwards = Array.isArray(chest.pendingKeyAwards) ? chest.pendingKeyAwards.filter(item => item?.date) : [];
    chest.animatedKeyDates = Array.isArray(chest.animatedKeyDates) ? [...new Set(chest.animatedKeyDates.filter(Boolean))] : [];
    chest.unlockedRewards = Array.isArray(chest.unlockedRewards) ? [...new Set(chest.unlockedRewards.filter(Boolean))] : [];
    chest.calendarWeekClaims = chest.calendarWeekClaims && typeof chest.calendarWeekClaims === "object" ? chest.calendarWeekClaims : {};
    return chest;
  }
  function currentActivityDate() {
    try { return ensureDailyActivity().date || localKey(); }
    catch { return localKey(); }
  }
  function currentWeekKey() { return mondayKey(currentActivityDate()); }
  function currentWeekDates() { return weekKeys(currentActivityDate()); }
  function earnedDatesThisWeek() {
    const allowed = new Set(currentWeekDates());
    return chestState().keyDates.filter(date => allowed.has(date));
  }
  function earnedCount() { return Math.min(7, earnedDatesThisWeek().length); }
  function allGoalsComplete() {
    try {
      const activity = ensureDailyActivity();
      return DAILY_QUESTS.length === 4 && DAILY_QUESTS.every(quest => activity.questsClaimed.includes(quest.id));
    } catch { return false; }
  }
  function ensureTodayKey() {
    if (!allGoalsComplete()) return false;
    const chest = chestState();
    const date = currentActivityDate();
    if (chest.keyDates.includes(date)) return false;
    chest.keyDates.push(date);
    chest.keyDates.sort();
    return true;
  }
  function queueTodayAnimation() {
    const chest = chestState();
    const date = currentActivityDate();
    if (!chest.keyDates.includes(date) || chest.animatedKeyDates.includes(date) || chest.pendingKeyAwards.some(item => item.date === date)) return false;
    chest.pendingKeyAwards.push({date,count:Math.min(KEY_TARGET, earnedCount()),queuedAt:new Date().toISOString(),source:"calendar-week"});
    return true;
  }
  function randomIndex(length) {
    if (length <= 1) return 0;
    if (window.crypto?.getRandomValues) {
      const values = new Uint32Array(1); window.crypto.getRandomValues(values); return values[0] % length;
    }
    return Math.floor(Math.random()*length);
  }
  function rewardById(id) { return REWARDS.find(item => item.id === id) || null; }
  function chooseReward() {
    const chest = chestState();
    const unopened = REWARDS.filter(item => !chest.unlockedRewards.includes(item.id));
    const pool = unopened.length ? unopened : REWARDS;
    return pool[randomIndex(pool.length)];
  }
  function currentClaim() { return chestState().calendarWeekClaims[currentWeekKey()] || null; }
  function latestClaim() {
    return Object.values(chestState().calendarWeekClaims).sort((a,b) => String(b?.claimedAt || "").localeCompare(String(a?.claimedAt || "")))[0] || null;
  }
  function claimReward() {
    if (earnedCount() < KEY_TARGET) return null;
    const chest = chestState();
    const week = currentWeekKey();
    if (chest.calendarWeekClaims[week]) return rewardById(chest.calendarWeekClaims[week].rewardId);
    const reward = chooseReward();
    chest.calendarWeekClaims[week] = {
      week,
      rewardId:reward.id,
      claimedAt:new Date().toISOString(),
      keyDates:earnedDatesThisWeek().slice()
    };
    if (!chest.unlockedRewards.includes(reward.id)) chest.unlockedRewards.push(reward.id);
    saveState();
    try { showRewardBurst("🎁", `${reward.title} unlocked!`, true); } catch {}
    renderCalendarChest();
    openRewardModal(reward);
    return reward;
  }
  function genericMeterHTML(count) {
    const filled = Math.min(KEY_TARGET, count);
    return `<div class="weekly-key-meter calendar-detail-meter" aria-label="${filled} of ${KEY_TARGET} required weekly keys collected">${Array.from({length:KEY_TARGET},(_,i)=>`<span class="weekly-key-slot ${i<filled?"collected":""}">${i<filled?"🔑":""}</span>`).join("")}</div>`;
  }
  function renderCalendarChest() {
    const host = document.getElementById("questChest");
    if (!host) return;
    const count = earnedCount();
    const ready = count >= KEY_TARGET;
    const claim = currentClaim();
    const latest = latestClaim();
    const latestReward = latest ? rewardById(latest.rewardId) : null;
    const earnedToday = chestState().keyDates.includes(currentActivityDate()) && allGoalsComplete();

    host.classList.toggle("locked", !earnedToday && !ready && !claim);
    host.classList.toggle("unlocked", earnedToday || ready || Boolean(claim));
    host.classList.toggle("weekly-ready", ready && !claim);
    host.classList.toggle("weekly-claimed", Boolean(claim));

    let title = `Weekly Daily Keys · ${count}/${KEY_TARGET}`;
    let text = `Earn a key on any ${KEY_TARGET} of the 7 days from Monday to Sunday.`;
    let action = `<span class="weekly-key-status">${earnedToday ? "✓" : "🔒"}</span>`;
    if (ready && !claim) {
      title = `Weekly reward ready · ${count}/7 days`;
      text = `${KEY_TARGET} Daily Keys collected this calendar week. Open your weekly reward.`;
      action = '<button class="weekly-chest-button" type="button" data-calendar-week-action="open">Open reward</button>';
    } else if (claim) {
      const reward = rewardById(claim.rewardId);
      title = `Weekly goal complete · ${count}/7 days`;
      text = `This week’s reward: ${reward?.title || "collected"}.`;
      action = '<button class="weekly-chest-button secondary" type="button" data-calendar-week-action="view">View reward</button>';
    } else if (latestReward) {
      text += ` Previous reward: ${latestReward.title}.`;
      action = '<button class="weekly-chest-button secondary" type="button" data-calendar-week-action="latest">View previous</button>';
    }

    host.innerHTML = `<div class="weekly-key-icon" aria-hidden="true">${ready && !claim ? "🎁" : "🔑"}</div><div class="weekly-key-copy"><strong id="questChestCalendarTitle">${escapeHTML(title)}</strong><small id="questChestCalendarText">${escapeHTML(text)}</small>${genericMeterHTML(count)}</div><div class="weekly-key-action">${action}</div>`;
  }
  function renderHomeStrip() {
    const host = document.getElementById("weekMomentum");
    if (!host) return;
    const earned = new Set(earnedDatesThisWeek());
    const today = currentActivityDate();
    host.setAttribute("aria-label", `${earned.size} Daily Keys earned this calendar week; weekly goal ${KEY_TARGET} of 7 days`);
    host.innerHTML = currentWeekDates().map((key,index) => `<div class="week-day calendar-key-day ${earned.has(key)?"studied":""} ${key===today?"today":""}" title="${key}"><span>${earned.has(key)?"🔑":DAY_LABELS[index]}</span><small>${DAY_LABELS[index]}</small></div>`).join("");
  }
  function compactHomeCards() {
    const home = document.getElementById("homeView");
    const dashboard = home?.querySelector(".game-dashboard");
    const weekCard = dashboard?.querySelector(".week-card");
    const playerCard = dashboard?.querySelector(".player-card");
    if (!home || !weekCard || !playerCard) return;
    let stack = document.getElementById("homeProgressStack");
    if (!stack) {
      stack = document.createElement("section");
      stack.id = "homeProgressStack";
      stack.className = "home-progress-stack";
      stack.setAttribute("aria-label", "Weekly keys and learning level");
      home.prepend(stack);
    }
    if (weekCard.parentElement !== stack) stack.appendChild(weekCard);
    if (playerCard.parentElement !== stack) stack.appendChild(playerCard);
    dashboard.remove();
  }
  function ensureStyles() {
    if (document.getElementById("calendarWeeklyKeysStyles")) return;
    const style = document.createElement("style");
    style.id = "calendarWeeklyKeysStyles";
    style.textContent = `
      .home-progress-stack{display:grid;gap:10px;margin:0 0 14px}.home-progress-stack .week-card,.home-progress-stack .player-card{margin:0!important}
      .home-progress-stack .week-card{padding:10px 12px!important;min-height:0!important}.home-progress-stack .week-card-head{display:none!important}
      .home-progress-stack .week-momentum{display:grid!important;grid-template-columns:repeat(7,minmax(0,1fr))!important;gap:6px!important;margin:0!important}
      .home-progress-stack .week-day{min-width:0!important;min-height:46px!important;padding:5px 2px!important;border-radius:12px!important;display:grid!important;place-items:center!important;gap:1px!important}
      .home-progress-stack .week-day span{font-size:1rem!important;line-height:1!important}.home-progress-stack .week-day small{font-size:.62rem!important;line-height:1!important}
      .home-progress-stack .player-card{padding:10px 14px!important;min-height:0!important;align-items:center!important}.home-progress-stack .player-copy>.eyebrow,.home-progress-stack #playerLevelSubtitle{display:none!important}
      .home-progress-stack .player-copy{gap:4px!important}.home-progress-stack .player-copy h3{margin:0!important}.home-progress-stack .player-avatar-wrap{transform:scale(.88);transform-origin:center}
      .home-progress-stack .player-xp-row{margin-top:2px!important}.home-progress-stack .player-xp-track{margin-top:2px!important}
      .calendar-detail-meter{margin-top:8px}.calendar-detail-meter .weekly-key-slot{min-width:28px}
      @media(max-width:620px){.home-progress-stack{gap:8px;margin-bottom:10px}.home-progress-stack .week-card{padding:8px!important}.home-progress-stack .week-momentum{gap:4px!important}.home-progress-stack .week-day{min-height:42px!important;border-radius:10px!important}.home-progress-stack .player-card{padding:8px 10px!important}.home-progress-stack .player-xp-row{font-size:.72rem!important}}
    `;
    document.head.appendChild(style);
  }
  function ensureModal() {
    let modal = document.getElementById("calendarWeeklyRewardModal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "calendarWeeklyRewardModal";
    modal.className = "weekly-avatar-modal hidden";
    modal.setAttribute("role","dialog");
    modal.setAttribute("aria-modal","true");
    modal.innerHTML = `<div class="weekly-avatar-card-shell"><button class="weekly-avatar-close" type="button" data-calendar-week-close aria-label="Close">×</button><p class="eyebrow">Weekly Daily Key reward</p><div class="weekly-avatar-preview" id="calendarWeeklyRewardPreview"><span class="weekly-avatar-spark">★</span><img id="calendarWeeklyRewardImage" alt=""></div><h2 id="calendarWeeklyRewardTitle"></h2><p>Collected by earning Daily Keys on five days in the Monday–Sunday week.</p><div class="weekly-avatar-actions"><button class="secondary-btn" type="button" data-calendar-week-close>Close</button></div></div>`;
    document.body.appendChild(modal);
    modal.addEventListener("click", event => { if (event.target===modal || event.target.closest("[data-calendar-week-close]")) closeRewardModal(); });
    return modal;
  }
  function openRewardModal(reward) {
    if (!reward) return;
    const modal = ensureModal();
    const preview = modal.querySelector("#calendarWeeklyRewardPreview");
    preview.style.setProperty("--reward-a",reward.colors[0]); preview.style.setProperty("--reward-b",reward.colors[1]);
    const image = modal.querySelector("#calendarWeeklyRewardImage"); image.src=reward.src; image.alt=reward.avatarName;
    modal.querySelector("#calendarWeeklyRewardTitle").textContent=reward.title;
    modal.classList.remove("hidden"); document.body.classList.add("modal-open");
  }
  function closeRewardModal() { document.getElementById("calendarWeeklyRewardModal")?.classList.add("hidden"); document.body.classList.remove("modal-open"); }

  function install() {
    try {
      if (typeof state === "undefined" || typeof DAILY_QUESTS === "undefined" || typeof ensureDailyActivity !== "function" || typeof claimDailyQuestRewards !== "function" || typeof renderDailyQuests !== "function" || typeof updateHome !== "function" || typeof saveState !== "function") { retry(); return; }
    } catch { retry(); return; }

    ensureStyles();
    const baseClaim = claimDailyQuestRewards;
    claimDailyQuestRewards = function claimDailyQuestRewardsWithCalendarKeys(celebrate=false) {
      const before = chestState().keyDates.includes(currentActivityDate());
      const result = baseClaim(false);
      const inserted = ensureTodayKey();
      const after = chestState().keyDates.includes(currentActivityDate());
      if ((!before && after) || inserted) queueTodayAnimation();
      if (inserted || (!before && after)) saveState();
      renderCalendarChest(); renderHomeStrip();
      return result;
    };

    const baseRenderDailyQuests = renderDailyQuests;
    renderDailyQuests = function renderDailyQuestsWithCalendarWeek() {
      const result = baseRenderDailyQuests.apply(this, arguments);
      renderCalendarChest();
      return result;
    };

    const baseUpdateHome = updateHome;
    updateHome = function updateHomeWithCompactCalendarKeys() {
      const result = baseUpdateHome.apply(this, arguments);
      compactHomeCards(); renderHomeStrip();
      return result;
    };

    document.addEventListener("click", event => {
      const button = event.target.closest("[data-calendar-week-action]");
      if (!button) return;
      const action = button.dataset.calendarWeekAction;
      if (action === "open") claimReward();
      else if (action === "view") openRewardModal(rewardById(currentClaim()?.rewardId));
      else if (action === "latest") openRewardModal(rewardById(latestClaim()?.rewardId));
    });

    ensureTodayKey(); queueTodayAnimation();
    compactHomeCards(); renderHomeStrip(); renderCalendarChest();
    saveState();
  }

  install();
})();