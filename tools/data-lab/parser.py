"""
Parser V3 — CLI Tool
"""

import json
import re
import csv
import time
import argparse
import requests
from pathlib import Path
from bs4 import BeautifulSoup, Tag

# ── Config ──────────────────────────────────────────────────────────────────
MAPPING_FILE = "source/taxonomy_mapping.csv"
URLS_FILE    = "source/urls.json"
HTML_DIR     = "source/raw_pages/full-practice"
LCID_FILE    = "source/lcid.json"
OUTPUT_FILE  = "generated/taxonomy_graph.json"
FLAT_FILE    = "generated/taxonomy_flat.json"

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
_ZH_PREFIX_RE = re.compile(
    r"^((?:" + "|".join(sorted(_ZH_NUMERAL_MAP.keys(), key=len, reverse=True)) + r")、)\s*"
)
_SECTION_PREFIX_RE = re.compile(r"^(§\d+(\.\d+)*\s*)")
_ROMAN_PREFIX_RE = re.compile(r"^([IVX]+\.\s*)")
_SPECIAL_PREFIX_RE = re.compile(r"^(专题：\s*)")

def translate(text: str) -> str:
    original = text.strip()
    core = original
    m = _ZH_PREFIX_RE.match(core)
    if m: core = core[m.end():]
    m = _SECTION_PREFIX_RE.match(core)
    if m: core = core[m.end():]
    m = _ROMAN_PREFIX_RE.match(core)
    if m: core = core[m.end():]
    m = _SPECIAL_PREFIX_RE.match(core)
    if m: core = core[m.end():]

    if core in TRANSLATIONS:
        return TRANSLATIONS[core].strip()
    return core.strip()

def normalize_key(text: str) -> str:
    text = text.replace("\u200b", "").replace("\ufeff", "").replace("\u200c", "").replace("\u200d", "")
    return " ".join(text.split())

NORMALIZED_DESC_TRANSLATIONS = {normalize_key(k): v for k, v in DESC_TRANSLATIONS.items()}

def translate_description(text: str) -> str:
    if not text: return ""
    if text.strip() in DESC_TRANSLATIONS: return DESC_TRANSLATIONS[text.strip()]
    norm_text = normalize_key(text)
    if norm_text in NORMALIZED_DESC_TRANSLATIONS: return NORMALIZED_DESC_TRANSLATIONS[norm_text]
    return text.strip()

def h4_to_tag(title: str) -> str | None:
    for keyword, tag in H4_TAG_MAP.items():
        if keyword in title: return tag
    return None

def load_lcid(path: str) -> tuple[dict, dict]:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    slug_map = {}
    for pid, meta in data.items():
        if "titleSlug" in meta:
            slug_map[meta["titleSlug"]] = {**meta, "id": pid}
    return data, slug_map

def extract_problem(li: Tag, lcid_maps: tuple[dict, dict], extra_tag: str | None = None) -> dict | None:
    lcid_by_id, lcid_by_slug = lcid_maps
    link = li.find("a", href=re.compile(r"leetcode\.cn/problems/"))
    if not link: return None

    href = link["href"]
    slug_match = re.search(r"/problems/([^/]+)/?", href)
    if not slug_match: return None
    slug = slug_match.group(1)

    if slug not in lcid_by_slug: return None

    meta = lcid_by_slug[slug]
    pid = meta["id"]
    title = meta.get("title", link.get_text().strip())
    difficulty = meta.get("difficulty", "Unknown")
    is_premium = meta.get("paidOnly", False)
    
    rating = None
    text = li.get_text()
    for m in re.findall(r"\\b(\d{3,4})\\b", text):
        v = int(m)
        if 800 <= v <= 3500 and (pid is None or m != pid):
            rating = v
            break

    tags = []
    if extra_tag: tags.append(extra_tag)

    return {
        "id": pid or slug,
        "title": title,
        "slug": slug,
        "rating": rating,
        "difficulty": difficulty,
        "is_premium": is_premium,
        "tags": tags,
    }

def collect_until_next(tag: Tag, stop_names: list[str]) -> list[Tag]:
    collected = []
    for sib in tag.next_siblings:
        if isinstance(sib, Tag) and sib.name in stop_names: break
        if isinstance(sib, Tag): collected.append(sib)
    return collected

def extract_description(tags: list[Tag]) -> tuple[str, str]:
    zh_parts = []
    for t in tags:
        if t.name in ("p", "blockquote"):
            text = t.get_text().strip()
            if text and len(text) > 5: zh_parts.append(text)
    if not zh_parts: return "", ""
    zh = "\n".join(zh_parts)
    en_parts = [translate_description(part) for part in zh_parts]
    return zh, "\n".join(en_parts)

