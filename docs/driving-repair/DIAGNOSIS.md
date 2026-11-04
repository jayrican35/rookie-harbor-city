# Driving and traffic diagnosis — before implementation

Local baseline: `8d073e1`, November 4, 2026.

The connected cruiser binds the canonical `game.js` controller through `prepare_civilian_preview.py`; `precinct-cruiser.js` advances it in substeps of at most 1/120 s. There is one connected simulation clock. Keyboard and touch feed the same four booleans, with Space/STOP as a separate flag. Cosmetics read heading/speed and do not change physics. The camera follows the physical center, not sprite bounds. The recent atlas normalization and static collision candidate index are already present.

The steering curve reaches the same 1.95 rad/s cap above approximately 59 world units/s: at full speed this is still over 111 degrees/s. It switches immediately on key press/release and has a discontinuity at 4 units/s. Reverse correctly changes sign. Speed is scalar: there is no independent lateral velocity or slipping tire model to repair. Adding a second velocity system would be unnecessary.

Space sets the regular brake flag and also subtracts another 340 units/s². Gas takes priority over regular braking, creating inconsistent combined-input behavior. Brake/reverse can cross zero within a step, and acceleration/coasting use Euler increments. The existing collision rollback, rebound, safe entry/exit and profile persistence work and should be reused. Automatic gear display is descriptive rather than a transmission simulation.

Connected ambient traffic is explicitly limited by `avenueStart`, `avenueEnd`, `streetPose()` and one closed horizontal loop, with eighteen cars. It does not navigate the existing road graph. The graph already includes west/residential, precinct, Midtown, Downtown, Northgate, Industrial and Southbay connections, plus native road surfaces. Existing following gaps operate on that single progress loop. `trafficBlocked` incorrectly assumes every car is horizontal, and cruiser yielding similarly assumes a horizontal road. Those assumptions need to follow continuous traffic headings when the same fleet is routed onto vertical roads and turns.

Approach: refine only the connected binding of the existing controller, leaving canonical campaign/Academy/Zombie code unchanged. Test player handling without traffic first. Then replace the existing fleet's hard-coded route calculation with a road-surface-derived directed lane graph, keeping its simulation/depth/art hooks. Validate full vehicle footprints against asphalt and physical geometry before accepting edges; intersections use sampled continuous curves, bounded reservations and following clearance. Start with a three-road test, then expand only to validated connected city routes. Do not repaint or widen roads speculatively.

The historical untracked `docs/driving/` and `qa/check-driving-baseline.cjs` predate this assignment and will remain untouched.
