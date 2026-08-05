(() => {
  "use strict";

  if (window.__salitaMysteryRarityRollV1Installed) return;
  window.__salitaMysteryRarityRollV1Installed = true;

  const sleep = ms => new Promise(resolve => window.setTimeout(resolve, ms));
  const RARITIES = [
    {id:"common", label:"COMMON", odds:"40%", icon:"◆"},
    {id:"uncommon", label:"UNCOMMON", odds:"35%", icon:"✦"},
    {id:"rare", label:"RARE", odds:"25%", icon:"★"}
  ];

  const style = document.createElement("style");
  style.textContent = `
    .sq-rarity-roll-stage{position:absolute;inset:0;z-index:8;display:grid;align-content:center;justify-items:center;gap:14px;padding:28px;border-radius:inherit;background:radial-gradient(circle at 50% 34%,#fffdf0 0 18%,#efe3aa 46%,#8a6b24 100%);overflow:hidden}
    .sq-rarity-roll-stage[hidden]{display:none!important}
    .sq-rarity-roll-stage::before{content:"";position:absolute;inset:-35%;background:conic-gradient(from 0deg,transparent,rgba(255,255,255,.62),transparent 28%,rgba(255,240,161,.5),transparent 58%);animation:sq-rarity-spin 1.25s linear infinite}
    .sq-rarity-roll-copy,.sq-rarity-roll-options,.sq-rarity-roll-result{position:relative;z-index:1}
    .sq-rarity-roll-copy{display:grid;gap:4px;text-align:center}.sq-rarity-roll-copy small{font-size:.7rem;font-weight:950;letter-spacing:.18em;color:#654b12}.sq-rarity-roll-copy strong{font-size:clamp(1.35rem,5vw,2rem);color:#2f2715}
    .sq-rarity-roll-options{width:min(430px,92%);display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
    .sq-rarity-roll-option{display:grid;justify-items:center;gap:3px;padding:12px 6px;border:2px solid rgba(255,255,255,.5);border-radius:15px;background:rgba(255,255,255,.55);opacity:.48;transform:scale(.94);transition:transform .12s ease,opacity .12s ease,box-shadow .12s ease,background .12s ease}
    .sq-rarity-roll-option b{font-size:1.2rem}.sq-rarity-roll-option strong{font-size:.7rem;letter-spacing:.06em}.sq-rarity-roll-option small{font-size:.64rem;font-weight:900}
    .sq-rarity-roll-option[data-rarity="common"]{color:#286884}.sq-rarity-roll-option[data-rarity="uncommon"]{color:#9d4141}.sq-rarity-roll-option[data-rarity="rare"]{color:#317239}
    .sq-rarity-roll-option.is-active{opacity:1;transform:scale(1.08);background:#fff;box-shadow:0 12px 28px rgba(64,45,5,.28),0 0 0 4px rgba(255,255,255,.34)}
    .sq-rarity-roll-result{min-height:28px;font-size:.82rem;font-weight:900;color:#4b3910;text-align:center}
    .sq-rarity-roll-stage.is-landed{animation:sq-rarity-land .52s ease both}.sq-rarity-roll-stage.is-landed .sq-rarity-roll-option:not(.is-active){opacity:.16;transform:scale(.88)}
    .sq-rarity-roll-stage[data-landed="common"]{background:radial-gradient(circle at 50% 34%,#edfaff 0 18%,#9bd2e9 50%,#286884 100%)}
    .sq-rarity-roll-stage[data-landed="uncommon"]{background:radial-gradient(circle at 50% 34%,#fff3f3 0 18%,#e9a7a7 50%,#8e3636 100%)}
    .sq-rarity-roll-stage[data-landed="rare"]{background:radial-gradient(circle at 50% 34%,#f1fff1 0 18%,#9cd6a0 50%,#2f6f38 100%)}
    .sq-rarity-roll-stage.is-landed .sq-rarity-roll-copy small,.sq-rarity-roll-stage.is-landed .sq-rarity-roll-copy strong,.sq-rarity-roll-stage.is-landed .sq-rarity-roll-result{color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.28)}
    @keyframes sq-rarity-spin{to{transform:rotate(360deg)}}
    @keyframes sq-rarity-land{0%{transform:scale(.97)}55%{transform:scale(1.025)}100%{transform:scale(1)}}
    @media(max-width:520px){.sq-rarity-roll-stage{padding:20px 12px}.sq-rarity-roll-options{gap:5px}.sq-rarity-roll-option{padding:10px 3px}.sq-rarity-roll-option strong{font-size:.59rem}}
    @media(prefers-reduced-motion:reduce){.sq-rarity-roll-stage::before{animation:none}.sq-rarity-roll-option,.sq-rarity-roll-stage.is-landed{transition:none;animation:none}}
  `;
  document.head.appendChild(style);

  function imagePath(item) {
    return window.SalitaAvatarArtwork?.getAvatarImagePath?.(item.id) || item.image || `avatars/canonical/${item.id}.png`;
  }

  function showCandidate(host, item) {
    if (!item) return;
    const src = imagePath(item);
    const base = host.querySelector(".sq-coin-reveal-base");
    const colour = host.querySelector(".sq-coin-reveal-colour img");
    if (base) { base.src = src; base.alt = item.name || "Random avatar"; }
    if (colour) { colour.src = src; colour.alt = ""; }
    const name = host.querySelector(".sq-coin-reveal-name");
    if (name) name.textContent = item.name || item.id;
  }

  function ensureStage(host) {
    const card = host.querySelector(".sq-coin-reveal");
    let stage = card?.querySelector(".sq-rarity-roll-stage");
    if (stage || !card) return stage;
    stage = document.createElement("div");
    stage.className = "sq-rarity-roll-stage";
    stage.hidden = true;
    stage.innerHTML = `
      <div class="sq-rarity-roll-copy"><small>MYSTERY PACK ODDS</small><strong>Rolling rarity…</strong></div>
      <div class="sq-rarity-roll-options">
        ${RARITIES.map(item => `<div class="sq-rarity-roll-option" data-rarity="${item.id}"><b>${item.icon}</b><strong>${item.label}</strong><small>${item.odds}</small></div>`).join("")}
      </div>
      <div class="sq-rarity-roll-result">The rarity determines which avatar pool is used.</div>`;
    card.appendChild(stage);
    return stage;
  }

  function activate(stage, rarity) {
    stage.querySelectorAll(".sq-rarity-roll-option").forEach(option => option.classList.toggle("is-active", option.dataset.rarity === rarity));
  }

  async function rarityRoll(host, finalRarity, reduced) {
    const stage = ensureStage(host);
    if (!stage) return;
    stage.hidden = false;
    stage.classList.remove("is-landed");
    stage.removeAttribute("data-landed");
    stage.querySelector(".sq-rarity-roll-copy strong").textContent = "Rolling rarity…";
    stage.querySelector(".sq-rarity-roll-result").textContent = "40% Common · 35% Uncommon · 25% Rare";

    if (reduced) {
      activate(stage, finalRarity);
      await sleep(250);
    } else {
      const sequence = ["common","uncommon","rare","common","rare","uncommon","common","uncommon","rare","common","uncommon",finalRarity];
      const delays = [110,115,120,130,145,165,190,220,260,310,380,520];
      for (let index = 0; index < sequence.length; index += 1) {
        activate(stage, sequence[index]);
        stage.querySelector(".sq-rarity-roll-result").textContent = index < sequence.length - 1 ? "Rarity still rolling…" : "Locking result…";
        await sleep(delays[index]);
      }
    }

    stage.dataset.landed = finalRarity;
    stage.classList.add("is-landed");
    const label = RARITIES.find(item => item.id === finalRarity)?.label || String(finalRarity).toUpperCase();
    stage.querySelector(".sq-rarity-roll-copy strong").textContent = `${label} RARITY!`;
    stage.querySelector(".sq-rarity-roll-result").textContent = "Rarity locked — now selecting your avatar.";
    await sleep(reduced ? 500 : 1250);
    stage.hidden = true;
  }

  async function runEnhancedReveal(detail) {
    const host = document.querySelector(".sq-coin-reveal-backdrop");
    const model = window.SalitaAvatarModel;
    if (!host || !model || !detail?.avatar) return;

    const finalItem = detail.avatar;
    const rarity = detail.actualRarity || detail.rarity;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const gift = host.querySelector(".sq-mystery-gift");
    const art = host.querySelector(".sq-coin-reveal-art");
    const title = host.querySelector(".sq-coin-reveal-title");
    const kicker = host.querySelector(".sq-coin-reveal-kicker");
    const progress = host.querySelector(".sq-coin-reveal-progress");
    const track = host.querySelector(".sq-coin-reveal-track span");
    const colour = host.querySelector(".sq-coin-reveal-colour");
    const done = host.querySelector(".sq-coin-reveal-done");

    host.hidden = false;
    host.classList.remove("complete");
    host.classList.add("mystery-reveal");
    host.dataset.rarity = rarity;
    if (done) done.hidden = true;
    if (track) track.style.width = "0%";
    if (colour) colour.style.clipPath = "inset(100% 0 0 0)";
    if (gift) gift.hidden = true;
    if (art) art.hidden = true;
    if (kicker) kicker.textContent = "MYSTERY PACK";
    if (title) title.textContent = "Rolling rarity…";
    if (progress) progress.textContent = "The biggest risk of the pack is being decided.";

    await rarityRoll(host, rarity, reduced);

    if (art) art.hidden = false;
    if (title) title.textContent = `${String(rarity).toUpperCase()} pool selected`;
    if (progress) progress.textContent = "Now choosing an avatar from that rarity.";
    await sleep(reduced ? 100 : 550);

    const candidates = model.list({rarity});
    if (title) title.textContent = "Choosing your avatar…";
    const cycles = reduced ? 1 : 12;
    for (let index = 0; index < cycles; index += 1) {
      showCandidate(host, candidates[Math.floor(Math.random() * candidates.length)] || finalItem);
      await sleep(reduced ? 10 : 85 + index * 12);
    }

    showCandidate(host, finalItem);
    if (title) title.textContent = `${finalItem.name} selected!`;
    if (progress) progress.textContent = `${detail.before}% → ${detail.after}% complete`;
    if (track) track.style.width = `${detail.before}%`;
    if (colour) colour.style.clipPath = `inset(${100 - detail.before}% 0 0 0)`;
    await sleep(reduced ? 10 : 350);
    if (track) track.style.width = `${detail.after}%`;
    if (colour) colour.style.clipPath = `inset(${100 - detail.after}% 0 0 0)`;
    await sleep(reduced ? 10 : 1100);

    if (detail.unlocked) {
      host.classList.add("complete");
      if (title) title.textContent = "Avatar complete!";
      if (progress) progress.textContent = `${finalItem.name} is now unlocked.`;
    } else {
      if (title) title.textContent = "+25 avatar shards!";
      if (progress) progress.textContent = `${detail.after}% of ${finalItem.name} is now in colour.`;
    }
    if (done) { done.hidden = false; done.focus(); }
  }

  document.addEventListener("salita:coin-shard-pack-purchased", event => {
    if (!event.detail?.mystery) return;
    event.stopImmediatePropagation();
    runEnhancedReveal(event.detail).catch(error => console.warn("Enhanced Mystery Pack reveal failed", error));
  }, true);
})();
