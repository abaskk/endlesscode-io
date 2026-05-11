#!/usr/bin/env python3
"""
Shared utilities for the rating predictor CLI.
"""

import json
import math
import requests
from pathlib import Path

# Paths (relative to this file's location in core/)
CORE_DIR = Path(__file__).parent
RATING_PREDICTOR_DIR = CORE_DIR.parent
PROJECT_ROOT = RATING_PREDICTOR_DIR.parent.parent  # Go up to endlesscode-io/
DATA_DIR = PROJECT_ROOT / "src" / "data"
RAW_DATA_PATH = PROJECT_ROOT / "src" / "raw-data" / "merged_problems.json"
ZEROTRAC_PATH = PROJECT_ROOT / "src" / "raw-data" / "zerotrac.json"
API_KEY_PATH = RATING_PREDICTOR_DIR / "api_key.txt"
PREDICTIONS_PATH = RATING_PREDICTOR_DIR / "data" / "predictions.json"
EMBEDDINGS_PATH = RATING_PREDICTOR_DIR / "data" / "zerotrac_embeddings.json"
MERGED_RATING_PATH = RATING_PREDICTOR_DIR / "data" / "merged_with_rating.json"

# Models
EMBEDDINGS_MODEL = "qwen/qwen3-embedding-8b"
DEFAULT_PREDICT_MODEL = "deepseek/deepseek-v4-flash"


def get_api_key():
    """Load API key from file."""
    if not API_KEY_PATH.exists():
        print(f"Please create {API_KEY_PATH} and put your OpenRouter API key inside.")
        exit(1)
    with open(API_KEY_PATH, 'r') as f:
        key = f.read().strip()
    if not key or key.startswith('#'):
        print(f"Please put a valid OpenRouter API key in {API_KEY_PATH}.")
        exit(1)
    return key


def load_merged_problems():
    """Load merged_problems.json and create slug lookup."""
    print("Loading merged_problems.json...")
    with open(RAW_DATA_PATH, 'r') as f:
        data = json.load(f)
    lookup = {q["problem_slug"]: q for q in data.get("questions", [])}
    return lookup


def load_zerotrac():
    """Load zerotrac.json (contest ratings)."""
    print("Loading zerotrac.json...")
    with open(ZEROTRAC_PATH, 'r') as f:
        return json.load(f)


def load_predictions():
    """Load existing predictions cache."""
    if PREDICTIONS_PATH.exists():
        with open(PREDICTIONS_PATH, 'r') as f:
            return json.load(f)
    return {}


def save_predictions(predictions):
    """Save predictions to cache."""
    with open(PREDICTIONS_PATH, 'w') as f:
        json.dump(predictions, f, indent=2)


def load_embeddings():
    """Load pre-computed embeddings."""
    if not EMBEDDINGS_PATH.exists():
        return None, None
    with open(EMBEDDINGS_PATH, 'r') as f:
        data = json.load(f)
    problems = data['problems']
    embeddings = [p['embedding'] for p in problems]
    return problems, embeddings


def build_embedding_text(problem_meta):
    """
    Build text to embed for a problem.
    Same format used in generate_embeddings.py.
    """
    text = "Title: " + problem_meta['title'] + "\n"
    text += "Difficulty: " + problem_meta['difficulty'] + "\n"
    topics = problem_meta.get('topics', [])
    if topics:
        text += "Topics: " + ', '.join(topics) + "\n"
    else:
        text += "Topics: \n"
    desc = problem_meta.get('description') or ''
    if not isinstance(desc, str):
        desc = str(desc) if desc is not None else ''
    text += "Description: " + desc[:500] + "\n"
    return text


def generate_embedding(api_key, text, model=EMBEDDINGS_MODEL):
    """Generate embedding for a single text using OpenRouter."""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {"model": model, "input": [text]}
    try:
        resp = requests.post(
            "https://openrouter.ai/api/v1/embeddings",
            headers=headers,
            json=payload,
            timeout=60
        )
        resp.raise_for_status()
        return resp.json()['data'][0]['embedding']
    except Exception as e:
        print(f"  [x] Failed to generate embedding: {e}")
        return None


