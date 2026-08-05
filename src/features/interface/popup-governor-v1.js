(() => {
  "use strict";

  const RELEASE = "5.5.3";
  const INSTALL_FLAG = "__salitaQuestPopupGovernorV1Installed";
  const RETRY_DELAY_MS = 450;
  const queue = [];
  const queuedKeys = new Set();
  let activeRequest = null;
  let sequence = 0;
  let drainTimer = 0;
  let suspendedUntil = 0;
  let suspendedReason = "";

  const UNMANAGED_BLOCKERS = [
    ".daily-key-celebration",
    ".daily-key-award",
    ".weekly-avatar-shard-modal:not([hidden])",
    ".achievement-share-modal:not([hidden])",
    ".placement-modal:not(.hidden)"
  ].join(",");

  function homeIsActive() {
    const home = document.getElementById("homeView");
    return Boolean(home?.classList.contains("active")) && document.body.dataset.currentView === "home";
  }

  function placementIsUpdating() {
    return document.documentElement.dataset.placementUpdating === "true" ||
      document.body.classList.contains("placement-open");
  }

  function dispatch(name, detail = {}) {
    try {
      document.dispatchEvent(new CustomEvent(name, {
        detail:{release:RELEASE, ...detail}
      }));
    } catch {}
  }

  function scheduleDrain(delay = 0) {
    window.clearTimeout(drainTimer);
    drainTimer = window.setTimeout(drain, Math.max(0, Number(delay) || 0));
  }

  function removeQueued(key) {
    const index = queue.findIndex(item => item.key === key);
    if (index >= 0) queue.splice(index, 1);
    queuedKeys.delete(key);
  }

  function acknowledged(request) {
    try { return request.isAcknowledged?.() === true; }
    catch { return false; }
  }

  function canRun(request) {
    if (document.hidden || Date.now() < suspendedUntil || placementIsUpdating()) return false;
    if (request.homeOnly !== false && !homeIsActive()) return false;
    if (document.querySelector(UNMANAGED_BLOCKERS)) return false;
    try { return request.canRun ? request.canRun() !== false : true; }
    catch { return false; }
  }

  function nextRunnable() {
    queue.sort((a,b) => b.priority - a.priority || a.sequence - b.sequence);
    return queue.find(canRun) || null;
  }

  async function run(request) {
    removeQueued(request.key);
    activeRequest = request;
    dispatch("salita:popup-starting", {key:request.key, type:request.type});
    try {
      if (acknowledged(request)) {
        dispatch("salita:popup-skipped", {
          key:request.key,
          type:request.type,
          reason:"already_acknowledged"
        });
        return;
      }

      // This ordering is the central safety rule: state is durable before any popup DOM exists.
      await request.acknowledge();
      dispatch("salita:popup-acknowledged", {key:request.key, type:request.type});
      await request.show({key:request.key, type:request.type, release:RELEASE});
      dispatch("salita:popup-finished", {key:request.key, type:request.type});
    } catch (error) {
      console.warn(`Salita Quest popup ${request.key} failed after acknowledgement`, error);
      dispatch("salita:popup-failed", {
        key:request.key,
        type:request.type,
        message:String(error?.message || error)
      });
    } finally {
      activeRequest = null;
      scheduleDrain(120);
    }
  }

  function drain() {
    window.clearTimeout(drainTimer);
    drainTimer = 0;
    if (activeRequest || !queue.length) return;
    const request = nextRunnable();
    if (!request) {
      scheduleDrain(RETRY_DELAY_MS);
      return;
    }
    void run(request);
  }

  function enqueue(spec = {}) {
    const key = String(spec.key || "").trim();
    if (!key || typeof spec.acknowledge !== "function" || typeof spec.show !== "function") {
      throw new Error("Popup requests require key, acknowledge and show");
    }
    if (activeRequest?.key === key || queuedKeys.has(key) || acknowledged(spec)) return false;

    const request = {
      key,
      type:String(spec.type || "generic"),
      priority:Number.isFinite(Number(spec.priority)) ? Number(spec.priority) : 50,
      homeOnly:spec.homeOnly !== false,
      canRun:typeof spec.canRun === "function" ? spec.canRun : null,
      isAcknowledged:typeof spec.isAcknowledged === "function" ? spec.isAcknowledged : null,
      acknowledge:spec.acknowledge,
      show:spec.show,
      sequence:sequence++
    };
    queue.push(request);
    queuedKeys.add(key);
    dispatch("salita:popup-queued", {key, type:request.type, priority:request.priority});
    scheduleDrain();
    return true;
  }

  function cancel(key, reason = "cancelled") {
    const safeKey = String(key || "");
    if (!queuedKeys.has(safeKey)) return false;
    removeQueued(safeKey);
    dispatch("salita:popup-cancelled", {key:safeKey, reason});
    return true;
  }

  function suspend(milliseconds = 1200, reason = "external_flow") {
    suspendedUntil = Math.max(
      suspendedUntil,
      Date.now() + Math.max(0, Number(milliseconds) || 0)
    );
    suspendedReason = reason;
    dispatch("salita:popup-suspended", {reason, until:suspendedUntil});
    scheduleDrain(Math.max(50, suspendedUntil - Date.now()));
  }

  function resume(reason = "manual") {
    suspendedUntil = 0;
    suspendedReason = "";
    dispatch("salita:popup-resumed", {reason});
    scheduleDrain();
  }

  function getAvatarImagePath(avatarId) {
    try { return String(window.SalitaAvatarModel?.get?.(avatarId)?.image || ""); }
    catch { return ""; }
  }

  if (window[INSTALL_FLAG]) return;
  window[INSTALL_FLAG] = true;
  window.SalitaPopupGovernor = Object.freeze({
    version:1,
    release:RELEASE,
    enqueue,
    cancel,
    suspend,
    resume,
    notify:() => scheduleDrain(),
    status:() => Object.freeze({
      active:activeRequest?.key || null,
      queued:queue.map(item => item.key),
      suspendedUntil,
      suspendedReason
    })
  });
  window.SalitaAvatarAssets = Object.freeze({
    ...(window.SalitaAvatarAssets || {}),
    getAvatarImagePath
  });
  window.getAvatarImagePath = getAvatarImagePath;
  document.documentElement.dataset.popupGovernance = RELEASE;

  ["visibilitychange", "salita:view-changed", "salita:course-progress-restored", "salita:placement-finished"]
    .forEach(name => document.addEventListener(name, () => scheduleDrain(80)));
  window.addEventListener("pageshow", () => scheduleDrain(80));
})();
