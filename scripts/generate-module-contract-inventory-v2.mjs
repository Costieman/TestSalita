import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ROOT=process.cwd();
const MANIFEST="src/config/course-manifest.js";
const JSON_OUT="src/config/module-contracts.generated.json";
const DOC_OUT="docs/MODULE_CONTRACT_INVENTORY.md";
const WRITE=process.argv.includes("--write");
const CHECK=process.argv.includes("--check");
const sort=v=>[...new Set(v)].sort((a,b)=>a.localeCompare(b));
const read=f=>fs.readFileSync(path.join(ROOT,f),"utf8");
const exists=f=>fs.existsSync(path.join(ROOT,f));
const clean=v=>String(v||"").split(/[?#]/,1)[0].replace(/^\.\//,"");
const md=v=>String(v??"").replaceAll("|","\\|").replaceAll("\n"," ");

function manifest(){
  const context={window:{}};
  vm.createContext(context);
  new vm.Script(read(MANIFEST),{filename:MANIFEST}).runInContext(context);
  if(!context.window.SalitaQuestCourseManifest?.courses)throw new Error("Course manifest could not be evaluated");
  return context.window.SalitaQuestCourseManifest;
}
function constants(source){
  const out=new Map();
  for(const m of source.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(["'`])([^\n"'`]+)\2/g))out.set(m[1],m[3]);
  return out;
}
function resolveArg(raw,consts){
  const value=String(raw||"").trim();
  const literal=value.match(/^(["'`])([\s\S]*?)\1$/);
  if(literal)return literal[2];
  return consts.get(value)||value.replace(/\s+/g," ").slice(0,160);
}
function localScript(raw,owner){
  const value=clean(raw);
  if(!value.endsWith(".js")||/^(?:https?:|data:|blob:)/i.test(value))return null;
  const resolved=value.startsWith("./")||value.startsWith("../")
    ?path.posix.normalize(path.posix.join(path.posix.dirname(owner),value))
    :path.posix.normalize(value);
  return !resolved.startsWith("../")&&exists(resolved)?resolved:null;
}
function allScriptRefs(source,owner){
  const out=[];
  for(const m of source.matchAll(/["'`](\.?\/?[A-Za-z0-9_./-]+\.js)(?:\?[^"'`]*)?["'`]/g)){
    const file=localScript(m[1],owner);if(file)out.push(file);
  }
  return sort(out);
}
function loadedScripts(source,owner){
  const out=[];
  const patterns=[
    /\b[A-Za-z_$][\w$]*(?:Script|script)\(\s*(?:["'`][^"'`]*["'`]\s*,\s*)?["'`](\.?\/?[A-Za-z0-9_./-]+\.js)(?:\?[^"'`]*)?["'`]/gs,
    /\b(?:script|loader|tag)\.src\s*=\s*["'`](\.?\/?[A-Za-z0-9_./-]+\.js)(?:\?[^"'`]*)?["'`]/g
  ];
  for(const pattern of patterns)for(const m of source.matchAll(pattern)){
    const file=localScript(m[1],owner);if(file)out.push(file);
  }
  return sort(out);
}
function fetchedScripts(source,owner,consts){
  const out=[];
  for(const m of source.matchAll(/\bfetch\(\s*([^,\)]+)/g)){
    const file=localScript(resolveArg(m[1],consts),owner);if(file)out.push(file);
  }
  return sort(out);
}
function workers(source,owner){
  const out=[];
  for(const m of source.matchAll(/serviceWorker\.register\(\s*["'`](\.?\/?[A-Za-z0-9_./-]+\.js)(?:\?[^"'`]*)?["'`]/g)){
    const file=localScript(m[1],owner);if(file)out.push(file);
  }
  return sort(out);
}
function declarations(source,top=false){
  const out=[];
  const pattern=top?/^(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm:/\b(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g;
  for(const m of source.matchAll(pattern))out.push(m[1]);
  return sort(out);
}
function windowContracts(source,consts){
  const providers=[];const seen=[];
  for(const m of source.matchAll(/\bwindow\.([A-Za-z_$][\w$]*)/g))seen.push(m[1]);
  for(const m of source.matchAll(/\bwindow\.([A-Za-z_$][\w$]*)\s*(?:=|\|\|=|\?\?=)/g))providers.push(m[1]);
  for(const m of source.matchAll(/\bwindow\[(["'])([^"']+)\1\]\s*(?:=|\|\|=|\?\?=)/g))providers.push(m[2]);
  for(const m of source.matchAll(/\bwindow\[([A-Za-z_$][\w$]*)\]\s*(?:=|\|\|=|\?\?=)/g))if(consts.has(m[1]))providers.push(consts.get(m[1]));
  const supplied=new Set(providers);
  const builtins=new Set(["addEventListener","clearTimeout","document","fetch","innerHeight","innerWidth","location","matchMedia","navigator","open","performance","requestAnimationFrame","setTimeout","speechSynthesis"]);
  return{provides:sort(providers),consumes:sort(seen.filter(v=>!supplied.has(v)&&!builtins.has(v)))};
}
function storage(source,consts){
  const out=[];
  for(const m of source.matchAll(/\b(localStorage|sessionStorage)\.(getItem|setItem|removeItem)\(\s*([^,\)]+)/g))out.push({store:m[1],operation:m[2],key:resolveArg(m[3],consts)});
  return out;
}
function dom(source){
  const ids=[];const selectors=[];const datasets=[];
  for(const m of source.matchAll(/\.getElementById\(\s*(["'])([^"']+)\1/g))ids.push(m[2]);
  for(const m of source.matchAll(/\.(?:querySelector|querySelectorAll|closest|matches)\(\s*(["'])([^"']+)\1/g))selectors.push(m[2]);
  for(const m of source.matchAll(/\.dataset\.([A-Za-z_$][\w$]*)/g))datasets.push(m[1]);
  return{ids:sort(ids),selectors:sort(selectors),datasets:sort(datasets)};
}
function events(source){
  const listens=[];const dispatches=[];
  for(const m of source.matchAll(/\.addEventListener\(\s*(["'])([^"']+)\1/g))listens.push(m[2]);
  for(const m of source.matchAll(/new\s+(?:CustomEvent|Event)\(\s*(["'])([^"']+)\1/g))dispatches.push(m[2]);
  return{listens:sort(listens),dispatches:sort(dispatches)};
}
function role(file,r){
  if(file==="app.js")return"core-engine";
  if(file===MANIFEST)return"course-config";
  if(file==="src/app/course-bootstrap.js")return"course-bootstrap";
  if(file==="service-worker.js")return"offline-runtime";
  if(r.loads.length||r.fetches.length)return"runtime-loader";
  if(/avatar|badge|achievement|coin/.test(file))return"collection-and-rewards";
  if(/profile|placement/.test(file))return"profile-and-onboarding";
  if(/audio|pronunciation/.test(file))return"audio";
  if(/progress|mastery|daily|weekly|key-run/.test(file))return"progression";
  if(/navigation|layout|topbar|mobile|ui-/.test(file))return"interface";
  return"feature-extension";
}
function readiness(r){
  const writes=r.storage.filter(v=>v.operation!=="getItem").length;
  const coupling=r.coreGlobals.length+r.window.consumes.length;
  const hooks=r.dom.ids.length+r.dom.selectors.length;
  if(["core-engine","course-config","course-bootstrap","offline-runtime","runtime-loader"].includes(r.role))return"hold";
  if(coupling>12||writes>4||hooks>24)return"high-coupling";
  if(coupling>5||writes>1||hooks>10)return"prepare-adapter";
  return"extraction-candidate";
}
function risk(r){
  const writes=r.storage.filter(v=>v.operation!=="getItem").length;
  return r.coreGlobals.length*3+r.window.consumes.length*2+r.window.provides.length*2+writes*4+r.storage.length+r.dom.ids.length+Math.ceil(r.dom.selectors.length/2)+r.events.dispatches.length*2+r.loads.length*5+r.fetches.length*4+r.workers.length*2;
}

function build(){
  const config=manifest();
  const courseSeeds={};
  for(const [courseId,course] of Object.entries(config.courses))courseSeeds[courseId]=["app.js",...course.scripts.map(clean)].filter(exists);
  const contexts=new Map();const queue=[];const sources=new Map();
  const add=(file,context)=>{if(!exists(file))return;if(!contexts.has(file))contexts.set(file,new Set());const set=contexts.get(file);if(set.has(context))return;set.add(context);queue.push({file,context});};
  for(const [course,files] of Object.entries(courseSeeds))files.forEach(file=>add(file,course));
  add(MANIFEST,"bootstrap");add("src/app/course-bootstrap.js","bootstrap");add("service-worker.js","worker");
  while(queue.length){
    const {file,context}=queue.shift();const source=sources.get(file)||read(file);sources.set(file,source);const consts=constants(source);
    loadedScripts(source,file).forEach(target=>add(target,context));
    fetchedScripts(source,file,consts).forEach(target=>add(target,context));
  }
  const core=new Set(declarations(sources.get("app.js")||read("app.js"),true));
  const modules=[];
  for(const file of sort(sources.keys())){
    const source=sources.get(file);const consts=constants(source);const local=new Set(declarations(source));
    const coreGlobals=file==="app.js"?[]:[...core].filter(name=>!local.has(name)&&new RegExp(`\\b${name.replace(/[$]/g,"\\$")}\\b`).test(source));
    const record={file,bytes:Buffer.byteLength(source),contexts:sort(contexts.get(file)||[]),courses:sort([...(contexts.get(file)||[])].filter(v=>v==="tagalog"||v==="cebuano")),references:allScriptRefs(source,file),loads:loadedScripts(source,file),fetches:fetchedScripts(source,file,consts),workers:workers(source,file),coreGlobals:sort(coreGlobals),window:windowContracts(source,consts),storage:storage(source,consts),dom:dom(source),events:events(source)};
    record.role=role(file,record);record.readiness=readiness(record);record.risk=risk(record);modules.push(record);
  }
  const providers=new Map();
  for(const r of modules)for(const symbol of r.window.provides){if(!providers.has(symbol))providers.set(symbol,[]);providers.get(symbol).push(r.file);}
  const edges=[];
  for(const r of modules){
    r.loads.forEach(to=>edges.push({from:r.file,to,type:"loads"}));
    r.fetches.forEach(to=>edges.push({from:r.file,to,type:"fetches-script-source"}));
    r.workers.forEach(to=>edges.push({from:r.file,to,type:"registers-worker"}));
    if(r.coreGlobals.length)edges.push({from:r.file,to:"app.js",type:"core-globals",symbols:r.coreGlobals});
    for(const symbol of r.window.consumes)for(const to of providers.get(symbol)||[])if(to!==r.file)edges.push({from:r.file,to,type:"window-api",symbols:[symbol]});
  }
  const storageMap=new Map();
  for(const r of modules)for(const op of r.storage){const id=`${op.store}:${op.key}`;if(!storageMap.has(id))storageMap.set(id,{store:op.store,key:op.key,readers:[],writers:[],removers:[]});const x=storageMap.get(id);if(op.operation==="getItem")x.readers.push(r.file);if(op.operation==="setItem")x.writers.push(r.file);if(op.operation==="removeItem")x.removers.push(r.file);}
  const storageContracts=[...storageMap.values()].map(x=>({...x,readers:sort(x.readers),writers:sort(x.writers),removers:sort(x.removers)})).sort((a,b)=>`${a.store}:${a.key}`.localeCompare(`${b.store}:${b.key}`));
  const eventMap=new Map();
  for(const r of modules){for(const name of r.events.listens){if(!eventMap.has(name))eventMap.set(name,{name,listeners:[],dispatchers:[]});eventMap.get(name).listeners.push(r.file);}for(const name of r.events.dispatches){if(!eventMap.has(name))eventMap.set(name,{name,listeners:[],dispatchers:[]});eventMap.get(name).dispatchers.push(r.file);}}
  const eventContracts=[...eventMap.values()].map(x=>({...x,listeners:sort(x.listeners),dispatchers:sort(x.dispatchers)})).sort((a,b)=>a.name.localeCompare(b.name));
  const sourceCommit=String(config.sourceDocument).match(/\/([0-9a-f]{40})\/index\.html$/)?.[1]||null;
  return{schemaVersion:2,manifestFile:MANIFEST,sourceDocument:config.sourceDocument,sourceDocumentCommit:sourceCommit,courseSeeds,summary:{modules:modules.length,dependencyEdges:edges.length,storageContracts:storageContracts.length,salitaEvents:eventContracts.filter(x=>x.name.startsWith("salita:")).length,extractionCandidates:modules.filter(x=>x.readiness==="extraction-candidate"&&x.courses.length).length,prepareAdapters:modules.filter(x=>x.readiness==="prepare-adapter").length,highCoupling:modules.filter(x=>x.readiness==="high-coupling").length,held:modules.filter(x=>x.readiness==="hold").length},modules,edges,storage:storageContracts,events:eventContracts,windowApis:[...providers.entries()].map(([symbol,files])=>({symbol,providers:sort(files)})).sort((a,b)=>a.symbol.localeCompare(b.symbol))};
}

function document(inv){
  const byRisk=[...inv.modules].sort((a,b)=>b.risk-a.risk||a.file.localeCompare(b.file));
  const candidates=inv.modules.filter(x=>x.readiness==="extraction-candidate"&&x.courses.length).sort((a,b)=>a.risk-b.risk||a.file.localeCompare(b.file));
  const adapters=inv.modules.filter(x=>x.readiness==="prepare-adapter").sort((a,b)=>a.risk-b.risk||a.file.localeCompare(b.file));
  const held=inv.modules.filter(x=>x.readiness==="hold"||x.readiness==="high-coupling").sort((a,b)=>b.risk-a.risk||a.file.localeCompare(b.file));
  const custom=inv.events.filter(x=>x.name.startsWith("salita:"));
  const idMap=new Map();for(const r of inv.modules)for(const id of r.dom.ids){if(!idMap.has(id))idMap.set(id,[]);idMap.get(id).push(r.file);}const sharedIds=[...idMap.entries()].filter(([,files])=>new Set(files).size>1).sort((a,b)=>b[1].length-a[1].length||a[0].localeCompare(b[0]));
  const lines=["# Module Contract Inventory","","> Generated by `scripts/generate-module-contract-inventory-v2.mjs`. Static analysis is conservative; computed selectors and keys remain migration risks.","","## Scope","",`- Runtime files: **${inv.summary.modules}**`,`- Dependency edges: **${inv.summary.dependencyEdges}**`,`- Storage contracts: **${inv.summary.storageContracts}**`,`- Salita custom events: **${inv.summary.salitaEvents}**`,`- Extraction candidates: **${inv.summary.extractionCandidates}**`,`- Adapter stage: **${inv.summary.prepareAdapters}**`,`- High-coupling: **${inv.summary.highCoupling}**`,`- Held infrastructure/loaders: **${inv.summary.held}**`,`- Pinned source document: \`${inv.sourceDocumentCommit||"unresolved"}\``,"","## Course load order",""];
  for(const [course,files] of Object.entries(inv.courseSeeds))lines.push(`### ${course[0].toUpperCase()+course.slice(1)}`,"",files.map((f,i)=>`${i+1}. \`${f}\``).join("\n"),"");
  lines.push("## Recommended extraction sequence","","### Phase A — move low-coupling feature files first","",...(candidates.slice(0,30).map(x=>`- \`${x.file}\` — risk ${x.risk}; ${x.coreGlobals.length} engine globals; ${x.storage.length} storage operations.`)),"","### Phase B — introduce an adapter before relocation","",...(adapters.slice(0,35).map(x=>`- \`${x.file}\` — ${x.coreGlobals.length} engine globals; ${x.window.provides.length} exported browser APIs; ${x.dom.ids.length+x.dom.selectors.length} DOM hooks.`)),"","### Phase C — keep in place until boundaries are explicit","",...(held.slice(0,35).map(x=>`- \`${x.file}\` — ${x.readiness}; risk ${x.risk}; ${x.loads.length} script loads; ${x.fetches.length} transformed script sources.`)),"","## Highest-coupling files","","| File | Role | Courses | Risk | Engine globals | Window read/write | Storage | DOM hooks | Loads |","|---|---|---:|---:|---:|---:|---:|---:|---:|");
  for(const x of byRisk.slice(0,40))lines.push(`| \`${md(x.file)}\` | ${x.role} | ${x.courses.length} | ${x.risk} | ${x.coreGlobals.length} | ${x.window.consumes.length}/${x.window.provides.length} | ${x.storage.length} | ${x.dom.ids.length+x.dom.selectors.length} | ${x.loads.length} |`);
  lines.push("","## Storage compatibility","","| Store:key | Readers | Writers | Removers |","|---|---|---|---|");for(const x of inv.storage.slice(0,100))lines.push(`| \`${md(x.store)}:${md(x.key)}\` | ${md(x.readers.join(", ")||"—")} | ${md(x.writers.join(", ")||"—")} | ${md(x.removers.join(", ")||"—")} |`);
  lines.push("","## Exported Salita browser APIs","","| Symbol | Providers |","|---|---|");for(const x of inv.windowApis.filter(x=>/^Salita|^__salita/.test(x.symbol)))lines.push(`| \`${md(x.symbol)}\` | ${md(x.providers.join(", "))} |`);
  lines.push("","## Custom event contracts","","| Event | Dispatchers | Listeners |","|---|---|---|");for(const x of custom)lines.push(`| \`${md(x.name)}\` | ${md(x.dispatchers.join(", ")||"—")} | ${md(x.listeners.join(", ")||"—")} |`);
  lines.push("","## Shared DOM IDs","","| ID | Referencing files |","|---|---|");for(const [id,files] of sharedIds.slice(0,100))lines.push(`| \`${md(id)}\` | ${md(sort(files).join(", "))} |`);
  lines.push("","## Migration rules","","1. Preserve storage keys, custom events, DOM IDs, and exported `window` APIs during physical moves.","2. Add an engine adapter before relocating files that directly consume `app.js` declarations.","3. Treat script loaders, transformed engine sources, and service-worker registration as separate dependency types.","4. Move one functional family per pull request and retain root compatibility shims for one offline-cache release.","5. Run the full Tagalog, Bisaya, avatar, economy, and installed-app validation suites after every extraction.","","Machine-readable details are in `src/config/module-contracts.generated.json`.");return lines.join("\n")+"\n";
}
function output(file,content){const absolute=path.join(ROOT,file);if(CHECK){if(!exists(file)||read(file)!==content)throw new Error(`${file} is stale`);}else if(WRITE){fs.mkdirSync(path.dirname(absolute),{recursive:true});fs.writeFileSync(absolute,content);}}
const inventory=build();output(JSON_OUT,JSON.stringify(inventory,null,2)+"\n");output(DOC_OUT,document(inventory));console.log(JSON.stringify(inventory.summary,null,2));
