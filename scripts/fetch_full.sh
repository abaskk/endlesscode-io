#!/bin/bash
set -e

# Base URL for LeetCode CN Discuss
BASE_URL="https://leetcode.cn/circle/discuss"
USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

# Directory for Full Practice
DATA_DIR="tools/galaxy-scraper/raw_galaxy_pages/full-practice"
mkdir -p "$DATA_DIR"

declare -A TOPICS
TOPICS=(
    ["sliding_window"]="0viNMK"
    ["binary_search"]="SqopEo"
    ["monotonic_stack"]="9oZFK9"
    ["grid_graph"]="YiXPXW"
    ["bitwise"]="dHn9Vk"
    ["graph"]="01LUak"
    ["dp"]="tXLS3i"
    ["data_structures"]="mOr1u6"
    ["math"]="IYT3ss"
    ["greedy"]="g6KTKL"
    ["linked_list_tree"]="K0n2gO"
    ["strings"]="SJFwQI"
)

for NAME in "${!TOPICS[@]}"; do
    ID="${TOPICS[$NAME]}"
    URL="${BASE_URL}/${ID}/"
    echo "Fetching ${NAME} (${ID})..."
    curl -L -A "$USER_AGENT" --retry 3 --connect-timeout 10 "$URL" -o "${DATA_DIR}/${NAME}.html"
    sleep 2 # Be nice
done

ls -l "$DATA_DIR"
