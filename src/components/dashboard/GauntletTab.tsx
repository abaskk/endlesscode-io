import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { ExternalLink, Download, Target } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { generateGauntlet, getAllCategories, getGauntletProblems } from '@/utils/gauntletGenerator';
import { exportGauntlet } from '@/utils/csvExport';
import type { Gauntlet } from '@/data/types';
import { useProgress } from '@/context/ProgressContext';

const RATING_MIN = 1000;
const RATING_MAX = 3000;

export function GauntletTab() {
    const { solvedProblems } = useProgress();
    const [view, setView] = useState<'config' | 'active'>('config');
    const [ratingRange, setRatingRange] = useState<[number, number]>([1000, 2000]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [problemCount, setProblemCount] = useState(10);
    const [currentGauntlet, setCurrentGauntlet] = useState<Gauntlet | null>(null);

    const allCategories = useMemo(() => getAllCategories(), []);

    const toggleCategory = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const handleGenerate = () => {
        const gauntlet = generateGauntlet({
            problemCount,
            ratingRange: { min: ratingRange[0], max: ratingRange[1] },
            categories: selectedCategories,
            solvedProblemIds: solvedProblems,
        });
        setCurrentGauntlet(gauntlet);
        setView('active');
    };

    const handleExport = () => {
        if (!currentGauntlet) return;

        const gauntletProblems = getGauntletProblems(currentGauntlet);
        const problems = gauntletProblems.map(({ problem }) => problem);
        const categoryMap = new Map(gauntletProblems.map(({ problem, category }) => [problem.id, category]));

        exportGauntlet(currentGauntlet, problems, categoryMap);
    };

    const getRatingColor = (rating: number) => {
        if (rating < 1400) return 'text-emerald-500';
        if (rating < 1850) return 'text-amber-500';
        if (rating < 2300) return 'text-rose-500';
        return 'text-violet-500';
    };

    if (view === 'config') {
        return (
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                    <Target className="w-12 h-12 mx-auto text-muted-foreground" />
                    <h2 className="text-2xl font-bold">The Gauntlet</h2>
                    <p className="text-muted-foreground">
                        Generate a custom problemset to challenge yourself
                    </p>
                </div>

                <div className="space-y-6 p-6 bg-muted/50 rounded-lg">
                    {/* Rating Range */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Label>Rating Range</Label>
                            <span className="text-sm font-medium">
                                {ratingRange[0]} - {ratingRange[1]}
                            </span>
                        </div>
                        <Slider
                            value={ratingRange}
                            onValueChange={(value: number[]) => setRatingRange([value[0], value[1]])}
                            min={RATING_MIN}
                            max={RATING_MAX}
                            step={50}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{RATING_MIN}</span>
                            <span>{RATING_MAX}</span>
                        </div>
                    </div>

                    {/* Problem Count */}
                    <div className="space-y-2">
                        <Label htmlFor="problemCount">Problems to Include</Label>
                        <Input
                            id="problemCount"
                            type="number"
                            min={1}
                            max={100}
                            value={problemCount}
                            onChange={(e) => setProblemCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 10)))}
                            className="w-full"
                        />
                    </div>

                    {/* Categories */}
                    <div className="space-y-2">
                        <Label>Categories (optional - leave empty for all)</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {allCategories.map((category) => (
                                <div key={category} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`cat-${category}`}
                                        checked={selectedCategories.includes(category)}
                                        onCheckedChange={() => toggleCategory(category)}
                                    />
                                    <Label
                                        htmlFor={`cat-${category}`}
                                        className="text-sm font-normal cursor-pointer"
                                    >
                                        {category}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Generate Button */}
                    <div className="flex justify-center">
                        <Button onClick={handleGenerate}>
                            Generate Gauntlet
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Active Gauntlet View
    const gauntletProblems = currentGauntlet ? getGauntletProblems(currentGauntlet) : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Button
                        variant="ghost"
                        onClick={() => setView('config')}
                        className="mb-2"
                    >
                        ← Back
                    </Button>
                    <h2 className="text-2xl font-bold">{currentGauntlet?.name}</h2>
                    <p className="text-muted-foreground">
                        {currentGauntlet?.problems.length} problems · Rating: {currentGauntlet?.ratingRange.min}-{currentGauntlet?.ratingRange.max}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        onClick={handleExport}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                        {gauntletProblems.filter(({ problem }) => solvedProblems.has(problem.id)).length} / {gauntletProblems.length}
                    </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{
                            width: `${(gauntletProblems.filter(({ problem }) => solvedProblems.has(problem.id)).length / gauntletProblems.length) * 100}%`
                        }}
                    />
                </div>
            </div>

            {/* Problems Table */}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead>Problem</TableHead>
                        <TableHead className="w-[100px]">Rating</TableHead>
                        <TableHead className="w-[100px] text-right">Link</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {gauntletProblems.map(({ problem }, index) => (
                        <TableRow key={problem.id}>
                            <TableCell className="font-mono text-muted-foreground">
                                {index + 1}
                            </TableCell>
                            <TableCell>
                                <span className={solvedProblems.has(problem.id) ? 'line-through text-muted-foreground' : 'font-medium'}>
                                    {problem.title}
                                </span>
                            </TableCell>
                            <TableCell>
                                {problem.rating !== null ? (
                                    <span className={`font-mono font-medium ${getRatingColor(problem.rating)}`}>
                                        {problem.rating}
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground">—</span>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                <a
                                    href={problem.url}
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
    );
}
