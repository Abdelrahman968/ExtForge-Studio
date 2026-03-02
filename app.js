// ════════════════════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════════════════════
let genFiles={}, curFile='', curTool='pencil', iconPack=[], isDrawing=false;
let startX=0, startY=0, undoStack=[], redoStack=[], settingsValues={}, themeColors={};
let snippets=[], keybinds=[], changelog=[], activeSnippetIdx=-1, iconCanvasCtx=null;
let snapshot=null;
const CANVAS_PX=320;

// ════════════════════════════════════════════════════════════
// MOBILE MENU
// ════════════════════════════════════════════════════════════
function openMobileMenu(){
  document.getElementById('mobileSidebar').style.transform='translateX(0)';
  document.getElementById('mobileOverlay').classList.remove('hidden');
}
function closeMobileMenu(){
  document.getElementById('mobileSidebar').style.transform='translateX(-100%)';
  document.getElementById('mobileOverlay').classList.add('hidden');
}

// ════════════════════════════════════════════════════════════
// PAGE / PANE ROUTING
// ════════════════════════════════════════════════════════════
function switchPage(id, btn){
  document.querySelectorAll('.mtab,.mobile-tab').forEach(t=>t.classList.remove('on'));
  if(btn) btn.classList.add('on');
  document.querySelectorAll('.mtab').forEach(t=>{
    if(t.getAttribute('onclick')&&t.getAttribute('onclick').includes("'"+id+"'")) t.classList.add('on');
  });
  document.querySelectorAll('.mobile-tab').forEach(t=>{
    if(t.getAttribute('onclick')&&t.getAttribute('onclick').includes("'"+id+"'")) t.classList.add('on');
  });

  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  const pg=document.getElementById('page-'+id);
  if(pg) pg.classList.add('on');

  const sb=document.getElementById('mainSidebar');
  if(sb) sb.style.display=(id==='ext')?'flex':'none';

  if(id==='theme') initTheme();
  if(id==='icons') initIcons();
  if(id==='settings') initSettings();
  if(id==='snippets') initSnippets();
  if(id==='keybinds') initKeybinds();
  if(id==='changelog') initChangelog();
  if(id==='publish') initPublish();
  if(id==='templates') initTemplates();
  setStatus(id.charAt(0).toUpperCase()+id.slice(1));
}

function switchPane(id, btn){
  document.querySelectorAll('.ptab').forEach(t=>t.classList.remove('on'));
  if(btn) btn.classList.add('on');
  document.querySelectorAll('.pane').forEach(p=>p.classList.remove('on'));
  const pn=document.getElementById('pane-'+id);
  if(pn) pn.classList.add('on');
}

// ════════════════════════════════════════════════════════════
// EXTENSION BUILDER
// ════════════════════════════════════════════════════════════
function toggleFeat(el){ el.classList.toggle('on'); }
function addCmd(){
  const w=document.getElementById('cmdsWrap');
  const d=document.createElement('div');d.className='cmd-r';
  d.innerHTML='<input type="text" placeholder="commandId"><button class="bx" onclick="rmCmd(this)">×</button>';
  w.appendChild(d);
}
function rmCmd(b){ b.parentElement.remove(); }
function addKey(){
  const w=document.getElementById('keysWrap');
  const d=document.createElement('div');d.className='cmd-r';
  d.innerHTML='<input type="text" placeholder="ctrl+shift+k"><button class="bx" onclick="this.parentElement.remove()">×</button>';
  w.appendChild(d);
}

function collectExtData(){
  const feats=[...document.querySelectorAll('.fchip.on')].map(c=>c.dataset.f);
  const cmds=[...document.querySelectorAll('#cmdsWrap input')].map(i=>i.value.trim()).filter(Boolean);
  const keys=[...document.querySelectorAll('#keysWrap input')].map(i=>i.value.trim()).filter(Boolean);
  return{
    name:document.getElementById('extName').value||'my-extension',
    displayName:document.getElementById('extDisplay').value||'My Extension',
    publisher:document.getElementById('extPub').value||'mycompany',
    version:document.getElementById('extVer').value||'0.1.0',
    description:document.getElementById('extDesc').value||'A VS Code extension.',
    category:document.getElementById('extCat').value,
    activation:document.getElementById('extAct').value,
    lang:document.getElementById('extLang').value,
    features:feats, commands:cmds, keybindings:keys,
    languages:document.getElementById('extLangs').value,
    minVsc:document.getElementById('extMinVsc').value||'^1.80.0',
    custom:document.getElementById('extExtra').value,
  };
}

function generateExt(){
  const btn=document.getElementById('genBtn');
  const data=collectExtData();
  btn.classList.add('ld'); btn.disabled=true;
  document.getElementById('extLoading').classList.add('show');
  setStatus('Generating extension…');

  const msgs=['Generating extension…','Writing package.json…','Crafting extension code…','Adding TypeScript types…','Writing tests…','Building README…','Finalizing…'];
  let mi=0;
  const iv=setInterval(()=>{ document.getElementById('extLoadMsg').textContent=msgs[mi%msgs.length]; mi++; }, 600);

  setTimeout(()=>{
    clearInterval(iv);
    genFiles = buildExtFiles(data);
    renderFiles();
    document.getElementById('extLoading').classList.remove('show');
    btn.classList.remove('ld'); btn.disabled=false;
    setStatus('✓ '+Object.keys(genFiles).length+' files generated');
    if(genFiles['README.md']) document.getElementById('readmePreview').textContent=genFiles['README.md'];
    buildGuideSteps(data);
    document.querySelectorAll('.ptab').forEach(t=>t.classList.remove('on'));
    document.getElementById('codeTabBtn').classList.add('on');
    document.querySelectorAll('.pane').forEach(p=>p.classList.remove('on'));
    document.getElementById('pane-code').classList.add('on');
    showToast('Extension generated successfully! 🎉');
  }, 2000);
}

function buildExtFiles(d){
  const isTs = d.lang==='ts';
  const ext = isTs?'ts':'js';
  const commands = d.commands.length ? d.commands : ['helloWorld'];
  const feats = d.features;

  const contributes={};
  contributes.commands = commands.map(c=>({command:`${d.name}.${c}`,title:c.replace(/([A-Z])/g,' $1').trim()}));
  if(d.keybindings.length){
    contributes.keybindings = d.keybindings.map((k,i)=>({command:`${d.name}.${commands[i]||commands[0]}`,key:k,mac:k.replace('ctrl','cmd')}));
  }
  if(feats.includes('settings')){
    contributes.configuration={title:d.displayName,properties:{[`${d.name}.enabled`]:{type:'boolean',default:true,description:'Enable/disable the extension'}}};
  }
  contributes.menus={'editor/context':commands.map(c=>({command:`${d.name}.${c}`,group:'navigation'}))};

  const pkg={
    name:d.name, displayName:d.displayName, description:d.description,
    version:d.version, publisher:d.publisher,
    engines:{vscode:d.minVsc},
    categories:[d.category||'Other'],
    keywords:[d.name,'vscode-extension'],
    activationEvents:[d.activation==='*'?'*':`${d.activation}:${d.name}`],
    main:'./out/extension.js',
    contributes,
    scripts:{ compile:`tsc -p ./`, watch:`tsc -watch -p ./`, pretest:`${isTs?'npm run compile && ':''}npm run lint`, lint:'eslint src --ext ts', test:'node ./out/test/runTests.js', package:'vsce package', publish:'vsce publish' },
    devDependencies:{ '@types/vscode':d.minVsc, '@types/node':'^18.0.0', ...(isTs?{'typescript':'^5.0.0','@typescript-eslint/eslint-plugin':'^6.0.0','@typescript-eslint/parser':'^6.0.0'}:{}), 'eslint':'^8.0.0', '@vscode/test-electron':'^2.3.0', '@vscode/vsce':'^2.0.0' }
  };

  const statusBarCode = feats.includes('statusBar')?`
  // Status Bar
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = '$(extensions) ${d.displayName}';
  statusBarItem.tooltip = '${d.description}';
  statusBarItem.command = '${d.name}.${commands[0]}';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);`:'';

  const webviewCode = feats.includes('webview')?`
  // WebView Panel
  const webviewProvider = vscode.commands.registerCommand('${d.name}.openWebview', () => {
    const panel = vscode.window.createWebviewPanel('${d.name}', '${d.displayName}', vscode.ViewColumn.One, { enableScripts: true });
    panel.webview.html = \`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${d.displayName}</title></head><body style="background:#1e1e1e;color:#d4d4d4;font-family:sans-serif;padding:20px"><h1>${d.displayName}</h1><p>${d.description}</p></body></html>\`;
  });
  context.subscriptions.push(webviewProvider);`:'';

  const treeViewCode = feats.includes('treeView')?`
  // Tree View Provider
  class ${toPascal(d.name)}TreeProvider${isTs?' implements vscode.TreeDataProvider<vscode.TreeItem>':''} {
    getTreeItem(element${isTs?': vscode.TreeItem':''}) { return element; }
    getChildren() { return [new vscode.TreeItem('${d.displayName}', vscode.TreeItemCollapsibleState.None)]; }
  }
  vscode.window.registerTreeDataProvider('${d.name}.view', new ${toPascal(d.name)}TreeProvider());`:'';

  const completionsCode = feats.includes('completions')?`
  // Completion Provider
  const completionProvider = vscode.languages.registerCompletionItemProvider(
    ${d.languages?`[${d.languages.split(',').map(l=>`'${l.trim()}'`).join(',')}]`:"'*'"}, {
    provideCompletionItems(document, position) {
      const item = new vscode.CompletionItem('${d.name}', vscode.CompletionItemKind.Snippet);
      item.insertText = new vscode.SnippetString('// ${d.displayName}\n$0');
      item.documentation = new vscode.MarkdownString('${d.description}');
      return [item];
    }
  });
  context.subscriptions.push(completionProvider);`:'';

  const hoverCode = feats.includes('hover')?`
  // Hover Provider
  const hoverProvider = vscode.languages.registerHoverProvider('*', {
    provideHover(document, position) {
      const word = document.getText(document.getWordRangeAtPosition(position));
      if (word) return new vscode.Hover(\`**${d.displayName}**: Found "\${word}"\`);
    }
  });
  context.subscriptions.push(hoverProvider);`:'';

  const commandsCode = commands.map(c=>`
  const ${c}Cmd = vscode.commands.registerCommand('${d.name}.${c}', async () => {
    try {
      const result = await vscode.window.showInformationMessage('${d.displayName}: ${c} executed!', 'OK', 'Cancel');
      if (result === 'OK') {
        vscode.window.showInformationMessage('Action confirmed!');
        ${feats.includes('statusBar')?`statusBarItem.text = '$(check) ${c} done';`:''}
      }
    } catch (err) {
      vscode.window.showErrorMessage('${d.name}: ' + ${isTs?'(err as Error).message':'err.message'});
    }
  });
  context.subscriptions.push(${c}Cmd);`).join('\n');

  const extContent = isTs?
`import * as vscode from 'vscode';

/**
 * ${d.displayName} — ${d.description}
 * Generated by ExtForge Studio v2
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('${d.name} is now active!');
  ${commandsCode}
  ${statusBarCode}
  ${webviewCode}
  ${treeViewCode}
  ${completionsCode}
  ${hoverCode}
}

export function deactivate(): void {
  console.log('${d.name} deactivated.');
}`:
`const vscode = require('vscode');

/**
 * ${d.displayName} — ${d.description}
 * Generated by ExtForge Studio v2
 */
function activate(context) {
  console.log('${d.name} is now active!');
  ${commandsCode}
  ${statusBarCode}
  ${webviewCode}
  ${treeViewCode}
  ${completionsCode}
  ${hoverCode}
}

function deactivate() {
  console.log('${d.name} deactivated.');
}

module.exports = { activate, deactivate };`;

  const typesContent = isTs?
`/**
 * Types for ${d.displayName}
 * Generated by ExtForge Studio v2
 */
export interface ${toPascal(d.name)}Config {
  enabled: boolean;
  version: string;
}

export interface CommandResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export type ExtensionState = 'active' | 'inactive' | 'error';
`:'// No types file needed for JavaScript extensions\n';

  const tsconfig=isTs?JSON.stringify({compilerOptions:{module:'Node16',target:'ES2020',outDir:'./out',lib:['ES2020'],sourceMap:true,rootDir:'./src',strict:true},exclude:['node_modules','.vscode-test']},null,2):'// Not needed for JS projects';

  const testContent = isTs?
`import * as assert from 'assert';
import * as vscode from 'vscode';

suite('${d.displayName} Test Suite', () => {
  vscode.window.showInformationMessage('Starting ${d.displayName} tests.');

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('${d.publisher}.${d.name}'));
  });

  test('Extension should activate', async () => {
    const ext = vscode.extensions.getExtension('${d.publisher}.${d.name}');
    await ext?.activate();
    assert.ok(ext?.isActive);
  });

  ${commands.map(c=>`test('Command ${c} should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('${d.name}.${c}'));
  });`).join('\n\n  ')}
});`:
`const assert = require('assert');
const vscode = require('vscode');

suite('${d.displayName} Test Suite', () => {
  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('${d.publisher}.${d.name}'));
  });
});`;

  const readme=`# ${d.displayName}

> ${d.description}

[![VS Code Marketplace](https://vsmarketplacebadges.dev/version/${d.publisher}.${d.name}.svg)](https://marketplace.visualstudio.com/items?itemName=${d.publisher}.${d.name})
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

${feats.length?feats.map(f=>`- **${f.replace(/([A-Z])/g,' $1').trim()}** — Included`).join('\n'):'- Core extension functionality'}

## Commands

${commands.map(c=>`| \`${d.name}.${c}\` | Execute ${c.replace(/([A-Z])/g,' $1').trim()} |`).join('\n')}

