# Arcade performance driving

The upgrade applies to connected Harbor City’s Unit 9 cruiser. Desktop uses W or Up to cruise, A/D or Left/Right to steer, S or Down for service braking and reverse, Shift for performance acceleration, and Space for handbrake. Mobile retains steering, GAS, reverse and STOP, with dedicated ACCELERATOR and HANDBRAKE buttons. Each touch pointer tracks its own action. Hold accelerator and handbrake at low speed to stage a burnout, then release the handbrake to launch.

## Runtime

The existing connected controller continues to update at substeps of at most 1/120 second. Cruise tops out at 265 world units per second. Performance acceleration builds to 429.3, 62% above cruise and 20% above the prior boosted cap. Excess speed rolls down after release. Heading and world velocity remain independent. The handbrake reduces lateral grip, adds speed-scaled yaw, and slows the car gradually. Releasing it blends back toward road grip. Opposite steering speeds up recovery. The normal STOP control still uses emergency braking.

Wild Arcade retains dynamic impact ownership. The existing cruiser collision probes handle buildings, static obstacles, and pedestrian contact. No contact geometry, routes, story state, or save schema changed. The existing 32-heading atlas, rear-wheel anchors, pitch and roll, city audio bus, engine samples, and camera look-ahead are reused. The soundtrack adds speed-based RPM steps and a synthesized tire squeal because the local audio pack has no squeal sample. Burnouts raise engine pitch and emit smoke without requiring travel. Skid segments and smoke share a reusable pool capped at 72 live effects. They expire after 2.6 and 0.65 seconds respectively.

## Tuning

Edit published-game-capture/vehicle-handling.json and run tools/rebuild_connected_driving.py followed by tools/package_main_game.py --refresh-manifest.

- performanceSpeedMultiplier, performanceTorque, performanceReleaseDrag set the boost cap, throttle force, and return to cruise.
- handbrakeDeceleration, handbrakeYawRate, handbrakeFullSpeed set the loss of speed and yaw response.
- handbrakeLateralGrip, handbrakeGripLoss, handbrakeRecoveryRate tune the slide and its release.
- normalLateralGrip, slidingLateralGrip, maxSlipAngle, gripLossResponse, gripRecoveryResponse, and countersteerGrip tune ordinary power slides and recovery.
- burnoutMaxSpeed sets the maximum entry speed for a burnout.

## Verification

- node qa/check-performance-driving.cjs checks the shipped controller at 30, 60, and 120 Hz with 120 Hz substeps. It covers cruise, progressive boost and release, a stationary burnout and launch, near-quarter-turn heading change with lateral movement, a 180-degree pivot, countersteer recovery, and Wild Arcade receiving the sliding car’s real lateral velocity.
- node qa/check-driving-stage-c.cjs passed the existing drift, reverse, emergency stop, and impact handoff regression.
- Chrome at 390 × 844 exercised the packaged game with three simultaneous emulated touch points on steering, accelerator and handbrake. The cruiser stayed stationary with smoke, cleared input on release, and accelerated on Shift.
- Standalone package validation checked 952 files. The original engine and Zombie Outbreak files were left intact.

Turn geometry and impact were exercised with deterministic scenarios. Physical-phone handling, a street-by-street obstacle pass, and an audio listening pass were outside this verification.
