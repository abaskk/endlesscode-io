# EndlessCode Architecture & Data Pipeline Specification

**Version:** 1.4  
**Objective:** Transform EndlessCheng's nested HTML curriculum into a high-density, NeetCode-style UI using an "Explode, Group, & Flatten" strategy.

---

## Table of Contents

1. [Taxonomy & Organization Rationale](#1-taxonomy--organization-rationale)
2. [Hierarchy Explanation](#2-hierarchy-explanation)
3. [Taxonomy Mapping](#3-taxonomy-mapping)
4. [Data Extraction Pipeline](#4-data-extraction-pipeline)
5. [UI Integration Plan](#5-ui-integration-plan)

---

## 1. Taxonomy & Organization Rationale

### The "Explode & Group" Strategy

To resolve the deep nesting (4+ levels) in the source HTML, we treat the curriculum as a hierarchical structure with only 3 UI levels + visual grouping:

- **Explosion:** Massive files (`data_structures.html`, `dp.html`, `graph.html`) are broken into ~12 atomic topics
- **Grouping:** Topics are re-aggregated under 6 visual group headers (non-clickable) to provide context
- **Flattening:** "Thinking", "Advanced", and "Optional" modifiers are converted into metadata labels (`[THINKING]`, `[ADVANCED]`) on the problem row itself

### The "Road to 2000" Sequence

Topics are ordered strictly by algorithmic dependency to build a "Spiral of Intuition":

- **LINEAR FOUNDATIONS:** Arrays → Sliding Window → Binary Search
- **CORE DATA STRUCTURES:** Stack → Heap → Linked List  
- **RECURSION & TREES:** Trees → Grid Graphs → Backtracking
- **GRAPH ALGORITHMS:** Graph Connectivity → Shortest Path
- **DYNAMIC PROGRAMMING:** Linear → Knapsack → Bitmask/Digit

---

## 2. Hierarchy Explanation

### The Source: Deeply Nested HTML

EndlessCheng's content is structured like a nested file system with 4+ levels:

- **Level 1 (File/Page):** e.g., `sliding_window.html` (The entire subject)
- **Level 2 (Major Section):**  e.g., 二、不定长滑动窗口 (Variable-Length Window) - acts like a "Chapter"
- **Level 3 (Pattern/Subsection):** e.g., §2.3 求子数组个数 (Count Subarrays) - specific technique
- **Level 4 (Sub-Pattern):** e.g., §2.3.3 恰好型 (Exactly K) - granular variation

### The Target: Flat UI (High Density)

We want a UI that looks like a simple list of problem sets, avoiding the need to click through 4 folders to see a problem.

### The Transformation Logic

We use a "Router" (Mapping CSV) to flatten this structure:

1. **Explode:** Don't dump everything into "Sliding Window" - break it down into focused rows
2. **Concatenate Context:** Take "Chapter" (L2) + "Pattern" (L3) and merge into section title
3. **Map Row:** The specific "Sub-Pattern" (L4) becomes the clickable row
4. **Tag Metadata:** If source text says (选做) "Optional", add an `[ADVANCED]` tag instead of making a folder

**Visual Diagram:**

```
[ SOURCE HTML ]                          [ TARGET UI ]
───────────────────────────────────      ───────────────────────────────────
File: sliding_window.html                Group: LINEAR FOUNDATIONS
  |
  +-- H2: Variable-Length Window         Accordion: ▼ 1. SLIDING WINDOW
      |                                      |
      +-- H3: Count Subarrays                +-- Row: Count Subarrays
          |                                      (Tags: [CORE], [ADVANCED])
          +-- H4: Exactly K Pattern              |
              |                                  +-- Problem List
              +-- Problem List
```

**Why this works:**
- **No Information Loss:** User still knows this is a "Variable Window" problem  
- **Zero Click Fatigue:** User clicks "Sliding Window" → "Count Subarrays". That's it.
- **Scalable:** Can handle 5 levels of nesting just by updating section title text

### CSV-to-UI Hierarchy Unpacking

The `taxonomy_mapping.csv` is **flat** (349 rows), but the **UI is hierarchical** (3 levels). Here's the mapping:

| CSV Column | UI Level | Example | Clickable? |
|------------|----------|---------|------------|
| `visual_group` | L1: Visual Divider | **LINEAR FOUNDATIONS** | ❌ No |
| `top_level_topic` | L2: Topic Accordion | ▼ **Sliding Window** | ✅ Yes (expand/collapse) |
| `row_title` | L3: Section Row | **Fixed-Length Sliding Window** | ✅ Yes (show problems) |

**Example Unpacking:**

```csv
visual_group,top_level_topic,row_title
LINEAR FOUNDATIONS,sliding-window,Fixed-Length Sliding Window
LINEAR FOUNDATIONS,sliding-window,Variable-Length Sliding Window  
LINEAR FOUNDATIONS,sliding-window,Exactly K Window
LINEAR FOUNDATIONS,binary-search,Binary Search Fundamentals
```

**Becomes UI:**

```
LINEAR FOUNDATIONS                           ← L1: Visual Header (non-clickable)
─────────────────────────────────────────

  ▼ Sliding Window                           ← L2: Topic Accordion
    │
    ├─ Fixed-Length Sliding Window           ← L3: Section
    │   └─ [Problem Table]
    │
    ├─ Variable-Length Sliding Window        ← L3: Section
    │   └─ [Problem Table]
    │
    └─ Exactly K Window                      ← L3: Section
        └─ [Problem Table]

  ▶ Binary Search                            ← L2: Topic Accordion (collapsed)
```

**Grouping Logic:**

The `parser.py` script groups CSV rows by:
1. Group by `visual_group` → Creates visual dividers
2. Group by `top_level_topic` → Creates topic accordions
3. Each `row_title` → Becomes a section with problems

**Key Point:** Multiple CSV rows with the same `top_level_topic` get **coalesced** into one accordion with multiple sections.

---

## 3. Taxonomy Mapping

**File:** `docs/taxonomy_mapping.csv`

**Description:** The Single Source of Truth for **taxonomy organization + English translation**. Maps Chinese section headers (via regex) to clean English UI rows.

**Coverage:** ✅ 100% parity with raw galaxy pages (349/349 sections mapped and translated)

### Hierarchy Model (V3 Parser)

The UI renders 3 levels; anything deeper becomes tags on problems:

```
TOPIC       (L2, one per HTML file, e.g. "sliding-window")
  SUBSECTION  (H2 headers, e.g. "I. Fixed-Length Sliding Window")
    SUBTOPIC  (H3 headers, e.g. "§1.1 Basics")
      [problems with TAGS from H4: CORE, ADVANCED, OPTIONAL, THINKING]
```

### Hierarchy Statistics (V3 Ground Truth)

- **L1 - Visual Groups:** 6 divisions
  - LINEAR FOUNDATIONS
  - CORE DATA STRUCTURES
  - RECURSION & TREES
  - GRAPH ALGORITHMS
  - DYNAMIC PROGRAMMING
  - SPECIALIZED LOGIC

- **L2 - Topics:** 12 unique topics
  - `sliding-window`, `binary-search`, `data-structures`, `monotonic-stack`
  - `linked-list-tree`, `grid-graph`, `graph`, `dp`
  - `greedy`, `bitwise`, `math`, `strings`

- **L3 - Sections (H2 headers):** 105 content sections (excluding footer/meta H2s)

- **L4 - Subtopics (H3 headers):** ~249 subtopics within those sections

- **L5 - Problems:** 2,653 unique LeetCode problems
  - 3,451 total problem occurrences (link-based extraction)
  - Ground truth from HTML `<a href>` tags: **3,509 links**, of which 58 are supplementary (explanation/video links in `<p>` tags, not practice problems in `<li>` tags)
  - **Extraction Rate:** 98.3% (3,451 / 3,509)
  - Tags from H4 headers: CORE, ADVANCED, OPTIONAL, THINKING
  - Premium/paid problems detected via 会员题 indicator

### Metrics History

| Metric | V1 Parser | V3 Parser | Ground Truth |
|--------|-----------|-----------|--------------|
| **Problem Occurrences** | 3,239 | **3,451** | 3,509 |
| **Unique Problems** | 2,503 | **2,653** | 2,655 |
| **Extraction Rate** | 92.3% | **98.3%** | 100% |
| **Premium Detection** | No | **Yes** | — |
| **H4 → Tags** | No | **Yes** | — |
| **Descriptions** | No | **Yes** | — |

### CSV Format

The taxonomy CSV contains the following columns:

| Column | Purpose | Example |
|--------|---------|---------|
| `visual_group` | L1 visual grouping | `LINEAR FOUNDATIONS` |
| `top_level_topic` | L2 topic ID | `sliding-window` |
| `row_title` | L3 section title (English) | `Fixed-Length Sliding Window` |
| `source_file` | HTML source file | `sliding_window.html` |
| `header_regex` | Regex for matching HTML header (Chinese) | `^§1\.1\s+基础` |
| `default_labels` | Deprecated (V3 uses H4 tags) | N/A |

See [`docs/taxonomy_mapping.csv`](file:///../taxonomy_mapping.csv) for the complete mapping.

---

## 4. Data Extraction Pipeline (Final V3)

**File:** `tools/data-lab/parser_v3.py`
**Dependencies:** `beautifulsoup4`
**Methodology:** Zero Data Loss + Strict Filtering

### 4.1 "Link-First" Extraction Strategy
Instead of relying on fragile DOM structure (e.g., `<ul> > <li> > <a>`), the V3 parser uses a **Link-Based Extraction** approach:
1.  **Scan:** Regex scan for `leetcode.cn/problems/slug` links in specific container tags.
2.  **Filter:** Strictly validate the slug against the `lcid.json` dataset.
    *   **Keep:** Problems with valid English metadata.
    *   **Drop:** China-exclusive problems (no English translation/metadata) or dead links.
3.  **Hierarchy:** Reconstruct the 3-level UI structure based on the nearest preceding header (H2/H3).

### 4.2 Dataset Output Methodology

The pipeline performs a **Strict Intersection** between sources:
1.  **Source HTML:** Provides structure (grouping) and problem references.
2.  **LCID Metadata:** Provides the "Ground Truth" for problem titles, slugs, and difficulty.
3.  **Translations:** Applies English titles to sections and descriptions.

**Result:**
- **Zero Valid Data Loss:** Every problem in the HTML that exists in the global LeetCode catalog is preserved.
- **High Quality:** No broken links or untranslated content.

### 4.3 UI Dataset (`taxonomy_graph.json`)
Hierarchical structure optimized for frontend accordions:

```typescript
interface UIDataset {
  id: string;             // topic-id
  group: string;          // L1 Visual Group
  title: string;          // Formatted Topic Title
  sections: {
    title: string;        // L3 Section Title (English)
    description?: string; // Translated description/theory
    problems: Problem[];  // Direct problems
    subtopics: {          // Nested concept groups
        title: string;
        description?: string;
        problems: Problem[];
    }[];
  }[]
}
```

### 4.2 Training Dataset (`training_data.json`)
A flat, sequential list of problem instances with expanded metadata, preserved in the "Road to 2000" order for ML/Training pipelines.

**Schema:**
```typescript
interface TrainingEntry {
  id: string;             // Frontend ID
  title: string;          // English Title
  slug: string;           
  rating: number;         
  phase: number;          
  difficulty: string;     
  labels: string[];       
  visual_group: string;   // L1 Group
  top_level_topic: string;// L2 Topic
  section_title: string;  // L3 English Title
  source_file: string;    // Raw HTML source
  leetc_id: string;       // Backend ID (from LCID)
  category_title: string; // Algorithms/Database/etc
  is_paid_only: boolean;  // From LCID
  ac_rate: number;        // Acceptance rate
  likes: number;          
  dislikes: number;
  topic_tags: string[];   // [Array, Hash Table, etc]
}
```

### Usage

```bash
cd tools/data-lab
uv run python parser_v3.py
```

### Engine Metrics & Health Checks
The parser produces a detailed health report on exit to ensure data integrity:
- **LCID Join Rate:** Percentage of problems enriched with international metadata (Target: >95%).
- **CSV Coverage:** Percentage of CSV rows successfully matched in the raw HTML (Target: 100%).
- **Difficulty/Label Distribution:** Breakdown of the generated curriculum's complexity.
- **Unique Problem Count:** De-duplicated count of all problems across the entire structure.

---

## 5. UI Integration Plan

### Dashboard Layout

The UI combines the "Dashboard Layout" structure (Sticky Header, Hero, Progress) with high-density "Scientific Roadmap" (Accordion, Dividers, Dense Tables):

```
┌─────────────────────────────────────────────────────────────────┐
│ [E] EndlessCode                                    ← Sticky Header
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  The Scientific Roadmap                            ← Hero Title │
│  A structured, pattern-based approach...           ← Preamble   │
│                                                                 │
│  ┌───────────────────────────────────────────────┐             │
│  │ Your Progress                           [34%] │  ← Progress │
│  │ [=============──────────────────────────────] │             │
│  └───────────────────────────────────────────────┘             │
│                                                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━             │
│  LINEAR FOUNDATIONS                      ← L1: Visual Divider  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━             │
│                                                                 │
│  ┌───────────────────────────────────────────────┐             │
│  │ ▼ Sliding Window            [26 Problems]    │  ← L2: Topic│
│  ├───────────────────────────────────────────────┤             │
│  │                                               │             │
│  │  ▼ Fixed-Length Sliding Window     [CORE]    │  ← L3: Row  │
│  │  ├─────────────────────────────────┐         │             │
│  │  │ □  643  Max Avg Subarray  1200  │  Easy   │  ← Problems │
│  │  │ ✓ 1456  Max Vowels        1263  │  Med    │             │
│  │  └─────────────────────────────────┘         │             │
│  │                                               │             │
│  │  ▶ Variable-Length Sliding Window [ADVANCED] │  ← L3: Row  │
│  │  ▶ Exactly K Window                [PATTERN] │  ← L3: Row  │
│  │                                               │             │
│  │  └───────────────────────────────────────────────┘             │
│                                                                 │
│  ┌───────────────────────────────────────────────┐             │
│  │ ▶ Binary Search                [12 Problems] │  ← L2: Topic│
│  └───────────────────────────────────────────────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Component Mapping

| Existing Component | New System Equivalent |
|-------------------|----------------------|
| Sticky Header | Retained |
| Hero Title | Retained |
| Preamble | Retained |
| Progress Card | Retained |
| Topic Accordion | Maps to L2 (Topic) in `taxonomy_graph.json` |
| Topic Concept Link | Maps to [📖] icon in row header |
| Section Row | Maps to L3 (Section) in `taxonomy_graph.json` |
| Problem Table | Populated by `problems` array |

---

## Summary

- **100% Coverage:** All 349 sections from HTML mapped to CSV
- **English Translation:** All row titles translated for UI display
- **Smart Label Assignment:** Automatic `CORE`, `ADVANCED`, `OPTIONAL`, `THINKING`, `PATTERN` tags
- **~2,591 Unique Problems:** Covering comprehensive LeetCode curriculum
- **Clean 3-Level Hierarchy:** Visual Groups → Topics → Sections → Problems