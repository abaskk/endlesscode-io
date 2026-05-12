import type { ProblemReview } from "@/data/types";

/**
 * Simple SuperMemo-2 style spaced repetition algorithm.
 * Calculates the next review date based on:
 * - Current review count
 * - User's self-rated difficulty
 * - Performance (correct/incorrect on review)
 */
export function calculateNextReview(
    currentReview: ProblemReview,
    performance: 'correct' | 'incorrect' = 'correct'
): string {
    const { reviewCount, difficulty } = currentReview;

    // Base intervals in days for each confidence level (after first review)
    // "Struggle" = shorter intervals (needs more frequent review)
    // "Confident" = medium intervals
    // "Mastered" = longer intervals (can review less frequently)
    const difficultyMultipliers: Record<ProblemReview['difficulty'], number> = {
        'Struggle': 1.0,
        'Confident': 1.5,
        'Mastered': 2.5,
    };

    // If incorrect, reset to shorter interval
    if (performance === 'incorrect') {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 1);
        return nextDate.toISOString();
    }

    // Calculate interval using SuperMemo-2 formula: I(n) = I(n-1) * EF
    // First review is always 1 day
    if (reviewCount === 0) {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 1);
        return nextDate.toISOString();
    }

    // For subsequent reviews, use intervals: 3, 7, 14, 30, 60, 120 days
    // Modified by difficulty multiplier
    const baseIntervals = [1, 3, 7, 14, 30, 60, 120];
    const intervalIndex = Math.min(reviewCount, baseIntervals.length - 1);
    const baseInterval = baseIntervals[intervalIndex];

    const multiplier = difficultyMultipliers[difficulty];
    const daysToAdd = Math.round(baseInterval * multiplier);

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + daysToAdd);

    return nextDate.toISOString();
}

/**
 * Get a human-readable relative time string for a review due date
 */
export function getRelativeTimeString(dateString: string): string {
    const now = new Date();
    const dueDate = new Date(dateString);
    const diffMs = dueDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        const absDays = Math.abs(diffDays);
        if (absDays === 1) return '1 day overdue';
        return `${absDays} days overdue`;
    } else if (diffDays === 0) {
        return 'Due today';
    } else if (diffDays === 1) {
        return 'Due tomorrow';
    } else if (diffDays < 7) {
        return `Due in ${diffDays} days`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `Due in ${weeks} week${weeks > 1 ? 's' : ''}`;
    } else {
        const months = Math.floor(diffDays / 30);
        return `Due in ${months} month${months > 1 ? 's' : ''}`;
    }
}

/**
 * Get the urgency level of a review (for sorting and UI display)
 */
export function getReviewUrgency(dateString: string): 'overdue' | 'soon' | 'upcoming' | 'later' {
    const now = new Date();
    const dueDate = new Date(dateString);
    const diffMs = dueDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'overdue';
    if (diffDays <= 1) return 'soon';
    if (diffDays <= 7) return 'upcoming';
    return 'later';
}

/**
 * Sort problems by review priority:
 * 1. Overdue reviews first
 * 2. Then by personal difficulty (hardest first)
 * 3. Then by due date (earliest first)
 */
export function sortReviewsByPriority<T extends { problemId: string; review: ProblemReview }>(
    items: T[],
    _getProblemRating: (problemId: string) => number | null
): T[] {
    const difficultyOrder: Record<ProblemReview['difficulty'], number> = {
        'Struggle': 0,
        'Confident': 1,
        'Mastered': 2,
    };

    return [...items].sort((a, b) => {
        const aUrgency = getReviewUrgency(a.review.nextReview);
        const bUrgency = getReviewUrgency(b.review.nextReview);

        // Sort by urgency
        const urgencyOrder = { 'overdue': 0, 'soon': 1, 'upcoming': 2, 'later': 3 };
        if (aUrgency !== bUrgency) {
            return urgencyOrder[aUrgency] - urgencyOrder[bUrgency];
        }

        // Then by difficulty (hardest first)
        const aDifficulty = difficultyOrder[a.review.difficulty];
        const bDifficulty = difficultyOrder[b.review.difficulty];
        if (aDifficulty !== bDifficulty) {
            return aDifficulty - bDifficulty;
        }

        // Then by due date (earliest first)
        return new Date(a.review.nextReview).getTime() - new Date(b.review.nextReview).getTime();
    });
}
