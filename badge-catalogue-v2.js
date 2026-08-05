(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestBadgeCatalogueV2Installed";
  const MAX_PENDING = 40;
  let celebrationTimer = 0;
  let celebrating = false;

  const countItemsAt = threshold => Object.values(state.itemState || {}).filter(item => Number(item?.mastery || 0) >= threshold).length;
  const durableItemsAt = threshold => Object.values(state.itemState || {}).filter(item => Number(item?.longTermMastery || item?.durableMastery || 0) >= threshold).length;
  const points = () => typeof totalLearningPoints === "function" ? totalLearningPoints() : 0;
  const level = () => typeof levelInfo === "function" ? Number(levelInfo().level || 1) : 1;

  const ADDITIONAL_BADGES = [
    {id:"answers_25",icon:"✍️",name:"Getting Started",description:"Answer 25 learning questions",category:"Practice",target:25,current:s=>s.totalAnswers||0,test:s=>(s.totalAnswers||0)>=25,unlockTest:()=>true},
    {id:"answers_100",icon:"📚",name:"Hundred Replies",description:"Answer 100 learning questions",category:"Practice",target:100,current:s=>s.totalAnswers||0,test:s=>(s.totalAnswers||0)>=100,unlockTest:s=>(s.totalAnswers||0)>=25},
    {id:"correct_50",icon:"🎯",name:"Accurate Recall",description:"Give 50 correct answers",category:"Accuracy",target:50,current:s=>s.correctAnswers||0,test:s=>(s.correctAnswers||0)>=50,unlockTest:s=>(s.correctAnswers||0)>=10},
    {id:"correct_250",icon:"🏹",name:"Retrieval Expert",description:"Give 250 correct answers",category:"Accuracy",target:250,current:s=>s.correctAnswers||0,test:s=>(s.correctAnswers||0)>=250,unlockTest:s=>(s.correctAnswers||0)>=50},
    {id:"streak_3",icon:"🔥",name:"Three-Day Spark",description:"Build a three-day study streak",category:"Consistency",target:3,current:s=>s.bestStreak||s.streak||0,test:s=>(s.bestStreak||s.streak||0)>=3,unlockTest:()=>true},
    {id:"streak_7",icon:"🗓️",name:"Seven-Day Rhythm",description:"Build a seven-day study streak",category:"Consistency",target:7,current:s=>s.bestStreak||s.streak||0,test:s=>(s.bestStreak||s.streak||0)>=7,unlockTest:s=>(s.bestStreak||s.streak||0)>=3},
    {id:"streak_30",icon:"🌋",name:"Month of Momentum",description:"Build a 30-day study streak",category:"Consistency",target:30,current:s=>s.bestStreak||s.streak||0,test:s=>(s.bestStreak||s.streak||0)>=30,unlockTest:s=>(s.bestStreak||s.streak||0)>=7},
    {id:"quick_15",icon:"⚡",name:"Review Sprint",description:"Complete 15 Quick Review items",category:"Review",target:15,current:s=>s.badgeMetrics?.quickReviewItems||0,test:s=>(s.badgeMetrics?.quickReviewItems||0)>=15,unlockTest:s=>(s.totalAnswers||0)>=5},
    {id:"quick_100",icon:"🔁",name:"Review Regular",description:"Complete 100 Quick Review items",category:"Review",target:100,current:s=>s.badgeMetrics?.quickReviewItems||0,test:s=>(s.badgeMetrics?.quickReviewItems||0)>=100,unlockTest:s=>(s.badgeMetrics?.quickReviewItems||0)>=15},
    {id:"daily_10",icon:"☀️",name:"Daily Pathfinder",description:"Complete 10 Daily Sessions",category:"Practice",target:10,current:s=>s.badgeMetrics?.dailySessions||0,test:s=>(s.badgeMetrics?.dailySessions||0)>=10,unlockTest:s=>(s.badgeMetrics?.dailySessions||0)>=1},
    {id:"mastery_1",icon:"💎",name:"First Mastery",description:"Master your first phrase",category:"Mastery",target:1,current:()=>countItemsAt(5),test:()=>countItemsAt(5)>=1,unlockTest:()=>countItemsAt(3)>=1},
    {id:"mastery_10",icon:"👑",name:"Mastery Collection",description:"Master 10 phrases",category:"Mastery",target:10,current:()=>countItemsAt(5),test:()=>countItemsAt(5)>=10,unlockTest:()=>countItemsAt(5)>=1},
    {id:"durable_1",icon:"🛡️",name:"Memory That Lasts",description:"Build long-term mastery on one phrase",category:"Long-term",target:1,current:()=>durableItemsAt(1),test:()=>durableItemsAt(1)>=1,unlockTest:()=>countItemsAt(2)>=1},
    {id:"durable_5",icon:"🏛️",name:"Durable Foundations",description:"Build long-term mastery on five phrases",category:"Long-term",target:5,current:()=>durableItemsAt(1),test:()=>durableItemsAt(1)>=5,unlockTest:()=>durableItemsAt(1)>=1},
    {id:"regions_3",icon:"🗺️",name:"Three Regions",description:"Reach the third world region",category:"Journey",target:28,current:()=>points(),test:()=>points()>=28,unlockTest:()=>points()>=10},
    {id:"regions_6",icon:"⛵",name:"Market Voyager",description:"Reach Market Port",category:"Journey",target:108,current:()=>points(),test:()=>points()>=108,unlockTest:()=>points()>=50},
    {id:"scenario_3",icon:"🎭",name:"Scenario Speaker",description:"Clear three conversation scenarios",category:"Conversation",target:3,current:s=>s.bossWins||0,test:s=>(s.bossWins||0)>=3,unlockTest:s=>(s.bossWins||0)>=1},
    {id:"level_10",icon:"⭐",name:"Level Ten",description:"Reach learner Level 10",category:"Level",target:10,current:()=>level(),test:()=>level()>=10,unlockTest:()=>true},
    {id:"level_25",icon:"🌟",name:"Quarter Century",description:"Reach learner Level 25",category:"Level",target:25,current:()=>level(),test:()=>level()>=25,unlockTest:()=>level()>=10},
    {id:"level_50",icon:"✨",name:"Halfway to Legend",description:"Reach learner Level 50",category:"Level",target:50,current:()=>level(),test:()=>level()>=50,unlockTest:()=>level()>=25},
    {id:"six_key",icon:"🔑",name:"Six-Key Collector",description:"Open a six-key reward chest",category:"Rewards",target:1,current:s=>s.weeklyAvatarChest?.keyRunClaims?.length||0,test:s=>(s.weeklyAvatarChest?.keyRunClaims?.length||0)>=1,unlockTest:s=>(s.weeklyAvatarChest?.keyDates?.length||0)>=1}
  ];

  function retry() { window.setTimeout(install, 100); }

  function badgeState() {
    const data = state.badgeProgress || (state.badgeProgress = {});
    data.earnedAt = data.earnedAt && typeof data.earnedAt === "object" ? data.earnedAt : {};
    data.celebratedIds = Array.isArray(data.celebratedIds) ? [...new Set(data.celebratedIds)] : [];
    data.pendingCelebrations = Array.isArray(data.pendingCelebrations) ? data.pendingCelebrations.filter(item => item?.id) : [];
    state.badgeMetrics = state.badgeMetrics && typeof state.badgeMetrics === "object" ? state.badgeMetrics : {};
    state.badgeMetrics.quickReviewItems = Number(state.badgeMetrics.quickReviewItems || 0);
    state.badgeMetrics.dailySessions = Number(state.badgeMetrics.dailySessions || 0);
    return data;
  }

  function existingIds() { return new Set(BADGES.map(badge => badge.id)); }

  function enhanceBadges() {
    const defaults = {
      first_step:{category:"Practice",unlockTest:()=>true,target:1,current:s=>s.totalAnswers||0},
      first_greeting:{category:"Conversation",unlockTest:()=>true},
      introduced:{category:"Conversation",unlockTest:()=>points()>=10},
      particle_starter:{category:"Grammar",unlockTest:()=>points()>=76},
      verb_builder:{category:"Verbs",unlockTest:()=>points()>=148},
      spanish_spotter:{category:"Connections",unlockTest:()=>points()>=205},
      taglish_navigator:{category:"Conversation",unlockTest:()=>points()>=265},
      boss_one:{category:"Conversation",unlockTest:()=>typeof bossReady === "function" ? bossReady() : false}
    };
    BADGES.forEach(badge => Object.assign(badge, defaults[badge.id] || {}, {image:badge.image || `badges/${badge.id}.png`}));
    const ids = existingIds();
    ADDITIONAL_BADGES.forEach(badge => { if (!ids.has(badge.id)) BADGES.push({...badge,image:`badges/${badge.id}.png`}); });
  }

  function isEarned(badge) { try { return Boolean(badge.test?.(state)); } catch { return false; } }
  function isAvailable(badge) { try { return badge.unlockTest ? Boolean(badge.unlockTest(state)) : true; } catch { return false; } }

  function progressFor(badge) {
    if (!badge.target || typeof badge.current !== "function") return null;
    let current = 0;
    try { current = Math.max(0, Number(badge.current(state) || 0)); } catch {}
    const target = Math.max(1, Number(badge.target));
    return {current, target, pct:Math.min(100, Math.round(current / target * 100))};
  }

  function syncEarned({bootstrap=false}={}) {
    const data = badgeState();
    let changed = false;
    const now = new Date().toISOString();
    BADGES.forEach(badge => {
      if (!isEarned(badge) || data.earnedAt[badge.id]) return;
      data.earnedAt[badge.id] = now;
      if (bootstrap) {
        if (!data.celebratedIds.includes(badge.id)) data.celebratedIds.push(badge.id);
      } else if (!data.celebratedIds.includes(badge.id) && !data.pendingCelebrations.some(item => item.id === badge.id)) {
        data.pendingCelebrations.push({id:badge.id,queuedAt:now});
        data.pendingCelebrations = data.pendingCelebrations.slice(-MAX_PENDING);
      }
      changed = true;
    });
    if (!data.initialized) { data.initialized = true; changed = true; }
    if (changed) saveState();
    return changed;
  }

  function badgeFallback(badge) {
    try { return typeof badgeArt === "function" ? badgeArt(badge.id) : `<span>${badge.icon || "🏅"}</span>`; }
    catch { return `<span>${badge.icon || "🏅"}</span>`; }
  }

  function renderCatalogue() {
    const shelf = document.getElementById("badgeShelf");
    if (!shelf) return;
    const data = badgeState();
    const ranked = BADGES.map((badge, index) => {
      const earned = isEarned(badge);
      const available = !earned && isAvailable(badge);
      return {badge,index,earned,available,earnedAt:data.earnedAt[badge.id] || ""};
    }).sort((a,b) => {
      const groupA = a.earned ? 0 : a.available ? 1 : 2;
      const groupB = b.earned ? 0 : b.available ? 1 : 2;
      if (groupA !== groupB) return groupA - groupB;
      if (a.earned && b.earned) return String(b.earnedAt).localeCompare(String(a.earnedAt));
      return a.index - b.index;
    });

    shelf.classList.add("badge-catalogue-grid");
    shelf.innerHTML = "";
    ranked.forEach(({badge,earned,available,earnedAt}) => {
      const status = earned ? "earned" : available ? "available" : "locked";
      const progress = progressFor(badge);
      const card = document.createElement("article");
      card.className = `badge badge-catalogue-card ${status}`;
      card.dataset.badgeId = badge.id;
      card.innerHTML = `
        <div class="badge-visual-shell">
          <img class="badge-custom-image" src="${badge.image}" alt="" loading="lazy">
          <span class="badge-fallback-art">${badgeFallback(badge)}</span>
        </div>
        <div class="badge-catalogue-copy">
          <div class="badge-catalogue-topline"><span>${badge.category || "Achievement"}</span><em>${earned ? "EARNED" : available ? "AVAILABLE" : "LOCKED"}</em></div>
          <strong>${badge.name}</strong>
          <small>${badge.description}</small>
          ${progress ? `<div class="badge-progress"><span style="width:${progress.pct}%"></span></div><p>${Math.min(progress.current, progress.target)} / ${progress.target}</p>` : ""}
          ${earnedAt ? `<time datetime="${earnedAt}">Earned ${new Date(earnedAt).toLocaleDateString()}</time>` : ""}
        </div>`;
      const image = card.querySelector(".badge-custom-image");
      image.addEventListener("load", () => card.classList.add("has-custom-art"), {once:true});
      image.addEventListener("error", () => image.remove(), {once:true});
      shelf.appendChild(card);
    });

    const count = ranked.filter(item => item.earned).length;
    const countEl = document.getElementById("achievementCount");
    if (countEl) countEl.textContent = String(count);
    const summary = document.querySelector("#badgesView .badges-page-summary h3");
    if (summary) summary.textContent = `${count} of ${BADGES.length} earned`;
    window.dispatchEvent(new CustomEvent("salita:badges-rendered", {detail:{earned:count,total:BADGES.length}}));
  }

  function homeVisible() {
    return document.body.dataset.currentView === "home" && document.getElementById("homeView")?.classList.contains("active") && !document.hidden;
  }

  function celebrationTarget() {
    const desktop = [...document.querySelectorAll('[data-view="badges"]')].find(node => node.getBoundingClientRect().width > 0);
    if (desktop) return desktop;
    return document.querySelector('.mobile-nav-item[data-mobile-more="true"]');
  }

  function createCelebration(badge) {
    const layer = document.createElement("div");
    layer.className = "badge-earned-celebration";
    layer.setAttribute("aria-live", "polite");
    layer.innerHTML = `<div class="badge-earned-backdrop"></div><div class="badge-earned-banner"><span>New badge earned!</span><strong>${badge.name}</strong></div><div class="badge-earned-medal"><img src="${badge.image}" alt=""><span>${badgeFallback(badge)}</span></div>`;
    const image = layer.querySelector("img");
    image.addEventListener("load",()=>layer.classList.add("has-custom-art"),{once:true});
    image.addEventListener("error",()=>image.remove(),{once:true});
    document.body.appendChild(layer);
    requestAnimationFrame(()=>layer.classList.add("show"));
    return layer;
  }

  async function animateBadge(badge) {
    const layer = createCelebration(badge);
    const medal = layer.querySelector(".badge-earned-medal");
    const target = celebrationTarget();
    const reduced = Boolean(state.settings?.reducedMotion) || matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !target) {
      await new Promise(resolve=>setTimeout(resolve,1500));
      layer.classList.add("leaving");
      setTimeout(()=>layer.remove(),450);
      return true;
    }
    const start = medal.getBoundingClientRect();
    const end = target.getBoundingClientRect();
    const dx = end.left + end.width/2 - (start.left + start.width/2);
    const dy = end.top + end.height/2 - (start.top + start.height/2);
    const motion = medal.animate([
      {transform:"translate(0,0) scale(.25) rotate(-20deg)",opacity:0},
      {transform:"translate(0,0) scale(1.15) rotate(12deg)",opacity:1,offset:.24},
      {transform:"translate(0,0) scale(1) rotate(360deg)",opacity:1,offset:.62},
      {transform:`translate(${dx}px,${dy}px) scale(.18) rotate(720deg)`,opacity:.9}
    ],{duration:2500,easing:"cubic-bezier(.18,.76,.2,1)",fill:"forwards"});
    setTimeout(()=>layer.classList.add("flying"),1450);
    await motion.finished.catch(()=>{});
    target.classList.add("badge-nav-impact");
    setTimeout(()=>target.classList.remove("badge-nav-impact"),900);
    layer.remove();
    return true;
  }

  function nextPending() {
    const data = badgeState();
    return data.pendingCelebrations[0] || null;
  }

  function markCelebrated(id) {
    const data = badgeState();
    data.pendingCelebrations = data.pendingCelebrations.filter(item=>item.id!==id);
    if (!data.celebratedIds.includes(id)) data.celebratedIds.push(id);
    saveState();
  }

  async function playPending() {
    clearTimeout(celebrationTimer);
    if (celebrating || !homeVisible()) return;
    const pending = nextPending();
    if (!pending) return;
    const badge = BADGES.find(item=>item.id===pending.id);
    if (!badge) { markCelebrated(pending.id); return; }
    celebrating = true;
    try { if (await animateBadge(badge)) markCelebrated(badge.id); }
    finally {
      celebrating = false;
      if (nextPending() && homeVisible()) scheduleCelebration(700);
    }
  }

  function scheduleCelebration(delay=900) {
    clearTimeout(celebrationTimer);
    celebrationTimer = setTimeout(playPending,delay);
  }

  function install() {
    try {
      if (typeof BADGES === "undefined" || typeof renderBadges !== "function" || typeof switchView !== "function" || typeof saveState !== "function") { retry(); return; }
    } catch { retry(); return; }
    if (window[INSTALL_FLAG]) return;
    window[INSTALL_FLAG] = true;

    enhanceBadges();
    const data = badgeState();
    syncEarned({bootstrap:!data.initialized});

    const baseRecordDailyAnswer = recordDailyAnswer;
    recordDailyAnswer = function recordDailyAnswerWithBadgeMetrics(correct,isReview=false) {
      const result = baseRecordDailyAnswer.apply(this,arguments);
      if (session?.mode === "quick") state.badgeMetrics.quickReviewItems += 1;
      syncEarned();
      saveState();
      return result;
    };

    const baseRecordDailySession = recordDailySession;
    recordDailySession = function recordDailySessionWithBadgeMetrics() {
      if (session?.mode === "daily") state.badgeMetrics.dailySessions += 1;
      const result = baseRecordDailySession.apply(this,arguments);
      syncEarned();
      saveState();
      return result;
    };

    const baseRenderBadges = renderBadges;
    renderBadges = function renderBadgesAsCatalogue() {
      syncEarned();
      baseRenderBadges.apply(this,arguments);
      renderCatalogue();
    };

    const baseSwitchView = switchView;
    switchView = function switchViewWithBadgeCelebrations(view) {
      const result = baseSwitchView.apply(this,arguments);
      if (view === "badges") renderCatalogue();
      if (view === "home") scheduleCelebration(1100);
      return result;
    };

    renderBadges();
    if (homeVisible()) scheduleCelebration(1200);
  }

  install();
})();