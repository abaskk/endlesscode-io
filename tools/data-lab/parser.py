"""
Parser V3 — Correct hierarchy + zero data loss

UI Model (user-specified):
  TOPIC       = top_level_topic (one per HTML file, e.g. "sliding-window")
  SUBSECTION  = H2 headers      (e.g. "一、定长滑动窗口")
  SUBTOPIC    = H3 headers      (e.g. "§1.1 基础")
  
H4 labels become TAGS on problems:
  基础     → CORE
  进阶     → ADVANCED
  选做     → OPTIONAL
  思维题   → THINKING

Extraction: by <a href="leetcode.cn/problems/..."> — not regex on text.
Target: 3,509 / 3,509 problem links (zero loss).
"""

import json
import re
import csv
import time
from pathlib import Path
from bs4 import BeautifulSoup, Tag

# ── Config ──────────────────────────────────────────────────────────────────
MAPPING_FILE = "source/taxonomy_mapping.csv"
HTML_DIR     = "source/raw_galaxy_pages/full-practice"
LCID_FILE    = "source/lcid.json"
OUTPUT_FILE  = "generated/taxonomy_graph.json"

# ── H4 title → tag mapping ─────────────────────────────────────────────────
H4_TAG_MAP = {
    "基础": "CORE",
    "进阶": "ADVANCED",
    "选做": "OPTIONAL",
    "思维题": "THINKING",
}

# ── Translation dictionary ──────────────────────────────────────────────────
TRANSLATIONS_FILE = Path(__file__).parent / "source/translations.json"
DESC_TRANSLATIONS_FILE = Path(__file__).parent / "source/description_translations.json"

with open(TRANSLATIONS_FILE, "r", encoding="utf-8") as _tf:
    TRANSLATIONS: dict[str, str] = json.load(_tf)

try:
    with open(DESC_TRANSLATIONS_FILE, "r", encoding="utf-8") as _df:
        DESC_TRANSLATIONS: dict[str, str] = json.load(_df)
except FileNotFoundError:
    print("Warning: description_translations.json not found, descriptions will remain in Chinese.")
    DESC_TRANSLATIONS = {}

# Chinese numeral → Roman numeral mapping (kept for reference or other uses)
_ZH_NUMERAL_MAP = {
    "零": "0", "一": "I", "二": "II", "三": "III", "四": "IV",
    "五": "V", "六": "VI", "七": "VII", "八": "VIII", "九": "IX",
    "十": "X", "十一": "XI", "十二": "XII", "十三": "XIII", "十四": "XIV",
    "十五": "XV", "十六": "XVI", "十七": "XVII", "十八": "XVIII",
}

# Regex patterns for prefix extraction
# Matches "一、", "二、", etc.
_ZH_PREFIX_RE = re.compile(
    r"^((?:" + "|".join(sorted(_ZH_NUMERAL_MAP.keys(), key=len, reverse=True)) + r")、)\s*"
)
# Matches "§1.1 ", "§2.3.1 "
_SECTION_PREFIX_RE = re.compile(r"^(§\d+(\.\d+)*\s*)")
# Matches "I. ", "II. ", "IV. " (if already in source)
_ROMAN_PREFIX_RE = re.compile(r"^([IVX]+\.\s*)")
# Matches "专题： "
_SPECIAL_PREFIX_RE = re.compile(r"^(专题：\s*)")