def extract_problems_from_tags(tags: list[Tag], lcid: tuple[dict, dict], extra_tag: str | None = None) -> list[dict]:
    problems = []
    for t in tags:
        if t.name in ("ul", "ol"):
            for li in t.find_all("li", recursive=False):
                prob = extract_problem(li, lcid, extra_tag)
                if prob: problems.append(prob)
    return problems

def parse_html(html_path: str, lcid: tuple[dict, dict]) -> list[dict]:
    with open(html_path, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f.read(), "html.parser")

    sections = []
    for h2 in soup.find_all("h2"):
        h2_title = h2.get_text().strip()
        if any(skip in h2_title for skip in ("关联题单", "算法题单", "思考题", "思考")): continue

        h2_children = collect_until_next(h2, ["h2"])
        desc_tags = []
        for t in h2_children:
            if t.name in ("h3", "h4", "ul", "ol"): break
            desc_tags.append(t)
        desc_zh, desc_en = extract_description(desc_tags)

        h3s = [t for t in h2_children if t.name == "h3"]
        subtopics = []
        
        if h3s:
            for h3 in h3s:
                h3_title = h3.get_text().strip()
                h3_children = collect_until_next(h3, ["h2", "h3"])
                h4s = [t for t in h3_children if t.name == "h4"]

                if h4s:
                    h3_problems = []
                    pre_h4_tags = []
                    for t in h3_children:
                        if t.name == "h4": break
                        pre_h4_tags.append(t)
                    h3_problems.extend(extract_problems_from_tags(pre_h4_tags, lcid))

                    for h4 in h4s:
                        h4_title = h4.get_text().strip()
                        tag = h4_to_tag(h4_title)
                        h4_children = collect_until_next(h4, ["h2", "h3", "h4"])
                        h3_problems.extend(extract_problems_from_tags(h4_children, lcid, extra_tag=tag))
                    
                    h3_desc_tags = []
                    for t in h3_children:
                        if t.name in ("h4", "ul", "ol"): break
                        h3_desc_tags.append(t)
                    h3_desc_zh, h3_desc_en = extract_description(h3_desc_tags)

                    subtopics.append({
                        "title": translate(h3_title),
                        "title_zh": h3_title,
                        **({"description": h3_desc_en, "description_zh": h3_desc_zh} if h3_desc_zh else {}),
                        "problems": h3_problems,
                    })
                else:
                    h3_desc_tags = []
                    for t in h3_children:
                        if t.name in ("ul", "ol"): break
                        h3_desc_tags.append(t)
                    h3_desc_zh, h3_desc_en = extract_description(h3_desc_tags)
                    h3_problems = extract_problems_from_tags(h3_children, lcid)
                    subtopics.append({
                        "title": translate(h3_title),
                        "title_zh": h3_title,
                        **({"description": h3_desc_en, "description_zh": h3_desc_zh} if h3_desc_zh else {}),
                        "problems": h3_problems,
                    })
            
            pre_h3_tags = []
            for t in h2_children:
                if t.name == "h3": break
                pre_h3_tags.append(t)
            pre_h3_problems = extract_problems_from_tags(pre_h3_tags, lcid)
            
            sections.append({
                "title": translate(h2_title),
                "title_zh": h2_title,
                **({"description": desc_en, "description_zh": desc_zh} if desc_zh else {}),
                "subtopics": subtopics,
                "problems": pre_h3_problems,
            })
        else:
            h2_problems = extract_problems_from_tags(h2_children, lcid)
            sections.append({
                "title": translate(h2_title),
                "title_zh": h2_title,
                **({"description": desc_en, "description_zh": desc_zh} if desc_zh else {}),
                "subtopics": [],
                "problems": h2_problems,
            })
            
    return sections

# ── CLI Commands ────────────────────────────────────────────────────────────

