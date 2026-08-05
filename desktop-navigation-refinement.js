(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestPersistentNavigationV1Installed";
  const RELEASE = "5.5.10-persistent-navigation";
  const PHASE4_RELEASE = "economy-v2-phase4-shop-navigation";
  const REQUIRED_DESKTOP_VIEWS = Object.freeze([
    "home","learn","review","audioReview","dictionary","skills","boss","progress","badges","settings"
  ]);
  const REQUIRED_MOBILE_MORE_VIEWS = Object.freeze(["skills","boss","progress","badges","settings"]);
  const REQUIRED_MENU_ACTIONS = Object.freeze(["shop","avatar-collection"]);

  function retry() {
    window.setTimeout(install,80);
  }

  function badgeIcon() {
    return `<svg class="pictogram" viewBox="0 0 64 64" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 8h20l5 13-15 11-15-11Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="32" cy="39" r="14" fill="none" stroke="currentColor" stroke-width="4"/>
      <path d="m32 31 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" fill="currentColor"/>
    </svg>`;
  }

  function shopIcon() {
    return `<svg class="pictogram" viewBox="0 0 64 64" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 24h36l-3 30H17Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
      <path d="M23 27v-7a9 9 0 0 1 18 0v7" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      <circle cx="32" cy="40" r="6" fill="none" stroke="currentColor" stroke-width="4"/>
    </svg>`;
  }

  function readActiveProfile() {
    try {
      const store=JSON.parse(localStorage.getItem("salitaQuestLocalProfilesV1")||"null");
      const id=sessionStorage.getItem("salitaQuestActiveProfileId");
      return store?.profiles?.find(profile=>profile.id===id)||null;
    } catch {
      return null;
    }
  }

  function currentAvatar() {
    const profile=readActiveProfile();
    const requestedId=profile?.avatarCollection?.equippedAvatarId||profile?.avatarId||"anahaw";
    const item=window.SalitaAvatarModel?.get?.(requestedId)||window.SalitaAvatarModel?.get?.("anahaw")||null;
    const id=item?.id||requestedId;
    let image=item?.image||`avatars/canonical/${id}.png`;
    try {
      image=window.SalitaAvatarArtwork?.getAvatarImagePath?.(id)||window.getAvatarImagePath?.(id)||image;
    } catch {}
    return {id,name:item?.name||"Avatar Collection",image};
  }

  function makeNavButton({view="",action="",label,icon,title=""}) {
    const button=document.createElement("button");
    button.type="button";
    button.className="nav-item sq-persistent-nav-item";
    if(view)button.dataset.view=view;
    if(action)button.dataset.sqNavAction=action;
    button.title=title||label;
    button.setAttribute("aria-label",title||label);
    button.innerHTML=`<span class="nav-art sq-persistent-nav-art" aria-hidden="true">${icon}</span><span>${label}</span>`;
    return button;
  }

  function ensureBadgesView(main,progressView,settingsView) {
    let badgesView=document.getElementById("badgesView");
    if(!badgesView){
      badgesView=document.createElement("section");
      badgesView.id="badgesView";
      badgesView.className="view badges-view";
      badgesView.innerHTML=`
        <section class="badges-page-hero">
          <div>
            <p class="eyebrow">Achievement collection</p>
            <h2>Your Badges</h2>
            <p>Badges recognise meaningful language milestones, sustained practice, and successful conversation challenges.</p>
          </div>
          <div class="badges-page-emblem" aria-hidden="true">${badgeIcon()}</div>
        </section>
        <div class="badges-page-summary"></div>
        <div class="badges-page-shelf"></div>`;
      main.insertBefore(badgesView,settingsView);
    }

    const summary=badgesView.querySelector(".badges-page-summary");
    const shelf=badgesView.querySelector(".badges-page-shelf");
    const achievementSummary=progressView.querySelector(".progress-achievement-card");
    const achievementPanel=document.querySelector("#homeView > .achievement-panel, .achievement-panel");
    if(achievementSummary&&summary&&!summary.contains(achievementSummary))summary.appendChild(achievementSummary);
    if(achievementPanel&&shelf&&!shelf.contains(achievementPanel))shelf.appendChild(achievementPanel);
    return badgesView;
  }

  function navLabel(button) {
    const spans=[...button.querySelectorAll(":scope > span")];
    return spans.at(-1)?.textContent?.trim()||button.getAttribute("aria-label")||"Navigation";
  }

  function ensureDesktopRoutes(nav) {
    const settings=nav.querySelector('[data-view="settings"]');
    if(!nav.querySelector('[data-view="badges"]')){
      const badges=makeNavButton({view:"badges",label:"Badges",icon:badgeIcon(),title:"Open badges and Badge Chest"});
      nav.insertBefore(badges,settings||null);
    }
    if(!nav.querySelector('[data-sq-nav-action="shop"]')){
      const shop=makeNavButton({action:"shop",label:"Shop",icon:shopIcon(),title:"Open the Avatar Shard Shop"});
      nav.insertBefore(shop,settings||null);
    }
    if(!nav.querySelector('[data-sq-nav-action="avatar-collection"]')){
      const avatar=currentAvatar();
      const avatarButton=makeNavButton({
        action:"avatar-collection",
        label:"Avatar Collection",
        icon:`<img src="${avatar.image}" data-sq-avatar-id="${avatar.id}" alt="">`,
        title:"Open Avatar Collection and Avatar Case"
      });
      nav.insertBefore(avatarButton,settings||null);
    }

    nav.dataset.persistentNavigation=RELEASE;
    nav.setAttribute("aria-label","All Salita Quest sections");
    nav.querySelectorAll(".nav-item").forEach((button,index)=>{
      const label=navLabel(button);
      button.type="button";
      button.dataset.navOrder=String(index+1);
      button.title=button.title||label;
      button.setAttribute("aria-label",button.getAttribute("aria-label")||label);
    });
  }

  function makeMobileRoute({view="",action="",icon,label,detail}) {
    const button=document.createElement("button");
    button.type="button";
    button.className="sq-mobile-more-route";
    if(view)button.dataset.view=view;
    if(action)button.dataset.sqNavAction=action;
    button.setAttribute("aria-label",`${label}: ${detail}`);
    button.innerHTML=`<span class="sq-mobile-more-icon" aria-hidden="true">${icon}</span><strong>${label}</strong><small>${detail}</small>`;
    return button;
  }

  function ensureMobileRoutes(grid) {
    const settings=grid.querySelector('[data-view="settings"]');
    if(!grid.querySelector('[data-view="badges"]')){
      grid.insertBefore(makeMobileRoute({view:"badges",icon:"🏅",label:"Badges",detail:"Catalogue and Badge Chest"}),settings||null);
    }
    if(!grid.querySelector('[data-sq-nav-action="shop"]')){
      grid.insertBefore(makeMobileRoute({action:"shop",icon:"🛍️",label:"Shop",detail:"Spend coins on avatar shards"}),settings||null);
    }
    if(!grid.querySelector('[data-sq-nav-action="avatar-collection"]')){
      const avatar=currentAvatar();
      grid.insertBefore(makeMobileRoute({
        action:"avatar-collection",
        icon:`<img src="${avatar.image}" data-sq-avatar-id="${avatar.id}" alt="">`,
        label:"Avatars",
        detail:"Collection and Avatar Case"
      }),settings||null);
    }
    grid.dataset.persistentNavigation=RELEASE;
  }

  function updateAvatarNavigation(avatarId="") {
    const current=currentAvatar();
    const item=window.SalitaAvatarModel?.get?.(avatarId)||window.SalitaAvatarModel?.get?.(current.id)||current;
    const id=item?.id||current.id;
    let source=item?.image||current.image;
    try {
      source=window.SalitaAvatarArtwork?.getAvatarImagePath?.(id)||window.getAvatarImagePath?.(id)||source;
    } catch {}
    document.querySelectorAll('[data-sq-nav-action="avatar-collection"] img').forEach(image=>{
      image.src=source;
      image.dataset.sqAvatarId=id;
    });
  }

  function activeViewName() {
    return document.body.dataset.currentView||document.querySelector(".view.active")?.id?.replace(/View$/,"")||"home";
  }

  function syncActiveState() {
    const activeView=activeViewName();
    document.querySelectorAll(".sidebar .nav-item,[data-persistent-navigation] [data-view]").forEach(button=>{
      const active=Boolean(button.dataset.view&&button.dataset.view===activeView);
      button.classList.toggle("active",active);
      if(active)button.setAttribute("aria-current","page");
      else button.removeAttribute("aria-current");
    });
    const current=[...document.querySelectorAll(".sidebar .nav-item")].find(button=>button.dataset.view===activeView);
    current?.scrollIntoView?.({block:"nearest"});
  }

  function closeMobileNavigation() {
    try {
      if(typeof closeMobileMenu==="function")closeMobileMenu();
      else window.closeMobileMenu?.();
    } catch {}
  }

  function openAvatarCollection() {
    closeMobileNavigation();
    document.dispatchEvent(new CustomEvent("salita:open-avatar-collection",{
      detail:{source:"persistent-navigation",release:RELEASE}
    }));
  }

  function openShop(attempt=0) {
    closeMobileNavigation();
    const shop=window.SalitaCoinAvatarShop;
    if(typeof shop?.open==="function"){
      shop.open();
      document.dispatchEvent(new CustomEvent("salita:shop-opened",{detail:{source:"persistent-navigation",release:PHASE4_RELEASE}}));
      return true;
    }
    if(attempt<20){
      window.setTimeout(()=>openShop(attempt+1),100);
      return false;
    }
    document.dispatchEvent(new CustomEvent("salita:open-avatar-collection",{
      detail:{source:"shop-navigation-fallback",release:PHASE4_RELEASE}
    }));
    return false;
  }

  function install() {
    try {
      if(typeof switchView!=="function"||typeof renderBadges!=="function"||typeof state==="undefined"){
        retry();
        return;
      }
    } catch {
      retry();
      return;
    }

    const sidebar=document.querySelector(".sidebar");
    const nav=sidebar?.querySelector(".nav-list");
    const main=document.querySelector(".main-area");
    const progressView=document.getElementById("progressView");
    const settingsView=document.getElementById("settingsView");
    const mobileGrid=document.querySelector(".mobile-more-grid");
    if(!sidebar||!nav||!main||!progressView||!settingsView||!mobileGrid){
      retry();
      return;
    }
    if(window[INSTALL_FLAG])return;
    window[INSTALL_FLAG]=true;

    document.querySelectorAll(".desktop-nav-collapse").forEach(button=>button.remove());
    document.body.classList.remove("desktop-nav-collapsed");
    sidebar.dataset.persistentNavigation=RELEASE;
    ensureBadgesView(main,progressView,settingsView);
    ensureDesktopRoutes(nav);
    ensureMobileRoutes(mobileGrid);
    window.SalitaAvatarArtwork?.repair?.(nav);
    window.SalitaAvatarArtwork?.repair?.(mobileGrid);

    function openBadges() {
      closeMobileNavigation();
      switchView("badges");
      renderBadges();
    }

    nav.querySelector('[data-view="badges"]')?.addEventListener("click",openBadges);
    mobileGrid.querySelector('[data-view="badges"]')?.addEventListener("click",openBadges);
    document.querySelectorAll('[data-sq-nav-action="avatar-collection"]').forEach(button=>button.addEventListener("click",event=>{
      event.preventDefault();
      openAvatarCollection();
    }));
    document.querySelectorAll('[data-sq-nav-action="shop"]').forEach(button=>button.addEventListener("click",event=>{
      event.preventDefault();
      openShop();
    }));

    const baseSwitchView=switchView;
    switchView=function switchViewWithPersistentNavigation(view){
      const result=baseSwitchView.apply(this,arguments);
      if(view==="badges"){
        renderBadges();
        const title=document.getElementById("viewTitle");
        const mobileTitle=document.getElementById("mobileViewTitle");
        if(title)title.textContent="Your Badges";
        if(mobileTitle)mobileTitle.textContent="Badges";
      }
      document.body.dataset.currentView=view;
      syncActiveState();
      document.dispatchEvent(new CustomEvent("salita:view-changed",{detail:{view,release:RELEASE}}));
      return result;
    };

    document.addEventListener("salita:avatar-equipped",event=>updateAvatarNavigation(event.detail?.avatarId||event.detail?.avatar?.id||""));
    document.addEventListener("salita:avatar-progression-ready",()=>updateAvatarNavigation());
    new MutationObserver(records=>{
      if(records.some(record=>record.attributeName==="data-current-view"))syncActiveState();
    }).observe(document.body,{attributes:true,attributeFilter:["data-current-view"]});

    syncActiveState();
    updateAvatarNavigation();
    document.documentElement.dataset.persistentNavigation=RELEASE;
    window.SalitaQuestPersistentNavigation=Object.freeze({
      version:2,release:RELEASE,phase4Release:PHASE4_RELEASE,requiredDesktopViews:REQUIRED_DESKTOP_VIEWS,requiredMobileMoreViews:REQUIRED_MOBILE_MORE_VIEWS,requiredMenuActions:REQUIRED_MENU_ACTIONS,sync:syncActiveState,openAvatarCollection,openShop
    });
  }

  install();
})();
