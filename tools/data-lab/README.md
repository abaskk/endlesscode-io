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
**Purpose:**## Architecture

- **`parser.py`**: The CLI tool (Entry point).
- **`source/taxonomy_mapping.csv`**: Defines the topic structure and maps source files to topic names.
- **`source/urls.json`**: Maps source filenames to LeetCode discussion URLs for downloading.
- **`source/lcid.json`**: LeetCode problem metadata (ID, Slug, Difficulty, Premium status).
- **`source/translations.json`**: Dictionary for structured title translation.
- **`source/description_translations.json`**: Dictionary for description text translation.
- **`generated/`**: Output directory for JSON/CSV datasets. for analysis and search

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