def cmd_download():
    """Download raw HTML pages from LeetCode using urls.json."""
    print("🚀 Downloading raw pages...")
    
    if not Path(URLS_FILE).exists():
        print(f"❌ Error: {URLS_FILE} not found.")
        return

    with open(URLS_FILE, "r") as f:
        urls = json.load(f)

    out_dir = Path(HTML_DIR)
    out_dir.mkdir(parents=True, exist_ok=True)
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    count = 0
    for filename, url in urls.items():
        out_path = out_dir / filename
        if out_path.exists():
            print(f"  ⏭️  Skipping {filename} (exists)")
            continue
            
        print(f"  ⬇️  Fetching {filename}...")
        try:
            resp = requests.get(url, headers=headers)
            resp.raise_for_status()
            with open(out_path, "w", encoding="utf-8") as f:
                f.write(resp.text)
            count += 1
            time.sleep(1) # Be nice to the server
        except Exception as e:
            print(f"  ❌ Failed to fetch {filename}: {e}")

    print(f"✅ Downloaded {count} new files.")

def cmd_generate(target: str, deploy: bool):
    """Generate dataset files (UI graph or ML flat file)."""
    start = time.time()
    print(f"🚀 Generating dataset (Target: {target})...")

    lcid = load_lcid(LCID_FILE)
    with open(MAPPING_FILE, "r", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

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

    graph_output = []
    flat_rows = []
    
    total_links = 0
    total_unique = set()

    print(f"{'File':30s} {'Sec':4s} {'Prob':5s} {'Uniq':5s}")
    print("-" * 50)

    for tid, meta in topics_meta.items():
        html_path = Path(HTML_DIR) / meta["file"]
        if not html_path.exists():
            print(f"⚠  Missing: {meta['file']}")
            continue

        sections = parse_html(str(html_path), lcid)

        # Count & Flatten
        n_file = 0
        slugs_file = set()
        
        for section in sections:
            # Direct problems
            for p in section.get("problems", []):
                n_file += 1
                slugs_file.add(p["slug"])
                flat_rows.append({
                    "slug": p["slug"],
                    "title": p["title"],
                    "rating": p["rating"],
                    "difficulty": p["difficulty"],
                    "topic": tid,
                    "section": section["title"],
                    "subtopic": "",
                    "tags": ";".join(p["tags"])
                })

            # Subtopics
            for sub in section.get("subtopics", []):
                for p in sub.get("problems", []):
                    n_file += 1
                    slugs_file.add(p["slug"])
                    flat_rows.append({
                        "slug": p["slug"],
                        "title": p["title"],
                        "rating": p["rating"],
                        "difficulty": p["difficulty"],
                        "topic": tid,
                        "section": section["title"],
                        "subtopic": sub["title"],
                        "tags": ";".join(p["tags"])
                    })

        total_links += n_file
        total_unique.update(slugs_file)
        
        print(f"{meta['file']:30s} {len(sections):<4d} {n_file:<5d} {len(slugs_file):<5d}")

        graph_output.append({
            "id": tid,
            "group": meta["group"],
            "title": meta["title"],
            "sections": sections,
        })

    # Output: UI Graph
    if target in ("ui", "all"):
        out_path = Path(OUTPUT_FILE)
        out_path.parent.mkdir(exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(graph_output, f, indent=2, ensure_ascii=False)
        print(f"\n📦 Generated UI Graph: {out_path}")
        
        if deploy:
            deploy_path = Path("../../src/data/taxonomy_graph.json")
            with open(deploy_path, "w", encoding="utf-8") as f:
                json.dump(graph_output, f, indent=2, ensure_ascii=False)
            print(f"🚚 Deployed to: {deploy_path}")

    # Output: ML Flat File
    if target in ("ml", "all"):
        flat_path = Path(FLAT_FILE)
        flat_path.parent.mkdir(exist_ok=True)
        with open(flat_path, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=["slug", "title", "rating", "difficulty", "topic", "section", "subtopic", "tags"])
            writer.writeheader()
            writer.writerows(flat_rows)
        print(f"📦 Generated ML Dataset: {flat_path}")

    elapsed = time.time() - start
    print(f"\n✅ Complete in {elapsed:.2f}s | Total Links: {total_links} | Unique: {len(total_unique)}")


def main():
    parser = argparse.ArgumentParser(description="EndlessCode Data Lab Parser")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Command: download
    cmd_dl = subparsers.add_parser("download", help="Download raw HTML pages from LeetCode")

    # Command: generate
    cmd_gen = subparsers.add_parser("generate", help="Generate datasets")
    cmd_gen.add_argument("--target", choices=["ui", "ml", "all"], default="all", help="Dataset target (ui=graph, ml=flat, all=both)")
    cmd_gen.add_argument("--no-deploy", action="store_true", help="Skip deployment to frontend")

    args = parser.parse_args()

    if args.command == "download":
        cmd_download()
    elif args.command == "generate":
        cmd_generate(args.target, not args.no_deploy)

if __name__ == "__main__":
    main()
