(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestCompactDesktopInstalled";
  const DESKTOP_QUERY = "(min-width: 1001px)";

  function installCompactDesktopLayout() {
    if (window[INSTALL_FLAG]) return;

    const learnLayout = document.querySelector("#learnView .learn-layout");
    const lessonCard = document.getElementById("lessonCard");
    const lessonTopline = lessonCard?.querySelector(".lesson-topline");
    const lessonContent = lessonCard?.querySelector(".lesson-content");
    const structureBox = document.getElementById("structureBox");
    const audioButton = document.getElementById("audioBtn");
    const sessionPanel = learnLayout?.querySelector(":scope > .session-panel") || document.querySelector("#learnView .session-panel");

    if (!learnLayout || !lessonCard || !lessonTopline || !lessonContent || !audioButton || !sessionPanel) {
      window.setTimeout(installCompactDesktopLayout, 60);
      return;
    }

    window[INSTALL_FLAG] = true;

    const toplineAnchor = document.createComment("lesson-topline-home");
    lessonTopline.parentNode.insertBefore(toplineAnchor, lessonTopline);

    const audioAnchor = document.createComment("lesson-audio-home");
    audioButton.parentNode.insertBefore(audioAnchor, audioButton);

    const panelAnchor = document.createComment("session-panel-home");
    sessionPanel.parentNode.insertBefore(panelAnchor, sessionPanel);

    sessionPanel.classList.remove("session-rewards-strip");
    sessionPanel.classList.add("desktop-session-console");

    const rewardHeading = sessionPanel.querySelector(":scope > .eyebrow");
    if (rewardHeading) {
      rewardHeading.classList.add("session-console-heading");
      rewardHeading.textContent = "Session console";
    }

    const masteryHeadings = [...sessionPanel.querySelectorAll(":scope > .eyebrow")].filter(node => node !== rewardHeading);
    masteryHeadings.forEach(node => node.classList.add("session-mastery-label"));

    const media = window.matchMedia(DESKTOP_QUERY);

    function moveAfter(anchor, node) {
      anchor.parentNode.insertBefore(node, anchor.nextSibling);
    }

    function applyLayout() {
      const desktop = media.matches;
      document.body.classList.toggle("desktop-lesson-layout", desktop);

      if (desktop) {
        if (sessionPanel.parentNode !== learnLayout) learnLayout.appendChild(sessionPanel);
        sessionPanel.insertBefore(lessonTopline, sessionPanel.firstChild);
        lessonTopline.insertAdjacentElement("afterend", audioButton);
      } else {
        moveAfter(toplineAnchor, lessonTopline);
        if (structureBox?.parentNode === lessonContent) structureBox.insertAdjacentElement("afterend", audioButton);
        else moveAfter(audioAnchor, audioButton);
        moveAfter(panelAnchor, sessionPanel);
      }
    }

    applyLayout();
    media.addEventListener?.("change", applyLayout);
    window.addEventListener("resize", applyLayout, {passive:true});
  }

  installCompactDesktopLayout();
})();