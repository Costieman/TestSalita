(() => {
  "use strict";

  const sharedStyles = [
    "ui-quality-fixes.css?v=5.4.21",
    "ui-answer-breakdown.css?v=5.4.21",
    "incorrect-order-feedback.css?v=5.4.21",
    "compact-desktop-layout.css?v=5.4.21",
    "compact-home-dashboard.css?v=5.4.21",
    "weekly-avatar-chest.css?v=5.4.21",
    "clean-topbar.css?v=5.4.21",
    "world-progress-status.css?v=5.4.21",
    "mastery-feedback.css?v=5.4.21",
    "mastery-console-overrides.css?v=5.4.21",
    "lesson-side-launcher.css?v=5.4.21",
    "mobile-session-refinement.css?v=5.4.21",
    "profile-emblem-control.css?v=5.5.4",
    "level-progression-v2.css?v=5.5.3",
    "fluid-desktop-app.css?v=5.4.21",
    "adaptive-scenarios.css?v=5.4.21",
    "desktop-navigation-refinement.css?v=5.5.3",
    "badge-catalogue-v2.css?v=5.4.23",
    "badge-layout-v3.css?v=5.4.25",
    "badge-chest-v2.css?v=5.4.29",
    "placement-onboarding-v1.css?v=5.4.23",
    "social-connections-v2.css?v=5.4.27",
    "achievement-sharing-v4.css?v=5.4.29"
  ];

  const tagalogScripts = [
    "progression-v54.js?v=5.4.21",
    "exercise-fixes-v545.js?v=5.4.21",
    "ui-quality-fixes.js?v=5.4.21",
    "daily-goal-refinement.js?v=5.4.21",
    "weekly-avatar-chest.js?v=5.4.21",
    "key-run-refinement.js?v=5.4.21",
    "weekly-avatar-polish.js?v=5.4.21",
    "src/adapters/exercise/incorrect-order-feedback-runtime-v1.js?v=5.4.21",
    "src/features/exercise/incorrect-order-feedback.js?v=5.4.21",
    "incorrect-order-feedback.js?v=5.4.21",
    "src/features/interface/compact-desktop-layout.js?v=5.4.21",
    "src/features/interface/clean-topbar.js?v=5.4.21",
    "src/features/progression/even-progress-rail.js?v=5.4.21",
    "mastery-feedback.js?v=5.4.21",
    "lesson-side-launcher.js?v=5.4.21",
    "mobile-session-refinement.js?v=5.4.21",
    "src/features/interface/popup-governor-v1.js?v=5.5.3",
    "profile-app.js?v=5.5.4",
    "profile-emblem-control.js?v=5.5.4",
    "adaptive-scenarios.js?v=5.4.21",
    "level-progression-v2.js?v=5.5.3",
    "src/features/interface/level-up-mobile-safety-v552.js?v=5.5.3",
    "desktop-navigation-refinement.js?v=5.5.3",
    "src/features/audio/pronunciation-release-control.js?v=5.4.22",
    "src/features/progression/home-reward-coordinator.js?v=5.4.22",
    "badge-catalogue-v2.js?v=5.4.23",
    "badge-chest-v2.js?v=5.4.29",
    "placement-onboarding-v1.js?v=5.4.23",
    "social-connections-v2.js?v=5.4.27",
    "achievement-sharing-v4.js?v=5.4.29",
    "src/features/interface/collection-key-translation-hotfix.js?v=5.5.11"
  ];

  const cebuanoScripts = [
    "bisaya-app-loader.js?v=0.3.2",
    "ui-quality-fixes.js?v=5.4.21",
    "daily-goal-refinement.js?v=5.4.21",
    "weekly-avatar-chest.js?v=5.4.21",
    "key-run-refinement.js?v=5.4.21",
    "weekly-avatar-polish.js?v=5.4.21",
    "src/adapters/exercise/incorrect-order-feedback-runtime-v1.js?v=5.4.21",
    "src/features/exercise/incorrect-order-feedback.js?v=5.4.21",
    "incorrect-order-feedback.js?v=5.4.21",
    "src/features/interface/compact-desktop-layout.js?v=5.4.21",
    "src/features/interface/clean-topbar.js?v=5.4.21",
    "src/features/progression/even-progress-rail.js?v=5.4.21",
    "mastery-feedback.js?v=5.4.21",
    "lesson-side-launcher.js?v=5.4.21",
    "mobile-session-refinement.js?v=5.4.21",
    "src/features/interface/popup-governor-v1.js?v=5.5.3",
    "profile-emblem-control.js?v=5.5.4",
    "adaptive-scenarios.js?v=5.4.21",
    "level-progression-v2.js?v=5.5.3",
    "src/features/interface/level-up-mobile-safety-v552.js?v=5.5.3",
    "desktop-navigation-refinement.js?v=5.5.3",
    "src/features/audio/pronunciation-release-control.js?v=5.4.22",
    "src/features/progression/home-reward-coordinator.js?v=5.4.22",
    "badge-catalogue-v2.js?v=5.4.23",
    "badge-chest-v2.js?v=5.4.29",
    "placement-onboarding-v1.js?v=5.4.23",
    "social-connections-v2.js?v=5.4.27",
    "achievement-sharing-v4.js?v=5.4.29"
  ];

  const desktopCollectionSafety = "@media(min-width:900px){.avatar-collection-modal,.sq-desktop-collection-safe,[data-avatar-collection-modal]{max-height:calc(100dvh - 32px)!important;overflow:hidden!important}.avatar-collection-modal .modal-content,.sq-desktop-collection-safe .modal-content,.avatar-collection-modal [role=tabpanel],.sq-desktop-collection-safe [role=tabpanel]{max-height:calc(100dvh - 190px)!important;overflow-y:auto!important;overscroll-behavior:contain}.avatar-case-slot img,.avatar-card img,.sq-desktop-collection-safe img{object-fit:contain!important;object-position:center!important;max-width:100%!important;max-height:100%!important}}";

  window.SalitaQuestCourseManifest = Object.freeze({
    sourceDocument: "https://raw.githubusercontent.com/Costieman/SalitaQuest/cb89fa4778737b16408bd5a66dd8fcc7f7f37f81/index.html",
    storage: Object.freeze({
      profileStore: "salitaQuestLocalProfilesV1",
      activeProfile: "salitaQuestActiveProfileId",
      activeCourse: "salitaQuestActiveCourse",
      baseProgress: "salitaQuestProgress",
      baseOwner: "salitaQuestBaseProgressOwner",
      profileProgressPrefix: "salitaQuestProgress.profile."
    }),
    courses: Object.freeze({
      tagalog: Object.freeze({
        id: "tagalog",
        documentCache: "salitaQuestAppDocumentV554",
        styles: Object.freeze([...sharedStyles]),
        scripts: Object.freeze([...tagalogScripts]),
        scriptStrategy: "append",
        useLegacyProfileProgress: true,
        extraHeadCss: desktopCollectionSafety,
        errorMark: "S★",
        errorTitle: "Course files could not be loaded",
        errorMessage: "Check your connection, then reload this page. Your learner profile and saved progress remain on this device.",
        replacements: Object.freeze([])
      }),
      cebuano: Object.freeze({
        id: "cebuano",
        documentCache: "salitaQuestBisayaAppDocumentV554",
        styles: Object.freeze(["bisaya-review-regions.css?v=0.3.2", ...sharedStyles]),
        scripts: Object.freeze([...cebuanoScripts]),
        scriptStrategy: "replace-app",
        useLegacyProfileProgress: false,
        extraHeadCss: "",
        errorMark: "B★",
        errorTitle: "Bisaya course files could not be loaded",
        errorMessage: "Check your connection, then reload this page. Saved Tagalog and Bisaya progress remain separate on this device.",
        replacements: Object.freeze([
          Object.freeze(["Tagalog", "Bisaya"]),
          Object.freeze(["Taglish", "Bisaya-English"]),
          Object.freeze(["Magandang araw!", "Maayong adlaw!"]),
          Object.freeze(["taga-saan?</span>", "taga-asa?</span>"])
        ])
      })
    })
  });
})();
