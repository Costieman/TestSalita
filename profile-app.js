(() => {
  "use strict";

  const PROFILE_STORE = "salitaQuestLocalProfilesV1";
  const ACTIVE_PROFILE = "salitaQuestActiveProfileId";
  const ACTIVE_COURSE = "salitaQuestActiveCourse";
  const BASE_PROGRESS = "salitaQuestProgress";
  const BASE_OWNER = "salitaQuestBaseProgressOwner";
  const PROFILE_PROGRESS_PREFIX = "salitaQuestProgress.profile.";
  const MIRROR_INTERVAL_MS = 1000;
  const AUTOSAVE_INTERVAL_MS = 15000;
  const COURSE = document.body.dataset.course || sessionStorage.getItem(ACTIVE_COURSE) || "tagalog";

  function loadAvatarModel() {
    if (window.SalitaAvatarModel) return Promise.resolve(window.SalitaAvatarModel);
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-avatar-catalogue],script[data-sq-avatar-asset="catalogue"]');
      if (existing) {
        if (window.SalitaAvatarModel) {
          resolve(window.SalitaAvatarModel);
          return;
        }
        existing.addEventListener("load", () => resolve(window.SalitaAvatarModel), {once:true});
        existing.addEventListener("error", reject, {once:true});
        return;
      }
      const script = document.createElement("script");
      script.src = "./src/features/avatar/avatar-catalogue-v1.js?v=5.5.4";
      script.dataset.avatarCatalogue = "true";
      script.onload = () => resolve(window.SalitaAvatarModel);
      script.onerror = () => reject(new Error("Avatar catalogue could not be loaded."));
      document.head.appendChild(script);
    });
  }

  async function finalAvatarModel(baseModel) {
    for (let attempt = 0; attempt < 125; attempt += 1) {
      if (window.SalitaAvatarHotfixReady) {
        try { await window.SalitaAvatarHotfixReady; } catch {}
        try { await window.SalitaAvatarArtworkReady; } catch {}
        return window.SalitaAvatarModel || baseModel;
      }
      await new Promise(resolve => window.setTimeout(resolve, 40));
    }
    return window.SalitaAvatarModel || baseModel;
  }

  function readStore() {
    try {
      const store = JSON.parse(localStorage.getItem(PROFILE_STORE) || "null");
      return store && Array.isArray(store.profiles)
        ? store
        : {schemaVersion:1, profiles:[]};
    } catch {
      return {schemaVersion:1, profiles:[]};
    }
  }

  function writeStore(store) {
    store.schemaVersion = 1;
    store.updatedAt = new Date().toISOString();
    localStorage.setItem(PROFILE_STORE, JSON.stringify(store));
  }

  const activeId = sessionStorage.getItem(ACTIVE_PROFILE);
  let store = readStore();
  let profile = store.profiles.find(item => item.id === activeId);

  if (!activeId || !profile) {
    window.location.replace("./");
    return;
  }

  sessionStorage.setItem(ACTIVE_COURSE, COURSE);
  const profileProgressKey = `${PROFILE_PROGRESS_PREFIX}${activeId}.${COURSE}`;
  const legacyTagalogKey = `${PROFILE_PROGRESS_PREFIX}${activeId}`;
  let lastProgress = localStorage.getItem(BASE_PROGRESS);

  function syncProgress(force = false) {
    try {
      const progress = localStorage.getItem(BASE_PROGRESS);
      if (!force && progress === lastProgress) return false;
      if (progress) {
        localStorage.setItem(profileProgressKey, progress);
        if (COURSE === "tagalog") localStorage.setItem(legacyTagalogKey, progress);
      } else {
        localStorage.removeItem(profileProgressKey);
      }
      localStorage.setItem(BASE_OWNER, `${activeId}:${COURSE}`);
      lastProgress = progress;
      return true;
    } catch (error) {
      console.warn("Salita Quest could not mirror learner progress", error);
      return false;
    }
  }

  function flushCourseState(reason = "periodic") {
    try {
      if (typeof saveState === "function") saveState();
    } catch (error) {
      console.warn(`Salita Quest could not flush course state during ${reason}`, error);
    }
    syncProgress(true);
  }

  function finishSession() {
    flushCourseState("learner switch");
    sessionStorage.removeItem(ACTIVE_PROFILE);
    sessionStorage.removeItem(ACTIVE_COURSE);
    localStorage.removeItem(BASE_PROGRESS);
    localStorage.removeItem(BASE_OWNER);
    window.location.replace("./");
  }

  function switchCourse() {
    flushCourseState("course switch");
    const nextCourse = COURSE === "cebuano" ? "tagalog" : "cebuano";
    const nextKey = `${PROFILE_PROGRESS_PREFIX}${activeId}.${nextCourse}`;
    const nextProgress = localStorage.getItem(nextKey)
      || (nextCourse === "tagalog" ? localStorage.getItem(legacyTagalogKey) : null);
    if (nextProgress) localStorage.setItem(BASE_PROGRESS, nextProgress);
    else localStorage.removeItem(BASE_PROGRESS);
    localStorage.setItem(BASE_OWNER, `${activeId}:${nextCourse}`);
    sessionStorage.setItem(ACTIVE_COURSE, nextCourse);
    window.location.replace(
      nextCourse === "cebuano"
        ? `bisaya.html?profile=${encodeURIComponent(activeId)}`
        : `app.html?profile=${encodeURIComponent(activeId)}`
    );
  }

  function installProfileControl(model) {
    store = readStore();
    profile = store.profiles.find(item => item.id === activeId);
    if (!profile) {
      finishSession();
      return;
    }

    const collection = model.normaliseCollectionState(profile.avatarCollection, profile.avatarId);
    profile.avatarCollection = collection;
    if (collection.equippedAvatarId) profile.avatarId = collection.equippedAvatarId;
    writeStore(store);

    const getAvatar = value => model.get(value) || model.get("anahaw");
    const currentAvatar = () => getAvatar(profile.avatarCollection.equippedAvatarId || profile.avatarId);

    const style = document.createElement("style");
    style.textContent = `
      .sq-profile-control{position:fixed;right:18px;bottom:20px;z-index:10000;font-family:Inter,"Segoe UI",system-ui,sans-serif}
      .sq-profile-button{width:50px;height:50px;border:2px solid rgba(255,255,255,.92);border-radius:16px;padding:3px;background:#0b6f67;box-shadow:0 10px 30px rgba(8,63,59,.28);cursor:pointer;display:grid;place-items:center}
      .sq-profile-button img{width:40px;height:40px;object-fit:contain;image-rendering:pixelated;border-radius:11px;background:#e6f4ef}
      .sq-profile-menu{position:absolute;right:0;bottom:60px;width:250px;padding:10px;background:#fff;border:1px solid #dbe8e4;border-radius:16px;box-shadow:0 18px 45px rgba(20,62,57,.22)}
      .sq-profile-menu[hidden],.sq-avatar-chooser[hidden]{display:none!important}
      .sq-profile-identity{display:flex;align-items:center;gap:10px;padding:7px 7px 11px;border-bottom:1px solid #e5eeeb;margin-bottom:6px}
      .sq-profile-identity img{width:40px;height:40px;object-fit:contain;image-rendering:pixelated;border-radius:11px;background:#edf5f1}
      .sq-profile-identity small,.sq-profile-identity strong,.sq-profile-identity em{display:block}
      .sq-profile-identity small{font-size:9px;letter-spacing:.12em;color:#607773;font-weight:800}
      .sq-profile-identity strong{font-size:14px;color:#173a37;max-width:155px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .sq-profile-identity em{font-size:11px;color:#0b6f67;font-style:normal;font-weight:800;margin-top:2px}
      .sq-profile-action{width:100%;border:0;border-radius:10px;padding:10px 11px;text-align:left;background:transparent;color:#173a37;font-weight:750;cursor:pointer}
      .sq-profile-action:hover{background:#edf7f3}.sq-profile-action.course{color:#0b6f67}.sq-profile-action.danger{color:#9b3434}
      .sq-profile-save-note{display:block;padding:7px 9px 3px;color:#72817e;font-size:9px;line-height:1.35}
      .sq-avatar-chooser{border-top:1px solid #e5eeeb;margin-top:6px;padding:9px 4px 2px}
      .sq-avatar-chooser>small{display:block;padding:0 4px 7px;color:#607773;font-size:9px;font-weight:900;letter-spacing:.1em}
      .sq-avatar-choice-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
      .sq-avatar-choice{border:1px solid #dbe8e4;border-radius:10px;background:#f6fbf9;padding:4px;cursor:pointer;aspect-ratio:1;display:grid;place-items:center}
      .sq-avatar-choice[aria-pressed="true"]{border-color:#0b6f67;box-shadow:0 0 0 2px rgba(11,111,103,.16)}
      .sq-avatar-choice img{width:42px;height:42px;object-fit:contain;image-rendering:pixelated}
      @media(max-width:760px){.sq-profile-control{right:12px;bottom:calc(76px + env(safe-area-inset-bottom))}.sq-profile-button{width:46px;height:46px;border-radius:14px}.sq-profile-button img{width:36px;height:36px}}
    `;
    document.head.appendChild(style);

    const courseName = COURSE === "cebuano" ? "Bisaya" : "Tagalog";
    const nextCourseName = COURSE === "cebuano" ? "Tagalog" : "Bisaya";
    const initialAvatar = currentAvatar();
    const control = document.createElement("div");
    control.className = "sq-profile-control";
    control.innerHTML = `
      <button class="sq-profile-button" type="button" aria-label="Open learner profile menu" aria-expanded="false">
        <img src="${initialAvatar.image}" data-sq-avatar-id="${initialAvatar.id}" alt="">
      </button>
      <div class="sq-profile-menu" hidden>
        <div class="sq-profile-identity">
          <img src="${initialAvatar.image}" data-sq-avatar-id="${initialAvatar.id}" alt="">
          <div><small>LEARNING AS</small><strong></strong><em>${courseName} course</em></div>
        </div>
        <button class="sq-profile-action" type="button" data-avatar-menu>Choose avatar</button>
        <div class="sq-avatar-chooser" hidden>
          <small>UNLOCKED AVATARS</small>
          <div class="sq-avatar-choice-grid"></div>
        </div>
        <button class="sq-profile-action course" type="button" data-course>Switch to ${nextCourseName}</button>
        <button class="sq-profile-action" type="button" data-change>Change learner</button>
        <button class="sq-profile-action danger" type="button" data-logout>Log out</button>
        <small class="sq-profile-save-note">Progress autosaves every 15 seconds and before switching.</small>
      </div>`;

    control.querySelector(".sq-profile-identity strong").textContent = profile.name;
    const button = control.querySelector(".sq-profile-button");
    const menu = control.querySelector(".sq-profile-menu");
    const chooser = control.querySelector(".sq-avatar-chooser");
    const choiceGrid = control.querySelector(".sq-avatar-choice-grid");

    function renderAvatarChoices() {
      const equipped = profile.avatarCollection.equippedAvatarId;
      const owned = profile.avatarCollection.ownedAvatarIds
        .map(id => model.get(id))
        .filter(Boolean);
      choiceGrid.innerHTML = owned.map(item => `
        <button class="sq-avatar-choice" type="button" data-avatar-choice="${item.id}"
          aria-label="Use ${item.name}" aria-pressed="${String(item.id === equipped)}">
          <img src="${item.image}" data-sq-avatar-id="${item.id}" alt="">
        </button>`).join("");
      window.SalitaAvatarArtwork?.repair(choiceGrid);
    }

    function syncAvatarImages() {
      const item = currentAvatar();
      const images = [
        ...control.querySelectorAll(".sq-profile-button img,.sq-profile-identity img"),
        ...document.querySelectorAll(".player-avatar img")
      ];
      images.forEach(image => {
        image.dataset.sqAvatarId = item.id;
        if (window.SalitaAvatarArtwork) {
          window.SalitaAvatarArtwork.bind(image,item.id,{alt:item.name});
        } else {
          image.src = item.image;
          image.alt = item.name;
        }
      });
    }

    function equipAvatar(id) {
      const item = model.get(id);
      if (!item || !profile.avatarCollection.ownedAvatarIds.includes(item.id)) return;
      profile.avatarCollection.equippedAvatarId = item.id;
      profile.avatarId = item.id;
      writeStore(store);
      syncAvatarImages();
      renderAvatarChoices();
      document.dispatchEvent(new CustomEvent("salita:avatar-equipped", {
        detail:{avatarId:item.id, avatar:item}
      }));
    }

    renderAvatarChoices();

    button.addEventListener("click", event => {
      event.stopPropagation();
      const opening = menu.hidden;
      menu.hidden = !opening;
      button.setAttribute("aria-expanded", String(opening));
      if (opening) flushCourseState("profile menu open");
    });
    control.querySelector("[data-avatar-menu]").addEventListener("click", () => {
      chooser.hidden = !chooser.hidden;
      if (!chooser.hidden) renderAvatarChoices();
    });
    choiceGrid.addEventListener("click", event => {
      const choice = event.target.closest("[data-avatar-choice]");
      if (choice) equipAvatar(choice.dataset.avatarChoice);
    });
    control.querySelector("[data-course]").addEventListener("click", switchCourse);
    control.querySelector("[data-change]").addEventListener("click", finishSession);
    control.querySelector("[data-logout]").addEventListener("click", finishSession);
    document.addEventListener("click", event => {
      if (!control.contains(event.target)) {
        menu.hidden = true;
        chooser.hidden = true;
        button.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        menu.hidden = true;
        chooser.hidden = true;
        button.setAttribute("aria-expanded", "false");
      }
    });

    document.body.appendChild(control);
    window.SalitaAvatarArtwork?.repair(control);

    const selectedAvatar = document.querySelector(".player-avatar");
    if (selectedAvatar) {
      const item = currentAvatar();
      selectedAvatar.innerHTML = `<img src="${item.image}" data-sq-avatar-id="${item.id}" alt="${item.name}">`;
      selectedAvatar.style.overflow = "hidden";
      const avatarStyle = document.createElement("style");
      avatarStyle.textContent = ".player-avatar img{width:100%;height:100%;object-fit:contain;image-rendering:pixelated}";
      document.head.appendChild(avatarStyle);
      window.SalitaAvatarArtwork?.repair(selectedAvatar);
    }

    syncAvatarImages();
    const version = document.querySelector(".version-label");
    if (version) {
      version.textContent = COURSE === "cebuano"
        ? "Bisaya Foundation 0.3 · 13 regions"
        : "Version 5.4.15 · Reliable Autosave";
    }
  }

  function loadCourseEnhancements() {
    if (COURSE !== "cebuano" || document.querySelector("script[data-bisaya-review-regions]")) return;
    const script = document.createElement("script");
    script.src = "./bisaya-review-regions.js?v=0.3.0";
    script.dataset.bisayaReviewRegions = "true";
    script.onerror = () => console.warn("Bisaya review regions could not be loaded.");
    document.body.appendChild(script);
  }

  const mirrorTimer = window.setInterval(syncProgress, MIRROR_INTERVAL_MS);
  const autosaveTimer = window.setInterval(
    () => flushCourseState("periodic autosave"),
    AUTOSAVE_INTERVAL_MS
  );

  window.addEventListener("beforeunload", () => flushCourseState("before unload"));
  window.addEventListener("pagehide", () => flushCourseState("page hide"));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) flushCourseState("tab hidden");
  });

  function start() {
    loadAvatarModel()
      .then(finalAvatarModel)
      .then(model => {
        if (!model) throw new Error("Avatar data model is unavailable.");
        installProfileControl(model);
        loadCourseEnhancements();
        window.setTimeout(() => flushCourseState("initial autosave"), 1200);
      })
      .catch(error => {
        console.warn("Salita Quest avatar profile controls could not be initialised", error);
        loadCourseEnhancements();
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, {once:true});
  } else {
    start();
  }

  window.addEventListener("unload", () => {
    window.clearInterval(mirrorTimer);
    window.clearInterval(autosaveTimer);
  });
})();
