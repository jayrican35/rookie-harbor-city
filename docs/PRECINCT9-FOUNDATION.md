# Precinct 9 — Visual Foundation Lab

## Purpose
Develop the precinct and grounds first, using the actual recovered V128
browser game and approved precinct tile pilot as the only baseline.
**This candidate is for visual review, not production approval.**

## Grounded source geometry (unchanged)
- Station interior shell: world x=380..2316, y=96..1268; 1,936×1,172.
- Public front entrance: world (948,1124), 72-unit wall passage.
- Garage vehicle opening: world (1918,1256), original 345-unit opening.
- Original precinct 32px tile pilot: x352..992, y1300..1684, untouched.
- Native public parking: x1328..1908, y1268..1680.
- Existing east fleet lot: x2325..2705, y1280..1658.
- Original Harbor Avenue: x149..2069, y1721..1848.

## Implemented, isolated
1. Original-footprint pixel-art entrance canopy and narrow garage access
   markings; fade with the existing roofAlpha logic.
2. Painted stall separators, wheel-stops, accessible bay, staff/visitor signage
   and two lot edge treatments inside **existing paved footprints**, not newly
   paved grass or streets.
3. Small front-walk seams only in its already existing northern segment,
   plus a narrow curb-to-curb crosswalk on actual Harbor Avenue asphalt.
4. **Indoor/roof occlusion fix:** original station floor/walls render first,
   then Jay and NPCs, then the existing roof and rooftop details. When outside,
   actual interior characters are no longer in front of the roof. Crossing the
   real front/garage doors fades the roof to reveal the original room and NPCs.
5. Same Canvas renderer, world camera, interior rooms, real collision geometry,
   vehicles, NPC schedules, controls and save separation. No second game engine.

## Browser evidence
GitHub Actions run #41373556866 passed both source/regression and actual
390×844 Chromium jobs. Nine identical-camera comparisons include:
station roof, entrance, community walk, main parking, garage, east fleet
parking, Harbor Avenue crossing, lobby roof-fade and original Marina.
The last photo is for source-protected Marina visual comparison only:
real-time water/NPC motion can make two separate captures differ.

Original 11 station rooms, 34 wall colliders, 41 furniture solids,
96 interaction spots, doorway passability, and world ID were verified
identical. No browser page errors.

## What remains
- Existing precinct roof still needs a fully art-directed, approved pixel
  material pass (not blanket procedural fills); this first phase prioritizes
  visible geometry bugs, path legibility, two original parking areas and doors.
- Review the new art with the player on a physical Android phone; check HUD
  visibility, close-up readable sign sizing, motion near the roof and
  accessibility parking.
- Extend authored landscaping and nearby civic businesses only after the
  existing precinct art pilot and new front walk are visually approved.
- Academy and Zombie Outbreak remain completely untouched.

## Acceptance
Do not merge into V128/main, nor replace the original preferred game,
without human approval of gameplay screenshots and a playable lab review.
Raw pixel-difference percentages are not an art-quality gate.
