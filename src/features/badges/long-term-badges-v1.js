(() => {
  "use strict";

  const API = "SalitaLongTermBadgesV1";
  const RELEASE = "5.6.0-long-term-badges";
  if (window[API]) return;
  let installed = false;
  let runtime = null;

  const n = value => Math.max(0, Number(value || 0));
  const size = value => Array.isArray(value) ? value.length : value instanceof Set ? value.size : value && typeof value === "object" ? Object.keys(value).length : 0;
  const appState = () => runtime?.state?.() || null;
  const catalogue = () => runtime?.catalogue?.() || null;
  const at = (...paths) => {
    const source = appState();
    for (const path of paths) {
      let value = source;
      for (const key of path.split(".")) value = value?.[key];
      if (value !== undefined && value !== null) return value;
    }
    return 0;
  };
  const itemsAt = threshold => Object.values(appState()?.itemState || {}).filter(item => n(item?.mastery) >= threshold).length;
  const durableAt = threshold => Object.values(appState()?.itemState || {}).filter(item => n(item?.longTermMastery || item?.durableMastery) >= threshold).length;
  const level = () => n(runtime?.level?.() || 1) || 1;
  const xp = () => n(runtime?.learningPoints?.());

  function ownedAvatars() {
    const profile = runtime?.activeProfile?.();
    const collection = profile?.avatarCollection || {};
    return Math.max(
      size(collection.ownedIds), size(collection.unlockedIds), size(collection.avatars),
      size(profile?.ownedAvatarIds), size(appState()?.avatarCollection?.ownedIds)
    );
  }

  const totalAvatars = () => {
    const model = runtime?.avatarModel?.();
    return n(model?.catalogue?.length || model?.all?.()?.length || 0);
  };
  const totalCourseItems = () => Object.keys(appState()?.itemState || {}).length;
  const earnedBadges = () => Object.keys(appState()?.badgeProgress?.earnedAt || {}).length;

  const METRICS = Object.freeze({
    answers:()=>n(at("totalAnswers")), correct:()=>n(at("correctAnswers")), streak:()=>n(at("bestStreak","streak")),
    xp, coins:()=>n(at("totalCoinsEarned","coinsEarned","coins")), level,
    mastery:()=>itemsAt(5), durable:()=>durableAt(1), quick:()=>n(at("badgeMetrics.quickReviewItems")),
    daily:()=>n(at("badgeMetrics.dailySessions")), lessons:()=>Math.max(n(at("badgeMetrics.lessonsCompleted","lessonsCompleted")),size(at("completedLessons"))),
    avatars:ownedAvatars, scenarios:()=>n(at("bossWins","badgeMetrics.scenariosCompleted")),
    perfect:()=>n(at("badgeMetrics.perfectLessons","perfectLessons")), handsfree:()=>n(at("badgeMetrics.handsFreeItems","badgeMetrics.handsFreeReviews")),
    days:()=>Math.max(n(at("badgeMetrics.daysStudied")),size(at("studyDates","activityDates"))),
    keys:()=>Math.max(n(at("badgeMetrics.keysEarned")),size(at("weeklyAvatarChest.keyDates"))),
    chests:()=>Math.max(n(at("badgeMetrics.chestsOpened")),size(at("weeklyAvatarChest.keyRunClaims"))),
    correctStreak:()=>n(at("bestCorrectStreak","badgeMetrics.bestCorrectStreak")),
    mastery1:()=>itemsAt(1), mastery2:()=>itemsAt(2), mastery3:()=>itemsAt(3), mastery4:()=>itemsAt(4),
    badges:earnedBadges, reviews:()=>n(at("badgeMetrics.reviewAnswers","reviewAnswers")),
    sessions:()=>n(at("badgeMetrics.studySessions","sessionsCompleted")),
    minutes:()=>n(at("badgeMetrics.studyMinutes","studyMinutes")),
    pronunciation:()=>n(at("badgeMetrics.pronunciationAttempts","pronunciationAttempts")),
    listening:()=>n(at("badgeMetrics.listeningAnswers","listeningAnswers")),
    sentenceBuilder:()=>n(at("badgeMetrics.sentenceBuilderAnswers","sentenceBuilderAnswers")),
    difficultRecovered:()=>n(at("badgeMetrics.difficultItemsRecovered","difficultItemsRecovered"))
  });

  const META = Object.freeze({
    answers:["Practice","Questions Answered","Answer {n} learning questions","📝"], correct:["Accuracy","Correct Answers","Give {n} correct answers","🎯"],
    streak:["Consistency","Study Streak","Build a {n}-day study streak","🔥"], xp:["Progress","XP Earned","Earn {n} XP","⭐"],
    coins:["Rewards","Coins Earned","Earn {n} coins","🪙"], level:["Level","Learner Level","Reach learner Level {n}","🌟"],
    mastery:["Mastery","Phrases Mastered","Master {n} phrases","💎"], durable:["Long-term","Durable Memories","Build long-term mastery on {n} phrases","🛡️"],
    quick:["Review","Quick Review","Complete {n} Quick Review items","🔁"], daily:["Practice","Daily Sessions","Complete {n} Daily Sessions","☀️"],
    lessons:["Journey","Lessons Completed","Complete {n} lessons","📚"], avatars:["Collection","Avatar Collector","Collect {n} avatars","🦜"],
    scenarios:["Conversation","Scenario Speaker","Clear {n} conversation scenarios","🎭"], perfect:["Accuracy","Perfect Lessons","Complete {n} perfect lessons","🏆"],
    handsfree:["Review","Hands-Free Review","Complete {n} Hands-Free Review items","🎧"], days:["Consistency","Days Studied","Study on {n} different days","📅"],
    keys:["Rewards","Keys Earned","Earn {n} Daily Keys","🔑"], chests:["Rewards","Chests Opened","Open {n} reward chests","🎁"],
    correctStreak:["Accuracy","Correct Streak","Give {n} correct answers in a row","⚡"], mastery1:["Vocabulary","Words Encountered","Reach mastery 1 on {n} phrases","🌱"],
    mastery2:["Vocabulary","Words Practised","Reach mastery 2 on {n} phrases","🌿"], mastery3:["Vocabulary","Words Strengthened","Reach mastery 3 on {n} phrases","🌳"],
    mastery4:["Vocabulary","Words Nearly Mastered","Reach mastery 4 on {n} phrases","🏛️"], badges:["Collection","Badge Collector","Earn {n} badges","🏅"],
    reviews:["Review","Review Answers","Answer {n} review questions","🧠"], sessions:["Consistency","Study Sessions","Complete {n} study sessions","🧭"],
    minutes:["Consistency","Minutes Studied","Study for {n} minutes","⏱️"], pronunciation:["Speaking","Pronunciation Practice","Complete {n} pronunciation attempts","🎙️"],
    listening:["Listening","Listening Practice","Complete {n} listening questions","👂"], sentenceBuilder:["Grammar","Sentence Builder","Complete {n} sentence-building questions","🧱"],
    difficultRecovered:["Long-term","Memory Recovery","Recover {n} difficult phrases","🌄"]
  });

  const CHAINS = Object.freeze({
    answers:[250,500,1000,2500,5000,10000,20000,50000,100000], correct:[500,1000,2500,5000,10000,25000,50000,100000],
    streak:[14,60,100,180,365,730], xp:[1000,2500,5000,10000,25000,50000,100000,250000,500000,1000000],
    coins:[500,1000,2500,5000,10000,25000,50000,100000,250000,500000,1000000], level:[5,15,20,30,40,60,75,100],
    mastery:[25,50,100,150,250,500,750,1000], durable:[10,25,50,100,250,500,750,1000], quick:[250,500,1000,2500,5000,10000],
    daily:[25,50,100,250,500,1000], lessons:[5,10,25,50,100,250,500,1000], avatars:[2,5,10,15,20,25,30,40,50],
    scenarios:[5,10,25,50,100,250], perfect:[1,5,10,25,50,100,250], handsfree:[1,5,10,25,50,100,250,500,1000],
    days:[3,7,14,30,60,100,180,365,730], keys:[5,10,25,50,100,250,500,1000], chests:[1,5,10,25,50,100,250],
    correctStreak:[10,25,50,100,250,500], mastery1:[10,25,50,100,250,500,750,1000], mastery2:[10,25,50,100,250,500,750,1000],
    mastery3:[10,25,50,100,250,500,750,1000], mastery4:[10,25,50,100,250,500,750,1000], badges:[10,25,50,75,100,150,200,250],
    reviews:[50,100,250,500,1000,2500,5000,10000], sessions:[5,10,25,50,100,250,500,1000], minutes:[30,60,120,300,600,1200,3000,6000],
    pronunciation:[5,10,25,50,100,250,500,1000], listening:[10,25,50,100,250,500,1000,2500],
    sentenceBuilder:[10,25,50,100,250,500,1000,2500], difficultRecovered:[1,5,10,25,50,100,250,500]
  });

  const fmt = value => n(value).toLocaleString("en-US");
  function chainBadge(key,target,index,thresholds) {
    const [category,family,description,icon] = META[key];
    const previous = index ? thresholds[index - 1] : 0;
    return {
      id:`lt_${key}_${target}`, icon, name:index === thresholds.length - 1 ? `${family}: Legend` : `${family}: ${fmt(target)}`,
      description:description.replace("{n}",fmt(target)), category,
      rarity:index === thresholds.length - 1 ? "legendary" : index >= Math.ceil(thresholds.length * .7) ? "epic" : index >= Math.ceil(thresholds.length * .4) ? "rare" : "common",
      target, current:()=>METRICS[key](), test:()=>METRICS[key]() >= target,
      unlockTest:()=>previous === 0 || METRICS[key]() >= previous,
      image:`badges/lt_${key}_${target}.png`
    };
  }

  function specialBadges() {
    return [
      {id:"lt_avatars_all",icon:"👑",name:"Avatar Curator",description:"Collect every available avatar",category:"Collection",rarity:"legendary",target:1,
        current:()=>totalAvatars() > 0 && ownedAvatars() >= totalAvatars() ? 1 : 0,test:()=>totalAvatars() > 0 && ownedAvatars() >= totalAvatars(),
        unlockTest:()=>totalAvatars() > 0 && ownedAvatars() >= Math.ceil(totalAvatars() * .75),image:"badges/lt_avatars_all.png"},
      {id:"lt_mastery_all",icon:"📖",name:"Walking Dictionary",description:"Master every phrase currently available in the course",category:"Mastery",rarity:"legendary",target:1,
        current:()=>totalCourseItems() > 0 && itemsAt(5) >= totalCourseItems() ? 1 : 0,test:()=>totalCourseItems() > 0 && itemsAt(5) >= totalCourseItems(),
        unlockTest:()=>itemsAt(5) >= 100,image:"badges/lt_mastery_all.png"},
      {id:"lt_legend_of_salita",icon:"🏆",name:"Legend of Salita",description:"Earn every visible badge currently available",category:"Legend",rarity:"legendary",target:1,
        current:()=>allVisibleEarned() ? 1 : 0,test:()=>allVisibleEarned(),unlockTest:()=>earnedBadges() >= 200,image:"badges/lt_legend_of_salita.png"}
    ];
  }

  function allVisibleEarned() {
    const list = catalogue() || [];
    const earned = appState()?.badgeProgress?.earnedAt || {};
    const candidates = list.filter(badge => badge.id !== "lt_legend_of_salita" && !badge.hidden);
    return candidates.length > 0 && candidates.every(badge => earned[badge.id] || badge.test?.(appState()));
  }

  function build() {
    const result = [];
    for (const [key,thresholds] of Object.entries(CHAINS)) thresholds.forEach((target,index)=>result.push(chainBadge(key,target,index,thresholds)));
    return result.concat(specialBadges());
  }

  function install(candidate = window.SalitaBadgeCatalogueRuntimeV1) {
    if (installed) return true;
    runtime = candidate;
    if (!runtime?.ready?.()) return false;
    const list = catalogue();
    const existing = new Set(list.map(badge=>badge.id));
    const additions = build().filter(badge=>!existing.has(badge.id));
    list.push(...additions);
    installed = true;
    document.documentElement.dataset.longTermBadges = RELEASE;
    document.dispatchEvent(new CustomEvent("salita:long-term-badges-ready",{detail:{release:RELEASE,added:additions.length,total:list.length}}));
    runtime.refresh?.({bootstrap:true});
    return true;
  }

  window[API] = Object.freeze({install});
})();
