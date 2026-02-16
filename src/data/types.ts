export type Problem = {
    id: string;
    title: string;
    slug: string;
    rating: number | null;
    difficulty: "Easy" | "Medium" | "Hard" | "Unknown";
    is_premium: boolean;
    tags: string[]; // CORE, ADVANCED, OPTIONAL, THINKING (from H4 headers)
    url: string; // Computed from slug
    is_predicted?: boolean;
};

export type Subtopic = {
    title: string;
    title_zh?: string;
    description?: string;
    description_zh?: string;
    problems: Problem[];
};

export type Section = {
    title: string;
    title_zh?: string;
    description?: string;
    description_zh?: string;
    subtopics: Subtopic[];
    problems: Problem[]; // Problems directly under H2 (before any H3)
};

export type Topic = {
    id: string;
    group: string;
    title: string;
    sections: Section[];
};
