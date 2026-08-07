(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaDailyQuestKeySystemV1Installed";
  if (window[INSTALL_FLAG]) return;
  window[INSTALL_FLAG] = true;

  const QUEST_TOTAL = 4;
  const KEY_TARGET = 5;
  const DAILY_QUEST_REWARD = 100;
  const DAILY_CHEST_COINS = 100;
  const DAILY_CHEST_XP = 25;
  const MAX_KEY_HISTORY = 240;
  const DAY_LABELS = ["M","T","W","T","F","S","S"];
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
    id:`${avatar.id}-${variant.id}`,avatarId:avatar.id,avatarName:avatar.name,src:avatar.src,
    variantId:variant.id,variantLabel:variant.label,colors:variant.colors,title:`${variant.label} ${avatar.name}`
  })));

  let playingKey = false;
  let keyTimer = 0;
  let releaseTimer = 0;
  let reservation = null;

  function retry(){ window.setTimeout(install,80); }
  function esc(value){ return String(value??"").replace(/[&<>'"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch])); }
  function localKey(date=new Date()){ return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
  function parseKey(value){ const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value||"")); return m?new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),12):new Date(); }
  function mondayKey(value=localKey()){ const d=parseKey(value); d.setDate(d.getDate()-((d.getDay()+6)%7)); return localKey(d); }
  function weekDates(value=localKey()){ const monday=parseKey(mondayKey(value)); return Array.from({length:7},(_,i)=>{ const d=new Date(monday); d.setDate(monday.getDate()+i); return localKey(d); }); }
  function currentDate(){ try{return ensureDailyActivity().date||localKey();}catch{return localKey();} }
  function currentWeek(){ return mondayKey(currentDate()); }

  function chestState(){
    const chest=state.weeklyAvatarChest||(state.weeklyAvatarChest={});
    chest.keyDates=Array.isArray(chest.keyDates)?[...new Set(chest.keyDates.filter(Boolean))].sort():[];
    chest.pendingKeyAwards=Array.isArray(chest.pendingKeyAwards)?chest.pendingKeyAwards.filter(item=>item?.date):[];
    chest.animatedKeyDates=Array.isArray(chest.animatedKeyDates)?[...new Set(chest.animatedKeyDates.filter(Boolean))]:[];
    chest.unlockedRewards=Array.isArray(chest.unlockedRewards)?[...new Set(chest.unlockedRewards.filter(Boolean))]:[];
    chest.calendarWeekClaims=chest.calendarWeekClaims&&typeof chest.calendarWeekClaims==="object"?chest.calendarWeekClaims:{};
    if(chest.keyDates.length>MAX_KEY_HISTORY) chest.keyDates=chest.keyDates.slice(-MAX_KEY_HISTORY);
    return chest;
  }
  function earnedDates(){ const allowed=new Set(weekDates(currentDate())); return chestState().keyDates.filter(date=>allowed.has(date)); }
  function earnedCount(){ return earnedDates().length; }
  function currentClaim(){ return chestState().calendarWeekClaims[currentWeek()]||null; }
  function latestClaim(){ return Object.values(chestState().calendarWeekClaims).sort((a,b)=>String(b?.claimedAt||"").localeCompare(String(a?.claimedAt||"")))[0]||null; }
  function rewardById(id){ return REWARDS.find(r=>r.id===id)||null; }
  function randomIndex(length){ if(length<=1)return 0;if(window.crypto?.getRandomValues){const v=new Uint32Array(1);crypto.getRandomValues(v);return v[0]%length;}return Math.floor(Math.random()*length); }
  function chooseReward(){ const chest=chestState(); const unopened=REWARDS.filter(r=>!chest.unlockedRewards.includes(r.id)); const pool=unopened.length?unopened:REWARDS; return pool[randomIndex(pool.length)]; }

  function configureQuests(){
    const activity=ensureDailyActivity();
    activity.dailySessions=Number(activity.dailySessions||0);
    activity.quickReviewItems=Number(activity.quickReviewItems||0);
    activity.quickReviews=Number(activity.quickReviews||0);
    activity.questsClaimed=Array.isArray(activity.questsClaimed)?activity.questsClaimed:[];
    const sessionQuest=DAILY_QUESTS.find(q=>q.id==="session");
    if(sessionQuest){Object.assign(sessionQuest,{title:"Finish one Daily Session",detail:"Complete the full recommended Daily Session.",target:1,reward:DAILY_QUEST_REWARD,metric:a=>Number(a.dailySessions||0)});}
    const correctQuest=DAILY_QUESTS.find(q=>q.id==="correct");
    if(correctQuest){Object.assign(correctQuest,{title:"Get 15 answers right",detail:"Build 15 correct answers across today’s practice.",target:15,reward:DAILY_QUEST_REWARD,metric:a=>Number(a.correct||0)});}
    const reviewQuest=DAILY_QUESTS.find(q=>q.id==="review");
    if(reviewQuest){Object.assign(reviewQuest,{title:"Strengthen 3 learned items",detail:"Answer three review questions from language you have already learned.",target:3,reward:DAILY_QUEST_REWARD,metric:a=>Number(a.reviews||0)});}
    let quick=DAILY_QUESTS.find(q=>q.id==="quick_twice");
    if(!quick){quick={id:"quick_twice",icon:"⚡"};DAILY_QUESTS.push(quick);}
    Object.assign(quick,{title:"Complete 15 Quick Review items",detail:"Answer 15 Quick Review questions in one long review or several shorter reviews.",target:15,reward:DAILY_QUEST_REWARD,metric:a=>Number(a.quickReviewItems||0)});
    DAILY_QUESTS.splice(QUEST_TOTAL);
  }
  function progress(quest){ try{return Math.max(0,Number(questProgress(quest)||0));}catch{return Math.max(0,Number(quest.metric?.(ensureDailyActivity())||0));} }
  function allComplete(){ const a=ensureDailyActivity();return DAILY_QUESTS.length===QUEST_TOTAL&&DAILY_QUESTS.every(q=>a.questsClaimed.includes(q.id)); }

  function reserveRewardLayer(){
    clearTimeout(releaseTimer);
    if(!reservation?.isConnected){ reservation=document.createElement("div");reservation.className="daily-key-celebration daily-key-reward-reservation";reservation.hidden=true;reservation.setAttribute("aria-hidden","true");document.body.appendChild(reservation); }
    document.documentElement.dataset.dailyKeyRewardPriority="reserved";
    try{window.SalitaPopupGovernor?.suspend?.(6500,"daily_key_priority");}catch{}
  }
  function releaseRewardLayerSoon(){
    clearTimeout(releaseTimer);
    releaseTimer=setTimeout(()=>{
      if(playingKey||chestState().pendingKeyAwards.length){reserveRewardLayer();return;}
      reservation?.remove();reservation=null;delete document.documentElement.dataset.dailyKeyRewardPriority;
      try{window.SalitaPopupGovernor?.resume?.("daily_key_finished");window.SalitaPopupGovernor?.notify?.();}catch{}
      document.dispatchEvent(new CustomEvent("salita:daily-key-reward-finished"));
    },650);
  }

  function queueKey(date=currentDate()){
    const chest=chestState();
    if(chest.animatedKeyDates.includes(date)||chest.pendingKeyAwards.some(a=>a.date===date)) return false;
    chest.pendingKeyAwards.push({date,count:Math.min(KEY_TARGET,earnedCount()),queuedAt:new Date().toISOString(),source:"daily-quest-key-system"});
    reserveRewardLayer();
    return true;
  }
  function grantTodayKey(){
    if(!allComplete()) return false;
    const chest=chestState(); const date=currentDate();
    if(chest.keyDates.includes(date)) return false;
    chest.keyDates.push(date);chest.keyDates.sort();queueKey(date);return true;
  }

  function claimRewards(celebrate=false){
    const activity=ensureDailyActivity(); let changed=false;
    DAILY_QUESTS.forEach(quest=>{
      if(progress(quest)>=quest.target&&!activity.questsClaimed.includes(quest.id)){
        activity.questsClaimed.push(quest.id);state.coins=Number(state.coins||0)+DAILY_QUEST_REWARD;changed=true;
        if(celebrate){try{showRewardBurst(quest.icon,`${quest.title} · +${DAILY_QUEST_REWARD} coins`);}catch{}}
      }
    });
    if(allComplete()&&!activity.chestClaimed){ activity.chestClaimed=true;state.coins=Number(state.coins||0)+DAILY_CHEST_COINS;state.xp=Number(state.xp||0)+DAILY_CHEST_XP;changed=true; }
    if(activity.chestClaimed&&grantTodayKey()) changed=true;
    if(changed) saveState();
    renderAll();
    if(chestState().pendingKeyAwards.length) scheduleKey(180);
    return changed;
  }

  function renderQuestRows(){
    const card=document.querySelector(".daily-quests-card"); const list=document.getElementById("dailyQuestList"); if(!card||!list)return;
    const activity=ensureDailyActivity();
    list.innerHTML=DAILY_QUESTS.map(quest=>{
      const value=Math.min(quest.target,progress(quest)); const complete=activity.questsClaimed.includes(quest.id)||value>=quest.target;
      const destination=quest.id==="session"?"Daily Session":"Quick Review";
      return `<div class="daily-quest daily-quest-navigable ${complete?"complete":""}" data-quest-navigation-id="${esc(quest.id)}" role="button" tabindex="0" aria-label="${esc(quest.title)}. Open ${destination}."><div class="daily-quest-icon">${esc(quest.icon||"✓")}</div><div class="daily-quest-copy"><strong>${esc(quest.title)}</strong><p>${esc(quest.detail||"")}</p><div class="daily-quest-progress"><span style="width:${Math.min(100,(value/Math.max(1,quest.target))*100)}%"></span></div><small>${value}/${quest.target}${complete?" · complete":""}</small></div><span class="daily-quest-arrow" aria-hidden="true">›</span></div>`;
    }).join("");
    const score=document.getElementById("dailyQuestScore");if(score)score.textContent=`${Math.min(QUEST_TOTAL,activity.questsClaimed.length)}/${QUEST_TOTAL}`;
    const heading=card.querySelector(".quest-card-header h3");if(heading)heading.textContent=allComplete()?"Daily quests completed":"4 small wins";
    const desc=card.querySelector(".quest-card-header p:not(.eyebrow)");if(desc&&!allComplete())desc.textContent="Short, meaningful goals keep practice focused without turning XP into the objective.";
    ensureCollapse(card);
  }

  function ensureCollapse(card){
    const header=card.querySelector(".quest-card-header");if(!header)return;
    let button=header.querySelector(".daily-quest-collapse-toggle");
    if(!button){button=document.createElement("button");button.type="button";button.className="daily-quest-collapse-toggle";header.appendChild(button);button.addEventListener("click",()=>{const collapse=!card.classList.contains("sq-quests-collapsed");card.dataset.questManualState=collapse?"collapsed":"expanded";card.dataset.questManualDay=currentDate();card.classList.toggle("sq-quests-collapsed",collapse);syncCollapse(card,button);});}
    if(card.dataset.questManualDay!==currentDate()){delete card.dataset.questManualState;card.dataset.questManualDay=currentDate();}
    if(allComplete()&&card.dataset.questManualState!=="expanded")card.classList.add("sq-quests-collapsed");
    else if(!allComplete()&&card.dataset.questManualState!=="collapsed")card.classList.remove("sq-quests-collapsed");
    syncCollapse(card,button);
  }
  function syncCollapse(card,button){const collapsed=card.classList.contains("sq-quests-collapsed");button.textContent=collapsed?"⌄":"⌃";button.setAttribute("aria-expanded",collapsed?"false":"true");button.setAttribute("aria-label",collapsed?"Open Daily Quests":"Collapse Daily Quests");}

  function detailMeter(){const count=Math.min(KEY_TARGET,earnedCount());return `<div class="weekly-key-meter calendar-detail-meter" aria-label="${count} of ${KEY_TARGET} required weekly keys collected">${Array.from({length:KEY_TARGET},(_,i)=>`<span class="weekly-key-slot ${i<count?"collected":""}">${i<count?"🔑":""}</span>`).join("")}</div>`;}
  function renderChest(){
    const host=document.getElementById("questChest");if(!host)return;
    const count=earnedCount();const ready=count>=KEY_TARGET;const claim=currentClaim();const latest=latestClaim();const latestReward=latest?rewardById(latest.rewardId):null;const earnedToday=chestState().keyDates.includes(currentDate());
    host.classList.toggle("locked",!earnedToday&&!ready&&!claim);host.classList.toggle("unlocked",earnedToday||ready||Boolean(claim));host.classList.toggle("weekly-ready",ready&&!claim);host.classList.toggle("weekly-claimed",Boolean(claim));
    let title=`Weekly Daily Keys · ${Math.min(KEY_TARGET,count)}/${KEY_TARGET}`;let text=`Earn a key on any ${KEY_TARGET} of the 7 days from Monday to Sunday.`;let action=`<span class="weekly-key-status">${earnedToday?"✓":"🔒"}</span>`;
    if(ready&&!claim){title=`Weekly reward ready · ${count}/7 days`;text=`${KEY_TARGET} Daily Keys collected this calendar week. Open your weekly reward.`;action='<button class="weekly-chest-button" type="button" data-calendar-week-action="open">Open reward</button>';}
    else if(claim){const reward=rewardById(claim.rewardId);title=`Weekly goal complete · ${count}/7 days`;text=`This week’s reward: ${reward?.title||"collected"}.`;action='<button class="weekly-chest-button secondary" type="button" data-calendar-week-action="view">View reward</button>';}
    else if(latestReward){text+=` Previous reward: ${latestReward.title}.`;action='<button class="weekly-chest-button secondary" type="button" data-calendar-week-action="latest">View previous</button>';}
    host.innerHTML=`<div class="weekly-key-icon" aria-hidden="true">${ready&&!claim?"🎁":"🔑"}</div><div class="weekly-key-copy"><strong>${esc(title)}</strong><small>${esc(text)}</small>${detailMeter()}</div><div class="weekly-key-action">${action}</div>`;
  }

  function compactHome(){
    const home=document.getElementById("homeView");const dashboard=home?.querySelector(".game-dashboard");let week=dashboard?.querySelector(".week-card")||document.querySelector("#homeProgressStack .week-card");let player=dashboard?.querySelector(".player-card")||document.querySelector("#homeProgressStack .player-card");if(!home||!week||!player)return;
    let stack=document.getElementById("homeProgressStack");if(!stack){stack=document.createElement("section");stack.id="homeProgressStack";stack.className="home-progress-stack";stack.setAttribute("aria-label","Weekly keys and learning level");home.prepend(stack);}
    if(week.parentElement!==stack)stack.appendChild(week);if(player.parentElement!==stack)stack.appendChild(player);if(dashboard&&dashboard!==stack)dashboard.remove();
  }
  function renderTopStrip(){
    const host=document.getElementById("weekMomentum");if(!host)return;const earned=new Set(earnedDates());const today=currentDate();host.setAttribute("aria-label",`${earned.size} Daily Keys earned this calendar week; weekly goal ${KEY_TARGET} of 7 days`);host.innerHTML=weekDates(currentDate()).map((key,i)=>`<div class="week-day calendar-key-day ${earned.has(key)?"studied":""} ${key===today?"today":""}" data-date="${key}" title="${key}"><span>${earned.has(key)?"🔑":DAY_LABELS[i]}</span><small>${DAY_LABELS[i]}</small></div>`).join("");
  }

  function quickLength(){const a=document.getElementById("activityQuickLength"),h=document.getElementById("homeQuickReviewLength");const n=Number(a?.value||h?.value||state?.settings?.quickReviewLength||4);return Number.isFinite(n)&&n>0?n:4;}
  function launchQuest(id){if(id==="session")startSession("daily");else startSession("quick",false,{length:quickLength()});}

  function claimWeeklyReward(){
    if(earnedCount()<KEY_TARGET)return null;const chest=chestState();const week=currentWeek();if(chest.calendarWeekClaims[week])return rewardById(chest.calendarWeekClaims[week].rewardId);const reward=chooseReward();chest.calendarWeekClaims[week]={week,rewardId:reward.id,claimedAt:new Date().toISOString(),keyDates:earnedDates().slice()};if(!chest.unlockedRewards.includes(reward.id))chest.unlockedRewards.push(reward.id);saveState();try{showRewardBurst("🎁",`${reward.title} unlocked!`,true);}catch{}renderAll();openRewardModal(reward);return reward;
  }
  function ensureRewardModal(){let modal=document.getElementById("calendarWeeklyRewardModal");if(modal)return modal;modal=document.createElement("div");modal.id="calendarWeeklyRewardModal";modal.className="weekly-avatar-modal hidden";modal.setAttribute("role","dialog");modal.setAttribute("aria-modal","true");modal.innerHTML='<div class="weekly-avatar-card-shell"><button class="weekly-avatar-close" type="button" data-calendar-week-close aria-label="Close">×</button><p class="eyebrow">Weekly Daily Key reward</p><div class="weekly-avatar-preview" id="calendarWeeklyRewardPreview"><span class="weekly-avatar-spark">★</span><img id="calendarWeeklyRewardImage" alt=""></div><h2 id="calendarWeeklyRewardTitle"></h2><p>Collected by earning Daily Keys on five days in the Monday–Sunday week.</p><div class="weekly-avatar-actions"><button class="secondary-btn" type="button" data-calendar-week-close>Close</button></div></div>';document.body.appendChild(modal);modal.addEventListener("click",e=>{if(e.target===modal||e.target.closest("[data-calendar-week-close]"))closeRewardModal();});return modal;}
  function openRewardModal(reward){if(!reward)return;const modal=ensureRewardModal();const preview=modal.querySelector("#calendarWeeklyRewardPreview");preview.style.setProperty("--reward-a",reward.colors[0]);preview.style.setProperty("--reward-b",reward.colors[1]);const img=modal.querySelector("#calendarWeeklyRewardImage");img.src=reward.src;img.alt=reward.avatarName;modal.querySelector("#calendarWeeklyRewardTitle").textContent=reward.title;modal.classList.remove("hidden");document.body.classList.add("modal-open");}
  function closeRewardModal(){document.getElementById("calendarWeeklyRewardModal")?.classList.add("hidden");document.body.classList.remove("modal-open");}

  function keyTarget(){return document.querySelector(`.calendar-key-day[data-date="${currentDate()}"]`)||document.querySelector(".calendar-detail-meter .weekly-key-slot.collected:last-child");}
  function rewardLayer(count){document.querySelector(".daily-key-celebration.reward-coordinator")?.remove();const layer=document.createElement("div");layer.className="daily-key-celebration reward-coordinator";layer.setAttribute("aria-live","polite");layer.innerHTML=`<div class="daily-key-celebration-glow" aria-hidden="true"></div><div class="daily-key-celebration-banner" role="status"><span>Daily Key earned!</span><strong>${count} of ${KEY_TARGET} keys this week</strong></div><div class="daily-key-spark-field" aria-hidden="true"></div>`;const field=layer.querySelector(".daily-key-spark-field");for(let i=0;i<22;i++){const spark=document.createElement("i");spark.style.setProperty("--spark-angle",`${(360/22)*i}deg`);spark.style.setProperty("--spark-distance",`${105+(i%5)*18}px`);spark.style.setProperty("--spark-delay",`${(i%6)*22}ms`);field.appendChild(spark);}document.body.appendChild(layer);requestAnimationFrame(()=>layer.classList.add("show"));return layer;}
  async function animateKey(award){
    reserveRewardLayer();renderAll();const target=keyTarget();const layer=rewardLayer(Math.min(KEY_TARGET,earnedCount()));const reduced=Boolean(state.settings?.reducedMotion)||matchMedia("(prefers-reduced-motion: reduce)").matches;if(reduced){await new Promise(r=>setTimeout(r,850));layer.remove();return true;}
    const rect=target?.getBoundingClientRect();const startX=innerWidth/2,startY=innerHeight*.46;const endX=rect?rect.left+rect.width/2:startX,endY=rect?rect.top+rect.height/2:startY;const dx=endX-startX,dy=endY-startY;const key=document.createElement("div");key.className="daily-key-award daily-key-award-grand";key.textContent="🔑";key.style.left=`${startX}px`;key.style.top=`${startY}px`;document.body.appendChild(key);const motion=key.animate([{opacity:0,transform:"translate(-50%,-50%) scale(.2) rotate(-25deg)"},{opacity:1,transform:"translate(-50%,-50%) scale(1.4) rotate(8deg)",offset:.22},{opacity:1,transform:`translate(calc(-50% + ${dx*.32}px),calc(-50% + ${dy*.16}px)) scale(1.05) rotate(80deg)`,offset:.62},{opacity:1,transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.42) rotate(360deg)`,offset:.94},{opacity:0,transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.12) rotate(390deg)`}],{duration:2350,easing:"cubic-bezier(.18,.78,.18,1)",fill:"forwards"});setTimeout(()=>layer.classList.add("key-in-flight"),1050);setTimeout(()=>layer.classList.add("leaving"),1840);await motion.finished.catch(()=>{});key.remove();setTimeout(()=>layer.remove(),520);return true;
  }
  function homeVisible(){const home=document.getElementById("homeView");return document.visibilityState!=="hidden"&&document.body.dataset.currentView==="home"&&home?.classList.contains("active");}
  async function playPendingKey(){clearTimeout(keyTimer);if(playingKey||!homeVisible())return;const award=chestState().pendingKeyAwards[0];if(!award){releaseRewardLayerSoon();return;}playingKey=true;try{if(await animateKey(award)){const chest=chestState();chest.pendingKeyAwards=chest.pendingKeyAwards.filter(a=>a.date!==award.date);if(!chest.animatedKeyDates.includes(award.date))chest.animatedKeyDates.push(award.date);chest.animatedKeyDates=chest.animatedKeyDates.slice(-MAX_KEY_HISTORY);saveState();}}finally{playingKey=false;if(chestState().pendingKeyAwards.length&&homeVisible())scheduleKey(650);else releaseRewardLayerSoon();}}
  function scheduleKey(delay=500){clearTimeout(keyTimer);if(chestState().pendingKeyAwards.length)reserveRewardLayer();keyTimer=setTimeout(playPendingKey,delay);}

  function renderAll(){compactHome();renderTopStrip();renderQuestRows();renderChest();document.dispatchEvent(new CustomEvent("salita:daily-quests-rendered"));}
  function ensureStyles(){if(document.getElementById("dailyQuestKeySystemStyles"))return;const style=document.createElement("style");style.id="dailyQuestKeySystemStyles";style.textContent=`
    .home-progress-stack{display:grid;gap:10px;margin:0 0 14px}.home-progress-stack .week-card,.home-progress-stack .player-card{margin:0!important}.home-progress-stack .week-card{padding:10px 12px!important;min-height:0!important}.home-progress-stack .week-card-head{display:none!important}.home-progress-stack .week-momentum{display:grid!important;grid-template-columns:repeat(7,minmax(0,1fr))!important;gap:6px!important;margin:0!important}.home-progress-stack .week-day{min-width:0!important;min-height:46px!important;padding:5px 2px!important;border-radius:12px!important;display:grid!important;place-items:center!important;gap:1px!important}.home-progress-stack .week-day span{font-size:1rem!important;line-height:1!important}.home-progress-stack .week-day small{font-size:.62rem!important;line-height:1!important}.home-progress-stack .player-card{padding:10px 14px!important;min-height:0!important;align-items:center!important}.home-progress-stack .player-copy>.eyebrow,.home-progress-stack #playerLevelSubtitle{display:none!important}.home-progress-stack .player-copy{gap:4px!important}.home-progress-stack .player-copy h3{margin:0!important}.home-progress-stack .player-avatar-wrap{transform:scale(.88);transform-origin:center}.home-progress-stack .player-xp-row,.home-progress-stack .player-xp-track{margin-top:2px!important}
    .daily-quest-navigable{cursor:pointer;position:relative;transition:transform .14s ease}.daily-quest-navigable:hover{transform:translateY(-1px)}.daily-quest-navigable:focus-visible{outline:3px solid rgba(11,111,103,.28);outline-offset:2px}.daily-quest-arrow{align-self:center;color:#0b6f67;font-size:1.5rem;font-weight:900;padding-left:8px}
    .daily-quest-collapse-toggle{appearance:none;border:1px solid rgba(11,111,103,.2);background:#f4faf7;color:#0b6f67;border-radius:999px;min-width:36px;height:36px;padding:0 10px;font:inherit;font-weight:900;cursor:pointer;display:inline-grid;place-items:center}.daily-quests-card.sq-quests-collapsed{padding-top:12px!important;padding-bottom:12px!important}.daily-quests-card.sq-quests-collapsed .daily-quest-list,.daily-quests-card.sq-quests-collapsed #questChest{display:none!important}.daily-quests-card.sq-quests-collapsed .quest-card-header{margin:0!important;align-items:center!important;min-height:40px!important}.daily-quests-card.sq-quests-collapsed .quest-card-header>div:first-child{display:flex!important;align-items:center!important;gap:10px!important;flex-wrap:wrap}.daily-quests-card.sq-quests-collapsed .quest-card-header .eyebrow,.daily-quests-card.sq-quests-collapsed .quest-card-header h3{margin:0!important}.daily-quests-card.sq-quests-collapsed .quest-card-header h3{font-size:1rem!important}.daily-quests-card.sq-quests-collapsed .quest-card-header p:not(.eyebrow){display:none!important}
    .daily-quests-card .calendar-detail-meter{display:grid!important;grid-template-columns:repeat(5,minmax(34px,1fr))!important;gap:12px!important;width:100%!important;max-width:380px!important;margin-top:12px!important}.daily-quests-card .calendar-detail-meter .weekly-key-slot{width:auto!important;min-width:34px!important;min-height:34px!important;margin:0!important;display:grid!important;place-items:center!important}
    @media(max-width:620px){.home-progress-stack{gap:8px;margin-bottom:10px}.home-progress-stack .week-card{padding:8px!important}.home-progress-stack .week-momentum{gap:4px!important}.home-progress-stack .week-day{min-height:42px!important;border-radius:10px!important}.home-progress-stack .player-card{padding:8px 10px!important}.daily-quest-collapse-toggle{height:32px;min-width:32px;padding:0 8px}.daily-quests-card .calendar-detail-meter{grid-template-columns:repeat(5,minmax(30px,1fr))!important;gap:9px!important;max-width:none!important}.daily-quests-card .calendar-detail-meter .weekly-key-slot{min-width:30px!important;min-height:32px!important}}
    @media(prefers-reduced-motion:reduce){.daily-quest-navigable{transition:none}.daily-quest-navigable:hover{transform:none}}
  `;document.head.appendChild(style);}

  function install(){
    try{if(typeof state==="undefined"||typeof DAILY_QUESTS==="undefined"||typeof ensureDailyActivity!=="function"||typeof questProgress!=="function"||typeof saveState!=="function"||typeof startSession!=="function"||typeof updateHome!=="function")return retry();}catch{return retry();}
    ensureStyles();configureQuests();
    claimDailyQuestRewards=claimRewards;
    renderDailyQuests=renderAll;
    const baseUpdateHome=updateHome;updateHome=function(){const result=baseUpdateHome.apply(this,arguments);renderAll();return result;};
    document.addEventListener("click",event=>{const action=event.target.closest("[data-calendar-week-action]");if(action){const type=action.dataset.calendarWeekAction;if(type==="open")claimWeeklyReward();else if(type==="view")openRewardModal(rewardById(currentClaim()?.rewardId));else if(type==="latest")openRewardModal(rewardById(latestClaim()?.rewardId));return;}const row=event.target.closest(".daily-quest[data-quest-navigation-id]");if(row&&!event.target.closest("button,a,select,input"))launchQuest(row.dataset.questNavigationId);});
    document.addEventListener("keydown",event=>{if(event.key!=="Enter"&&event.key!==" ")return;const row=event.target.closest(".daily-quest[data-quest-navigation-id]");if(!row)return;event.preventDefault();launchQuest(row.dataset.questNavigationId);});
    document.addEventListener("visibilitychange",()=>{if(!document.hidden&&homeVisible())scheduleKey(500);});window.addEventListener("pageshow",()=>{renderAll();if(homeVisible())scheduleKey(700);});
    grantTodayKey();renderAll();saveState();if(chestState().pendingKeyAwards.length)scheduleKey(700);
  }

  install();
})();
