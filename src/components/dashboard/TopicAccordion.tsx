import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTaxonomy, getTotalProblemCount } from "@/data/adapter";
import type { Section, Subtopic } from "@/data/types";
import { BookOpen, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { ProblemTable } from "./ProblemTable";
import { useProgress } from "@/context/ProgressContext";

// 2. Define Colors for Groups (Progress Bar)
const GROUP_COLORS: Record<string, string> = {
    "LINEAR FOUNDATIONS": "bg-emerald-500",
    "CORE DATA STRUCTURES": "bg-blue-500",
    "RECURSION & TREES": "bg-indigo-500",
    "GRAPH ALGORITHMS": "bg-violet-500",
    "DYNAMIC PROGRAMMING": "bg-rose-500",
    "SPECIALIZED LOGIC": "bg-amber-500",
};

// Define Badge Styles for Levels (Pills)
const TOPIC_BADGE_STYLE = "bg-indigo-500/15 text-indigo-600 border-indigo-500/20 hover:bg-indigo-500/25";
const SUB_BADGE_STYLE = "bg-cyan-500/15 text-cyan-600 border-cyan-500/20 hover:bg-cyan-500/25";

/** Helper component for consistent colorful badges */
function ColoredBadge({ count, type, className }: { count: number, type: "topic" | "sub", className?: string }) {
    const style = type === "topic" ? TOPIC_BADGE_STYLE : SUB_BADGE_STYLE;
    return (
        <Badge variant="secondary" className={`${style} ${className}`}>
            {count}
        </Badge>
    );
}

/** Count all problems in a section (direct + subtopic children) */
function sectionProblemCount(section: Section): number {
    return section.problems.length +
        section.subtopics.reduce((acc, st) => acc + st.problems.length, 0);
}

/** Render a subtopic (H3) block with its problems */
function SubtopicBlock({ subtopic, topicId, sectionIdx, subIdx }: {
    subtopic: Subtopic;
    topicId: string;
    sectionIdx: number;
    subIdx: number;
}) {
    if (subtopic.problems.length === 0) return null;

    return (
        <div key={`${topicId}-${sectionIdx}-sub-${subIdx}`} className="ml-4">
            <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-muted-foreground">{subtopic.title}</span>
                <ColoredBadge count={subtopic.problems.length} type="sub" className="text-[10px] h-4 px-1" />
            </div>
            {subtopic.description && (
                <p className="text-xs text-muted-foreground/70 mb-2 ml-0.5 italic">
                    {subtopic.description}
                </p>
            )}
            <ProblemTable problems={subtopic.problems} />
        </div>
    );
}

export function TopicAccordion() {
    const taxonomy = getTaxonomy();
    const totalProblems = getTotalProblemCount();
    const { isSolved, totalSolvedCount } = useProgress();

    // 1. Aggregate sums by Visual Group
    const groupStats = taxonomy.reduce((acc, topic) => {
        const group = topic.group;
        if (!acc[group]) {
            acc[group] = { total: 0, solved: 0, label: group };
        }

        // Count problems in this topic
        topic.sections.forEach(section => {
            section.problems.forEach(p => {
                acc[group].total++;
                if (isSolved(p.id)) acc[group].solved++;
            });
            section.subtopics.forEach(sub => {
                sub.problems.forEach(p => {
                    acc[group].total++;
                    if (isSolved(p.id)) acc[group].solved++;
                });
            });
        });
        return acc;
    }, {} as Record<string, { total: number; solved: number; label: string }>);

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8">
            {/* Progress Section */}
            <div className="space-y-4 bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight">Your Progress</h2>
                        <p className="text-muted-foreground text-sm">
                            Keep pushing! Track your journey through {totalProblems} carefully curated problems.
                        </p>
                    </div>
                    <div className="text-right">
                        <span className="text-3xl font-bold text-primary block leading-none">
                            {totalSolvedCount} <span className="text-lg text-muted-foreground">/ {totalProblems}</span>
                        </span>
                        <span className="text-xs text-muted-foreground font-mono mt-1 block uppercase tracking-wider">
                            Problems Solved
                        </span>
                    </div>
                </div>

                {/* Segmented Progress Bar */}
                <div className="h-4 w-full flex gap-1 rounded-full bg-secondary/30 overflow-hidden">
                    {Object.values(groupStats).map((stat) => {
                        if (totalProblems === 0) return null;

                        const widthPct = (stat.total / totalProblems) * 100;
                        // Avoid division by zero for individual segments
                        const solvePct = stat.total > 0 ? (stat.solved / stat.total) * 100 : 0;
                        const colorClass = GROUP_COLORS[stat.label] || "bg-primary";

                        // Don't render empty segments
                        if (widthPct <= 0) return null;

                        return (
                            <div
                                key={stat.label}
                                className="h-full relative group first:rounded-l-full last:rounded-r-full overflow-hidden"
                                style={{ width: `${widthPct}%` }}
                                title={`${stat.label}: ${stat.solved}/${stat.total}`}
                            >
                                {/* Background (faint version of color) */}
                                <div className={`absolute inset-0 ${colorClass} opacity-20`} />

                                {/* Foreground (filled version) */}
                                <div
                                    className={`h-full ${colorClass} transition-all duration-500`}
                                    style={{ width: `${solvePct}%` }}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Legend (Optional, but helpful) */}
                <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
                    {Object.entries(groupStats).map(([label, stat]) => (
                        <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className={`w-2 h-2 rounded-full ${GROUP_COLORS[label] || "bg-primary"}`} />
                            <span>{label}</span>
                            <span className="opacity-50">({stat.solved}/{stat.total})</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Topics Accordion */}
            <div className="space-y-4">
                <Accordion type="multiple" className="w-full space-y-4">
                    {taxonomy.map((topic) => {
                        const topicProblemCount = topic.sections.reduce(
                            (acc, s) => acc + sectionProblemCount(s), 0
                        );

                        return (
                            <AccordionItem
                                key={topic.id}
                                value={topic.id}
                                className="border border-border rounded-lg bg-card px-4 data-[state=open]:pb-4"
                            >
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex items-center gap-4 w-full">
                                        <div className="flex flex-col items-start gap-1">
                                            <h3 className="text-lg font-semibold">{topic.title}</h3>
                                            <span className="text-xs text-muted-foreground font-normal">{topic.group}</span>
                                        </div>
                                        <div className="flex items-center gap-2 ml-auto mr-4">
                                            <ColoredBadge count={topicProblemCount} type="topic" className="font-normal px-2.5 py-0.5 pointer-events-none" />
                                            <span className="text-muted-foreground text-sm ml-1">Problems</span>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2">
                                    <div className="space-y-2">
                                        {/* Topic Concept Link (Disabled for now) */}
                                        <div className="bg-muted/10 border border-border/50 rounded-lg p-4 flex items-center justify-between opacity-60 cursor-not-allowed">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                                    <BookOpen className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold text-foreground">Start here: The Concept</h4>
                                                        <Badge variant="outline" className="text-[10px] uppercase tracking-widest h-4 px-1 opacity-70">Coming Soon</Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">Master the {topic.title} pattern perfectly before solving.</p>
                                                </div>
                                            </div>
                                            <Button variant="outline" disabled className="gap-2 border-border">
                                                Read Guide <ExternalLink className="w-3 h-3" />
                                            </Button>
                                        </div>

                                        {/* Sections — Nested Accordion */}
                                        <Accordion type="multiple" className="w-full space-y-1">
                                            {topic.sections.map((section, idx) => {
                                                const sCount = sectionProblemCount(section);
                                                if (sCount === 0) return null;

                                                return (
                                                    <AccordionItem
                                                        key={`${topic.id}-section-${idx}`}
                                                        value={`${topic.id}-section-${idx}`}
                                                        className="border border-border/50 rounded-md bg-muted/10 px-3"
                                                    >
                                                        <AccordionTrigger className="hover:no-underline py-3">
                                                            <div className="flex items-center gap-3 w-full">
                                                                <div className="w-1 h-6 rounded-full bg-primary/30 shrink-0" />
                                                                <h4 className="text-sm font-medium text-foreground text-left">{section.title}</h4>
                                                                <ColoredBadge count={sCount} type="sub" className="text-[10px] h-5 px-1.5 ml-auto mr-2 shrink-0" />
                                                            </div>
                                                        </AccordionTrigger>
                                                        <AccordionContent className="pt-1 pb-3">
                                                            <div className="space-y-4">
                                                                {/* Section description */}
                                                                {section.description && (
                                                                    <p className="text-xs text-muted-foreground leading-relaxed ml-4">
                                                                        {section.description.slice(0, 200)}
                                                                        {section.description.length > 200 ? "…" : ""}
                                                                    </p>
                                                                )}

                                                                {/* Direct problems under section (H2 level, no H3 children) */}
                                                                {section.problems.length > 0 && (
                                                                    <div className="ml-4">
                                                                        <ProblemTable problems={section.problems} />
                                                                    </div>
                                                                )}

                                                                {/* Subtopics (H3 level) */}
                                                                {section.subtopics.map((sub, subIdx) => (
                                                                    <SubtopicBlock
                                                                        key={`${topic.id}-${idx}-sub-${subIdx}`}
                                                                        subtopic={sub}
                                                                        topicId={topic.id}
                                                                        sectionIdx={idx}
                                                                        subIdx={subIdx}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                );
                                            })}
                                        </Accordion>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </div>
        </div>
    );
}
