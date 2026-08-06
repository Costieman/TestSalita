import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root=process.cwd();
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const fail=message=>{throw new Error(message);};
const requireMarkers=(source,markers,label)=>markers.forEach(marker=>{
  if(!source.includes(marker))fail(`${label} is missing: ${marker}`);
});
const requirePatterns=(source,patterns,label)=>patterns.forEach(([pattern,description])=>{
  if(!pattern.test(source))fail(`${label} is missing: ${description}`);
});

const runtime=read("desktop-navigation-refinement.js");
const styles=read("desktop-navigation-refinement.css");
const worker=read("service-worker.js");
new vm.Script(runtime,{filename:"desktop-navigation-refinement.js"});

requireMarkers(runtime,[
  '__salitaQuestPersistentNavigationV1Installed',
  'const RELEASE = "5.5.10-persistent-navigation"',
  '"home","learn","review","audioReview","dictionary","skills","boss","progress","badges","settings"',
  '"skills","boss","progress","badges","settings"',
  "ensureBadgesView",
  "ensureDesktopRoutes",
  "ensureMobileRoutes",
  'data-sq-nav-action="avatar-collection"',
  'action:"avatar-collection"',
  "salita:open-avatar-collection",
  'aria-current","page"',
  "scrollIntoView?.({block:\"nearest\"})",
  "salita:view-changed",
  "SalitaQuestPersistentNavigation"
],"Persistent navigation runtime");
requirePatterns(runtime,[
  [/REQUIRED_DESKTOP_VIEWS\s*=\s*Object\.freeze/,"immutable complete desktop route contract"],
  [/REQUIRED_MOBILE_MORE_VIEWS\s*=\s*Object\.freeze/,"immutable mobile More route contract"],
  [/document\.querySelectorAll\("\.desktop-nav-collapse"\)\.forEach\(button=>button\.remove\(\)\)/,"removal of obsolete collapse controls"],
  [/document\.body\.classList\.remove\("desktop-nav-collapsed"\)/,"removal of obsolete collapsed state"],
  [/window\.SalitaQuestPersistentNavigation=Object\.freeze/,"single exposed navigation owner"]
],"Persistent navigation ownership");
if(runtime.includes("salitaDesktopNavCollapsed"))fail("Persistent navigation must not restore the retired collapsed-sidebar preference");
if(runtime.includes("desktop-nav-toggle"))fail("Persistent navigation must not install a competing collapse toggle");

requireMarkers(styles,[
  "--sq-persistent-sidebar-width",
  "@media (min-width: 861px)",
  "position: fixed !important",
  "height: 100dvh !important",
  "grid-template-rows: auto minmax(0,1fr) auto !important",
  "overflow-y: auto !important",
  "scrollbar-gutter: stable",
  "margin-left: var(--sq-persistent-sidebar-width) !important",
  "width: calc(100% - var(--sq-persistent-sidebar-width)) !important",
  ".sidebar .nav-item > span:last-child",
  "display: block !important",
  "@media (min-width: 861px) and (max-width: 1180px)",
  "grid-template-columns: minmax(0,1fr) !important",
  "flex-wrap: wrap !important",
  "@media (max-width: 860px)",
  "position: sticky !important",
  "position: fixed !important",
  "max-height: min(76dvh,620px) !important",
  ".sq-mobile-more-route"
],"Persistent navigation and responsive styles");
requirePatterns(styles,[
  [/@media \(min-width: 861px\)[\s\S]*?\.sidebar\s*\{[\s\S]*?display:\s*grid !important/,"full desktop sidebar retained above 860px"],
  [/@media \(max-width: 860px\)[\s\S]*?\.sidebar\s*\{[\s\S]*?display:\s*none !important/,"mobile sidebar hand-off"],
  [/@media \(min-width: 861px\) and \(max-width: 1180px\)[\s\S]*?\.topbar\s*\{[\s\S]*?flex-wrap:\s*wrap !important/,"small-desktop top-bar wrapping"],
  [/\.mobile-menu-sheet\s*\{[\s\S]*?overflow-y:\s*auto !important/,"internally scrollable mobile More sheet"],
  [/\.main-area\s*>\s*\*[\s\S]*?min-width:\s*0/,"content shrink-safety rule"]
],"Small-desktop layout safety");
if(/@media\s*\(min-width:\s*1001px\)\s*and\s*\(max-width:\s*1500px\)[\s\S]*?width:\s*76px/.test(styles)){
  fail("Laptop widths must not collapse the navigation to a 76px icon rail");
}
if(/\.sidebar\s+\.nav-item\s*>\s*span:last-child\s*\{\s*display:\s*none/.test(styles)){
  fail("Desktop navigation labels must remain visible");
}
if(/\.desktop-nav-collapsed[\s\S]*?width:\s*76px/.test(styles)){
  fail("Retired collapsed-sidebar geometry remains active");
}

for(const htmlFile of ["app.html","bisaya.html"]){
  const html=read(htmlFile);
  requireMarkers(html,[
    "desktop-navigation-refinement.css",
    "desktop-navigation-refinement.js"
  ],`${htmlFile} navigation loader`);
}

requireMarkers(worker,[
  'const PREVIOUS_CACHE_NAME = "salita-quest-v5-5-9-avatar-case-r51"',
  'const CACHE_NAME = "salita-quest-v5-5-10-persistent-navigation-r52"',
  '"./desktop-navigation-refinement.js"',
  '"./desktop-navigation-refinement.css"'
],"Persistent navigation offline release");

const workflow=read(".github/workflows/validate-bisaya.yml");
if(!workflow.includes("node scripts/validate-persistent-navigation.mjs")){
  fail("Bisaya workflow does not run the persistent-navigation validator");
}

console.log("Validated one persistent navigation owner, complete desktop routes, permanent mobile More access, full-height internally scrollable sidebar, small-desktop wrapping and r52 offline delivery.");
