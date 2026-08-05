(() => {
  "use strict";

  const root = typeof window !== "undefined" ? window : globalThis;
  const SCHEMA_VERSION = 1;
  const SHARD_REQUIREMENT = 100;
  const WEEKLY_SHARD_AWARDS = Object.freeze({common:100, uncommon:50, rare:25});
  const STARTER_IDS = Object.freeze(["anahaw", "orchid", "jade", "rafflesia"]);
  const LEGACY_IDS = Object.freeze(["tarsier", "eagle", "tamaraw", "peacock", "orchid", "jade", "rafflesia", "anahaw"]);
  const MANIFEST_PATH = "avatars/canonical/manifest.json";

  const records = [
    {id:"eagle",name:"Philippine Eagle",category:"animal",rarity:"rare",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/eagle.png"},
    {id:"tamaraw",name:"Tamaraw",category:"animal",rarity:"rare",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/tamaraw.png"},
    {id:"anahaw",name:"Anahaw",category:"plant",rarity:"starter",unlockSource:"starter",levelReward:null,shardRequirement:0,image:"avatars/canonical/anahaw.png"},
    {id:"peacock",name:"Palawan Peacock-Pheasant",category:"animal",rarity:"rare",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/peacock.png"},
    {id:"orchid",name:"Waling-Waling Orchid",category:"flower",rarity:"starter",unlockSource:"starter",levelReward:null,shardRequirement:0,image:"avatars/canonical/orchid.png"},
    {id:"jade",name:"Jade Vine",category:"flower",rarity:"starter",unlockSource:"starter",levelReward:null,shardRequirement:0,image:"avatars/canonical/jade.png"},
    {id:"rafflesia",name:"Philippine Rafflesia",category:"flower",rarity:"starter",unlockSource:"starter",levelReward:null,shardRequirement:0,image:"avatars/canonical/rafflesia.png"},
    {id:"tarsier",name:"Philippine Tarsier",category:"animal",rarity:"rare",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/tarsier.png"},
    {id:"narra",name:"Narra",category:"plant",rarity:"common",unlockSource:"level_or_weekly",levelReward:10,shardRequirement:100,image:"avatars/canonical/narra.png"},
    {id:"nipa_palm",name:"Nipa Palm",category:"plant",rarity:"common",unlockSource:"level_or_weekly",levelReward:20,shardRequirement:100,image:"avatars/canonical/nipa_palm.png"},
    {id:"buri_palm",name:"Buri Palm",category:"plant",rarity:"common",unlockSource:"level_or_weekly",levelReward:40,shardRequirement:100,image:"avatars/canonical/buri_palm.png"},
    {id:"almaciga",name:"Almaciga",category:"plant",rarity:"common",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/almaciga.png"},
    {id:"pandan",name:"Pandan",category:"plant",rarity:"common",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/pandan.png"},
    {id:"bakawan_mangrove",name:"Bakawan Mangrove",category:"plant",rarity:"common",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/bakawan_mangrove.png"},
    {id:"kawayang_tinik",name:"Kawayang Tinik",category:"plant",rarity:"common",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/kawayang_tinik.png"},
    {id:"pili",name:"Pili",category:"plant",rarity:"common",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/pili.png"},
    {id:"katmon",name:"Katmon Flower",category:"flower",rarity:"uncommon",unlockSource:"level_or_weekly",levelReward:30,shardRequirement:100,image:"avatars/canonical/katmon.png"},
    {id:"medinilla",name:"Medinilla Magnifica",category:"flower",rarity:"uncommon",unlockSource:"level_or_weekly",levelReward:80,shardRequirement:100,image:"avatars/canonical/medinilla.png"},
    {id:"philippine_teak",name:"Philippine Teak Blossom",category:"flower",rarity:"uncommon",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/philippine_teak.png"},
    {id:"banaba",name:"Banaba Flower",category:"flower",rarity:"uncommon",unlockSource:"level_or_weekly",levelReward:60,shardRequirement:100,image:"avatars/canonical/banaba.png"},
    {id:"mangkono",name:"Mangkono Blossom",category:"flower",rarity:"uncommon",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/mangkono.png"},
    {id:"attenborough_pitcher",name:"Attenborough's Pitcher Plant",category:"botanical",rarity:"uncommon",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/attenborough_pitcher.png"},
    {id:"slipper_orchid",name:"Philippine Slipper Orchid",category:"flower",rarity:"uncommon",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/slipper_orchid.png"},
    {id:"philippine_hoya",name:"Philippine Hoya",category:"flower",rarity:"uncommon",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/philippine_hoya.png"},
    {id:"parol",name:"Parol",category:"object",rarity:"uncommon",unlockSource:"level_or_weekly",levelReward:50,shardRequirement:100,image:"avatars/canonical/parol.png"},
    {id:"vinta",name:"Vinta",category:"object",rarity:"uncommon",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/vinta.png"},
    {id:"kulintang",name:"Kulintang",category:"object",rarity:"uncommon",unlockSource:"level_or_weekly",levelReward:90,shardRequirement:100,image:"avatars/canonical/kulintang.png"},
    {id:"bangka",name:"Bangka",category:"object",rarity:"uncommon",unlockSource:"level_or_weekly",levelReward:70,shardRequirement:100,image:"avatars/canonical/bangka.png"},
    {id:"jeepney",name:"Jeepney",category:"object",rarity:"uncommon",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/jeepney.png"},
    {id:"bahay_kubo",name:"Bahay Kubo",category:"object",rarity:"uncommon",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/bahay_kubo.png"},
    {id:"sarimanok",name:"Sarimanok",category:"object",rarity:"uncommon",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/sarimanok.png"},
    {id:"golden_salita_crest",name:"Golden Salita Crest",category:"special",rarity:"special",unlockSource:"level_99",levelReward:99,shardRequirement:0,image:"avatars/canonical/golden_salita_crest.png"},
    {id:"philippine_pangolin",name:"Philippine Pangolin",category:"animal",rarity:"rare",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/philippine_pangolin.png"},
    {id:"visayan_spotted_deer",name:"Visayan Spotted Deer",category:"animal",rarity:"rare",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/visayan_spotted_deer.png"},
    {id:"visayan_warty_pig",name:"Visayan Warty Pig",category:"animal",rarity:"rare",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/visayan_warty_pig.png"},
    {id:"philippine_crocodile",name:"Philippine Crocodile",category:"animal",rarity:"rare",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/philippine_crocodile.png"},
    {id:"philippine_forest_turtle",name:"Philippine Forest Turtle",category:"animal",rarity:"rare",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/philippine_forest_turtle.png"},
    {id:"philippine_sailfin_lizard",name:"Philippine Sailfin Lizard",category:"animal",rarity:"rare",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/philippine_sailfin_lizard.png"},
    {id:"golden_crowned_flying_fox",name:"Giant Golden-Crowned Flying Fox",category:"animal",rarity:"rare",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/golden_crowned_flying_fox.png"},
    {id:"philippine_colugo",name:"Philippine Colugo",category:"animal",rarity:"rare",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/philippine_colugo.png"},
    {id:"philippine_cockatoo",name:"Philippine Cockatoo",category:"animal",rarity:"rare",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/philippine_cockatoo.png"},
    {id:"rufous_hornbill",name:"Rufous Hornbill",category:"animal",rarity:"rare",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/rufous_hornbill.png"},
    {id:"luzon_bleeding_heart_dove",name:"Luzon Bleeding-Heart Dove",category:"animal",rarity:"rare",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/luzon_bleeding_heart_dove.png"},
    {id:"cebu_flowerpecker",name:"Cebu Flowerpecker",category:"animal",rarity:"rare",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/cebu_flowerpecker.png"},
    {id:"philippine_eagle_owl",name:"Philippine Eagle-Owl",category:"animal",rarity:"rare",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/philippine_eagle_owl.png"},
    {id:"whale_shark_butanding",name:"Whale Shark / Butanding",category:"animal",rarity:"rare",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/whale_shark_butanding.png"},
    {id:"dugong",name:"Dugong",category:"animal",rarity:"rare",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/dugong.png"},
    {id:"hawksbill_sea_turtle",name:"Hawksbill Sea Turtle",category:"animal",rarity:"rare",unlockSource:"weekly_keys",levelReward:null,shardRequirement:100,image:"avatars/canonical/hawksbill_sea_turtle.png"}
  ];

  const aliases = Object.freeze({
    "philippine_eagle":"eagle",
    "philippine_tarsier":"tarsier",
    "palawan_peacock_pheasant":"peacock",
    "waling_waling":"orchid",
    "waling_waling_orchid":"orchid",
    "jade_vine":"jade",
    "philippine_rafflesia":"rafflesia",
    "nipa":"nipa_palm",
    "buri":"buri_palm",
    "bakawan":"bakawan_mangrove",
    "philippine_teak_blossom":"philippine_teak",
    "attenborough_pitcher_plant":"attenborough_pitcher",
    "luzon_bleeding_heart":"luzon_bleeding_heart_dove",
    "whale_shark":"whale_shark_butanding",
    "butanding":"whale_shark_butanding",
    "hawksbill_turtle":"hawksbill_sea_turtle"
  });

  function slug(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  const catalogue = Object.freeze(records.map((item, index) => Object.freeze({...item, order:index})));
  const byId = Object.freeze(Object.fromEntries(catalogue.map(item => [item.id, item])));

  function normaliseId(value) {
    const key = slug(value);
    return aliases[key] || key;
  }

  function get(value) {
    return byId[normaliseId(value)] || null;
  }

  function list(filters = {}) {
    return catalogue.filter(item => Object.entries(filters).every(([key, value]) => value == null || item[key] === value));
  }

  function weeklyShardAward(value) {
    const item = get(value);
    const rarity = item ? item.rarity : String(value || "");
    return WEEKLY_SHARD_AWARDS[rarity] || 0;
  }

  function cleanIds(values) {
    return [...new Set((Array.isArray(values) ? values : []).map(normaliseId).filter(id => Boolean(byId[id])))];
  }

  function cleanShards(values) {
    const result = {};
    if (!values || typeof values !== "object") return result;
    for (const [rawId, rawAmount] of Object.entries(values)) {
      const id = normaliseId(rawId);
      const item = byId[id];
      if (!item || item.shardRequirement === 0) continue;
      result[id] = Math.max(0, Math.min(item.shardRequirement, Math.floor(Number(rawAmount) || 0)));
    }
    return result;
  }

  function normaliseCollectionState(input = {}, fallbackAvatarId = "") {
    const source = input && typeof input === "object" ? input : {};
    const fallback = normaliseId(source.equippedAvatarId || fallbackAvatarId);
    const ownedAvatarIds = cleanIds(source.ownedAvatarIds);
    if (fallback && byId[fallback] && !ownedAvatarIds.includes(fallback)) ownedAvatarIds.push(fallback);

    const shards = cleanShards(source.shards);
    for (const id of ownedAvatarIds) {
      const item = byId[id];
      if (item?.shardRequirement) shards[id] = item.shardRequirement;
    }

    const equippedAvatarId = fallback && byId[fallback] ? fallback : null;
    return {
      version:SCHEMA_VERSION,
      equippedAvatarId,
      ownedAvatarIds,
      shards,
      pendingUnlocks:Array.isArray(source.pendingUnlocks)
        ? source.pendingUnlocks.filter(entry => get(entry?.avatarId)).map(entry => ({...entry, avatarId:normaliseId(entry.avatarId)}))
        : [],
      levelRewardsClaimed:[...new Set((Array.isArray(source.levelRewardsClaimed) ? source.levelRewardsClaimed : [])
        .map(Number).filter(level => Number.isInteger(level) && level >= 1 && level <= 99))],
      needsStarterChoice:source.needsStarterChoice == null ? !equippedAvatarId : Boolean(source.needsStarterChoice)
    };
  }

  function progress(value, state = {}) {
    const item = get(value);
    if (!item) return null;
    const collection = normaliseCollectionState(state);
    const owned = collection.ownedAvatarIds.includes(item.id);
    const shards = owned ? item.shardRequirement : Math.max(0, Number(collection.shards[item.id]) || 0);
    const percent = item.shardRequirement === 0
      ? (owned ? 100 : 0)
      : Math.min(100, Math.round(shards / item.shardRequirement * 100));
    return Object.freeze({avatarId:item.id, owned, shards, required:item.shardRequirement, percent});
  }

  const levelRewards = Object.freeze(Object.fromEntries(
    catalogue.filter(item => item.levelReward).map(item => [item.levelReward, item.id])
  ));

  root.SalitaAvatarCatalogue = catalogue;
  root.SalitaAvatarModel = Object.freeze({
    version:SCHEMA_VERSION,
    manifestPath:MANIFEST_PATH,
    catalogue,
    byId,
    aliases,
    starterIds:STARTER_IDS,
    legacyIds:LEGACY_IDS,
    weeklyShardAwards:WEEKLY_SHARD_AWARDS,
    levelRewards,
    normaliseId,
    get,
    list,
    weeklyShardAward,
    normaliseCollectionState,
    progress
  });
})();
