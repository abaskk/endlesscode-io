import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSearch } from '@/context/SearchContext';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import type { Topic } from '@/data/types';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';

const TAG_COLORS: Record<string, string> = {
  'CORE': 'bg-blue-500/15 text-blue-600 border-blue-500/30 hover:bg-blue-500/25',
  'ADVANCED': 'bg-orange-500/15 text-orange-600 border-orange-500/30 hover:bg-orange-500/25',
};

export function SearchBar({ taxonomy }: { taxonomy: Topic[] }) {
  const { searchQuery, selectedTags, selectedSections, setSearchQuery, toggleTag, toggleSection, clearSearch } = useSearch();
  const hasFilters = searchQuery.length > 0 || selectedTags.length > 0 || selectedSections.length > 0;

  const anchor = useComboboxAnchor();

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    taxonomy.forEach(topic => {
      topic.sections.forEach(section => {
        section.problems.forEach(p => p.tags.forEach(t => tagSet.add(t)));
        section.subtopics.forEach(subtopic => {
          subtopic.problems.forEach(p => p.tags.forEach(t => tagSet.add(t)));
        });
      });
    });
    return Array.from(tagSet);
  }, [taxonomy]);

  const allSections = useMemo(() => {
    const sectionSet = new Map<string, { value: string; label: string }>();
    taxonomy.forEach(topic => {
      topic.sections.forEach(section => {
        const val = `${topic.id}-${section.title}`;
        if (!sectionSet.has(val)) {
          sectionSet.set(val, { value: val, label: `${section.title} - [${topic.title}]` });
        }
      });
    });
    return Array.from(sectionSet.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [taxonomy]);

  const handleSectionChange = (values: string[]) => {
    const current = selectedSections;
    const added = values.filter((v: string) => !current.includes(v));
    const removed = current.filter((v: string) => !values.includes(v));
    added.forEach(toggleSection);
    removed.forEach(toggleSection);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3 shadow-sm">
      <div className="flex gap-2">
        <Input
          placeholder="Search problems..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 h-7 text-sm bg-background/50 focus-visible:ring-1"
        />
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearSearch} className="h-7 px-2 text-xs hover:bg-destructive/10 hover:text-destructive transition-colors">
            <X className="h-4 w-4 mr-1.5" />
            Clear filters
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3 justify-between flex-wrap">
        <div className="flex flex-wrap gap-1.5">
          {allTags.map(tag => (
            <Badge
              key={tag}
              variant="outline"
              className={`cursor-pointer transition-all duration-200 text-[11px] h-6 px-2 font-medium ${
                TAG_COLORS[tag] || 'border-border/60 text-muted-foreground'
              } ${selectedTags.includes(tag) ? 'ring-1 ring-offset-1 ring-offset-background ring-current' : 'opacity-60 hover:opacity-100'}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>

        <div className="ml-auto w-[350px]">
          <Combobox
            multiple
            items={allSections}
            value={selectedSections}
            onValueChange={handleSectionChange}
          >
            <ComboboxChips ref={anchor} className="w-full">
              <ComboboxValue>
                {(values: string[]) => (
                  <React.Fragment>
                    {values.slice(0, 1).map((val: string) => {
                      const item = allSections.find(s => s.value === val);
                      return <ComboboxChip key={val} value={val}>{item ? item.label : val}</ComboboxChip>;
                    })}
                    {values.length > 1 && (
                      <span className="inline-flex items-center rounded bg-secondary px-1.5 py-0.5 text-[11px] font-semibold text-secondary-foreground shrink-0 border border-border/50">
                        +{values.length - 1} more
                      </span>
                    )}
                    <ComboboxChipsInput placeholder={values.length === 0 ? "Filter sections..." : ""} />
                  </React.Fragment>
                )}
              </ComboboxValue>
            </ComboboxChips>
            <ComboboxContent anchor={anchor}>
              <ComboboxEmpty>No sections found.</ComboboxEmpty>
              <ComboboxList>
                {(item: { value: string; label: string }) => (
                  <ComboboxItem key={item.value} value={item.value}>
                    {item.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
      </div>
    </div>
  );
}
