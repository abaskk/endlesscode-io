# ML Rating Predictor Experiments

This file tracks the results of different machine learning experiments for predicting LeetCode problem ratings.


The final approach that I went with was asking Claude to manually assign rating based on its knowledge as the ML models had a terrible correlation coefficient and RMSE.


## Final Approach - Claude
It justified its approach as:

Pattern recognition from my training data on common LeetCode problems
Relative difficulty within each category
Typical rating distributions (Easy: 1200-1600, Medium: 1400-2100, Hard: 1900-3000+)
Implementation complexity (how many concepts/techniques you need to combine)


## Experiment 1: Baseline vs. Enhanced (Embeddings)
**Date**: 2026-02-15
**Objective**: Establish a baseline using TF-IDF and metadata, and test if adding SentenceTransformer embeddings improves performance.

### Configuration
- **Dataset**: 2,179 problems (intersection of Zerotrac ratings + descriptions)
- **Train/Val Split**: 80/20 (Random seed 42)
- **Target**: `Rating` (Float)

**Model 1: Baseline**
- **Features**: 
  - Text: TF-IDF (max 500 features) on `description`
  - Categorical: One-Hot encoded `topicTags`
  - Numerical: `acRate` (scaled)
- **Algorithm**: GradientBoostingRegressor (n_estimators=100, lr=0.1, depth=5)

**Model 2: Enhanced**
- **Features**: Baseline features + SentenceTransformer embeddings (`all-MiniLM-L6-v2`, 384 dims)
- **Algorithm**: Same GradientBoostingRegressor

### Results

| Metric | Target | Baseline | Enhanced | Change |
|--------|--------|----------|----------|--------|
| **RMSE** | < 100  | **297.01** | 299.59   | +2.58 (Worse) |
| **MAE**  | < 75   | **228.78** | 232.53   | +3.74 (Worse) |
| **R²**   | > 0.75 | **0.493**  | 0.484    | -0.009 (Worse) |

### Insights
1. **Embeddings hurt performance**: Adding 384 dense embedding features to the 567 baseline features actually degraded performance slightly. This suggests the embeddings might be introducing noise or the model is overfitting/underfitting with the high dimensionality.
2. **Performance gap**: Both models are far from the targets (RMSE ~300 vs 100). The current features (text + tags + acRate) are insufficient to predict difficulty with high precision.
3. **Conservative predictions**: Visualization showed the model predicts a narrower range (1166-2625) than actual (1084-3774), missing extreme difficulty levels.

### Next Steps
- Remove embeddings to simplify the model.
- Feature Engineering: Extract constraints (n values), time complexity inference from description.
- Try different models: XGBoost/LightGBM might handle the sparse/dense mix better.

## Experiment 2: Hyperparameter Tuning
**Date**: 2026-02-16
**Objective**: Increase model complexity (`n_estimators=500`, `max_depth=7`, `learning_rate=0.05`) to reduce underfitting.

### Configuration
- **Baseline**: Same features, but deeper trees (max_depth=7) and more estimators (500).
- **Enhanced**: Same features + deeper trees/more estimators.

### Results

| Metric | Baseline (Exp 1) | Baseline (Exp 2) | Change | Enhanced (Exp 2) |
|--------|------------------|------------------|--------|------------------|
| **RMSE** | 297.01           | **294.03**       | -2.98 (Better) | 304.15 (Worse) |
| **MAE**  | 228.78           | **226.71**       | -2.07 (Better) | 236.35 (Worse) |
| **R²**   | 0.493            | **0.503**        | +0.010 (Better)| 0.468 (Worse) |

### Insights
1. **Deeper trees help slightly**: Increasing complexity improved the baseline model (R² > 0.50 now), confirming some underfitting in the initial model.
2. **Embeddings degrade further**: The enhanced model got *worse* with higher complexity, likely overfitting the high-dimensional noise from embeddings.
3. **Diminishing returns**: Even with 5x more estimators, improvement is marginal (~1%). We need better features, not just tuning.

### Next Steps
- **Feature Engineering**: Add explicit text complexity features (length, constraints).
- **K-Means Clustering**: Try grouping problems by description embeddings and using cluster ID as a feature.

## Experiment 3: Feature Engineering (Text Complexity)
**Date**: 2026-02-16
**Objective**: Test if text length, word count, line count, and example count correlate with problem difficulty.

### Configuration
- **Model**: Same as Exp 2 (Baseline: n_estimators=500, max_depth=7).
- **New Features**: `desc_length`, `word_count`, `line_count`, `example_count` added to numerical features.

### Results

| Metric | Baseline (Exp 2) | Baseline (Exp 3) | Change | Enhanced (Exp 3) |
|--------|------------------|------------------|--------|------------------|
| **RMSE** | **294.03**       | 295.69           | +1.66 (Worse) | 298.99 (Worse) |
| **MAE**  | **226.71**       | 227.31           | +0.60 (Worse) | 231.88 (Worse) |
| **R²**   | **0.503**        | 0.497            | -0.006 (Worse)| 0.486 (Worse) |

### Insights
1. **Complexity != Difficulty**: Simply counting words or lines doesn't predict difficulty. A short problem can be conceptually hard ("Median of Two Sorted Arrays"), and a long problem can be just a tedious simulation.
2. **Noise**: Adding these features increased noise slightly, degrading performance.
3. **Embeddings still hurt**: Enhanced model remains worse than baseline.

### Next Steps
- **K-Means Clustering**: Since raw text stats failed, maybe semantic clusters (problem types) will help.
- **Constraint Parsing**: Instead of just counting lines, parse actual values (e.g., $N \le 10^5$ implies $O(N \log N)$ or $O(N)$).

## Experiment 4: K-Means Clustering on Descriptions
**Date**: 2026-02-16
**Objective**: Cluster problems into 20 semantic types using description embeddings and use Cluster ID as a feature.

### Configuration
- **Model**: Baseline (n_estimators=500, max_depth=7).
- **New Features**: One-Hot Encoded Cluster IDs (20 clusters) added to Baseline.

### Results

| Metric | Baseline (Exp 2) | Baseline (Exp 4 w/ Clusters) | Change | Enhanced (Exp 4) |
|--------|------------------|------------------------------|--------|------------------|
| **RMSE** | 294.03           | **293.87**                   | -0.16 (Tiny Better) | 302.84 (Worse) |
| **MAE**  | 226.71           | **225.10**                   | -1.61 (Better) | 234.85 (Worse) |
| **R²**   | 0.503            | **0.504**                    | +0.001 (Tiny Better)| 0.473 (Worse) |

### Insights
1. **Clusters don't add much**: Semantic clusters of descriptions likely overlap significantly with existing Tags and TF-IDF features. The model already "knows" these topics.
2. **Plateau reached**: We are stuck around RMSE ~294. 
3. **Next Steps**: We need *radically* different features (e.g., solution complexity) or a different model type (Neural Network).

### Status
Terminated early during prediction phase, but training results were captured.



