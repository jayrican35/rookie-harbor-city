#!/usr/bin/env python3
"""Archive the PUBLIC assets served by the exact ROOKIE: Harbor City published URL.
This is a capture, not a source-project export or a verified offline build.
"""
from __future__ import annotations
import hashlib
import json
import os
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit, unquote
from urllib.request import Request, urlopen

SITE = "https://rookie-harbor-city-jay-20261014.satinyboot35.chatgpt.site/"
OUT = Path("published-game-capture")
OUT.mkdir(exist_ok=True)
MAX_FILES = 150
MAX_FILE_BYTES = 25 * 1024 * 1024
MAX_TOTAL_BYTES = 110 * 1024 * 1024
ORIGIN = urlsplit(SITE).netloc

def get(url: str, limit: int) -> tuple[bytes, str]:
    request = Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; ROOKIE-OwnerBackup/1.0)", "Accept": "*/*"})
    with urlopen(request, timeout=35) as response:
        final = response.url
        data = response.read(limit + 1)
        if len(data) > limit:
            raise ValueError("Response exceeded size limit")
        return data, final

class Resources(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ("script", "img", "audio", "source", "video") and a.get("src"):
            self.urls.append(a["src"])
        if tag == "link" and a.get("href") and (
            a.get("rel") in ("stylesheet", "preload", "modulepreload", "icon")
            or a.get("as") in ("script", "image", "style", "font")
        ):
            self.urls.append(a["href"])

manifest = {"source_url": SITE, "status": "failed", "files": [], "limitations": [
    "A published-website capture is not the original editable Work project.",
    "Runtime-fetched assets and logged-in content may not be included.",
    "Offline gameplay has not been browser-tested."
]}
try:
    data, final_url = get(SITE, MAX_FILE_BYTES)
    if urlsplit(final_url).netloc != ORIGIN:
        raise RuntimeError("Published site redirected to a different host: " + final_url)
    html = data.decode("utf-8", errors="replace")
    if len(data) < 1000 or "ROOKIE" not in html.upper() or "<html" not in html.lower():
        raise RuntimeError("Response does not look like the actual ROOKIE game page")
    (OUT / "original-published-index.html").write_bytes(data)
    manifest["html_sha256"] = hashlib.sha256(data).hexdigest()
    manifest["html_bytes"] = len(data)
    manifest["status"] = "html_captured"
    parser = Resources()
    parser.feed(html)
    found, total = set(), len(data)
    offline = html
    for raw in parser.urls:
        if len(found) >= MAX_FILES:
            break
        if not raw or raw.startswith(("data:", "blob:", "mailto:", "#")):
            continue
        absolute = urljoin(SITE, raw)
        parts = urlsplit(absolute)
        if parts.scheme != "https" or parts.netloc != ORIGIN or absolute in found:
            continue
        found.add(absolute)
        clean = unquote(parts.path).lstrip("/")
        if not clean or ".." in Path(clean).parts:
            continue
        if parts.query:
            clean += "_" + hashlib.sha256(parts.query.encode()).hexdigest()[:10]
        if len(clean) > 180:
            continue
        target = OUT / clean
        try:
            resource, redirected = get(absolute, MAX_FILE_BYTES)
            if urlsplit(redirected).netloc != ORIGIN or total + len(resource) > MAX_TOTAL_BYTES:
                raise RuntimeError("Asset outside capture limit")
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(resource)
            total += len(resource)
            manifest["files"].append({"path": clean, "bytes": len(resource)})
            offline = offline.replace('="' + raw + '"', '="./' + clean + '"')
            offline = offline.replace("='" + raw + "'", "='./" + clean + "'")
        except Exception as exc:
            manifest.setdefault("asset_errors", []).append({"url": raw, "error": str(exc)})
    (OUT / "index.html").write_text(offline, encoding="utf-8")
    manifest["status"] = "captured_not_verified"
    print(f"Captured published HTML: {len(data):,} bytes; linked same-origin assets: {len(manifest['files'])}")
except Exception as exc:
    manifest["error"] = str(exc)
    print("CAPTURE FAILED:", exc)
finally:
    (OUT / "CAPTURE-MANIFEST.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    (OUT / "README.txt").write_text(
        "ROOKIE: Harbor City - published-site recovery attempt\n"
        "This is a capture from the live website, NOT proof of the latest editable project.\n"
        "If status is captured_not_verified, try opening index.html in a desktop browser.\n"
        "If status is failed, see CAPTURE-MANIFEST.json for the reason.\n"
        "Do not overwrite the original game with this capture.\n",
        encoding="utf-8",
    )
if manifest["status"] == "failed":
    raise SystemExit(1)
