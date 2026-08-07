(() => {
  "use strict";
  if (window.__salitaCalendarKeyRewardCopyV1Installed) return;
  window.__salitaCalendarKeyRewardCopyV1Installed = true;

  function currentWeekCount() {
    try {
      const chest = state?.weeklyAvatarChest;
      const dates = Array.isArray(chest?.keyDates) ? chest.keyDates : [];
      const now = new Date();
      const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
      monday.setDate(monday.getDate() - ((monday.getDay()+6)%7));
      const keys = new Set(Array.from({length:7},(_,i)=>{
        const date = new Date(monday); date.setDate(monday.getDate()+i);
        return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
      }));
      return Math.min(5, dates.filter(date => keys.has(date)).length);
    } catch { return 0; }
  }

  function patch() {
    document.querySelectorAll(".daily-key-celebration.reward-coordinator strong").forEach(node => {
      node.textContent = `${currentWeekCount()} of 5 keys this week`;
    });
  }

  new MutationObserver(patch).observe(document.documentElement,{subtree:true,childList:true});
  patch();
})();