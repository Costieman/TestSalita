(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestTranslationGlossCompletionV2";
  if (window[INSTALL_FLAG]) return;
  window[INSTALL_FLAG] = true;

  const PLACEHOLDERS = new Set([
    "part of the expression",
    "part-of-the-expression",
    "expression part",
    "grammar component",
    "component of the expression",
    "translation pending content review",
    "direct component",
    "see phrase translation",
    "meaning unavailable"
  ]);

  const CURATED_GLOSSES = {
    bukas: "tomorrow / open", ngayon: "now", mamaya: "later", kanina: "earlier", kahapon: "yesterday",
    kailan: "when", saan: "where", sino: "who", ano: "what", bakit: "why", paano: "how",
    oo: "yes", opo: "yes, respectfully", hindi: "no / not", po: "respect marker", ho: "respect marker",
    ang: "subject/topic marker", ng: "object / possessive marker", "-ng": "linker", mga: "plural marker", sa: "at / in / to",
    si: "personal-name marker", sina: "plural personal-name marker", ako: "I / me", ko: "my / by me",
    ka: "you", ikaw: "you", mo: "your / you", siya: "he / she / they (singular)",
    niya: "his / her / by him or her", kami: "we, excluding you", tayo: "we, including you",
    namin: "our, excluding you", natin: "our, including you", kayo: "you, plural or respectful",
    nila: "their / by them", ito: "this", iyan: "that, near you", iyon: "that, over there",
    dito: "here", diyan: "there, near you", doon: "there, over there",
    at: "and", o: "or", pero: "but", dahil: "because", para: "for / so that", naman: "in turn / softener",
    rin: "also / too", din: "also / too", lang: "only / just", lamang: "only / just", na: "already / now / linker",
    pa: "still / yet / more", ba: "question marker", daw: "reportedly / they say", raw: "reportedly / they say",
    pala: "realization marker", yata: "perhaps / apparently", muna: "for now / first", gusto: "want / like",
    ayaw: "do not want / dislike", may: "there is / have", mayroon: "there is / have", wala: "none / there is not",
    maraming: "many", konti: "few / a little", salamat: "thanks", kumusta: "hello / how are things",
    maayong: "good + linker", adlaw: "day", ug: "and", dili: "no / not", asa: "where", unsa: "what",
    kinsa: "who", "kanus-a": "when", nganong: "why", giunsa: "how", kamo: "you, plural",
    sila: "they", karon: "now", ugma: "tomorrow", gahapon: "yesterday", unya: "later / then"
  };

  function normalize(value) {
    return String(value ?? "")
      .normalize("NFKC")
      .replace(/[‘’`´]/g, "'")
      .replace(/[‐‑‒–—]/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .toLocaleLowerCase();
  }

  function key(value) {
    return normalize(value)
      .replace(/^[-'"“”.,!?;:()[\]{}]+|[-'"“”.,!?;:()[\]{}]+$/g, "")
      .replace(/\s+/g, " ");
  }

  function isPlaceholder(value) {
    return PLACEHOLDERS.has(normalize(value));
  }

  function isSingleLexicalItem(value) {
    const cleaned = key(value);
    return Boolean(cleaned) && !/\s/.test(cleaned) && !cleaned.includes("___");
  }

  function addGloss(map, source, gloss, overwrite = false) {
    const sourceKey = key(source);
    const cleaned = String(gloss ?? "").trim();
    if (!sourceKey || !cleaned || isPlaceholder(cleaned)) return;
    if (overwrite || !map.has(sourceKey)) map.set(sourceKey, cleaned);
  }

  function addLinkedVariants(glossary) {
    const entries = [...glossary.entries()];
    entries.forEach(([source, gloss]) => {
      if (!source || /[\s-]/.test(source)) return;
      if (/[aeiou]$/.test(source)) addGloss(glossary, `${source}ng`, `${gloss} + linker`);
      if (/n$/.test(source)) addGloss(glossary, `${source}g`, `${gloss} + linker`);
    });
  }

  function buildGlossary() {
    const glossary = new Map();
    Object.entries(CURATED_GLOSSES).forEach(([source, gloss]) => addGloss(glossary, source, gloss, true));

    if (typeof ITEMS !== "undefined" && Array.isArray(ITEMS)) {
      ITEMS.forEach(item => {
        if (isSingleLexicalItem(item?.term) && item?.meaning) addGloss(glossary, item.term, item.meaning);
        if (isSingleLexicalItem(item?.example) && item?.natural) addGloss(glossary, item.example, item.natural);

        const tokens = item?.analysis?.tokens;
        if (Array.isArray(tokens)) {
          tokens.forEach(token => {
            if (Array.isArray(token) && token.length > 1) addGloss(glossary, token[0], token[1]);
          });
        }
      });
    }

    addLinkedVariants(glossary);
    return glossary;
  }

  function componentGloss(source, glossary) {
    const sourceKey = key(source);
    if (!sourceKey) return "";
    if (glossary.has(sourceKey)) return glossary.get(sourceKey);

    const noHyphen = sourceKey.replace(/-/g, "");
    if (noHyphen !== sourceKey && glossary.has(noHyphen)) return glossary.get(noHyphen);

    const pieces = sourceKey.split(/[\s-]+/).filter(Boolean);
    if (pieces.length > 1) {
      const glosses = pieces.map(piece => glossary.get(piece) || "");
      if (glosses.every(Boolean)) return glosses.join(" + ");
    }

    return "";
  }

  function completeSourceTokens() {
    const glossary = buildGlossary();
    if (typeof ITEMS !== "undefined" && Array.isArray(ITEMS)) {
      ITEMS.forEach(item => {
        const tokens = item?.analysis?.tokens;
        if (!Array.isArray(tokens)) return;
        tokens.forEach(token => {
          if (!Array.isArray(token) || token.length < 2 || !isPlaceholder(token[1])) return;
          const replacement = componentGloss(token[0], glossary)
            || (tokens.length === 1 ? String(item.meaning || "").trim() : "");
          if (replacement) {
            token[1] = replacement;
            addGloss(glossary, token[0], replacement, true);
          }
        });
      });
    }
    return glossary;
  }

  function sourceFromRow(row, placeholderNode) {
    const explicit = row?.dataset?.token || row?.getAttribute?.("data-source-token");
    if (explicit) return explicit;

    for (const selector of [
      ".analysis-source", ".token-source", ".breakdown-token", ".token", ".word",
      "strong", "b", "dt", "th", "td:first-child", "span:first-child"
    ]) {
      const candidate = row?.querySelector?.(selector);
      const text = candidate?.textContent?.trim();
      if (text && !isPlaceholder(text) && candidate !== placeholderNode?.parentElement) return text;
    }
    return "";
  }

  function bestGloss(row, source, glossary) {
    const direct = componentGloss(source, glossary);
    if (direct) return direct;

    const rowText = key(row?.textContent || "");
    return [...glossary.entries()]
      .filter(([token]) => token && rowText.includes(token))
      .sort((a, b) => b[0].length - a[0].length)[0]?.[1] || "";
  }

  function auditWordBank(glossary) {
    const unresolved = [];
    if (typeof ITEMS !== "undefined" && Array.isArray(ITEMS)) {
      ITEMS.forEach(item => {
        const tokens = item?.analysis?.tokens;
        if (!Array.isArray(tokens)) return;
        tokens.forEach(token => {
          if (!Array.isArray(token) || !token[0]) return;
          const gloss = token[1];
          if (!gloss || isPlaceholder(gloss) || !componentGloss(token[0], glossary)) {
            unresolved.push({itemId: item.id, token: token[0], gloss: gloss || ""});
          }
        });
      });
    }
    window.SalitaQuestGlossAudit = Object.freeze({unresolved, count: unresolved.length});
    if (unresolved.length) console.warn("Unresolved word-bank glosses", unresolved);
    return unresolved;
  }

  function patchRenderedTranslations(root = document) {
    const glossary = completeSourceTokens();
    auditWordBank(glossary);
    if (!root || !document.createTreeWalker) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const pending = [];
    while (walker.nextNode()) {
      if (isPlaceholder(walker.currentNode.nodeValue)) pending.push(walker.currentNode);
    }

    pending.forEach(node => {
      const row = node.parentElement?.closest(
        "[data-token], [data-source-token], .token-row, .breakdown-row, li, tr, .analysis-token, .word-analysis, .word-bubble"
      );
      const source = sourceFromRow(row, node);
      const gloss = bestGloss(row, source, glossary);

      if (gloss) {
        node.nodeValue = gloss;
        row?.classList.remove("sq-translation-review-needed");
        return;
      }

      console.error("Missing direct translation gloss", {source, row});
      node.nodeValue = source || "Translation missing";
      row?.classList.add("sq-translation-review-needed");
    });
  }

  let queued = false;
  function schedule(root = document) {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      patchRenderedTranslations(root);
    });
  }

  completeSourceTokens();
  new MutationObserver(records => {
    if (records.some(record => record.addedNodes.length || record.type === "characterData")) schedule(document);
  }).observe(document.documentElement, {subtree: true, childList: true, characterData: true});

  document.addEventListener("DOMContentLoaded", () => schedule(document), {once: true});
  document.addEventListener("salita:exercise-rendered", () => schedule(document));
  document.addEventListener("salita:answer-rendered", () => schedule(document));
  schedule(document);
})();
