#!/usr/bin/env python3
"""
Setup commands: join zerotrac and generate embeddings.
"""

import argparse
import json
from pathlib import Path
from core.utils import (
    get_api_key,
    load_zerotrac,
    load_merged_problems,
    build_embedding_text,
    generate_embedding,
    EMBEDDINGS_MODEL,
    ZEROTRAC_PATH,
    MERGED_RATING_PATH,
    EMBEDDINGS_PATH,
    RAW_DATA_PATH,
)


def cmd_join(args):
    """Join zerotrac with merged_problems to create merged_with_rating.json."""
    print("Joining zerotrac with merged_problems...")
    print()

    zerotrac_data = load_zerotrac()
    with open(RAW_DATA_PATH, 'r') as f:
        merged_data = json.load(f)

    print(f"zerotrac: {len(zerotrac_data)} entries")
    print(f"merged_problems: {len(merged_data['questions'])} entries")
    print()

    # Create lookup from TitleSlug to zerotrac entry
    zerotrac_lookup = {entry['TitleSlug']: entry for entry in zerotrac_data}

    # Join: keep only problems that exist in zerotrac
    merged_with_rating = []
    for problem in merged_data['questions']:
        slug = problem['problem_slug']
        if slug in zerotrac_lookup:
            zt = zerotrac_lookup[slug]
            merged_entry = {
                'problem_slug': slug,
                'title': problem['title'],
                'difficulty': problem['difficulty'],
                'topics': problem.get('topics', []),
                'description': problem.get('description', ''),
                'constraints': problem.get('constraints', []),
                'hints': problem.get('hints', []),
                'Rating': zt['Rating'],
                'ContestSlug': zt.get('ContestSlug', ''),
                'ProblemIndex': zt.get('ProblemIndex', ''),
            }
            merged_with_rating.append(merged_entry)

    print(f"Joined: {len(merged_with_rating)} entries with ratings")
    print()

    with open(MERGED_RATING_PATH, 'w') as f:
        json.dump(merged_with_rating, f, indent=2)

    print(f"Saved to: {MERGED_RATING_PATH}")


def cmd_embeddings(args):
    """Generate embeddings for merged_with_rating.json."""
    import time
    BATCH_SIZE = 100

    print("Generating embeddings...")
    print()

    with open(MERGED_RATING_PATH, 'r') as f:
        problems = json.load(f)

    print(f"Found {len(problems)} problems to generate embeddings for.")
    print()

    texts = [build_embedding_text(p) for p in problems]

    all_embeddings = []
    for i in range(0, len(texts), BATCH_SIZE):
        batch_texts = texts[i:i + BATCH_SIZE]
        print(f"  Generating embeddings {i+1}-{min(i+BATCH_SIZE, len(texts))}/{len(texts)}...")

        batch_embeddings = []
        for text in batch_texts:
            # Generate one at a time for simplicity
            emb = generate_embedding(get_api_key(), text)
            if emb:
                batch_embeddings.append(emb)
            else:
                batch_embeddings.append([0.0] * 1024)  # Fallback

        all_embeddings.extend(batch_embeddings)

    if len(all_embeddings) != len(problems):
        print(f"  [x] Mismatch: got {len(all_embeddings)} embeddings for {len(problems)} problems")
        return

    output = {
        "model": EMBEDDINGS_MODEL,
        "count": len(problems),
        "problems": []
    }

    for problem, embedding in zip(problems, all_embeddings):
        output["problems"].append({
            "problem_slug": problem['problem_slug'],
            "title": problem['title'],
            "difficulty": problem['difficulty'],
            "topics": problem['topics'],
            "description": problem.get('description', ''),
            "constraints": problem.get('constraints', []),
            "hints": problem.get('hints', []),
            "Rating": problem['Rating'],
            "ContestSlug": problem.get('ContestSlug', ''),
            "ProblemIndex": problem.get('ProblemIndex', ''),
            "embedding": embedding,
        })

    with open(EMBEDDINGS_PATH, 'w') as f:
        json.dump(output, f, indent=2)

    print()
    print(f"Saved embeddings to: {EMBEDDINGS_PATH}")


def main():
    parser = argparse.ArgumentParser(description="Rating predictor setup commands")
    subparsers = parser.add_subparsers(dest='command', help='Setup command to run')

    # join command
    join_parser = subparsers.add_parser('join', help='Join zerotrac with merged_problems')
    join_parser.set_defaults(func=cmd_join)

    # embeddings command
    emb_parser = subparsers.add_parser('embeddings', help='Generate embeddings')
    emb_parser.set_defaults(func=cmd_embeddings)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
