import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { MOCK_GALAXY, type Problem } from "@/data/mock";
import { ExternalLink, PlayCircle } from "lucide-react";

export function TopicAccordion() {
    const totalProblems = MOCK_GALAXY.reduce(
        (acc, topic) =>
            acc +
            topic.subPatterns.reduce((subAcc, sub) => subAcc + sub.problems.length, 0),
        0
    );
    const solvedProblems = MOCK_GALAXY.reduce(
        (acc, topic) =>
            acc +
            topic.subPatterns.reduce(
                (subAcc, sub) => subAcc + sub.problems.filter((p) => p.isSolved).length,
                0
            ),
        0
    );
    const progress = Math.round((solvedProblems / totalProblems) * 100) || 0;

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8">
            {/* Progress Section */}
            <div className="space-y-2 bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight">Your Progress</h2>
                        <p className="text-muted-foreground text-sm">
                            Keep pushing! You've solved {solvedProblems} out of {totalProblems} problems.
                        </p>
                    </div>
                    <span className="text-3xl font-bold text-primary">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
            </div>

            {/* Topics Accordion */}
            <div className="space-y-4">
                <Accordion type="multiple" className="w-full space-y-4">
                    {MOCK_GALAXY.map((topic) => (
                        <AccordionItem
                            key={topic.id}
                            value={topic.id}
                            className="border border-border rounded-lg bg-card px-4 data-[state=open]:pb-4"
                        >
                            <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex items-center gap-4 w-full">
                                    <h3 className="text-lg font-semibold">{topic.title}</h3>
                                    <div className="flex items-center gap-2 ml-auto mr-4">
                                        <Badge variant="secondary" className="font-normal text-muted-foreground">
                                            {topic.subPatterns.reduce((acc, s) => acc + s.problems.length, 0)} Problems
                                        </Badge>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2">
                                <div className="space-y-6">
                                    {topic.subPatterns.map((sub) => (
                                        <div key={sub.id} className="space-y-3">
                                            <div className="flex flex-col gap-1 border-l-2 border-primary/20 pl-4 py-1">
                                                <h4 className="text-base font-medium text-foreground">{sub.title}</h4>
                                                <p className="text-sm text-muted-foreground">{sub.description}</p>
                                            </div>

                                            <div className="rounded-md border border-border">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                                                            <TableHead className="w-[50px] text-center">Status</TableHead>
                                                            <TableHead>Problem</TableHead>
                                                            <TableHead className="w-[100px]">Difficulty</TableHead>
                                                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {sub.problems.map((prob) => (
                                                            <ProblemRow key={prob.id} problem={prob} />
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </div>
    );
}

function ProblemRow({ problem }: { problem: Problem }) {
    return (
        <TableRow className="hover:bg-muted/30">
            <TableCell className="text-center">
                <Checkbox checked={problem.isSolved} />
            </TableCell>
            <TableCell>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="font-medium hover:text-primary cursor-pointer transition-colors">
                            {problem.id}. {problem.title}
                        </span>
                        {problem.isEssential && (
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-amber-500/30 text-amber-500 bg-amber-500/5">
                                Core
                            </Badge>
                        )}
                    </div>
                </div>
            </TableCell>
            <TableCell>
                <Badge
                    variant={
                        problem.difficulty === "Easy"
                            ? "secondary" // Greenish in custom implementations, but sticking to shadcn defaults for now
                            : problem.difficulty === "Medium"
                                ? "secondary" // Yellowish
                                : "destructive"
                    }
                    className={`${problem.difficulty === "Easy"
                            ? "text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20"
                            : problem.difficulty === "Medium"
                                ? "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20"
                                : "text-rose-500 bg-rose-500/10 hover:bg-rose-500/20"
                        } border-0 font-medium`}
                >
                    {problem.difficulty}
                </Badge>
            </TableCell>
            <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <PlayCircle className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <ExternalLink className="w-4 h-4" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}
