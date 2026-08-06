(() => {
  "use strict";
  if (window.__salitaCoinAvatarShopBadgesV1Installed) return;
  window.__salitaCoinAvatarShopBadgesV1Installed = true;

  const globalValue = name => { try { return eval(`typeof ${name} !== "undefined" ? ${name} : undefined`); } catch { return undefined; } };
  const state = () => globalValue("state") || window.state || {};
  const badges = () => globalValue("BADGES") || window.BADGES || null;
  const n = value => Math.max(0,Math.floor(Number(value || 0)));
  const economy = () => state().coinEconomy || {};
  const ownedByRarity = rarity => {
    try {
      const id = sessionStorage.getItem("salitaQuestActiveProfileId");
      const store = JSON.parse(localStorage.getItem("salitaQuestLocalProfilesV1") || "null");
      const profile = store?.profiles?.find(item => item.id === id);
      const owned = new Set(profile?.avatarCollection?.ownedAvatarIds || []);
      return window.SalitaAvatarModel?.list({rarity}).filter(item => owned.has(item.id)).length || 0;
    } catch { return 0; }
  };
  const totalByRarity = rarity => window.SalitaAvatarModel?.list({rarity}).length || 0;
  const chain = (key,targets,meta,current) => targets.map((target,index) => ({
    id:`shop_${key}_${target}`,icon:meta.icon,name:index === targets.length-1 ? `${meta.family}: Master` : `${meta.family}: ${target.toLocaleString()}`,
    description:meta.description.replace("{n}",target.toLocaleString()),category:meta.category,
    rarity:index === targets.length-1 ? "legendary" : index >= Math.ceil(targets.length*.65) ? "epic" : index >= Math.ceil(targets.length*.35) ? "rare" : "common",
    target,current,test:()=>current()>=target,unlockTest:()=>index===0 || current()>=targets[index-1],image:`badges/shop_${key}_${target}.png`
  }));
  const completion = (rarity,name,icon) => ({
    id:`shop_${rarity}_all`,icon,name:`All ${name} Avatars`,description:`Collect all ${totalByRarity(rarity)} ${name.toLowerCase()} avatars`,category:"Collection",rarity:"legendary",target:1,
    current:()=>totalByRarity(rarity)>0 && ownedByRarity(rarity)>=totalByRarity(rarity)?1:0,
    test:()=>totalByRarity(rarity)>0 && ownedByRarity(rarity)>=totalByRarity(rarity),
    unlockTest:()=>ownedByRarity(rarity)>=Math.max(1,Math.floor(totalByRarity(rarity)/2)),image:`badges/shop_${rarity}_all.png`
  });

  function install() {
    const list = badges();
    if (!Array.isArray(list) || !window.SalitaAvatarModel || !state()) { setTimeout(install,120); return; }
    const obsolete = new Set(["lt_coins_500000","lt_coins_1000000"]);
    for (let index=list.length-1;index>=0;index--) if (obsolete.has(list[index].id)) list.splice(index,1);
    const additions = [
      ...chain("coins_spent",[1000,5000,10000,25000,50000,100000],{icon:"🛍️",family:"Coin Shopper",description:"Spend {n} coins in the shard shop",category:"Rewards"},()=>n(economy().lifetimeSpent)),
      ...chain("packs",[1,5,10,25,50,100],{icon:"🧩",family:"Shard Pack Hunter",description:"Purchase {n} avatar shard packs",category:"Collection"},()=>n(economy().shardPacksPurchased)),
      ...chain("common_owned",[1,5,12],{icon:"🌿",family:"Common Collector",description:"Collect {n} common avatars",category:"Collection"},()=>ownedByRarity("common")),
      ...chain("uncommon_owned",[1,5,10,15],{icon:"🌺",family:"Uncommon Collector",description:"Collect {n} uncommon avatars",category:"Collection"},()=>ownedByRarity("uncommon")),
      ...chain("rare_owned",[1,5,10,15,20],{icon:"🦅",family:"Rare Collector",description:"Collect {n} rare avatars",category:"Collection"},()=>ownedByRarity("rare")),
      completion("common","Common","🌿"),completion("uncommon","Uncommon","🌺"),completion("rare","Rare","🦅")
    ];
    const ids = new Set(list.map(item=>item.id));
    list.push(...additions.filter(item=>!ids.has(item.id)));
    try { (globalValue("syncEarned") || window.syncEarned)?.({bootstrap:true}); (globalValue("renderCatalogue") || window.renderCatalogue)?.(); } catch {}
    document.dispatchEvent(new CustomEvent("salita:coin-shop-badges-ready",{detail:{total:list.length}}));
  }
  install();
})();