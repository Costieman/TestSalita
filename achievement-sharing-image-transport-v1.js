(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestAchievementImageTransportV1Installed";
  const RELEASE = "5.5.10-facebook-card-image";
  const MODAL_ID = "achievementShareModalV4";
  const PREVIEW_ID = "achievementSharePreview";

  if (window[INSTALL_FLAG]) return;
  window[INSTALL_FLAG] = true;

  let preparedDetail = null;
  let preparedFile = null;
  let preparedSource = "";
  let preparationPromise = null;

  function modal() {
    return document.getElementById(MODAL_ID);
  }

  function preview() {
    return document.getElementById(PREVIEW_ID);
  }

  function setStatus(message, error = false) {
    const node = document.getElementById("achievementShareStatus");
    if (!node) return;
    node.textContent = message || "";
    node.classList.toggle("error", Boolean(error));
  }

  function cleanFilePart(value) {
    return String(value || "achievement")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "achievement";
  }

  function currentFileName() {
    const type = preparedDetail?.type || "achievement";
    const title = document.getElementById("achievementShareTitle")?.textContent || type;
    return `salita-quest-${cleanFilePart(type)}-${cleanFilePart(title)}.png`;
  }

  function currentTitle() {
    return document.getElementById("achievementShareTitle")?.textContent?.trim() || "Salita Quest achievement";
  }

  function currentText() {
    return document.getElementById("achievementShareDescription")?.textContent?.trim() || "My Salita Quest achievement.";
  }

  function primePreparedFile() {
    const source = preview()?.src || "";
    if (!source) return Promise.reject(new Error("The achievement image is not ready yet."));
    if (preparedFile && preparedSource === source) return Promise.resolve(preparedFile);
    if (preparationPromise && preparedSource === source) return preparationPromise;

    preparedSource = source;
    preparedFile = null;
    preparationPromise = fetch(source)
      .then(response => {
        if (!response.ok) throw new Error("The achievement image could not be read.");
        return response.blob();
      })
      .then(blob => {
        const png = blob.type === "image/png" ? blob : new Blob([blob], {type:"image/png"});
        preparedFile = new File([png], currentFileName(), {type:"image/png"});
        return preparedFile;
      })
      .finally(() => {
        preparationPromise = null;
      });

    preparationPromise.catch(error => console.warn("Salita Quest achievement image preparation failed", error));
    return preparationPromise;
  }

  function hasFileShare(file) {
    try {
      return Boolean(file && navigator.share && navigator.canShare?.({files:[file]}));
    } catch {
      return false;
    }
  }

  function isPhoneLike() {
    try {
      return window.matchMedia("(max-width: 1000px), (pointer: coarse)").matches;
    } catch {
      return window.innerWidth <= 1000;
    }
  }

  function updatePlatformCopy() {
    if (!isPhoneLike()) return;
    const facebook = document.querySelector('[data-achievement-platform="facebook"] small');
    if (facebook) facebook.textContent = "Share the achievement image through your device";
  }

  function sharePreparedImage(provider = "device") {
    const source = preview()?.src || "";
    if (!preparedFile || !source || preparedSource !== source) {
      primePreparedFile();
      setStatus("The image is still finishing. Tap the share button again in a moment.", true);
      return;
    }
    if (!hasFileShare(preparedFile)) {
      setStatus("This browser cannot attach the image directly. Download the card instead.", true);
      return;
    }

    const payload = {
      files:[preparedFile],
      title:currentTitle(),
      text:currentText()
    };

    // Deliberately omit a URL when a PNG is attached. Some social targets
    // otherwise replace the image with a generic link preview.
    let result;
    try {
      result = navigator.share(payload);
    } catch (error) {
      setStatus(error?.message || "The image could not be shared.", true);
      return;
    }

    Promise.resolve(result).then(() => {
      const label = provider === "facebook" ? "Facebook" : provider === "instagram" ? "Instagram" : provider === "tiktok" ? "TikTok" : "Your app";
      setStatus(`${label} received the achievement image.`);
    }).catch(error => {
      if (error?.name === "AbortError") setStatus("Sharing cancelled.");
      else setStatus(error?.message || "The image could not be shared.", true);
    });
  }

  function useImageTransport(provider, nativeButton) {
    if (nativeButton) return true;
    if (provider === "instagram" || provider === "tiktok") return true;
    return provider === "facebook" && isPhoneLike();
  }

  function handleCapturedClick(event) {
    const nativeButton = event.target.closest?.("[data-achievement-native]");
    const platformButton = event.target.closest?.("[data-achievement-platform]");
    if (!nativeButton && !platformButton) return;

    const host = modal();
    if (!host || host.hidden) return;
    const provider = platformButton?.dataset.achievementPlatform || "device";
    if (!useImageTransport(provider, nativeButton)) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    sharePreparedImage(provider);
  }

  document.addEventListener("click", handleCapturedClick, true);
  document.addEventListener("salita:achievement-share-prepared", event => {
    preparedDetail = event.detail || null;
    preparedFile = null;
    preparedSource = "";
    updatePlatformCopy();
    window.setTimeout(() => primePreparedFile().catch(() => {}), 0);
  });

  new MutationObserver(records => {
    if (!records.some(record => record.type === "attributes" && record.target?.id === PREVIEW_ID)) return;
    preparedFile = null;
    preparedSource = "";
    window.setTimeout(() => primePreparedFile().catch(() => {}), 0);
  }).observe(document.documentElement, {subtree:true, attributes:true, attributeFilter:["src"]});

  document.documentElement.dataset.achievementImageTransport = RELEASE;
  document.dispatchEvent(new CustomEvent("salita:achievement-image-transport-ready", {
    detail:{release:RELEASE, fileOnlyPayload:true}
  }));
})();
