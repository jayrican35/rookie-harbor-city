# Connected street repairs

The connected preview now joins Midtown's two northern street stubs to Northgate, aligns the Northgate–Downtown spine, and gives the Midtown avenue one consistent curb and lane center. Parking aprons no longer expand the painted street network.

The Maple connector now follows the empty eastern edge of Maple Court, preserving the house and landscaping previously crossed by its logical route. The Downtown waterfront approach ends at the protected Marina boundary instead of continuing invisibly through waterfront scenery.

Six existing lane intrusions were moved into clear off-street space: a bench, tires, crates, and a tree in Midtown; a parked car in Downtown; and a parked car in Industrial. Each visible object moves together with its corresponding collider. Building, scenery, water, and moving-traffic collision remain active. Changes apply to cloned connected maps; original campaign maps and driving are outside this change.

Validation:

- Canonical topology: 22 road segments connected; all 21 merged painted surfaces form one component.
- Fixed collision sweep: 8,382 samples across street interiors, player radius 11, zero hits. This samples the network rather than proving every continuous position.
- Real movement input: both northern connections and the Maple bypass passed, with camera follow checked.
- Before/after screenshots at 1280×720 and 390×844; no browser exceptions. Mobile evidence uses an emulated viewport.
- Zombie startup and seeded maps match the previous build; connected-world entry is refused during Zombie mode and no roadway assets load there.
- World-road, traffic, connected-campus, and city-art regression checks pass. Protected engine, Zombie stylesheet, Marina, city art, vehicle/wall kit, and interior bridge sources match commit `957a4db` after Git line-ending normalization.

Open the local [road review](http://127.0.0.1:8767/) or [evidence gallery](http://127.0.0.1:8767/evidence/road-repairs/). Raw evidence is in [evidence](evidence/index.html).

Reproduce from the repository root with the existing vehicle-perspective preview available:

```text
python tools/prepare_road_repairs.py
node qa/check-world-roads.cjs
node qa/check-world-traffic.cjs
node qa/check-v115-campus.cjs
node qa/check-v127-citywide.cjs
node qa/audit-street-obstructions.cjs
node qa/check-road-repairs.cjs
node qa/check-road-isolation.cjs
python tools/package_road_repair_evidence.py
```

Browser checks require Playwright, Chrome, and the local server on port 8767. This is a local review build; nothing was published or pushed.
