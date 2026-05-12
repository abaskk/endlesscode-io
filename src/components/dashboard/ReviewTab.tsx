import { useMemo, useState } from 'react';
import { useReview } from '@/context/ReviewContext';
import { getTaxonomy, getMasteryTaxonomy, getNeetcodeTaxonomy } from '@/data/adapter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Flame, AlertCircle, CheckCircle, Clock, Download, Trash2, FileText } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { exportReviewQueue } from '@/utils/csvExport';
import { getRelativeTimeString, getReviewUrgency, sortReviewsByPriority } from '@/utils/spacedRepetition';
import type { Problem, ProblemReview } from '@/data/types';
import { cn } from '@/lib/utils';

export function ReviewTab() {
    const { reviews, updateReview, removeReview } = useReview();
    const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'overdue' | 'Struggle' | 'Confident' | 'Mastered'>('all');
    const [notesModalOpen, setNotesModalOpen] = useState(false);
    const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
    const [editingNotes, setEditingNotes] = useState('');

    // Get all problems from ALL taxonomies
    const allProblems = useMemo(() => {
        const taxonomies = [getTaxonomy(), getMasteryTaxonomy(), getNeetcodeTaxonomy()];
        const problems: Problem[] = [];
        const seenIds = new Set<string>();

        for (const taxonomy of taxonomies) {
            for (const topic of taxonomy) {
                for (const section of topic.sections) {
                    for (const problem of section.problems) {
                        if (!seenIds.has(problem.id)) {
                            seenIds.add(problem.id);
                            problems.push(problem);
                        }
                    }
                    for (const subtopic of section.subtopics) {
                        for (const problem of subtopic.problems) {
                            if (!seenIds.has(problem.id)) {
                                seenIds.add(problem.id);
                                problems.push(problem);
                            }
                        }
                    }
                }
            }
        }
        return problems;
    }, []);

    // Create problem map for easy lookup
    const problemMap = useMemo(() => {
        const map = new Map<string, Problem>();
        for (const problem of allProblems) {
            map.set(problem.id, problem);
        }
        return map;
    }, [allProblems]);

    // Combine reviews with problems and sort by priority
    const reviewItems = useMemo(() => {
        const items = Object.entries(reviews).map(([problemId, review]) => ({
            problemId,
            review,
        }));

        // Filter by selected difficulty
        const filtered = selectedDifficulty === 'all' || selectedDifficulty === 'overdue'
            ? items
            : items.filter(item => item.review.difficulty === selectedDifficulty);

        // If filtering by overdue, only show overdue items
        if (selectedDifficulty === 'overdue') {
            const overdueItems = filtered.filter(item => getReviewUrgency(item.review.nextReview) === 'overdue');
            return sortReviewsByPriority(overdueItems, () => null);
        }

        return sortReviewsByPriority(filtered, () => null);
    }, [reviews, selectedDifficulty]);

    const handleMarkReviewed = (problemId: string) => {
        const review = reviews[problemId];
        if (review) {
            const newCount = review.reviewCount + 1;

            // Auto-remove from queue after 3 successful reviews (mastered)
            if (newCount >= 3) {
                removeReview(problemId);
                return;
            }

            // Mark as reviewed (correct by default)
            const nextReview = new Date().toISOString();
            updateReview(problemId, {
                reviewCount: newCount,
                lastReviewed: nextReview,
            });
        }
    };

    const handleRemove = (problemId: string) => {
        removeReview(problemId);
    };

    const handleEditNotes = (problemId: string) => {
        const review = reviews[problemId];
        setEditingProblemId(problemId);
        setEditingNotes(review?.notes || '');
        setNotesModalOpen(true);
    };

    const handleSaveNotes = () => {
        if (editingProblemId) {
            updateReview(editingProblemId, {
                notes: editingNotes || undefined,
            });
        }
        setNotesModalOpen(false);
        setEditingProblemId(null);
        setEditingNotes('');
    };

    const handleExport = () => {
        exportReviewQueue(reviews, allProblems);
    };

    const getUrgencyIcon = (dueDate: string) => {
        const urgency = getReviewUrgency(dueDate);
        switch (urgency) {
            case 'overdue':
                return <Flame className="w-4 h-4 text-red-500" />;
            case 'soon':
                return <AlertCircle className="w-4 h-4 text-amber-500" />;
            case 'upcoming':
                return <Clock className="w-4 h-4 text-blue-500" />;
            default:
                return <Clock className="w-4 h-4 text-muted-foreground" />;
        }
    };

    const getDifficultyColor = (difficulty: ProblemReview['difficulty']) => {
        switch (difficulty) {
            case 'Struggle': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Confident': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Mastered': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        }
    };

    const stats = useMemo(() => {
        const total = Object.keys(reviews).length;
        const overdue = Object.values(reviews).filter(r => getReviewUrgency(r.nextReview) === 'overdue').length;
        const mastered = Object.values(reviews).filter(r => r.reviewCount >= 3).length;

        // Calculate progress as (current reviews) / (total reviews needed to master all problems)
        // Each problem needs 3 reviews to master
        const totalReviewsNeeded = total * 3;
        const currentReviews = Object.values(reviews).reduce((sum, r) => sum + Math.min(r.reviewCount, 3), 0);
        const progress = totalReviewsNeeded > 0 ? Math.round((currentReviews / totalReviewsNeeded) * 100) : 0;

        return { total, overdue, mastered, progress };
    }, [reviews]);

    if (Object.keys(reviews).length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Clock className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No problems in review queue</h3>
                <p className="text-muted-foreground text-sm">
                    Mark problems for review from any problem list to start tracking your progress.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with stats and actions */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Review Queue</h2>
                    <p className="text-muted-foreground text-sm">
                        {stats.overdue > 0 && (
                            <span className="text-red-500 font-medium">{stats.overdue} overdue</span>
                        )}
                        {stats.overdue > 0 && ' · '}
                        <span>{stats.total} total problems</span>
                        {stats.mastered > 0 && ` · ${stats.mastered} mastered`}
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                </Button>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Mastery Progress</span>
                    <span className="font-medium">{stats.progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
                        style={{ width: `${stats.progress}%` }}
                    />
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
                <Button
                    variant={selectedDifficulty === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedDifficulty('all')}
                >
                    All
                </Button>
                <Button
                    variant={selectedDifficulty === 'overdue' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedDifficulty('overdue')}
                    className={selectedDifficulty === 'overdue' ? 'bg-red-500 hover:bg-red-600' : ''}
                >
                    Overdue ({stats.overdue})
                </Button>
                <div className="w-px bg-border mx-2" />
                <Button
                    variant={selectedDifficulty === 'Struggle' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedDifficulty('Struggle')}
                >
                    Struggle
                </Button>
                <Button
                    variant={selectedDifficulty === 'Confident' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedDifficulty('Confident')}
                >
                    Confident
                </Button>
                <Button
                    variant={selectedDifficulty === 'Mastered' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedDifficulty('Mastered')}
                >
                    Mastered
                </Button>
            </div>

            {/* Review table */}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Problem</TableHead>
                        <TableHead className="w-[100px]">Difficulty</TableHead>
                        <TableHead className="w-[150px]">Due</TableHead>
                        <TableHead className="w-[80px]">Reviews</TableHead>
                        <TableHead className="w-[80px]">Notes</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reviewItems.map(({ problemId, review }) => {
                        const problem = problemMap.get(problemId);
                        if (!problem) return null;

                        return (
                            <TableRow key={problemId}>
                                <TableCell>
                                    {getUrgencyIcon(review.nextReview)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{problem.title}</span>
                                        <a
                                            href={problem.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="opacity-50 hover:opacity-100 transition-opacity"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        className={cn('text-xs', getDifficultyColor(review.difficulty))}
                                    >
                                        {review.difficulty}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <span className={cn(
                                        'text-sm',
                                        getReviewUrgency(review.nextReview) === 'overdue' ? 'text-red-500 font-medium' : ''
                                    )}>
                                        {getRelativeTimeString(review.nextReview)}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(review.reviewCount, 3) }).map((_, i) => (
                                            <CheckCircle key={i} className="w-3 h-3 text-green-500" />
                                        ))}
                                        {review.reviewCount > 3 && (
                                            <span className="text-xs text-muted-foreground">+{review.reviewCount - 3}</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleEditNotes(problemId)}
                                        title={review.notes ? "Edit notes" : "Add notes"}
                                    >
                                        <FileText className={`w-4 h-4 ${review.notes ? 'text-primary' : 'text-muted-foreground'}`} />
                                    </Button>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleMarkReviewed(problemId)}
                                            title="Mark as reviewed"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleRemove(problemId)}
                                            title="Remove from review"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            {/* Notes Modal */}
            <Dialog open={notesModalOpen} onOpenChange={setNotesModalOpen}>
                <DialogContent className="sm:max-w-md border-0">
                    <DialogHeader>
                        <DialogTitle>Notes</DialogTitle>
                        <DialogDescription>
                            Add or edit notes for this problem.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Add any notes about this problem..."
                            value={editingNotes}
                            onChange={(e) => setEditingNotes(e.target.value)}
                            className="min-h-[120px] mt-2"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setNotesModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveNotes}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
