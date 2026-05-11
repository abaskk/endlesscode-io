#!/usr/bin/env python3
"""
Rating Predictor CLI - Unified tool for predicting LeetCode problem ratings.

Usage:
    python cli.py setup join          # Join zerotrac with merged_problems
    python cli.py setup embeddings     # Generate embeddings
    python cli.py predict --all         # Predict all remaining problems
    python cli.py predict --slug two-sum  # Predict specific problem
    python cli.py list                 # List all predictions
    python cli.py apply                # Apply predictions to taxonomy files
"""

import argparse
from pathlib import Path

# Import subcommands
from core.utils import PREDICTIONS_PATH, EMBEDDINGS_PATH, MERGED_RATING_PATH


def cmd_status(args):
    """Show status of data files."""
    print("Rating Predictor Status")
    print("=" * 40)
    print()

    # Check API key
    api_key_path = Path(__file__).parent / "api_key.txt"
    if api_key_path.exists():
        print("✓ API key configured")
    else:
        print("✗ API key not configured")
        print(f"  Create {api_key_path} with your OpenRouter key")
    print()

    # Check data files
    print("Data Files:")
    print(f"  Predictions: {'✓' if PREDICTIONS_PATH.exists() else '✗'} {PREDICTIONS_PATH.name}")
    if PREDICTIONS_PATH.exists():
        import json
        with open(PREDICTIONS_PATH, 'r') as f:
            pred = json.load(f)
        print(f"    Count: {len(pred)} predictions")

    print(f"  Embeddings: {'✓' if EMBEDDINGS_PATH.exists() else '✗'} {EMBEDDINGS_PATH.name}")
    if EMBEDDINGS_PATH.exists():
        import json
        with open(EMBEDDINGS_PATH, 'r') as f:
            emb = json.load(f)
        print(f"    Count: {emb.get('count', 0)} problems")

    print(f"  Merged Rating: {'✓' if MERGED_RATING_PATH.exists() else '✗'} {MERGED_RATING_PATH.name}")
    if MERGED_RATING_PATH.exists():
        import json
        with open(MERGED_RATING_PATH, 'r') as f:
            mr = json.load(f)
        print(f"    Count: {len(mr)} problems")


def main():
    parser = argparse.ArgumentParser(
        description="LeetCode Rating Predictor CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    subparsers = parser.add_subparsers(dest='command', help='Command to run')

    # status command
    status_parser = subparsers.add_parser('status', help='Show status of data files')
    status_parser.set_defaults(func=cmd_status)

    # Setup subcommands
    setup_parser = subparsers.add_parser('setup', help='Setup commands (join, embeddings)')
    setup_subparsers = setup_parser.add_subparsers(dest='setup_cmd')

    setup_join_parser = setup_subparsers.add_parser('join', help='Join zerotrac with merged_problems')
    from setup import cmd_join as setup_cmd_join
    setup_join_parser.set_defaults(func=lambda args: setup_cmd_join(args))

    setup_emb_parser = setup_subparsers.add_parser('embeddings', help='Generate embeddings')
    from setup import cmd_embeddings as setup_cmd_embeddings
    setup_emb_parser.set_defaults(func=lambda args: setup_cmd_embeddings(args))

    # Predict subcommands
    predict_parser = subparsers.add_parser('predict', help='Generate predictions')
    from predict import cmd_predict as predict_cmd
    predict_parser.add_argument("--all", action="store_true", help="Run predictions on all remaining problems")
    predict_parser.add_argument("-k", type=int, default=1, help="Number of predictions to run (default: 1)")
    predict_parser.add_argument("--model", type=str, help="OpenRouter model to use")
    predict_parser.add_argument("--force", action="store_true", help="Regenerate all predictions")
    predict_parser.add_argument("--no-similar", action="store_true", help="Disable similarity-based reference context")
    predict_parser.add_argument("--slug", type=str, help="Predict for a specific problem slug")
    predict_parser.set_defaults(func=lambda args: predict_cmd(args))

    # List subcommands
    list_parser = subparsers.add_parser('list', help='List all predictions')
    from predict import cmd_list as predict_cmd_list
    list_parser.set_defaults(func=lambda args: predict_cmd_list(args))

    # Apply command
    apply_parser = subparsers.add_parser('apply', help='Apply predictions to taxonomy files')
    from apply import cmd_apply as apply_cmd
    apply_parser.add_argument("--dry-run", action="store_true", help="Show changes without writing files")
    apply_parser.set_defaults(func=lambda args: apply_cmd(args))

    args = parser.parse_args()
    if hasattr(args, 'func'):
        args.func(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
