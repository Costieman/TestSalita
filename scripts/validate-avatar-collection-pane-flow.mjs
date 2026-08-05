import fs from 'node:fs';

const js = fs.readFileSync('src/features/avatar/avatar-collection-tabs-phase6-1-v1.js','utf8');
const css = fs.readFileSync('avatar-collection-tabs-phase6-1-v1.css','utf8');
const economy = fs.readFileSync('src/features/economy/economy-tracking-phase6-v1.js','utf8');
const loader = fs.readFileSync('coin-avatar-shop-topbar-v1.js','utf8');

const hotfixIndex = loader.indexOf('avatar-case-mobile-flow-hotfix-v1.css?v=5.7.2');
const structuralIndex = loader.indexOf('avatar-collection-tabs-phase6-1-v1.css?v=5.7.3');

const checks = [
  ['collection pane wrapper', js.includes('sq-avatar-collection-pane') && js.includes('collectionPane.appendChild(child)')],
  ['statistics pane wrapper', js.includes('sq-avatar-statistics-pane') && js.includes('statisticsPane.appendChild(child)')],
  ['normal flow mobile case', css.includes('display:flex!important;flex-direction:column') && css.includes('min-height:205px!important')],
  ['no fixed case aspect ratio', css.includes('aspect-ratio:auto!important')],
  ['actions below grid', css.includes('.sq-avatar-case-actions') && css.includes('clear:both!important')],
  ['summary follows case', css.includes('.sq-avatar-collection-summary{order:1!important')],
  ['economy mounts in statistics pane', economy.includes('statisticsPane.appendChild(panel)')],
  ['structural CSS overrides legacy hotfix', hotfixIndex >= 0 && structuralIndex > hotfixIndex],
  ['cache bust updated', loader.includes('v=5.7.3')]
];

const failed = checks.filter(([,ok]) => !ok);
for (const [name,ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
if (failed.length) process.exit(1);
