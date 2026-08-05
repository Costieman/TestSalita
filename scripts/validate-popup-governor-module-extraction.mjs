import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root,file),"utf8");
const fail = message => { throw new Error(message); };
const rootFile = "popup-governor-v1.js";
const moduleFile = "src/features/interface/popup-governor-v1.js";
const compatibility = read(rootFile);
const feature = read(moduleFile);
const manifestSource = read("src/config/course-manifest.js");
const refresh = read("mobile-refresh.html");
const worker = read("service-worker.js");

new vm.Script(compatibility,{filename:rootFile});
new vm.Script(feature,{filename:moduleFile});

for (const marker of [
  'const TARGET = "./src/features/interface/popup-governor-v1.js?v=5.5.3"',
  "document.currentScript",
  "document.write",
  "script.async = false",
  'salitaCompatibilityLoader = "popup-governor-v1"'
]) if (!compatibility.includes(marker)) fail(`Compatibility loader is missing ${marker}`);
for (const forbidden of ["const queue = []", "queuedKeys", "UNMANAGED_BLOCKERS", "await request.acknowledge", "SalitaPopupGovernor =", "getAvatarImagePath", "salita:popup-queued", "setTimeout(drain"])
  if (compatibility.includes(forbidden)) fail(`Root compatibility file still owns ${forbidden}`);

const eventNames = [
  "salita:popup-starting",
  "salita:popup-skipped",
  "salita:popup-acknowledged",
  "salita:popup-finished",
  "salita:popup-failed",
  "salita:popup-queued",
  "salita:popup-cancelled",
  "salita:popup-suspended",
  "salita:popup-resumed"
];
for (const marker of [
  'const RELEASE = "5.5.3"',
  'const INSTALL_FLAG = "__salitaQuestPopupGovernorV1Installed"',
  "const RETRY_DELAY_MS = 450",
  "const queue = []",
  "const queuedKeys = new Set()",
  '".daily-key-celebration"',
  '".daily-key-award"',
  '".weekly-avatar-shard-modal:not([hidden])"',
  '".achievement-share-modal:not([hidden])"',
  '".placement-modal:not(.hidden)"',
  'document.body.dataset.currentView === "home"',
  'document.documentElement.dataset.placementUpdating === "true"',
  'document.body.classList.contains("placement-open")',
  "await request.acknowledge()",
  "await request.show",
  "window.SalitaPopupGovernor = Object.freeze",
  "window.SalitaAvatarAssets = Object.freeze",
  "window.getAvatarImagePath = getAvatarImagePath",
  "document.documentElement.dataset.popupGovernance = RELEASE"
]) if (!feature.includes(marker)) fail(`Feature implementation is missing ${marker}`);
for (const event of eventNames) if (!feature.includes(`"${event}"`)) fail(`Feature is missing ${event}`);
if (feature.indexOf("await request.acknowledge()") > feature.indexOf("await request.show")) fail("Durable acknowledgement no longer precedes popup rendering");
if (/localStorage|sessionStorage/.test(feature)) fail("Popup governor must remain storage-independent");

const manifestContext = {window:{}};
vm.createContext(manifestContext);
vm.runInContext(manifestSource,manifestContext,{filename:"src/config/course-manifest.js"});
const courses = manifestContext.window.SalitaQuestCourseManifest?.courses;
if (!courses) fail("Course manifest was not installed");
for (const courseId of ["tagalog","cebuano"]) {
  const scripts = courses[courseId]?.scripts;
  if (!Array.isArray(scripts)) fail(`${courseId} scripts are missing`);
  const mobile = scripts.indexOf("mobile-session-refinement.js?v=5.4.21");
  const governor = scripts.indexOf("src/features/interface/popup-governor-v1.js?v=5.5.3");
  const levels = scripts.indexOf("level-progression-v2.js?v=5.5.3");
  if (!(mobile >= 0 && governor > mobile && levels > governor)) fail(`${courseId} popup governor ordering changed`);
  if (scripts.includes("popup-governor-v1.js?v=5.5.3")) fail(`${courseId} still targets the root compatibility URL`);
}
if (!refresh.includes('`./src/features/interface/popup-governor-v1.js?v=${RELEASE}`') || refresh.includes('`./popup-governor-v1.js?v=${RELEASE}`')) fail("Mobile refresh delivery changed");
for (const marker of [
  'const PREVIOUS_CACHE_NAME = "salita-quest-v5-6-19-long-term-badge-adapter-extraction-r72"',
  'const CACHE_NAME = "salita-quest-v5-6-20-avatar-case-profile-adapter-extraction-r73"',
  '"./popup-governor-v1.js"',
  '"./src/features/interface/popup-governor-v1.js"'
]) if (!worker.includes(marker)) fail(`Offline delivery is missing ${marker}`);

const documentListeners = [];
const windowListeners = [];
const dispatched = [];
const timers = new Map();
let timerSequence = 0;
let blockerVisible = false;
let placementOpen = false;
const home = {classList:{contains(name){return name === "active";}}};
const body = {
  dataset:{currentView:"home"},
  classList:{contains(name){return name === "placement-open" && placementOpen;}}
};
const documentElement = {dataset:{}};
class CustomEvent {
  constructor(type,options={}){this.type=type;this.detail=options.detail;}
}
const document = {
  hidden:false,
  body,
  documentElement,
  getElementById(id){return id === "homeView" ? home : null;},
  querySelector(){return blockerVisible ? {} : null;},
  addEventListener(name,handler){documentListeners.push([name,handler]);},
  dispatchEvent(event){dispatched.push(event);return true;}
};
const window = {
  SalitaAvatarModel:{get(id){return id === "known" ? {image:"avatars/known.png"} : null;}},
  SalitaAvatarAssets:{legacy:true},
  setTimeout(handler,delay){const id=++timerSequence;timers.set(id,{handler,delay});return id;},
  clearTimeout(id){timers.delete(id);},
  addEventListener(name,handler){windowListeners.push([name,handler]);}
};
const context = {window,document,CustomEvent,Date,Set,Map,Math,Number,String,Array,Object,Promise,console};
vm.createContext(context);
vm.runInContext(feature,context,{filename:moduleFile});

