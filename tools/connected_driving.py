"""Refine the connected binding, retaining the canonical impact/exit pipeline."""
from pathlib import Path
import json

def handling_config():
    config = json.loads((Path(__file__).resolve().parents[1] / 'published-game-capture/vehicle-handling.json').read_text('utf-8'))
    assert all(isinstance(v, (int, float)) and v > 0 for v in config.values())
    assert 0 < config['accelerationRolloff'] < 1
    assert config['emergencyBrake'] >= config['serviceBrake']
    assert config['normalLateralGrip'] >= config['slidingLateralGrip']
    assert config['driftDemandFull'] > config['driftDemandStart']
    assert 0 < config['driftingSlipAngle'] < config['maxSlipAngle'] < 1
    return config
def refine_controller(source):
    token = '  var previousAngle=car.angle;'
    assert source.count(token) == 1
    source = source.replace(token, token + '''
  // World velocity survives heading changes. A scalar speed adjustment by
  // the existing impact bridge changes only its longitudinal component.
  var oldCos=Math.cos(previousAngle),oldSin=Math.sin(previousAngle);
  var driveVX=Number.isFinite(car.driveVelocityX)?car.driveVelocityX:oldCos*car.speed;
  var driveVY=Number.isFinite(car.driveVelocityY)?car.driveVelocityY:oldSin*car.speed;
  var longitudinalCorrection=car.speed-(driveVX*oldCos+driveVY*oldSin);
  driveVX+=oldCos*longitudinalCorrection;driveVY+=oldSin*longitudinalCorrection;
''', 1)
    a = source.index('  /* steering:')
    b = source.index('  if(carReboundTime>0)', a)
    source = source[:a] + '''  // Connected Sporty Arcade steering: continuous signed speed, reduced
  // high-speed yaw and a short input response. No stationary rotation.
  var steer = (right ? 1 : 0) - (left ? 1 : 0);
  connectedSteer += (steer-connectedSteer)*(1-Math.exp(-dt/HANDLING.steeringResponseSeconds));
  if(Math.abs(car.speed)>HANDLING.steeringMinSpeed){
    var yaw=car.speed/HANDLING.steeringLength/(1+Math.pow(Math.abs(car.speed)/HANDLING.steeringSpeedKnee,HANDLING.steeringSpeedExponent));
    car.angle += connectedSteer*Math.max(-HANDLING.maxYawRate,Math.min(HANDLING.maxYawRate,yaw))*dt;
  }
''' + source[b:]
    a = source.index('  if(gas){ car.speed +=')
    b = source.index('  car.wheelPhase', a)
    source = source[:a] + '''  // The existing impact solver owns velocity/translation during contact.
  var impactOwned=!!car.impactState,driveCos=Math.cos(car.angle),driveSin=Math.sin(car.angle);
  if(!impactOwned)car.speed=driveVX*driveCos+driveVY*driveSin;
  // One mutually exclusive longitudinal integration per substep.
  var stop=!!(driveKeys.brake || window.__carSpace);
  if(carReboundTime>0){gas=false;brk=false;}
  if(stop){
    car.speed=Math.sign(car.speed)*Math.max(0,Math.abs(car.speed)-HANDLING.emergencyBrake*dt) || 0;
  }else if(brk){
    car.speed=car.speed>0?Math.max(0,car.speed-HANDLING.serviceBrake*dt):Math.max(CAR_REV,car.speed-HANDLING.reverseAcceleration*dt);
  }else if(gas){
    if(car.speed<0)car.speed=Math.min(0,car.speed+HANDLING.reverseToForwardBrake*dt);
    else {var rolloff=HANDLING.accelerationRolloff,drag=HANDLING.acceleration*rolloff/CAR_MAX;car.speed=CAR_MAX/rolloff+(car.speed-CAR_MAX/rolloff)*Math.exp(-drag*dt);}
  }else{
    car.speed=Math.sign(car.speed)*Math.max(0,Math.abs(car.speed)-HANDLING.coastDeceleration*dt) || 0;
  }
  car.speed=Math.max(CAR_REV,Math.min(CAR_MAX,car.speed));
  if(!impactOwned){
    var lateral=-driveVX*driveSin+driveVY*driveCos,absSpeed=Math.abs(car.speed);
    var yawRate=dt?(car.angle-previousAngle)/dt:0;
    var countersteer=steer*lateral>HANDLING.countersteerMinLateralSpeed;
    car.tractionRecovery=countersteer?HANDLING.countersteerRecoverySeconds:Math.max(0,(car.tractionRecovery||0)-dt);
    var speedLoad=Math.max(0,Math.min(1,(absSpeed-HANDLING.driftSpeedThreshold)/HANDLING.driftSpeedFade));
    var cornerLoad=Math.max(0,Math.min(1,(Math.abs(yawRate)*absSpeed-HANDLING.driftDemandStart)/(HANDLING.driftDemandFull-HANDLING.driftDemandStart)));
    var targetLoss=speedLoad*Math.max(cornerLoad,stop?HANDLING.handbrakeGripLoss*Math.abs(connectedSteer):0);
    if(car.tractionRecovery>0)targetLoss=0;
    var loss=car.tractionLoss||0,response=targetLoss>loss?HANDLING.gripLossResponse:HANDLING.gripRecoveryResponse;
    loss+=(targetLoss-loss)*(1-Math.exp(-response*dt));
    var grip=HANDLING.normalLateralGrip+(HANDLING.slidingLateralGrip-HANDLING.normalLateralGrip)*loss;
    if(car.tractionRecovery>0)grip=Math.max(grip,HANDLING.countersteerGrip);
    lateral*=Math.exp(-grip*dt);
    var limit=Math.max(absSpeed,HANDLING.driftSpeedFade)*Math.tan(HANDLING.maxSlipAngle);
    lateral=Math.max(-limit,Math.min(limit,lateral));
    car.speed=Math.sign(car.speed)*Math.max(0,absSpeed-HANDLING.driftDeceleration*loss*Math.min(1,Math.abs(lateral)/Math.max(absSpeed,1))*dt);
    var total=Math.hypot(car.speed,lateral),cap=car.speed<0?-CAR_REV:CAR_MAX;
    if(total>cap){car.speed*=cap/total;lateral*=cap/total;}
    car.driveVelocityX=car.speed*driveCos-lateral*driveSin;
    car.driveVelocityY=car.speed*driveSin+lateral*driveCos;
    car.lateralSpeed=lateral;car.slipAngle=Math.atan2(lateral,Math.max(Math.abs(car.speed),1));
    car.tractionLoss=loss;car.lateralGrip=grip;
    car.drifting=Math.abs(car.slipAngle)>HANDLING.driftingSlipAngle&&total>HANDLING.driftSpeedThreshold&&loss>.1;
  }
''' + source[b:]
    token = '''  if(car.speed !== 0){
    var nx = car.x + Math.cos(car.angle) * car.speed * dt;
    var ny = car.y + Math.sin(car.angle) * car.speed * dt;'''
    assert source.count(token) == 1
    source = source.replace(token, '''  if(car.speed !== 0 || Math.abs(car.lateralSpeed||0)>.01){
    var nx = car.x + (impactOwned?Math.cos(car.angle)*car.speed:car.driveVelocityX)*dt;
    var ny = car.y + (impactOwned?Math.sin(car.angle)*car.speed:car.driveVelocityY)*dt;''', 1)
    token = '      carReboundTime=.22;'
    assert source.count(token) == 1
    source = source.replace(token, token + '''
      car.driveVelocityX=Math.cos(car.angle)*car.speed;car.driveVelocityY=Math.sin(car.angle)*car.speed;
      car.lateralSpeed=car.slipAngle=car.tractionLoss=car.tractionRecovery=0;car.drifting=false;
''', 1)
    return ('const HANDLING=Object.freeze(' + json.dumps(handling_config(), separators=(',', ':')) + ');\n'
            'const CAR_MAX=HANDLING.maxSpeed,CAR_REV=-HANDLING.reverseSpeed;\n'
            'var connectedSteer=0;\n' + source)

def controller_factory(engine):
    start = engine.index('var carReboundTime=0;')
    end = engine.index('function updateDriveUI()', start)
    return '''function(car,keys,window,carCollidesAt,saveThrottled,feedback){
const driveKeys={},document={getElementById:()=>null},AC=null,traffic=[];
const syncPlayerToCar=()=>{},checkCarExits=()=>{},perfCollision=feedback,tone=()=>{},toast=()=>{};
''' + refine_controller(engine[start:end]) + '\nreturn updateCar;}'
