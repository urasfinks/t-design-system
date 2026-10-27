#!/usr/bin/env python3
"""Проверка спецификаций components.md по архиву 21st.dev.

Exit code 0 только если:
- в каждой из 17 папок категорий есть components.md;
- в каждом документе есть обязательные разделы;
- каждая спецификация компонента содержит статус, приоритет, HTML-каркас,
  состояния, доступность и референсы;
- множество упомянутых .webp точно совпадает с файлами на диске;
- каждый референс указан в документе своей категории (основная группа);
- ни одно упомянутое имя не выдумано.
"""
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent
IMAGES = ROOT / "images"
CATEGORIES = [
    "ai-chats", "buttons", "cards", "ctas", "dashboards", "features",
    "footers", "forms", "galleries", "heroes", "misc", "navigation",
    "pricing", "shaders", "sign-in", "testimonials", "text",
]
REQUIRED_SECTIONS = [
    "Сводная таблица",
    "Общие решения",
    "Спецификации компонентов",
    "Порядок реализации",
    "Контрольный список покрытия",
]
SPEC_FIELDS = {
    "HTML-каркас": re.compile(r"```html\n"),
    "Состояния": re.compile(r"\*\*Состояния\*\*"),
    "Доступность": re.compile(r"\*\*Доступность\*\*"),
    "Референсы": re.compile(r"\*\*Референсы\*\*"),
}
STATUS = re.compile(r"`(existing|extend|new|composition)`")
PRIORITY = re.compile(r"`P[012]`")
WEBP = re.compile(r"[A-Za-z0-9][A-Za-z0-9._-]*\.webp")


def main() -> int:
    errors: list[str] = []
    disk: dict[str, str] = {}
    for category in CATEGORIES:
        folder = IMAGES / category
        if not folder.is_dir():
            errors.append(f"нет папки категории: {category}")
            continue
        for path in folder.glob("*.webp"):
            disk[path.name] = category
    extra = sorted(p.name for p in IMAGES.iterdir() if p.is_dir() and p.name not in CATEGORIES)
    if extra:
        errors.append(f"лишние папки категорий: {extra}")

    mentioned: dict[str, set[str]] = defaultdict(set)
    documents = 0
    specs_total = 0
    for category in CATEGORIES:
        doc = IMAGES / category / "components.md"
        if not doc.is_file():
            errors.append(f"{category}: отсутствует components.md")
            continue
        documents += 1
        text = doc.read_text(encoding="utf-8")
        headings = re.findall(r"^## (.+)$", text, re.M)
        for section in REQUIRED_SECTIONS:
            if not any(h.strip().startswith(section) for h in headings):
                errors.append(f"{category}: нет раздела «{section}»")

        match = re.search(r"^## Спецификации компонентов\s*$(.*?)(?=^## )", text, re.M | re.S)
        body = match.group(1) if match else ""
        specs = re.split(r"^### ", body, flags=re.M)[1:]
        if not specs:
            errors.append(f"{category}: нет ни одной спецификации (### …)")
        specs_total += len(specs)
        for spec in specs:
            title = spec.splitlines()[0].strip()
            for field, pattern in SPEC_FIELDS.items():
                if not pattern.search(spec):
                    errors.append(f"{category} / {title}: нет поля «{field}»")
            if not STATUS.search(spec):
                errors.append(f"{category} / {title}: нет статуса")
            if not PRIORITY.search(spec):
                errors.append(f"{category} / {title}: нет приоритета")
            refs_part = spec.split("**Референсы**", 1)[-1]
            if not WEBP.search(refs_part):
                errors.append(f"{category} / {title}: пустой список референсов")

        for name in WEBP.findall(text):
            mentioned[name].add(category)

    unknown = sorted(n for n in mentioned if n not in disk)
    missing = sorted(n for n in disk if n not in mentioned)
    misplaced = sorted(n for n in disk if n in mentioned and disk[n] not in mentioned[n])
    for name in unknown:
        errors.append(f"несуществующий референс: {name} (в {sorted(mentioned[name])})")
    for name in missing:
        errors.append(f"референс не упомянут: {disk[name]}/{name}")
    for name in misplaced:
        errors.append(f"референс не указан в своей категории: {disk[name]}/{name}")

    if errors:
        limit = int(__import__("os").environ.get("LIMIT", 60))
        for line in errors[:limit]:
            print("FAIL:", line)
        if len(errors) > limit:
            print(f"… и ещё {len(errors) - limit}")
        print(
            f"FAIL: {documents}/17 components.md; {len(mentioned) - len(unknown)} unique references; "
            f"{len(missing)} missing; {len(unknown)} unknown; {len(errors)} errors"
        )
        return 1
    print(
        f"PASS: {documents} components.md; {len(mentioned)} unique references; "
        f"0 missing; 0 unknown; {specs_total} component specs"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
