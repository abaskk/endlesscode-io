#!/bin/bash
set -e

echo "🚀 Starting Data Pipeline..."

# 1. Run Parser
echo "📦 Running parser.py..."
uv run python parser.py

# 2. Check output exists
if [ -f "generated/taxonomy_graph.json" ]; then
    echo "✅ Parser finished successfully."
else
    echo "❌ Error: Parser failed to generate taxonomy_graph.json"
    exit 1
fi

# 3. Deploy to Frontend
echo "🚚 Deploying data to frontend..."
if [ -f "../../src/data/taxonomy_graph.json" ]; then
    cp ../../src/data/taxonomy_graph.json ../../src/data/taxonomy_graph.json.bak
    echo "   (Backed up existing data to taxonomy_graph.json.bak)"
fi
cp generated/taxonomy_graph.json ../../src/data/taxonomy_graph.json

echo "✨ Done! Frontend data updated."
