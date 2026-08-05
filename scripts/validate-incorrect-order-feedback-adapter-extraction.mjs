import fs from "node:fs";
import vm from "node:vm";

const read = file => fs.readFileSync(file,"utf8");
const fail = message => { throw new Error(message); };
const root = read("incorrect-order-feedback.js");
const adapter = read("src/adapters/exercise/incorrect-order-feedback-runtime-v1.js");
const feature = read("src/features/exercise/incorrect-order-feedback.js");
const manifest = read("src/config/course-manifest.js");
const worker = read("service-worker.js");
for (const [name,source] of [["root",root],["adapter",adapter],["feature",feature],["manifest",manifest],["worker",worker]]) new vm.Script(source,{filename:name});

for (const marker of [
  'const INSTALL_FLAG = "__salitaQuestIncorrectOrderFeedbackInstalled"',
  'const RETRY_MS = 60',
  'src/adapters/exercise/incorrect-order-feedback-runtime-v1.js?v=5.4.21',
  'src/features/exercise/incorrect-order-feedback.js?v=5.4.21',
  "document.write", "script.async = false", "loadMissingDependencies"
]) if (!root.includes(marker)) fail(`Root coordinator missing ${marker}`);
for (const forbidden of ["currentExercise?.","sentenceBuilderState.","renderFeedback =","renderSentenceBuilder =","selected-word-tile","correct-order-revealed","normaliseToken","localStorage","sessionStorage"])
  if (root.includes(forbidden)) fail(`Root coordinator still owns ${forbidden}`);

for (const marker of [
  'const API = "SalitaIncorrectOrderFeedbackRuntimeV1"', 'lookup("state")', 'lookup("currentExercise")',
  'lookup("sentenceBuilderState")', 'lookup("renderFeedback")', 'lookup("renderSentenceBuilder")',
  'lookup("updateSentenceBuilderUI")', "bindHooks", "applyCorrectOrder", "baseRenderSentenceBuilder.apply", "baseRenderFeedback.apply"
]) if (!adapter.includes(marker)) fail(`Adapter missing ${marker}`);
for (const forbidden of ["getElementById","querySelectorAll","selected-word-tile","correct-order-revealed","localStorage","sessionStorage"])
  if (adapter.includes(forbidden)) fail(`Adapter owns feature/storage behavior: ${forbidden}`);

for (const marker of [
  'const API = "SalitaIncorrectOrderFeedbackV1"', "captureSelectedTilePositions", "animateCorrectSentenceOrder",
  "runtime.applyCorrectOrder(orderedIds)", "beforeRenderSentenceBuilder", "aroundRenderFeedback", "duration:460",
  "delay:index * 55", 'easing:"cubic-bezier(.2, .82, .22, 1)"', 'fill:"both"', "reduced ? 0 : 170"
]) if (!feature.includes(marker)) fail(`Feature missing ${marker}`);
for (const forbidden of ["typeof state", "typeof currentExercise", "typeof sentenceBuilderState", "renderFeedback =", "renderSentenceBuilder =", "updateSentenceBuilderUI()", "localStorage", "sessionStorage", "eval("])
  if (feature.includes(forbidden)) fail(`Feature still owns engine/storage bridge: ${forbidden}`);

