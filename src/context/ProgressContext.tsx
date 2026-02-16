import { createContext, useContext, useEffect, useState } from "react";

interface ProgressContextType {
    solvedProblems: Set<string>;
    toggleProblem: (id: string) => void;
    isSolved: (id: string) => boolean;
    progressPercentage: number;
    totalSolvedCount: number;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children, totalProblems }: { children: React.ReactNode; totalProblems: number }) {
    // Initialize from localStorage
    const [solvedProblems, setSolvedProblems] = useState<Set<string>>(() => {
        const saved = localStorage.getItem("endlesscode-solved");
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

    // Save to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("endlesscode-solved", JSON.stringify(Array.from(solvedProblems)));
    }, [solvedProblems]);

    const toggleProblem = (id: string) => {
        const newSolved = new Set(solvedProblems);
        if (newSolved.has(id)) {
            newSolved.delete(id);
        } else {
            newSolved.add(id);
        }
        setSolvedProblems(newSolved);
    };

    const isSolved = (id: string) => solvedProblems.has(id);

    const totalSolvedCount = solvedProblems.size;
    const progressPercentage = totalProblems > 0
        ? Math.round((totalSolvedCount / totalProblems) * 100)
        : 0;

    return (
        <ProgressContext.Provider value={{
            solvedProblems,
            toggleProblem,
            isSolved,
            progressPercentage,
            totalSolvedCount
        }}>
            {children}
        </ProgressContext.Provider>
    );
}

export function useProgress() {
    const context = useContext(ProgressContext);
    if (context === undefined) {
        throw new Error("useProgress must be used within a ProgressProvider");
    }
    return context;
}
