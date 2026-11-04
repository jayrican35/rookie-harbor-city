# Driving feel and citywide traffic repair

Local implementation, November 4, 2026. Starting commit: `8d073e1`. Diagnosis was recorded in `DIAGNOSIS.md` before implementation.

The connected game now has a refined Sporty Arcade binding of the existing controller and one bounded fleet using the existing road geometry, simulation clock, collision gates, depth queue and artwork. No campaign/Zombie controller, new vehicle artwork or replacement map was introduced.

## Root causes and handling changes

The old steering curve reached 1.95 radians/s at moderate speed and changed instantly with digital input. Space also invoked regular braking and a second deceleration path. Gas/brake priority was inconsistent. The car has scalar longitudinal speed rather than an independent lateral-slip model; the impression of excessive sliding primarily came from abrupt high yaw, not a separate lateral friction bug.

`tools/connected_driving.py` refines the existing controller source when binding it into the connected preview. Steering uses a 100 ms response and signed speed with reduced high-speed yaw, capped at 1.2 radians/s. It does not rotate the car while stopped, and reverse steering uses the correct sign. Progressive acceleration uses the original engine curve integrated exponentially. Coasting is 36 units/s², regular braking 280, reverse acceleration 115, and STOP is one exclusive 360-unit/s² deceleration clamped at zero. Braking takes precedence over gas. Maximum forward/reverse speeds remain 265/-92.

The existing 120 Hz substeps, angular collision rollback, Wild Arcade impact/rebound/escape pipeline, gear/speed presentation, camera, keyboard/touch bridge, entry/exit, parking saves and emergency lights remain in use. Cosmetic motion does not write physics. No new suspension or lateral sliding system was added.

## Traffic and road repair

The prior `streetPose()` route was a single horizontal Harbor Avenue loop. Its following gaps and collision bounds assumed horizontal traffic. That calculation was replaced in the same fleet/update/depth architecture, rather than running alongside it.

`connected-traffic.js` derives directed right-hand lanes from logical road segments and native asphalt strips. Complete van-sized footprints are checked against pavement and existing solid/water/scenery collision before accepting a leg or turn. Destination searches use cached reachability. Curved intersection transitions slow the vehicles; reservations and clear-exit checks supply basic right-of-way. The fleet yields to vehicles, pedestrians and Unit 9. Collision queries now follow actual traffic heading.

The pool is bounded at 28 cars. Downtown/Midtown receive more traffic; residential/Marina roads run slower; industrial allocation favors deliveries. Brief delivery pauses, blocked-route retries, temporary route avoidance and sampled lane-to-lane turnarounds provide recovery. The same simulation advances visible and off-screen traffic at a bounded cadence, while the existing camera culls drawing.

Persistently blocked ambient cars may re-enter the pool after 30 seconds only if both the old and new positions are outside the camera plus a 250-unit margin. Reinsertion requires clear road space and spacing from the rest of the fleet. The dedicated saved cruiser never participates. These off-screen relocations are counted separately and are not credited as driven district crossings or road-to-road routes.

Two navigation defects were repaired without repainting the map: native strip endpoints 15–125 units before an overlapping junction are joined to that actual junction; existing short 168 × 236 Northgate bridge strips are retained as roads. Otherwise the graph incorrectly separated continuous pavement. Both Precinct lane directions now reach all nine tested districts through validated roads. This includes the western collector/ring, Midtown north/lower connections, Downtown/Harbor Avenue, industrial arterial and Southbay/Marina approach.

Where posts narrow a wide road, a validated lane inset is used while retaining the visible post and collider. Unsafe turns and tiny nonviable stubs are excluded. One southbound Midtown feeder near (4051,2896) does not pass the full van-footprint test; traffic uses the verified western/Southbay connection instead. The short east end of Midtown's lower road terminates before a full vehicle can turn. Waterfront boardwalks, water and docks remain outside AI road routing. Exact rejected samples are recorded in `city-graph.json`.

## Validation

The order was: no-traffic handling tests; a three-road/two-intersection test; then the actual city graph and fleet. The three-road test ran 600 simulated seconds, included both turn directions, pedestrian stop/resume, and 81,000 body-pair checks with no overlap. It does not use off-screen reentry to pass its queue test.

