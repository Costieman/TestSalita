(() => {
  "use strict";

  const PROFILE_STORE = "salitaQuestLocalProfilesV1";
  const ACTIVE_PROFILE = "salitaQuestActiveProfileId";
  const BASE_PROGRESS = "salitaQuestProgress";
  const BASE_OWNER = "salitaQuestBaseProgressOwner";
  const PROFILE_PROGRESS_PREFIX = "salitaQuestProgress.profile.";
  const LEGACY_KEYS = ["salitaQuestStateV3", "salitaQuestStateV2", "salitaQuestState"];

  const AVATARS = [
    ["tarsier", "Philippine Tarsier", "A tiny forest primate known for its enormous eyes and incredible jumping ability."],
    ["eagle", "Philippine Eagle", "A powerful forest eagle with a striking feathered crest and impressive wingspan."],
    ["tamaraw", "Tamaraw", "A rare wild buffalo found only on the Philippine island of Mindoro."],
    ["peacock", "Palawan Peacock-Pheasant", "A beautiful forest bird with shimmering blue-green feathers and a delicate crest."],
    ["orchid", "Waling-Waling Orchid", "A spectacular Philippine orchid admired for its large, colourful flowers."],
    ["jade", "Jade Vine", "A tropical climbing plant with unusual turquoise flowers shaped like curved claws."],
    ["rafflesia", "Philippine Rafflesia", "A remarkable rainforest flower known for its enormous, spotted red petals."],
    ["anahaw", "Anahaw", "A native fan palm whose broad green leaves are a familiar Philippine symbol."]
  ].map(([id, title, description]) => ({ id, title, description, src: `avatars/${id}.png` }));

  const panel = document.querySelector("#profilePanel");
  const toast = document.querySelector("#profileToast");
  const escapeHTML = value => String(value ?? "").replace(/[&<>'"]/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);

  function avatar(id) {
    return AVATARS.find(item => item.id === id) || AVATARS[0];
  }

  function readProfiles() {
    try {
      const value = JSON.parse(localStorage.getItem(PROFILE_STORE) || "null");
      return value && Array.isArray(value.profiles)
        ? value
        : { schemaVersion: 1, profiles: [] };
    } catch {
      return { schemaVersion: 1, profiles: [] };
    }
  }

  function writeProfiles(store) {
    store.schemaVersion = 1;
    store.updatedAt = new Date().toISOString();
    localStorage.setItem(PROFILE_STORE, JSON.stringify(store));
  }

  function profileProgressKey(id) {
    return `${PROFILE_PROGRESS_PREFIX}${id}`;
  }

  function createId() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return [...crypto.getRandomValues(new Uint8Array(16))]
      .map(value => value.toString(16).padStart(2, "0"))
      .join("");
  }

  function createSalt() {
    return [...crypto.getRandomValues(new Uint8Array(16))]
      .map(value => value.toString(16).padStart(2, "0"))
      .join("");
  }

  async function hashPin(pin, salt) {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(`${salt}:${pin}`)
    );
    return [...new Uint8Array(digest)]
      .map(value => value.toString(16).padStart(2, "0"))
      .join("");
  }

  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { toast.hidden = true; }, 3000);
  }

  function findLegacyProgress() {
    let value = localStorage.getItem(BASE_PROGRESS);
    if (value) return value;
    for (const key of LEGACY_KEYS) {
      value = localStorage.getItem(key);
      if (value) return value;
    }
    return null;
  }

  function recoverCurrentOwner() {
    const ownerId = localStorage.getItem(BASE_OWNER);
    const progress = localStorage.getItem(BASE_PROGRESS);
    if (!ownerId || !progress) return;
    if (readProfiles().profiles.some(profile => profile.id === ownerId)) {
      localStorage.setItem(profileProgressKey(ownerId), progress);
    }
  }

  function clearSharedProgress() {
    localStorage.removeItem(BASE_PROGRESS);
    localStorage.removeItem(BASE_OWNER);
  }

  function loadProfileProgress(profile) {
    recoverCurrentOwner();
    const progress = localStorage.getItem(profileProgressKey(profile.id));
    if (progress) localStorage.setItem(BASE_PROGRESS, progress);
    else localStorage.removeItem(BASE_PROGRESS);
    localStorage.setItem(BASE_OWNER, profile.id);
  }

  function requestPersistentStorage() {
    try { navigator.storage?.persist?.(); } catch {}
  }

  function openProfile(profile) {
    const store = readProfiles();
    const savedProfile = store.profiles.find(item => item.id === profile.id);
    if (!savedProfile) return renderProfileChoice();

    savedProfile.lastUsedAt = new Date().toISOString();
    writeProfiles(store);
    loadProfileProgress(savedProfile);
    sessionStorage.setItem(ACTIVE_PROFILE, savedProfile.id);
    requestPersistentStorage();

    window.location.replace(`app.html?profile=${encodeURIComponent(savedProfile.id)}`);
  }

  function renderProfileChoice() {
    const store = readProfiles();
    const hasProfiles = store.profiles.length > 0;
    const profiles = [...store.profiles].sort((a, b) =>
      String(b.lastUsedAt || "").localeCompare(String(a.lastUsedAt || ""))
    );

    panel.innerHTML = `
      <div class="profile-panel-header">
        <div>
          <p class="profile-eyebrow">WELCOME</p>
          <h2>${hasProfiles ? "Choose your learner" : "Create your first learner"}</h2>
          <p>${hasProfiles ? "Select a local profile and enter its PIN." : "Each learner receives separate progress on this device."}</p>
        </div>
      </div>
      ${hasProfiles ? `
        <div class="profile-list">
          ${profiles.map(profile => {
            const selectedAvatar = avatar(profile.avatarId);
            return `
              <button class="profile-choice" type="button" data-profile="${profile.id}">
                <img src="${selectedAvatar.src}" alt="">
                <span><strong>${escapeHTML(profile.name)}</strong><small>${escapeHTML(selectedAvatar.title)}</small></span>
              </button>`;
          }).join("")}
          <button class="profile-choice profile-add-card" type="button" data-new-profile>
            <span class="profile-add-icon">＋</span><span>Add another learner</span>
          </button>
        </div>` : `
        <button class="profile-btn" type="button" data-new-profile>Create learner profile</button>`}
      <div class="profile-info-note">
        <strong>Stored locally:</strong> clearing website data, private browsing, or changing browsers may remove access. Keep using JSON backups.
      </div>`;
  }

  function renderLogin(profileId) {
    const profile = readProfiles().profiles.find(item => item.id === profileId);
    if (!profile) return renderProfileChoice();
    const selectedAvatar = avatar(profile.avatarId);

    panel.innerHTML = `
      <div class="profile-login-title">
        <img class="profile-login-avatar" src="${selectedAvatar.src}" alt="">
        <p class="profile-eyebrow">${escapeHTML(selectedAvatar.title).toUpperCase()}</p>
        <h2>${escapeHTML(profile.name)}</h2>
        <p>Enter your local PIN to continue.</p>
      </div>
      <form id="loginForm" class="profile-form">
        <label class="profile-field">
          <span>PIN</span>
          <input id="loginPin" type="password" inputmode="numeric" minlength="4" maxlength="6" pattern="[0-9]{4,6}" required autofocus>
          <small>Four to six numbers.</small>
        </label>
        <div id="profileError" class="profile-error"></div>
        <div class="profile-actions">
          <button class="profile-btn secondary" type="button" data-back>Back</button>
          <button class="profile-btn" type="submit">Open Salita Quest</button>
        </div>
      </form>
      <div class="profile-info-note">This is a casual local profile lock, not a secure online account.</div>`;

    document.querySelector("#loginForm").addEventListener("submit", async event => {
      event.preventDefault();
      const pin = document.querySelector("#loginPin").value.trim();
      const error = document.querySelector("#profileError");
      const submit = event.submitter;

      if (!/^\d{4,6}$/.test(pin)) {
        error.textContent = "Enter the four- to six-digit PIN.";
        return;
      }

      submit.disabled = true;
      submit.textContent = "Checking…";
      const pinHash = await hashPin(pin, profile.pinSalt);

      if (pinHash !== profile.pinHash) {
        error.textContent = "That PIN is not correct.";
        submit.disabled = false;
        submit.textContent = "Open Salita Quest";
        document.querySelector("#loginPin").select();
        return;
      }

      openProfile(profile);
    });
  }

  function renderCreateProfile() {
    const hasProfiles = readProfiles().profiles.length > 0;

    panel.innerHTML = `
      <div class="profile-panel-header">
        <div>
          <p class="profile-eyebrow">NEW LOCAL PROFILE</p>
          <h2>Create a learner</h2>
          <p>Choose a Philippine species avatar and protect the profile with a PIN.</p>
        </div>
      </div>
      <form id="createProfileForm" class="profile-form">
        <label class="profile-field">
          <span>Learner name</span>
          <input id="learnerName" maxlength="24" required>
        </label>
        <div class="profile-pin-row">
          <label class="profile-field">
            <span>Create PIN</span>
            <input id="newPin" type="password" inputmode="numeric" minlength="4" maxlength="6" required>
          </label>
          <label class="profile-field">
            <span>Confirm PIN</span>
            <input id="confirmPin" type="password" inputmode="numeric" minlength="4" maxlength="6" required>
          </label>
        </div>
        <div class="profile-avatar-heading">
          <strong>Choose your avatar</strong>
          <small>Philippine native flora and fauna</small>
        </div>
        <div class="avatar-grid">
          ${AVATARS.map((item, index) => `
            <div class="avatar-option">
              <input id="avatar-${item.id}" type="radio" name="avatar" value="${item.id}" ${index === 0 ? "checked" : ""}>
              <label for="avatar-${item.id}">
                <img src="${item.src}" alt="">
                <strong>${item.title}</strong>
                <small>${item.description}</small>
              </label>
            </div>`).join("")}
        </div>
        <label class="profile-consent">
          <input id="storageConsent" type="checkbox" required>
          <span>I understand that this learner’s profile and progress will be stored in this browser on this device.</span>
        </label>
        <div id="profileError" class="profile-error"></div>
        <div class="profile-actions">
          ${hasProfiles ? '<button class="profile-btn secondary" type="button" data-back>Back</button>' : ""}
          <button class="profile-btn" type="submit">Create and continue</button>
        </div>
      </form>`;

    document.querySelector("#createProfileForm").addEventListener("submit", async event => {
      event.preventDefault();
      const store = readProfiles();
      const name = document.querySelector("#learnerName").value.trim().replace(/\s+/g, " ");
      const pin = document.querySelector("#newPin").value.trim();
      const confirmation = document.querySelector("#confirmPin").value.trim();
      const error = document.querySelector("#profileError");

      if (!name || name.length > 24) {
        error.textContent = "Enter a learner name of up to 24 characters.";
        return;
      }
      if (store.profiles.some(profile => profile.name.toLowerCase() === name.toLowerCase())) {
        error.textContent = "That learner name already exists.";
        return;
      }
      if (!/^\d{4,6}$/.test(pin)) {
        error.textContent = "Create a PIN containing four to six numbers.";
        return;
      }
      if (pin !== confirmation) {
        error.textContent = "The PIN entries do not match.";
        return;
      }
      if (!document.querySelector("#storageConsent").checked) {
        error.textContent = "Accept local storage before continuing.";
        return;
      }

      const salt = createSalt();
      const profile = {
        id: createId(),
        name,
        avatarId: document.querySelector('input[name="avatar"]:checked').value,
        pinSalt: salt,
        pinHash: await hashPin(pin, salt),
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
        consentVersion: 1
      };

      const existingProgress = store.profiles.length ? null : findLegacyProgress();
      store.profiles.push(profile);
      writeProfiles(store);
      if (existingProgress) {
        localStorage.setItem(profileProgressKey(profile.id), existingProgress);
      }

      showToast(existingProgress
        ? "Profile created. Existing progress was preserved."
        : "Learner profile created.");
      openProfile(profile);
    });
  }

  panel.addEventListener("click", event => {
    const target = event.target.closest("[data-profile], [data-new-profile], [data-back]");
    if (!target) return;
    if (target.dataset.profile) renderLogin(target.dataset.profile);
    else if (target.hasAttribute("data-new-profile")) renderCreateProfile();
    else renderProfileChoice();
  });

  (function initialise() {
    try {
      localStorage.setItem("__salitaStorageTest", "1");
      localStorage.removeItem("__salitaStorageTest");
    } catch {
      panel.innerHTML = "<h2>Local storage is unavailable</h2><p>Leave private browsing or enable site storage, then reload.</p>";
      return;
    }

    recoverCurrentOwner();
    const store = readProfiles();
    const activeId = sessionStorage.getItem(ACTIVE_PROFILE);
    const activeProfile = store.profiles.find(profile => profile.id === activeId);

    if (activeProfile) {
      loadProfileProgress(activeProfile);
      window.location.replace(`app.html?profile=${encodeURIComponent(activeProfile.id)}`);
      return;
    }

    sessionStorage.removeItem(ACTIVE_PROFILE);
    clearSharedProgress();
    renderProfileChoice();

    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
      navigator.serviceWorker.register("./service-worker.js").catch(() => {});
    }
  })();
})();
