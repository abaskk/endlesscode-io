import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSearch } from '@/context/SearchContext';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

const TAG_COLORS: Record<string, string> = {
  'CORE': 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  'ADVANCED': 'bg-orange-500/15 text-orange-600 border-orange-500/30',
  'OPTIONAL': 'bg-zinc-500/15 text-zinc-500 border-zinc-500/30',
  'THINKING': 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30',
};

const TAGS = ['CORE', 'ADVANCED', 'OPTIONAL', 'THINKING'];

export function SearchBar() {
  const { searchQuery, selectedTags, setSearchQuery, toggleTag, clearSearch } = useSearch();
  const hasFilters = searchQuery.length > 0 || selectedTags.length > 0;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Search problems by title, id..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        {hasFilters && (
          <Button variant="outline" size="icon" onClick={clearSearch}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {TAGS.map(tag => (
          <Badge
            key={tag}
            variant={selectedTags.includes(tag) ? 'default' : 'outline'}
            className={`cursor-pointer transition-colors ${
              selectedTags.includes(tag)
                ? TAG_COLORS[tag] || ''
                : 'border-border text-muted-foreground hover:border-foreground/50'
            }`}
            onClick={() => toggleTag(tag)}
          >
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}