## Requirements

- Visual Studio Code ${d.minVsc}
- Node.js 18+

## Extension Settings

${feats.includes('settings')?`This extension contributes the following settings:\n\n- \`${d.name}.enabled\` — Enable/disable the extension`:'No settings contributed.'}

## Installation

1. Open VS Code
2. Press \`Ctrl+Shift+X\` to open Extensions
3. Search for \`${d.displayName}\`
4. Click Install

## Development

\`\`\`bash
git clone https://github.com/${d.publisher}/${d.name}
cd ${d.name}
npm install
npm run compile
\`\`\`

Press \`F5\` to open an Extension Development Host window.

## License

MIT — Generated by [ExtForge Studio v2](https://github.com/${d.publisher}/${d.name})`;

  const changelogMd=`# Changelog

All notable changes to "${d.displayName}" are documented here.

## [${d.version}] — ${new Date().toISOString().split('T')[0]}

### Added
- Initial release
${commands.map(c=>`- Command \`${d.name}.${c}\``).join('\n')}
${feats.map(f=>`- Feature: ${f}`).join('\n')}
`;

  const vscodeignore=`.vscode/**
.vscode-test/**
src/**
.gitignore
.yarnrc
webpack.config.js
vsc-extension-quickstart.md
**/tsconfig.json
**/.eslintrc.json
**/*.map
**/*.ts
!out/**
node_modules/**
`;

  const files={
    'package.json':JSON.stringify(pkg,null,2),
    [`src/extension.${ext}`]:extContent,
    [`src/test/extension.test.${ext}`]:testContent,
    'README.md':readme,
    'CHANGELOG.md':changelogMd,
    '.vscodeignore':vscodeignore,
  };
  if(isTs){ files['src/types.ts']=typesContent; files['tsconfig.json']=tsconfig; }
  return files;
}

function toPascal(str){ return str.replace(/(^|[-_])([a-z])/g,(_,__,c)=>c.toUpperCase()); }

function renderFiles(){
  const bar=document.getElementById('fileBar'); bar.innerHTML='';
  const icons={'package.json':'📦','src/extension.ts':'🔧','src/extension.js':'🔧',
    'src/types.ts':'🏷️','tsconfig.json':'⚙️','src/test/extension.test.ts':'🧪',
    'src/test/extension.test.js':'🧪','CHANGELOG.md':'📋','README.md':'📖','.vscodeignore':'🚫'};
  Object.keys(genFiles).forEach((fn,i)=>{
    const b=document.createElement('button');
    b.className='ftab'+(i===0?' on':'');
    b.innerHTML=`${icons[fn]||'📄'} ${fn}`;
    b.onclick=()=>{
      document.querySelectorAll('.ftab').forEach(t=>t.classList.remove('on'));
      b.classList.add('on'); curFile=fn;
      document.getElementById('codeOut').innerHTML=hlCode(fn,genFiles[fn]);
      const sbf=document.getElementById('sbFile'); if(sbf) sbf.textContent=fn;
    };
    bar.appendChild(b);
  });
  const first=Object.keys(genFiles)[0];
  if(first){ curFile=first; document.getElementById('codeOut').innerHTML=hlCode(first,genFiles[first]); }
}

function hlCode(fn, code){
  const e=code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  if(fn.endsWith('.json'))return e.replace(/"([^"]+)":/g,'<span class="prop">"$1"</span>:').replace(/: "([^"]*)"/g,': <span class="str">"$1"</span>').replace(/: (\d+(?:\.\d+)?)/g,': <span class="num">$1</span>').replace(/: (true|false|null)/g,': <span class="kw">$1</span>');
  if(fn.endsWith('.ts')||fn.endsWith('.js'))return e.replace(/\/\/.*/g,'<span class="cm">$&</span>').replace(/\/\*[\s\S]*?\*\//g,'<span class="cm">$&</span>').replace(/\b(import|export|from|const|let|var|function|class|interface|type|enum|extends|implements|return|if|else|for|while|async|await|new|this|void|null|undefined|true|false|readonly|public|private|protected|abstract|static|override|require|module)\b/g,'<span class="kw">$1</span>').replace(/'([^']*)'/g,"<span class='str'>'$1'</span>").replace(/"([^"]*)"/g,'<span class="str">"$1"</span>').replace(/`([^`]*)`/g,'<span class="str">`$1`</span>').replace(/\b([A-Z][a-zA-Z0-9]+)\b/g,'<span class="tp">$1</span>');
  if(fn.endsWith('.md'))return e.replace(/^## .*/gm,'<span style="color:#60a5fa;font-weight:700">$&</span>').replace(/^# .*/gm,'<span style="color:#f0f4ff;font-size:1.05em;font-weight:800">$&</span>').replace(/`([^`]+)`/g,'<span class="str">`$1`</span>');
  return e;
}

function copyCurrentFile(){
  if(!curFile||!genFiles[curFile]){showToast('Nothing to copy',true);return;}
  navigator.clipboard.writeText(genFiles[curFile]);
  showToast('File copied to clipboard!');
}
function formatCode(){ showToast('Code is already formatted!'); }
async function downloadAll(){
  if(!Object.keys(genFiles).length){showToast('Generate an extension first!',true);return;}
  for(const [fn,content] of Object.entries(genFiles)){
    const blob=new Blob([content],{type:'text/plain'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=fn.split('/').pop();a.click();
    URL.revokeObjectURL(url);
    await new Promise(r=>setTimeout(r,200));
  }
  showToast('Downloaded '+Object.keys(genFiles).length+' files!');
}
async function downloadZip(){
  if(!Object.keys(genFiles).length){showToast('Generate an extension first!',true);return;}
  showToast('Downloading all files individually…');
  downloadAll();
}

function buildGuideSteps(d){
  const name=d?d.name:'my-extension';
  const isTs=d?d.lang==='ts':true;
  const steps=[
    {n:1,t:'Download Files',d:'Click <strong>⬇️ All Files</strong> in the Code tab to get all extension files.',cmd:null},
    {n:2,t:'Install Dependencies',d:'Open terminal in your extension folder and run:',cmd:'npm install'},
    ...(isTs?[{n:3,t:'Compile TypeScript',d:'Build the extension:',cmd:'npm run compile'}]:[]),
    {n:isTs?4:3,t:'Open in VS Code',d:'Open the folder in VS Code and press <code style="background:var(--sf3);padding:2px 5px;border-radius:3px;color:var(--a1)">F5</code> to launch Extension Development Host.',cmd:null},
    {n:isTs?5:4,t:'Run Tests',d:'Run the test suite:',cmd:'npm test'},
    {n:isTs?6:5,t:'Package Extension',d:'Create a .vsix distribution file:',cmd:'npx vsce package'},
    {n:isTs?7:6,t:'Publish to Marketplace',d:'Publish (needs Personal Access Token):',cmd:'npx vsce publish'},
  ];
  const wrap=document.getElementById('guideSteps');
  if(!wrap)return;
  wrap.innerHTML=steps.map(s=>`
    <div style="display:flex;gap:14px;align-items:flex-start">
      <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--a1),var(--a1)80);border:1px solid rgba(59,130,246,.4);display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:.72rem;font-weight:700;flex-shrink:0">${s.n}</div>
      <div style="flex:1">
        <div style="font-size:.92rem;font-weight:700;margin-bottom:3px;color:var(--bright)">${s.t}</div>
        <p style="font-family:var(--mono);font-size:.75rem;color:var(--mt);line-height:1.6">${s.d}</p>
        ${s.cmd?`<div style="margin-top:7px;background:#080c14;border:1px solid var(--bdr);border-radius:5px;padding:9px 12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><code style="font-family:var(--mono);font-size:.75rem;color:var(--a2)">${s.cmd}</code><button class="bsm" onclick="copyText('${s.cmd}')">Copy</button></div>`:''}
      </div>
    </div>`).join('');
}

// ════════════════════════════════════════════════════════════
// TEMPLATES — FIXED
// ════════════════════════════════════════════════════════════
const TEMPLATES=[
  {icon:'🔔',name:'Hello World',desc:'The classic starter. A simple command that shows a notification message.',tags:['Beginner','Command'],config:{name:'hello-world',displayName:'Hello World',features:[],commands:['helloWorld'],category:'commands',lang:'ts'}},
  {icon:'📊',name:'Status Bar Clock',desc:'Adds a live clock to the VS Code status bar, updating every second.',tags:['Status Bar','UI'],config:{name:'status-bar-clock',displayName:'Status Bar Clock',features:['statusBar'],commands:['toggleClock'],category:'sidebar',lang:'ts'}},
  {icon:'🌳',name:'File Explorer Tree',desc:'Adds a custom tree view to the sidebar showing project structure.',tags:['Tree View','Sidebar'],config:{name:'file-tree',displayName:'File Explorer Tree',features:['treeView','statusBar'],commands:['refreshTree'],category:'sidebar',lang:'ts'}},
  {icon:'✂️',name:'Smart Snippets',desc:'Registers intelligent code snippets with tab stops for common patterns.',tags:['Snippets','Editor'],config:{name:'smart-snippets',displayName:'Smart Snippets',features:['completions','quickpick'],commands:['insertSnippet'],category:'snippets',lang:'ts'}},
  {icon:'🎨',name:'Code Colorizer',desc:'Highlights and decorates specific patterns in your editor with colors.',tags:['Decorations','Editor'],config:{name:'code-colorizer',displayName:'Code Colorizer',features:['decorations','hover'],commands:['toggleColors'],category:'formatters',lang:'ts'}},
  {icon:'🔍',name:'Symbol Finder',desc:'Quick-pick command palette to jump to any symbol in the workspace.',tags:['Quick Pick','Navigation'],config:{name:'symbol-finder',displayName:'Symbol Finder',features:['quickpick','completions'],commands:['findSymbol'],category:'commands',lang:'ts'}},
  {icon:'📝',name:'Todo Tracker',desc:'Scans workspace for TODO/FIXME comments and shows them as diagnostics.',tags:['Diagnostics','Linter'],config:{name:'todo-tracker',displayName:'Todo Tracker',features:['diagnostics','treeView','statusBar'],commands:['scanTodos','clearTodos'],category:'linters',lang:'ts'}},
  {icon:'⚡',name:'Code Runner',desc:'Runs the current file in the integrated terminal with one command.',tags:['Terminal','Runner'],config:{name:'code-runner',displayName:'Code Runner',features:['terminal','statusBar','quickpick'],commands:['runFile','stopRun'],category:'commands',lang:'ts'}},
  {icon:'🔀',name:'Git Helper',desc:'Enhanced Git commands and shortcuts for common operations.',tags:['Git','SCM'],config:{name:'git-helper',displayName:'Git Helper',features:['git','scm','statusBar'],commands:['quickCommit','pushBranch'],category:'commands',lang:'ts'}},
  {icon:'🌐',name:'WebView Dashboard',desc:'Opens a beautiful webview panel with a custom HTML dashboard.',tags:['WebView','UI'],config:{name:'webview-dashboard',displayName:'WebView Dashboard',features:['webview','statusBar'],commands:['openDashboard'],category:'sidebar',lang:'ts'}},
  {icon:'🐛',name:'Debug Helper',desc:'Adds helpful debug configurations and diagnostic visualizations.',tags:['Debug','Diagnostics'],config:{name:'debug-helper',displayName:'Debug Helper',features:['debug','diagnostics','codelens'],commands:['startDebug'],category:'debugger',lang:'ts'}},
  {icon:'📦',name:'Package Manager',desc:'Quick access to NPM/pip commands via a custom sidebar panel.',tags:['Tasks','Sidebar'],config:{name:'pkg-manager',displayName:'Package Manager',features:['treeView','terminal','tasks'],commands:['installDeps','updateDeps'],category:'sidebar',lang:'ts'}},
];

function initTemplates(){
  const grid=document.getElementById('templatesGrid');
  if(!grid) return;
  // Always re-render so buttons are always fresh
  grid.innerHTML='';
  TEMPLATES.forEach((t, idx)=>{
    const card=document.createElement('div');
    card.className='tmpl-card';
    card.innerHTML=`
      <div class="tmpl-icon">${t.icon}</div>
      <div class="tmpl-name">${t.name}</div>
      <div class="tmpl-desc">${t.desc}</div>
      <div class="tmpl-tags">${t.tags.map(tag=>`<span class="tmpl-tag">${tag}</span>`).join('')}</div>
      <div style="margin-top:12px">
        <button class="bsm hi" style="width:100%;justify-content:center" onclick="loadTemplate(${idx})">⚡ Use Template</button>
      </div>`;
    grid.appendChild(card);
  });
}

function loadTemplate(i){
  const t = TEMPLATES[i];
  const c = t.config;

  // Fill sidebar fields
  document.getElementById('extName').value = c.name;
  document.getElementById('extDisplay').value = c.displayName;
  document.getElementById('extCat').value = c.category || 'commands';
  document.getElementById('extLang').value = c.lang || 'ts';

  // Toggle feature chips
  document.querySelectorAll('.fchip').forEach(chip => {
    chip.classList.toggle('on', c.features.includes(chip.dataset.f));
  });

  // Rebuild commands list
  const wrap = document.getElementById('cmdsWrap');
  wrap.innerHTML = '';
  (c.commands || ['helloWorld']).forEach(cmd => {
    const d = document.createElement('div');
    d.className = 'cmd-r';
    d.innerHTML = `<input type="text" value="${cmd}" placeholder="commandId"><button class="bx" onclick="rmCmd(this)">×</button>`;
    wrap.appendChild(d);
  });

  // FIX: properly find and activate the Extension Builder tab
  const extTab = [...document.querySelectorAll('.mtab')].find(btn =>
    btn.getAttribute('onclick') && btn.getAttribute('onclick').includes("'ext'")
  );
  switchPage('ext', extTab);

  // Scroll sidebar to top so user sees loaded values
  const sbScroll = document.querySelector('#mainSidebar .sb-scroll');
  if(sbScroll) sbScroll.scrollTo({ top: 0, behavior: 'smooth' });

  showToast(`Template "${t.name}" loaded! Click ⚡ Generate.`);
}

// ════════════════════════════════════════════════════════════
// THEME CREATOR
// ════════════════════════════════════════════════════════════
const themeColorDefs={
  'Editor':{'editor.background':'#181D27','editor.foreground':'#D1D3DB','editor.lineHighlightBackground':'#282B3A','editor.selectionBackground':'#3579FF47','editor.inactiveSelectionBackground':'#3579FF2E','editorCursor.foreground':'#ffffff','editorLineNumber.foreground':'#979AA4','editorLineNumber.activeForeground':'#E0E3EE'},
  'Tabs & Title':{'tab.activeBackground':'#1E2233','tab.activeForeground':'#DADDE5','tab.inactiveBackground':'#171B26','tab.inactiveForeground':'#9599A6','tab.activeBorderTop':'#387BFF','editorGroupHeader.tabsBackground':'#171B26','titleBar.activeBackground':'#1E2233','titleBar.activeForeground':'#DADDE5','titleBar.inactiveBackground':'#171B26'},
  'Activity Bar':{'activityBar.background':'#232A35','activityBar.foreground':'#F5F9FE','activityBar.inactiveForeground':'#9599A6','activityBarBadge.background':'#387BFF','activityBarBadge.foreground':'#FFFFFF'},
  'Sidebar':{'sideBar.background':'#181D27','sideBar.foreground':'#9599A6','sideBar.border':'#232A35','list.activeSelectionBackground':'#B0C0F417','list.activeSelectionForeground':'#F5F9FE','list.hoverBackground':'#B0C0F40F'},
  'Status Bar':{'statusBar.background':'#171B26','statusBar.foreground':'#9599A6','statusBar.border':'#232A35'},
  'Panel & Terminal':{'terminal.background':'#181D27','terminal.foreground':'#D1D3DB','terminal.ansiBlue':'#387BFF','terminal.ansiGreen':'#32F08C','terminal.ansiRed':'#F65A5A','terminal.ansiYellow':'#DCB364'},
  'UI Controls':{'button.background':'#387BFF','button.foreground':'#FFFFFF','input.background':'#B0C0F40A','badge.background':'#387BFF','badge.foreground':'#FFFFFF','focusBorder':'#387BFF40'},
};

const themePresets={
  dark:{'editor.background':'#1e1e1e','editor.foreground':'#d4d4d4','tab.activeBackground':'#1e1e1e','tab.activeBorderTop':'#007acc','activityBar.background':'#333333','sideBar.background':'#252526','statusBar.background':'#007acc','statusBar.foreground':'#ffffff','titleBar.activeBackground':'#3c3c3c'},
  light:{'editor.background':'#ffffff','editor.foreground':'#000000','tab.activeBackground':'#ffffff','tab.activeBorderTop':'#0078d4','activityBar.background':'#2c2c2c','sideBar.background':'#f3f3f3','statusBar.background':'#007acc','statusBar.foreground':'#ffffff','titleBar.activeBackground':'#dddddd'},
  horizon:{'editor.background':'#181D27','editor.foreground':'#D1D3DB','tab.activeBackground':'#1E2233','tab.activeBorderTop':'#387BFF','activityBar.background':'#232A35','sideBar.background':'#181D27','statusBar.background':'#171B26','titleBar.activeBackground':'#1E2233'},
  dracula:{'editor.background':'#282A36','editor.foreground':'#F8F8F2','tab.activeBackground':'#282A36','tab.activeBorderTop':'#BD93F9','activityBar.background':'#21222C','sideBar.background':'#21222C','statusBar.background':'#191A21','titleBar.activeBackground':'#21222C'},
  solarized:{'editor.background':'#002B36','editor.foreground':'#839496','tab.activeBackground':'#073642','tab.activeBorderTop':'#268BD2','activityBar.background':'#073642','sideBar.background':'#073642','statusBar.background':'#268BD2','statusBar.foreground':'#fdf6e3'},
};

function randomTheme(){
  const hue1=Math.floor(Math.random()*360);
  const hue2=(hue1+137)%360;
  const colors={
    'editor.background':`hsl(${hue1},20%,10%)`,'editor.foreground':'#d4d4d4',
    'tab.activeBorderTop':`hsl(${hue1},70%,55%)`,'tab.activeBackground':`hsl(${hue1},20%,14%)`,
    'tab.inactiveBackground':`hsl(${hue1},20%,10%)`,'activityBar.background':`hsl(${hue1},22%,13%)`,
    'sideBar.background':`hsl(${hue1},20%,10%)`,'statusBar.background':`hsl(${hue2},50%,28%)`,
    'statusBar.foreground':'#ffffff','titleBar.activeBackground':`hsl(${hue1},20%,13%)`,
  };
  Object.assign(themeColors,colors);
  renderColorGroups();renderVSCMock();
  showToast('Random theme generated!');
}

function initTheme(){
  if(!Object.keys(themeColors).length){
    Object.values(themeColorDefs).forEach(g=>Object.assign(themeColors,g));
  }
  renderColorGroups();renderVSCMock();renderTokenPreview();
}

function renderColorGroups(){
  const c=document.getElementById('colorGroupsContainer');if(!c)return;c.innerHTML='';
  for(const [gn,keys] of Object.entries(themeColorDefs)){
    const g=document.createElement('div');g.className='cg';
    g.innerHTML=`<div class="cg-title">${gn}</div><div class="cgrid" id="cg${gn.replace(/\W/g,'_')}"></div>`;
    c.appendChild(g);
    const grid=g.querySelector('.cgrid');
    for(const key of Object.keys(keys)){
      const val=themeColors[key]||keys[key];
      const dc=val.startsWith('#')&&val.length>7?val.substring(0,7):val;
      const row=document.createElement('div');row.className='crow';
      row.innerHTML=`<div class="cswatch" style="background:${dc}"><input type="color" value="${dc.startsWith('#')?dc:'#000000'}" data-key="${key}" oninput="updateThemeColor(this)"></div><div class="cinfo"><div class="ckey" title="${key}">${key.split('.').slice(-2).join('.')}</div><input class="chex" type="text" value="${val}" data-key="${key}" onchange="updateThemeHex(this)"></div>`;
      grid.appendChild(row);
    }
  }
}

function updateThemeColor(inp){
  const k=inp.dataset.key;themeColors[k]=inp.value;
  inp.parentElement.style.background=inp.value;
  const h=inp.closest('.crow').querySelector('.chex');if(h)h.value=inp.value;
  renderVSCMock();renderTokenPreview();
  const dot=document.getElementById('themeChangedDot');if(dot)dot.style.display='inline';
}

function updateThemeHex(inp){
  const k=inp.dataset.key,v=inp.value.trim();
  if(/^#[0-9A-Fa-f]{3,8}$/.test(v)){
    themeColors[k]=v;
    const sw=inp.closest('.crow').querySelector('.cswatch');if(sw)sw.style.background=v.length>7?v.substring(0,7):v;
    const pc=inp.closest('.crow').querySelector('input[type=color]');if(pc)pc.value=v.length>7?v.substring(0,7):v;
    renderVSCMock();renderTokenPreview();
  }
}

function renderVSCMock(){
  const tc=themeColors;
  const c=(k,def='#333')=>tc[k]||def;
  const el=document.getElementById('vscMock');if(!el)return;
  el.innerHTML=`<div class="vsc-tb" style="background:${c('titleBar.activeBackground')};color:${c('titleBar.activeForeground','#ccc')}">my-project — VS Code</div>
    <div class="vsc-tabs" style="background:${c('editorGroupHeader.tabsBackground')};border-bottom:1px solid ${c('tab.border','#333')}">
      <div class="vsc-tab" style="background:${c('tab.activeBackground')};color:${c('tab.activeForeground','#fff')};border-top:2px solid ${c('tab.activeBorderTop')}">📄 index.ts</div>
      <div class="vsc-tab" style="background:${c('tab.inactiveBackground')};color:${c('tab.inactiveForeground','#888')}">📄 app.ts</div>
    </div>
    <div class="vsc-main">
      <div class="vsc-act" style="background:${c('activityBar.background')};border-right:1px solid ${c('activityBar.border','#333')}">
        <div class="vsc-ai" style="color:${c('activityBar.foreground','#fff')}">📁</div>
        <div class="vsc-ai" style="color:${c('activityBar.inactiveForeground','#888')}">🔍</div>
        <div class="vsc-ai" style="color:${c('activityBar.inactiveForeground','#888')}">🔧</div>
      </div>
      <div class="vsc-sb" style="background:${c('sideBar.background')};border-right:1px solid ${c('sideBar.border','#333')}">
        <div class="vsc-si" style="background:${c('list.activeSelectionBackground')};color:${c('list.activeSelectionForeground','#fff')}">📁 src</div>
        <div class="vsc-si" style="color:${c('sideBar.foreground','#aaa')}">  📄 index.ts</div>
        <div class="vsc-si" style="color:${c('sideBar.foreground','#aaa')}">  📄 app.ts</div>
      </div>
      <div class="vsc-ed" style="background:${c('editor.background')}">
        ${[['1','<span style="color:#F65A5A">const</span> <span style="color:#7ee787">msg</span> = <span style="color:#a5d6ff">"Hello"</span>;'],['2','<span style="color:#F65A5A">function</span> <span style="color:#d2a8ff">activate</span>() {'],['3','  <span style="color:#8b949e">// entry point</span>'],['4','  <span style="color:#d2a8ff">vscode</span>.<span style="color:#d2a8ff">window</span>.show'],['5','}']].map(([n,code])=>`<div class="vsc-line" style="background:${n==='3'?c('editor.lineHighlightBackground'):'transparent'}"><span class="vsc-ln" style="color:${n==='3'?c('editorLineNumber.activeForeground'):c('editorLineNumber.foreground','#555')}">${n}</span><span class="vsc-code" style="color:${c('editor.foreground')}">${code}</span></div>`).join('')}
      </div>
    </div>
    <div class="vsc-stbar" style="background:${c('statusBar.background')};border-top:1px solid ${c('statusBar.border','#333')};color:${c('statusBar.foreground','#aaa')}">
      <span>⎇ main</span><span>TypeScript</span><span>UTF-8</span>
    </div>`;
}

function renderTokenPreview(){
  const tp=document.getElementById('tokenPrev');if(!tp)return;
  const bg=themeColors['editor.background']||'#181D27';
  const fg=themeColors['editor.foreground']||'#D1D3DB';
  tp.innerHTML=`<div style="background:${bg};padding:10px;border-radius:4px;font-size:.72rem;line-height:1.9"><span style="color:#ff7b72">const</span> <span style="color:#7ee787">fn</span> <span style="color:${fg}">=</span> (<span style="color:#ffa657">x</span>: <span style="color:#79c0ff">number</span>): <span style="color:#79c0ff">string</span> => {<br>&nbsp;&nbsp;<span style="color:#8b949e">// compute result</span><br>&nbsp;&nbsp;<span style="color:#ff7b72">return</span> <span style="color:#a5d6ff">\`Result: \${x * 2}\`</span>;<br>};</div>`;
}

function loadPreset(name){
  if(!themePresets[name])return;
  Object.assign(themeColors,themePresets[name]);
  renderColorGroups();renderVSCMock();renderTokenPreview();
  showToast('Loaded '+name+' preset!');
}

function importTheme(){
  const inp=document.createElement('input');inp.type='file';inp.accept='.json';
  inp.onchange=e=>{
    const r=new FileReader();
    r.onload=ev=>{
      try{
        const j=JSON.parse(ev.target.result);
        const colors=j.colors||j;
        Object.assign(themeColors,colors);
        renderColorGroups();renderVSCMock();renderTokenPreview();
        showToast('Theme imported!');
      }catch{showToast('Invalid JSON file',true);}
    };
    r.readAsText(e.target.files[0]);
  };
  inp.click();
}

function exportTheme(){
  const name=document.getElementById('themeNameIn').value||'My Theme';
  const id=name.toLowerCase().replace(/\s+/g,'-');
  const themeJson={'$schema':'vscode://schemas/color-theme',name,colors:themeColors};
  const pkgJson={name:id,displayName:name,description:name+' for VS Code',version:'1.0.0',engines:{vscode:'^1.70.0'},categories:['Themes'],contributes:{themes:[{label:name,uiTheme:'vs-dark',path:`./themes/${id}.json`}]}};
  dl(`${id}-color-theme.json`,JSON.stringify(themeJson,null,2));
  setTimeout(()=>dl('package.json',JSON.stringify(pkgJson,null,2)),300);
  const dot=document.getElementById('themeChangedDot');if(dot)dot.style.display='none';
  showToast('Theme exported (2 files)!');
}

// ════════════════════════════════════════════════════════════
// ICON PACK
// ════════════════════════════════════════════════════════════
const shapes=[
  {name:'file',svg:'<rect x="3" y="1" width="10" height="14" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M9 1v5h5" stroke="currentColor" stroke-width="1.5" fill="none"/>'},
  {name:'folder',svg:'<path d="M1 4h6l2 2h7v9H1z" fill="none" stroke="currentColor" stroke-width="1.5"/>'},
  {name:'gear',svg:'<circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M2.9 2.9l1.4 1.4M11.7 11.7l1.4 1.4M2.9 13.1l1.4-1.4M11.7 4.3l1.4-1.4" stroke="currentColor" stroke-width="1.5"/>'},
  {name:'code',svg:'<polyline points="5,3 1,8 5,13" fill="none" stroke="currentColor" stroke-width="1.5"/><polyline points="11,3 15,8 11,13" fill="none" stroke="currentColor" stroke-width="1.5"/>'},
  {name:'terminal',svg:'<rect x="1" y="2" width="14" height="12" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><polyline points="4,6 7,8 4,10" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="8" y1="10" x2="12" y2="10" stroke="currentColor" stroke-width="1.5"/>'},
  {name:'package',svg:'<polyline points="8,1 15,5 15,11 8,15 1,11 1,5 8,1" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="8" y1="1" x2="8" y2="8" stroke="currentColor" stroke-width="1.5"/><polyline points="1,5 8,8 15,5" fill="none" stroke="currentColor" stroke-width="1.5"/>'},
  {name:'database',svg:'<ellipse cx="8" cy="4" rx="6" ry="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M2 4v8c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V4" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M2 8c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5" fill="none" stroke="currentColor" stroke-width="1.5"/>'},
  {name:'lock',svg:'<rect x="3" y="7" width="10" height="8" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5 7V5a3 3 0 016 0v2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="11" r="1" fill="currentColor"/>'},
  {name:'star',svg:'<polygon points="8,1 10,6 15,6 11,9 12.5,14 8,11 3.5,14 5,9 1,6 6,6" fill="none" stroke="currentColor" stroke-width="1.5"/>'},
  {name:'globe',svg:'<circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/><ellipse cx="8" cy="8" rx="3.5" ry="7" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="1" y1="8" x2="15" y2="8" stroke="currentColor" stroke-width="1.5"/>'},
  {name:'git',svg:'<circle cx="4" cy="4" r="2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="4" r="2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="4" cy="12" r="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M4 6v4M6 4h2a2 2 0 002 2v4a2 2 0 002 2" fill="none" stroke="currentColor" stroke-width="1.5"/>'},
  {name:'lightning',svg:'<polygon points="10,1 4,9 8,9 6,15 12,7 8,7" fill="none" stroke="currentColor" stroke-width="1.5"/>'},
  {name:'cloud',svg:'<path d="M12 9H5.5a3 3 0 010-6h.5a4 4 0 018 1v1a3 3 0 010 4z" fill="none" stroke="currentColor" stroke-width="1.5"/>'},
  {name:'react',svg:'<circle cx="8" cy="8" r="1.5" fill="currentColor"/><ellipse cx="8" cy="8" rx="7" ry="3" fill="none" stroke="currentColor" stroke-width="1.2" transform="rotate(0 8 8)"/><ellipse cx="8" cy="8" rx="7" ry="3" fill="none" stroke="currentColor" stroke-width="1.2" transform="rotate(60 8 8)"/><ellipse cx="8" cy="8" rx="7" ry="3" fill="none" stroke="currentColor" stroke-width="1.2" transform="rotate(120 8 8)"/>'},
  {name:'heart',svg:'<path d="M8 14s-5-3-5-7a3 3 0 016 0 3 3 0 016 0c0 4-7 7-7 7z" fill="none" stroke="currentColor" stroke-width="1.5"/>'},
];

const colorPalette=['#3b82f6','#22d3a5','#f59e0b','#a78bfa','#f43f5e','#06b6d4','#84cc16','#f97316','#ec4899','#8b5cf6','#10b981','#ffffff','#94a3b8','#475569'];

function initIcons(){
  const canvas=document.getElementById('iconCanvas');
  if(!canvas)return;
  iconCanvasCtx=canvas.getContext('2d');
  clearCanvas();
  renderShapePalette();
  renderColorPalette();
  setupCanvasEvents(canvas);
  const ss=document.getElementById('strokeSize');
  if(ss) ss.addEventListener('input',e=>{ const sv=document.getElementById('strokeSizeVal');if(sv)sv.textContent=e.target.value; });
  const io=document.getElementById('iconOpacity');
  if(io) io.addEventListener('input',e=>{ const ov=document.getElementById('opacityVal');if(ov)ov.textContent=e.target.value+'%'; });
  const isz=document.getElementById('iconSize');
  if(isz) isz.addEventListener('change',e=>{ const lbl=document.getElementById('canvasSizeLabel');if(lbl)lbl.textContent=`${e.target.value}×${e.target.value} px`; clearCanvas(); });
  canvas.addEventListener('mousemove',e=>{
    const r=canvas.getBoundingClientRect();
    const sx=canvas.width/r.width,sy=canvas.height/r.height;
    const s=parseInt(document.getElementById('iconSize')?.value||32);
    const px=Math.floor((e.clientX-r.left)*sx/(CANVAS_PX/s));
    const py=Math.floor((e.clientY-r.top)*sy/(CANVAS_PX/s));
    const cp=document.getElementById('cursorPos');if(cp)cp.textContent=`${px}, ${py}`;
  });
}

function renderShapePalette(){
  const g=document.getElementById('shapePalette');if(!g)return;g.innerHTML='';
  shapes.forEach(s=>{
    const d=document.createElement('div');d.className='iswatch';d.title=s.name;
    d.innerHTML=`<svg viewBox="0 0 16 16" style="color:var(--a1);width:65%;height:65%">${s.svg}</svg>`;
    d.onclick=()=>drawSVGShape(s);
    g.appendChild(d);
  });
}

function renderColorPalette(){
  const cp=document.getElementById('colorPalette');if(!cp)return;cp.innerHTML='';
  colorPalette.forEach(color=>{
    const d=document.createElement('div');
    d.style.cssText=`width:100%;aspect-ratio:1;border-radius:4px;background:${color};cursor:pointer;border:2px solid transparent;transition:all .14s`;
    d.onclick=()=>{ const ic=document.getElementById('iconColor');if(ic)ic.value=color; d.style.borderColor='white'; };
    d.onmouseenter=()=>{ d.style.transform='scale(1.1)'; };
    d.onmouseleave=()=>{ d.style.transform=''; };
    cp.appendChild(d);
  });
}

function drawSVGShape(shape){
  saveUndo();
  const ctx=iconCanvasCtx;
  const ic=document.getElementById('iconColor');
  const color=ic?ic.value:'#3b82f6';
  const svgStr=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="${CANVAS_PX}" height="${CANVAS_PX}">${shape.svg.replace(/currentColor/g,color)}</svg>`;
  const img=new Image();
  const blob=new Blob([svgStr],{type:'image/svg+xml'});
  const url=URL.createObjectURL(blob);
  img.onload=()=>{ ctx.drawImage(img,0,0,CANVAS_PX,CANVAS_PX); URL.revokeObjectURL(url); };
  img.src=url;
}

function setTool(t){
  curTool=t;
  document.querySelectorAll('.tbtn').forEach(b=>b.classList.remove('on'));
  const id='tool-'+(t==='ellipse'?'circle':t);
  const b=document.getElementById(id);if(b)b.classList.add('on');
}

function setupCanvasEvents(canvas){
  let prevX,prevY;
  canvas.addEventListener('mousedown',e=>{
    isDrawing=true;
    const r=canvas.getBoundingClientRect();
    const sx=canvas.width/r.width,sy=canvas.height/r.height;
    startX=(e.clientX-r.left)*sx; startY=(e.clientY-r.top)*sy;
    prevX=startX; prevY=startY;
    saveUndo();
    if(curTool==='fill'){ floodFill(Math.round(startX),Math.round(startY),document.getElementById('iconColor')?.value||'#000'); isDrawing=false; return; }
    snapshot=iconCanvasCtx.getImageData(0,0,canvas.width,canvas.height);
  });
  canvas.addEventListener('mousemove',e=>{
    if(!isDrawing)return;
    const r=canvas.getBoundingClientRect();
    const sx=canvas.width/r.width,sy=canvas.height/r.height;
    const x=(e.clientX-r.left)*sx,y=(e.clientY-r.top)*sy;
    const ctx=iconCanvasCtx;
    const s=parseInt(document.getElementById('iconSize')?.value||32);
    const sw=parseInt(document.getElementById('strokeSize')?.value||2)*(CANVAS_PX/s);
    const color=document.getElementById('iconColor')?.value||'#3b82f6';
    const opacity=parseInt(document.getElementById('iconOpacity')?.value||100)/100;
    ctx.globalAlpha=opacity; ctx.strokeStyle=color; ctx.fillStyle=color;
    ctx.lineWidth=sw; ctx.lineCap='round'; ctx.lineJoin='round';
    if(curTool==='pencil'){ ctx.beginPath();ctx.moveTo(prevX,prevY);ctx.lineTo(x,y);ctx.stroke();prevX=x;prevY=y; }
    else if(curTool==='eraser'){ const es=sw*2;ctx.clearRect(x-es/2,y-es/2,es,es);prevX=x;prevY=y; }
    else if(['line','rect','ellipse','triangle','arrow'].includes(curTool)){
      ctx.putImageData(snapshot,0,0);ctx.beginPath();
      if(curTool==='line'){ ctx.moveTo(startX,startY);ctx.lineTo(x,y);ctx.stroke(); }
      else if(curTool==='rect'){ ctx.strokeRect(startX,startY,x-startX,y-startY); }
      else if(curTool==='ellipse'){ ctx.ellipse((startX+x)/2,(startY+y)/2,Math.abs(x-startX)/2,Math.abs(y-startY)/2,0,0,Math.PI*2);ctx.stroke(); }
      else if(curTool==='triangle'){ ctx.moveTo((startX+x)/2,startY);ctx.lineTo(x,y);ctx.lineTo(startX,y);ctx.closePath();ctx.stroke(); }
      else if(curTool==='arrow'){
        ctx.moveTo(startX,startY);ctx.lineTo(x,y);ctx.stroke();
        const angle=Math.atan2(y-startY,x-startX);
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-15*Math.cos(angle-0.4),y-15*Math.sin(angle-0.4));
        ctx.moveTo(x,y);ctx.lineTo(x-15*Math.cos(angle+0.4),y-15*Math.sin(angle+0.4));ctx.stroke();
      }
    }
    ctx.globalAlpha=1;
  });
  canvas.addEventListener('mouseup',()=>{ isDrawing=false; });
  canvas.addEventListener('mouseleave',()=>{ isDrawing=false; });
}

function floodFill(x,y,fillColor){
  const canvas=document.getElementById('iconCanvas');const ctx=iconCanvasCtx;
  const imgData=ctx.getImageData(0,0,canvas.width,canvas.height);const data=imgData.data;
  const idx=(y*canvas.width+x)*4;
  const tR=data[idx],tG=data[idx+1],tB=data[idx+2],tA=data[idx+3];
  const fR=parseInt(fillColor.slice(1,3),16),fG=parseInt(fillColor.slice(3,5),16),fB=parseInt(fillColor.slice(5,7),16);
  if(tR===fR&&tG===fG&&tB===fB)return;
  const stack=[[x,y]];
  while(stack.length){
    const [cx,cy]=stack.pop();
    if(cx<0||cy<0||cx>=canvas.width||cy>=canvas.height)continue;
    const i=(cy*canvas.width+cx)*4;
    if(data[i]!==tR||data[i+1]!==tG||data[i+2]!==tB||data[i+3]!==tA)continue;
    data[i]=fR;data[i+1]=fG;data[i+2]=fB;data[i+3]=255;
    stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
  }
  ctx.putImageData(imgData,0,0);
}

function saveUndo(){
  const c=document.getElementById('iconCanvas');if(!c||!iconCanvasCtx)return;
  undoStack.push(iconCanvasCtx.getImageData(0,0,c.width,c.height));
  if(undoStack.length>50)undoStack.shift();
  redoStack=[];
}
function undo(){
  if(!undoStack.length)return;
  const c=document.getElementById('iconCanvas');
  redoStack.push(iconCanvasCtx.getImageData(0,0,c.width,c.height));
  iconCanvasCtx.putImageData(undoStack.pop(),0,0);
}
function redo(){
  if(!redoStack.length)return;
  const c=document.getElementById('iconCanvas');
  undoStack.push(iconCanvasCtx.getImageData(0,0,c.width,c.height));
  iconCanvasCtx.putImageData(redoStack.pop(),0,0);
}
function zoomCanvas(f){
  const c=document.getElementById('iconCanvas');const ctx=iconCanvasCtx;
  const snap=ctx.getImageData(0,0,c.width,c.height);
  saveUndo();
  const tmp=document.createElement('canvas');tmp.width=c.width;tmp.height=c.height;
  tmp.getContext('2d').putImageData(snap,0,0);
  ctx.clearRect(0,0,c.width,c.height);
  const nw=c.width*f,nh=c.height*f;
  const ox=(c.width-nw)/2,oy=(c.height-nh)/2;
  ctx.drawImage(tmp,ox,oy,nw,nh);
}
function flipCanvas(dir){
  const c=document.getElementById('iconCanvas');const ctx=iconCanvasCtx;saveUndo();
  const tmp=document.createElement('canvas');tmp.width=c.width;tmp.height=c.height;
  tmp.getContext('2d').drawImage(c,0,0);
  ctx.clearRect(0,0,c.width,c.height);ctx.save();
  if(dir==='h'){ctx.scale(-1,1);ctx.drawImage(tmp,-c.width,0);}
  else{ctx.scale(1,-1);ctx.drawImage(tmp,0,-c.height);}
  ctx.restore();
}
function clearCanvas(){
  const canvas=document.getElementById('iconCanvas');if(!canvas)return;
  iconCanvasCtx=canvas.getContext('2d');
  iconCanvasCtx.clearRect(0,0,canvas.width,canvas.height);
  const s=parseInt(document.getElementById('iconSize')?.value||32);
  const step=CANVAS_PX/s;
  iconCanvasCtx.strokeStyle='rgba(255,255,255,0.035)';iconCanvasCtx.lineWidth=1;
  for(let i=0;i<=CANVAS_PX;i+=step){
    iconCanvasCtx.beginPath();iconCanvasCtx.moveTo(i,0);iconCanvasCtx.lineTo(i,CANVAS_PX);iconCanvasCtx.stroke();
    iconCanvasCtx.beginPath();iconCanvasCtx.moveTo(0,i);iconCanvasCtx.lineTo(CANVAS_PX,i);iconCanvasCtx.stroke();
  }
}
function saveIconToPack(){
  const canvas=document.getElementById('iconCanvas');
  const name=document.getElementById('iconNameIn')?.value||'icon';
  const ext=document.getElementById('iconExtIn')?.value||'.ts';
  const cat=document.getElementById('iconCat')?.value||'file';
  const dataURL=canvas.toDataURL('image/png');
  iconPack.push({name,ext,cat,dataURL});
  renderPackList();
  const pc=document.getElementById('packCount');if(pc)pc.textContent=iconPack.length;
  showToast(`"${name}" saved to pack!`);
}
function renderPackList(){
  const list=document.getElementById('packList');if(!list)return;
  if(!iconPack.length){list.innerHTML='<div style="font-family:var(--mono);font-size:.73rem;color:var(--mt2);text-align:center;padding:14px">No icons yet. Draw and save!</div>';return;}
  list.innerHTML='';
  iconPack.forEach((ic,i)=>{
    const el=document.createElement('div');el.className='pitem';
    el.innerHTML=`<div class="pthumb"><img src="${ic.dataURL}" style="width:26px;height:26px;image-rendering:pixelated"></div><div class="pinfo"><div class="pname">${ic.name}</div><div class="pext">${ic.ext} · ${ic.cat}</div></div><button class="bdel" onclick="removeIcon(${i})">🗑️</button>`;
    list.appendChild(el);
  });
}
function removeIcon(i){ iconPack.splice(i,1);renderPackList();const pc=document.getElementById('packCount');if(pc)pc.textContent=iconPack.length; }
async function exportIconPack(){
  if(!iconPack.length){showToast('Add some icons first!',true);return;}
  const defs={};const fileExts={};const folderExts={};
  iconPack.forEach(ic=>{
    defs[ic.name]={iconPath:`./${ic.name}.png`};
    if(ic.cat==='file')fileExts[ic.ext]=ic.name;
    else if(ic.cat==='folder')folderExts[ic.ext]=ic.name;
  });
  const manifest={iconDefinitions:defs,file:iconPack[0]?.name||'default',folder:iconPack.find(i=>i.cat==='folder')?.name||'',fileExtensions:fileExts,folderNames:folderExts};
  dl('icon-theme.json',JSON.stringify(manifest,null,2));
  for(const ic of iconPack){
    const b64=ic.dataURL.split(',')[1];
    const binStr=atob(b64);const bytes=new Uint8Array(binStr.length);
    for(let i=0;i<binStr.length;i++)bytes[i]=binStr.charCodeAt(i);
    const blob=new Blob([bytes],{type:'image/png'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=`${ic.name}.png`;a.click();
    URL.revokeObjectURL(url);await new Promise(r=>setTimeout(r,200));
  }
  showToast(`Exported ${iconPack.length} icons!`);
}

// ════════════════════════════════════════════════════════════
// VS CODE SETTINGS
// ════════════════════════════════════════════════════════════
const settingsDefs={
  'Editor':[
    {key:'editor.fontSize',title:'Font Size',desc:'Font size in pixels.',type:'number',default:14,min:8,max:48},
    {key:'editor.fontFamily',title:'Font Family',desc:'Editor font family.',type:'select',options:['JetBrains Mono','Fira Code','Cascadia Code','Consolas','monospace'],default:'Consolas'},
    {key:'editor.fontLigatures',title:'Font Ligatures',desc:'Enable font ligatures.',type:'toggle',default:false},
    {key:'editor.tabSize',title:'Tab Size',desc:'Spaces per tab.',type:'number',default:4,min:1,max:16},
    {key:'editor.insertSpaces',title:'Insert Spaces',desc:'Use spaces instead of tabs.',type:'toggle',default:true},
    {key:'editor.wordWrap',title:'Word Wrap',desc:'How lines wrap.',type:'select',options:['off','on','wordWrapColumn','bounded'],default:'off'},
    {key:'editor.minimap.enabled',title:'Minimap',desc:'Show minimap.',type:'toggle',default:true},
    {key:'editor.lineNumbers',title:'Line Numbers',desc:'Line number display.',type:'select',options:['off','on','relative','interval'],default:'on'},
    {key:'editor.cursorStyle',title:'Cursor Style',desc:'Cursor shape.',type:'select',options:['block','block-outline','line','line-thin','underline'],default:'line'},
    {key:'editor.formatOnSave',title:'Format On Save',desc:'Auto-format on save.',type:'toggle',default:false},
    {key:'editor.bracketPairColorization.enabled',title:'Bracket Colorization',desc:'Colorize brackets.',type:'toggle',default:true},
    {key:'editor.stickyScroll.enabled',title:'Sticky Scroll',desc:'Sticky headers.',type:'toggle',default:true},
    {key:'editor.inlineSuggest.enabled',title:'Inline Suggest',desc:'Inline completions.',type:'toggle',default:true},
    {key:'editor.folding',title:'Folding',desc:'Code folding.',type:'toggle',default:true},
    {key:'editor.lineHeight',title:'Line Height',desc:'Line height (0=auto).',type:'range',default:0,min:0,max:100},
  ],
  'Workbench':[
    {key:'workbench.colorTheme',title:'Color Theme',desc:'Active color theme.',type:'text',default:'Default Dark+'},
    {key:'workbench.iconTheme',title:'Icon Theme',desc:'Active file icon theme.',type:'text',default:'vs-seti'},
    {key:'workbench.startupEditor',title:'Startup Editor',desc:'Editor at startup.',type:'select',options:['none','welcomePage','gettingStarted','readme'],default:'welcomePage'},
    {key:'workbench.sideBar.location',title:'Sidebar Position',desc:'Primary sidebar side.',type:'select',options:['left','right'],default:'left'},
    {key:'workbench.editor.showTabs',title:'Show Tabs',desc:'Tab visibility.',type:'select',options:['multiple','single','none'],default:'multiple'},
    {key:'workbench.statusBar.visible',title:'Status Bar',desc:'Show status bar.',type:'toggle',default:true},
    {key:'workbench.activityBar.visible',title:'Activity Bar',desc:'Show activity bar.',type:'toggle',default:true},
    {key:'workbench.tree.indent',title:'Tree Indent',desc:'File tree indentation.',type:'range',default:8,min:4,max:40},
  ],
  'Terminal':[
    {key:'terminal.integrated.fontSize',title:'Font Size',desc:'Terminal font size.',type:'number',default:14,min:8,max:32},
    {key:'terminal.integrated.fontFamily',title:'Font Family',desc:'Terminal font.',type:'text',default:"'JetBrains Mono', monospace"},
    {key:'terminal.integrated.cursorStyle',title:'Cursor Style',desc:'Terminal cursor.',type:'select',options:['block','underline','line'],default:'block'},
    {key:'terminal.integrated.scrollback',title:'Scrollback',desc:'Scrollback lines.',type:'number',default:1000,min:100,max:100000},
    {key:'terminal.integrated.copyOnSelection',title:'Copy on Select',desc:'Copy on selection.',type:'toggle',default:false},
  ],
  'Files':[
    {key:'files.autoSave',title:'Auto Save',desc:'Auto save editors.',type:'select',options:['off','afterDelay','onFocusChange','onWindowChange'],default:'off'},
    {key:'files.encoding',title:'Encoding',desc:'File character encoding.',type:'select',options:['utf8','utf8bom','utf16le','iso88591'],default:'utf8'},
    {key:'files.insertFinalNewline',title:'Final Newline',desc:'Insert newline at end.',type:'toggle',default:false},
    {key:'files.trimTrailingWhitespace',title:'Trim Whitespace',desc:'Remove trailing spaces.',type:'toggle',default:false},
  ],
  'Git':[
    {key:'git.enabled',title:'Git Enabled',desc:'Enable Git.',type:'toggle',default:true},
    {key:'git.autofetch',title:'Auto Fetch',desc:'Auto fetch remotes.',type:'toggle',default:false},
    {key:'git.confirmSync',title:'Confirm Sync',desc:'Confirm before sync.',type:'toggle',default:true},
    {key:'git.enableSmartCommit',title:'Smart Commit',desc:'Commit all when none staged.',type:'toggle',default:false},
    {key:'git.decorations.enabled',title:'Decorations',desc:'File tree status.',type:'toggle',default:true},
  ],
};

function initSettings(){
  Object.values(settingsDefs).flat().forEach(s=>{ if(!(s.key in settingsValues))settingsValues[s.key]=s.default; });
  renderSettingsNav();renderSettingsSection('Editor');updateSettingsJSON();
}
function renderSettingsNav(){
  const nav=document.getElementById('settingsNav');if(!nav)return;nav.innerHTML='';
  const icons={'Editor':'📝','Workbench':'🖥️','Terminal':'💻','Files':'📁','Git':'🔀'};
  Object.keys(settingsDefs).forEach((s,i)=>{
    const el=document.createElement('div');
    el.className='sni'+(i===0?' on':'');
    el.innerHTML=`<span class="si">${icons[s]||'⚙️'}</span>${s}`;
    el.onclick=()=>{ document.querySelectorAll('.sni').forEach(n=>n.classList.remove('on'));el.classList.add('on');renderSettingsSection(s); };
    nav.appendChild(el);
  });
}
function renderSettingsSection(section){
  const c=document.getElementById('settingsContent');if(!c)return;
  const defs=settingsDefs[section];
  c.innerHTML=`<div style="margin-bottom:20px"><div style="font-family:var(--disp);font-size:1.15rem;font-weight:800;margin-bottom:3px">${section} Settings</div><div style="font-family:var(--mono);font-size:.73rem;color:var(--mt)">Configure ${section.toLowerCase()} behavior.</div></div>`;
  defs.forEach(s=>{
    const card=document.createElement('div');card.className='scard';
    const val=settingsValues[s.key]!==undefined?settingsValues[s.key]:s.default;
    let ctrl='';
    if(s.type==='toggle') ctrl=`<div class="tog ${val?'on':''}" data-key="${s.key}" onclick="togSet(this)"></div>`;
    else if(s.type==='select') ctrl=`<select class="ssel" data-key="${s.key}" onchange="setSetting(this.dataset.key,this.value)">${s.options.map(o=>`<option${o==val?' selected':''}>${o}</option>`).join('')}</select>`;
    else if(s.type==='number') ctrl=`<input type="number" class="snum" data-key="${s.key}" value="${val}" min="${s.min||0}" max="${s.max||9999}" onchange="setSetting(this.dataset.key,+this.value)">`;
    else if(s.type==='range') ctrl=`<div class="rrow"><input type="range" class="srange" data-key="${s.key}" value="${val}" min="${s.min}" max="${s.max}" oninput="setSetting(this.dataset.key,+this.value);this.nextElementSibling.textContent=this.value"><span class="rval">${val}</span></div>`;
    else ctrl=`<input type="text" data-key="${s.key}" value="${val}" style="width:100%;margin-top:6px" onchange="setSetting(this.dataset.key,this.value)">`;
    const isRight=['toggle','select','number'].includes(s.type);
    card.innerHTML=`<div class="scard-t"><span>${s.title} <span class="skey">${s.key}</span></span>${isRight?`<div>${ctrl}</div>`:''}</div><div class="scard-d">${s.desc}</div>${!isRight?ctrl:''}`;
    c.appendChild(card);
  });
}
function togSet(el){ el.classList.toggle('on');settingsValues[el.dataset.key]=el.classList.contains('on');updateSettingsJSON(); }
function setSetting(k,v){ settingsValues[k]=v;updateSettingsJSON(); }
function resetSettings(){ settingsValues={};initSettings();showToast('Settings reset!'); }
function updateSettingsJSON(){
  const active={};
  Object.values(settingsDefs).flat().forEach(s=>{ if(settingsValues[s.key]!==undefined&&settingsValues[s.key]!==s.default)active[s.key]=settingsValues[s.key]; });
  const json=JSON.stringify(active,null,2);
  const jo=document.getElementById('jsonOut');if(!jo)return;
  jo.innerHTML=json.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"([^"]+)":/g,'<span class="prop">"$1"</span>:').replace(/: "([^"]*)"/g,': <span class="str">"$1"</span>').replace(/: (-?\d+\.?\d*)/g,': <span class="num">$1</span>').replace(/: (true|false|null)/g,': <span class="kw">$1</span>');
}
function copySettingsJSON(){
  const active={};
  Object.values(settingsDefs).flat().forEach(s=>{ if(settingsValues[s.key]!==undefined)active[s.key]=settingsValues[s.key]; });
  navigator.clipboard.writeText(JSON.stringify(active,null,2));showToast('settings.json copied!');
}
function downloadSettingsJSON(){
  const active={};
  Object.values(settingsDefs).flat().forEach(s=>{ if(settingsValues[s.key]!==undefined)active[s.key]=settingsValues[s.key]; });
  dl('settings.json',JSON.stringify(active,null,2));showToast('settings.json downloaded!');
}

// ════════════════════════════════════════════════════════════
// SNIPPET STUDIO
// ════════════════════════════════════════════════════════════
function initSnippets(){
  if(!snippets.length){
    snippets=[
      {name:'Console Log',prefix:'cl',scope:'javascript,typescript',desc:'Quick console.log',body:'console.log(${1:value});$0'},
      {name:'Arrow Function',prefix:'af',scope:'javascript,typescript',desc:'Arrow function',body:'const ${1:name} = (${2:params}) => {\n\t${3:// body}\n\t$0\n};'},
      {name:'Try/Catch',prefix:'tc',scope:'javascript,typescript',desc:'Try-catch block',body:'try {\n\t${1:// code}\n} catch (${2:error}) {\n\tconsole.error(${2:error});\n\t$0\n}'},
      {name:'VS Code Command',prefix:'vscmd',scope:'typescript',desc:'Register VS Code command',body:'const ${1:cmd} = vscode.commands.registerCommand(\'${2:ext}.${3:cmd}\', async () => {\n\t${4:// implementation}\n\t$0\n});\ncontext.subscriptions.push(${1:cmd});'},
    ];
  }
  renderSnippetList();updateSnippetPreview();
}
function renderSnippetList(){
  const list=document.getElementById('snippetList');if(!list)return;list.innerHTML='';
  const icons=['✂️','📝','🔧','💡','⚡','🎯','🔶','🔷'];
  snippets.forEach((s,i)=>{
    const el=document.createElement('div');
    el.className='snip-item'+(i===activeSnippetIdx?' on':'');
    el.innerHTML=`<div class="snip-icon">${icons[i%icons.length]}</div><div class="snip-info"><div class="snip-name">${s.name}</div><div class="snip-prefix">${s.prefix}</div></div>`;
    el.onclick=()=>{ activeSnippetIdx=i;renderSnippetList();renderSnippetForm(i); };
    list.appendChild(el);
  });
}
function renderSnippetForm(i){
  const s=snippets[i];
  const form=document.getElementById('snippetForm');if(!form)return;
  form.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h3 style="font-family:var(--disp);font-size:1.1rem;font-weight:700">Edit Snippet</h3>
      <button class="bsm warn" onclick="deleteSnippet(${i})">🗑️ Delete</button>
    </div>
    <div class="snip-row">
      <div class="snip-full"><label>Snippet Name</label><input type="text" value="${s.name}" oninput="updateSnippet(${i},'name',this.value)"></div>
    </div>
    <div class="snip-row">
      <div><label>Prefix (trigger)</label><input type="text" value="${s.prefix}" oninput="updateSnippet(${i},'prefix',this.value)"></div>
      <div><label>Language Scope</label><input type="text" value="${s.scope||''}" placeholder="javascript,typescript" oninput="updateSnippet(${i},'scope',this.value)"></div>
    </div>
    <label>Description</label><input type="text" value="${s.desc||''}" oninput="updateSnippet(${i},'desc',this.value)">
    <label style="margin-top:10px">Body (use \${1:placeholder}, \$0 for cursor)</label>
    <textarea class="code-area" oninput="updateSnippet(${i},'body',this.value)">${s.body||''}</textarea>
    <div style="margin-top:8px;padding:10px;background:var(--sf3);border-radius:5px">
      <div style="font-family:var(--mono);font-size:.65rem;color:var(--mt2);margin-bottom:5px">Reference</div>
      <div style="font-family:var(--mono);font-size:.72rem;color:var(--mt)">
        <code style="color:var(--a1)">\${1:text}</code> — tab stop &nbsp; <code style="color:var(--a1)">\$0</code> — final cursor
      </div>
    </div>`;
  updateSnippetPreview();
}
function updateSnippet(i,k,v){ snippets[i][k]=v;updateSnippetPreview(); }
function addSnippet(){
  snippets.push({name:'New Snippet',prefix:'ns',scope:'',desc:'',body:'${1:code}$0'});
  renderSnippetList();activeSnippetIdx=snippets.length-1;renderSnippetForm(activeSnippetIdx);renderSnippetList();
}
function deleteSnippet(i){
  snippets.splice(i,1);activeSnippetIdx=-1;renderSnippetList();
  const form=document.getElementById('snippetForm');
  if(form)form.innerHTML='<div style="text-align:center;padding:40px;font-family:var(--mono);color:var(--mt)">Select a snippet to edit</div>';
  updateSnippetPreview();
}
function updateSnippetPreview(){
  const out={};
  snippets.forEach(s=>{
    const key=s.name.toLowerCase().replace(/\s+/g,'_');
    const entry={prefix:s.prefix,body:s.body.split('\n'),description:s.desc};
    if(s.scope)entry.scope=s.scope;
    out[key]=entry;
  });
  const sp=document.getElementById('snippetPreview');if(sp)sp.textContent=JSON.stringify(out,null,2);
}
function exportSnippets(){
  const out={};
  snippets.forEach(s=>{ const k=s.name.toLowerCase().replace(/\s+/g,'_');const e={prefix:s.prefix,body:s.body.split('\n'),description:s.desc};if(s.scope)e.scope=s.scope;out[k]=e; });
  const lang=(snippets[0]?.scope||'').split(',')[0].trim()||'typescript';
  dl(`${lang}.code-snippets`,JSON.stringify(out,null,2));showToast(`Exported ${snippets.length} snippets!`);
}

// ════════════════════════════════════════════════════════════
// KEYBINDINGS EDITOR
// ════════════════════════════════════════════════════════════
function initKeybinds(){
  if(!keybinds.length){
    keybinds=[
      {command:'extension.helloWorld',key:'ctrl+shift+h',when:'editorFocus',category:'Extension'},
      {command:'workbench.action.showCommands',key:'ctrl+shift+p',when:'',category:'Workbench'},
      {command:'editor.action.formatDocument',key:'alt+shift+f',when:'editorHasDocumentFormattingProvider',category:'Editor'},
      {command:'editor.action.goToDeclaration',key:'f12',when:'editorHasDefinitionProvider',category:'Editor'},
      {command:'workbench.action.terminal.new',key:'ctrl+`',when:'',category:'Terminal'},
      {command:'editor.action.commentLine',key:'ctrl+/',when:'editorFocus',category:'Editor'},
      {command:'workbench.action.splitEditor',key:'ctrl+\\',when:'',category:'Workbench'},
    ];
  }
  renderKeybinds(keybinds);
}
function renderKeybinds(kbs){
  const tbody=document.getElementById('kbBody');if(!tbody)return;tbody.innerHTML='';
  kbs.forEach((kb,i)=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td><div class="kb-cmd">${kb.command}</div></td>
      <td><div class="kb-key"><input value="${kb.key}" style="width:120px" onchange="keybinds[${i}].key=this.value"></div></td>
      <td class="hidden md:table-cell"><div class="kb-when">${kb.when||'—'}</div></td>
      <td class="hidden sm:table-cell"><span class="kb-cat-badge">${kb.category}</span></td>
      <td><button class="bsm" style="color:var(--a5)" onclick="removeKeybind(${i})">✕</button></td>`;
    tbody.appendChild(tr);
  });
}
function filterKeybinds(q){
  const f=keybinds.filter(k=>k.command.toLowerCase().includes(q.toLowerCase())||k.key.toLowerCase().includes(q.toLowerCase()));
  renderKeybinds(f);
}
function addKeybind(){
  const cmd=prompt('Command ID (e.g. extension.myCommand):');
  const key=prompt('Key combo (e.g. ctrl+shift+k):');
  if(cmd&&key){ keybinds.push({command:cmd,key,when:'',category:'Custom'});renderKeybinds(keybinds);showToast('Keybinding added!'); }
}
function removeKeybind(i){ keybinds.splice(i,1);renderKeybinds(keybinds); }
function exportKeybinds(){
  const json=keybinds.map(k=>({key:k.key,command:k.command,...(k.when?{when:k.when}:{})}));
  dl('keybindings.json',JSON.stringify(json,null,2));showToast('keybindings.json exported!');
}

// ════════════════════════════════════════════════════════════
// CHANGELOG BUILDER
// ════════════════════════════════════════════════════════════
function initChangelog(){
  if(!changelog.length){
    const today=new Date().toISOString().split('T')[0];
    changelog=[{version:'0.1.0',date:today,type:'minor',changes:[{type:'add',text:'Initial release'},{type:'add',text:'Core extension features'}]}];
  }
  renderChangelogVersions();renderChangelogPreview();
}
function renderChangelogVersions(){
  const c=document.getElementById('changelogVersions');if(!c)return;c.innerHTML='';
  changelog.forEach((v,vi)=>{
    const card=document.createElement('div');card.className='ver-card';
    card.innerHTML=`
      <div class="ver-hdr">
        <input type="text" value="${v.version}" style="width:90px;font-size:.85rem;font-weight:700" onchange="changelog[${vi}].version=this.value;renderChangelogPreview()">
        <input type="date" value="${v.date}" style="width:130px;font-size:.72rem" onchange="changelog[${vi}].date=this.value;renderChangelogPreview()">
        <select class="ssel" style="font-size:.7rem;padding:3px 7px" onchange="changelog[${vi}].type=this.value;renderChangelogPreview()">
          <option ${v.type==='major'?'selected':''} value="major">Major</option>
          <option ${v.type==='minor'?'selected':''} value="minor">Minor</option>
          <option ${v.type==='patch'?'selected':''} value="patch">Patch</option>
        </select>
        <button class="bsm" style="color:var(--a5);margin-left:auto" onclick="removeVersion(${vi})">✕</button>
      </div>
      <div class="change-list" id="cl-${vi}">
        ${v.changes.map((ch,ci)=>`
          <div class="change-row">
            <select class="ssel" style="padding:3px 7px;font-size:.68rem;width:70px" onchange="changelog[${vi}].changes[${ci}].type=this.value;renderChangelogPreview()">
              <option ${ch.type==='add'?'selected':''} value="add">Add</option>
              <option ${ch.type==='fix'?'selected':''} value="fix">Fix</option>
              <option ${ch.type==='brk'?'selected':''} value="brk">Break</option>
              <option ${ch.type==='dep'?'selected':''} value="dep">Dep</option>
            </select>
            <input type="text" value="${ch.text}" style="flex:1;font-size:.75rem" onchange="changelog[${vi}].changes[${ci}].text=this.value;renderChangelogPreview()">
            <button class="bsm" onclick="removeChange(${vi},${ci})">×</button>
          </div>`).join('')}
      </div>
      <button class="badd" onclick="addChange(${vi})">+ Add Change</button>`;
    c.appendChild(card);
  });
}
function renderChangelogPreview(){
  const md=changelog.map(v=>{
    const type={'major':'💥 MAJOR','minor':'✨ Minor','patch':'🔧 Patch'}[v.type]||'';
    const changes=v.changes.map(ch=>{
      const t={'add':'➕','fix':'🔧','brk':'💥','dep':'📦'}[ch.type]||'•';
      return `- ${t} ${ch.text}`;
    }).join('\n');
    return `## [${v.version}] — ${v.date} \`${type}\`\n${changes}`;
  }).join('\n\n');
  const cp=document.getElementById('changelogPreview');if(!cp)return;
  cp.innerHTML='<h2 style="font-size:1rem;margin-bottom:12px;color:var(--bright)">CHANGELOG</h2>'+
    md.replace(/## \[([^\]]+)\] — ([^\n]+)/g,'<h2 style="font-size:.85rem;color:#60a5fa;margin:14px 0 5px">[[$1]] — $2</h2>')
      .replace(/- ➕/g,'- <span style="color:var(--a2)">➕</span>')
      .replace(/- 🔧/g,'- <span style="color:var(--a3)">🔧</span>')
      .replace(/- 💥/g,'- <span style="color:var(--a5)">💥</span>')
      .replace(/- 📦/g,'- <span style="color:var(--a4)">📦</span>')
      .replace(/\n/g,'<br>');
}
function addVersion(){ const today=new Date().toISOString().split('T')[0];changelog.unshift({version:'0.0.1',date:today,type:'patch',changes:[{type:'fix',text:'Bug fix'}]});renderChangelogVersions();renderChangelogPreview(); }
function removeVersion(i){ changelog.splice(i,1);renderChangelogVersions();renderChangelogPreview(); }
function addChange(vi){ changelog[vi].changes.push({type:'add',text:'New feature'});renderChangelogVersions();renderChangelogPreview(); }
function removeChange(vi,ci){ changelog[vi].changes.splice(ci,1);renderChangelogVersions();renderChangelogPreview(); }
function exportChangelog(){
  const md='# CHANGELOG\n\nAll notable changes documented here.\n\n'+
    changelog.map(v=>{
      const label={'major':'BREAKING CHANGE','minor':'Feature','patch':'Bug Fix'}[v.type]||'';
      return `## [${v.version}] - ${v.date}\n### ${label}\n${v.changes.map(ch=>`- ${ch.text}`).join('\n')}`;
    }).join('\n\n');
  dl('CHANGELOG.md',md);showToast('CHANGELOG.md exported!');
}

// ════════════════════════════════════════════════════════════
// PUBLISH WIZARD
// ════════════════════════════════════════════════════════════
function initPublish(){
  const steps=[
    {done:true,t:'Create Azure DevOps Account',b:'Visit <a href="https://dev.azure.com" target="_blank" style="color:var(--a1)">dev.azure.com</a> and create a free account. Generate a Personal Access Token under Marketplace → Publish.',cmd:null,checks:['Azure DevOps account created','Personal Access Token generated']},
    {done:false,t:'Install vsce CLI',b:'Install the VS Code Extension Manager globally:',cmd:'npm install -g @vscode/vsce',checks:['vsce installed successfully']},
    {done:false,t:'Create Publisher',b:'Create your publisher profile:',cmd:'vsce create-publisher myname',checks:['Publisher ID matches package.json','Publisher profile created']},
    {done:false,t:'Package Extension',b:'Create a .vsix distribution file:',cmd:'vsce package',checks:['Version bumped','CHANGELOG updated','README complete','Screenshot added']},
    {done:false,t:'Test Locally',b:'Install and test your .vsix:',cmd:'code --install-extension my-extension-0.1.0.vsix',checks:['Extension loads correctly','All commands work','No console errors']},
    {done:false,t:'Publish',b:"Publish to the marketplace:",cmd:'vsce publish',checks:['Extension visible on marketplace','Metadata verified']},
    {done:false,t:'Add Marketplace Badge',b:'Add a badge to your README:',cmd:'[![VS Code](https://vsmarketplacebadges.dev/version/publisher.name.svg)](https://marketplace.visualstudio.com/items?itemName=publisher.name)',checks:['Badge added','GitHub repo linked']},
  ];
  const progress=steps.filter(s=>s.done).length/steps.length*100;
  const wizard=document.getElementById('publishWizard');if(!wizard)return;
  wizard.innerHTML=`
    <h2 style="font-family:var(--disp);font-size:1.35rem;font-weight:800;margin-bottom:6px">🚀 Publish Wizard</h2>
    <p style="font-family:var(--mono);font-size:.76rem;color:var(--mt);margin-bottom:16px">Follow these steps to publish your extension to the VS Code Marketplace.</p>
    <div class="pw-progress"><div class="pw-progress-fill" id="pwprog" style="width:${progress}%"></div></div>
    ${steps.map((s,i)=>`
      <div class="pw-step">
        <div class="pw-step-hdr">
          <div class="pw-num ${s.done?'done':i===0?'active':'pend'}">${s.done?'✓':i+1}</div>
          <div class="pw-title">${s.t}</div>
        </div>
        <div class="pw-body">${s.b}
          ${s.cmd?`<div class="pw-cmd"><code>${s.cmd.replace(/</g,'&lt;')}</code><button class="bsm" onclick="copyText('${s.cmd.replace(/'/g,"\\'")}')">Copy</button></div>`:''}
          ${s.checks.map(c=>`<label class="pw-check"><input type="checkbox" onchange="updatePublishProgress()"> <span>${c}</span></label>`).join('')}
        </div>
      </div>`).join('')}`;
}
function updatePublishProgress(){
  const all=document.querySelectorAll('#publishWizard input[type=checkbox]');
  const done=[...all].filter(c=>c.checked).length;
  const pct=(done/all.length)*100;
  const bar=document.getElementById('pwprog');if(bar)bar.style.width=pct+'%';
  if(pct===100)showToast('🎉 All steps complete! Extension published!');
}

// ════════════════════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════════════════════
function dl(filename, content){
  const blob=new Blob([content],{type:'text/plain'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=filename;a.click();
  URL.revokeObjectURL(url);
}
function copyText(text){ navigator.clipboard.writeText(text);showToast('Copied!'); }
function setStatus(msg){ const sb=document.getElementById('sbStatus');if(sb)sb.textContent=msg; }
let toastT;
function showToast(msg, isErr=false){
  const t=document.getElementById('toast');
  const tm=document.getElementById('toastMsg');
  if(!t||!tm)return;
  tm.textContent=msg;
  t.className='toast show'+(isErr?' err':'');
  clearTimeout(toastT);
  toastT=setTimeout(()=>t.classList.remove('show'),3200);
}

// ════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded',()=>{
  buildGuideSteps(null);
  setStatus('Ready');
});
