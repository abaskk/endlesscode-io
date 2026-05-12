import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useReview } from '@/context/ReviewContext';
import type { ProblemReview } from '@/data/types';
import { calculateNextReview } from '@/utils/spacedRepetition';

interface ReviewModalProps {
    problemId: string;
    problemTitle: string;
    children: React.ReactNode;
}

const DIFFICULTY_LEVELS: Array<{ value: ProblemReview['difficulty']; label: string; color: string }> = [
    { value: 'Struggle', label: 'Struggle', color: 'text-orange-600' },
    { value: 'Confident', label: 'Confident', color: 'text-blue-600' },
    { value: 'Mastered', label: 'Mastered', color: 'text-emerald-600' },
];

export function ReviewModal({ problemId, problemTitle, children }: ReviewModalProps) {
    const { getReview, addReview, updateReview } = useReview();
    const [open, setOpen] = useState(false);
    const [difficulty, setDifficulty] = useState<ProblemReview['difficulty']>('Struggle');
    const [notes, setNotes] = useState('');

    // Load existing review if it exists
    useEffect(() => {
        const existingReview = getReview(problemId);
        if (existingReview) {
            setDifficulty(existingReview.difficulty);
            setNotes(existingReview.notes || '');
        }
    }, [problemId, getReview, open]);

    const handleSave = () => {
        const existingReview = getReview(problemId);
        const now = new Date().toISOString();

        if (existingReview) {
            // Update existing review
            updateReview(problemId, {
                difficulty,
                notes: notes || undefined,
                lastReviewed: now,
            });
        } else {
            // Create new review - calculate proper next review date (1 day out)
            const newReview: ProblemReview = {
                difficulty,
                nextReview: calculateNextReview({
                    difficulty,
                    nextReview: now,
                    reviewCount: 0,
                    lastReviewed: now,
                }),
                reviewCount: 0,
                lastReviewed: now,
                notes: notes || undefined,
            };
            addReview(problemId, newReview);
        }

        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-md border-0">
                <DialogHeader>
                    <DialogTitle>Mark for Review</DialogTitle>
                    <DialogDescription>
                        Add {problemTitle} to your review queue.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>How difficult did you find this problem?</Label>
                        <RadioGroup value={difficulty} onValueChange={(v: string) => setDifficulty(v as ProblemReview['difficulty'])}>
                            {DIFFICULTY_LEVELS.map((level) => (
                                <div key={level.value} className="flex items-center space-x-2">
                                    <RadioGroupItem value={level.value} id={level.value} />
                                    <Label
                                        htmlFor={level.value}
                                        className={`font-normal cursor-pointer ${level.color}`}
                                    >
                                        {level.label}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (optional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Add any notes about this problem..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="min-h-[80px]"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
