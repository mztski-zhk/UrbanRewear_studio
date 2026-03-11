import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  searchSimple,
  searchAdvanced,
  searchAutocomplete,
  searchFuzzy,
  type SearchResponse,
  type SearchResult,
  type AutocompleteSuggestion,
  type AdvancedSearchParams,
  ApiError,
} from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Search,
  Loader2,
  SlidersHorizontal,
  ChevronDown,
  Shirt,
  Sparkles,
  Recycle,
  AlertTriangle,
  X,
  Calendar,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface SearchPanelProps {
  trigger?: React.ReactNode;
}

const FABRIC_OPTIONS = ['cotton', 'wool', 'silk', 'linen', 'polyester', 'denim'];
const CLOTH_TYPES = ['shirt', 't-shirt', 'pants', 'dress', 'jacket', 'sweater'];
const COLOR_OPTIONS = ['red', 'blue', 'green', 'black', 'white', 'yellow', 'orange', 'purple'];

const SearchPanel = ({ trigger }: SearchPanelProps) => {
  const guestToken = useMemo(() => {
    const key = 'ur_guest_token';
    let token = sessionStorage.getItem(key);
    if (!token) {
      token = `guest_${crypto.randomUUID()}`;
      sessionStorage.setItem(key, token);
    }
    return token;
  }, []);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [totalReturned, setTotalReturned] = useState(0);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Filters
  const [filters, setFilters] = useState<Partial<AdvancedSearchParams>>({
    suitable_for_redesign: undefined,
    suitable_for_upcycling: undefined,
    fabric_types: [],
    cloth_types: [],
    colors: [],
  });

  const hasActiveFilters = 
    filters.suitable_for_redesign !== undefined ||
    filters.suitable_for_upcycling !== undefined ||
    (filters.fabric_types?.length ?? 0) > 0 ||
    (filters.cloth_types?.length ?? 0) > 0 ||
    (filters.colors?.length ?? 0) > 0;

  // Autocomplete
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await searchAutocomplete(query, guestToken, 5);
        setSuggestions(response.suggestions || []);
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, guestToken]);

  const handleSearch = useCallback(async (searchQuery?: string, newOffset = 0) => {
    const q = searchQuery ?? query;
    if (!q.trim()) return;

    setLoading(true);
    setShowSuggestions(false);

    try {
      let response: SearchResponse;

      if (hasActiveFilters) {
        response = await searchAdvanced({
          query: q,
          limit: 20,
          offset: newOffset,
          ...filters,
        }, guestToken);
      } else {
        response = await searchSimple(q, guestToken, 20, newOffset);
      }

      if (newOffset === 0) {
        setResults(response.results);
      } else {
        setResults(prev => [...prev, ...response.results]);
      }
      setHasMore(response.has_more);
      setOffset(newOffset);
      setTotalReturned(response.total_returned);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Search failed';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [query, guestToken, filters, hasActiveFilters]);

  const handleFuzzySearch = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    setShowSuggestions(false);

    try {
      const response = await searchFuzzy(query, guestToken, 20);
      setResults(response.results);
      setHasMore(response.has_more);
      setTotalReturned(response.total_returned);
      toast({ title: 'Fuzzy search', description: `Found ${response.total_returned} results with typo tolerance` });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Search failed';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [query, guestToken]);

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    handleSearch(suggestion);
  };

  const toggleArrayFilter = (
    key: 'fabric_types' | 'cloth_types' | 'colors',
    value: string
  ) => {
    setFilters(prev => {
      const arr = prev[key] || [];
      const newArr = arr.includes(value)
        ? arr.filter(v => v !== value)
        : [...arr, value];
      return { ...prev, [key]: newArr };
    });
  };

  const clearFilters = () => {
    setFilters({
      suitable_for_redesign: undefined,
      suitable_for_upcycling: undefined,
      fabric_types: [],
      cloth_types: [],
      colors: [],
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Search className="h-4 w-4" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-[340px] sm:w-[420px]">
        <SheetHeader>
          <SheetTitle className="text-foreground flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search Clothes
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          {/* Search input */}
          <div className="relative">
            <Input
              placeholder="Search by type, fabric, color..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              onFocus={() => setShowSuggestions(suggestions.length > 0)}
              className="pr-20"
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleSearch()}
                disabled={loading || !query.trim()}
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Search className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>

            {/* Autocomplete suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border border-border bg-popover shadow-lg">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent/10 first:rounded-t-md last:rounded-b-md"
                    onClick={() => handleSuggestionClick(s.suggestion)}
                  >
                    <Search className="h-3 w-3 text-muted-foreground" />
                    <span>{s.suggestion}</span>
                    <Badge variant="outline" className="ml-auto text-[9px] h-4">
                      {s.field_name}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={handleFuzzySearch}
              disabled={loading || !query.trim()}
            >
              Fuzzy Search
            </Button>
            <Button
              variant={hasActiveFilters ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7 ml-auto"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <SlidersHorizontal className="h-3 w-3 mr-1" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-[9px]">
                  !
                </Badge>
              )}
            </Button>
          </div>

          {/* Filters */}
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleContent className="space-y-3 rounded-lg border border-border bg-card/50 p-3">
              {/* Suitability */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Suitability</Label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <Checkbox
                      checked={filters.suitable_for_redesign === true}
                      onCheckedChange={(c) =>
                        setFilters(prev => ({
                          ...prev,
                          suitable_for_redesign: c ? true : undefined,
                        }))
                      }
                    />
                    <Sparkles className="h-3 w-3" />
                    Redesign
                  </label>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <Checkbox
                      checked={filters.suitable_for_upcycling === true}
                      onCheckedChange={(c) =>
                        setFilters(prev => ({
                          ...prev,
                          suitable_for_upcycling: c ? true : undefined,
                        }))
                      }
                    />
                    <Recycle className="h-3 w-3" />
                    Upcycle
                  </label>
                </div>
              </div>

              {/* Fabric types */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Fabric Types</Label>
                <div className="flex flex-wrap gap-1.5">
                  {FABRIC_OPTIONS.map((f) => (
                    <Badge
                      key={f}
                      variant={filters.fabric_types?.includes(f) ? 'default' : 'outline'}
                      className="cursor-pointer text-[10px] h-5 capitalize"
                      onClick={() => toggleArrayFilter('fabric_types', f)}
                    >
                      {f}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Cloth types */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Cloth Types</Label>
                <div className="flex flex-wrap gap-1.5">
                  {CLOTH_TYPES.map((c) => (
                    <Badge
                      key={c}
                      variant={filters.cloth_types?.includes(c) ? 'default' : 'outline'}
                      className="cursor-pointer text-[10px] h-5 capitalize"
                      onClick={() => toggleArrayFilter('cloth_types', c)}
                    >
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Colors</Label>
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_OPTIONS.map((color) => (
                    <Badge
                      key={color}
                      variant={filters.colors?.includes(color) ? 'default' : 'outline'}
                      className="cursor-pointer text-[10px] h-5 capitalize"
                      onClick={() => toggleArrayFilter('colors', color)}
                    >
                      <span
                        className="w-2 h-2 rounded-full mr-1"
                        style={{ backgroundColor: color }}
                      />
                      {color}
                    </Badge>
                  ))}
                </div>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs h-7 text-muted-foreground"
                  onClick={clearFilters}
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear all filters
                </Button>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Results */}
          <div className="pt-2 border-t border-border">
            {totalReturned > 0 && (
              <p className="text-[10px] text-muted-foreground mb-2">
                Found {totalReturned} result{totalReturned !== 1 ? 's' : ''}
              </p>
            )}

            <ScrollArea className="h-[calc(100vh-380px)]">
              {results.length === 0 && !loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Search className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground text-center">
                    {query ? 'No results found' : 'Enter a search query'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 pr-2">
                  {results.map((result) => (
                    <SearchResultCard key={result.id} result={result} />
                  ))}
                  {hasMore && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => handleSearch(undefined, offset + 20)}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        'Load more'
                      )}
                    </Button>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const SearchResultCard = ({ result }: { result: SearchResult }) => {
  const status = result.cloth_status;

  return (
    <div className="rounded-lg border border-border bg-card p-2.5 space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Shirt className="h-4 w-4 text-primary" />
          <div>
            <p className="text-xs font-medium text-foreground">
              {status?.cloth_type || 'Unknown Type'}
            </p>
            <p className="text-[9px] text-muted-foreground">
              {status?.cloth_fabric || 'Unknown Fabric'}
            </p>
          </div>
        </div>
        {result.relevance_rank !== undefined && (
          <Badge variant="outline" className="text-[9px] h-4">
            {Math.round(result.relevance_rank * 100)}%
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        {status?.suitable_for_redesign && (
          <Badge variant="outline" className="text-[9px] h-4 border-primary/30 text-primary">
            <Sparkles className="h-2.5 w-2.5 mr-0.5" />
            Redesign
          </Badge>
        )}
        {status?.suitable_for_upcycling && (
          <Badge variant="outline" className="text-[9px] h-4 border-accent/30 text-accent">
            <Recycle className="h-2.5 w-2.5 mr-0.5" />
            Upcycle
          </Badge>
        )}
        {status?.is_dirty_or_damaged && (
          <Badge variant="outline" className="text-[9px] h-4 border-destructive/30 text-destructive">
            <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
            Damaged
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
        <Calendar className="h-2.5 w-2.5" />
        {result.created_at
          ? format(new Date(result.created_at), 'MMM d, yyyy')
          : 'Unknown'}
      </div>
    </div>
  );
};

export default SearchPanel;
