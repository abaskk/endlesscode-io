// ... imports
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getTaxonomy } from "@/data/adapter";
import { ArrowLeft, Menu, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Badge } from "@/components/ui/badge";

// Main theory content component
const TheoryPrimer = ({ title }: { title: string }) => {
    const [activeTab, setActiveTab] = useState("python");
    const [copied, setCopied] = useState(false);

    const copyCode = () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const codeSnippets: Record<string, string> = {
        python: `def ${title.toLowerCase().replace(/\s+/g, '_')}(nums):\n    # Python implementation\n    pass`,
        cpp: `void ${title.replace(/\s+/g, '')}(vector<int>& nums) {\n    // C++ implementation\n}`,
        java: `public void ${title.replace(/\s+/g, '')}(int[] nums) {\n    // Java implementation\n}`,
        javascript: `function ${title.replace(/\s+/g, '')}(nums) {\n    // JavaScript implementation\n}`
    };

    return (
        <div className="space-y-12 pb-12">
            {/* 1. Visual Hero Section */}
            <div className="space-y-4">
                <div className="aspect-[21/9] w-full bg-zinc-900/50 rounded-2xl border border-border flex items-center justify-center text-muted-foreground shadow-inner overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
                    <div className="text-center space-y-3 relative z-10 transition-transform group-hover:scale-105 duration-500">
                        <div className="w-16 h-16 rounded-2xl bg-muted/50 mx-auto flex items-center justify-center border border-border/50 shadow-sm">
                            <div className="w-10 h-1 rounded-full bg-blue-500/30" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground tracking-tight uppercase tracking-widest opacity-70">Visual Guide</p>
                            <p className="text-xs text-muted-foreground">Mathematical Sequence / State Progression</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Core Theory Section */}
            <div className="max-w-none prose prose-slate dark:prose-invert">
                <div className="flex items-center gap-3 not-prose mb-6">
                    <div className="h-8 w-1 bg-blue-500 rounded-full" />
                    <h3 className="text-2xl font-bold tracking-tight m-0">Theory and Intuition</h3>
                </div>

                <p className="text-lg text-muted-foreground leading-relaxed">
                    The fundamental insight of <strong>{title}</strong> lies in reducing redundant computation by maintaining a state that evolves incrementally.
                    Instead of a brute-force approach that scales as O(N²), we leverage structural properties to achieve linear performance.
                </p>

                <div className="bg-muted/30 border-l-4 border-blue-500/50 p-6 my-8 rounded-r-xl not-prose">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-blue-500 mb-2">Mathematical Framework</h4>
                    <div className="font-serif text-lg italic opacity-90 space-y-4">
                        <p>Let S be the set of possible candidates. We define a predicate P(x) such that if P(x) is true, then for all y &gt; x, P(y) is also true. This monotonic property allows us to discard half the search space in each step...</p>
                        <div className="text-center py-4 text-2xl font-mono whitespace-pre-wrap">
                            {"f(x) = \\sum_{i=1}^{n} \\delta(i) \\cdot \\log(\\epsilon_i)"}
                        </div>
                    </div>
                </div>

                <p>
                    By observing the invariant across iterations, we can prove that each element is visited at most twice (one addition, one removal),
                    guaranteeing a global linear time complexity even if local steps seem larger.
                </p>
            </div>

            {/* 3. Strategy & Usage Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-1 bg-emerald-500 rounded-full" />
                    <h3 className="text-2xl font-bold tracking-tight">Application Strategy</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-5 rounded-xl border border-border bg-emerald-500/5 space-y-3">
                        <h4 className="font-bold text-emerald-500 flex items-center gap-2">
                            When to Apply
                        </h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex gap-2">
                                <span className="text-emerald-500/50">•</span>
                                <span>The problem involves finding a contiguous subarray/substring that satisfies a constraint.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-emerald-500/50">•</span>
                                <span>The target function is monotonic with respect to the range size.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-emerald-500/50">•</span>
                                <span>Transition from O(N²) quadratic search to O(N) linear scan.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="p-5 rounded-xl border border-border bg-amber-500/5 space-y-3">
                        <h4 className="font-bold text-amber-500 flex items-center gap-2">
                            Common Pitfalls
                        </h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex gap-2">
                                <span className="text-amber-500/50">•</span>
                                <span>Off-by-one errors during range boundary updates.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-amber-500/50">•</span>
                                <span>Incorrect initialization of global aggregate variables.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-amber-500/50">•</span>
                                <span>Failing to reset internal state when the window invariant is violated.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* 4. Complexity Analysis */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-1 bg-violet-500 rounded-full" />
                    <h3 className="text-2xl font-bold tracking-tight">Complexity Analysis</h3>
                </div>

                <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-muted/50 border-b border-border">
                                <th className="px-6 py-3 text-left font-semibold">Metric</th>
                                <th className="px-6 py-3 text-left font-semibold">Notation</th>
                                <th className="px-6 py-3 text-left font-semibold">Justification</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            <tr>
                                <td className="px-6 py-4 font-medium">Time Complexity</td>
                                <td className="px-6 py-4"><Badge variant="outline" className="text-emerald-500 font-mono bg-emerald-500/5">O(N)</Badge></td>
                                <td className="px-6 py-4 text-muted-foreground text-xs">Each input element is visited at most twice during execution.</td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 font-medium">Space Complexity</td>
                                <td className="px-6 py-4"><Badge variant="outline" className="text-amber-500 font-mono bg-amber-500/5">O(1)</Badge></td>
                                <td className="px-6 py-4 text-muted-foreground text-xs">Auxiliary space usage is independent of input size.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 5. Implementation Templates */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-1 bg-blue-500 rounded-full" />
                    <h3 className="text-2xl font-bold tracking-tight">Implementation Templates</h3>
                </div>

                <div className="bg-zinc-950 rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-4 bg-zinc-900/50 border-b border-border h-12">
                        <div className="flex gap-1">
                            {['python', 'cpp', 'java', 'javascript'].map(lang => (
                                <button
                                    key={lang}
                                    onClick={() => setActiveTab(lang)}
                                    className={`px-4 py-2 text-xs font-bold tracking-tight transition-all rounded-md ${activeTab === lang
                                        ? "text-blue-400 bg-blue-400/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                                        : "text-zinc-500 hover:text-zinc-300"
                                        }`}
                                >
                                    {lang === 'cpp' ? 'C++' : lang.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        <button onClick={copyCode} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white">
                            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                    <div className="max-h-[500px] overflow-auto">
                        <SyntaxHighlighter
                            language={activeTab}
                            style={vscDarkPlus}
                            customStyle={{ margin: 0, padding: '1.5rem', background: 'transparent', fontSize: '0.875rem', lineHeight: '1.6' }}
                            showLineNumbers={true}
                            lineNumberStyle={{ minWidth: '3em', paddingRight: '1.5em', color: '#4b5563', textAlign: 'right' }}
                        >
                            {codeSnippets[activeTab]}
                        </SyntaxHighlighter>
                    </div>
                </div>
            </div>
        </div>
    );
};

export function TopicPage() {
    const { topicId } = useParams();
    const taxonomy = getTaxonomy();
    const topic = taxonomy.find((t) => t.id === topicId);

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
                {/* ... Sidebar header same as before ... */}
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
                        <div className="space-y-4">
                            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                {topic.title}
                            </h1>
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                {topic.sections[0]?.description || `Deep dive into ${topic.title} patterns, theory, and implementation strategies.`}
                            </p>
                        </div>

                        <hr className="border-border" />

                        {/* Sections */}
                        <div className="space-y-16">
                            {topic.sections.map((section, idx) => (
                                <section key={idx} id={`section-${idx}`} className="space-y-8 scroll-mt-20">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="font-mono text-xs">Section {idx + 1}</Badge>
                                            <h2 className="text-2xl font-bold tracking-tight">
                                                {section.title}
                                            </h2>
                                        </div>
                                        {section.description && (
                                            <p className="text-muted-foreground leading-relaxed">
                                                {section.description}
                                            </p>
                                        )}

                                        {/* THEORY PRIMER (Replaces Problem List) */}
                                        <div className="mt-4 p-6 border border-border rounded-xl bg-card/50">
                                            <TheoryPrimer title={section.title} />
                                        </div>
                                    </div>

                                    {/* Subtopics */}
                                    {section.subtopics.length > 0 && (
                                        <div className="pl-4 md:pl-0 space-y-12 mt-8">
                                            {section.subtopics.map((sub, sIdx) => (
                                                <div key={sIdx} id={`section-${idx}-sub-${sIdx}`} className="space-y-4 scroll-mt-24">
                                                    <h3 className="text-xl font-semibold flex items-center gap-2">
                                                        {sub.title}
                                                        <span className="text-xs text-muted-foreground font-normal ml-2">Subtopic {idx + 1}.{sIdx + 1}</span>
                                                    </h3>
                                                    {sub.description && (
                                                        <p className="text-muted-foreground italic">
                                                            {sub.description}
                                                        </p>
                                                    )}

                                                    {/* THEORY PRIMER (Replaces Problem List) */}
                                                    <div className="p-6 border border-border rounded-xl bg-card/50">
                                                        <TheoryPrimer title={sub.title} />
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