def translate(text: str) -> str:
    """Translate a Chinese title to English using the dictionary.
    
    Handles and STRIPS prefix patterns to clean up the UI:
      - 一、二分查找  → Binary Search (Stripped Roman numeral)
      - §1.1 基础     → Basics (Stripped Section ID)
      - 专题：前后缀分解 → Prefix-Suffix Decomposition (Stripped Special prefix)
    """
    original = text.strip()
    prefix_en = ""
    core = original

    # 1. Strip Chinese numeral prefix (一、 二、 etc.)
    m = _ZH_PREFIX_RE.match(core)
    if m:
        core = core[m.end():]

    # 2. Strip §X.Y prefix
    m = _SECTION_PREFIX_RE.match(core)
    if m:
        core = core[m.end():]

    # 3. Strip Roman numeral prefix if present
    m = _ROMAN_PREFIX_RE.match(core)
    if m:
        core = core[m.end():]

    # 4. Strip "专题：" prefix
    m = _SPECIAL_PREFIX_RE.match(core)
    if m:
        core = core[m.end():]

    # Look up the core term
    if core in TRANSLATIONS:
        return TRANSLATIONS[core].strip()
    
    # Fallback: return core (stripped of prefixes)
    return core.strip()

def normalize_key(text: str) -> str:
    """Normalize text for dictionary lookup by stripping invisible chars and standardizing whitespace."""
    # Remove zero-width spaces (\u200b), zero-width joiners, text flow chars, etc.
    # Also remove common Chinese punctuation that might vary slightly if not consistent
    text = text.replace("\u200b", "").replace("\ufeff", "").replace("\u200c", "").replace("\u200d", "")
    # Normalize whitespace: collapse multiple spaces/newlines to single space
    return " ".join(text.split())

# Create a normalized lookup dictionary
NORMALIZED_DESC_TRANSLATIONS = {normalize_key(k): v for k, v in DESC_TRANSLATIONS.items()}

def translate_description(text: str) -> str:
    """Translate a Chinese description to English using the dictionary."""
    if not text:
        return ""
    
    # Try exact match first
    if text.strip() in DESC_TRANSLATIONS:
        return DESC_TRANSLATIONS[text.strip()]

    # Try normalized match
    norm_text = normalize_key(text)
    if norm_text in NORMALIZED_DESC_TRANSLATIONS:
        return NORMALIZED_DESC_TRANSLATIONS[norm_text]

    return text.strip()

def h4_to_tag(title: str) -> str | None:
    """Map an H4 title to a tag string, or None if it's not a tag-type header."""
    for keyword, tag in H4_TAG_MAP.items():
        if keyword in title:
            return tag
    return None

# ── LCID loader ─────────────────────────────────────────────────────────────
def load_lcid(path: str) -> tuple[dict, dict]:
    """Load LCID and return (id_map, slug_map)."""
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    slug_map = {}
    for pid, meta in data.items():
        if "titleSlug" in meta:
            slug_map[meta["titleSlug"]] = {**meta, "id": pid}
            
    return data, slug_map

# ── Problem extraction ──────────────────────────────────────────────────────
def extract_problem(li: Tag, lcid_maps: tuple[dict, dict], extra_tag: str | None = None) -> dict | None:
    """Extract a problem from an <li> tag using its <a href> link."""
    lcid_by_id, lcid_by_slug = lcid_maps

    link = li.find("a", href=re.compile(r"leetcode\.cn/problems/"))
    if not link:
        return None

    href = link["href"]
    slug_match = re.search(r"/problems/([^/]+)/?", href)
    if not slug_match:
        return None
    slug = slug_match.group(1)

    # STRICT FILTER: Must exist in LCID dataset (by slug)
    if slug not in lcid_by_slug:
        return None

    meta = lcid_by_slug[slug]
    pid = meta["id"]
    title = meta.get("title", link.get_text().strip())
    difficulty = meta.get("difficulty", "Unknown")
    is_premium = meta.get("paidOnly", False)
    
    rating = None
    text = li.get_text()
    for m in re.findall(r"\b(\d{3,4})\b", text):
        v = int(m)
        if 800 <= v <= 3500 and (pid is None or m != pid):
            rating = v
            break

    # Tags
    tags = []
    if extra_tag:
        tags.append(extra_tag)

    return {
        "id": pid or slug,
        "title": title,
        "slug": slug,
        "rating": rating,
        "difficulty": difficulty,
        "is_premium": is_premium,
        "tags": tags,
    }

