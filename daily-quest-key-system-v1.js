(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaDailyQuestKeySystemV1Installed";
  if (window[INSTALL_FLAG]) return;

  const QUEST_TOTAL = 4;
  const KEY_TARGET = 5;
  const WEEK_DAYS = 7;
  const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
  const MAX_KEY_HISTORY = 240;
  const AVATARS = [
    {id:"tarsier",name:"Philippine Tarsier",src:"avatars/tarsier.png"},
    {id:"eagle",name:"Philippine Eagle",src:"avatars/eagle.png"},
    {id:"tamaraw",name:"Tamaraw",src:"avatars/tamaraw.png"},
    {id:"peacock",name:"Palawan Peacock-Pheasant",src:"avatars/peacock.png"},
    {id:"orchid",name:"Waling-Waling Orchid",src:"avatars/orchid.png"},
    {id:"jade",name:"Jade Vine",src:"avatars/jade.png"},
    {id:"rafflesia",name:"Philippine Rafflesia",src:"avatars/rafflesia.png"},
    {id:"anahaw",name:"Anahaw",src:"avatars/anahaw.png"}
  ];
  const VARIANTS = [
    {id:"sunrise",label:"Sunrise",colors:["#f7c948","#ef765e"]},
    {id:"islands",label:"Island",colors:["#19a38f","#4d89e8"]},
    {id:"midnight",label:"Midnight",colors:["#22345f","#7d6bd6"]}
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

  let playingKey = false;
  let keyTimer = 0;
  let releaseTimer = 0;
  let reservation = null;
  let rendering = false;

  function retry() { window.setTimeout(install, 90); }
  function esc(value) {
    return String(value ?? "").replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));
  }
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
  function weekDates(value = localKey()) {
    const monday = parseKey(mondayKey(value));
    return Array.from({length:WEEK_DAYS}, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate()+index);
      return localKey(date);
    });
  }
  function currentDate() {
    try { return ensureDailyActivity().date || localKey(); }
    catch { return localKey(); }
  }
  function currentWeek() { return mondayKey(currentDate()); }

  function keyState() {
    const chest = state.weeklyAvatarChest || (state.weeklyAvatarChest = {});
    chest.keyDates = Array.isArray(chest.keyDates) ? [...new Set(chest.keyDates.filter(Boolean))].sort() : [];
    chest.pendingKeyAwards = Array.isArray(chest.pendingKeyAwards) ? chest.pendingKeyAwards.filter(item => item?.date) : [];
    chest.animatedKeyDates = Array.isArray(chest.animatedKeyDates) ? [...new Set(chest.animatedKeyDates.filter(Boolean))] : [];
    chest.unlockedRewards = Array.isArray(chest.unlockedRewards) ? [...new Set(chest.unlockedRewards.filter(Boolean))] : [];
    chest.calendarWeekClaims = chest.calendarWeekClaims && typeof chest.calendarWeekClaims === "object" ? chest.calendarWeekClaims : {};
    if (chest.keyDates.length > MAX_KEY_HISTORY) chest.keyDates = chest.keyDates.slice(-MAX_KEY_HISTORY);
    return chest;
  }
  function earnedDatesThisWeek() {
    const allowed = new Set(weekDates(currentDate()));
    return keyState().keyDates.filter(date => allowed.has(date));
  }
  function earnedCount() { return earnedDatesThisWeek().length; }
  function currentClaim() { return keyState().calendarWeekClaims[currentWeek()] || null; }
  function latestClaim() {
    return Object.values(keyState().calendarWeekClaims)
      .sort((a,b) => String(b?.claimedAt || "").localeCompare(String(a?.claimedAt || "")))[0] || null;
  }
  function rewardById(id) { return REWARDS.find(reward => reward.id === id) || null; }
  function randomIndex(length) {
    if (length <= 1) return 0;
    if (window.crypto?.getRandomValues) {
      const values = new Uint32Array(1);
      window.crypto.getRandomValues(values);
      return values[0] % length;
    }
    return Math.floor(Math.random() * length);
  }
  function chooseReward() {
    const chest = keyState();
    const unopened = REWARDS.filter(reward => !chest.unlockedRewards.includes(reward.id));
    const pool = unopened.length ? unopened : REWARDS;
    return pool[randomIndex(pool.length)];
  }

  function configureQuests() {
    const activity = ensureDailyActivity();
    activity.dailySessions = Number(activity.dailySessions || 0);
    activity.quickReviewItems = Number(activity.quickReviewItems || 0);
    activity.quickReviews = Number(activity.quickReviews || 0);
    activity.questsClaimed = Array.isArray(activity.questsClaimed) ? activity.questsClaimed : [];

    const sessionQuest = DAILY_QUESTS.find(quest => quest.id === "session");
    if (sessionQuest) Object.assign(sessionQuest, {
      title:"Finish one Daily Session",
      detail:"Complete the full recommended Daily Session.",
      target:1,
      metric:value => Number(value.dailySessions || 0)
    });
    const correctQuest = DAILY_QUESTS.find(quest => quest.id === "correct");
    if (correctQuest) Object.assign(correctQuest, {
      title:"Get 15 answers right",
      detail:"Build 15 correct answers across today’s practice.",
      target:15,
      metric:value => Number(value.correct || 0)
    });
    const reviewQuest = DAILY_QUESTS.find(quest => quest.id === "review");
    if (reviewQuest) Object.assign(reviewQuest, {
      title:"Strengthen 3 learned items",
      detail:"Answer three review questions from language you have already learned.",
      target:3,
      metric:value => Number(value.reviews || 0)
    });
    let quickQuest = DAILY_QUESTS.find(quest => quest.id === "quick_twice");
    if (!quickQuest) {
      quickQuest = {id:"quick_twice",icon:"⚡",reward:100};
      DAILY_QUESTS.push(quickQuest);
    }
    Object.assign(quickQuest, {
      icon:"⚡",
      title:"Complete 15 Quick Review items",
      detail:"Answer 15 Quick Review questions in one long review or several shorter reviews.",
      target:15,
      metric:value => Number(value.quickReviewItems || 0)
    });
    if (DAILY_QUESTS.length > QUEST_TOTAL) DAILY_QUESTS.splice(QUEST_TOTAL);
  }

  function questValue(quest) {
    try { return Math.max(0, Number(questProgress(quest) || 0)); }
    catch { return Math.max(0, Number(quest.metric?.(ensureDailyActivity()) || 0)); }
  }
  function allComplete() {
    const activity = ensureDailyActivity();
    return DAILY_QUESTS.length === QUEST_TOTAL && DAILY_QUESTS.every(quest =>
      activity.questsClaimed.includes(quest.id) || questValue(quest) >= quest.target
    );
  }
  function projectedCompleteAfterClaim() {
    return DAILY_QUESTS.length === QUEST_TOTAL && DAILY_QUESTS.every(quest => {
      const activity = ensureDailyActivity();
      return activity.questsClaimed.includes(quest.id) || questValue(quest) >= quest.target;
    });
  }

  function reserveRewardLayer() {
    window.clearTimeout(releaseTimer);
    if (!reservation?.isConnected) {
      reservation = document.createElement("div");
      reservation.className = "daily-key-celebration daily-key-reward-reservation";
      reservation.hidden = true;
      reservation.setAttribute("aria-hidden", "true");
      document.body.appendChild(reservation);
    }
    document.documentElement.dataset.dailyKeyRewardPriority = "reserved";
    try { window.SalitaPopupGovernor?.suspend?.(7000, "daily_key_priority"); } catch {}
  }
  function releaseRewardLayerSoon() {
    window.clearTimeout(releaseTimer);
    releaseTimer = window.setTimeout(() => {
      if (playingKey || keyState().pendingKeyAwards.length) {
        reserveRewardLayer();
        return;
      }
      reservation?.remove();
      reservation = null;
      delete document.documentElement.dataset.dailyKeyRewardPriority;
      try {
        window.SalitaPopupGovernor?.resume?.("daily_key_finished");
        window.SalitaPopupGovernor?.notify?.();
      } catch {}
      document.dispatchEvent(new CustomEvent("salita:daily-key-reward-finished"));
    }, 650);
  }

  function queueKey(date = currentDate()) {
    const chest = keyState();
    if (chest.animatedKeyDates.includes(date) || chest.pendingKeyAwards.some(item => item.date === date)) return false;
    chest.pendingKeyAwards.push({date,count:earnedCount(),queuedAt:new Date().toISOString(),source:"daily-quest-key-system"});
    reserveRewardLayer();
    return true;
  }
  function grantTodayKey() {
    if (!allComplete()) return false;
    const chest = keyState();
    const date = currentDate();
    if (chest.keyDates.includes(date)) return false;
    chest.keyDates.push(date);
    chest.keyDates.sort();
    queueKey(date);
    return true;
  }

  function quickReviewLength() {
    const activity = document.getElementById("activityQuickLength");
    const home = document.getElementById("homeQuickReviewLength");
    const value = Number(activity?.value || home?.value || state?.settings?.quickReviewLength || 4);
    return Number.isFinite(value) && value > 0 ? value : 4;
  }
  function launchQuest(questId) {
    if (questId === "session") {
      startSession("daily");
      return;
    }
    if (["correct","review","quick_twice"].includes(questId)) startSession("quick", false, {length:quickReviewLength()});
  }

  function ensureSummaryRow(card) {
    let summary = card.querySelector(".sq-quest-summary-row");
    if (summary) return summary;
    summary = document.createElement("div");
    summary.className = "sq-quest-summary-row";
    summary.innerHTML = '<strong>Daily Quests</strong><span>Completed</span><button type="button" aria-label="Open Daily Quests" aria-expanded="false">⌄</button>';
    summary.querySelector("button").addEventListener("click", () => {
      card.classList.remove("sq-quests-collapsed");
      card.dataset.questManualState = "expanded";
      card.dataset.questManualDay = currentDate();
      syncCollapse(card);
    });
    card.prepend(summary);
    return summary;
  }
  function ensureHeaderToggle(card) {
    const header = card.querySelector(".quest-card-header");
    if (!header) return null;
    let button = header.querySelector(".daily-quest-collapse-toggle");
    if (!button) {
      button = document.createElement("button");
      button.type = "button";
      button.className = "daily-quest-collapse-toggle";
      button.addEventListener("click", () => {
        const collapse = !card.classList.contains("sq-quests-collapsed");
        card.dataset.questManualState = collapse ? "collapsed" : "expanded";
        card.dataset.questManualDay = currentDate();
        card.classList.toggle("sq-quests-collapsed", collapse);
        syncCollapse(card);
      });
      header.appendChild(button);
    }
    return button;
  }
  function syncCollapse(card) {
    const collapsed = card.classList.contains("sq-quests-collapsed");
    const button = card.querySelector(".daily-quest-collapse-toggle");
    if (button) {
      button.textContent = collapsed ? "⌄" : "⌃";
      button.setAttribute("aria-expanded", collapsed ? "false" : "true");
      button.setAttribute("aria-label", collapsed ? "Open Daily Quests" : "Collapse Daily Quests");
    }
  }
  function applyCollapseState(card) {
    ensureSummaryRow(card);
    ensureHeaderToggle(card);
    const today = currentDate();
    const complete = allComplete();

    if (card.dataset.questManualDay !== today) {
      delete card.dataset.questManualState;
      delete card.dataset.questCompletionCollapsedDay;
      card.dataset.questManualDay = today;
    }

    if (complete && card.dataset.questCompletionCollapsedDay !== today) {
      card.classList.add("sq-quests-collapsed");
      card.dataset.questCompletionCollapsedDay = today;
      card.dataset.questManualState = "collapsed";
    } else if (!complete) {
      delete card.dataset.questCompletionCollapsedDay;
      if (card.dataset.questManualState !== "collapsed") card.classList.remove("sq-quests-collapsed");
    } else if (card.dataset.questManualState === "expanded") {
      card.classList.remove("sq-quests-collapsed");
    } else {
      card.classList.add("sq-quests-collapsed");
    }
    syncCollapse(card);
  }

  function patchQuestCard() {
    const card = document.querySelector(".daily-quests-card");
    const list = document.getElementById("dailyQuestList");
    if (!card || !list) return;
    const activity = ensureDailyActivity();
    const claimed = DAILY_QUESTS.filter(quest => activity.questsClaimed.includes(quest.id) || questValue(quest) >= quest.target).length;
    const score = document.getElementById("dailyQuestScore");
    if (score) score.textContent = `${Math.min(QUEST_TOTAL, claimed)}/${QUEST_TOTAL}`;
    const heading = card.querySelector(".quest-card-header h3");
    if (heading) heading.textContent = allComplete() ? "Daily quests completed" : "4 small wins";
    const description = card.querySelector(".quest-card-header p:not(.eyebrow)");
    if (description) description.textContent = "Short, meaningful goals keep practice focused without turning XP into the objective.";

    [...list.querySelectorAll(".daily-quest")].forEach((row, index) => {
      const quest = DAILY_QUESTS[index];
      if (!quest) return;
      row.dataset.questNavigationId = quest.id;
      row.setAttribute("role", "button");
      row.setAttribute("tabindex", "0");
      row.classList.add("daily-quest-navigable");
      const destination = quest.id === "session" ? "Daily Session" : "Quick Review";
      row.setAttribute("aria-label", `${quest.title}. Open ${destination}.`);
      if (!row.querySelector(".daily-quest-arrow")) {
        const arrow = document.createElement("span");
        arrow.className = "daily-quest-arrow";
        arrow.setAttribute("aria-hidden", "true");
        arrow.textContent = "›";
        row.appendChild(arrow);
      }
    });
    applyCollapseState(card);
  }

  function detailedWeekMeter() {
    const earned = new Set(earnedDatesThisWeek());
    return `<div class="weekly-key-meter calendar-detail-meter" aria-label="${earned.size} of 7 calendar days have Daily Keys; weekly goal is ${KEY_TARGET}">${weekDates(currentDate()).map((date,index) => `<span class="weekly-key-slot ${earned.has(date)?"collected":""}" title="${date}"><b>${earned.has(date)?"🔑":""}</b><small>${DAY_LABELS[index]}</small></span>`).join("")}</div>`;
  }
  function renderChest() {
    const host = document.getElementById("questChest");
    if (!host) return;
    const count = earnedCount();
    const ready = count >= KEY_TARGET;
    const claim = currentClaim();
    const latest = latestClaim();
    const latestReward = latest ? rewardById(latest.rewardId) : null;
    const earnedToday = keyState().keyDates.includes(currentDate());

    host.classList.toggle("locked", !earnedToday && !ready && !claim);
    host.classList.toggle("unlocked", earnedToday || ready || Boolean(claim));
    host.classList.toggle("weekly-ready", ready && !claim);
    host.classList.toggle("weekly-claimed", Boolean(claim));

    let title = `Weekly Daily Keys · ${count}/7 days`;
    let text = `Weekly goal: earn a Daily Key on any ${KEY_TARGET} of the 7 days from Monday to Sunday.`;
    let action = `<span class="weekly-key-status">${earnedToday ? "✓" : "🔒"}</span>`;
    if (ready && !claim) {
      title = `Weekly reward ready · ${count}/7 days`;
      text = `${KEY_TARGET}-day goal reached. Open your weekly reward.`;
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
    host.innerHTML = `<div class="weekly-key-icon" aria-hidden="true">${ready&&!claim ? "🎁" : "🔑"}</div><div class="weekly-key-copy"><strong>${esc(title)}</strong><small>${esc(text)}</small>${detailedWeekMeter()}</div><div class="weekly-key-action">${action}</div>`;
  }

  function compactHome() {
    const home = document.getElementById("homeView");
    if (!home) return;
    const dashboard = home.querySelector(".game-dashboard");
    const weekCard = dashboard?.querySelector(".week-card") || document.querySelector("#homeProgressStack .week-card");
    const playerCard = dashboard?.querySelector(".player-card") || document.querySelector("#homeProgressStack .player-card");
    if (!weekCard || !playerCard) return;
    let stack = document.getElementById("homeProgressStack");
    if (!stack) {
      stack = document.createElement("section");
      stack.id = "homeProgressStack";
      stack.className = "home-progress-stack";
      stack.setAttribute("aria-label", "Weekly Daily Keys and learning level");
      home.prepend(stack);
    }
    if (weekCard.parentElement !== stack) stack.appendChild(weekCard);
    if (playerCard.parentElement !== stack) stack.appendChild(playerCard);
    if (dashboard && !dashboard.children.length) dashboard.remove();
  }
  function renderTopWeek() {
    const host = document.getElementById("weekMomentum");
    if (!host) return;
    const earned = new Set(earnedDatesThisWeek());
    const today = currentDate();
    host.setAttribute("aria-label", `${earned.size} of 7 Daily Keys this week; goal ${KEY_TARGET}`);
    host.innerHTML = weekDates(today).map((date,index) => `<div class="week-day calendar-key-day ${earned.has(date)?"studied":""} ${date===today?"today":""}" title="${date}"><span>${earned.has(date)?"🔑":DAY_LABELS[index]}</span><small>${DAY_LABELS[index]}</small></div>`).join("");
  }

  function ensureStyles() {
    if (document.getElementById("dailyQuestKeySystemStyles")) return;
    const style = document.createElement("style");
    style.id = "dailyQuestKeySystemStyles";
    style.textContent = `
      .home-progress-stack{display:grid;gap:10px;margin:0 0 14px}.home-progress-stack .week-card,.home-progress-stack .player-card{margin:0!important}
      .home-progress-stack .week-card{padding:10px 12px!important;min-height:0!important}.home-progress-stack .week-card-head{display:none!important}
      .home-progress-stack .week-momentum{display:grid!important;grid-template-columns:repeat(7,minmax(0,1fr))!important;gap:8px!important;margin:0!important}
      .home-progress-stack .week-day{min-width:0!important;min-height:46px!important;padding:5px 2px!important;border-radius:12px!important;display:grid!important;place-items:center!important;gap:1px!important}
      .home-progress-stack .week-day span{font-size:1rem!important;line-height:1!important}.home-progress-stack .week-day small{font-size:.62rem!important;line-height:1!important}
      .home-progress-stack .player-card{padding:10px 14px!important;min-height:0!important;align-items:center!important}.home-progress-stack .player-copy>.eyebrow,.home-progress-stack #playerLevelSubtitle{display:none!important}
      .home-progress-stack .player-copy{gap:4px!important}.home-progress-stack .player-copy h3{margin:0!important}.home-progress-stack .player-avatar-wrap{transform:scale(.88);transform-origin:center}
      .home-progress-stack .player-xp-row,.home-progress-stack .player-xp-track{margin-top:2px!important}
      .daily-quest-navigable{position:relative;cursor:pointer}.daily-quest-navigable:focus-visible{outline:3px solid rgba(18,173,151,.28);outline-offset:2px}
      .daily-quest-arrow{margin-left:auto;padding-left:10px;color:#0b8f83;font-size:1.8rem;font-weight:900;align-self:center}
      .daily-quest-collapse-toggle,.sq-quest-summary-row button{appearance:none;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:inherit;border-radius:999px;min-width:36px;height:36px;padding:0 10px;font:inherit;font-weight:900;cursor:pointer;display:grid;place-items:center}
      .sq-quest-summary-row{display:none;align-items:center;gap:14px;min-height:42px}.sq-quest-summary-row strong{font-size:1.05rem}.sq-quest-summary-row span{opacity:.72}.sq-quest-summary-row button{margin-left:auto}
      .daily-quests-card.sq-quests-collapsed{padding:12px 18px!important}
      .daily-quests-card.sq-quests-collapsed>.sq-quest-summary-row{display:flex!important}
      .daily-quests-card.sq-quests-collapsed>.quest-card-header,.daily-quests-card.sq-quests-collapsed>#dailyQuestList,.daily-quests-card.sq-quests-collapsed>#questChest{display:none!important}
      .daily-quests-card .calendar-detail-meter{display:grid!important;grid-template-columns:repeat(7,minmax(0,1fr))!important;gap:10px!important;width:100%!important;margin-top:12px!important}
      .daily-quests-card .calendar-detail-meter .weekly-key-slot{min-width:0!important;min-height:44px!important;margin:0!important;padding:5px 2px!important;display:grid!important;place-items:center!important;gap:2px!important}
      .daily-quests-card .calendar-detail-meter .weekly-key-slot b{font-size:1rem;line-height:1}.daily-quests-card .calendar-detail-meter .weekly-key-slot small{font-size:.62rem;line-height:1;opacity:.8}
      .daily-key-celebration.reward-coordinator{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;pointer-events:none;background:radial-gradient(circle at center,rgba(250,201,65,.20),transparent 48%)}
      .daily-key-celebration.reward-coordinator .daily-key-celebration-banner{padding:18px 22px;border-radius:22px;background:#173f39;color:white;text-align:center;box-shadow:0 18px 50px rgba(0,0,0,.28);display:grid;gap:4px}
      .daily-key-celebration.reward-coordinator .daily-key-celebration-banner span{font-size:1.15rem;font-weight:900}.daily-key-celebration.reward-coordinator .daily-key-celebration-banner strong{font-size:.9rem;opacity:.88}
      .daily-key-award-grand{position:fixed;z-index:10000;font-size:3rem;pointer-events:none}
      @media(max-width:620px){
        .home-progress-stack{gap:8px;margin-bottom:10px}.home-progress-stack .week-card{padding:8px!important}.home-progress-stack .week-momentum{gap:5px!important}.home-progress-stack .week-day{min-height:42px!important;border-radius:10px!important}
        .home-progress-stack .player-card{padding:8px 10px!important}.home-progress-stack .player-xp-row{font-size:.72rem!important}
        .daily-quests-card .calendar-detail-meter{gap:6px!important}.daily-quests-card .calendar-detail-meter .weekly-key-slot{min-height:40px!important}
        .sq-quest-summary-row{gap:10px}.daily-quests-card.sq-quests-collapsed{padding:10px 14px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function rewardLayer(count) {
    document.querySelector(".daily-key-celebration.reward-coordinator")?.remove();
    const layer = document.createElement("div");
    layer.className = "daily-key-celebration reward-coordinator";
    layer.setAttribute("aria-live", "polite");
    layer.innerHTML = `<div class="daily-key-celebration-banner"><span>🔑 Daily Key earned!</span><strong>${count}/7 days this week · goal ${KEY_TARGET}</strong></div>`;
    document.body.appendChild(layer);
    return layer;
  }
  function keyTargetForDate(date) {
    const dates = weekDates(currentDate());
    const index = dates.indexOf(date);
    if (index < 0) return null;
    const cells = document.querySelectorAll("#weekMomentum .calendar-key-day");
    return cells[index] || null;
  }
  async function animateKey(award) {
    compactHome();
    renderTopWeek();
    const target = keyTargetForDate(award.date);
    const layer = rewardLayer(earnedCount());
    const reduced = Boolean(state.settings?.reducedMotion) || matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!target || reduced) {
      await new Promise(resolve => setTimeout(resolve, 950));
      layer.remove();
      return;
    }
    const rect = target.getBoundingClientRect();
    const startX = innerWidth / 2;
    const startY = innerHeight * .42;
    const dx = rect.left + rect.width/2 - startX;
    const dy = rect.top + rect.height/2 - startY;
    const key = document.createElement("div");
    key.className = "daily-key-award-grand";
    key.textContent = "🔑";
    key.style.left = `${startX}px`;
    key.style.top = `${startY}px`;
    document.body.appendChild(key);
    const motion = key.animate([
      {opacity:0,transform:"translate(-50%,-50%) scale(.25) rotate(-20deg)"},
      {opacity:1,transform:"translate(-50%,-50%) scale(1.35) rotate(8deg)",offset:.25},
      {opacity:1,transform:`translate(calc(-50% + ${dx*.35}px),calc(-50% + ${dy*.18}px)) scale(1) rotate(90deg)`,offset:.62},
      {opacity:1,transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.42) rotate(350deg)`,offset:.94},
      {opacity:0,transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.12) rotate(390deg)`}
    ], {duration:2200,easing:"cubic-bezier(.18,.78,.18,1)",fill:"forwards"});
    await motion.finished.catch(() => {});
    key.remove();
    layer.remove();
  }
  function scheduleKey(delay = 250) {
    window.clearTimeout(keyTimer);
    keyTimer = window.setTimeout(playPendingKey, delay);
  }
  async function playPendingKey() {
    if (playingKey) return;
    const award = keyState().pendingKeyAwards[0];
    if (!award) { releaseRewardLayerSoon(); return; }
    playingKey = true;
    reserveRewardLayer();
    try {
      await animateKey(award);
      const chest = keyState();
      chest.pendingKeyAwards = chest.pendingKeyAwards.filter(item => item.date !== award.date);
      if (!chest.animatedKeyDates.includes(award.date)) chest.animatedKeyDates.push(award.date);
      chest.animatedKeyDates = chest.animatedKeyDates.slice(-MAX_KEY_HISTORY);
      saveState();
      renderAll();
    } finally {
      playingKey = false;
      if (keyState().pendingKeyAwards.length) scheduleKey(500);
      else releaseRewardLayerSoon();
    }
  }

  function ensureRewardModal() {
    let modal = document.getElementById("calendarWeeklyRewardModal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "calendarWeeklyRewardModal";
    modal.className = "weekly-avatar-modal hidden";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.innerHTML = `<div class="weekly-avatar-card-shell"><button class="weekly-avatar-close" type="button" data-calendar-week-close aria-label="Close">×</button><p class="eyebrow">Weekly Daily Key reward</p><div class="weekly-avatar-preview" id="calendarWeeklyRewardPreview"><span class="weekly-avatar-spark">★</span><img id="calendarWeeklyRewardImage" alt=""></div><h2 id="calendarWeeklyRewardTitle"></h2><p>Collected by earning Daily Keys on at least five days in the Monday–Sunday week.</p><div class="weekly-avatar-actions"><button class="secondary-btn" type="button" data-calendar-week-close>Close</button></div></div>`;
    document.body.appendChild(modal);
    modal.addEventListener("click", event => {
      if (event.target === modal || event.target.closest("[data-calendar-week-close]")) closeRewardModal();
    });
    return modal;
  }
  function openRewardModal(reward) {
    if (!reward) return;
    const modal = ensureRewardModal();
    const preview = modal.querySelector("#calendarWeeklyRewardPreview");
    preview.style.setProperty("--reward-a", reward.colors[0]);
    preview.style.setProperty("--reward-b", reward.colors[1]);
    const image = modal.querySelector("#calendarWeeklyRewardImage");
    image.src = reward.src;
    image.alt = reward.avatarName;
    modal.querySelector("#calendarWeeklyRewardTitle").textContent = reward.title;
    modal.classList.remove("hidden");
    document.body.classList.add("modal-open");
  }
  function closeRewardModal() {
    document.getElementById("calendarWeeklyRewardModal")?.classList.add("hidden");
    document.body.classList.remove("modal-open");
  }
  function claimWeeklyReward() {
    if (earnedCount() < KEY_TARGET) return null;
    const chest = keyState();
    const week = currentWeek();
    if (chest.calendarWeekClaims[week]) return rewardById(chest.calendarWeekClaims[week].rewardId);
    const reward = chooseReward();
    chest.calendarWeekClaims[week] = {week,rewardId:reward.id,claimedAt:new Date().toISOString(),keyDates:earnedDatesThisWeek().slice()};
    if (!chest.unlockedRewards.includes(reward.id)) chest.unlockedRewards.push(reward.id);
    saveState();
    try { showRewardBurst("🎁", `${reward.title} unlocked!`, true); } catch {}
    renderAll();
    openRewardModal(reward);
    return reward;
  }

  function renderAll() {
    if (rendering) return;
    rendering = true;
    try {
      patchQuestCard();
      renderChest();
      compactHome();
      renderTopWeek();
    } finally { rendering = false; }
  }

  function install() {
    try {
      if (typeof state === "undefined" || typeof DAILY_QUESTS === "undefined" || typeof ensureDailyActivity !== "function" || typeof questProgress !== "function" || typeof claimDailyQuestRewards !== "function" || typeof renderDailyQuests !== "function" || typeof updateHome !== "function" || typeof startSession !== "function" || typeof saveState !== "function") { retry(); return; }
    } catch { retry(); return; }

    window[INSTALL_FLAG] = true;
    document.documentElement.dataset.weeklyKeyMode = "calendar";
    window.__salitaQuestWeeklyAvatarChestInstalled = true;
    window.__salitaQuestWeeklyAvatarPolishInstalled = true;
    ensureStyles();
    configureQuests();

    const baseClaim = claimDailyQuestRewards;
    claimDailyQuestRewards = function claimDailyQuestRewardsUnified() {
      const mayComplete = projectedCompleteAfterClaim();
      const hadKey = keyState().keyDates.includes(currentDate());
      if (mayComplete && !hadKey) reserveRewardLayer();
      const result = baseClaim.apply(this, arguments);
      configureQuests();
      const granted = grantTodayKey();
      if (granted) saveState();
      renderAll();
      if (granted || keyState().pendingKeyAwards.length) scheduleKey(180);
      else if (mayComplete && !hadKey) releaseRewardLayerSoon();
      return result;
    };

    const baseRenderDailyQuests = renderDailyQuests;
    renderDailyQuests = function renderDailyQuestsUnified() {
      const result = baseRenderDailyQuests.apply(this, arguments);
      configureQuests();
      renderAll();
      document.dispatchEvent(new CustomEvent("salita:daily-quests-rendered"));
      return result;
    };

    const baseUpdateHome = updateHome;
    updateHome = function updateHomeUnified() {
      const result = baseUpdateHome.apply(this, arguments);
      renderAll();
      return result;
    };

    document.addEventListener("click", event => {
      const questRow = event.target.closest(".daily-quest[data-quest-navigation-id]");
      if (questRow && !event.target.closest("button,a,select,input")) {
        launchQuest(questRow.dataset.questNavigationId);
        return;
      }
      const action = event.target.closest("[data-calendar-week-action]")?.dataset.calendarWeekAction;
      if (action === "open") claimWeeklyReward();
      else if (action === "view") openRewardModal(rewardById(currentClaim()?.rewardId));
      else if (action === "latest") openRewardModal(rewardById(latestClaim()?.rewardId));
    });
    document.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const questRow = event.target.closest(".daily-quest[data-quest-navigation-id]");
      if (!questRow) return;
      event.preventDefault();
      launchQuest(questRow.dataset.questNavigationId);
    });

    const observer = new MutationObserver(() => {
      if (!rendering) window.requestAnimationFrame(renderAll);
    });
    const home = document.getElementById("homeView");
    if (home) observer.observe(home, {subtree:true,childList:true});

    configureQuests();
    const alreadyHasKey = keyState().keyDates.includes(currentDate());
    const granted = grantTodayKey();
    if (granted) saveState();
    if ((alreadyHasKey || granted) && !keyState().animatedKeyDates.includes(currentDate())) queueKey(currentDate());
    renderAll();
    if (keyState().pendingKeyAwards.length) scheduleKey(500);
  }

  install();
})();