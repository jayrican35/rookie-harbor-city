# Precinct 9 — V140 approved Option A campus layout

**Visual approval received November 2, 2026.** The owner approved the full
Precinct 9 campus layout after a single requested revision: eliminate all trees
and bushes from **inside the visitor parking lot**, retaining the rest of the
proposed design. This is the map-accurate implementation of that direction,
not a scene-sized picture pasted into gameplay.

## Existing canonical geometry (unchanged)

- Main building lobby entrance: world (948,1124), fully seamless interior.
- Fleet garage entrance: world (1918,1256).
- Existing Harbor Avenue: x=149..2069, y=1721..1848; crosswalk centered at x=948.
- Existing Canvas/camera/roof/collisions, character controls, NPCs and
  main campaign/Zombie Outbreak remain untouched.

## Approved visual composition mapped to world coordinates

- Public plaza: x=419..1629, y=1280..1696, with existing x=948 central walkway.
  It replaces the detached, old parking decoration left of the garage.
- Garage approach: x=1742..2096, y=1264..1488, aligned below the x1918 fleet door.
- Central clear access aisle: x=1856..2002, y=1450..1721.
- Visitor parking: x=1640..2310, y=1464..1701, with spaces on either side
  of the clear central access aisle; leftmost stall is accessible.
- Landscaped edges: immediately outside public plaza and parking perimeter,
  with no tree, hedge, bush, pole or raised planter inside any parking bay.
- Historic detached auxiliary asphalt x=2325..2705 is decommissioned visually
  to a grassy service buffer, without changing road or collision data.
- Two compact facade-mounted American flags replace oversized duplicated
  facade+plaza flags. Keep the approved precinct blue-brick windows, original
  badge, existing lobby entrance and garage artwork.

## No duplicate code or renderer

The existing V133 cached ground authoring functions draw the V140 plaza,
new visitor parking, garage apron and original Harbor Avenue connection.
They call the same V135 Phase-5 terrain atlas fill functions. The existing
V115 decorative list excludes three historic trees in the new vehicle area.
The existing V134 flag painter is reused and the duplicate plaza flags are
suppressed. The normal V139 layout remains the fallback when the dedicated
V140 preview activation flag is absent. No new scene, collision graph,
requestAnimationFrame, actor manager or images of the whole campus.

## Approval/QA boundaries

The source design image is a **concept**, not a coordinate-perfect isometric
world file. The placement is adapted to the existing 1:1 pixel world so
door and road connections continue working. Actual 390x844 and 1280x720
playable Chromium screenshots and W/S lobby entry/exit must pass before
any release. Automated checks establish functional correctness, **not**
final visual approval. This remains a separate, unmerged review branch.
