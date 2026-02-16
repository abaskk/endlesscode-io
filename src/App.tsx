import { TopicAccordion } from "@/components/dashboard/TopicAccordion";
import { TopicPage } from "@/pages/TopicPage";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

function Dashboard() {
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
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="max-w-xl mb-8">
          <Accordion type="single" collapsible>
            <AccordionItem value="source" className="border-none">
              <AccordionTrigger className="text-sm font-medium text-foreground py-2 justify-start gap-2 hover:no-underline">
                <span>Source Material</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm">
                <p className="mb-2">
                  This roadmap is adapted from the highly acclaimed "Scientific刷题" (Scientific Coding) guide on LeetCode China by
                  <a
                    href="https://leetcode.cn/u/endlesscheng/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium mx-1"
                  >
                    EndlessCheng
                  </a>.
                </p>
                <p>
                  Original Post:
                  <a
                    href="https://leetcode.cn/discuss/post/3141566/ru-he-ke-xue-shua-ti-by-endlesscheng-q3yd/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline ml-1"
                  >
                    How to practice scientifically?
                  </a>
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <TopicAccordion />
      </main>
    </div>
  );
}

import { ProgressProvider } from "@/context/ProgressContext";
import { getTotalProblemCount } from "@/data/adapter";

function App() {
  const totalProblems = getTotalProblemCount();

  return (
    <ProgressProvider totalProblems={totalProblems}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/topic/:topicId" element={<TopicPage />} />
        </Routes>
      </BrowserRouter>
    </ProgressProvider>
  )
}

export default App
