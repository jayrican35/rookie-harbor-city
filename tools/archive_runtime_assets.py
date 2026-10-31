#!/usr/bin/env python3
"""Second-stage, read-only recovery of assets used by the public ROOKIE game."""
from __future__ import annotations
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
from pathlib import Path
import re
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlsplit
from urllib.request import Request, urlopen

SITE = "https://rookie-harbor-city-jay-20261014.satinyboot35.chatgpt.site/"
HOST = urlsplit(SITE).netloc
OUT = Path("published-game-capture")
OUT.mkdir(exist_ok=True)
MAX_FILES = 350
MAX_BYTES_EACH = 30 * 1024 * 1024
MAX_TOTAL_BYTES = 300 * 1024 * 1024
EXTS = ("png", "webp", "jpg", "jpeg", "gif", "mp3", "ogg", "wav", "css", "js", "woff", "woff2", "json")
errors = []
status = {"source_url": SITE, "capture_stage": "runtime_assets", "captured": [], "failed": [], "warnings": [
    "This is a capture of publicly served game files, not the original Work source project.",
    "Offline behavior is unverified and dynamic resources not identified by this script may be missing."
]}

# Restore web-standard filenames from the initial capture so local servers serve
# game.js as JavaScript and stylesheets as text/css.
rename = {}
for pattern, destination in (
    ("game.js_*", "game.js"),
    ("continuation.css_*", "continuation.css"),
    ("controls.css_*", "controls.css"),
    ("adaptive-hud.css_*", "adaptive-hud.css"),
    ("outbreak.css_*", "outbreak.css"),
):
    files = sorted(OUT.glob(pattern))
    if len(files) == 1:
        files[0].rename(OUT / destination)
        rename[files[0].name] = destination

html_file = OUT / "index.html"
if html_file.exists():
    html = html_file.read_text("utf-8", errors="replace")
    for original, restored in rename.items():
        html = html.replace(original, restored)
    # Cloudflare injects this request-specific challenge script into the HTML;
    # remove only the injected snippet, not any game scripts.
    html = re.sub(r'<script>\(function\(\)\{function c\(\).*?</script>', '', html, flags=re.S)
    html_file.write_text(html, encoding="utf-8")

js_file = OUT / "game.js"
if not js_file.exists():
    status["error"] = "Missing game.js in first-stage archive"
    (OUT / "RUNTIME-ASSETS-REPORT.json").write_text(json.dumps(status, indent=2), "utf-8")
    raise SystemExit(status["error"])

js = js_file.read_text("utf-8", errors="replace")
css = "\n".join(p.read_text("utf-8", errors="replace") for p in OUT.glob("*.css"))
html = html_file.read_text("utf-8", errors="replace") if html_file.exists() else ""
source = js + "\n" + css + "\n" + html
asset_re = re.compile(r'assets/[A-Za-z0-9_./-]+\.(?:' + "|".join(EXTS) + r')', re.I)
paths = set(asset_re.findall(source))

# The game constructs many sprite URLs by joining a directory with a
# file recorded in each nearby "spec" object's asset metadata.
spec_re = re.compile(r'\bspec\s*=\s*\{', re.I)
for folder_match in re.finditer(r'assets/([a-zA-Z0-9-]+)/', js):
    folder = folder_match.group(1)
    pos = folder_match.start()
    lookbehind = js[max(0, pos - 70000):pos]
    specs = list(spec_re.finditer(lookbehind))
    if not specs:
        continue
    segment = lookbehind[specs[-1].start():]
    if len(segment) > 35000:
        continue
    files = re.findall(r'"file"\s*:\s*"([^"]+)"', segment)
    for fn in files:
        if re.fullmatch(r'[A-Za-z0-9_.-]+\.(?:png|webp|jpe?g|gif)', fn, re.I):
            paths.add("assets/" + folder + "/" + fn)

for name in ("jay", "rosa", "kaleb", "gigi", "lingling"):
    paths.add(f"assets/family-v1/{name}-portrait.webp")
    paths.add(f"assets/family-v1/{name}-sheet.webp")

# Exclude path traversal, endpoints and already-saved files.
paths = {p for p in paths if len(p) < 220 and ".." not in Path(p).parts and "?" not in p}
unfetched = sorted(p for p in paths if not (OUT / p).exists())
status["paths_identified"] = len(paths)
status["already_present"] = len(paths) - len(unfetched)
status["attempted_paths"] = unfetched[:MAX_FILES]

def capture(path: str):
    url = urljoin(SITE, path)
    parsed = urlsplit(url)
    if parsed.netloc != HOST or parsed.scheme != "https":
        return (path, "blocked external URL", 0, None)
    try:
        request = Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; ROOKIE-OwnerBackup/2.0)", "Accept": "*/*"})
        with urlopen(request, timeout=25) as response:
            if urlsplit(response.url).netloc != HOST:
                return (path, "off-origin redirect", 0, None)
            content_type = response.headers.get("content-type", "")
            if "text/html" in content_type and not path.endswith((".html", ".htm")):
                return (path, "HTML returned for asset path", 0, None)
            data = response.read(MAX_BYTES_EACH + 1)
        if len(data) > MAX_BYTES_EACH:
            return (path, "file exceeds capture size cap", 0, None)
        return (path, None, len(data), data)
    except Exception as exc:
        return (path, str(exc)[:240], 0, None)

total = sum(p.stat().st_size for p in OUT.rglob("*") if p.is_file())
with ThreadPoolExecutor(max_workers=5) as pool:
    futures = [pool.submit(capture, p) for p in unfetched[:MAX_FILES]]
    for future in as_completed(futures):
        path, error, size, data = future.result()
        if error:
            status["failed"].append({"path": path, "error": error})
            continue
        if total + size > MAX_TOTAL_BYTES:
            status["failed"].append({"path": path, "error": "total archive size cap reached"})
            continue
        target = OUT / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        total += size
        status["captured"].append({"path": path, "bytes": size, "sha256": hashlib.sha256(data).hexdigest()})

status["bytes_total_uncompressed"] = total
status["remaining_identified_paths"] = sorted(p for p in paths if not (OUT / p).exists())
status["state"] = "attempted_runtime_capture"
(OUT / "RUNTIME-ASSETS-REPORT.json").write_text(json.dumps(status, indent=2), encoding="utf-8")
(OUT / "README.txt").write_text(
    "ROOKIE: Harbor City - PUBLIC WEBSITE CAPTURE\n"
    "Source: " + SITE + "\n\n"
    "To try playing, unzip the archive and open index.html in a browser.\n"
    "For a browser that restricts file://, run python -m http.server in the extracted folder.\n"
    "This is NOT an original editable Work project export.\n"
    "See RUNTIME-ASSETS-REPORT.json for captured/missing game resources.\n"
    "Do NOT overwrite the live game with these files.\n"
    "Zombie Outbreak source/gameplay was not modified.\n", encoding="utf-8")
print(json.dumps({"captured": len(status["captured"]), "failed": len(status["failed"]),
  "remaining_identified": len(status["remaining_identified_paths"]), "total_bytes": total}, indent=2))
