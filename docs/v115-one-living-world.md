# ROOKIE: Harbor City — V115 One Living World
## Approved direction
- **Option A:** truly shared, physically connected outdoor/indoor world with zoom all the way out to the whole city.
- No opaque screen jumps, no independent district loads once migration is complete.
- Long-term: multiple family members each on their own device in a shared multiplayer world.
- **Absolute exclusion:** Zombie Outbreak code, content, assets, maps, lighting, combat, settings and behavior must remain byte-for-byte untouched.

## Honest phase status
### Phase 1 — World coordinate contract and actual-world atlas (implemented)
- Separate versioned module `published-game-capture/v115-world.js` and stylesheet.
- All **ten** non-Academy outdoor districts have stable placements in a single proposed ~8500 x 6350 coordinate atlas, drawn from the actual current `MAPS` definitions (ground rectangles, footprint shapes, tree locations).
- World positions use `worldId`, `areaId`, and non-local-area `instanceId`; data can later be serialized for a network server.
- Viewport chunk helper is based on stable 512-unit chunk IDs and 32-unit design tiles, but **is not yet plugged into active world rendering**.
- Map UI defaults to **Actual Map** with consistent player, vehicle and objective markers. **Illustration** button preserves the original concept artwork for comparison.
- The dashed atlas links show *planned* district adjacencies that **aren't walkable yet**; they are not represented as finished streets.
- Indoor locations are *entrance anchors*, NOT falsely embedded footprints. Their full-size geometries still need reconstruction.
- Academy and Zombie Outbreak are excluded from this new world registry. The original game engine and its save format remain unchanged.
- V115 preview script copies profile saves into an isolated prefix once; testing writes/removes only its own prefixed copies.

### Phase 2A — Walkable continuous Precinct 9 campus prototype (implemented on branch, not production)
- A **separate world-exploration preview** (`v115-campus.js` + `v115-campus.css`) is accessible from the V115 actual-world map via **EXPLORE PRECINCT CAMPUS**. It does not replace the main game.
- One 2,800 × 1,950 world-space canvas draws a full-size **1,936 × 1,172** precinct interior, redesigned exterior grounds, sidewalk, parking and the southern road together. The source of interior rooms, solid furniture and walls is `MAPS.station`.
- The front entrance uses the actual x532–604 gap of the original south wall (world x948/y1124); the garage exit uses its 345-unit-wide south-wall opening. Walking across either gap moves the character in a single coordinate space. No `goTo`, fade, screen swap or browser reload is called by this prototype.
- One continuous follow camera with desktop scroll/pinch-to-zoom, joystick, WASD/arrow movement, collision checks, 512-unit visible-chunk indexing, zoom-out overview and roof-opacity cutaway.
- Launching the preview reads the classic character's current station or plaza location when geometrically valid; it NEVER writes game position, saves, missions or vehicle state back.
- The prototype has synthetic, interim outdoor landscaping and a roof schematic. The in-world mission interactions, patrol-car driving, full exterior tileset pass and the remaining districts have NOT been migrated.
- Network contract uses `worldId: harbor-main`, stable area/instance IDs and numeric coordinates, with `authoritativeServer: false` and `transport: none`. **No real multiplayer synchronization is active.**
- Regression checks: `node qa/check-v115-campus.cjs` and the existing V115 atlas test. Door crossing, wall/furniture collision, map sizes, and Academy/Zombie exclusion are tested without modifying protected code.
- **Not ready to merge or publish as a replacement for the game.** Test only under `/preview/v115/`; do not move campaign saves into it.

### Phase 3A — Connected outdoor district geometry (implemented on development branch)

**One canvas and camera now cover the Precinct 9 campus and all nine existing outdoor districts** (Westfield, Residential/Maple Court, Midtown, Downtown, Eastside, Industrial, Northgate, Southbay, Waterfront). The layouts reuse the actual latest runtime map sizes; notably Midtown is **2256 × 1900**, not its original 1600 × 1100. The district coordinate system is shared with the original V115 precinct campus.

