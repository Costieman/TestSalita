(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestAchievementSharingRouterV3Installed";
  const RELEASE = "5.5.21-mobile-share-desktop-save-only";
  const MODAL_ID = "achievementShareModalV4";
  const PREVIEW_ID = "achievementSharePreview";
  const APP_URL = "https://costieman.github.io/SalitaQuest/";
  const QR_DATA_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAXIAAAFyAQAAAADAX2ykAAACgklEQVR4nO2bQYrbQBBF308LZqmGHGCO0rpZ8JFyA+koPkBAWgZkfhZS2/KYZGbAY6xQtbLot/hQ7q5fpZbMZ2L49ikcgg8++OCDDz74v/Fao0HdJDFIUgfAVNe6B+oJ/s58sW2P4EMGda0NnKSOZNv2Nf/VeoK/Mz+ddyjJlKPkg17sHpDUPFpP8PfhmzfPKgaGDJQx66Z7ejb9wX+SH/JJ7tsZdaTb5vjp9Qd/FXX/tgYmAJJVji/WkBHlJ2yz/Gz6g/8QP0iSMlCONeVlTKvJkqTH6gn+Tjy+Dmhn7BGgtVdjfY7+2fQH/04sWS22KSOw+OfaELkHNpmO/O6M3/hnD69GcJKHPAKkmTJmYKrH89PpD/5D/CAJJq3W+cdRskeQXmdivrFffq2/PQCtbY/JtuftY9/OxPm8S75uzmUgmXyV1bPd8lz/B8+mP/h34uKal1z2pI3TWp00xP7dJ1/3ZWtTxlTbIGB1zUsTnMI/75M/90frMbwmeaytURmpC5HfHfJnc5zsntVLLYf05cyO+rtbvu7fEaqh8m39Df+8V34zn6yPc12o5XgpwpHfPfOTtGzdIQO0M1I+Sd3UAO3veL+wZ17KyfZRgqlZrNVShId8EkNOMb/aJ7/Mn9fstUbFpwamZplEU3pQ6R+mJ/iv4C/3J1l73ZnVZE0NDHH/auf88pp3BB9UD+lDrk1ScdTfnfKb/qjOqi4Lc/0d73//F36xVvaMOtaeeDOEfnr9wV/H2/uxlPH7DFNePJdogaF7mJ7g78vf3J8cOmTauREki6mZRfurcs+mP/h3Yns5g1Qn0a29GVeuQ+iov/vjb79Q+GfE993BBx988MEHfwf+D6Z73lFZDxYnAAAAAElFTkSuQmCC";

  if (window[INSTALL_FLAG]) return;
  window[INSTALL_FLAG] = true;

  let prepared = null;
  let decoratedPromise = null;
  let actionInProgress = false;

  const modal = () => document.getElementById(MODAL_ID);
  const preview = () => document.getElementById(PREVIEW_ID);
  const isMobileShareDevice = () => window.matchMedia("(max-width: 800px), (pointer: coarse)").matches;

  function hideLegacyText() {
    const root = modal();
    if (!root) return;
    root.querySelectorAll(".achievement-share-preview small, #achievementShareStatus").forEach(node => {
      node.hidden = true;
      node.textContent = "";
    });
  }

  function loadImage(src) {
    return new Promise((resolve,reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("The achievement image could not be loaded."));
      image.src = src;
    });
  }

  function canvasBlob(canvas) {
    return new Promise((resolve,reject) => canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error("The achievement image could not be prepared.")),
      "image/png",
      1
    ));
  }

  async function decorateWithQr(source) {
    const [card, qr] = await Promise.all([loadImage(source), loadImage(QR_DATA_URL)]);
    const canvas = document.createElement("canvas");
    canvas.width = card.naturalWidth || 1080;
    canvas.height = card.naturalHeight || 1080;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(card, 0, 0, canvas.width, canvas.height);
    const size = Math.round(Math.min(canvas.width, canvas.height) * 0.145);
    const pad = Math.round(Math.min(canvas.width, canvas.height) * 0.025);
    const x = canvas.width - size - pad;
    const y = canvas.height - size - pad;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(x - 10, y - 10, size + 20, size + 20, 16);
    ctx.fill();
    ctx.drawImage(qr, x, y, size, size);
    return canvasBlob(canvas);
  }

  function ensureDecoratedFile() {
    if (!prepared?.source) return Promise.reject(new Error("The achievement image is not ready."));
    if (prepared.file) return Promise.resolve(prepared.file);
    if (decoratedPromise) return decoratedPromise;
    decoratedPromise = decorateWithQr(prepared.source).then(blob => {
      prepared.file = new File([blob], prepared.fileName, {type:"image/png"});
      const objectUrl = URL.createObjectURL(blob);
      if (prepared.previewObjectUrl) URL.revokeObjectURL(prepared.previewObjectUrl);
      prepared.previewObjectUrl = objectUrl;
      const image = preview();
      if (image) image.src = objectUrl;
      return prepared.file;
    }).finally(() => { decoratedPromise = null; });
    return decoratedPromise;
  }

  function titleFromModal() {
    return document.getElementById("achievementShareTitle")?.textContent?.trim() || "Salita Quest achievement";
  }

  function textFromModal() {
    return document.getElementById("achievementShareDescription")?.textContent?.trim() || "My Salita Quest achievement.";
  }

  function cleanFilePart(value) {
    return String(value || "achievement").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,56) || "achievement";
  }

  async function copyCaption() {
    const caption = `${prepared.text}\n\nPlay Salita Quest free:\n${APP_URL}`;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(caption);
    } catch {}
    return caption;
  }

  function canShareFile(file) {
    if (!navigator.share) return false;
    if (!navigator.canShare) return true;
    try { return navigator.canShare({files:[file]}); }
    catch { return false; }
  }

  async function downloadFile(file) {
    const href = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = href;
    link.download = prepared.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(href), 1500);
  }

  async function shareOnMobile() {
    const file = await ensureDecoratedFile();
    const caption = await copyCaption();
    if (canShareFile(file)) {
      await navigator.share({title:prepared.title,text:caption,files:[file]});
      return;
    }
    await downloadFile(file);
  }

  async function saveAchievement() {
    const file = await ensureDecoratedFile();
    await downloadFile(file);
  }

  function renderActions() {
    const host = document.getElementById("achievementSharePlatforms");
    const secondary = modal()?.querySelector(".achievement-share-secondary");
    if (!host) return;
    host.className = "achievement-share-router-v3";
    host.innerHTML = isMobileShareDevice()
      ? `<button type="button" data-sq-share-main>Share</button><button type="button" data-sq-share-save>Save</button>`
      : `<button type="button" data-sq-share-save>Save</button>`;
    host.classList.toggle("desktop-save-only", !isMobileShareDevice());
    if (secondary) secondary.hidden = true;
    hideLegacyText();
  }

  async function runAction(button, action) {
    if (actionInProgress) return;
    actionInProgress = true;
    button.disabled = true;
    try { await action(); }
    catch (error) {
      if (error?.name !== "AbortError") console.warn("Achievement sharing action failed", error);
    }
    finally {
      actionInProgress = false;
      button.disabled = false;
      hideLegacyText();
    }
  }

  document.addEventListener("click", event => {
    const button = event.target.closest?.("[data-sq-share-main],[data-sq-share-save]");
    if (!button || !prepared || modal()?.hidden) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    if (button.hasAttribute("data-sq-share-main") && isMobileShareDevice()) runAction(button, shareOnMobile);
    else if (button.hasAttribute("data-sq-share-save")) runAction(button, saveAchievement);
  }, true);

  document.addEventListener("salita:achievement-share-prepared", event => {
    if (prepared?.previewObjectUrl) URL.revokeObjectURL(prepared.previewObjectUrl);
    prepared = {
      type:event.detail?.type || "badge",
      title:titleFromModal(),
      text:textFromModal(),
      source:preview()?.src || "",
      fileName:`salita-quest-${cleanFilePart(event.detail?.type)}-${cleanFilePart(titleFromModal())}.png`,
      file:null,
      previewObjectUrl:""
    };
    decoratedPromise = null;
    renderActions();
    ensureDecoratedFile().catch(error => console.warn("QR card preparation failed", error));
  });

  document.addEventListener("salita:achievement-share-closed", () => {
    if (prepared?.previewObjectUrl) URL.revokeObjectURL(prepared.previewObjectUrl);
    prepared = null;
    decoratedPromise = null;
  });

  window.SalitaQuestSharingRouter = Object.freeze({
    version:3,
    release:RELEASE,
    modes:Object.freeze(["mobile_native_image_share","desktop_save_only"]),
    shareAchievement:shareOnMobile,
    saveAchievement
  });
  document.documentElement.dataset.achievementSharingRouter = RELEASE;
})();