const classList = initial => {
  const values = new Set(initial || []);
  return {values,contains:name=>values.has(name),add:(...names)=>names.forEach(name=>values.add(name)),remove:(...names)=>names.forEach(name=>values.delete(name))};
};
const animations=[];
const tiles = [
  {id:"a",word:"Ako",textContent:"ako",classList:classList(),getBoundingClientRect:()=>({left:10,top:10,width:20,height:10}),animate:(frames,options)=>animations.push({frames,options})},
  {id:"b",word:"ay",textContent:"ay",classList:classList(),getBoundingClientRect:()=>({left:40,top:10,width:20,height:10}),animate:(frames,options)=>animations.push({frames,options})},
  {id:"c",word:"ako",textContent:"ako",classList:classList(),getBoundingClientRect:()=>({left:70,top:10,width:20,height:10}),animate:(frames,options)=>animations.push({frames,options})}
];
const built={classList:classList(["incorrect-order-correcting","correct-order-revealed"]),attrs:new Map([["data-correct-order-label","old"]]),querySelectorAll:selector=>selector===".selected-word-tile"?tiles:[],getBoundingClientRect:()=>({}),setAttribute(k,v){this.attrs.set(k,v);},removeAttribute(k){this.attrs.delete(k);}};
const builderNode={classList:classList()};
const timers=[]; const writes=[]; const appended=[]; let baseFeedbackCalls=0; let baseBuilderCalls=0; let uiUpdates=0;
class CustomEvent {constructor(type,options={}){this.type=type;this.detail=options.detail;}}
const document={
  readyState:"complete", baseURI:"https://example.test/app.html", currentScript:{src:"https://example.test/incorrect-order-feedback.js"},
  head:{appendChild(node){appended.push(node);}}, documentElement:{appendChild(node){appended.push(node);}},
  getElementById:id=>id==="sentenceBuilder"?builderNode:id==="builtSentence"?built:null,
  querySelector:()=>null, createElement(){return {dataset:{},listeners:{},addEventListener(name,fn){this.listeners[name]=fn;}};},
  write:value=>writes.push(value)
};
const window={document,matchMedia:()=>({matches:false}),setTimeout(fn,delay){timers.push({fn,delay});return timers.length;},console,URL};
const context={window,document,CustomEvent,URL,Promise,Map,Set,Array,Object,String,Boolean,Number,Math,console,globalThis:null};
context.globalThis=context;
vm.createContext(context);
vm.runInContext(`
  let state={settings:{reducedMotion:false}};
  let currentExercise={item:{id:"item-1"},sentenceBuilder:{targetTokens:["ako","ay","ako"]},answers:["Ako ay ako."]};
  let sentenceBuilderState={tiles:[{id:"a",word:"Ako"},{id:"b",word:"ay"},{id:"c",word:"ako"}],selected:["c","b","a"],locked:false};
  let updateSentenceBuilderUI=()=>{globalThis.__uiUpdates=(globalThis.__uiUpdates||0)+1;};
  let renderSentenceBuilder=function(){globalThis.__builderCalls=(globalThis.__builderCalls||0)+1;return "builder-result";};
  let renderFeedback=function(){globalThis.__feedbackCalls=(globalThis.__feedbackCalls||0)+1;return "feedback-result";};
  globalThis.__read=()=>({state,currentExercise,sentenceBuilderState,renderSentenceBuilder,renderFeedback});
  globalThis.__setItem=id=>{currentExercise={...currentExercise,item:{id}};};
  globalThis.__setReduced=value=>{state.settings.reducedMotion=value;};
`,context);
vm.runInContext(adapter,context,{filename:"adapter"});
vm.runInContext(feature,context,{filename:"feature"});
vm.runInContext(root,context,{filename:"root"});
if (!window.__salitaQuestIncorrectOrderFeedbackInstalled) fail("Root install flag missing");
if (!window.SalitaIncorrectOrderFeedbackRuntimeV1 || !window.SalitaIncorrectOrderFeedbackV1) fail("Public adapter/feature APIs missing");

