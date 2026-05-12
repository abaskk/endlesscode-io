import type { Problem, ProblemReview, Gauntlet } from "@/data/types";

/**
 * Escape a CSV field value (handles commas, quotes, and newlines)
 */
function escapeCsvValue(value: string): string {
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
}

/**
 * Download a CSV file
 */
function downloadCsv(content: string, filename: string) {
    // Add BOM for Excel compatibility
    const bom = '\uFEFF';
    const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

/**
 * Export review queue to CSV
 * Columns: Title, Difficulty, Rating, Due Date, Review Count, Notes
 */
export function exportReviewQueue(
    reviews: Record<string, ProblemReview>,
    problems: Problem[]
) {
    const headers = ['Title', 'Difficulty', 'Rating', 'Due Date', 'Review Count', 'Notes', 'URL'];

    const rows = Object.entries(reviews).map(([problemId, review]) => {
        const problem = problems.find(p => p.id === problemId);
        if (!problem) return null;

        const dueDate = new Date(review.nextReview).toLocaleDateString();
        const rating = problem.rating?.toString() || 'N/A';

        return [
            escapeCsvValue(problem.title),
            escapeCsvValue(review.difficulty),
            escapeCsvValue(rating),
            escapeCsvValue(dueDate),
            escapeCsvValue(review.reviewCount.toString()),
            escapeCsvValue(review.notes || ''),
            escapeCsvValue(problem.url),
        ].join(',');
    }).filter(Boolean);

    const csvContent = [headers.join(','), ...rows].join('\n');
    const filename = `review-queue-${new Date().toISOString().split('T')[0]}.csv`;

    downloadCsv(csvContent, filename);
}

/**
 * Export gauntlet to CSV
 * Columns: Title, Difficulty, Rating, URL
 */
export function exportGauntlet(
    gauntlet: Gauntlet,
    problems: Problem[],
    _problemCategories: Map<string, string>
) {
    const headers = ['Title', 'Difficulty', 'Rating', 'URL'];

    const rows = gauntlet.problems.map((problemId) => {
        const problem = problems.find(p => p.id === problemId);
        if (!problem) return null;

        const rating = problem.rating?.toString() || 'N/A';

        return [
            escapeCsvValue(problem.title),
            escapeCsvValue(problem.difficulty),
            escapeCsvValue(rating),
            escapeCsvValue(problem.url),
        ].join(',');
    }).filter(Boolean);

    const csvContent = [headers.join(','), ...rows].join('\n');
    const filename = `gauntlet-${gauntlet.name}-${new Date().toISOString().split('T')[0]}.csv`;

    downloadCsv(csvContent, filename);
}
