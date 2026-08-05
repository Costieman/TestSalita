(() => {
  "use strict";

  const INSTALL_FLAG = "__salitaQuestSocialConnectionsV3Installed";
  const LEGACY_FLAG = "__salitaQuestSocialConnectionsV2Installed";
  const PROFILE_STORE = "salitaQuestLocalProfilesV1";
  const ACTIVE_PROFILE = "salitaQuestActiveProfileId";
  const API_STORAGE = "salitaQuestSocialApiBase";
  const DEFAULT_API_BASE = "https://salita-quest-social-share-zvxenj6xcq-as.a.run.app";
  const RELEASE = "5.5.8-sharing-foundation";
  const SHARE_DESTINATIONS = [
    {id:"facebook",label:"Facebook",icon:"f"},
    {id:"instagram",label:"Instagram",icon:"◎"},
    {id:"tiktok",label:"TikTok",icon:"♪"},
    {id:"x",label:"X",icon:"𝕏"},
    {id:"linkedin",label:"LinkedIn",icon:"in"},
    {id:"whatsapp",label:"WhatsApp",icon:"◉"}
  ];
  const CONNECTABLE_PLATFORMS = SHARE_DESTINATIONS.filter(item => item.id !== "whatsapp");

  let connections = {};
  let pendingPopup = null;
  let hostedSharingAvailable = null;
  let oauthAvailable = false;
  let refreshPromise = null;
  let lastHealthMessage = "";

  function retry(){ window.setTimeout(install,100); }
  function esc(value){ return String(value ?? "").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch])); }
  function readStore(){ try{return JSON.parse(localStorage.getItem(PROFILE_STORE)||"null")||{profiles:[]};}catch{return {profiles:[]};} }
  function activeProfile(){ const store=readStore(); const id=sessionStorage.getItem(ACTIVE_PROFILE); return store.profiles?.find(profile=>profile.id===id)||null; }
  function developerMode(){ return /(?:^|[?&])socialDebug=1(?:&|$)/.test(location.search) || location.hostname === "localhost" || location.hostname === "127.0.0.1"; }
  function apiBase(){
    const explicit=String(window.SALITA_SOCIAL_API_BASE||"").trim();
    const developerOverride=developerMode()?String(localStorage.getItem(API_STORAGE)||"").trim():"";
    return (explicit||developerOverride||DEFAULT_API_BASE).replace(/\/$/,"");
  }
  function apiOrigin(){ try{return new URL(apiBase()).origin;}catch{return "";} }
  function status(message,error=false){ const node=document.getElementById("socialConnectionsStatus"); if(node){node.textContent=message||"";node.classList.toggle("error",Boolean(error));} }
  function connection(provider){ return connections[provider] || null; }
  function isConnected(provider){ return Boolean(connection(provider)?.connected); }
  function hostedStatus(){ return hostedSharingAvailable; }

  function ensureCard(){
    const settings=document.getElementById("settingsView");
    if(!settings) return null;
    let card=document.getElementById("socialLinksCard");
    if(!card){ card=document.createElement("article"); card.id="socialLinksCard"; settings.appendChild(card); }
    card.className="panel social-connections-card";
    return card;
  }

  function stateLabel(){
    if(hostedSharingAvailable===true) return {className:"ready",label:"Ready",detail:"Hosted achievement previews are available."};
    if(hostedSharingAvailable===false) return {className:"offline",label:"Card sharing available",detail:"Hosted previews are offline; device sharing and downloads still work."};
    return {className:"checking",label:"Checking",detail:"Confirming hosted-preview availability…"};
  }

  function destinationMarkup(){
    return SHARE_DESTINATIONS.map(item=>`<span class="social-destination" title="Share to ${esc(item.label)}"><span class="social-destination-icon" data-provider="${item.id}">${item.icon}</span><span>${esc(item.label)}</span></span>`).join("");
  }

  function accountMarkup(){
    if(!oauthAvailable) return `<div class="social-future-note"><strong>No account setup required.</strong><span>Choose a platform when you share a badge, avatar, Avatar Case, or level. Optional direct account connections will appear here only when they are fully supported.</span></div>`;
    return `<div class="social-connected-section"><div class="social-connected-heading"><strong>Connected accounts</strong><span>Optional direct publishing</span></div><div class="social-connection-grid">${CONNECTABLE_PLATFORMS.map(platform=>{
      const item=connection(platform.id); const connected=Boolean(item?.connected);
      const detail=connected?`Connected${item.displayName?` as ${esc(item.displayName)}`:""}`:"Not connected";
      return `<article class="social-connection-row ${connected?"connected":""}" data-provider="${platform.id}"><span class="social-connection-logo">${platform.icon}</span><div class="social-connection-copy"><strong>${esc(platform.label)}</strong><small>${detail}</small></div><button class="social-connection-action" type="button" data-social-connect="${platform.id}">${connected?"Disconnect":"Connect"}</button></article>`;
    }).join("")}</div></div>`;
  }

  function developerMarkup(){
    if(!developerMode()) return "";
    const stored=String(localStorage.getItem(API_STORAGE)||"").trim();
    return `<details class="social-service-setup"><summary>Developer service override</summary><div class="social-service-fields"><input id="socialApiBaseInput" type="url" inputmode="url" value="${esc(stored)}" placeholder="${esc(DEFAULT_API_BASE)}"><button class="secondary-btn" type="button" data-save-social-api>Save override</button></div><p class="social-service-help">Leave blank to use the built-in Salita Quest sharing service.</p></details>`;
  }

  function render(){
    const card=ensureCard();
    if(!card) return;
    const state=stateLabel();
    card.innerHTML=`<div class="social-connections-heading"><div><p class="eyebrow">PROGRESS SHARING</p><h3>Share your achievements</h3><p>Badges, avatars and level milestones use one card-sharing system. Hosted previews are optional: generated images can still be shared through the device or downloaded.</p></div><span class="social-sharing-state ${state.className}"><i></i><span><strong>${state.label}</strong><small>${state.detail}</small></span></span></div>
      <div class="social-share-launcher"><div><strong>Available destinations</strong><div class="social-destination-list">${destinationMarkup()}</div></div><button class="primary-btn" type="button" data-open-badges>Open Badges</button></div>
      ${accountMarkup()}
      ${developerMarkup()}
      <p id="socialConnectionsStatus" class="social-connections-status"></p>`;
    if(lastHealthMessage) status(lastHealthMessage,hostedSharingAvailable===false);
  }

  async function checkHealth(){
    const base=apiBase();
    const health=await fetch(`${base}/health`,{cache:"no-store",credentials:"omit",headers:{Accept:"application/json"}});
    if(!health.ok) throw new Error(`Sharing service returned ${health.status}`);
    const data=await health.json().catch(()=>({}));
    if(data.ok===false) throw new Error(data.message||"Sharing service is not ready");
    if(data.bucketConfigured===false) throw new Error("Hosted share storage is not configured");
    return data;
  }

  async function refresh(){
    if(refreshPromise) return refreshPromise;
    refreshPromise=(async()=>{
      const base=apiBase(); const profile=activeProfile();
      hostedSharingAvailable=null; lastHealthMessage=""; render();
      try{
        await checkHealth();
        hostedSharingAvailable=true;
        oauthAvailable=false;
        connections={};
        if(profile){
          const response=await fetch(`${base}/api/social/connections?profileId=${encodeURIComponent(profile.id)}`,{credentials:"include",headers:{Accept:"application/json"}});
          if(response.ok){
            const data=await response.json();
            connections=data.connections&&typeof data.connections==="object"?data.connections:{};
            oauthAvailable=true;
          } else if(response.status!==404&&response.status!==501){
            console.info(`Optional social connection service returned ${response.status}`);
          }
        }
        lastHealthMessage="Progress sharing is ready.";
        render();
        return true;
      }catch(error){
        console.warn("Salita Quest sharing service check failed",error);
        connections={}; oauthAvailable=false; hostedSharingAvailable=false;
        lastHealthMessage="Hosted previews are temporarily unavailable. Generated cards can still be shared through your device or downloaded.";
        render();
        return false;
      }
    })().finally(()=>{refreshPromise=null;});
    return refreshPromise;
  }

  async function ensureHosted(){
    if(hostedSharingAvailable===true) return true;
    if(hostedSharingAvailable===false) return false;
    return refresh();
  }

  function saveApi(){
    if(!developerMode()) return;
    const value=String(document.getElementById("socialApiBaseInput")?.value||"").trim().replace(/\/$/,"");
    if(value&&!/^https:\/\//i.test(value)){ status("The developer override must use HTTPS.",true); return; }
    if(value)localStorage.setItem(API_STORAGE,value);else localStorage.removeItem(API_STORAGE);
    hostedSharingAvailable=null;
    refresh();
  }

  function openBadges(){
    try{ if(typeof switchView==="function") switchView("badges"); }catch{}
    window.setTimeout(()=>document.getElementById("badgesView")?.scrollIntoView({behavior:"smooth",block:"start"}),50);
  }

  function connect(provider){
    if(!oauthAvailable) return;
    const base=apiBase(); const profile=activeProfile();
    if(!base||!profile) return;
    const width=620,height=760,left=Math.max(0,(screen.width-width)/2),top=Math.max(0,(screen.height-height)/2);
    const url=`${base}/oauth/${encodeURIComponent(provider)}/start?profileId=${encodeURIComponent(profile.id)}&returnOrigin=${encodeURIComponent(location.origin)}`;
    pendingPopup=window.open(url,"salitaSocialConnect",`popup=yes,width=${width},height=${height},left=${left},top=${top}`);
    if(!pendingPopup)status("Allow pop-ups to connect this account.",true);else status(`Complete the ${provider} connection in the new window.`);
  }

  async function disconnect(provider){
    const base=apiBase(); const profile=activeProfile(); if(!base||!profile)return;
    try{
      const response=await fetch(`${base}/api/social/connections/${encodeURIComponent(provider)}`,{method:"DELETE",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({profileId:profile.id})});
      if(!response.ok)throw new Error(`Disconnect failed (${response.status})`);
      await refresh(); status(`${provider} disconnected.`);
    }catch(error){status(error.message,true);}
  }

  async function post(provider,payload){
    const base=apiBase(); const profile=activeProfile();
    if(!base||!profile||!isConnected(provider))throw new Error(`${provider} is not connected.`);
    const response=await fetch(`${base}/api/social/posts`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({profileId:profile.id,provider,...payload})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.message||`Posting failed (${response.status})`);
    return data;
  }

  function install(){
    if(window[INSTALL_FLAG])return;
    if(!document.getElementById("settingsView")){retry();return;}
    window[INSTALL_FLAG]=true;
    window[LEGACY_FLAG]=true;
    document.addEventListener("click",event=>{
      if(event.target.closest("[data-open-badges]")){openBadges();return;}
      if(event.target.closest("[data-save-social-api]")){saveApi();return;}
      const button=event.target.closest("[data-social-connect]"); if(!button)return;
      const provider=button.dataset.socialConnect;
      if(isConnected(provider))disconnect(provider);else connect(provider);
    });
    window.addEventListener("message",event=>{
      const origin=apiOrigin(); if(!origin||event.origin!==origin||event.data?.type!=="salita-social-oauth")return;
      try{pendingPopup?.close();}catch{}pendingPopup=null;
      if(event.data.ok){status(`${event.data.provider||"Account"} connected.`);hostedSharingAvailable=null;refresh();}
      else status(event.data.message||"The account could not be connected.",true);
    });
    const baseSwitch=typeof switchView==="function"?switchView:null;
    if(baseSwitch){switchView=function switchViewWithSocialConnections(view){const result=baseSwitch.apply(this,arguments);if(view==="settings")window.setTimeout(refresh,30);return result;};}
    window.SalitaQuestSocialConnections=Object.freeze({
      version:3,release:RELEASE,apiBase,isConnected,getAll:()=>({...connections}),post,refresh,ensureHosted,hostedStatus,
      openSettings(){try{switchView("settings");}catch{}window.setTimeout(()=>document.getElementById("socialLinksCard")?.scrollIntoView({behavior:"smooth",block:"center"}),80);}
    });
    render(); refresh();
  }

  install();
})();
