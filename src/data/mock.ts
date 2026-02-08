export type Problem = {
    id: string;
    title: string;
    rating: number; // Elo
    difficulty: "Easy" | "Medium" | "Hard";
    isEssential: boolean; // < 1700
    isSolved: boolean;
};

export type SubPattern = {
    id: string;
    title: string;
    description: string; // The "Concept"
    problems: Problem[];
};

export type Topic = {
    id: string;
    title: string;
    subPatterns: SubPattern[];
};

export const MOCK_GALAXY: Topic[] = [
    {
        id: "sliding-window",
        title: "1. Sliding Window",
        subPatterns: [
            {
                id: "sw-fixed",
                title: "Fixed Length",
                description: "The window size k never changes. Slide right, add one, remove one.",
                problems: [
                    { id: "1456", title: "Max Vowels in Substring", rating: 1263, difficulty: "Medium", isEssential: true, isSolved: true },
                    { id: "643", title: "Max Average Subarray", rating: 1300, difficulty: "Easy", isEssential: true, isSolved: false },
                    { id: "1343", title: "Subarrays with Threshold", rating: 1350, difficulty: "Medium", isEssential: true, isSolved: false },
                ]
            },
            {
                id: "sw-variable",
                title: "Variable Length",
                description: "The caterpillar method. Expand right until invalid, then shrink left.",
                problems: [
                    { id: "3", title: "Longest Substring No Repeats", rating: 1400, difficulty: "Medium", isEssential: true, isSolved: false },
                    { id: "209", title: "Min Size Subarray Sum", rating: 1450, difficulty: "Medium", isEssential: true, isSolved: false },
                    { id: "76", title: "Min Window Substring", rating: 2100, difficulty: "Hard", isEssential: false, isSolved: false },
                ]
            }
        ]
    },
    {
        id: "two-pointers",
        title: "2. Two Pointers",
        subPatterns: [
            {
                id: "tp-opposite",
                title: "Opposite Direction",
                description: "One starts at 0, one at n-1. They walk towards each other.",
                problems: [
                    { id: "167", title: "Two Sum II", rating: 1000, difficulty: "Medium", isEssential: true, isSolved: false },
                    { id: "11", title: "Container With Most Water", rating: 1500, difficulty: "Medium", isEssential: true, isSolved: false },
                ]
            }
        ]
    }
];
