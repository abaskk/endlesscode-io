import RAW_DATA from './taxonomy_graph.json';
import type { Topic, Problem } from './types';

// Cast the imported JSON to match V3 parser output
const TAXONOMY_DATA = RAW_DATA as Array<{
    id: string;
    group: string;
    title: string;
    sections: Array<{
        title: string;
        title_zh?: string;
        description?: string;
        description_zh?: string;
        subtopics: Array<{
            title: string;
            title_zh?: string;
            description?: string;
            description_zh?: string;
            problems: Array<{
                id: string;
                title: string;
                slug: string;
                rating: number | null;
                is_predicted?: boolean;
                difficulty: string;
                is_premium: boolean;
                tags: string[];
            }>;
        }>;
        problems: Array<{
            id: string;
            title: string;
            slug: string;
            rating: number | null;
            is_predicted?: boolean;
            difficulty: string;
            is_premium: boolean;
            tags: string[];
        }>;
    }>;
}>;

// Better topic titles
const TOPIC_TITLE_MAP: Record<string, string> = {
    'binary-search': 'Binary Search',
    'sliding-window': 'Sliding Window',
    'core-data-structures': 'Core Data Structures',
    'advanced-data-structures': 'Advanced Data Structures',
    'monotonic-stack': 'Monotonic Stack',
    'linked-list-tree': 'Linked List & Trees',
    'grid-graph': 'Grid DFS/BFS',
    'graph': 'Graph Algorithms',
    'dp': 'Dynamic Programming',
    'greedy': 'Greedy',
    'bitwise': 'Bit Manipulation',
    'math': 'Math & Combinatorics',
    'strings': 'String Algorithms'
};

// Order from plan.md - "Road to 2000" sequence
const TOPIC_ORDER = [
    'sliding-window',
    'binary-search',
    'core-data-structures',
    'advanced-data-structures',
    'monotonic-stack',
    'linked-list-tree',
    'grid-graph',
    'graph',
    'dp',
    'greedy',
    'bitwise',
    'math',
    'strings'
];

function adaptProblem(raw: {
    id: string;
    title: string;
    slug: string;
    rating: number | null;
    is_predicted?: boolean;
    difficulty: string;
    is_premium: boolean;
    tags: string[];
}): Problem {
    return {
        id: raw.id,
        title: raw.title,
        slug: raw.slug,
        rating: raw.rating,
        difficulty: raw.difficulty as Problem['difficulty'],
        is_premium: raw.is_premium,
        is_predicted: raw.is_predicted,
        tags: raw.tags || [],
        url: `https://leetcode.com/problems/${raw.slug}/`
    };
}

/**
 * Adapter to consume the V3 taxonomy_graph.json.
 * Maintains "Road to 2000" order from plan.md.
 * 
 * V3 Parser Change: 'data-structures' is split into Core and Advanced.
 */
export const getTaxonomy = (): Topic[] => {
    const adaptedTopics: Topic[] = [];

    // Helper to process a topic
    const processTopic = (id: string, group: string, title: string, sections: typeof TAXONOMY_DATA[0]['sections']) => {
        return {
            id,
            group,
            title: TOPIC_TITLE_MAP[id] || title,
            sections: sections.map(section => ({
                title: section.title,
                title_zh: section.title_zh,
                description: section.description,
                description_zh: section.description_zh,
                subtopics: (section.subtopics || []).map(sub => ({
                    title: sub.title,
                    title_zh: sub.title_zh,
                    description: sub.description,
                    description_zh: sub.description_zh,
                    problems: sub.problems.map(adaptProblem)
                })),
                problems: (section.problems || []).map(adaptProblem)
            }))
        };
    };

    for (const rawTopic of TAXONOMY_DATA) {
        if (rawTopic.id === 'data-structures') {
            // Split logic for Data Structures
            // Core: Common Enumeration, Prefix Sum, Difference Array, Stack, Queue, Heap, Union-Find
            // Advanced: Trie, BIT, Segment Tree, Splay Tree, Sqrt, Offline

            // We identify sections by title keywords since titles are translated
            const coreKeywords = [
                "Common Enumeration", "Prefix Sum", "Difference Array",
                "Stack", "Queue", "Heap", "Union-Find"
            ];

            const coreSections = rawTopic.sections.filter(s =>
                coreKeywords.some(kw => s.title.includes(kw))
            );

            // Advanced is everything else
            const advSections = rawTopic.sections.filter(s =>
                !coreKeywords.some(kw => s.title.includes(kw))
            );

            if (coreSections.length > 0) {
                adaptedTopics.push(processTopic(
                    'core-data-structures',
                    'CORE DATA STRUCTURES',
                    'Core Data Structures',
                    coreSections
                ));
            }

            if (advSections.length > 0) {
                adaptedTopics.push(processTopic(
                    'advanced-data-structures',
                    'ADVANCED DATA STRUCTURES',
                    'Advanced Data Structures',
                    advSections
                ));
            }
        } else {
            // Standard processing for other topics
            adaptedTopics.push(processTopic(
                rawTopic.id,
                rawTopic.group,
                rawTopic.title,
                rawTopic.sections
            ));
        }
    }

    // Sort according to TOPIC_ORDER
    return adaptedTopics.sort((a, b) => {
        const aIndex = TOPIC_ORDER.indexOf(a.id);
        const bIndex = TOPIC_ORDER.indexOf(b.id);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
    }).filter(topic => {
        return topic.sections.some(s =>
            s.problems.length > 0 || s.subtopics.some(st => st.problems.length > 0)
        );
    });
};

/**
 * Get total problem count across all topics.
 */
export const getTotalProblemCount = (): number => {
    const taxonomy = getTaxonomy();
    let count = 0;
    for (const topic of taxonomy) {
        for (const section of topic.sections) {
            count += section.problems.length;
            for (const sub of section.subtopics) {
                count += sub.problems.length;
            }
        }
    }
    return count;
};
