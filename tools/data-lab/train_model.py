#!/usr/bin/env python
# coding: utf-8

import json
import argparse
import pandas as pd
import numpy as np
import pickle
import os
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import MultiLabelBinarizer, StandardScaler
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.cluster import KMeans
from sentence_transformers import SentenceTransformer
import warnings
from scipy.sparse import hstack, csr_matrix

warnings.filterwarnings('ignore')
sns.set_style('whitegrid')

# Config
RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)

class RatingPredictor:
    def __init__(self):
        self.df_merged = None
        self.df_train_pool = None
        self.df_missing = None
        self.features = {}
        self.models = {}
        self.results = {}
        self.embedding_model = None
        self.CACHE_FILE = 'generated/embeddings_cache.pkl'

    def load_data(self):
        print("Loading data...")
        with open('source/zerotrac.json', 'r') as f:
            zerotrac_data = json.load(f)
        df_zerotrac = pd.DataFrame(zerotrac_data)
        
        with open('source/lcid.json', 'r') as f:
            lcid_data = json.load(f)
        lcid_rows = [{'problem_id': k, **v} for k, v in lcid_data.items()]
        df_lcid = pd.DataFrame(lcid_rows)

        with open('source/merged_problems.json', 'r') as f:
            merged_data = json.load(f)
        df_problems = pd.DataFrame(merged_data['questions'])

        # Normalize slugs
        df_zerotrac['slug'] = df_zerotrac['TitleSlug'].str.lower().str.strip()
        df_lcid['slug'] = df_lcid['titleSlug'].str.lower().str.strip()
        df_problems['slug'] = df_problems['problem_slug'].str.lower().str.strip()

        # Merge
        self.df_merged = df_zerotrac.merge(df_lcid, on='slug', how='outer', suffixes=('_zt', '_lcid'))
        self.df_merged = self.df_merged.merge(df_problems, on='slug', how='outer')

        # Split into training pool and missing pool
        has_rating = self.df_merged['Rating'].notna()
        has_description = self.df_merged['description'].notna()
        usable = has_rating & has_description
        
        self.df_train_pool = self.df_merged[usable].copy()
        # Predict for ALL missing ratings, even if description is missing
        self.df_missing = self.df_merged[~has_rating].copy()
        
        print(f"Data Loaded: {len(self.df_merged)} total, {len(self.df_train_pool)} training, {len(self.df_missing)} missing ratings")

    def get_embeddings_with_cache(self, texts, slugs):
        """Get embeddings from cache or compute them."""
        # Load cache
        cache = {}
        if os.path.exists(self.CACHE_FILE):
            try:
                with open(self.CACHE_FILE, 'rb') as f:
                    cache = pickle.load(f)
                print(f"Loaded {len(cache)} embeddings from cache.")
            except Exception as e:
                print(f"Failed to load cache: {e}")
        
        # Identify missing
        slugs = list(slugs)
        texts = list(texts)
        missing_indices = []
        missing_texts = []
        
        for i, slug in enumerate(slugs):
            if slug not in cache:
                missing_indices.append(i)
                missing_texts.append(texts[i])
        
        if missing_texts:
            print(f"Computing embeddings for {len(missing_texts)} problems...")
            if self.embedding_model is None:
                self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            
            new_embeddings = self.embedding_model.encode(
                missing_texts, 
                show_progress_bar=True, batch_size=32
            )
            
            # Update cache
            for idx, emb in zip(missing_indices, new_embeddings):
                slug = slugs[idx]
                cache[slug] = emb
            
            # Save cache
            os.makedirs(os.path.dirname(self.CACHE_FILE), exist_ok=True)
            with open(self.CACHE_FILE, 'wb') as f:
                pickle.dump(cache, f)
            print("Cache updated.")
        
        # Construct result matrix
        # Ensure we return a numpy array of shape (N, D)
        # Check dim from first item
        if not cache:
            return np.array([])
            
        sample_emb = next(iter(cache.values()))
        dim = len(sample_emb)
        
        matrix = np.zeros((len(slugs), dim))
        for i, slug in enumerate(slugs):
            matrix[i] = cache[slug]
            
        return matrix

    def engineer_features(self):
        print("Engineering features...")
        df = self.df_train_pool
        
        # 1. TF-IDF
        tfidf = TfidfVectorizer(max_features=500, stop_words='english', min_df=2)
        self.features['tfidf'] = tfidf.fit_transform(df['description'].fillna(''))
        self.features['tfidf_model'] = tfidf

        # 2. Tags
        def extract_tags(tags):
            if not isinstance(tags, list): return []
            return [t.get('name', t) if isinstance(t, dict) else t for t in tags]
        
        df['tag_list'] = df['topicTags'].apply(extract_tags)
        mlb = MultiLabelBinarizer()
        self.features['tags'] = mlb.fit_transform(df['tag_list'])
        self.features['mlb_model'] = mlb

        # 3. Numerical
        scaler = StandardScaler()
        self.features['numerical'] = scaler.fit_transform(df[['acRate']].fillna(0))
        self.features['scaler_model'] = scaler

        # 4. Embeddings
        print("Generating training embeddings...")
        self.features['embeddings'] = self.get_embeddings_with_cache(
            df['description'].fillna('').tolist(),
            df['slug'].tolist()
        )

        # 5. K-Means
        print("Clustering...")
        kmeans = KMeans(n_clusters=20, random_state=RANDOM_SEED)
        cluster_labels = kmeans.fit_predict(self.features['embeddings'])
        
        # One-hot encode clusters (fixed 20)
        cluster_matrix = np.zeros((len(df), 20))
        cluster_matrix[np.arange(len(df)), cluster_labels] = 1
        self.features['kmeans'] = cluster_matrix
        self.features['kmeans_model'] = kmeans

    def train(self, experiment='all'):
        y = self.df_train_pool['Rating'].values
        
        experiments_to_run = []
        if experiment == 'all':
            experiments_to_run = ['baseline', 'enhanced', 'kmeans']
        else:
            experiments_to_run = [experiment]
            
        for exp in experiments_to_run:
            print(f"\nRunning Experiment: {exp.upper()}")
            
            # Construct feature matrix based on experiment type
            comps = [self.features['tfidf'], csr_matrix(self.features['tags']), csr_matrix(self.features['numerical'])]
            if exp == 'enhanced':
                comps.append(csr_matrix(self.features['embeddings']))
            elif exp == 'kmeans':
                comps.append(csr_matrix(self.features['kmeans'])) # Baseline + KMeans
                
            X = hstack(comps)
            
            X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=RANDOM_SEED)
            
            model = GradientBoostingRegressor(n_estimators=500, learning_rate=0.05, max_depth=7, random_state=RANDOM_SEED)
            model.fit(X_train, y_train)
            
            y_pred = model.predict(X_val)
            rmse = np.sqrt(mean_squared_error(y_val, y_pred))
            r2 = r2_score(y_val, y_pred)
            
            print(f"  RMSE: {rmse:.2f}")
            print(f"  R²: {r2:.3f}")
            
            self.models[exp] = model
            self.results[exp] = {'rmse': rmse, 'r2': r2}

    def predict_and_save(self, best_model_name='enhanced'):
        print(f"\nGenerating predictions using {best_model_name} model...")
        model = self.models.get(best_model_name) or self.models.get('all') # fallback
        if not model:
            print("Model not found, cannot predict.")
            return

        df_missing = self.df_missing
        if len(df_missing) == 0:
            print("No missing ratings to predict.")
            # Still save the file with known ratings but no predictions if necessary?
            # Or just return
            return

        # Generate features for missing data
        tfidf = self.features['tfidf_model']
        mlb = self.features['mlb_model']
        scaler = self.features['scaler_model']
        kmeans = self.features['kmeans_model']

        # 1. TF-IDF
        f_tfidf = tfidf.transform(df_missing['description'].fillna(''))
        
        # 2. Tags
        def extract_tags(tags):
            if not isinstance(tags, list): return []
            return [t.get('name', t) if isinstance(t, dict) else t for t in tags]
        df_missing['tag_list'] = df_missing['topicTags'].apply(extract_tags)
        f_tags = mlb.transform(df_missing['tag_list'])

        # 3. Numerical
        f_num = scaler.transform(df_missing[['acRate']].fillna(0))

        comps = [f_tfidf, csr_matrix(f_tags), csr_matrix(f_num)]

        # 4. Embeddings (Required for enhanced/kmeans)
        if best_model_name in ['enhanced', 'kmeans']:
            print("Getting embeddings for missing data...")
            embeddings = self.get_embeddings_with_cache(
                df_missing['description'].fillna('').tolist(),
                df_missing['slug'].tolist()
            )
            
            if best_model_name == 'enhanced':
                comps.append(csr_matrix(embeddings))
            elif best_model_name == 'kmeans':
                cluster_labels = kmeans.predict(embeddings)
                cluster_matrix = np.zeros((len(df_missing), 20))
                cluster_matrix[np.arange(len(df_missing)), cluster_labels] = 1
                comps.append(csr_matrix(cluster_matrix))

        X_missing = hstack(comps)
        
        # Predict
        try:
            preds = model.predict(X_missing)
            # Round to nearest integer
            preds = np.round(preds).astype(int)
            
            df_missing['predicted_rating'] = preds
            
            # Merge back
            df_final = self.df_merged.copy()
            df_final['predicted_rating'] = np.nan
            df_final.loc[df_missing.index, 'predicted_rating'] = preds
            df_final['Rating'] = df_final['Rating'].fillna(df_final['predicted_rating'])
            df_final['is_predicted'] = df_final['predicted_rating'].notna() & self.df_merged['Rating'].isna()

            # Save
            output_file = 'generated/merged_problems_with_ratings.json'
            # Convert NaNs to None manually for JSON compliance
            df_export = df_final.where(pd.notnull(df_final), None)
            output_data = {'questions': df_export.to_dict(orient='records')}
            
            with open(output_file, 'w') as f:
                json.dump(output_data, f, indent=2)
            print(f"Saved {len(df_final)} problems to {output_file}")
            
        except ValueError as e:
            print(f"Prediction failed: {e}")
            print(f"Expected features: {model.n_features_in_}, Got: {X_missing.shape[1]}")

def main():
    parser = argparse.ArgumentParser(description="Run ML Experiments")
    parser.add_argument('--experiment', choices=['baseline', 'enhanced', 'kmeans', 'all'], default='all', help="Experiment to run")
    parser.add_argument('--predict', action='store_true', help="Generate predictions and output JSON")
    args = parser.parse_args()

    predictor = RatingPredictor()
    predictor.load_data()
    predictor.engineer_features()
    
    predictor.train(args.experiment)
    
    if args.predict:
        # Determine best model based on experiment
        best = 'enhanced' if args.experiment in ['enhanced', 'all'] else args.experiment
        predictor.predict_and_save(best)

if __name__ == "__main__":
    main()
