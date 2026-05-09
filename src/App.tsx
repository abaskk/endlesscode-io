import { TaxonomyTabs } from "@/components/dashboard/TaxonomyTabs";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SearchProvider } from "@/context/SearchContext";


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


        <TaxonomyTabs />
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
      <SearchProvider>
        <BrowserRouter basename="/endlesscode-io/">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </SearchProvider>
    </ProgressProvider>
  )
}

export default App
