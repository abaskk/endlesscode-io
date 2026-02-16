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
## 🏗️ Reproduction Steps

To fully reproduce the dataset and ML model from scratch:

1.  **Environment Setup**:
    ```bash
    cd tools/data-lab
    uv sync
    ```

2.  **Run Full Pipeline**:
    This command trains the model (using cached embeddings if available), predicts missing ratings, and generates the frontend dataset.
    ```bash
    uv run python parser.py pipeline
    ```
    - Output: `src/data/taxonomy_graph.json` (deployed automatically)
    - Cache: `generated/embeddings_cache.pkl` (speeds up subsequent runs)

3.  **Run Individual Experiments**:
    To test different model configurations:
    ```bash
    uv run python parser.py experiment baseline
    uv run python parser.py experiment enhanced
    uv run python parser.py experiment kmeans
    ```

## 📂 Project Structure

- `parser.py`: Main CLI tool for data processing and pipeline orchestration.
- `train_model.py`: ML logic for rating prediction (called by parser).
- `source/`: Raw input files (`lcid.json`, `zerotrac.json`, HTML mappings).
- `generated/`: Output files (`merged_problems_with_ratings.json`, `taxonomy_graph.json`).
- `experiments/`: Logs from ML experiments.


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

## Rating Predictor (ML)

A machine learning pipeline to predict difficulty ratings for problems that are missing them.

### Usage

1. **Train Model & Predict**:
   ```bash
   uv run python parser.py pipeline
   ```
   - Features: TF-IDF (descriptions) + Tags + Acceptance Rate
   - Output: `generated/merged_problems_with_ratings.json`
   - Metrics: Prints RMSE, MAE, R² for Baseline & Enhanced models

2. **Visualize Results**:
   ```bash
   uv run python visualize_results.py
   ```
   - Generates plots in `generated/plots/`:
     - `rating_distribution.png`: Actual vs Predicted distribution
     - `predictions_by_difficulty.png`: Boxplots by difficulty label

### Files
- `train_model.py`: Main training and prediction script
- `visualize_results.py`: Analysis and plotting script
- `rating_predictor.ipynb`: (Deprecated/Removed) Original prototype
- `EXPERIMENTS.md`: Log of ML model performance and iterations

## Development

Run tests:
```bash
uv run pytest test_main.py -v
```

## Project Structure

```
tools/data-lab/
├── parser.py            # CLI entry point & Pipeline orchestration
├── train_model.py       # ML logic for rating prediction
├── source/              # Input datasets (static)
│   ├── lcid.json        # Metadata for 3,807 problems
│   ├── taxonomy_mapping.csv # Curriculum structure definition
│   └── merged_problems.json # Descriptions & tags
├── generated/           # Output artifacts (ignored by git)
│   ├── taxonomy_graph.json
│   └── merged_problems_with_ratings.json
├── raw_pages/           # Scraped HTML material (ignored by git)
└── pyproject.toml       # uv environment config
```
