import fs from 'node:fs';
import vm from 'node:vm';

const js = fs.readFileSync('src/features/avatar/avatar-collection-tabs-phase6-1-v1.js','utf8');
const css = fs.readFileSync('avatar-collection-tabs-phase6-1-v1.css','utf8');
const loader = fs.readFileSync('coin-avatar-shop-topbar-v1.js','utf8');
const fail = message => { throw new Error(message); };

new vm.Script(js,{filename:'src/features/avatar/avatar-collection-tabs-phase6-1-v1.js'});
[
  'data-avatar-collection-tab="case"',
  'data-avatar-collection-tab="collection"',
  'data-avatar-collection-tab="statistics"',
  'sq-avatar-case-pane',
  'sq-avatar-collection-pane',
  'sq-avatar-statistics-pane',
  'panes[classify(child)].appendChild(child)',
  'activeTab = "case"'
].forEach(marker => { if (!js.includes(marker)) fail(`Missing three-tab marker: ${marker}`); });
if (!css.includes('grid-template-columns:repeat(3,minmax(0,1fr))')) fail('Tab bar must use three columns.');
if (!css.includes('.sq-avatar-case-pane[hidden]')) fail('Avatar Case pane must be independently hideable.');
if (!css.includes('.sq-avatar-collection-pane[hidden]')) fail('Collection pane must be independently hideable.');
if (!css.includes('.sq-avatar-statistics-pane[hidden]')) fail('Statistics pane must be independently hideable.');
if (!loader.includes('avatar-collection-tabs-phase6-1-v1.css?v=5.7.4')) fail('Three-tab CSS is not loaded.');
if (!loader.includes('avatar-collection-tabs-phase6-1-v1.js?v=5.7.4')) fail('Three-tab runtime is not loaded.');
console.log('Validated separate Avatar Case, Collection and Statistics tabs.');
