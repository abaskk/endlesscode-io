import { createContext, useContext, useState, type ReactNode } from 'react';

interface SearchContextType {
  searchQuery: string;
  selectedTags: string[];
  setSearchQuery: (query: string) => void;
  toggleTag: (tag: string) => void;
  clearSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedTags([]);
  };

  return (
    <SearchContext.Provider value={{ searchQuery, selectedTags, setSearchQuery, toggleTag, clearSearch }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}
