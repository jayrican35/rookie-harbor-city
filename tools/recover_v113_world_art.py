#!/usr/bin/env python3
"""Recover main-campaign environment WebP images missed by the static capture.
Only creates files under assets/midtown, assets/exterior and assets/maple-court;
gameplay engine, CSS, Zombie Outbreak and deployed root are not modified.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from hashlib import sha256
from urllib.parse import urljoin, urlsplit
from urllib.request import Request, urlopen
import json

SITE = "https://rookie-harbor-city-jay-20261014.satinyboot35.chatgpt.site/"
ROOT = Path(__file__).resolve().parent.parent / "published-game-capture"
MAX_SIZE = 24 * 1024 * 1024
GROUPS = {
    "midtown": ["convenience_store.webp", "cafe.webp", "cafe_patio_set.webp",
      "motel.webp", "repair_garage.webp", "pharmacy.webp",
      "laundromat.webp", "pizza_shop.webp"],
    "maple-court": ["house_12_peach.webp", "house_8_cream.webp",
      "house_16_sage.webp", "mailbox.webp"],
    "exterior": ["precinct_overhead.webp", "garage.webp", "utility_shed.webp",
      "fence_horizontal.webp", "fence_vertical.webp", "gate_open.webp",
      "fountain.webp", "monument.webp", "flagpole.webp", "bench.webp",
      "lamp.webp", "bollard.webp", "flower_planter.webp", "hedge.webp",
      "palm.webp", "shade_tree.webp", "hydrant.webp", "trash_bin.webp",
      "parking_bay.webp", "wheel_stop.webp", "patrol_car.webp", "civilian_red.webp"],
}
PATHS = [f"assets/{group}/{name}" for group, names in GROUPS.items() for name in names]
report = {"source": SITE, "requested_paths": PATHS, "captured": [], "existing": [],
          "failed": [], "zombie_outbreak_touched": False}

def valid_webp(data):
    return len(data) > 100 and data[:4] == b"RIFF" and data[8:12] == b"WEBP"

def recover(path):
    target = ROOT / path
    if target.is_file():
        contents = target.read_bytes()
        if valid_webp(contents):
            return "existing", {"path": path, "bytes": len(contents), "sha256": sha256(contents).hexdigest()}
    url = urljoin(SITE, path)
    try:
        if urlsplit(url).netloc != urlsplit(SITE).netloc:
            raise ValueError("Off-origin address")
        request = Request(url, headers={"User-Agent": "Mozilla/5.0 (ROOKIE-OwnerBackup/3.0)",
                "Accept": "image/webp,image/*;q=0.8,*/*;q=0.1"})
        with urlopen(request, timeout=25) as resp:
            if urlsplit(resp.url).netloc != urlsplit(SITE).netloc:
                raise ValueError("Off-origin redirect")
            data = resp.read(MAX_SIZE + 1)
        if len(data) > MAX_SIZE or not valid_webp(data):
            raise ValueError("Not a valid or size-limited WebP asset")
        target.parent.mkdir(parents=True, exist_ok=True)
        temp = target.with_suffix(".webp.tmp")
        temp.write_bytes(data)
        temp.replace(target)
        return "captured", {"path": path, "bytes": len(data), "sha256": sha256(data).hexdigest()}
    except Exception as exc:
        return "failed", {"path": path, "error": str(exc)[:250]}

if not (ROOT / "game.js").is_file():
    raise SystemExit("Missing recovered game.js")
with ThreadPoolExecutor(max_workers=6) as pool:
    for status, details in pool.map(recover, PATHS):
        report[status].append(details)
for key in ("captured", "existing", "failed"):
    report[key].sort(key=lambda item: item["path"])
report["midtown_available"] = sum((ROOT / ("assets/midtown/" + n)).is_file()
                                  for n in GROUPS["midtown"])
report["midtown_required"] = len(GROUPS["midtown"])
(ROOT / "V113-WORLD-ART-RECOVERY.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print("Recovered:",len(report["captured"]),"Existing:",len(report["existing"]),
      "Failed:",len(report["failed"]),"Midtown:",report["midtown_available"],"/",report["midtown_required"])
for item in report["failed"]:
    print("UNAVAILABLE",item["path"],item["error"])
