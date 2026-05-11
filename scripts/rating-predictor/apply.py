#!/usr/bin/env python3
"""
Apply predictions from predictions.json to taxonomy files.
"""

import argparse
import json
from core.utils import load_predictions, get_taxonomy_files


def apply_rating_to_problems(problems, predictions):
    """Apply predictions to a list of problems."""
    updated = 0
    for prob in problems:
        if prob.get("is_predicted") is True or prob.get("rating") is None:
            slug = prob["slug"]
            if slug in predictions:
                pred = predictions[slug]
                prob["rating"] = pred["predicted_rating"]
                prob["is_predicted"] = True
                updated += 1
    return updated


def cmd_apply(args):
    """Apply predictions to taxonomy files."""
    predictions = load_predictions()
    print(f"Loaded {len(predictions)} predictions from cache.")
    print()

    total_updated = 0

    for filepath in get_taxonomy_files():
        if not filepath.exists():
            print(f"Warning: {filepath.name} not found.")
            continue

        print(f"Processing {filepath.name}...")

        with open(filepath, 'r') as f:
            taxonomy = json.load(f)

        updated = 0

        for topic in taxonomy:
            for section in topic.get('sections', []):
                # Direct problems
                updated += apply_rating_to_problems(section.get('problems', []), predictions)
                # Subtopics
                for sub in section.get('subtopics', []):
                    updated += apply_rating_to_problems(sub.get('problems', []), predictions)

        if updated > 0:
            print(f"  Updated {updated} problems in {filepath.name}")
            total_updated += updated
            with open(filepath, 'w') as f:
                json.dump(taxonomy, f, indent=2)
        else:
            print(f"  No updates needed in {filepath.name}")

    print()
    if total_updated > 0:
        print(f"Successfully applied {total_updated} predictions.")
    else:
        print("No new predictions to apply.")


def main():
    parser = argparse.ArgumentParser(description="Apply predictions to taxonomy files")
    parser.add_argument("--dry-run", action="store_true", help="Show changes without writing files")
    parser.set_defaults(func=cmd_apply)
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
