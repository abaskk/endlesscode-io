import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAdaptedGalaxy } from "@/data/adapter";
import { ArrowLeft, Menu } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ProblemTable } from "@/components/dashboard/ProblemTable";
import { Badge } from "@/components/ui/badge";

export function TopicPage() {
    const { topicId } = useParams();
    const galaxy = getAdaptedGalaxy();
    const topic = galaxy.find((t) => t.id === topicId);

    // State for mobile sidebar or other interactions if needed
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    if (!topic) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-2xl font-bold">Topic not found</h1>
                <Link to="/">
                    <Button variant="link">Go Home</Button>
                </Link>
            </div>
        );
    }

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
        setMobileMenuOpen(false);
    };

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {/* Sidebar Navigation */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out
                md:relative md:translate-x-0
                ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
            `}>
                <div className="p-4 border-b border-border flex items-center gap-2">
                    <Link to="/">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div className="flex flex-col overflow-hidden">
                        <span className="font-semibold truncate">{topic.title}</span>
                        <span className="text-xs text-muted-foreground truncate">{topic.group}</span>
                    </div>
                </div>
                <ScrollArea className="flex-1 py-2">
                    <div className="px-2 space-y-1">
                        {topic.sections.map((section, idx) => (
                            <div key={idx} className="space-y-1">
                                <button
                                    onClick={() => scrollToSection(`section-${idx}`)}
                                    className="w-full text-left px-3 py-1.5 text-sm font-medium text-foreground/80 hover:bg-muted rounded-md transition-colors truncate"
                                >
                                    {section.title}
                                </button>
                                {/* Subtopics in sidebar? Optional. Let's keep it clean for now, or maybe indent them. */}
                                {section.subtopics.length > 0 && (
                                    <div className="pl-4 space-y-0.5 border-l border-border ml-3">
                                        {section.subtopics.map((sub, sIdx) => (
                                            <button
                                                key={sIdx}
                                                onClick={() => scrollToSection(`section-${idx}-sub-${sIdx}`)}
                                                className="w-full text-left px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors truncate"
                                            >
                                                {sub.title}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </aside>

            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
                {/* Mobile Header */}
                <header className="md:hidden h-14 border-b border-border flex items-center px-4 shrink-0 bg-card z-30">
                    <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
                        <Menu className="w-5 h-5" />
                    </Button>
                    <span className="ml-2 font-semibold truncate">{topic.title}</span>
                </header>

                <ScrollArea className="flex-1 w-full">
                    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-10 pb-20">
                        {/* Hero */}
                        <div className="space-y-2">
                            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                {topic.title}
                            </h1>
                            <p className="text-muted-foreground text-lg">
                                {topic.group}
                            </p>
                        </div>

                        <hr className="border-border" />

                        {/* Sections */}
                        <div className="space-y-12">
                            {topic.sections.map((section, idx) => (
                                <section key={idx} id={`section-${idx}`} className="space-y-6 scroll-mt-20">
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                                            {section.title}
                                            <Badge variant="outline" className="font-normal text-muted-foreground/70">
                                                Section {idx + 1}
                                            </Badge>
                                        </h2>
                                        {section.description && (
                                            <p className="text-muted-foreground leading-relaxed">
                                                {section.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Direct Problems in Section */}
                                    {section.problems.length > 0 && (
                                        <div className="border border-border rounded-lg overflow-hidden">
                                            <ProblemTable problems={section.problems} />
                                        </div>
                                    )}

                                    {/* Subtopics */}
                                    {section.subtopics.length > 0 && (
                                        <div className="pl-4 md:pl-6 border-l-2 border-border/50 space-y-8 mt-6">
                                            {section.subtopics.map((sub, sIdx) => (
                                                <div key={sIdx} id={`section-${idx}-sub-${sIdx}`} className="space-y-3 scroll-mt-24">
                                                    <div className="space-y-1">
                                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                                            {sub.title}
                                                            {/* <span className="text-xs text-muted-foreground font-normal">Subtopic {idx+1}.{sIdx+1}</span> */}
                                                        </h3>
                                                        {sub.description && (
                                                            <p className="text-sm text-muted-foreground/80 italic">
                                                                {sub.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="border border-border rounded-lg overflow-hidden bg-card/50">
                                                        <ProblemTable problems={sub.problems} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            ))}
                        </div>
                    </div>
                </ScrollArea>
            </main>
        </div>
    );
}
