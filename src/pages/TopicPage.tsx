import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MOCK_GALAXY } from "@/data/mock";
import { ArrowLeft, BookOpen, CheckCircle2, Code2, Menu, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function TopicPage() {
    const { topicId } = useParams();
    const topic = MOCK_GALAXY.find((t) => t.id === topicId);
    const [activeSubPatternId, setActiveSubPatternId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!topic) return;
        const code = activeSubPatternId
            ? topic.subPatterns.find(sp => sp.id === activeSubPatternId)?.concept.code
            : "";

        if (code) {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

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

    const activeSubPattern = topic.subPatterns.find(
        (sp) => sp.id === activeSubPatternId
    );

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {/* Sidebar Navigation */}
            <aside className="w-64 border-r border-border bg-card flex flex-col">
                <div className="p-4 border-b border-border flex items-center gap-2">
                    <Link to="/">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <span className="font-semibold truncate">{topic.title}</span>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        <button
                            onClick={() => setActiveSubPatternId(null)}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left ${activeSubPatternId === null
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                        >
                            <BookOpen className="w-4 h-4 shrink-0" />
                            <span className="truncate">Overview</span>
                        </button>
                        {topic.subPatterns.map((sp) => (
                            <button
                                key={sp.id}
                                onClick={() => setActiveSubPatternId(sp.id)}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left ${activeSubPatternId === sp.id
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    }`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${activeSubPatternId === sp.id ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                                <span className="truncate">{sp.title}</span>
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Mobile Header (Hidden on desktop for now, but good practice) */}
                <header className="md:hidden h-14 border-b border-border flex items-center px-4">
                    <Button variant="ghost" size="icon"><Menu className="w-5 h-5" /></Button>
                    <span className="ml-2 font-semibold">EndlessCode</span>
                </header>

                <ScrollArea className="flex-1 p-8">
                    <div className="max-w-3xl mx-auto space-y-8 pb-20">
                        {/* Hero Section */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                                    {activeSubPattern ? activeSubPattern.title : `${topic.title} Overview`}
                                </h1>
                                <p className="text-xl text-muted-foreground">
                                    {activeSubPattern ? activeSubPattern.description : topic.preamble.summary}
                                </p>
                            </div>
                        </div>

                        <hr className="border-border" />

                        {/* 1. Visual/Summary */}
                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold tracking-tight">The Concept</h2>
                            <div className="aspect-video bg-muted rounded-xl border border-border flex items-center justify-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
                                <span className="text-muted-foreground font-mono">[ Visual Diagram: {activeSubPattern ? activeSubPattern.title : topic.title} ]</span>
                            </div>
                            <p className="text-lg leading-relaxed text-foreground/90">
                                {activeSubPattern ? activeSubPattern.concept.summary : topic.preamble.summary}
                            </p>
                        </section>

                        {/* 2. Checklist */}
                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold tracking-tight">
                                {activeSubPattern ? "When to use" : "Key Takeaways"}
                            </h2>
                            <div className="bg-card border border-border rounded-xl p-6">
                                <ul className="space-y-3">
                                    {(activeSubPattern ? activeSubPattern.concept.checklist : topic.preamble.checklist).map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        {/* 3. Code Template (Only for SubPatterns for now) */}
                        {activeSubPattern && (
                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                    <Code2 className="w-6 h-6 text-primary" /> Code Template
                                </h2>
                                <div className="relative rounded-xl overflow-hidden border border-border bg-muted/30">
                                    <div className="absolute top-0 left-0 right-0 h-10 bg-muted/50 border-b border-border flex items-center justify-between px-4 z-10">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                                            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                            onClick={handleCopy}
                                        >
                                            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                        </Button>
                                    </div>
                                    <div className="pt-10">
                                        <SyntaxHighlighter
                                            language="javascript"
                                            style={vscDarkPlus}
                                            customStyle={{ margin: 0, padding: '1.5rem', background: 'transparent' }}
                                            wrapLines={true}
                                        >
                                            {activeSubPattern.concept.code || ""}
                                        </SyntaxHighlighter>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                </ScrollArea>
            </main>
        </div>
    );
}

