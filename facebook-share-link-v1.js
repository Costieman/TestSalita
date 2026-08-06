(() => {
  "use strict";

  if (window.__salitaFacebookShareLinkV1Installed) return;
  window.__salitaFacebookShareLinkV1Installed = true;

  const CTA_PATTERN = /\n\nPlay Salita Quest free:\n(https:\/\/\S+)\s*$/i;

  function linkedCaption(value) {
    const text = String(value || "");
    const match = text.match(CTA_PATTERN);
    if (!match) return text;

    const shareUrl = match[1];
    const caption = text.replace(CTA_PATTERN, "").trim();
    if (/Salita Quest\s*[—:-]\s*https:\/\//i.test(caption)) return caption;
    if (/Salita Quest/i.test(caption)) {
      return caption.replace(/Salita Quest/i, `Salita Quest — ${shareUrl}`);
    }
    return `${caption}\n\nSalita Quest — ${shareUrl}`;
  }

  try {
    if (typeof navigator.share === "function") {
      const nativeShare = navigator.share.bind(navigator);
      navigator.share = payload => nativeShare({
        ...payload,
        text:payload?.text ? linkedCaption(payload.text) : payload?.text
      });
    }
  } catch {}

  try {
    const clipboard = navigator.clipboard;
    if (clipboard && typeof clipboard.writeText === "function") {
      const nativeWriteText = clipboard.writeText.bind(clipboard);
      clipboard.writeText = value => nativeWriteText(linkedCaption(value));
    }
  } catch {}

  window.SalitaFacebookShareLink = Object.freeze({
    format:linkedCaption,
    release:"1.0.0"
  });
})();
