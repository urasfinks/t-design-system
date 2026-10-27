#!/usr/bin/env python3
"""Collect a deterministic, UI-focused sample of public 21st.dev previews."""

import argparse
import csv
import hashlib
import html
import random
import re
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SITEMAP = ROOT / ".sitemap.xml"
MANIFEST = ROOT / "manifest.csv"
IMAGES = ROOT / "images"
USER_AGENT = "Mozilla/5.0 (compatible; KimiWork/1.0; +https://21st.dev/)"

POSITIVE = re.compile(
    r"accordion|alert|avatar|badge|banner|bento|button|calendar|card|carousel|"
    r"chart|checkbox|chip|command|dashboard|date|dialog|dock|drawer|dropdown|"
    r"field|filter|form|input|kbd|login|menu|modal|nav|notification|otp|"
    r"pagination|picker|pricing|progress|radio|search|select|sidebar|sign-in|"
    r"sign-up|slider|stepper|switch|table|tabs|testimonial|timeline|toast|"
    r"toggle|toolbar|tooltip|upload|wizard",
    re.I,
)
NEGATIVE = re.compile(r"ascii|background|footer|hero|loader|shader|wallpaper", re.I)


def request(url, attempts=4):
    for attempt in range(attempts):
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        try:
            with urllib.request.urlopen(req, timeout=35) as response:
                return response.read(), response.headers.get("Content-Type", "")
        except urllib.error.HTTPError as error:
            if error.code not in (429, 500, 502, 503, 504) or attempt == attempts - 1:
                raise
            retry_after = error.headers.get("Retry-After")
            delay = float(retry_after) if retry_after and retry_after.isdigit() else 2 ** attempt
            time.sleep(min(delay, 20))
        except (urllib.error.URLError, TimeoutError):
            if attempt == attempts - 1:
                raise
            time.sleep(2 ** attempt)
    raise RuntimeError("Unreachable")


def safe_name(value):
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value.lower()).strip("-")
    return value[:70] or "misc"


def load_candidates():
    if not SITEMAP.exists():
        data, _ = request("https://21st.dev/sitemap.xml")
        SITEMAP.write_bytes(data)
    root = ET.parse(SITEMAP).getroot()
    urls = [
        node.text.strip()
        for node in root.iter()
        if node.tag.endswith("loc") and node.text and "/components/" in node.text and "/@" in node.text
    ]
    urls = sorted(set(urls))
    relevant = [url for url in urls if POSITIVE.search(url.rsplit("/", 1)[-1]) and not NEGATIVE.search(url.rsplit("/", 1)[-1])]
    return urls, relevant


def choose(urls, count):
    # Even coverage of the catalog's publication timeline, with deterministic tie-breaking.
    if count >= len(urls):
        return urls
    step = len(urls) / count
    return [urls[min(len(urls) - 1, int((i + 0.5) * step))] for i in range(count)]


def collect(page_url):
    parsed = urllib.parse.urlparse(page_url)
    slug = parsed.path.rstrip("/").rsplit("/", 1)[-1]
    author = parsed.path.split("/")[1].lstrip("@")
    try:
        raw, _ = request(page_url)
        page = raw.decode("utf-8", "replace")
        match = re.search(r'imageSrcSet="(https://cdn\.21st\.dev/cdn-cgi/image/[^"]+? 640w)', page)
        if not match:
            match = re.search(r'(https://cdn\.21st\.dev/cdn-cgi/image/[^\s"&]+?/https://cdn\.21st\.dev/[^\s"&]+) 640w', page)
        if not match:
            return {"page_url": page_url, "status": "no-preview"}
        image_url = html.unescape(match.group(1)).removesuffix(" 640w")
        category_match = re.search(r"<dt[^>]*>Category</dt><dd[^>]*>(.*?)</dd>", page)
        category = html.unescape(re.sub(r"<[^>]+>", "", category_match.group(1))).strip() if category_match else "Misc"
        name_match = re.search(r'<script type="application/ld\+json">(\{"@context":"https://schema.org","@type":"SoftwareSourceCode".*?\})</script>', page)
        name = slug.replace("-", " ").title()
        if name_match:
            import json
            name = json.loads(name_match.group(1)).get("name", name)
        image_data, content_type = request(image_url)
        if not image_data or ("image" not in content_type and not image_data.startswith((b"\x89PNG", b"RIFF", b"\xff\xd8"))):
            return {"page_url": page_url, "status": "invalid-image"}
        digest = hashlib.sha1(page_url.encode()).hexdigest()[:8]
        category_dir = IMAGES / safe_name(category)
        category_dir.mkdir(parents=True, exist_ok=True)
        filename = f"{safe_name(author)}--{safe_name(slug)}--{digest}.webp"
        target = category_dir / filename
        target.write_bytes(image_data)
        return {
            "name": name,
            "author": author,
            "category": category,
            "page_url": page_url,
            "image_url": image_url,
            "file": str(target.relative_to(ROOT)),
            "bytes": len(image_data),
            "status": "ok",
        }
    except Exception as error:
        return {"page_url": page_url, "status": f"error: {type(error).__name__}: {error}"}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=1000)
    parser.add_argument("--workers", type=int, default=10)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    all_urls, relevant = load_candidates()
    selected = choose(relevant, args.count)
    if MANIFEST.exists():
        with MANIFEST.open(newline="", encoding="utf-8") as handle:
            failed = {row["page_url"] for row in csv.DictReader(handle) if row.get("status") != "ok"}
        if failed:
            replacements = [url for url in relevant if url not in selected][:len(failed)]
            selected = [url for url in selected if url not in failed] + replacements
            print(f"Replaced {len(replacements)} unavailable components", flush=True)
    print(f"Catalog: {len(all_urls)} components; UI candidates: {len(relevant)}; selected: {len(selected)}", flush=True)
    if args.dry_run:
        return
    IMAGES.mkdir(parents=True, exist_ok=True)
    existing = {}
    if MANIFEST.exists():
        with MANIFEST.open(newline="", encoding="utf-8") as handle:
            for row in csv.DictReader(handle):
                if row.get("status") == "ok" and (ROOT / row["file"]).exists():
                    existing[row["page_url"]] = row
    todo = [url for url in selected if url not in existing]
    print(f"Already saved: {len(existing)}; remaining: {len(todo)}", flush=True)
    results = list(existing.values())
    fields = ["name", "author", "category", "page_url", "image_url", "file", "bytes", "status"]

    def checkpoint():
        ordered = sorted(results, key=lambda row: (row.get("category", ""), row.get("name", ""), row["page_url"]))
        with MANIFEST.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="ignore")
            writer.writeheader()
            writer.writerows(ordered)

    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(collect, url): url for url in todo}
        for index, future in enumerate(as_completed(futures), 1):
            result = future.result()
            results.append(result)
            if index % 25 == 0 or index == len(todo):
                checkpoint()
                ok = sum(row["status"] == "ok" for row in results)
                print(f"Processed {index}/{len(todo)}; valid images: {ok}", flush=True)
    checkpoint()
    ok = sum(row["status"] == "ok" for row in results)
    print(f"Finished: {ok} images; failures: {len(results) - ok}; manifest: {MANIFEST}", flush=True)


if __name__ == "__main__":
    main()
