
// galaxy-flat.csv
export interface GalaxyRow {
    // Problem Identifier
    id: number;          // e.g. 1
    title: string;       // e.g. "Two Sum"
    slug: string;        // e.g. "two-sum" - unique identifier for grouping

    // Metadata
    rating: number | null; // e.g. 1161 (null if new/unrated)
    difficulty: "Easy" | "Medium" | "Hard" | null; // Use standard LeetCode difficulty if available, otherwise null. (Though Endless Cheng usually uses Rating)
    is_premium: boolean;   // e.g. true/false
    url: string;           // e.g. "https://leetcode.cn/problems/two-sum"

    // Taxonomy (Context - from Endless Cheng)
    ec_category: string;      // e.g. "Data Structures" (The main page)
    ec_section: string;       // e.g. "Arrays & Strings" (The H2)
    ec_group: string;         // e.g. "Enumerate Right" (The H3)
    ec_sub_group: string;     // e.g. "Basic" or "Advanced" (The list level)

    // Source
    source_url: string;    // e.g. "https://leetcode.cn/circle/discuss/mOr1u6/"
}