- Physically continuous Harbor Avenue connects Westfield → Residential → Precinct grounds → Midtown → Downtown → Eastside → Industrial. The road lane center is aligned at world y=1784 across all six legacy side-exit layouts.
- Authored north–south links connect Northgate, Downtown, Waterfront, Southbay and a southern Maple Court connection. Links are drawn as roads and sidewalks, not teleports.
- Existing district ground colors/geometry, prominent buildings and NPC/interaction landmarks are drawn with local-world translations. Where available, Midtown buildings and vegetation reuse recovered source WebP assets.
- Regions are rendered only near the camera viewport. At entire-city zoom, show labeled district regions and a visible player marker. The map overview and campus use the same actual coordinate grid, including the full-size 1936×1172 station footprint.
- Foot collisions include preserved district solid rectangles where available; the original station walls, rooms and furniture remain unchanged. Players can cross connected road boundaries without invoking `goTo`, loading a new map, or closing the continuous-world view.
- Each district has a stable world-space `instanceId`; `snapshot().areaId` and `instanceId` reflect current district. The system is still local-only (`transport:none`, `authoritativeServer:false`).
- Regression tests include `qa/check-v115-campus.cjs`, `qa/check-v115-connected-city.cjs`, and an actual Chromium phone-sized camera-and-crossings smoke test. Those checks do **not** prove complete mission compatibility or final visual quality.

**Important limitation:** The **main campaign still uses the original classic-map engine**, including driving, mission progression, ambient AI, and separate interiors besides Precinct 9. V115 Phase 3A is a fully connected *outdoor exploration prototype* launched from the MAP menu, not yet a replacement for the campaign. Never claim it is complete seamless story gameplay until those systems are migrated and tested. Never merge or republish without approval.

### Phase 2B — Precinct 9 main-game integration and finished art (not yet implemented)
Current interior: **1,936 × 1,172 units**. Current exterior precinct art: **640 × 448 units**. A player cannot literally walk seamlessly through the existing 640-pixel shell and find the much bigger 1,936-pixel interior without spatial contradiction. Do NOT call an instant `goTo` / black fade removal a seamless fix.

Work required:
1. Make a canonical precinct envelope in world units that fits the true 1,936 x 1,172 interior, with wall collisions and correctly aligned personnel and garage doors.
2. Keep existing evidence, locker, Records, reception, briefing and garage spot IDs and their exact interior local coordinates. Avoid altering mission progression.
3. Convert plaza streets, parking and building footprints to world-space coordinates with **one stationary camera**.
4. Render the exterior building shell and interior rooms as parts of the same spatial chunk; use roof cutaway or fade of roof art when a character enters through a world-space door.
5. Interior collision uses its current walls/furniture; outdoor sidewalks/vehicle collision use current source geometry transformed to the same world.
6. Test both directions on foot and vehicle, with synchronized door positions and no loading overlay. **Until this physical space exists, leave classic doorway behavior intact.**

### Phase 3B — Integrate actual district/traffic/quest systems (not yet implemented)
- Start with the physical Precinct grounds → Midtown road, then Maple Court and Downtown, before extending Industrial, Southbay and Waterfront.
- Convert NPC positions, traffic routes, patrol car, encounters, interactables and objective locations into the same world coordinates.
- Preload neighboring chunks before visible entry and use draw distance/LOD for citywide zoom.
- No world streaming should cause a new document, canvas, or per-district game save to load.

### Phase 4 — True citywide camera and overview (not implemented yet)
- Zoom and pan the same logical world, change LOD based on zoom and screen space, never assemble a deceptive screenshot.
- City overview and main scene share the exact positions; markers must move as players move.
- Protect mobile memory with a bounded chunk cache, load budgets, reference counts, and robust fallback art.

### Phase 5 — Multiplayer readiness (architecture only)
- Stable world/area/entity/player IDs, 32-unit grid and 512-unit chunk addressing.
- Separate deterministic simulation state from rendering and browser-local UI state.
- Server-authoritative position/collision/mission state and concurrency-aware event sync come later.
- NO multiplayer/network implementation in V115 phase 1.
- Never transmit user profiles or saves just to show the offline map.

## Safety and release gates
- Keep `published-v1-backup`, current root Pages build, and both V113/V114 previews unchanged.
- Implement on `feature/v115-one-living-world` only.
- Compare Git blobs of `game.js` and `outbreak.css` against V114.
- Run `node --check` and `node qa/check-v115-world.cjs published-game-capture/v115-world.js`.
- Verify no `MAPS`, `state`, `car`, network or gameplay engine mutations when opening atlas.
- Manually test Android character selection, map open/close, atlas vs illustrated map, zoom/pan, current objective and Unit 9 positions, saves and Zombie Outbreak.
- Never merge without phone verification and user approval.

## Definition of done
**Phase 1** = real map geometry and future-compatible coordinate contract, with *no claim of truly seamless traversal*.
**V115 complete** = the entire city (including necessary interiors) physically contiguous with one camera, no screen swap, and verified mission/vehicle behavior. Phase 1 alone does **not** meet this definition.
