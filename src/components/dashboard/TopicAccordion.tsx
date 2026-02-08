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
import { ExternalLink, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

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
                                    {/* Topic Concept Link */}
                                    <Link to={`/topic/${topic.id}`} className="block">
                                        <div className="bg-muted/30 border border-border rounded-lg p-4 flex items-center justify-between group transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <BookOpen className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-foreground">Start here: The Concept</h4>
                                                    <p className="text-sm text-muted-foreground">Master the {topic.title} pattern perfectly before solving.</p>
                                                </div>
                                            </div>
                                            <Button variant="outline" className="gap-2 border-primary/20">
                                                Read Guide <ExternalLink className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </Link>

                                    {topic.id !== 'basics' && topic.subPatterns.map((sub) => (
                                        <div key={sub.id} className="space-y-3">
                                            <div className="flex flex-col gap-1 border-l-2 border-primary/20 pl-4 py-1">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="text-base font-medium text-foreground">{sub.title}</h4>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{sub.description}</p>
                                            </div>

                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-[50px]">Status</TableHead>
                                                        <TableHead>Problem</TableHead>
                                                        <TableHead className="w-[100px]">Rating</TableHead>
                                                        <TableHead className="text-right">Action</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {sub.problems.map((prob) => (
                                                        <TableRow key={prob.id}>
                                                            <TableCell>
                                                                <Checkbox checked={prob.isSolved} />
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium">
                                                                        {prob.id}. {prob.title}
                                                                    </span>
                                                                    {prob.isEssential && (
                                                                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-amber-500/30 text-amber-500 bg-amber-500/5">
                                                                            Core
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className={`font-mono font-medium ${prob.rating < 1400 ? "text-emerald-500" :
                                                                    prob.rating < 1700 ? "text-amber-500" :
                                                                        "text-rose-500"
                                                                    }`}>
                                                                    {prob.rating}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <a
                                                                    href={prob.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center justify-center p-2 hover:bg-muted rounded-md transition-colors"
                                                                >
                                                                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                                                </a>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
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
