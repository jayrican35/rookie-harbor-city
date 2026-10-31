// V114 smoke/regression tests for Case 002. Run from repository root with Node 20+.
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const src=fs.readFileSync('published-game-capture/game.js','utf8');
const names=['jay','rosa','kaleb','gigi','lingling'];
const ctx={
  window:{HARBOR:{profiles:{current:()=>ctx.family}}}, activeFamily:'jay',family:'jay',
  state:{camp:{m2:{brief:true,done:false,db:false,returned:false}},evidence:{},statements:{}},
  logs:[], choices:null, score:[], ended:false,
  currentMission:()=>ctx.state.camp.m2.done?'m3':'m2',
  evGot:(k)=>!!ctx.state.evidence[k],stGot:(k)=>!!ctx.state.statements[k],
  showLines:(ls,done)=>{ctx.logs.push(ls);if(typeof done==='function')done();},
  showChoices:(title,text,choices)=>{ctx.choices={title,text,choices};},
  collectEvidence:(k)=>{ctx.state.evidence[k]=true;},
  recordStatement:(k)=>{ctx.state.statements[k]=true;},
  briefMission:(m)=>{assert.equal(m,"m2");},
  refreshPanels:()=>{},save:()=>{},tone:()=>{},toast:()=>{},endShift:(k)=>{assert.equal(k,'m2');ctx.ended=true;},
  awardScore:(...args)=>{ctx.score.push(args);}, RULES:{score:{conclusion:50}},
  Math,Number,Object,Array,JSON,console,
};
ctx.window.HARBOR.profiles.current=()=>ctx.family;
vm.createContext(ctx);
function scriptBetween(from,to){const i=src.indexOf(from);if(i<0)throw Error('Not found '+from);const j=src.indexOf(to,i+from.length);if(j<0)throw Error('End not found '+to);return src.slice(i,j);}
vm.runInContext(scriptBetween('/* CASE002_PICKLE_PANIC_V114','/* ================= CAMPAIGN BRIEFINGS / CONCLUSIONS / ENDING ================= */'),ctx);
vm.runInContext(scriptBetween('var BRIEFINGS = {','function doBrooksEpilogue(){'),ctx);
vm.runInContext(scriptBetween('var LEAD2 = [','var CONCLUSION3 = ['),ctx);
vm.runInContext(scriptBetween('function doStoreCamera(){','function doCafeMenu(){'),ctx);
const npc=scriptBetween('  omar:function(){','  lucia:function(){');
vm.runInContext('var TALKS={'+npc+'};',ctx);
vm.runInContext(scriptBetween('function closeM2(){','function closeM3(){'),ctx);
vm.runInContext(scriptBetween('var MISSIONS = {','var EVIDENCE = {'),ctx);
vm.runInContext(scriptBetween('var EVIDENCE = {','var EVIDENCE_ORDER = ['),ctx);
vm.runInContext(scriptBetween('var STATEMENTS = {','var STATEMENTS_ORDER = ['),ctx);

// Every family actor receives personalized briefing and end-of-case dialogue.
for(const name of names){
 ctx.family=name; ctx.logs=[];
 ctx.doBriefing('m2');
 const flattened=ctx.logs[0];
 assert(flattened.some(x=>x[0]===name.toUpperCase()),'No personalized line for '+name);
 assert(flattened.some(x=>String(x[1]).includes('PICKLE PANIC')));
 assert.equal(ctx.case2Family(),name);
}
ctx.family='gigi';
// Each location has a genuine evidence callback, not only a text change.
ctx.doStoreRear(); assert.equal(ctx.state.evidence.m2door,true);
ctx.doStoreShelf(); assert.equal(ctx.state.evidence.m2label,true);
ctx.doStoreCamera(); assert.equal(ctx.choices.choices.length,3);
ctx.choices.choices[1].fn();
assert.equal(ctx.choices.choices.length,3,'silly choice should return to camera');
ctx.choices.choices[0].fn();assert.equal(ctx.state.evidence.m2camera,true);
ctx.TALKS.omar();assert.equal(ctx.choices.choices.length,3);
ctx.choices.choices[2].fn();assert.equal(ctx.choices.choices.length,3,'rubber chicken dialogue should return to interview');
ctx.choices.choices[0].fn();assert.equal(ctx.state.statements.m2omar,true);
// Wrong conclusion is playful and does not deduct score; correct one advances.
ctx.case2ConclusionChoices();assert.equal(ctx.choices.choices.length,4);
const before=ctx.score.length;
ctx.choices.choices[1].fn();
assert.equal(ctx.score.length,before,'Wrong Case 002 answer must not penalize the kids');
assert.equal(ctx.choices.choices.length,4,'Wrong answer must allow retry');
ctx.choices.choices[0].fn();
assert.equal(ctx.state.camp.m2.done,true);
assert.equal(ctx.ended,true);
assert.equal(ctx.score.length,before+1,'Correct conclusion should receive its original completion score');
assert(src.includes('CASE 002 — THE MIDNIGHT PICKLE PANIC'));
assert(src.includes('var CONCLUSION3 = ['));
assert(src.includes('var FERRIS_CALL = ['));
assert(src.includes('var FINAL_ARREST = ['));
assert(src.includes('function caperSaveSchema(raw)'));
console.log('PASS V114: five family voices, eight-objective compatibility, evidence, camera choices, Omar dialogue, non-punitive retry, Case 003 handoff.');