The actual-browser city test advances the existing traffic and pedestrian functions for 600 simulated seconds, followed by normal live RAF movement and screenshots. It checks full body footprints on asphalt, body separation, bounded visible movement and recovery. District crossings are recorded only from continuous movements, excluding off-screen reentry. This is accelerated testing in the real game, not a claim of ten wall-clock minutes of manually driven video.

<!-- MEASUREMENTS_START -->
- City fleet: 28 cars; 73 candidate directed legs, 67 usable continuing legs, 155 validated turn connectors.
- Actual city test: 600 simulated seconds, 680,400 body-pair checks, zero detected overlaps, 64 visited legs and 107 distinct driven two-leg routes/transitions. These are road-to-road routes, not a claim that every complete destination itinerary was exercised.
- 12 distinct continuous district-crossing directions were observed, excluding off-screen reentry. Both Precinct directions have graph reachability to all nine tested districts.
- Final longest wait: 10.1 simulated seconds; 119 sampled turnarounds, 89 intersection reroutes and 26 explicitly off-screen reentries. No visible position snap was detected.

| Driving comparison | Prior fleet FPS / P95 | City fleet FPS / P95 |
|---|---|---|
| Normal CPU | 59.1 / 16.8 ms | 59.4 / 16.8 ms |
| 4× CPU slowdown | 19 / 66.7 ms | 20.8 / 66.7 ms |

The 4.5-second comparisons isolate the prior campus/fleet from commit `8d073e1` versus the new routing, using the same current handling, art, view and inputs. They are not physical-handset benchmarks.
<!-- MEASUREMENTS_END -->

Controller checks pass at 30/60/120 Hz: identical one-second acceleration, consistent steering response, no stationary rotation, coast, brake priority, reverse and original collision rebound. Real keyboard checks include both full-turn directions, reverse circles, reverse parking, Downtown and Marina road maneuvers, STOP, lights and entry/exit. Separate mobile checks use native simultaneous GAS/steering touch points at 390 × 844, then STOP and exit. Existing profile reload/import/isolation tests pass.

Original campus room/door and pedestrian regression checks pass. Protected canonical controller, world, Marina, civilian, character and wall-kit sources are compared against their baseline; cruiser art remains unchanged. Zombie startup still refuses connected mode, requests no cruiser assets and retains its seeded map hash. Read-only proof and raw results are in the neighboring JSON files.

## Files changed and reproduction

- `published-game-capture/connected-traffic.js`: route graph and the existing fleet's navigation implementation.
- `published-game-capture/v115-campus.js`: single fleet integration, rotated collision bounds, cached actor input, static-only navigation queries and query-gated testing telemetry.
- `published-game-capture/precinct-cruiser.js`: continuous-heading traffic overlap with a cheap distant-body rejection.
- `tools/connected_driving.py`, `tools/prepare_civilian_preview.py`: connected-only handling refinement and local build wiring.
- `tools/civilian_preview_review.html`, `tools/package_driving_repair.py`: local evidence link and packaging.
- `qa/check-connected-handling.cjs`, `qa/check-connected-traffic.cjs`, `qa/check-city-traffic-browser.cjs`, `qa/check-mobile-driving-steering.cjs`: focused new checks. Existing controller, traffic, turning, isolation and frame-time harnesses were updated for the refined binding and live routes.
- `docs/driving-repair/`: diagnosis, raw results, connectivity proof, report and actual screenshots.

Run `python tools/prepare_civilian_preview.py`, then the focused Node QA scripts above with Playwright available. `ROOKIE_TRAFFIC_TEST=off` selects the no-traffic case in the turning/gameplay harness. `ROOKIE_PERF_BASELINE=8d073e1` selects the prior commit in `qa/compare-driving-frame-times.cjs`. Finish with `python tools/package_driving_repair.py`.

## Limits

Traffic positions and headings turn continuously, but existing ambient vehicle art has four cardinal views. The player's 16-view cruiser is preserved. No new traffic-light simulation, advanced lane changing, physical unloading, or independent drift drivetrain was added. Drivers still wait when a player/pedestrian occupies their path or no safe recovery space exists; visible cars are not forcibly relocated. Some narrow turn/stub choices remain intentionally excluded.

Performance figures are short headless-browser samples. CPU-heavy emulation still drops frames; these are not physical-phone benchmarks. Mobile touch functionality was tested in portrait emulation, not on a handset.

All work, tests, screenshots and commits remain local. No push, deployment, remote merge, PR or game-version increment was performed. Historical untracked driving notes and the old baseline harness were left untouched.
