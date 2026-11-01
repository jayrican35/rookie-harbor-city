'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../published-game-capture/v116-marina-hud.js'),'utf8');
assert(!/localStorage|\.choose\(|profiles.*\.save\(|fetch\(|MAPS\./.test(source),'HUD must not modify profiles, campaign state or network');
let profile='jay',closed=0,profileOpens=0,gearOpens=0,mapOpens=0,ready;
function element(){return {hidden:true,children:[],textContent:'',innerText:'',src:'',dataset:{},style:{},events:{},classList:{toggle(){}},focus(){},appendChild(e){this.children.push(e);},addEventListener(k,f){this.events[k]=f;}};}
const nodes={};for(const s of ['.v116-panel','canvas','.v116-identity','.v116-identity img','.v116-identity strong','.v116-identity small','.v116-minimap','.v116-case','.v116-panel-close','h2','.v116-panel-body'])nodes[s]=element();
const actions=['case','map','gear','team'].map(a=>({...element(),dataset:{action:a}}));const profiles=['jay','rosa','kaleb','gigi','lingling'].map(a=>({...element(),dataset:{profile:a}}));
const g={clearRect(){},fillRect(){},beginPath(){},arc(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){}};
nodes.canvas.getContext=()=>g;
function query(s){if(s.startsWith('[data-action='))return actions.find(a=>s.includes(a.dataset.action));return nodes[s];}
const root={...element(),querySelector:query,querySelectorAll:s=>s==='[data-action]'?actions:profiles};nodes['.v116-panel'].querySelector=query;
const campus=element(),objective={innerText:'Talk to Sergeant Brooks in Briefing'};
const document={readyState:'loading',addEventListener(k,f){ready=f;},createElement:tag=>tag==='div'&&!document.created?(document.created=true,root):element(),getElementById:id=>id==='v115Campus'?campus:id==='btnMap'?{click(){mapOpens++;}}:id==='btnInv'?{click(){gearOpens++;}}:null,querySelector:()=>objective};
const window={HARBOR:{seamlessCampusV115:{close(){closed++;}},profiles:{current:()=>profile,open(){profileOpens++;}}},ROOKIE_V116_MARINA:{objects:[],inMarina:()=>true,metrics:()=>({decoded:0,assets:21})}};
vm.runInNewContext(source,{window,document,Math,Object});ready();
const api=window.ROOKIE_V116_HUD;assert(api);assert(!api.blocked());
actions[0].onclick();assert(api.blocked());assert.equal(nodes['.v116-panel-body'].children[1].textContent,objective.innerText);nodes['.v116-panel-close'].onclick();assert(!api.blocked());
actions[1].onclick();assert(api.blocked());nodes['.v116-panel-body'].children.at(-1).onclick();assert.equal(mapOpens,1);assert.equal(closed,1);api.close();
actions[2].onclick();assert.equal(gearOpens,1);assert.equal(closed,2);
actions[3].onclick();assert.equal(profileOpens,1);assert.equal(closed,3);
api.paint({x:5150,y:3720},1000);assert.equal(nodes['.v116-identity strong'].textContent,'JAY');profile='rosa';api.paint({x:5160,y:3720},1200);assert.equal(nodes['.v116-identity strong'].textContent,'ROSA');assert(nodes['.v116-identity img'].src.endsWith('rosa-portrait.webp'));
console.log('PASS marina HUD: live profile identity, objective readout, panel blocking, map/gear/profile actions, no direct campaign/save mutation');
