'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = 'published-game-capture/';
const source = fs.readFileSync(root+'precinct-cruiser.compiled.js','utf8');
const start = source.indexOf('const controllerFactory=')+'const controllerFactory='.length;
const end = source.indexOf('function valid(v)',start);
const factory = vm.runInNewContext('('+source.slice(start,end).trim().replace(/;$/,'')+')');
const window = {};
vm.runInNewContext(fs.readFileSync(root+'wild-arcade-collisions.js','utf8'),{window,performance,matchMedia:()=>({matches:false})});
const results = [];
for(const hz of [30,60,120]){
  const car = {id:'unit',kind:'patrol',length:96,width:48,driving:true,angle:0,x:0,y:0,speed:0,engine:true};
  const keys = {up:true};
  const update = factory(car,keys,{},()=>false,()=>{},()=>{});
  const run = seconds => {
    for(let i=0;i<Math.round(seconds*hz);i++){
      for(let j=0;j<120/hz;j++)update(1/120,0);
      assert(Number.isFinite(car.x+car.y+car.speed+car.angle+car.driveVelocityX+car.driveVelocityY));
    }
  };
  run(3);assert.equal(car.speed,265);
  keys.performance=true;run(.2);assert(car.speed>265&&car.speed<350);
  run(2);const boosted=car.speed;assert(Math.abs(boosted-429.3)<.001);
  keys.performance=false;run(.2);assert(car.speed>265&&car.speed<boosted);
  run(2.2);assert.equal(car.speed,265);
  Object.assign(car,{angle:0,x:0,y:0,speed:0,driveVelocityX:0,driveVelocityY:0});
  keys.performance=keys.handbrake=true;
  run(1);assert(car.burnout&&Math.hypot(car.x,car.y)<1);
  assert(car.rearWheelSlip>.95&&car.rearWheelSpeed>150);
  keys.handbrake=false;run(.3);assert(!car.burnout&&car.speed>35&&car.speed<100);
  run(3);keys.performance=keys.up=false;keys.handbrake=keys.right=true;
  run(.72);assert(car.angle>1.3&&car.angle<1.95&&Math.abs(car.slipAngle)>.4);
  const corner={angle:car.angle,slip:car.slipAngle};
  const target={id:'traffic',kind:'civilian',x:car.x+66,y:car.y,angle:0,length:86,width:38,velocity:0};
  const drifting={...car};
  const solver=window.ROOKIE_WILD_ARCADE.create({unit:()=>drifting,fleet:()=>[target],blocked:()=>false});
  solver.step(1/120);
  const impact=solver.inspect().events[0];assert(impact,'Sliding car still hits civilian traffic');
  const incoming=impact.before[impact.a==='unit'?'a':'b'];
  assert(Math.abs(incoming[1]-car.driveVelocityY)<1e-6,'Solver receives actual lateral velocity');
  for(let i=0;i<hz*2&&car.angle<Math.PI;i++)run(1/hz);
  assert(car.angle>=Math.PI&&car.angle<Math.PI+.12,'High-speed handbrake U-turn reaches opposite heading');
  const uturn=car.angle;
  keys.handbrake=keys.right=false;keys.left=keys.up=true;
  run(1.1);assert(Math.abs(car.slipAngle)<.1&&!car.drifting&&car.speed>55);
  results.push({hz,cruise:265,boosted,cornerDegrees:corner.angle*180/Math.PI,slipDegrees:corner.slip*180/Math.PI,uTurnDegrees:uturn*180/Math.PI,recoveredSpeed:car.speed});
  const cornerCar={x:0,y:0,angle:0,speed:210,engine:true};
  const cornerInput={performance:true,right:true};
  const powerTurn=factory(cornerCar,cornerInput,{},()=>false,()=>{},()=>{});
  for(let i=0;i<90;i++)powerTurn(1/120,0);
  assert(cornerCar.rearWheelSlip>.55&&cornerCar.drifting&&cornerCar.angle>.75);
  cornerInput.performance=cornerInput.right=false;
  for(let i=0;i<120;i++)powerTurn(1/120,0);
  assert(cornerCar.rearWheelSlip<.02&&!cornerCar.drifting);
}
console.table(results);
// Two diagonally aligned vehicles can share an unprojected rectangle
// while leaving a visible gap between the projected ground footprints.
const scale=.6268256892,angle=-Math.PI/4;
const cruiser={kind:'patrol',x:0,y:0,angle,length:96,width:48};
const pickup={kind:'delivery',x:0,y:0,angle,length:95,width:38};
window.ROOKIE_V135_WALL_KIT={trafficGroundScale:()=>scale};
function position(forward,side){
  pickup.x=forward*Math.cos(angle)-side*Math.sin(angle);
  pickup.y=scale*(forward*Math.sin(angle)+side*Math.cos(angle));
}
position(98,0);assert.equal(window.ROOKIE_WILD_ARCADE.contact(cruiser,pickup),null);
position(94,0);assert(window.ROOKIE_WILD_ARCADE.contact(cruiser,pickup));
position(0,45);assert.equal(window.ROOKIE_WILD_ARCADE.contact(cruiser,pickup),null);
position(0,41);assert(window.ROOKIE_WILD_ARCADE.contact(cruiser,pickup));
console.log('PASS projected diagonal bumper and side gaps, plus direct contact');
