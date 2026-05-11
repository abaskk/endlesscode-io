#!/usr/bin/env python3
"""
Prediction commands: generate predictions with similarity search.
"""

import argparse
import json
import re
import requests
import time
from core.utils import (
    get_api_key,
    load_merged_problems,
    load_predictions,
    save_predictions,
    load_embeddings,
    find_similar_problems,
    fetch_problem_meta,
    collect_slugs_to_predict,
    DEFAULT_PREDICT_MODEL,
)
from core.prompts import build_user_prompt, SYSTEM_PROMPT


def call_openrouter(api_key, user_prompt, model_name):
    """Call OpenRouter API for rating prediction."""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model_name,
        "temperature": 0.3,
        "response_format": {"type": "json_object"},
        "plugins": [
            {
                "id": "web",
                "max_results": 3,
                "include_domains": ["leetcode.com", "leetcode.ca", "walkccc.me", "neetcode.io", "github.com"]
            }
        ],
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
    }

    try:
        resp = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            data=json.dumps(payload),
            timeout=120
        )
        resp.raise_for_status()
        data = resp.json()
        content = data["choices"][0]["message"]["content"]

        # Try parsing JSON (handle markdown-wrapped responses)
        json_match = re.search(r'```json\s*(.*?)\s*```', content, re.DOTALL)
        if json_match:
            content = json_match.group(1)
        return json.loads(content)
    except requests.exceptions.HTTPError as e:
        print(f"  [x] HTTP Error: {e}")
        print(f"      Response: {e.response.text[:500] if hasattr(e, 'response') else ''}")
        return None
    except json.JSONDecodeError:
        print(f"  [x] Failed to parse JSON from response: {content[:500]}")
        return None
    except Exception as e:
        print(f"  [x] API Error: {e}")
        return None


def cmd_predict(args):
    """Generate predictions for problems needing ratings."""
    api_key = get_api_key()
    merged_lookup = load_merged_problems()
    predictions = load_predictions()

    # Load embeddings for similarity search
    problems_with_embeddings = None
    embeddings = None
    if not args.no_similar:
        print("Loading embeddings for similarity search...")
        problems_with_embeddings, embeddings = load_embeddings()
        if problems_with_embeddings:
            print(f"Loaded {len(problems_with_embeddings)} problems with embeddings.")
        else:
            print("  [!] Could not load embeddings, continuing without similarity search.")
            args.no_similar = True

    # Get slugs to predict
    if args.slug:
        slugs_to_predict = {args.slug}
    else:
        slugs_to_predict = collect_slugs_to_predict()

    print(f"Found {len(slugs_to_predict)} unique problems that require predictions.")
    if args.force:
        print(f"Force mode: will regenerate all {len(slugs_to_predict)} predictions.")
    print()

    # Predict
    new_predictions = 0
    for slug in slugs_to_predict:
        if not args.force and slug in predictions:
            continue

        print(f"Predicting rating for: {slug}")

        meta = merged_lookup.get(slug)
        if not meta:
            meta = fetch_problem_meta(slug, api_key)

        if not meta:
            print("  [-] Could not find metadata, skipping.")
            continue

        # Find similar problems for context
        similar_problems = None
        if not args.no_similar and problems_with_embeddings and embeddings:
            similar_problems = find_similar_problems(meta, api_key, problems_with_embeddings, embeddings, k=5)
            if similar_problems:
                print(f"  [*] Found {len(similar_problems)} similar reference problems")

        user_prompt = build_user_prompt(meta, similar_problems)

        try:
            time.sleep(0.1)
            result = call_openrouter(api_key, user_prompt, args.model)
            if result and "predicted_rating" in result:
                new_rating = int(result["predicted_rating"])
                rationale = result.get('rationale', '')
                print(f"  [+] Predicted: {new_rating} | Rationale: {rationale}")

                predictions[slug] = {
                    "predicted_rating": new_rating,
                    "rationale": rationale,
                    "annotator": args.model
                }
                new_predictions += 1

                # Write to disk after every successful prediction
                save_predictions(predictions)

                if not args.all and new_predictions >= args.k:
                    print(f"\n[!] Reached limit of {args.k} prediction(s). Stopping early.")
                    break
            else:
                print("  [x] Invalid response format.")
        except Exception as e:
            print(f"  [x] API Error: {e}")

        if not args.all and new_predictions >= args.k:
            break

    print()
    print(f"Finished. Made {new_predictions} new predictions.")


def cmd_list(args):
    """List all predictions."""
    predictions = load_predictions()
    print(f"Total predictions: {len(predictions)}")
    print()
    for slug, pred in sorted(predictions.items()):
        print(f"  {slug}: {pred['predicted_rating']} ({pred['annotator']})")


def main():
    parser = argparse.ArgumentParser(description="Rating predictor commands")
    subparsers = parser.add_subparsers(dest='command', help='Command to run')

    # predict command
    predict_parser = subparsers.add_parser('predict', help='Generate predictions')
    predict_parser.add_argument("--all", action="store_true", help="Run predictions on all remaining problems")
    predict_parser.add_argument("-k", type=int, default=1, help="Number of predictions to run (default: 1)")
    predict_parser.add_argument("--model", type=str, default=DEFAULT_PREDICT_MODEL, help=f"OpenRouter model (default: {DEFAULT_PREDICT_MODEL})")
    predict_parser.add_argument("--force", action="store_true", help="Regenerate all predictions (ignores existing ones)")
    predict_parser.add_argument("--no-similar", action="store_true", help="Disable similarity-based reference context")
    predict_parser.add_argument("--slug", type=str, help="Predict for a specific problem slug")
    predict_parser.set_defaults(func=cmd_predict)

    # list command
    list_parser = subparsers.add_parser('list', help='List all predictions')
    list_parser.set_defaults(func=cmd_list)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
