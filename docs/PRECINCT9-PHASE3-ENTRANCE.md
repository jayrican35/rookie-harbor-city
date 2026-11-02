# Precinct 9 — Phase 3 main entrance and seamless access

Implementation scope: continue V136's approved 42-frame atlas and existing
V134 cached frontage within the original V115 connected world. This work
does not migrate the main story missions or vehicles into V115; that larger
architectural project remains outside this phase.

## Audit
Phase 1: original 26 wall/stone sprites and 32px native grid, intact.
Phase 2: additional 16 windows, combined 42-frame 1024px atlas, intact.
V134: main entrance awning, badge and precinct nameplate, warmed glass,
roof fade and existing Canvas cache. Existing approved crest/signage kept.
V115: original world FRONT=(948,1124), original traversable 72px doorway,
furnished LOBBY in same 1:1 world, original actor movement, collision,
input, camera tracking, roofAlpha and one requestAnimationFrame loop.

## Phase 3 production art
tools/build_precinct9_entrance_phase3.py generates 7 clean, transparent RGBA
modules in published-game-capture/assets/precinct9-entrance-phase3/:
stone portal frame, closed/half/open double-glass door leaves,
blue 2.5D roof and awning fascia, MAIN ENTRANCE sign.
The 1024x1024 atlas extends the exact existing 42 frames to 49, with a
matching JSON manifest. Phase 1 pilasters and stone caps are reused rather
than redrawn. Original V134 gold precinct crest, precinct nameplate, lanterns,
shadow, and warm architectural lighting remain present and unchanged.

## Implementation
The V135/V136 single existing PNG manifest loader now accepts the Phase-3
combined atlas in V137 only. V134's original renderArchitecture caches
the same building, replacing only entrance paint when art loads, with
one cache invalidation. Dynamic door leaves are painted in that same
existing facade/roof-alpha pass; their open fraction is updated only
inside V115's original simulate(dt), no separate animation loop.

Doors automatically open near the FRONT entrance and close after leaving.
The original collision geometry already has an open 72px portal; no
fake barrier is added. The glass-leaf collision is intentionally
nonphysical/automatic; player, NPC and camera continue to move using
the ORIGINAL world collision and movement controller. Any NPC pathing beyond
the existing routes is not added. Entering and exiting retains the same
worldId/playerId and physically walks across the original opening.

## QA and genuine architecture boundary
Mobile 390x844 Playwright test uses actual W and S keyboard input to walk
from the civic walkway into LOBBY and out again. It verifies
collision-free original threshold, same worldId/playerId, real
camera follow, doorCrossings increments twice, and roofAlpha
fades and restores. It also saves real screenshots and an
entry/exit WEBM from an uninterrupted gameplay page.

The original MAPS main campaign, car/mission saves and Zombie Outbreak
are NOT transferred to this connected-world prototype. The V115 source
explicitly describes this limitation. This phase cannot honestly claim
full main-campaign migration. This remains an isolated, playable
precinct review candidate until artistic approval.

No changes to original Zombie Outbreak code/maps/assets/audio/balancing,
Academy, Marina, vehicle, missions or saved progress.
