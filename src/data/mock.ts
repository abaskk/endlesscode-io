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
    concept: {
        summary: string;
        visual: string; // URL placeholder
        code: string; // Template code
        checklist: string[];
    };
    problems: Problem[];
};

export type Topic = {
    id: string;
    title: string;
    preamble: {
        summary: string;
        visual: string; // URL placeholder
        checklist: string[];
    };
    subPatterns: SubPattern[];
};

export const MOCK_GALAXY: Topic[] = [
    {
        id: "basics",
        title: "0. The Basics",
        preamble: {
            summary: "Before jumping into patterns, we must master the vocabulary of efficiency: Big O Notation.",
            visual: "",
            checklist: ["Understand Time Complexity", "Understand Space Complexity", "Know common complexity classes"]
        },
        subPatterns: [
            {
                id: "big-o",
                title: "Big O Analysis",
                description: "How to measure algorithm efficiency.",
                concept: {
                    summary: "Big O notation describes the limiting behavior of a function when the argument tends towards a particular value or infinity.",
                    visual: "",
                    code: `// O(1) - Constant
const first = arr[0];

// O(n) - Linear
for(let i=0; i<n; i++) {}

// O(n^2) - Quadratic
for(let i=0; i<n; i++) {
  for(let j=0; j<n; j++) {}
}`,
                    checklist: [
                        "Drop constants",
                        "Drop lower order terms",
                        "Focus on the worst case"
                    ]
                },
                problems: [] // Basics might not have problems yet
            }
        ]
    },
    {
        id: "sliding-window",
        title: "1. Sliding Window",
        preamble: {
            summary: "The Sliding Window pattern is used to perform a required operation on a specific window size of a given array or string, like a physical window sliding over the data.",
            visual: "",
            checklist: ["Contiguous subarray/substring", "Optimizing nested loops from O(n^2) to O(n)"]
        },
        subPatterns: [
            {
                id: "sw-fixed",
                title: "Fixed Length",
                description: "The window size k never changes. Slide right, add one, remove one.",
                concept: {
                    summary: "A fixed-size window moves across the array. Think of a physical frame sliding over a strip of film.",
                    visual: "https://placeholder.com/sliding-window-diagram",
                    code: `// Template for Fixed Sliding Window
let currentSum = 0;
for (let i = 0; i < k; i++) {
    currentSum += nums[i];
}
let maxSum = currentSum;

for (let i = k; i < nums.length; i++) {
    currentSum += nums[i] - nums[i - k];
    maxSum = Math.max(maxSum, currentSum);
}
return maxSum;`,
                    checklist: [
                        "Input is an array/string",
                        "You need to find something in a contiguous subarray",
                        "The subarray size (k) is fixed"
                    ]
                },
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
                concept: {
                    summary: "Expand the window by moving 'right'. If the window becomes invalid, shrink it by moving 'left' until validity is restored.",
                    visual: "https://placeholder.com/variable-window-diagram",
                    code: `// Template for Variable Sliding Window
let left = 0;
let currentSum = 0;
let ans = 0;

for (let right = 0; right < nums.length; right++) {
    // 1. Add element to window
    currentSum += nums[right];

    // 2. Shrink window while condition is broken
    while (currentSum > target) {
        currentSum -= nums[left];
        left++;
    }

    // 3. Update answer (window is valid here)
    ans = Math.max(ans, right - left + 1);
}
return ans;`,
                    checklist: [
                        "Find longest/shortest subarray",
                        "Condition can be broken by adding more elements",
                        "Condition can be restored by removing elements"
                    ]
                },
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
        preamble: {
            summary: "Two Pointers is a technique where two pointers iterate through the data structure in tandem, usually to reduce time complexity from O(n^2) to O(n).",
            visual: "",
            checklist: ["Sorted arrays", "Finding pairs/triplets", "In-place operations"]
        },
        subPatterns: [
            {
                id: "tp-opposite",
                title: "Opposite Direction",
                description: "One starts at 0, one at n-1. They walk towards each other.",
                concept: {
                    summary: "Two pointers starting at opposite ends moving towards each other. Used for sorted arrays or palindrome checking.",
                    visual: "",
                    code: `// Template for Two Pointers
let left = 0;
let right = nums.length - 1;

while (left < right) {
    let sum = nums[left] + nums[right];
    if (sum === target) return [left, right];
    else if (sum < target) left++;
    else right--;
}`,
                    checklist: [
                        "Input array is sorted (often)",
                        "Finding pairs or checking symmetry",
                        "O(n) time requirement"
                    ]
                },
                problems: [
                    { id: "167", title: "Two Sum II", rating: 1000, difficulty: "Medium", isEssential: true, isSolved: false },
                    { id: "11", title: "Container With Most Water", rating: 1500, difficulty: "Medium", isEssential: true, isSolved: false },
                ]
            }
        ]
    }
];