# ── Core hierarchy builder ──────────────────────────────────────────────────
def collect_until_next(tag: Tag, stop_names: list[str]) -> list[Tag]:
    """Collect all siblings after `tag` until one matches stop_names."""
    collected = []
    for sib in tag.next_siblings:
        if isinstance(sib, Tag) and sib.name in stop_names:
            break
        if isinstance(sib, Tag):
            collected.append(sib)
    return collected

def extract_description(tags: list[Tag]) -> tuple[str, str]:
    """Pull description text from <p> and <blockquote> tags."""
    zh_parts = []
    for t in tags:
        if t.name in ("p", "blockquote"):
            text = t.get_text().strip()
            if text and len(text) > 5:
                zh_parts.append(text)
    zh = "\n".join(zh_parts)
    en_parts = [translate_description(part) for part in zh_parts]
    en = "\n".join(en_parts)
    return zh, en

def extract_problems_from_tags(tags: list[Tag], lcid: tuple[dict, dict], extra_tag: str | None = None) -> list[dict]:
    """Extract problems from <ul>/<ol> tags in the given list."""
    problems = []
    for t in tags:
        if t.name in ("ul", "ol"):
            for li in t.find_all("li", recursive=False):
                prob = extract_problem(li, lcid, extra_tag)
                if prob:
                    problems.append(prob)
    return problems

def parse_html(html_path: str, lcid: tuple[dict, dict]) -> list[dict]:
    """
    Parse one HTML file into the 3-level UI model:
      sections    = H2 headers  (SUBSECTION in UI)
      subtopics   = H3 headers  (SUBTOPIC in UI)
      H4 headers  → tags on problems
    """
    with open(html_path, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f.read(), "html.parser")

    sections = []  # list of H2-level sections

    for h2 in soup.find_all("h2"):
        h2_title = h2.get_text().strip()
        # Skip non-content H2s
        if any(skip in h2_title for skip in ("关联题单", "算法题单", "思考题", "思考")):
            continue

        # Everything between this H2 and the next H2
        h2_children = collect_until_next(h2, ["h2"])

        # Description: <p>/<blockquote> before any <h3> or problem list
        desc_tags = []
        for t in h2_children:
            if t.name in ("h3", "h4", "ul", "ol"):
                break
            desc_tags.append(t)
        desc_zh, desc_en = extract_description(desc_tags)

        # Find H3s within this H2
        h3s = [t for t in h2_children if t.name == "h3"]

        subtopics = []
        if h3s:
            # H2 has H3 children → build subtopics
            for h3 in h3s:
                h3_title = h3.get_text().strip()
                h3_children = collect_until_next(h3, ["h2", "h3"])

                # Check for H4s inside this H3
                h4s = [t for t in h3_children if t.name == "h4"]

                if h4s:
                    # H4 exist → collapse into tags on the H3's problems
                    h3_problems = []
                    # Also grab any problems between H3 and first H4
                    pre_h4_tags = []
                    for t in h3_children:
                        if t.name == "h4":
                            break
                        pre_h4_tags.append(t)
                    h3_problems.extend(extract_problems_from_tags(pre_h4_tags, lcid))

                    for h4 in h4s:
                        h4_title = h4.get_text().strip()
                        tag = h4_to_tag(h4_title)
                        h4_children = collect_until_next(h4, ["h2", "h3", "h4"])
                        h3_problems.extend(
                            extract_problems_from_tags(h4_children, lcid, extra_tag=tag)
                        )

                    h3_desc_tags = []
                    for t in h3_children:
                        if t.name in ("h4", "ul", "ol"):
                            break
                        h3_desc_tags.append(t)
                    h3_desc_zh, h3_desc_en = extract_description(h3_desc_tags)

                    subtopics.append({
                        "title": translate(h3_title),
                        "title_zh": h3_title,
                        **({"description": h3_desc_en, "description_zh": h3_desc_zh} if h3_desc_zh else {}),
                        "problems": h3_problems,
                    })
                else:
                    # No H4 — straightforward H3 with problems
                    h3_desc_tags = []
                    for t in h3_children:
                        if t.name in ("ul", "ol"):
                            break
                        h3_desc_tags.append(t)
                    h3_desc_zh, h3_desc_en = extract_description(h3_desc_tags)

                    h3_problems = extract_problems_from_tags(h3_children, lcid)
                    subtopics.append({
                        "title": translate(h3_title),
                        "title_zh": h3_title,
                        **({"description": h3_desc_en, "description_zh": h3_desc_zh} if h3_desc_zh else {}),
                        "problems": h3_problems,
                    })

            # Also grab any problems between H2 and first H3
            pre_h3_problems = []
            pre_h3_tags = []
            for t in h2_children:
                if t.name == "h3":
                    break
                pre_h3_tags.append(t)
            pre_h3_problems = extract_problems_from_tags(pre_h3_tags, lcid)

            section = {
                "title": translate(h2_title),
                "title_zh": h2_title,
                **({"description": desc_en, "description_zh": desc_zh} if desc_zh else {}),
                "subtopics": subtopics,
                "problems": pre_h3_problems,  # Problems directly under H2 (before any H3)
            }
        else:
            # No H3 — H2 has problems directly (Pattern A: grid_graph, strings)
            h2_problems = extract_problems_from_tags(h2_children, lcid)
            section = {
                "title": translate(h2_title),
                "title_zh": h2_title,
                **({"description": desc_en, "description_zh": desc_zh} if desc_zh else {}),
                "subtopics": [],
                "problems": h2_problems,
            }

        sections.append(section)

    return sections

