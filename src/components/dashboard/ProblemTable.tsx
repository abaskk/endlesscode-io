import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { Problem } from "@/data/types";
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink, Lock, Sparkles } from "lucide-react";
import { useState } from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProblemTableProps {
    problems: Problem[];
}

type SortDirection = "asc" | "desc" | null;

// Tag color mapping — these come from H4 headers
const TAG_COLORS: Record<string, string> = {
    "CORE": "bg-blue-500/10 text-blue-600 border-blue-500/30",
    "ADVANCED": "bg-orange-500/10 text-orange-600 border-orange-500/30",
    "OPTIONAL": "bg-zinc-500/10 text-zinc-500 border-zinc-500/30",
    "THINKING": "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
};

import { useProgress } from "@/context/ProgressContext";

export function ProblemTable({ problems }: ProblemTableProps) {
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const { isSolved, toggleProblem } = useProgress();

    const handleSort = () => {
        if (sortDirection === null) {
            setSortDirection("asc");
        } else if (sortDirection === "asc") {
            setSortDirection("desc");
        } else {
            setSortDirection(null);
        }
    };


    const sortedProblems = [...problems].sort((a, b) => {
        if (sortDirection === "asc") {
            if (a.rating === null) return 1;
            if (b.rating === null) return -1;
            return a.rating - b.rating;
        } else if (sortDirection === "desc") {
            if (a.rating === null) return 1;
            if (b.rating === null) return -1;
            return b.rating - a.rating;
        }
        return 0;
    });

    const displayProblems = sortDirection ? sortedProblems : problems;

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[50px]">Done</TableHead>
                    <TableHead>Problem</TableHead>
                    <TableHead className="w-[100px]">
                        <Button
                            variant="ghost"
                            onClick={handleSort}
                            className="-ml-4 h-8 data-[state=open]:bg-accent hover:bg-transparent"
                        >
                            Rating
                            {sortDirection === "asc" && <ArrowUp className="ml-2 h-4 w-4" />}
                            {sortDirection === "desc" && <ArrowDown className="ml-2 h-4 w-4" />}
                            {sortDirection === null && <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/50" />}
                        </Button>
                    </TableHead>
                    <TableHead className="w-[80px] text-right">Link</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {displayProblems.map((prob) => (
                    <TableRow key={prob.id}>
                        <TableCell>
                            <Checkbox
                                checked={isSolved(prob.id)}
                                onCheckedChange={() => toggleProblem(prob.id)}
                            />
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">
                                    {prob.id}. {prob.title}
                                </span>
                                {prob.tags.map((tag) => (
                                    <Badge
                                        key={tag}
                                        variant="outline"
                                        className={`text-[10px] h-5 px-1.5 ${TAG_COLORS[tag] || 'border-muted text-muted-foreground'}`}
                                    >
                                        {tag}
                                    </Badge>
                                ))}
                                {prob.is_premium && (
                                    <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                                )}
                            </div>
                        </TableCell>
                        <TableCell>
                            {prob.rating !== null ? (
                                <span className={`font-mono font-medium ${prob.rating < 1400 ? "text-emerald-500" :
                                        prob.rating < 1850 ? "text-amber-500" :
                                            prob.rating < 2300 ? "text-rose-500" :
                                                "text-violet-500"
                                    }`}>
                                    {prob.rating}
                                    {prob.is_predicted && (
                                        <TooltipProvider delayDuration={100}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Sparkles className="inline-block w-3 h-3 ml-1 text-white/50 hover:text-white cursor-help transition-colors" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>ML Predicted Rating</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </span>
                            ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                            )}
                        </TableCell>
                        <TableCell className="text-right">
                            <a
                                href={prob.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center p-2 hover:bg-muted rounded-md transition-colors"
                                aria-label={`Open ${prob.title} on LeetCode`}
                            >
                                <ExternalLink className="w-4 h-4 text-muted-foreground" />
                            </a>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
