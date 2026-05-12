import type { Problem, Gauntlet } from '@/data/types';
import { getTaxonomy } from '@/data/adapter';
import { uuidv4 } from '@/utils/uuid';

/**
 * Get all unique categories from the taxonomy
 */
export function getAllCategories(): string[] {
    const taxonomy = getTaxonomy();
    const categories = new Set<string>();

    for (const topic of taxonomy) {
        categories.add(topic.title);
    }

    return Array.from(categories).sort();
}

/**
 * Get all problems with their categories
 */
export function getAllProblemsWithCategories(): Array<{ problem: Problem; category: string }> {
    const taxonomy = getTaxonomy();
    const result: Array<{ problem: Problem; category: string }> = [];

    for (const topic of taxonomy) {
        for (const section of topic.sections) {
            for (const problem of section.problems) {
                result.push({ problem, category: topic.title });
            }
            for (const subtopic of section.subtopics) {
                for (const problem of subtopic.problems) {
                    result.push({ problem, category: topic.title });
                }
            }
        }
    }

    return result;
}

/**
 * Generate a random gauntlet based on criteria
 */
export interface GauntletConfig {
    problemCount: number;
    ratingRange: { min: number; max: number };
    categories: string[];
    solvedProblemIds?: Set<string>; // Optional: filter out solved problems
}

export function generateGauntlet(config: GauntletConfig): Gauntlet {
    const { problemCount, ratingRange, categories, solvedProblemIds = new Set() } = config;

    const allProblems = getAllProblemsWithCategories();

    // Filter problems by criteria
    let filteredProblems = allProblems.filter(({ problem, category }) => {
        // Filter by rating range
        if (problem.rating === null) return false;
        if (problem.rating < ratingRange.min || problem.rating > ratingRange.max) {
            return false;
        }

        // Filter by categories
        if (categories.length > 0 && !categories.includes(category)) {
            return false;
        }

        // Filter out solved problems (if provided)
        if (solvedProblemIds.has(problem.id)) {
            return false;
        }

        return true;
    });

    // If we don't have enough problems, try including solved ones
    if (filteredProblems.length < problemCount) {
        const unsolvedWithoutCategoryFilter = allProblems.filter(({ problem }) => {
            if (problem.rating === null) return false;
            if (problem.rating < ratingRange.min || problem.rating > ratingRange.max) {
                return false;
            }
            if (!solvedProblemIds.has(problem.id)) {
                return true;
            }
            return false;
        });

        if (unsolvedWithoutCategoryFilter.length > filteredProblems.length) {
            filteredProblems = unsolvedWithoutCategoryFilter;
        }
    }

    // If still not enough, include solved problems
    if (filteredProblems.length < problemCount) {
        const allMatching = allProblems.filter(({ problem, category }) => {
            if (problem.rating === null) return false;
            if (problem.rating < ratingRange.min || problem.rating > ratingRange.max) {
                return false;
            }
            if (categories.length > 0 && !categories.includes(category)) {
                return false;
            }
            return true;
        });

        if (allMatching.length > filteredProblems.length) {
            filteredProblems = allMatching;
        }
    }

    // Shuffle and select problems
    const shuffled = [...filteredProblems].sort(() => Math.random() - 0.5);
    const selectedProblems = shuffled.slice(0, Math.min(problemCount, shuffled.length));

    // Create gauntlet
    const gauntlet: Gauntlet = {
        id: uuidv4(),
        name: `Gauntlet ${new Date().toLocaleDateString()}`,
        problems: selectedProblems.map(({ problem }) => problem.id),
        createdAt: new Date().toISOString(),
        ratingRange,
        categories,
    };

    return gauntlet;
}

/**
 * Get category for a problem
 */
export function getProblemCategory(problemId: string): string | null {
    const allProblems = getAllProblemsWithCategories();
    const found = allProblems.find(({ problem }) => problem.id === problemId);
    return found?.category || null;
}

/**
 * Get all problems for a gauntlet
 */
export function getGauntletProblems(gauntlet: Gauntlet): Array<{ problem: Problem; category: string }> {
    const allProblems = getAllProblemsWithCategories();
    const problemMap = new Map(allProblems.map(({ problem, category }) => [problem.id, { problem, category }]));

    return gauntlet.problems
        .map(id => problemMap.get(id))
        .filter(Boolean) as Array<{ problem: Problem; category: string }>;
}
