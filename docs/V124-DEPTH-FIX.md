# ROOKIE: Harbor City — V124 Structural Depth and Doorway Refinement

**Reviewed**: November 1, 2026 user's 37.35-second Android Chrome V123 gameplay recording. Frames show Jay approaching lamps, benches, planters, groves, the marina office, and the upper shop frontage. At about 18–24 seconds the office interior appears while the exterior context remains adjacent; lamppost globe overlaps the avatar during promenade walking. Earlier V123 preserved object collisions but only rendered the 18 pier posts in the proper shared actor depth queue.

## Confirmed root cause

In `v115-campus.js`, `drawEntityHighlights()` drew Jay and NPCs before `v116-marina.js` called `foreground()`. That method unconditionally painted **all building roofs, lamp sprites, and swaying trees and palms** over the entire actor layer, ignoring foot position and creating Jay-behind-a-building and lamps-covering-Jay's-face problems. Additionally, `updateInteriors()` revealed an entire room when the player was within a generous 12px horizontal and 40px vertical margin around its door.

## Actual corrected game

1. Existing `v116-marina.js` exposes `depthProps(view)` and `drawDepthProp(g,entry,opt,t)`. It adds each building's roof, all visible tall tree/palm sprites and every lamppost to the **same** world-space y-sort as Jay, regular NPCs, interior furniture and V122 pilings. The true world foot/structure-base y determines draw order, not a blanket top layer.
2. The late `foreground()` renderer now handles **only existing ambient birds**, not structural scenery. The new depth renderer maintains the existing lamp bloom, tree sway, furniture/room vegetation clipping, texture artwork and smooth alpha roof fade.
3. Building roofs sort by the doorway-wall base (door.y - 2). Jay standing south/in front of the facade renders *in front* of the building; if his feet are behind the building wall, the building visually occludes him. There is no new scene, camera or duplicated frame loop.
4. Roof fading now requires foot position **inside the actual door opening**, horizontally inset by 5px and within 6px inside to 18px outside the threshold, or the player already inside the room. Standing alongside the building or passing a nearby wall keeps the roof closed.
5. Benches, flower planters, trash bins and the waterfront kiosk now also sort by their physical object-base y rather than painting under every character. The existing native collider footprints remain authoritative.
6. V123 physical collisions, doorway fences, NPC sprites, V122 dock elevation, V121 premium water, audio, quests, HUD, saved data and Zombie Outbreak are unchanged.

## Quality assurance

`qa/check-v124-depth.cjs` explicitly tests lamppost in-front/behind y ordering, shop-front actor ordering, entry-only roof fade, roof restoration, pixel-only renderer separation, native pier and water collision. V115/V116/V117/V122/V123 regression suites remain active.

`qa/capture-v124-depth.cjs` places real Jay in the running browser in 390×844 mobile-size Canvas at the same world coordinates for before V123 and after V124:
- lamp front x5073,y3759 versus lamp base y3737;
- lamp behind x5073,y3702;
- in front of office x4730,y3582 with roof intact.
Captured screenshots and actual runtime state are published in the isolated comparison gallery.

## Scope and limitations

The approved original campaign and Zombie Outbreak remain byte-identical. V124 is a separate playtest, not a merge. This is a structural depth/roof fix, not a full modern-game redesign. Further checks are advisable for complex multi-object overlaps and physical Android touch-control performance.
