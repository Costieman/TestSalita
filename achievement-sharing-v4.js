(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestAchievementSharingV6Installed";
  const LEGACY_FLAG = "__salitaQuestAchievementSharingV4Installed";
  const PROFILE_STORE = "salitaQuestLocalProfilesV1";
  const ACTIVE_PROFILE = "salitaQuestActiveProfileId";
  const MODAL_ID = "achievementShareModalV4";
  const PROMPT_ID = "levelSharePromptV4";
  const RELEASE = "5.5.9-avatar-case";

  const PLATFORM_META = {
    facebook: {label:"Facebook",icon:"f",detail:"Open a post with your achievement link"},
    instagram: {label:"Instagram",icon:"◎",detail:"Share the square card through your device"},
    tiktok: {label:"TikTok",icon:"♪",detail:"Share the square card through your device"},
    x: {label:"X",icon:"𝕏",detail:"Post the achievement and learning link"},
    linkedin: {label:"LinkedIn",icon:"in",detail:"Open a post with your achievement link"},
    whatsapp: {label:"WhatsApp",icon:"◉",detail:"Send the achievement and learning link"}
  };

  let activeShare = null;
  let lastPromptedLevel = 0;
  let pendingLevelShare = null;
  let decorationObserver = null;

  const esc = value => String(value ?? "").replace(/[&<>"']/g, character => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[character]));

  function notify(message) {
    try {
      if (typeof toast === "function") return toast(message);
    } catch {}
    console.info(message);
  }

  function readStore() {
    try {
      const value = JSON.parse(localStorage.getItem(PROFILE_STORE) || "null");
      return value && Array.isArray(value.profiles) ? value : {profiles:[]};
    } catch {
      return {profiles:[]};
    }
  }

  function activeProfile() {
    const store = readStore();
    const id = sessionStorage.getItem(ACTIVE_PROFILE);
    return store.profiles.find(profile => profile.id === id) || null;
  }

  function courseLabel() {
    return document.body.dataset.course === "cebuano" ? "Cebuano / Bisaya" : "Tagalog";
  }

  function shareRoot(campaign) {
    try {
      const url = new URL("./", location.href);
      url.hash = "";
      url.search = "";
      if (/^https?:$/.test(url.protocol)) {
        url.searchParams.set("ref", campaign);
        return url.toString();
      }
    } catch {}
    return `https://costieman.github.io/SalitaQuest/?ref=${encodeURIComponent(campaign)}`;
  }

  function avatarModel() {
    return window.SalitaAvatarModel || null;
  }

  function avatarItem(id) {
    try { return avatarModel()?.get?.(id) || null; }
    catch { return null; }
  }

  function collectionState() {
    const profile = activeProfile();
    if (!profile) return null;
    try {
      return avatarModel()?.normaliseCollectionState?.(profile.avatarCollection, profile.avatarId) || profile.avatarCollection || null;
    } catch {
      return profile.avatarCollection || null;
    }
  }

  function ownedAvatar(id) {
    const item = avatarItem(id);
    const profile = activeProfile();
    if (!item || !profile) return null;
    const collection = collectionState();
    const owned = new Set(collection?.ownedAvatarIds || []);
    if (profile.avatarId) owned.add(profile.avatarId);
    return owned.has(item.id) ? item : null;
  }

  function canonicalAvatarPath(id) {
    const item = avatarItem(id);
    try {
      return window.SalitaAvatarArtwork?.getAvatarImagePath?.(item?.id || id) ||
        window.getAvatarImagePath?.(item?.id || id) ||
        window.SalitaAvatarAssets?.getAvatarImagePath?.(item?.id || id) ||
        item?.image || "avatars/canonical/tarsier.png";
    } catch {
      return item?.image || "avatars/canonical/tarsier.png";
    }
  }

  function currentAvatarItem() {
    const profile = activeProfile();
    const collection = collectionState();
    return avatarItem(collection?.equippedAvatarId || profile?.avatarId) || avatarItem("tarsier") || {
      id:"tarsier", name:"Philippine Tarsier", rarity:"rare", category:"animal", image:"avatars/canonical/tarsier.png"
    };
  }

  function avatarPath(id = null) {
    return canonicalAvatarPath(id || currentAvatarItem()?.id || "tarsier");
  }

  function badgeById(id) {
    try { return BADGES.find(badge => badge.id === id) || null; }
    catch { return null; }
  }

  function isEarned(badge) {
    try { return Boolean(badge?.test?.(state)); }
    catch { return false; }
  }

  function chestBadges() {
    const api = window.SalitaQuestBadgeChest;
    if (api?.getBadges) return api.getBadges();
    const ids = Array.isArray(state?.badgeProgress?.chestIds) ? state.badgeProgress.chestIds : [];
    return ids.slice(0,6).map(badgeById).filter(badge => badge && isEarned(badge));
  }

  function avatarCaseItems() {
    const api = window.SalitaQuestAvatarCase;
    const items = api?.getAvatars?.() || [];
    return items.map(item => ownedAvatar(item?.id)).filter(Boolean).slice(0,4);
  }

  function loadImage(src) {
    return new Promise(resolve => {
      if (!src) return resolve(null);
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = src;
    });
  }

  function makeCanvas(width = 1080, height = 1080) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  function roundRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  }

  function wrapText(context, text, x, y, maxWidth, lineHeight, maxLines = 3, align = "center") {
    const words = String(text || "").split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (line && context.measureText(next).width > maxWidth) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
    context.textAlign = align;
    lines.slice(0,maxLines).forEach((value,index) => context.fillText(value,x,y + index * lineHeight));
  }

  function drawBackground(context, width = 1080, height = 1080) {
    const gradient = context.createLinearGradient(0,0,width,height);
    gradient.addColorStop(0,"#08152d");
    gradient.addColorStop(.52,"#123e49");
    gradient.addColorStop(1,"#087166");
    context.fillStyle = gradient;
    context.fillRect(0,0,width,height);
    context.fillStyle = "rgba(247,201,72,.13)";
    context.beginPath(); context.arc(width * .86,height * .10,Math.min(width,height) * .24,0,Math.PI * 2); context.fill();
    context.beginPath(); context.arc(width * .09,height * .94,Math.min(width,height) * .27,0,Math.PI * 2); context.fill();
  }

  function drawBrand(context, title, width = 1080) {
    const profile = activeProfile();
    context.textAlign = "left";
    context.textBaseline = "alphabetic";
    context.fillStyle = "#f7c948";
    context.font = "900 30px system-ui,sans-serif";
    context.fillText("SALITA QUEST",64,72);
    context.fillStyle = "#fff";
    context.font = "900 53px system-ui,sans-serif";
    context.fillText(title,64,132);
    context.fillStyle = "rgba(255,255,255,.76)";
    context.font = "700 23px system-ui,sans-serif";
    context.fillText(`${profile?.name || "A learner"} · ${courseLabel()}`,66,172);
    if (width > 1080) {
      context.textAlign = "right";
      context.fillStyle = "rgba(255,255,255,.58)";
      context.font = "800 18px system-ui,sans-serif";
      context.fillText(RELEASE,width - 54,66);
    }
  }

  function drawCallToAction(context, campaign) {
    const display = shareRoot(campaign).replace(/^https?:\/\//,"").replace(/\?.*$/,"").replace(/\/$/,"");
    context.textAlign = "center";
    context.fillStyle = "rgba(255,255,255,.72)";
    context.font = "800 17px system-ui,sans-serif";
    context.fillText("CHOOSE TAGALOG OR CEBUANO",540,944);
    roundRect(context,242,958,596,63,31);
    context.fillStyle = "#f7c948"; context.fill();
    context.fillStyle = "#10213b";
    context.font = "950 27px system-ui,sans-serif";
    context.fillText("START LEARNING FREE  →",540,999);
    context.fillStyle = "rgba(255,255,255,.76)";
    context.font = "700 17px system-ui,sans-serif";
    context.fillText(display,540,1048);
  }

  function drawImageContain(context, image, x, y, width, height) {
    if (!image) return;
    const scale = Math.min(width / image.width, height / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    context.drawImage(image,x + (width - drawWidth) / 2,y + (height - drawHeight) / 2,drawWidth,drawHeight);
  }

  async function drawBadgeVisual(context, badge, x, y, size, avatar) {
    const custom = await loadImage(badge?.image || `badges/${badge?.id || ""}.png`);
    context.save();
    roundRect(context,x,y,size,size,size * .23);
    context.fillStyle = "#f8f2d8"; context.fill();
    context.strokeStyle = "#f7c948"; context.lineWidth = Math.max(5,size * .03); context.stroke();
    context.clip();
    if (custom) context.drawImage(custom,x,y,size,size);
    else if (avatar) {
      drawImageContain(context,avatar,x,y,size,size);
      context.fillStyle = "rgba(6,20,42,.76)";
      context.beginPath(); context.arc(x + size * .76,y + size * .76,size * .19,0,Math.PI * 2); context.fill();
      context.fillStyle = "#fff"; context.font = `900 ${Math.round(size * .20)}px system-ui,sans-serif`;
      context.textAlign = "center"; context.textBaseline = "middle";
      context.fillText(badge?.icon || "★",x + size * .76,y + size * .76);
    } else {
      context.fillStyle = "#10213b"; context.font = `900 ${Math.round(size * .38)}px system-ui,sans-serif`;
      context.textAlign = "center"; context.textBaseline = "middle";
      context.fillText(badge?.icon || "★",x + size / 2,y + size / 2);
    }
    context.restore();
  }

  async function buildBadgeCard(badge) {
    const canvas = makeCanvas();
    const context = canvas.getContext("2d");
    drawBackground(context); drawBrand(context,"BADGE EARNED");
    const avatar = await loadImage(avatarPath());
    await drawBadgeVisual(context,badge,330,210,420,avatar);
    context.textAlign = "center"; context.textBaseline = "alphabetic";
    context.fillStyle = "#f7c948"; context.font = "900 26px system-ui,sans-serif";
    context.fillText(String(badge.category || "Achievement").toUpperCase(),540,678);
    context.fillStyle = "#fff"; context.font = "900 54px system-ui,sans-serif";
    wrapText(context,badge.name,540,748,860,60,2);
    context.fillStyle = "rgba(255,255,255,.80)"; context.font = "700 25px system-ui,sans-serif";
    wrapText(context,badge.description,540,850,820,34,2);
    drawCallToAction(context,"badge-share");
    return canvas;
  }

  async function buildChestCard(badges) {
    const canvas = makeCanvas();
    const context = canvas.getContext("2d");
    drawBackground(context); drawBrand(context,"MY BADGE CHEST");
    const avatar = await loadImage(avatarPath());
    const positions = [[62,220],[386,220],[710,220],[62,536],[386,536],[710,536]];
    for (let index = 0; index < 6; index += 1) {
      const [x,y] = positions[index];
      const badge = badges[index];
      roundRect(context,x,y,290,282,27);
      context.fillStyle = "rgba(7,18,37,.72)"; context.fill();
      context.strokeStyle = badge ? "rgba(247,201,72,.52)" : "rgba(255,255,255,.14)";
      context.lineWidth = 3; context.stroke();
      if (badge) {
        await drawBadgeVisual(context,badge,x + 69,y + 18,152,avatar);
        context.fillStyle = "#fff"; context.font = "900 22px system-ui,sans-serif";
        wrapText(context,badge.name,x + 145,y + 212,248,26,2);
      } else {
        context.textAlign = "center"; context.fillStyle = "rgba(255,255,255,.25)";
        context.font = "900 58px system-ui,sans-serif"; context.fillText("＋",x + 145,y + 138);
      }
    }
    drawCallToAction(context,"badge-chest");
    return canvas;
  }

  async function buildAvatarCard(item, contextLabel = "collection") {
    const canvas = makeCanvas();
    const context = canvas.getContext("2d");
    drawBackground(context);
    drawBrand(context,contextLabel === "unlock" ? "NEW AVATAR UNLOCKED" : "MY AVATAR");
    const image = await loadImage(avatarPath(item.id));
    roundRect(context,238,205,604,590,84);
    const panel = context.createLinearGradient(238,205,842,795);
    panel.addColorStop(0,"#fff8dc"); panel.addColorStop(1,"#d5f1e7");
    context.fillStyle = panel; context.fill();
    context.strokeStyle = "rgba(247,201,72,.92)"; context.lineWidth = 10; context.stroke();
    context.save(); roundRect(context,270,237,540,526,68); context.clip();
    drawImageContain(context,image,270,237,540,526); context.restore();
    context.textAlign = "center"; context.fillStyle = "#f7c948";
    context.font = "900 25px system-ui,sans-serif";
    context.fillText(`${String(item.rarity || "collectible").toUpperCase()} · ${String(item.category || "avatar").toUpperCase()}`,540,836);
    context.fillStyle = "#fff"; context.font = "950 52px system-ui,sans-serif";
    wrapText(context,item.name,540,895,880,58,2);
    drawCallToAction(context,contextLabel === "unlock" ? "avatar-unlock" : "avatar-share");
    return canvas;
  }

  async function buildAvatarCaseCard(items) {
    const canvas = makeCanvas();
    const context = canvas.getContext("2d");
    drawBackground(context); drawBrand(context,"MY AVATAR CASE");
    const positions = [[70,218],[560,218],[70,548],[560,548]];
    for (let index = 0; index < 4; index += 1) {
      const item = items[index];
      const [x,y] = positions[index];
      roundRect(context,x,y,450,292,34);
      const panel = context.createLinearGradient(x,y,x + 450,y + 292);
      panel.addColorStop(0,"#fff8dc"); panel.addColorStop(1,"#d5f1e7");
      context.fillStyle = panel; context.fill();
      context.strokeStyle = item ? "rgba(247,201,72,.82)" : "rgba(255,255,255,.18)";
      context.lineWidth = 6; context.stroke();
      if (item) {
        const image = await loadImage(avatarPath(item.id));
        context.save(); roundRect(context,x + 18,y + 18,414,196,24); context.clip();
        drawImageContain(context,image,x + 18,y + 18,414,196); context.restore();
        context.textAlign = "center";
        context.fillStyle = "#10213b"; context.font = "900 25px system-ui,sans-serif";
        wrapText(context,item.name,x + 225,y + 248,392,29,2);
        context.fillStyle = "#0f766e"; context.font = "850 16px system-ui,sans-serif";
        context.fillText(String(item.rarity || "collectible").toUpperCase(),x + 225,y + 280);
      } else {
        context.textAlign = "center"; context.fillStyle = "rgba(16,33,59,.28)";
        context.font = "900 76px system-ui,sans-serif"; context.fillText("＋",x + 225,y + 160);
        context.font = "800 18px system-ui,sans-serif"; context.fillText("EMPTY FAVOURITE SLOT",x + 225,y + 214);
      }
    }
    context.textAlign = "center"; context.fillStyle = "rgba(255,255,255,.78)";
    context.font = "800 22px system-ui,sans-serif";
    context.fillText(`${items.length} of 4 favourite avatars`,540,888);
    drawCallToAction(context,"avatar-case");
    return canvas;
  }

  async function buildLevelCard(levelData) {
    const canvas = makeCanvas();
    const context = canvas.getContext("2d");
    drawBackground(context); drawBrand(context,"LEVEL UP!");
    const avatar = await loadImage(levelData.imageSource || avatarPath());
    roundRect(context,305,220,470,420,78);
    const panel = context.createLinearGradient(305,220,775,640);
    panel.addColorStop(0,"#fff7d9"); panel.addColorStop(1,"#f7c948");
    context.fillStyle = panel; context.fill(); context.strokeStyle = "rgba(255,255,255,.95)"; context.lineWidth = 10; context.stroke();
    context.save(); roundRect(context,330,240,420,365,60); context.clip(); drawImageContain(context,avatar,330,240,420,365); context.restore();
    context.beginPath(); context.arc(735,595,92,0,Math.PI * 2); context.fillStyle = "#0f766e"; context.fill();
    context.strokeStyle = "#fff"; context.lineWidth = 9; context.stroke();
    context.fillStyle = "#fff"; context.font = "950 64px system-ui,sans-serif";
    context.textAlign = "center"; context.textBaseline = "middle"; context.fillText(String(levelData.level),735,597);
    context.textBaseline = "alphabetic"; context.fillStyle = "#f7c948"; context.font = "900 28px system-ui,sans-serif";
    context.fillText(`LEVEL ${levelData.level}`,540,716);
    context.fillStyle = "#fff"; context.font = "950 58px system-ui,sans-serif";
    wrapText(context,levelData.title || "Language Explorer",540,790,880,62,2);
    context.fillStyle = "rgba(255,255,255,.80)"; context.font = "700 25px system-ui,sans-serif";
    wrapText(context,levelData.subtitle || "Another milestone on my language-learning journey.",540,878,840,34,2);
    drawCallToAction(context,"level-up");
    return canvas;
  }

  function buildOpenGraphCard(square, title, text) {
    const canvas = makeCanvas(1200,630);
    const context = canvas.getContext("2d");
    drawBackground(context,1200,630);
    context.save(); roundRect(context,22,20,590,590,28); context.clip();
    context.drawImage(square,0,0,1080,1080,22,20,590,590); context.restore();
    context.strokeStyle = "rgba(247,201,72,.46)"; context.lineWidth = 3;
    roundRect(context,22,20,590,590,28); context.stroke();
    context.textAlign = "left"; context.fillStyle = "#f7c948"; context.font = "900 24px system-ui,sans-serif";
    context.fillText("SALITA QUEST",660,84);
    context.fillStyle = "#fff"; context.font = "900 48px system-ui,sans-serif";
    wrapText(context,title,660,158,480,55,3,"left");
    context.fillStyle = "rgba(255,255,255,.80)"; context.font = "700 23px system-ui,sans-serif";
    wrapText(context,text,660,340,470,33,4,"left");
    context.fillStyle = "rgba(255,255,255,.72)"; context.font = "800 17px system-ui,sans-serif";
    context.fillText("CHOOSE TAGALOG OR CEBUANO",660,500);
    roundRect(context,660,520,454,64,32); context.fillStyle = "#f7c948"; context.fill();
    context.fillStyle = "#10213b"; context.font = "950 24px system-ui,sans-serif";
    context.fillText("START LEARNING FREE  →",700,561);
    return canvas;
  }

  function canvasBlob(canvas) {
    return new Promise((resolve,reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Could not create social card")),"image/png",1));
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve,reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function ensureModal() {
    let modal = document.getElementById(MODAL_ID);
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = MODAL_ID;
    modal.className = "achievement-share-modal";
    modal.hidden = true;
    modal.innerHTML = `
      <div class="achievement-share-backdrop" data-close-achievement-share></div>
      <section class="achievement-share-card" role="dialog" aria-modal="true" aria-labelledby="achievementShareTitle">
        <button class="achievement-share-close" type="button" data-close-achievement-share aria-label="Close">×</button>
        <div class="achievement-share-preview">
          <img id="achievementSharePreview" alt="Generated Salita Quest achievement card">
          <small>Hosted previews are used when available. Device sharing and card download remain available if the hosted service is offline.</small>
        </div>
        <div class="achievement-share-content">
          <p class="eyebrow">SHARE YOUR PROGRESS</p>
          <h2 id="achievementShareTitle">Share achievement</h2>
          <p id="achievementShareDescription"></p>
          <div id="achievementSharePlatforms" class="achievement-share-platforms"></div>
          <div class="achievement-share-secondary">
            <button type="button" data-achievement-native>Share image to an app</button>
            <button type="button" data-achievement-download>Download card</button>
            <button type="button" data-achievement-copy>Copy link and caption</button>
          </div>
          <p id="achievementShareStatus" class="achievement-share-status" role="status"></p>
        </div>
      </section>`;
    document.body.appendChild(modal);
    return modal;
  }

  function setStatus(message, error = false) {
    const node = document.getElementById("achievementShareStatus");
    if (!node) return;
    node.textContent = message || "";
    node.classList.toggle("error",Boolean(error));
  }

  function renderPlatforms() {
    const grid = document.getElementById("achievementSharePlatforms");
    if (!grid) return;
    grid.innerHTML = Object.entries(PLATFORM_META).map(([id,meta]) => `
      <button class="achievement-platform-action" type="button" data-achievement-platform="${id}">
        <span class="achievement-platform-icon">${meta.icon}</span>
        <span><strong>${meta.label}</strong><small>${meta.detail}</small></span>
      </button>`).join("");
  }

  function connectionApi() {
    return window.SalitaQuestSocialConnections || null;
  }

  async function createHostedShare() {
    if (!activeShare) throw new Error("No achievement card is ready.");
    if (activeShare.hosted) return activeShare.hosted;
    if (activeShare.hostedPromise) return activeShare.hostedPromise;
    const api = connectionApi();
    const base = api?.apiBase?.();
    if (!base) throw new Error("Hosted previews are currently unavailable.");
    if (api?.ensureHosted && !(await api.ensureHosted())) throw new Error("Hosted previews are currently unavailable.");

    activeShare.hostedPromise = (async () => {
      setStatus("Creating the public preview…");
      const [squareImageDataUrl,ogImageDataUrl] = await Promise.all([
        blobToDataUrl(activeShare.blob), blobToDataUrl(activeShare.ogBlob)
      ]);
      const response = await fetch(`${base}/api/share-cards`, {
        method:"POST",
        credentials:"omit",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          type:activeShare.type,
          title:activeShare.title,
          description:activeShare.text,
          learnerName:activeProfile()?.name || "",
          course:courseLabel(),
          campaign:activeShare.campaign,
          squareImageDataUrl,
          ogImageDataUrl
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || `Hosted sharing failed (${response.status}).`);
      activeShare.hosted = data;
      activeShare.url = data.shareUrl;
      activeShare.caption = `${activeShare.text} Start learning a Filipino language free with Salita Quest: ${data.shareUrl}`;
      setStatus("Your hosted achievement card is ready.");
      return data;
    })().catch(error => {
      if (activeShare) {
        activeShare.hostedPromise = null;
        activeShare.hostedError = String(error?.message || error);
      }
      throw error;
    });
    return activeShare.hostedPromise;
  }

  async function prepareShare({type,title,text,fileName,campaign,canvas}) {
    const modal = ensureModal();
    modal.hidden = false;
    document.body.classList.add("achievement-share-open");
    setStatus("Preparing your achievement card…");
    const openGraph = buildOpenGraphCard(canvas,title,text);
    const [blob,ogBlob] = await Promise.all([canvasBlob(canvas),canvasBlob(openGraph)]);
    const fallbackUrl = shareRoot(campaign);
    activeShare = {
      type,title,text,fileName,campaign,blob,ogBlob,url:fallbackUrl,
      caption:`${text} Start learning a Filipino language free with Salita Quest: ${fallbackUrl}`,
      hosted:null,hostedPromise:null,hostedError:null
    };
    const preview = document.getElementById("achievementSharePreview");
    if (preview?.src?.startsWith("blob:")) URL.revokeObjectURL(preview.src);
    if (preview) preview.src = URL.createObjectURL(blob);
    const titleNode = document.getElementById("achievementShareTitle");
    const descriptionNode = document.getElementById("achievementShareDescription");
    if (titleNode) titleNode.textContent = title;
    if (descriptionNode) descriptionNode.textContent = text;
    renderPlatforms();

    const hostedState = connectionApi()?.hostedStatus?.();
    if (hostedState === false) {
      setStatus("Hosted previews are offline. The card is still ready for device sharing or download.",true);
    } else {
      createHostedShare().catch(() => setStatus("Hosted preview unavailable. The card is still ready for device sharing or download.",true));
    }
    document.dispatchEvent(new CustomEvent("salita:achievement-share-prepared",{detail:{type,title,release:RELEASE}}));
  }

  async function withButton(button, task, fallbackLabel) {
    const original = button?.textContent;
    if (button) { button.disabled = true; button.textContent = "Preparing…"; }
    try { await task(); }
    catch (error) { console.error(error); notify("This achievement could not be prepared for sharing."); }
    finally { if (button) { button.disabled = false; button.textContent = original || fallbackLabel; } }
  }

  async function openBadge(id, button = null) {
    const badge = badgeById(id);
    if (!badge || !isEarned(badge)) return notify("This badge is not available to share yet.");
    return withButton(button, async () => prepareShare({
      type:"badge",
      title:`My ${badge.name} badge`,
      text:`I earned the ${badge.name} badge while learning ${courseLabel()} with Salita Quest.`,
      fileName:`salita-quest-${badge.id}.png`,
      campaign:"badge-share",
      canvas:await buildBadgeCard(badge)
    }),"Share badge");
  }

  async function openChest(button = null) {
    const badges = chestBadges();
    if (!badges.length) {
      notify("Choose at least one badge before sharing your Badge Chest.");
      window.SalitaQuestBadgeChest?.openPicker?.();
      return;
    }
    return withButton(button, async () => prepareShare({
      type:"badge_chest",
      title:"My Salita Quest Badge Chest",
      text:`These are my proudest achievements while learning ${courseLabel()} with Salita Quest.`,
      fileName:"salita-quest-badge-chest.png",
      campaign:"badge-chest",
      canvas:await buildChestCard(badges)
    }),"Share Badge Chest");
  }

  async function openAvatar(id, options = {}, button = null) {
    const item = ownedAvatar(id);
    if (!item) return notify("Only unlocked avatars can be shared.");
    const contextLabel = options?.context === "unlock" ? "unlock" : "collection";
    return withButton(button, async () => prepareShare({
      type:"avatar",
      title:contextLabel === "unlock" ? `I unlocked ${item.name}` : `My ${item.name} avatar`,
      text:contextLabel === "unlock"
        ? `I unlocked the ${item.name} avatar in Salita Quest.`
        : `The ${item.name} is part of my Salita Quest avatar collection.`,
      fileName:`salita-quest-avatar-${item.id}.png`,
      campaign:contextLabel === "unlock" ? "avatar-unlock" : "avatar-share",
      canvas:await buildAvatarCard(item,contextLabel)
    }),"Share avatar");
  }

  async function openAvatarCase(button = null) {
    const items = avatarCaseItems();
    if (!items.length) {
      notify("Choose at least one unlocked avatar before sharing your Avatar Case.");
      window.SalitaQuestAvatarCase?.openPicker?.();
      return;
    }
    return withButton(button, async () => prepareShare({
      type:"avatar_case",
      title:"My Salita Quest Avatar Case",
      text:`These are my favourite Salita Quest avatars while learning ${courseLabel()}.`,
      fileName:"salita-quest-avatar-case.png",
      campaign:"avatar-case",
      canvas:await buildAvatarCaseCard(items)
    }),"Share Avatar Case");
  }

  function currentLevelData() {
    let info = null;
    try { info = window.SalitaLevelProgression?.calculate?.() || (typeof levelInfo === "function" ? levelInfo() : null); }
    catch {}
    const level = Math.max(1,Number(info?.level || 1));
    return {
      level,
      title:info?.title || "Language Explorer",
      subtitle:info?.subtitle || `Another milestone on the ${courseLabel()} learning journey.`,
      imageSource:avatarPath()
    };
  }

  async function openLevel(levelData = currentLevelData(), button = null) {
    const safe = {...currentLevelData(),...(levelData || {})};
    return withButton(button, async () => prepareShare({
      type:"level_up",
      title:`I reached Level ${safe.level} in Salita Quest`,
      text:`I reached Level ${safe.level} · ${safe.title} while learning ${courseLabel()} with Salita Quest.`,
      fileName:`salita-quest-level-${safe.level}.png`,
      campaign:"level-up",
      canvas:await buildLevelCard(safe)
    }),"Share level");
  }

  function closeShare() {
    const modal = document.getElementById(MODAL_ID);
    if (modal) modal.hidden = true;
    const preview = document.getElementById("achievementSharePreview");
    if (preview?.src?.startsWith("blob:")) { URL.revokeObjectURL(preview.src); preview.removeAttribute("src"); }
    activeShare = null;
    document.body.classList.remove("achievement-share-open");
  }

  function blankPopup() {
    return window.open("about:blank","salitaAchievementPost","popup=yes,width=720,height=760");
  }

  async function publicComposer(provider) {
    if (!activeShare) return;
    const popup = blankPopup();
    if (!popup) return setStatus("Allow pop-ups so Salita Quest can open the social composer.",true);
    try { popup.document.write("<title>Preparing Salita Quest post…</title><p style='font:18px system-ui;padding:30px'>Preparing your achievement post…</p>"); }
    catch {}

    let hosted = null;
    try { hosted = await createHostedShare(); }
    catch (error) {
      setStatus("Hosted card unavailable. The platform will open with the Salita Quest link; download the card to attach it manually.",true);
    }

    try {
      const shareUrl = hosted?.shareUrl || activeShare.url;
      const caption = hosted ? activeShare.caption : `${activeShare.text} ${shareUrl}`;
      const encodedUrl = encodeURIComponent(shareUrl);
      const encodedText = encodeURIComponent(caption);
      let destination = "";
      if (provider === "facebook") destination = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      else if (provider === "x") destination = `https://twitter.com/intent/tweet?text=${encodedText}`;
      else if (provider === "linkedin") destination = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
      else if (provider === "whatsapp") destination = `https://wa.me/?text=${encodedText}`;
      if (!destination) throw new Error("This platform does not support a public web composer.");
      popup.location.replace(destination);
      if (hosted) setStatus(`${PLATFORM_META[provider].label} opened with your hosted achievement card.`);
    } catch (error) {
      try { popup.close(); } catch {}
      setStatus(error.message || "The post could not be opened.",true);
    }
  }

  async function nativeShare() {
    if (!activeShare) return;
    if (!navigator.share) throw new Error("This browser does not provide app sharing. Download the card instead.");
    const file = typeof File === "function" ? new File([activeShare.blob],activeShare.fileName,{type:"image/png"}) : null;
    const payload = {title:activeShare.title,text:activeShare.text,url:activeShare.hosted?.shareUrl || activeShare.url};
    if (file && navigator.canShare?.({files: [file]})) payload.files = [file];
    await navigator.share(payload);
    setStatus("Achievement shared through your device.");
  }

  async function platformAction(provider) {
    if (["facebook","x","linkedin","whatsapp"].includes(provider)) return publicComposer(provider);
    if (["instagram","tiktok"].includes(provider)) {
      try { await nativeShare(); }
      catch (error) { setStatus(`${PLATFORM_META[provider].label} needs device image sharing. Download the card if this browser cannot open it.`,true); }
    }
  }

  function downloadCard() {
    if (!activeShare) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(activeShare.blob);
    link.download = activeShare.fileName;
    document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(link.href),1500);
    setStatus("Square achievement card downloaded.");
  }

  async function copyHostedLink() {
    if (!activeShare) return;
    try { await createHostedShare(); }
    catch {}
    const caption = activeShare.caption || `${activeShare.text} ${activeShare.url}`;
    try {
      await navigator.clipboard.writeText(caption);
      setStatus(activeShare.hosted ? "Hosted achievement link and caption copied." : "Salita Quest link and caption copied. Download the card to attach it manually.");
    } catch {
      setStatus("The browser could not copy the link. Download the card instead.",true);
    }
  }

  function removeLevelPrompt() {
    const prompt = document.getElementById(PROMPT_ID);
    if (!prompt) return;
    window.clearTimeout(prompt.__dismissTimer);
    prompt.classList.add("leaving");
    window.setTimeout(() => prompt.remove(),220);
  }

  function showLevelPrompt(levelData) {
    if (!levelData?.level || levelData.level <= lastPromptedLevel) return;
    lastPromptedLevel = levelData.level;
    document.getElementById(PROMPT_ID)?.remove();
    const prompt = document.createElement("aside");
    prompt.id = PROMPT_ID;
    prompt.className = "level-share-prompt-v4";
    prompt.setAttribute("role","dialog");
    prompt.setAttribute("aria-label",`Share Level ${levelData.level}`);
    prompt.__levelData = levelData;
    prompt.innerHTML = `
      <img src="${esc(levelData.imageSource || avatarPath())}" alt="">
      <div class="level-share-prompt-copy"><span>LEVEL UP!</span><strong>Level ${levelData.level} · ${esc(levelData.title)}</strong><small>Share this milestone, or continue learning.</small></div>
      <div class="level-share-prompt-actions"><button type="button" data-share-level-v4>Share level up</button><button type="button" data-dismiss-level-v4>Continue</button></div>`;
    document.body.appendChild(prompt);
    requestAnimationFrame(() => prompt.classList.add("show"));
    prompt.__dismissTimer = window.setTimeout(removeLevelPrompt,30000);
  }

  function ensureProgressShareButton() {
    const view = document.getElementById("progressView");
    if (!view || view.querySelector("[data-share-current-level]")) return;
    const host = view.querySelector(".progress-hero,.progress-header,.view-heading,.panel") || view;
    const wrap = document.createElement("div");
    wrap.className = "achievement-share-current-level";
    wrap.innerHTML = `<button class="secondary-btn" type="button" data-share-current-level>Share current level</button>`;
    host.appendChild(wrap);
  }

  function decorateAvatarDetails(scope = document) {
    const cards = [];
    if (scope?.matches?.(".sq-avatar-detail-card")) cards.push(scope);
    scope.querySelectorAll?.(".sq-avatar-detail-card").forEach(card => cards.push(card));
    cards.forEach(card => {
      if (card.querySelector("[data-share-avatar]")) return;
      const id = card.querySelector("[data-sq-avatar-id]")?.dataset.sqAvatarId || "";
      if (!ownedAvatar(id)) return;
      const actions = card.querySelector(".sq-avatar-detail-actions");
      if (!actions) return;
      const button = document.createElement("button");
      button.className = "sq-avatar-detail-share secondary-btn";
      button.type = "button";
      button.dataset.shareAvatar = id;
      button.textContent = "Share avatar";
      actions.insertBefore(button,actions.lastElementChild || null);
    });
  }

  function decorateUnlockLayer(avatarId) {
    window.setTimeout(() => {
      const layers = [...document.querySelectorAll(".sq-avatar-unlock-layer")];
      const layer = layers[layers.length - 1];
      const actions = layer?.querySelector(".sq-avatar-unlock-actions");
      if (!actions || actions.querySelector("[data-share-avatar]")) return;
      const button = document.createElement("button");
      button.className = "sq-avatar-unlock-share";
      button.type = "button";
      button.dataset.shareAvatar = avatarId;
      button.dataset.avatarShareContext = "unlock";
      button.textContent = "Share avatar";
      actions.insertBefore(button,actions.lastElementChild || null);
    },0);
  }

  function badgeIdFromButton(button) {
    return button?.dataset.shareBadge || button?.closest("[data-badge-id]")?.dataset.badgeId || "";
  }

  function handleClick(event) {
    const badgeButton = event.target.closest?.("[data-share-badge]");
    if (badgeButton) { event.preventDefault(); return openBadge(badgeIdFromButton(badgeButton),badgeButton); }
    const chestButton = event.target.closest?.("[data-share-badge-chest]");
    if (chestButton) { event.preventDefault(); return openChest(chestButton); }
    const avatarButton = event.target.closest?.("[data-share-avatar]");
    if (avatarButton) {
      event.preventDefault();
      return openAvatar(avatarButton.dataset.shareAvatar,{context:avatarButton.dataset.avatarShareContext || "collection"},avatarButton);
    }
    const avatarCaseButton = event.target.closest?.("[data-share-avatar-case]");
    if (avatarCaseButton) { event.preventDefault(); return openAvatarCase(avatarCaseButton); }
    const currentLevelButton = event.target.closest?.("[data-share-current-level]");
    if (currentLevelButton) { event.preventDefault(); return openLevel(currentLevelData(),currentLevelButton); }
    const levelButton = event.target.closest?.("[data-share-level-v4]");
    if (levelButton) {
      const levelData = levelButton.closest(`#${PROMPT_ID}`)?.__levelData;
      event.preventDefault(); removeLevelPrompt();
      if (levelData) return openLevel(levelData,levelButton);
    }
    if (event.target.closest?.("[data-dismiss-level-v4]")) { event.preventDefault(); removeLevelPrompt(); return; }
    if (!activeShare) return;
    if (event.target.closest?.("[data-close-achievement-share]")) { event.preventDefault(); closeShare(); return; }
    const platform = event.target.closest?.("[data-achievement-platform]");
    if (platform) { event.preventDefault(); return platformAction(platform.dataset.achievementPlatform); }
    if (event.target.closest?.("[data-achievement-native]")) { event.preventDefault(); return nativeShare().catch(error => setStatus(error.message,true)); }
    if (event.target.closest?.("[data-achievement-download]")) { event.preventDefault(); downloadCard(); return; }
    if (event.target.closest?.("[data-achievement-copy]")) { event.preventDefault(); copyHostedLink(); }
  }

  function installDecorations() {
    ensureProgressShareButton(); decorateAvatarDetails();
    decorationObserver = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue;
          decorateAvatarDetails(node);
          if (node.id === "progressView" || node.querySelector?.("#progressView")) ensureProgressShareButton();
        }
      }
    });
    decorationObserver.observe(document.documentElement,{childList:true,subtree:true});
  }

  function install() {
    if (window[INSTALL_FLAG]) return;
    window[INSTALL_FLAG] = true;
    window[LEGACY_FLAG] = true;
    ensureModal();
    document.addEventListener("click",handleClick);
    document.addEventListener("keydown",event => {
      if (event.key !== "Escape") return;
      if (activeShare) closeShare();
      else if (document.getElementById(PROMPT_ID)) removeLevelPrompt();
    });
    document.addEventListener("salita:avatar-unlock-animation-started",event => decorateUnlockLayer(event.detail?.avatarId || ""));
    document.addEventListener("salita:avatar-collection-changed",() => window.setTimeout(() => decorateAvatarDetails(),40));
    document.addEventListener("salita:level-updated",event => {
      if (!event.detail?.changed) return;
      pendingLevelShare = currentLevelData();
    });
    document.addEventListener("salita:popup-finished",event => {
      if (event.detail?.type !== "level_up") return;
      const data = pendingLevelShare || currentLevelData();
      pendingLevelShare = null;
      window.setTimeout(() => showLevelPrompt(data),280);
    });
    document.addEventListener("salita:view-changed",event => {
      if (event.detail?.view === "progress") window.setTimeout(ensureProgressShareButton,30);
    });
    installDecorations();
    window.SalitaQuestAchievementSharing = Object.freeze({
      version:6,release:RELEASE,openBadge,openChest,openAvatar,openAvatarCase,openLevel,currentLevelData,close:closeShare
    });
    document.documentElement.dataset.achievementSharing = RELEASE;
  }

  install();
})();