# ── Main pipeline ───────────────────────────────────────────────────────────
def main():
    start = time.time()
    print("🚀 Parser V3 — Zero Data Loss\n")

    # Load LCID
    lcid = load_lcid(LCID_FILE)
    print(f"✓ LCID: {len(lcid)} problems\n")

    # Load CSV mapping for topic metadata
    with open(MAPPING_FILE, "r", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    # Build unique topic entries
    topics_meta = {}
    for row in rows:
        tid = row["top_level_topic"]
        if tid not in topics_meta:
            topics_meta[tid] = {
                "id": tid,
                "group": row["visual_group"],
                "title": tid.replace("-", " ").title(),
                "file": row["source_file"],
            }

    # Process each HTML file
    output = []
    total_links = 0
    total_unique = set()

    for tid, meta in topics_meta.items():
        html_path = Path(HTML_DIR) / meta["file"]
        if not html_path.exists():
            print(f"⚠  Missing: {meta['file']}")
            continue

        sections = parse_html(str(html_path), lcid)

        # Count
        def count(secs):
            n = 0
            slugs = set()
            for s in secs:
                for p in s.get("problems", []):
                    n += 1
                    slugs.add(p["slug"])
                for st in s.get("subtopics", []):
                    for p in st.get("problems", []):
                        n += 1
                        slugs.add(p["slug"])
            return n, slugs

        n, slugs = count(sections)
        total_links += n
        total_unique.update(slugs)

        print(f"📄 {meta['file']:30s}  sections:{len(sections):2d}  problems:{n:4d}  unique:{len(slugs):4d}")

        output.append({
            "id": tid,
            "group": meta["group"],
            "title": meta["title"],
            "sections": sections,
        })

    # Write output
    out_path = Path(OUTPUT_FILE)
    out_path.parent.mkdir(exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    elapsed = time.time() - start
    print(f"\n{'='*60}")
    print(f"✅ Parser V3 complete in {elapsed:.2f}s")
    print(f"{'='*60}")
    print(f"Topics:          {len(output)}")
    print(f"Problem links:   {total_links}  (target: 3509)")
    print(f"Unique slugs:    {len(total_unique)}  (target: 2655)")
    print(f"Output:          {out_path}")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
