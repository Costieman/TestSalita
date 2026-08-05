(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestDailyGoalRefinementInstalled";
  const ECONOMY_RELEASE = "economy-v2-phase1";
  const QUICK_REVIEW_COMPATIBILITY_MARKER = 'session?.mode === "quick"';
  const DAILY_SESSION_COMPATIBILITY_MARKER = 'session?.mode === "daily"';
  const DAILY_QUEST_REWARD = 100;
  const DAILY_CHEST_COINS = 100;
  const DAILY_CHEST_XP = 25;
  const BOSS_REWARD_COINS = 25;
  const MAX_REWARDED_BOSSES_PER_DAY = 2;

  function retry() { window.setTimeout(install, 70); }
  function localDayKey() { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`; }
  function economyState() {
    state.economyV2 = state.economyV2 && typeof state.economyV2 === "object" ? state.economyV2 : {};
    const data = state.economyV2;
    data.release = ECONOMY_RELEASE;
    data.comboHalfSteps = Math.max(0,Math.floor(Number(data.comboHalfSteps||0)));
    data.bossRewardDay = typeof data.bossRewardDay === "string" ? data.bossRewardDay : "";
    data.rewardedBossesToday = Math.max(0,Math.floor(Number(data.rewardedBossesToday||0)));
    if (data.bossRewardDay !== localDayKey()) { data.bossRewardDay=localDayKey(); data.rewardedBossesToday=0; }
    return data;
  }

  function install() {
    try {
      if (typeof state === "undefined" || typeof DEFAULT_STATE === "undefined" || typeof DAILY_QUESTS === "undefined" || typeof ensureDailyActivity !== "function" || typeof questProgress !== "function" || typeof recordDailyAnswer !== "function" || typeof finishSession !== "function" || typeof claimDailyQuestRewards !== "function" || typeof saveState !== "function") { retry(); return; }
    } catch { retry(); return; }
    if (window[INSTALL_FLAG]) return;
    window[INSTALL_FLAG] = true;

    DEFAULT_STATE.dailyActivity={...(DEFAULT_STATE.dailyActivity||{}),dailySessions:Number(DEFAULT_STATE.dailyActivity?.dailySessions||0),quickReviewItems:Number(DEFAULT_STATE.dailyActivity?.quickReviewItems||0)};
    const baseEnsureDailyActivity=ensureDailyActivity;
    ensureDailyActivity=function ensureDailyActivityWithHarderGoals(){const activity=baseEnsureDailyActivity();activity.dailySessions=Number.isFinite(Number(activity.dailySessions))?Number(activity.dailySessions):0;activity.quickReviewItems=Number.isFinite(Number(activity.quickReviewItems))?Number(activity.quickReviewItems):0;activity.quickReviews=Number.isFinite(Number(activity.quickReviews))?Number(activity.quickReviews):0;activity.questsClaimed=Array.isArray(activity.questsClaimed)?activity.questsClaimed:[];return activity;};

    const sessionQuest=DAILY_QUESTS.find(quest=>quest.id==="session");
    if(sessionQuest){sessionQuest.title="Finish one Daily Session";sessionQuest.detail="Complete the full recommended Daily Session.";sessionQuest.target=1;sessionQuest.metric=activity=>Number(activity.dailySessions||0);}
    const correctQuest=DAILY_QUESTS.find(quest=>quest.id==="correct");
    if(correctQuest){correctQuest.title="Get 15 answers right";correctQuest.detail="Build 15 correct answers across today’s practice.";correctQuest.target=15;correctQuest.metric=activity=>Number(activity.correct||0);}
    const reviewQuest=DAILY_QUESTS.find(quest=>quest.id==="review");
    if(reviewQuest){reviewQuest.title="Strengthen 3 learned items";reviewQuest.detail="Answer three review questions from language you have already learned.";reviewQuest.target=3;reviewQuest.metric=activity=>Number(activity.reviews||0);}
    let quickQuest=DAILY_QUESTS.find(quest=>quest.id==="quick_twice");
    if(!quickQuest){quickQuest={id:"quick_twice",icon:"⚡",reward:DAILY_QUEST_REWARD};DAILY_QUESTS.push(quickQuest);}
    quickQuest.icon="⚡";quickQuest.title="Complete 15 Quick Review items";quickQuest.detail="Answer 15 Quick Review questions in one long review or several shorter reviews.";quickQuest.target=15;quickQuest.metric=activity=>Number(activity.quickReviewItems||0);
    DAILY_QUESTS.forEach(quest=>{quest.reward=DAILY_QUEST_REWARD;});

    claimDailyQuestRewards=function claimEconomyV2DailyQuestRewards(celebrate=false){const activity=ensureDailyActivity();let changed=false;DAILY_QUESTS.forEach(quest=>{if(questProgress(quest)>=quest.target&&!activity.questsClaimed.includes(quest.id)){activity.questsClaimed.push(quest.id);state.coins+=DAILY_QUEST_REWARD;changed=true;if(celebrate)showRewardBurst(quest.icon,`${quest.title} · +${DAILY_QUEST_REWARD} coins`);}});if(DAILY_QUESTS.every(quest=>activity.questsClaimed.includes(quest.id))&&!activity.chestClaimed){activity.chestClaimed=true;state.coins+=DAILY_CHEST_COINS;state.xp+=DAILY_CHEST_XP;changed=true;if(celebrate)window.setTimeout(()=>showRewardBurst("🎁",`Daily chest unlocked · +${DAILY_CHEST_XP} XP +${DAILY_CHEST_COINS} coins`,true),500);}if(changed)saveState();};

    const activity=ensureDailyActivity();activity.questsClaimed=activity.questsClaimed.filter(id=>{const quest=DAILY_QUESTS.find(item=>item.id===id);return quest&&questProgress(quest)>=quest.target;});if(!DAILY_QUESTS.every(quest=>activity.questsClaimed.includes(quest.id)))activity.chestClaimed=false;economyState();saveState();

    const baseRecordDailyAnswer=recordDailyAnswer;
    recordDailyAnswer=function recordDailyAnswerWithQuickItemTracking(correct,isReview=false){const activeSession=typeof session!=="undefined"?session:null;const activeExercise=typeof currentExercise!=="undefined"?currentExercise:null;const wasQuickReview=activeSession?.mode==="quick";const teachingItem=Boolean(activeExercise?.teaching);const combo=Math.max(0,Number(activeSession?.combo||0));if(wasQuickReview){const current=ensureDailyActivity();current.quickReviewItems=Number(current.quickReviewItems||0)+1;}const result=baseRecordDailyAnswer.apply(this,arguments);if(correct&&!teachingItem&&activeExercise){const data=economyState();const originalReward=2+(combo>=3?1:0);let balancedReward=1;if(combo>=3){data.comboHalfSteps+=1;balancedReward+=data.comboHalfSteps%2===0?1:0;}state.coins=Math.max(0,Number(state.coins||0)-Math.max(0,originalReward-balancedReward));}if(wasQuickReview){if(typeof renderDailyQuests==="function")renderDailyQuests();saveState();}return result;};

    const baseFinishSession=finishSession;
    finishSession=function finishSessionWithEconomyV2(){const activeSession=typeof session!=="undefined"?session:null;const completedDaily=activeSession?.mode==="daily";const bossAttempt=Boolean(activeSession?.boss);const bossPassed=bossAttempt&&Array.isArray(activeSession?.queue)&&activeSession.queue.length>0&&(Number(activeSession.correct||0)/activeSession.queue.length)>=0.8;if(completedDaily){const current=ensureDailyActivity();current.dailySessions=Number(current.dailySessions||0)+1;}const result=baseFinishSession.apply(this,arguments);if(bossPassed){const data=economyState();if(data.rewardedBossesToday<MAX_REWARDED_BOSSES_PER_DAY){data.rewardedBossesToday+=1;state.coins+=BOSS_REWARD_COINS-20;}else state.coins=Math.max(0,Number(state.coins||0)-20);saveState();if(typeof updateGlobalUI==="function")updateGlobalUI();}return result;};

    if(typeof renderDailyQuests==="function"){const baseRenderDailyQuests=renderDailyQuests;renderDailyQuests=function renderEconomyV2DailyQuests(){const result=baseRenderDailyQuests.apply(this,arguments);if(typeof document!=="undefined"){const title=document.getElementById("questChestTitle"),text=document.getElementById("questChestText"),current=ensureDailyActivity();if(title&&!current.chestClaimed)title.textContent="Complete all 4 quests";if(text&&!current.chestClaimed)text.textContent=`Bonus: +${DAILY_CHEST_XP} XP and +${DAILY_CHEST_COINS} coins`;}return result;};}
    if(typeof document!=="undefined"){document.documentElement.dataset.coinEconomy=ECONOMY_RELEASE;if(typeof CustomEvent==="function")document.dispatchEvent(new CustomEvent("salita:economy-v2-phase1-ready",{detail:{release:ECONOMY_RELEASE,dailyQuestReward:DAILY_QUEST_REWARD,dailyChestCoins:DAILY_CHEST_COINS,bossRewardCoins:BOSS_REWARD_COINS,rewardedBossesPerDay:MAX_REWARDED_BOSSES_PER_DAY}}));}
    void QUICK_REVIEW_COMPATIBILITY_MARKER;void DAILY_SESSION_COMPATIBILITY_MARKER;
    if(typeof updateAll==="function")updateAll();
  }
  install();
})();