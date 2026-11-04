"""Refine the connected binding, retaining the canonical impact/exit pipeline."""
def refine_controller(source):
    a = source.index('  /* steering:')
    b = source.index('  if(carReboundTime>0)', a)
    source = source[:a] + '''  // Connected Sporty Arcade steering: continuous signed speed, reduced
  // high-speed yaw and a short input response. No stationary rotation.
  var steer = (right ? 1 : 0) - (left ? 1 : 0);
  connectedSteer += (steer-connectedSteer)*(1-Math.exp(-dt/.10));
  if(Math.abs(car.speed)>.5){
    var yaw=car.speed/48/(1+Math.pow(Math.abs(car.speed)/115,1.8));
    car.angle += connectedSteer*Math.max(-1.2,Math.min(1.2,yaw))*dt;
  }
''' + source[b:]
    a = source.index('  if(gas){ car.speed +=')
    b = source.index('  car.wheelPhase', a)
    source = source[:a] + '''  // One mutually exclusive longitudinal integration per substep.
  var stop=!!(driveKeys.brake || window.__carSpace);
  if(carReboundTime>0){gas=false;brk=false;}
  if(stop){
    car.speed=Math.sign(car.speed)*Math.max(0,Math.abs(car.speed)-360*dt) || 0;
  }else if(brk){
    car.speed=car.speed>0?Math.max(0,car.speed-280*dt):Math.max(CAR_REV,car.speed-115*dt);
  }else if(gas){
    if(car.speed<0)car.speed=Math.min(0,car.speed+230*dt);
    else {var drag=185*.35/CAR_MAX;car.speed=CAR_MAX/.35+(car.speed-CAR_MAX/.35)*Math.exp(-drag*dt);}
  }else{
    car.speed=Math.sign(car.speed)*Math.max(0,Math.abs(car.speed)-36*dt) || 0;
  }
  car.speed=Math.max(CAR_REV,Math.min(CAR_MAX,car.speed));
''' + source[b:]
    return 'var connectedSteer=0;\n' + source
