#!/usr/bin/env python3
"""
Backfill event-derived skill hints into support_hints.json.

Fetches each support card's page from GameTora, reads the event_skills
array from __NEXT_DATA__.pageProps.itemData, resolves skill IDs to names
via skills_all.json, and merges them into SupportHints.

Usage:
    python scripts/backfill_event_hints.py [--dry-run]
"""
import json
import re
import sys
import time
import random
import argparse
from pathlib import Path

# Fix Windows console encoding for Unicode characters like ○/◎
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")

try:
    import requests
except ImportError:
    print("pip install requests")
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
HINTS_PATH = ROOT / "assets" / "support_hints.json"
SKILLS_PATH = ROOT / "assets" / "skills_all.json"
BASE_URL = "https://gametora.com/umamusume/supports"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "text/html",
}


def load_skill_name_map() -> dict[str, str]:
    """Load skill ID → English name map from skills_all.json."""
    name_map = {}
    if not SKILLS_PATH.exists():
        print(f"WARN: {SKILLS_PATH} not found, skill names will be empty")
        return name_map
    with open(SKILLS_PATH, "r", encoding="utf-8") as f:
        skills = json.load(f)
    for item in skills:
        if not isinstance(item, dict):
            continue
        sid = item.get("id") or item.get("skill_id") or item.get("skillId")
        if sid is None:
            continue
        name = item.get("name_en") or item.get("enname") or item.get("name") or item.get("jpname") or ""
        if name:
            name_map[str(sid)] = name
    return name_map


def extract_next_data(html: str):
    """Extract __NEXT_DATA__ JSON from HTML."""
    m = re.search(r'<script\s+id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL)
    if not m:
        return None
    try:
        return json.loads(m.group(1))
    except json.JSONDecodeError:
        return None


def extract_event_skill_ids(next_data: dict) -> list[int]:
    """Get event_skills IDs from __NEXT_DATA__."""
    props = next_data.get("props", {}).get("pageProps", {})
    item = props.get("itemData", {})
    event_skills = item.get("event_skills", [])
    if isinstance(event_skills, list):
        return [s for s in event_skills if isinstance(s, int)]
    return []


def merge_hints(existing: list, event_skills: list[dict]) -> tuple[list, int]:
    """Add event hints to existing SupportHints. Returns (merged, count_added)."""
    known = set()
    for h in existing:
        if isinstance(h, dict):
            sid = h.get("SkillId", "")
            name = h.get("Name", "")
            if sid:
                known.add(str(sid))
            if name:
                known.add(name)
        elif isinstance(h, str):
            known.add(h)

    added = 0
    for skill in event_skills:
        sid = skill["SkillId"]
        name = skill["Name"]
        if sid and str(sid) in known:
            continue
        if name and name in known:
            continue
        existing.append(skill)
        if sid:
            known.add(str(sid))
        if name:
            known.add(name)
        added += 1
    return existing, added


def main():
    parser = argparse.ArgumentParser(description="Backfill event hints into support_hints.json")
    parser.add_argument("--dry-run", action="store_true", help="Don't write changes")
    parser.add_argument("--delay", type=float, default=1.0, help="Delay between requests (seconds)")
    args = parser.parse_args()

    skill_names = load_skill_name_map()
    print(f"Loaded {len(skill_names)} skill names")

    with open(HINTS_PATH, "r", encoding="utf-8") as f:
        cards = json.load(f)

    total = len(cards)
    total_added = 0
    cards_updated = 0
    errors = 0
    session = requests.Session()
    session.headers.update(HEADERS)

    for i, card in enumerate(cards, 1):
        slug = card.get("SupportSlug", "")
        card_id = card.get("SupportId", "")
        name = card.get("SupportName", slug)

        if not slug and not card_id:
            print(f"[{i}/{total}] SKIP {name} — no slug or id")
            continue

        url = f"{BASE_URL}/{slug}" if slug else f"{BASE_URL}/{card_id}"

        try:
            resp = session.get(url, timeout=15)
            if resp.status_code != 200:
                print(f"[{i}/{total}] ERROR {name} — HTTP {resp.status_code}")
                errors += 1
                continue

            next_data = extract_next_data(resp.text)
            if not next_data:
                print(f"[{i}/{total}] WARN {name} — no __NEXT_DATA__")
                errors += 1
                continue

            event_skill_ids = extract_event_skill_ids(next_data)
            if not event_skill_ids:
                print(f"[{i}/{total}] OK {name} — no event skills")
                continue

            # Resolve IDs to names
            event_skills = []
            for sid in event_skill_ids:
                skill_name = skill_names.get(str(sid), "")
                if skill_name:
                    event_skills.append({
                        "SkillId": str(sid),
                        "Name": skill_name,
                        "HintLevel": None,
                        "Source": "event",
                    })

            if not event_skills:
                unresolved = [str(s) for s in event_skill_ids]
                print(f"[{i}/{total}] WARN {name} — {len(event_skill_ids)} event skills but no names resolved: {unresolved}")
                continue

            card["SupportHints"], added = merge_hints(card.get("SupportHints", []), event_skills)
            if added > 0:
                cards_updated += 1
                total_added += added
                names = [s["Name"] for s in event_skills[:5]]
                print(f"[{i}/{total}] UPDATED {name} — +{added} event hints: {names}")
            else:
                print(f"[{i}/{total}] OK {name} — {len(event_skills)} event hints already present")

        except Exception as e:
            print(f"[{i}/{total}] ERROR {name} — {e}")
            errors += 1

        # Rate limit
        time.sleep(args.delay + random.uniform(0, 0.3))

    print(f"\nDone: {cards_updated} cards updated, {total_added} hints added, {errors} errors")

    if not args.dry_run and total_added > 0:
        with open(HINTS_PATH, "w", encoding="utf-8") as f:
            json.dump(cards, f, ensure_ascii=False, indent=2)
        print(f"Written to {HINTS_PATH}")
    elif args.dry_run:
        print("(dry run — no changes written)")


if __name__ == "__main__":
    main()
