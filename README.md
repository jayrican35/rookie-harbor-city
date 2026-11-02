# ROOKIE: Harbor City

The editable development candidate is the V140 source lineage. `main` currently
assembles historical releases through deployment workflows; it does not contain
the game source. Keep the original campaign and Zombie Outbreak protected.

## Run the precinct review locally

Requires Python 3. Run from this checkout:

```powershell
python tools/prepare_local_review.py
python -m http.server 8767 --bind 127.0.0.1 --directory site
```

Open [the playable comparison](http://127.0.0.1:8767/). It offers updated and
previous layouts in the existing connected-world preview. This preview does
not yet integrate the full campaign's missions or player driving.

For browser QA, install Playwright and its FFmpeg dependency, with Chrome
installed, then run `node qa/audit-baseline.cjs --review`. The script writes
actual phone/desktop screenshots, a keyboard walkthrough video, collision and
touch observations, and a bounded protected-mode parity check.

See [the takeover audit](docs/TAKEOVER-AUDIT-2026-11-02.md) and
[the Option A implementation review](docs/PRECINCT9-OPTION-A-REVIEW.md).

The [roadway asset pass](docs/ROADWAY-IMPLEMENTATION.md) starts at the precinct
and follows the original connected street geometry into the surrounding districts.
