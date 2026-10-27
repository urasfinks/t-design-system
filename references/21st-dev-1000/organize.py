#!/usr/bin/env python3
import csv
import re
from pathlib import Path

root = Path(__file__).resolve().parent
manifest = root / "manifest.csv"
with manifest.open(newline="", encoding="utf-8") as handle:
    rows = list(csv.DictReader(handle))
    fields = rows[0].keys()

rules = [
    ("Testimonials", r"testimonial"),
    ("Buttons", r"button"),
    ("Cards", r"card|bento"),
    ("Forms", r"form|input|field|checkbox|radio|select|switch|toggle|picker|upload|otp|calendar|date"),
    ("Navigation", r"nav|menu|sidebar|dock|tabs|pagination"),
    ("Pricing", r"pricing"),
    ("AI chats", r"chat|prompt"),
    ("Dashboards", r"dashboard|chart|table"),
    ("Sign-in", r"sign-in|login|sign-up"),
    ("Features", r"feature"),
    ("Galleries", r"gallery|carousel|slider"),
    ("CTAs", r"cta|banner"),
    ("Heroes", r"hero"),
    ("Shaders", r"shader"),
    ("Text", r"text"),
    ("Footers", r"footer"),
]

def safe(value):
    return re.sub(r"[^a-zA-Z0-9]+", "-", value.lower()).strip("-")

moved = 0
for row in rows:
    if row["category"] != "Misc":
        continue
    slug = row["page_url"].rstrip("/").rsplit("/", 1)[-1]
    category = next((name for name, pattern in rules if re.search(pattern, slug, re.I)), None)
    if not category:
        continue
    source = root / row["file"]
    target = root / "images" / safe(category) / source.name
    target.parent.mkdir(parents=True, exist_ok=True)
    if source != target:
        source.rename(target)
    row["category"] = category
    row["file"] = str(target.relative_to(root))
    moved += 1
with manifest.open("w", newline="", encoding="utf-8") as handle:
    writer = csv.DictWriter(handle, fieldnames=fields)
    writer.writeheader()
    writer.writerows(rows)
print(f"Reclassified: {moved}")
