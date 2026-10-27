#!/usr/bin/env python3
import csv
from collections import Counter
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent
with (root / "manifest.csv").open(newline="", encoding="utf-8") as handle:
    rows = list(csv.DictReader(handle))
assert len(rows) == 1000, f"Expected 1000 rows, got {len(rows)}"
assert all(row["status"] == "ok" for row in rows), "Manifest contains failures"
assert len({row["page_url"] for row in rows}) == 1000, "Duplicate component URLs"
assert len({row["file"] for row in rows}) == 1000, "Duplicate file paths"
for index, row in enumerate(rows, 1):
    path = root / row["file"]
    assert path.is_file() and path.stat().st_size > 0, f"Missing or empty: {path}"
    with Image.open(path) as image:
        image.verify()
files = list((root / "images").glob("*/*.webp"))
assert len(files) == 1000, f"Expected 1000 images, got {len(files)}"
categories = Counter(row["category"] for row in rows)
size = sum(path.stat().st_size for path in files)
print(f"Verified: {len(files)} valid images, {len(rows)} unique components")
print(f"Size: {size / 1024 / 1024:.1f} MiB; categories: {len(categories)}")
for name, count in categories.most_common():
    print(f"{count:4}  {name}")
