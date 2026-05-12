import { createContext, useContext, useEffect, useState } from "react";
import type { ProblemReview } from "@/data/types";

interface ReviewContextType {
    reviews: Record<string, ProblemReview>;
    addReview: (problemId: string, review: ProblemReview) => void;
    updateReview: (problemId: string, updates: Partial<ProblemReview>) => void;
    removeReview: (problemId: string) => void;
    getReview: (problemId: string) => ProblemReview | undefined;
    isInReview: (problemId: string) => boolean;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

const STORAGE_KEY = "endlesscode-reviews";

export function ReviewProvider({ children }: { children: React.ReactNode }) {
    const [reviews, setReviews] = useState<Record<string, ProblemReview>>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
    }, [reviews]);

    const addReview = (problemId: string, review: ProblemReview) => {
        setReviews(prev => ({ ...prev, [problemId]: review }));
    };

    const updateReview = (problemId: string, updates: Partial<ProblemReview>) => {
        setReviews(prev => {
            const current = prev[problemId];
            if (!current) return prev;
            return { ...prev, [problemId]: { ...current, ...updates } };
        });
    };

    const removeReview = (problemId: string) => {
        setReviews(prev => {
            const { [problemId]: _, ...rest } = prev;
            return rest;
        });
    };

    const getReview = (problemId: string) => reviews[problemId];

    const isInReview = (problemId: string) => problemId in reviews;

    return (
        <ReviewContext.Provider value={{
            reviews,
            addReview,
            updateReview,
            removeReview,
            getReview,
            isInReview,
        }}>
            {children}
        </ReviewContext.Provider>
    );
}

export function useReview() {
    const context = useContext(ReviewContext);
    if (context === undefined) {
        throw new Error("useReview must be used within a ReviewProvider");
    }
    return context;
}
