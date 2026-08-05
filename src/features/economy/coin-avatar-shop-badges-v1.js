(() => {
  "use strict";

  const API = "SalitaCoinShopBadgeFamilyV1";
  if (window[API]) return;
  let installed = false;

  const chain = (runtime,key,targets,meta,current) => targets.map((target,index) => ({
    id:`shop_${key}_${target}`,
    icon:meta.icon,
    name:index === targets.length - 1 ? `${meta.family}: Master` : `${meta.family}: ${target.toLocaleString()}`,
    description:meta.description.replace("{n}",target.toLocaleString()),
    category:meta.category,
    rarity:index === targets.length - 1 ? "legendary" : index >= Math.ceil(targets.length * .65) ? "epic" : index >= Math.ceil(targets.length * .35) ? "rare" : "common",
    target,
    current,
    test:()=>current() >= target,
    unlockTest:()=>index === 0 || current() >= targets[index - 1],
    image:`badges/shop_${key}_${target}.png`
  }));

  const completion = (runtime,rarity,name,icon) => ({
    id:`shop_${rarity}_all`,
    icon,
    name:`All ${name} Avatars`,
    description:`Collect all ${runtime.totalCount(rarity)} ${name.toLowerCase()} avatars`,
    category:"Collection",
    rarity:"legendary",
    target:1,
    current:()=>runtime.totalCount(rarity) > 0 && runtime.ownedCount(rarity) >= runtime.totalCount(rarity) ? 1 : 0,
    test:()=>runtime.totalCount(rarity) > 0 && runtime.ownedCount(rarity) >= runtime.totalCount(rarity),
    unlockTest:()=>runtime.ownedCount(rarity) >= Math.max(1,Math.floor(runtime.totalCount(rarity) / 2)),
    image:`badges/shop_${rarity}_all.png`
  });

  function definitions(runtime) {
    return [
      ...chain(runtime,"coins_spent",[1000,5000,10000,25000,50000,100000],{icon:"🛍️",family:"Coin Shopper",description:"Spend {n} coins in the shard shop",category:"Rewards"},()=>runtime.economyMetric("lifetimeSpent")),
      ...chain(runtime,"packs",[1,5,10,25,50,100],{icon:"🧩",family:"Shard Pack Hunter",description:"Purchase {n} avatar shard packs",category:"Collection"},()=>runtime.economyMetric("shardPacksPurchased")),
      ...chain(runtime,"common_owned",[1,5,12],{icon:"🌿",family:"Common Collector",description:"Collect {n} common avatars",category:"Collection"},()=>runtime.ownedCount("common")),
      ...chain(runtime,"uncommon_owned",[1,5,10,15],{icon:"🌺",family:"Uncommon Collector",description:"Collect {n} uncommon avatars",category:"Collection"},()=>runtime.ownedCount("uncommon")),
      ...chain(runtime,"rare_owned",[1,5,10,15,20],{icon:"🦅",family:"Rare Collector",description:"Collect {n} rare avatars",category:"Collection"},()=>runtime.ownedCount("rare")),
      completion(runtime,"common","Common","🌿"),
      completion(runtime,"uncommon","Uncommon","🌺"),
      completion(runtime,"rare","Rare","🦅")
    ];
  }

  function install(runtime = window.SalitaCoinShopBadgeRuntimeV1) {
    if (installed) return true;
    if (!runtime?.ready?.()) return false;
    runtime.remove(new Set(["lt_coins_500000","lt_coins_1000000"]));
    const total = runtime.register(definitions(runtime));
    runtime.refresh({bootstrap:true});
    runtime.announce(total);
    installed = true;
    return true;
  }

  window[API] = Object.freeze({install, definitions});
})();
