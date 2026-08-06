(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestPromptDistinctionClarityV1";
  if (window[INSTALL_FLAG]) return;
  window[INSTALL_FLAG] = true;

  const normalise = value => String(value || "")
    .normalize("NFKC")
    .replace(/[“”‘’]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase();

  const hasQualifier = (text, words) => words.some(word => normalise(text).includes(word));

  function tokenSet(item) {
    const tokens = item?.analysis?.tokens;
    if (!Array.isArray(tokens)) return new Set();
    return new Set(tokens
      .filter(token => Array.isArray(token) && token.length)
      .map(token => normalise(token[0]).replace(/[.,!?]/g, "").replace(/-ng$/g, "ng")));
  }

  function appendQualifier(text, qualifier) {
    const value = String(text || "").trim();
    if (!value || normalise(value).includes(normalise(qualifier))) return value;
    return `${value} (${qualifier})`;
  }

  function clarifyItem(item) {
    const tokens = tokenSet(item);
    if (!tokens.size) return;

    let meaning = String(item.meaning || "").trim();
    let natural = String(item.natural || meaning).trim();
    const english = normalise(`${meaning} ${natural}`);

    if ((tokens.has("po") || tokens.has("opo")) && !hasQualifier(english, ["respect", "politely", "formal"])) {
      meaning = appendQualifier(meaning, "respectfully");
      natural = appendQualifier(natural, "respectfully");
    }

    if (tokens.has("kayo") && english.includes("you") && !hasQualifier(english, ["plural", "several", "respectful"])) {
      meaning = appendQualifier(meaning, "several people / respectfully");
      natural = appendQualifier(natural, "several people / respectfully");
    } else if ((tokens.has("ka") || tokens.has("ikaw")) && english.includes("you") && !hasQualifier(english, ["one person", "singular"])) {
      meaning = appendQualifier(meaning, "one person");
      natural = appendQualifier(natural, "one person");
    }

    if ((tokens.has("kami") || tokens.has("namin")) && /\b(we|us|our)\b/.test(english) && !hasQualifier(english, ["excluding you", "exclusive"])) {
      meaning = appendQualifier(meaning, "excluding the listener");
      natural = appendQualifier(natural, "excluding the listener");
    }

    if ((tokens.has("tayo") || tokens.has("natin")) && /\b(we|us|our)\b/.test(english) && !hasQualifier(english, ["including you", "inclusive"])) {
      meaning = appendQualifier(meaning, "including the listener");
      natural = appendQualifier(natural, "including the listener");
    }

    const demonstratives = [
      {tokens:["ito", "dito"], qualifier:"near the speaker", known:["near me", "near the speaker", "here"]},
      {tokens:["iyan", "diyan"], qualifier:"near the listener", known:["near you", "near the listener"]},
      {tokens:["iyon", "doon"], qualifier:"away from both speaker and listener", known:["over there", "far", "away from both"]}
    ];

    demonstratives.forEach(rule => {
      if (!rule.tokens.some(token => tokens.has(token))) return;
      if (!/\b(this|that|here|there)\b/.test(english) || hasQualifier(english, rule.known)) return;
      meaning = appendQualifier(meaning, rule.qualifier);
      natural = appendQualifier(natural, rule.qualifier);
    });

    item.meaning = meaning;
    item.natural = natural;
  }

  function audit() {
    if (typeof ITEMS === "undefined" || !Array.isArray(ITEMS)) return false;
    ITEMS.forEach(clarifyItem);

    const grouped = new Map();
    ITEMS.forEach(item => {
      const key = normalise(item.meaning).replace(/\([^)]*\)/g, "").trim();
      if (!key) return;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(item);
    });

    window.SalitaQuestPromptDistinctionAudit = [...grouped.entries()]
      .filter(([, items]) => items.length > 1)
      .map(([meaning, items]) => ({meaning, items: items.map(item => ({id:item.id, term:item.term, meaning:item.meaning}))}));
    return true;
  }

  audit();
  document.addEventListener("salita:exercise-rendered", audit);
  document.addEventListener("DOMContentLoaded", audit, {once:true});
})();
