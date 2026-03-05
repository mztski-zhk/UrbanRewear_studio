import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  searchQuick,
  searchAutocomplete,
  type SearchResult,
  type AutocompleteSuggestion,
  ApiError,
} from '@/services/api';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Loader2, ShirtIcon, AlertTriangle, X } from 'lucide-react';

interface SearchPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SearchPanel = ({ open, onOpenChange }: SearchPanelProps) => {
  const { token, isAuthenticated } = useAuth();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [totalReturned, setTotalReturned] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Autocomplete debounce
  useEffect(() => {
    if (!token || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchAutocomplete(query.trim(), token, 8);
        setSuggestions(res.suggestions ?? []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, token]);

  const executeSearch = useCallback(async (searchQuery: string) => {
    if (!token || !searchQuery.trim()) return;
    setLoading(true);
    setSearched(true);
    setShowSuggestions(false);
    try {
      const res = await searchQuick(searchQuery.trim(), token, 20);
      setResults(res.results ?? []);
      setTotalReturned(res.total_returned);
      setHasMore(res.has_more);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Search failed';
      setResults([]);
      setTotalReturned(0);
      setHasMore(false);
      // Show inline error instead of toast
      console.error('Search error:', msg);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    executeSearch(suggestion);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setSearched(false);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-72 sm:w-80 bg-card border-border p-0">
        <SheetHeader className="p-4 pb-2">
          <SheetTitle className="text-sm">Search Clothes</SheetTitle>
        </SheetHeader>

        <div className="px-3 pb-2">
          {!isAuthenticated ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Log in to search the cloth database.</p>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="Search by type, fabric, color..."
                  className="h-9 text-sm pl-8 pr-8"
                />
                {query && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </form>

              {/* Autocomplete suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="mt-1 rounded-md border border-border bg-popover shadow-md overflow-hidden">
                  {suggestions.map((s, i) => (
                    <button
                      key={`${s.suggestion}-${i}`}
                      onClick={() => handleSuggestionClick(s.suggestion)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-secondary transition-colors flex items-center justify-between"
                    >
                      <span className="text-foreground">{s.suggestion}</span>
                      <span className="text-[10px] text-muted-foreground">{s.field_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {isAuthenticated && (
          <ScrollArea className="h-[calc(100vh-130px)]">
            <div className="px-3 pb-4 space-y-2">
              {loading && (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {!loading && searched && results.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-12">
                  No results found for "{query}".
                </p>
              )}

              {!loading && results.length > 0 && (
                <p className="text-[10px] text-muted-foreground mb-1">
                  {totalReturned} result(s){hasMore ? ' (more available)' : ''}
                </p>
              )}

              {results.map(result => (
                <SearchResultCard key={result.id} result={result} />
              ))}

              {!loading && hasMore && (
                <p className="text-[10px] text-muted-foreground text-center pt-2">
                  Showing first {results.length} results. Refine your search for more specific results.
                </p>
              )}
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
};

const SearchResultCard = ({ result }: { result: SearchResult }) => {
  const status = result.cloth_status;
  const createdDate = new Date(result.created_at).toLocaleDateString();

  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-3 space-y-2">
      <div className="flex items-start gap-2">
        <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary/10 text-primary shrink-0">
          <ShirtIcon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate">
            {status.cloth_type || 'Unknown type'}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {[status.cloth_fabric, status.color].filter(Boolean).join(' - ') || 'Unknown'}
          </p>
        </div>
        {result.relevance_rank != null && (
          <span className="text-[9px] text-muted-foreground shrink-0">
            {Math.round(result.relevance_rank * 100)}%
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        {status.is_dirty_or_damaged && (
          <Badge variant="destructive" className="text-[9px] h-4 px-1.5">Damaged</Badge>
        )}
        {status.suitable_for_redesign && (
          <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-primary/15 text-primary border-0">Redesign</Badge>
        )}
        {status.suitable_for_upcycling && (
          <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-accent/15 text-accent border-0">Upcycle</Badge>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{result.file_available?.length ?? 0} file(s)</span>
        <span>{createdDate}</span>
      </div>
    </div>
  );
};

export default SearchPanel;