const api = window.SalitaPopupGovernor;
if (!api || api.version !== 1 || api.release !== "5.5.3") fail("Stable popup governor API was not installed");
for (const method of ["enqueue","cancel","suspend","resume","notify","status"]) if (typeof api[method] !== "function") fail(`Popup governor API is missing ${method}`);
if (documentListeners.map(([name])=>name).join("|") !== "visibilitychange|salita:view-changed|salita:course-progress-restored|salita:placement-finished") fail("Document listener contract changed");
if (windowListeners.map(([name])=>name).join("|") !== "pageshow") fail("Window listener contract changed");
if (documentElement.dataset.popupGovernance !== "5.5.3") fail("Popup governance release marker changed");
if (window.getAvatarImagePath("known") !== "avatars/known.png" || window.getAvatarImagePath("missing") !== "") fail("Avatar image fallback changed");
if (window.SalitaAvatarAssets.legacy !== true || window.SalitaAvatarAssets.getAvatarImagePath !== window.getAvatarImagePath) fail("Avatar asset compatibility surface changed");

const flushTimer = () => {
  const next = [...timers.entries()].sort((a,b)=>a[0]-b[0])[0];
  if (!next) return false;
  const [id,item] = next;
  timers.delete(id);
  item.handler();
  return true;
};
const settle = async () => { for (let index=0; index<10; index+=1) await Promise.resolve(); };
const order = [];
const request = (key,priority) => ({
  key,
  type:"test",
  priority,
  acknowledge(){order.push(`ack:${key}`);},
  show(){order.push(`show:${key}`);}
});
if (api.enqueue(request("low",10)) !== true || api.enqueue(request("high",90)) !== true) fail("Valid requests were not queued");
if (api.status().queued.join("|") !== "low|high") fail("Queue status changed before draining");
if (timers.size !== 1) fail("Queue scheduling no longer coalesces to one drain timer");
flushTimer();
await settle();
if (order.join("|") !== "ack:high|show:high") fail(`Priority ordering or acknowledge-before-render changed: ${order.join("|")}`);
flushTimer();
await settle();
if (order.join("|") !== "ack:high|show:high|ack:low|show:low") fail(`FIFO drain behavior changed: ${order.join("|")}`);
if (api.status().active !== null || api.status().queued.length !== 0) fail("Queue did not return to idle");

if (api.enqueue(request("duplicate",20)) !== true || api.enqueue(request("duplicate",20)) !== false) fail("Duplicate suppression changed");
if (api.cancel("duplicate","test_cancel") !== true || api.cancel("missing") !== false) fail("Cancellation behavior changed");
if (api.enqueue({...request("seen",20),isAcknowledged:()=>true}) !== false) fail("Acknowledged requests are no longer suppressed");
let invalidThrew = false;
try { api.enqueue({key:"invalid"}); } catch { invalidThrew = true; }
if (!invalidThrew) fail("Invalid requests no longer throw");

api.suspend(1200,"test_suspend");
let status = api.status();
if (!(status.suspendedUntil > Date.now()) || status.suspendedReason !== "test_suspend") fail("Suspension status changed");
api.resume("test_resume");
status = api.status();
if (status.suspendedUntil !== 0 || status.suspendedReason !== "") fail("Resume status changed");

blockerVisible = true;
if (!api.enqueue(request("blocked",50))) fail("Blocked request was not retained in the queue");
flushTimer();
await settle();
if (order.includes("ack:blocked")) fail("Unmanaged blocker no longer suppresses popup rendering");
blockerVisible = false;
api.notify();
flushTimer();
await settle();
if (!order.includes("ack:blocked") || !order.includes("show:blocked")) fail("Blocked request did not resume after notification");

placementOpen = true;
if (!api.enqueue(request("placement",60))) fail("Placement-blocked request was not retained");
flushTimer();
await settle();
if (order.includes("ack:placement")) fail("Placement-open suppression changed");
placementOpen = false;
api.notify();
flushTimer();
await settle();
if (!order.includes("ack:placement") || !order.includes("show:placement")) fail("Placement-blocked request did not resume");

const eventTypes = new Set(dispatched.map(event=>event.type));
for (const name of ["salita:popup-queued","salita:popup-starting","salita:popup-acknowledged","salita:popup-finished","salita:popup-cancelled","salita:popup-suspended","salita:popup-resumed"])
  if (!eventTypes.has(name)) fail(`Runtime did not dispatch ${name}`);
const queuedEvent = dispatched.find(event=>event.type === "salita:popup-queued");
if (queuedEvent?.detail?.release !== "5.5.3") fail("Popup event release detail changed");

const originalApi = api;
const listenerCount = documentListeners.length + windowListeners.length;
vm.runInContext(feature,context,{filename:moduleFile});
if (window.SalitaPopupGovernor !== originalApi || documentListeners.length + windowListeners.length !== listenerCount) fail("Install guard did not prevent duplicate ownership");

console.log("Popup governor extraction validation passed: direct two-course/mobile delivery, compatibility-only root, priority/FIFO queue, durable acknowledgement, blockers, suspension, cancellation, public APIs, listeners, lifecycle events and r67 offline delivery.");
