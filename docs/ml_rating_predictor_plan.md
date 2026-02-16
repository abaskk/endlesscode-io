# ML Rating Predictor Implementation Plan

## Goal
Predict difficulty ratings for LeetCode problems that are missing this data, using a machine learning model trained on existing problem metadata (descriptions, tags, difficulty).

## User Review Required
> [!IMPORTANT]
> - **Model Choice**: We will start with a Gradient Boosting Regressor (e.g., scikit-learn's `GradientBoostingRegressor` or `XGBoost`) as it typically performs well on tabular/text data.
> - **Features**: We will use problem descriptions (TF-IDF/Embeddings), tags (One-Hot), and difficulty level (Ordinal).
> - **Threshold**: We will need to decide on a confidence threshold or finding a way to validate the predicted ratings.

## Proposed Changes

### Data Analysis & Preparation
- [x] Load `merged_problems.json` (content) and `lcid.json` (metadata).
- [ ] Merge datasets on `frontend_id`.
- [ ] Identify problems with missing ratings.
- [ ] **[NEW]** Load `zerotrac.json`: This dataset contains explicit `Rating` and `TitleSlug` fields. We will use this as the **Primary Source of Truth** for ratings, filling gaps with `lcid.json` only if necessary.
    - Merge strategy: Match on `TitleSlug` or `ID` (frontend_id).

### Feature Engineering & Tradeoffs

#### 1. Text Representation: TF-IDF vs. SOTA Embeddings
The user asked: *"Why aren't you using embeddings?"*
- **TF-IDF (Term Frequency-Inverse Document Frequency)**:
    - **Pros**: Simple, fast, interpretable. Highly effective for technical keywords (e.g., "binary tree", "sort"). If a problem says "segment tree", it's likely Hard. TF-IDF captures this explicitly.
    - **Cons**: Ignores semantic context. "Look up" and "Search" are treated as totally different words.
- **Embeddings (BERT, RoBERTa, SentenceTransformers)**:
    - **Pros**: Captures semantic meaning. Understands that "find the largest element" is similar to "return the maximum value".
    - **Cons**: Computationally heavier. Requires GPU for large models (though smaller models like `all-MiniLM-L6-v2` work fine on CPU). 
    - **Decision**: **We will implement BOTH.** We'll start with TF-IDF for a baseline, then add a pre-trained `SentenceTransformer` (like `all-MiniLM-L6-v2`) to see if semantic understanding improves the rating prediction.

#### 2. Handling Problems with Multiple Approaches
A single problem often has multiple solutions (Brute Force, DP, Greedy). 
- **Challenge**: Which solution predicts the difficulty? Usually, the *existence* of a complex optimal solution (like O(n) DP) drives the rating up, even if a generic O(n^2) solution exists.
- **Approach**: 
    - Primarily use the **Problem Description** as the source of truth. The *requirement* drives the difficulty.
    - If we use solution code as a feature, we should prioritize the **optimal solution** (often the longest or most complex one available in the `code_snippets` or community solutions), or aggregate features from all available solutions.

#### 3. Model Approach: Regression vs. Clustering
The user asked: *"What about clustering?"*

| Approach | Type | Description | Tradeoffs |
| :--- | :--- | :--- | :--- |
| **Regression (Gradient Boosting)** | Supervised | "Here are features (X) and a rating (Y). Learn the function f(X) = Y." | **Pros**: Directly optimizes for the target (rating). Handles mixed data types (tags + text + stats) naturally. <br>**Cons**: Can overfit if data is sparse. |
| **Clustering (K-Means/DBSCAN)** | Unsupervised | "Group these problems into clumps of similar ones." | **Pros**: Great for discovery (e.g., "This group is all Graph problems"). <br>**Cons**: Doesn't predict a *value*. You'd have to average the ratings of the cluster (which is essentially KNN Regression). |
| **KNN (K-Nearest Neighbors)** | Supervised* | "Find the 5 most similar problems and average their ratings." | **Pros**: Very intuitive. "This problem is like Two Sum, so it has a similar rating." <br>**Cons**: Similarity metric (distance) is hard to define perfectly with mixed data. |

**Decision**: We will use **Regression** (Gradient Boosting) as the core predictor because our goal is a specific number. We can use **KNN** as a feature or a secondary "sanity check" model.


---

## Experimental Methodology

### Overview
This section documents the systematic approach for running ML experiments on rating prediction. Follow this methodology for reproducible results across different model configurations.

### 1. Data Preparation Pipeline

**Step 1: Load and Merge Datasets**
```python
# Load all three sources
zerotrac = load_json('source/zerotrac.json')      # 2,405 problems with ratings
lcid = load_json('source/lcid.json')              # 3,807 problems with metadata  
merged = load_json('source/merged_problems.json')  # 2,913 problems with descriptions

# Normalize keys for merging
normalize_slug = lambda s: s.lower().strip()

# Merge strategy (outer join)
df = zerotrac.merge(lcid, on='slug', how='outer', suffixes=('_zt', '_lcid'))
df = df.merge(merged, on='slug', how='outer')
```

**Step 2: Filter Training Data**
```python
# Only use problems with BOTH rating AND description
has_rating = df['Rating'].notna()
has_description = df['description'].notna()
usable = has_rating & has_description  # ~2,179 problems
```

### 2. Feature Engineering Strategy

**Base Features (Always Include):**
1. **Text (TF-IDF)**: 500 features, min_df=2, english stop words
2. **Tags (One-Hot)**: ~66 unique topic tags (Array, DP, Graph, etc.)
3. **Numerical (Scaled)**: `acRate` (acceptance rate)

**Optional Enhancements (Experiment With):**
- Embeddings: SentenceTransformer `all-MiniLM-L6-v2` (384 dims)
- Problem length features: description word count, constraint count
- Tag interactions: co-occurrence patterns (e.g., "DP + Binary Search")

**Feature Matrix Construction:**
```python
from scipy.sparse import hstack

# Combine sparse + dense
X_combined = hstack([
    tfidf_matrix,      # (n, 500) sparse
    tags_matrix,       # (n, 66) sparse
    numerical_scaled   # (n, k) dense
])
```

### 3. Train/Test Split Protocol

**Standard Split:**
- **Ratio**: 80% train / 20% validation
- **Method**: Random shuffle (sklearn `train_test_split`)
- **Random Seed**: 42 (always use for reproducibility)
- **No stratification**: Regression task, stratify by rating buckets if needed

**Alternative Splits (For Experiments):**
- **Temporal**: Train on older contest problems, test on newer (if contest date available)
- **Cross-validation**: 5-fold CV for hyperparameter tuning (computationally expensive)

### 4. Model Training Workflow

**Baseline Iteration:**
```python
from sklearn.ensemble import GradientBoostingRegressor

model = GradientBoostingRegressor(
    n_estimators=100,
    learning_rate=0.1,
    max_depth=5,
    random_state=42
)
model.fit(X_train, y_train)
```

**Hyperparameter Search (If Needed):**
```python
param_grid = {
    'n_estimators': [50, 100, 200],
    'learning_rate': [0.05, 0.1, 0.2],
    'max_depth': [3, 5, 7]
}
# Use GridSearchCV with 3-fold CV
```

### 5. Evaluation Protocol

**Primary Metrics (Report All Three):**
1. **RMSE**: Root Mean Squared Error (penalizes large errors)
   - Target: < 100 points
   - Formula: sqrt(mean((y_true - y_pred)²))
2. **MAE**: Mean Absolute Error (average deviation)
   - Target: < 75 points
   - Formula: mean(|y_true - y_pred|)
3. **R²**: Coefficient of determination (proportion of variance explained)
   - Target: > 0.75
   - Formula: 1 - (SS_res / SS_tot)

**Validation Checks:**
```python
# 1. Check residuals for bias
residuals = y_val - y_pred
print(f"Mean residual: {residuals.mean():.2f}")  # Should be ~0

# 2. Check predictions stay in valid range
print(f"Pred range: [{y_pred.min():.0f}, {y_pred.max():.0f}]")
print(f"True range: [{y_val.min():.0f}, {y_val.max():.0f}]")

# 3. Compare distribution shapes (KS test)
from scipy.stats import ks_2samp
stat, p = ks_2samp(y_val, y_pred)
```

### 6. Experiment Tracking Template

**For Each Experiment, Document:**
```markdown
### Experiment: [Name]
**Date**: 2026-02-16
**Objective**: Test impact of [change]

**Config:**
- Features: TF-IDF(500) + Tags(66) + acRate(1) [+ embeddings(384)]
- Model: GradientBoostingRegressor(n_estimators=100, lr=0.1, depth=5)
- Train size: 1,743 / Val size: 436

**Results:**
| Metric | Baseline | This Run | Δ |
|--------|----------|----------|---|
| RMSE   | 297.01   | XXX.XX   | ±X.XX |
| MAE    | 228.78   | XXX.XX   | ±X.XX |
| R²     | 0.493    | X.XXX    | ±X.XXX |

**Insights:**
- [What worked / didn't work]
- [Why you think it failed/succeeded]

**Next Steps:**
- [ ] Try [specific change]
```

### 7. Running Experiments

**Quick Iteration Script:**
```bash
cd tools/data-lab

# Edit train_model.py with new config
# Then run:
uv run python train_model.py | tee experiments/exp_$(date +%Y%m%d_%H%M).log

# Analyze:
uv run python visualize_results.py
```

**What to Try Next (Priority Order):**
1. **Remove embeddings entirely** (they hurt performance)
2. **Add constraint complexity features** (parse min/max values, count conditions)
3. **Try XGBoost** instead of GradientBoosting (often 5-10% better)
4. **Ensemble**: Average predictions from GB + RandomForest
5. **Neural network**: Simple MLP (512→256→128→1) with dropout

---

### Data Processing & Environment


#### Dependencies (to add to `pyproject.toml`)
```toml
[project]
dependencies = [
    # ... existing deps ...
    "scikit-learn>=1.5.0",
    "sentence-transformers>=3.0.0",
    "matplotlib>=3.9.0",
    "seaborn>=0.13.0",
    "jupyter>=1.1.0",
]
```

#### Environment Setup
```bash
cd tools/data-lab
uv add scikit-learn sentence-transformers matplotlib seaborn jupyter
uv sync
jupyter lab  # Will auto-detect .venv/bin/python as kernel
```

---

### Features
- **Text**: `description` (TF-IDF + optional BERT embeddings).
- **Categorical**: `topicTags` (One-Hot Encoded).
- **Numerical**: `acRate` (Acceptance Rate), `totalAccepted`.

### Model Training

#### Train/Test Split Strategy
- **Ratio**: 80% train, 20% validation
- **Stratification**: Not applicable (regression task)
- **Random seed**: 42 (for reproducibility)

#### Baseline Model (Iteration 1)
1. Features: TF-IDF (max 500 features) + One-Hot Tags + `acRate` + `totalAccepted`
2. Model: `GradientBoostingRegressor` (sklearn defaults)
3. Train on problems with known ratings

#### Enhanced Model (Iteration 2)
1. Add: SentenceTransformer embeddings (`all-MiniLM-L6-v2`, 384 dims)
2. Concatenate with existing features
3. Retrain and compare metrics

#### Evaluation Metrics
- **RMSE (Root Mean Squared Error)**: Target < 100 points
- **MAE (Mean Absolute Error)**: Target < 75 points
- **R² Score**: Target > 0.75

### Inference & filling gaps
- Predict ratings for the missing entries.
- Save the augmented dataset `merged_problems_with_ratings.json`.

## Verification Plan

### Automated Tests (in `rating_predictor.ipynb`)
1. **Data Integrity**:
   - Assert no duplicate `frontend_id` after merge
   - Verify rating distribution: count problems per rating bucket (0-1000, 1000-1500, 1500-2000, etc.)

2. **Model Performance**:
   - Print RMSE, MAE, R² on validation set
   - Compare Baseline vs Enhanced model metrics side-by-side

3. **Visual Validation**:
   - **Scatter plot**: Predicted vs Actual ratings (should cluster along y=x line)
   - **Residual plot**: Errors should be randomly distributed
   - **Rating distribution**: Compare predicted ratings histogram to known ratings

### Manual Verification
- Inspect 10 random predictions: Does "Two Sum" (Easy) get ~1200? Does "Median of Two Sorted Arrays" (Hard) get ~2000+?
- Spot-check problems with extreme predictions (very high/low ratings)

### Acceptance Criteria
- RMSE < 100 on validation set
- No systematic bias (residuals centered around 0)
- Predicted ratings align with difficulty labels (Easy: 1200-1500, Medium: 1500-1800, Hard: 1800+)

---

## Notebook Structure (`rating_predictor.ipynb`)

```markdown
# 1. Imports & Setup
# 2. Data Loading (zerotrac, lcid, merged_problems)
# 3. Data Merging & Exploration (EDA)
# 4. Feature Engineering
#    4.1. TF-IDF
#    4.2. One-Hot Tags
#    4.3. Numerical Features
# 5. Baseline Model (TF-IDF + Tags + Numerical)
#    5.1. Train/Test Split
#    5.2. Train Gradient Boosting
#    5.3. Evaluate
# 6. Enhanced Model (+ Embeddings)
#    6.1. Generate Embeddings
#    6.2. Retrain
#    6.3. Compare Metrics
# 7. Prediction & Output
#    7.1. Predict Missing Ratings
#    7.2. Save merged_problems_with_ratings.json
# 8. Visualization (Scatter, Residuals, Distribution)
```
