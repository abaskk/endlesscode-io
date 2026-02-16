# Data Lab

Data processing engine for EndlessCode. Fetches raw problem data, parses the taxonomy, and generates frontend-ready JSON files.

## Quick Start

```bash
cd tools/data-lab
uv sync
```

## Commands

```bash
cd tools/data-lab
uv sync
```

## Commands

### 1. Run the Pipeline (Recommended)

This script runs the parser, validates output, and deploys it to the frontend (`src/data`).

```bash
./run_parser.sh
```

### 2. Manual Execution

```bash
# Run the parser python script directly
uv run python parser.py
```

## Data Sources

### LeetCode Problem Metadata (`data/lcid.json`)

**Source:** [bunnyxt/lcid](https://github.com/bunnyxt/lcid) repository  
**Commit:** [`830e6ce`](https://github.com/bunnyxt/lcid/blob/830e6ce035326d9c26e0707b63653f42adc8e66c/problems_all.json) (Jan 14, 2025)  
**Problems:** 3,807 total

> **Note:** The lcid tool had a regression after this commit and now only scrapes ~100 problems. We use this historical commit which contains the full dataset.

To update:
```bash
curl -sL https://raw.githubusercontent.com/bunnyxt/lcid/830e6ce035326d9c26e0707b63653f42adc8e66c/problems_all.json -o data/lcid.json
```

### Taxonomy Source

**File:** `source/taxonomy_mapping.csv`  
**Purpose:** Defines the mapping from LeetCode topics to Visual Groups and output structure.

### Raw HTML Pages

**Directory:** `raw_galaxy_pages/`  
**Source:** LeetCode problem lists (fetched via `uv run main.py fetch`)

## Output Files

All generated files are stored in `data/`:

- **`taxonomy_graph.json`** - Hierarchical structure for frontend tree view
- **`taxonomy_flat.json`** - Flattened dataset for analysis and search

## Development

Run tests:
```bash
uv run pytest test_main.py -v
```

## Project Structure

```
tools/data-lab/
├── main.py              # CLI entry point
├── data/                # All data files (input + output)
│   ├── lcid.json       # Problem metadata (3,807 problems)
│   ├── taxonomy_graph.json
│   └── taxonomy_flat.json
├── raw_galaxy_pages/    # Raw HTML from LeetCode
├── test_main.py         # Path configuration tests
└── pyproject.toml       # uv project config
```
