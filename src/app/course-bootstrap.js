(() => {
  "use strict";

  const manifest = window.SalitaQuestCourseManifest;

  function requireManifest() {
    if (!manifest || !manifest.storage || !manifest.courses) {
      throw new Error("Salita Quest course manifest was not loaded.");
    }
    return manifest;
  }

  function readProfiles(storage) {
    try {
      const store = JSON.parse(localStorage.getItem(storage.profileStore) || "null");
      return store && Array.isArray(store.profiles) ? store.profiles : [];
    } catch {
      return [];
    }
  }

  function saveSharedProgress(storage, owner, progress) {
    if (!owner || !progress) return;
    const separator = owner.lastIndexOf(":");
    const profileId = separator > 0 ? owner.slice(0, separator) : owner;
    const courseId = separator > 0 ? owner.slice(separator + 1) : "tagalog";
    if (!readProfiles(storage).some(profile => profile.id === profileId)) return;
    localStorage.setItem(`${storage.profileProgressPrefix}${profileId}.${courseId}`, progress);
    if (courseId === "tagalog") {
      localStorage.setItem(`${storage.profileProgressPrefix}${profileId}`, progress);
    }
  }

  function prepareProgress(storage, course) {
    const activeId = sessionStorage.getItem(storage.activeProfile);
    const profile = readProfiles(storage).find(item => item.id === activeId);
    if (!activeId || !profile) {
      window.location.replace("./");
      return null;
    }

    saveSharedProgress(
      storage,
      localStorage.getItem(storage.baseOwner),
      localStorage.getItem(storage.baseProgress)
    );

    const courseProgressKey = `${storage.profileProgressPrefix}${activeId}.${course.id}`;
    const legacyProgressKey = `${storage.profileProgressPrefix}${activeId}`;
    const activeProgress = localStorage.getItem(courseProgressKey)
      || (course.useLegacyProfileProgress ? localStorage.getItem(legacyProgressKey) : null);

    if (activeProgress) {
      localStorage.setItem(storage.baseProgress, activeProgress);
      localStorage.setItem(courseProgressKey, activeProgress);
    } else {
      localStorage.removeItem(storage.baseProgress);
    }

    localStorage.setItem(storage.baseOwner, `${activeId}:${course.id}`);
    sessionStorage.setItem(storage.activeCourse, course.id);
    return {activeId, profile};
  }

  async function loadCourseDocument(config, course) {
    let html = "";
    try {
      const response = await fetch(config.sourceDocument, {cache: "force-cache"});
      if (!response.ok) throw new Error(`Course document unavailable (${response.status})`);
      html = await response.text();
      if (!html.includes('id="homeView"') || !html.includes('src="app.js"')) {
        throw new Error("The retrieved course document was not recognised.");
      }
      try {
        localStorage.setItem(course.documentCache, html);
      } catch {
        // The course remains usable when document caching exceeds browser storage limits.
      }
    } catch (error) {
      try {
        html = localStorage.getItem(course.documentCache) || "";
      } catch {
        html = "";
      }
      if (!html) throw error;
    }
    return html;
  }

  function assetTags(paths, tagName) {
    return paths.map(path => tagName === "link"
      ? `<link rel="stylesheet" href="${path}">`
      : `<script src="${path}"></script>`
    ).join("");
  }

  function applyReplacements(html, replacements) {
    return replacements.reduce(
      (documentText, [search, replacement]) => documentText.replaceAll(search, replacement),
      html
    );
  }

  function assembleDocument(html, course) {
    const styleMarkup = assetTags(course.styles, "link");
    const extraStyle = course.extraHeadCss ? `<style>${course.extraHeadCss}</style>` : "";
    html = html.replace(
      /<head([^>]*)>/i,
      `<head$1><base href="./">${styleMarkup}${extraStyle}`
    );
    html = html.replace(/<body([^>]*)>/i, `<body$1 data-course="${course.id}">`);
    html = applyReplacements(html, course.replacements);

    const scriptMarkup = assetTags(course.scripts, "script");
    if (course.scriptStrategy === "replace-app") {
      const replaced = html.replace(
        /<script\s+src=["']app\.js["']\s*><\/script>/i,
        scriptMarkup
      );
      if (replaced === html) throw new Error("The core course script could not be replaced.");
      return replaced;
    }

    if (course.scriptStrategy === "append") {
      return html.replace(/<\/body>/i, `${scriptMarkup}</body>`);
    }

    throw new Error(`Unsupported script strategy: ${course.scriptStrategy}`);
  }

  function showLoadError(course, error) {
    console.error(error);
    const loader = document.getElementById("loader");
    if (!loader) return;
    loader.innerHTML = [
      `<div class="mark">${course.errorMark}</div>`,
      `<h1>${course.errorTitle}</h1>`,
      `<p class="error">${course.errorMessage}</p>`
    ].join("");
  }

  async function start({courseId}) {
    const config = requireManifest();
    const course = config.courses[courseId];
    if (!course) throw new Error(`Unknown Salita Quest course: ${courseId}`);

    try {
      if (!prepareProgress(config.storage, course)) return;
      const sourceDocument = await loadCourseDocument(config, course);
      const assembledDocument = assembleDocument(sourceDocument, course);
      document.open();
      document.write(assembledDocument);
      document.close();
    } catch (error) {
      showLoadError(course, error);
    }
  }

  window.SalitaQuestCourseBootstrap = Object.freeze({start});
})();
