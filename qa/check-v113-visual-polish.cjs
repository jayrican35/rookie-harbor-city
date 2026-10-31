/* V113 visual pass smoke/regression checks, Node 20+. No game source edits. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..', 'published-game-capture');
const html = fs.readFileSync(path.join(root, 'index.html'),'utf8');
const addon = fs.readFileSync(path.join(root, 'visual-polish-v113.js'),'utf8');
const css = fs.readFileSync(path.join(root, 'visual-polish-v113.css'),'utf8');
assert(html.includes('<script src="./game.js"></script>'));
assert(html.includes('<script src="./visual-polish-v113.js"></script>'));
assert(html.includes('<link rel="stylesheet" href="./visual-polish-v113.css" />'));
assert(html.indexOf('<script src="./game.js"></script>') < html.indexOf('<script src="./visual-polish-v113.js"></script>'));
assert(css.includes('#familySelect'));
// Academy/Outbreak styles must never be selected by V113 CSS.
assert(!/outbreak|zombie|academy|trainingTools|trainingReload|tacticalCamera/i.test(css.replace(/\/\*[\s\S]*?\*\//g,'')));
const calls={person:[],ped:[],room:0,ground:0,rect:0,image:0};
const brush={
 save(){},restore(){},beginPath(){},ellipse(){},stroke(){},fill(){},
 translate(){},scale(){},arc(){},addColorStop(){},fillRect(){calls.rect++;},
 drawImage(){calls.image++;},
 createLinearGradient(){return {addColorStop(){}};},
 createRadialGradient(){return {addColorStop(){}};},
 set strokeStyle(v){}, set fillStyle(v){},
 set lineWidth(v){}, set globalCompositeOperation(v){}
};
const sandbox={
 window:{HARBOR:{academy:{active:()=>false}}},
 document:{createElement:()=>({width:0,height:0,getContext:()=>brush})},
 state:{map:'station'},ctx:brush,Math,Number,console,
 drawPerson:(...a)=>calls.person.push(a),
 drawPedFigure:(...a)=>calls.ped.push(a),
 drawRoom:()=>{calls.room++;},
 drawCityGround:()=>{calls.ground++;}
};
vm.createContext(sandbox);
vm.runInContext(addon,sandbox,{filename:'visual-polish-v113.js'});
assert.equal(sandbox.window.HARBOR.visualPolishV113.version,'113-main-visual-pass-1');
const person=['x',0,'#112233',false,'JAY','down',true,false,2,8];
sandbox.drawPerson(...person);
assert.equal(calls.person.at(-1)[8],1.1,'Main campaign bob should be calmer');
assert(Math.abs(calls.person.at(-1)[9]-6.16)<.00001,'Main campaign gait should slow');
const pd=[15,17,{},'VISITOR','down',4,8,false];
sandbox.drawPedFigure(...pd);
assert.equal(calls.ped.at(-1)[5],2.2);
sandbox.drawRoom({label:'LOBBY',y:100,x:100,w:400,h:300});
assert.equal(calls.room,1);
assert(calls.rect>0,'Tint overlay should draw');
sandbox.state.map='training';
const rectBefore=calls.rect, imageBefore=calls.image;
sandbox.drawPerson(...person);sandbox.drawPedFigure(...pd);
sandbox.drawRoom({label:'LOBBY',y:100,x:100,w:400,h:300});
sandbox.drawCityGround(20);
assert.equal(calls.person.at(-1)[8],person[8],'Training animation remains identical');
assert.equal(calls.person.at(-1)[9],person[9],'Training gait remains identical');
assert.equal(calls.ped.at(-1)[6],pd[6],'Training NPC gait remains identical');
assert.equal(calls.rect,rectBefore,'Training has no additional lighting');
assert.equal(calls.image,imageBefore,'Training has no additional light pools');
sandbox.state.map='plaza';
sandbox.drawCityGround(20);
assert.equal(calls.image,imageBefore+2,'Only two entrance lights on plaza');
sandbox.state.map='warehouse';
sandbox.drawPerson(...person);
assert.equal(calls.person.at(-1)[8],person[8],'Warehouse combat untouched');
sandbox.window.HARBOR.visualPolishV113.setEnabled(false);
sandbox.state.map='station';
sandbox.drawPerson(...person);
assert.equal(calls.person.at(-1)[9],person[9],'Visual pass can be disabled without reload');
console.log('V113 visual QA passed: normal campaign, training, combat, light pools and disabled fallback');
