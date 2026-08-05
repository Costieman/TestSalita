(() => {
  "use strict";

  if (window.__salitaProfileInstallPromptV1) return;
  window.__salitaProfileInstallPromptV1 = true;

  let deferredPrompt = null;
  let landingObserver = null;
  const isStandalone = () => window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent || "");

  function showMessage(message) {
    const toast = document.getElementById("profileToast");
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(showMessage.timer);
    showMessage.timer = window.setTimeout(() => { toast.hidden = true; }, 5000);
  }

  function renderInstallLanding() {
    if (isStandalone()) return;
    const panel = document.getElementById("profilePanel");
    if (!panel || panel.dataset.installLanding === "true") return;
    panel.dataset.installLanding = "true";
    panel.innerHTML = `
      <div class="profile-install-hero">
        <p class="profile-eyebrow">YOUR PHILIPPINE LANGUAGE JOURNEY</p>
        <h2>Start speaking like a local.</h2>
        <p>Learn Tagalog or Bisaya through short lessons, speaking practice, and daily progress.</p>
        <div class="profile-install-benefits" aria-label="Salita Quest features">
          <span>Tagalog + Bisaya</span>
          <span>Short daily lessons</span>
          <span>Progress saved locally</span>
        </div>
      </div>`;
  }

  function keepLandingVisible() {
    if (isStandalone()) {
      landingObserver?.disconnect();
      landingObserver = null;
      return;
    }
    const panel = document.getElementById("profilePanel");
    if (!panel || landingObserver) return;
    landingObserver = new MutationObserver(() => {
      if (!isStandalone() && panel.dataset.installLanding !== "true") renderInstallLanding();
    });
    landingObserver.observe(panel, {childList:true});
  }

  function installButton() {
    const gate = document.getElementById("profileGate");
    if (!gate || document.querySelector("[data-install-salita]")) return;
    if (!isStandalone()) renderInstallLanding();

    const button = document.createElement("button");
    button.type = "button";
    button.className = "profile-install-app";
    button.dataset.installSalita = "true";
    button.innerHTML = '<span class="profile-install-app-icon" aria-hidden="true">⬇</span><span><strong>Download the app</strong><small>Install Salita Quest on this device</small></span>';
    button.addEventListener("click", async () => {
      if (isStandalone()) {
        showMessage("Salita Quest is already installed on this device.");
        return;
      }
      if (deferredPrompt) {
        const prompt = deferredPrompt;
        deferredPrompt = null;
        await prompt.prompt();
        const choice = await prompt.userChoice.catch(() => null);
        if (choice?.outcome === "accepted") button.hidden = true;
        return;
      }
      if (isIOS()) showMessage("In Safari, tap Share, then choose Add to Home Screen.");
      else showMessage("Open this page in Chrome, then choose Install app or Add to Home screen from the browser menu.");
    });
    gate.appendChild(button);
    if (isStandalone()) button.hidden = true;
    keepLandingVisible();
  }

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredPrompt = event;
    installButton();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    document.querySelector("[data-install-salita]")?.setAttribute("hidden", "");
    showMessage("Salita Quest was installed. Open it from your home screen to create your learner profile.");
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", installButton, {once:true});
  else installButton();
})();