def cosine_similarity(a, b):
    """Calculate cosine similarity between two vectors."""
    dot_product = sum(x * y for x, y in zip(a, b))
    magnitude_a = math.sqrt(sum(x * x for x in a))
    magnitude_b = math.sqrt(sum(y * y for y in b))
    if magnitude_a == 0 or magnitude_b == 0:
        return 0
    return dot_product / (magnitude_a * magnitude_b)


def find_similar_problems(problem_meta, api_key, problems_with_embeddings, embeddings, k=5):
    """
    Find k most similar problems to given problem_meta.

    Args:
        problem_meta: Dict with problem metadata
        api_key: OpenRouter API key for generating embedding
        problems_with_embeddings: List of problem dicts from embeddings file
        embeddings: List of embedding vectors
        k: Number of similar problems to return

    Returns:
        List of k problem dicts (without embedding field) sorted by similarity
    """
    embedding_text = build_embedding_text(problem_meta)
    query_embedding = generate_embedding(api_key, embedding_text)

    if not query_embedding:
        print("  [!] Could not generate embedding, skipping similarity search.")
        return []

    similarities = []
    for i, emb in enumerate(embeddings):
        sim = cosine_similarity(query_embedding, emb)
        similarities.append((sim, i))

    similarities.sort(reverse=True, key=lambda x: x[0])

    results = []
    for sim, idx in similarities[:k]:
        problem = problems_with_embeddings[idx].copy()
        problem.pop('embedding', None)
        results.append(problem)

    return results


def fetch_from_alfa_api(slug):
    """Fetch problem metadata from Alfa API."""
    url = f"https://alfa-leetcode-api.onrender.com/select/raw?titleSlug={slug}"
    try:
        resp = requests.get(url, timeout=60)
        resp.raise_for_status()
        data = resp.json()
        return {
            "title": data.get("questionTitle", slug),
            "difficulty": data.get("difficulty", "Unknown"),
            "topics": [t.get("name") for t in data.get("topicTags", [])],
            "description": data.get("question", ""),
            "hints": data.get("hints", []),
        }
    except Exception as e:
        print(f"  [x] Failed to fetch from Alfa API: {e}")
        return None


def fetch_from_leetcode_api(slug):
    """Fetch problem metadata from LeetCode API as fallback."""
    url = f"https://leetcode-api-pied.vercel.app/problem/{slug}"
    try:
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        return {
            "title": data.get("questionTitle", slug),
            "difficulty": data.get("difficulty", "Unknown"),
            "topics": [t.get("name") for t in data.get("topicTags", [])],
            "description": data.get("content", ""),
            "hints": [],
        }
    except Exception as e:
        print(f"  [x] Failed to fetch from LeetCode API: {e}")
        return None


def fetch_problem_meta(slug, api_key=None):
    """
    Fetch problem metadata, trying Alfa API first, then LeetCode API as fallback.
    """
    meta = fetch_from_alfa_api(slug)
    if not meta and api_key:
        meta = fetch_from_leetcode_api(slug)
    return meta


def get_taxonomy_files():
    """Return list of taxonomy JSON file paths."""
    return [
        DATA_DIR / "taxonomy_graph_manual.json",
        DATA_DIR / "taxonomy_graph_mastery_v1.json",
        DATA_DIR / "taxonomy_graph_neetcode150.json"
    ]


def collect_slugs_to_predict():
    """Collect all slugs that need prediction from taxonomy files."""
    slugs_to_predict = set()
    for filepath in get_taxonomy_files():
        if not filepath.exists():
            continue
        with open(filepath, 'r') as f:
            taxonomy = json.load(f)
        for topic in taxonomy:
            for section in topic.get('sections', []):
                def collect(problems):
                    for prob in problems:
                        if prob.get("is_predicted") is True or prob.get("rating") is None:
                            slugs_to_predict.add(prob["slug"])
                collect(section.get('problems', []))
                for sub in section.get('subtopics', []):
                    collect(sub.get('problems', []))
    return slugs_to_predict
