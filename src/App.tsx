import { TopicAccordion } from "@/components/dashboard/TopicAccordion";

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      <header className="border-b border-border/40 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">E</span>
            </div>
            <span className="font-bold text-lg tracking-tight">EndlessCode</span>
          </div>
          <nav className="flex items-center gap-8 text-sm font-medium">
            <a href="#" className="text-foreground hover:text-primary transition-colors">Roadmap</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Problems</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Discuss</a>
          </nav>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-muted border border-border"></div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-12 text-left space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            The Scientific Roadmap
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            A structured, pattern-based approach to mastering algorithms. Focus on the core schemas that unlock thousands of problems.
          </p>
        </div>

        <TopicAccordion />
      </main>
    </div>
  )
}

export default App
