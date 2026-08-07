(() => {
  "use strict";

  if (window.__salitaDailyKeyRewardPriorityV1Installed) return;
  window.__salitaDailyKeyRewardPriorityV1Installed = true;

  const RESERVATION_CLASS = "daily-key-reward-reservation";
  let releaseTimer = 0;
  let reservation = null;

  function chestState() {
    try {
      const chest = state?.weeklyAvatarChest;
      return chest && typeof chest === "object" ? chest : null;
    } catch {
      return null;
    }
  }

  function hasPendingKey() {
    const chest = chestState();
    return Boolean(Array.isArray(chest?.pendingKeyAwards) && chest.pendingKeyAwards.some(item => item?.date));
  }

  function keyAnimationVisible() {
    return Boolean(document.querySelector(".daily-key-celebration:not(.daily-key-reward-reservation),.daily-key-award"));
  }

  function reserve() {
    window.clearTimeout(releaseTimer);
    if (reservation?.isConnected) return;
    reservation = document.createElement("div");
    reservation.className = `daily-key-celebration ${RESERVATION_CLASS}`;
    reservation.hidden = true;
    reservation.setAttribute("aria-hidden", "true");
    document.body.appendChild(reservation);
    document.documentElement.dataset.dailyKeyRewardPriority = "reserved";
    try { window.SalitaPopupGovernor?.suspend?.(6000, "daily_key_priority"); } catch {}
  }

  function releaseSoon() {
    window.clearTimeout(releaseTimer);
    releaseTimer = window.setTimeout(() => {
      if (hasPendingKey() || keyAnimationVisible()) {
        sync();
        return;
      }
      reservation?.remove();
      reservation = null;
      delete document.documentElement.dataset.dailyKeyRewardPriority;
      try {
        window.SalitaPopupGovernor?.resume?.("daily_key_finished");
        window.SalitaPopupGovernor?.notify?.();
      } catch {}
      document.dispatchEvent(new CustomEvent("salita:daily-key-reward-finished"));
    }, 650);
  }

  function sync() {
    if (hasPendingKey() || keyAnimationVisible()) reserve();
    else if (reservation) releaseSoon();
  }

  document.addEventListener("salita:popup-queued", sync);
  document.addEventListener("salita:badge-earned", sync);
  document.addEventListener("visibilitychange", sync);
  window.addEventListener("pageshow", sync);

  const observer = new MutationObserver(sync);
  observer.observe(document.documentElement, {subtree:true, childList:true, attributes:true, attributeFilter:["class"]});
  window.setInterval(sync, 180);
  sync();
})();