const runtime=window.SalitaIncorrectOrderFeedbackRuntimeV1;
const api=window.SalitaIncorrectOrderFeedbackV1;
if (api.normaliseToken(` “Ako,” `)!=="ako") fail("Token punctuation normalization changed");
const ids=Array.from(api.correctTileIds(runtime));
if (ids.join(",")!=="a,b,c") fail(`Duplicate-token ordering changed: ${ids}`);
const refs=context.__read();
const result=refs.renderFeedback(false,0,null);
if (result!=="feedback-result" || context.__feedbackCalls!==1) fail("Base feedback invocation changed");
if (!timers.some(timer=>timer.delay===170) || !built.classList.contains("incorrect-order-correcting")) fail("Normal correction delay changed");
timers.find(timer=>timer.delay===170).fn();
const after=context.__read();
if (Array.from(after.sentenceBuilderState.selected).join(",")!=="a,b,c" || after.sentenceBuilderState.locked!==true || context.__uiUpdates!==1) fail("Correct-order state application changed");
if (!built.classList.contains("correct-order-revealed") || built.attrs.get("data-correct-order-label")!=="Correct order") fail("Correct-order presentation changed");
if (animations.length!==3 || animations[2].options.delay!==110 || animations[0].options.duration!==460 || animations[0].options.fill!=="both") fail("Tile animation contract changed");

built.classList.add("incorrect-order-correcting","correct-order-revealed"); built.attrs.set("data-correct-order-label","again");
const builderResult=context.__read().renderSentenceBuilder({});
if (builderResult!=="builder-result" || context.__builderCalls!==1 || built.classList.contains("correct-order-revealed") || built.attrs.has("data-correct-order-label")) fail("Builder reset-before-base contract changed");
const timerCount=timers.length; context.__read().renderFeedback(true,0,null);
if (timers.length!==timerCount) fail("Correct answers must not schedule correction");

context.__setReduced(true); context.__read().sentenceBuilderState.locked=false; context.__read().renderFeedback(false,0,null);
if (!timers.some(timer=>timer.delay===0)) fail("Reduced-motion delay changed");
const stale=timers.filter(timer=>timer.delay===0).at(-1); context.__setItem("item-2"); const beforeUpdates=context.__uiUpdates; stale.fn();
if (context.__uiUpdates!==beforeUpdates) fail("Stale item correction was not cancelled");
const beforeApi=window.SalitaIncorrectOrderFeedbackV1; const beforeFeedback=context.__read().renderFeedback;
vm.runInContext(feature,context,{filename:"feature-repeat"}); vm.runInContext(root,context,{filename:"root-repeat"});
if (window.SalitaIncorrectOrderFeedbackV1!==beforeApi || context.__read().renderFeedback!==beforeFeedback) fail("Duplicate loading replaced API or wrapper");

const manifestContext={window:{}}; vm.createContext(manifestContext); vm.runInContext(manifest,manifestContext);
for (const courseId of ["tagalog","cebuano"]) {
  const scripts=manifestContext.window.SalitaQuestCourseManifest.courses[courseId].scripts;
  const adapterIndex=scripts.indexOf("src/adapters/exercise/incorrect-order-feedback-runtime-v1.js?v=5.4.21");
  const featureIndex=scripts.indexOf("src/features/exercise/incorrect-order-feedback.js?v=5.4.21");
  const rootIndex=scripts.indexOf("incorrect-order-feedback.js?v=5.4.21");
  const compactIndex=scripts.indexOf("src/features/interface/compact-desktop-layout.js?v=5.4.21");
  if (!(adapterIndex>=0 && featureIndex===adapterIndex+1 && rootIndex===featureIndex+1 && compactIndex>rootIndex)) fail(`${courseId} load order changed`);
}
for (const marker of [
  'const PREVIOUS_CACHE_NAME = "salita-quest-v5-6-19-long-term-badge-adapter-extraction-r72"',
  'const CACHE_NAME = "salita-quest-v5-6-20-avatar-case-profile-adapter-extraction-r73"',
  '"./incorrect-order-feedback.js"', '"./incorrect-order-feedback.css"',
  '"./src/adapters/exercise/incorrect-order-feedback-runtime-v1.js"',
  '"./src/features/exercise/incorrect-order-feedback.js"'
]) if (!worker.includes(marker)) fail(`Offline delivery missing ${marker}`);
for (const source of [root,adapter,feature]) if (/\b(?:localStorage|sessionStorage)\b/.test(source)) fail("Incorrect-order extraction must not access storage");

console.log("Incorrect-order feedback adapter extraction validation passed.");
