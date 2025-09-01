import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, X } from 'lucide-react';
import { useSmartSearchState, useSearchTelemetry } from '@/integrations/smart-search/hooks';
import type { EntityCard } from '@/integrations/smart-search/types';

interface SmartSearchBarProps {
  onSelection?: (entity: EntityCard) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export default function SmartSearchBar({
  onSelection,
  placeholder = "Search movies, TV, books...",
  autoFocus = false,
  className = "",
}: SmartSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [startTime] = useState(() => performance.now());
  
  const {
    query,
    setQuery,
    selectedType,
    resolved,
    isLoading,
    error,
    handleAutoSelect,
    handleManualSelect,
    handleTypeSelect,
  } = useSmartSearchState();
  
  const { trackSearch } = useSearchTelemetry();
  
  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);
  
  // Handle auto-selection
  useEffect(() => {
    if (resolved?.decision.mode === 'auto_select' && resolved.primary) {
      const timeToResolve = Math.round(performance.now() - startTime);
      
      // Track successful auto-select
      trackSearch({
        query,
        decision_mode: 'auto_select',
        confidence: resolved.decision.confidence,
        time_to_resolve_ms: timeToResolve,
        providers_called: resolved.query_plan_echo?.map(p => p.provider) || [],
      });
      
      // Notify parent component
      onSelection?.(resolved.primary);
      handleAutoSelect(resolved.primary.title_id, resolved.primary.display_title);
    }
  }, [resolved, query, startTime, trackSearch, onSelection, handleAutoSelect]);
  
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, [setQuery]);
  
  const handleClear = useCallback(() => {
    setQuery('');
    inputRef.current?.focus();
  }, [setQuery]);
  
  const handleEntitySelect = useCallback((entity: EntityCard) => {
    const timeToResolve = Math.round(performance.now() - startTime);
    
    // Track manual selection
    trackSearch({
      query,
      decision_mode: 'disambiguate',
      confidence: entity.confidence || 0,
      time_to_resolve_ms: timeToResolve,
      providers_called: resolved?.query_plan_echo?.map(p => p.provider) || [],
      user_refined_via_chip: true,
    });
    
    // Notify parent component
    onSelection?.(entity);
    handleManualSelect(entity.title_id, entity.display_title);
    
    // Clear search after selection
    setQuery('');
  }, [query, startTime, resolved, trackSearch, onSelection, handleManualSelect, setQuery]);
  
  const handleTypeChipClick = useCallback((type: string) => {
    handleTypeSelect(type);
  }, [handleTypeSelect]);
  
  // Generate predicted type chips
  const getTypePredictions = () => {
    if (!resolved) return [];
    
    const types = new Set([resolved.primary.type]);
    resolved.alternatives.forEach(alt => types.add(alt.type));
    
    return Array.from(types).map(type => ({
      type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      count: [resolved.primary, ...resolved.alternatives].filter(e => e.type === type).length,
    }));
  };
  
  const typePredictions = getTypePredictions();
  
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pl-10 pr-10 h-11"
          disabled={isLoading}
        />
        
        {isLoading && (
          <Loader2 className="absolute right-8 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
        
        {query && !isLoading && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {/* Status and Type Predictions */}
      {query && (
        <div className="flex items-center gap-2 flex-wrap">
          {isLoading && (
            <span className="text-sm text-gray-500 flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Searching...
            </span>
          )}
          
          {!isLoading && resolved && resolved.decision.mode === 'auto_select' && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              ✓ Found: {resolved.primary.display_title}
              {resolved.primary.year_start && ` (${resolved.primary.year_start})`}
            </span>
          )}
          
          {typePredictions.length > 1 && !isLoading && (
            <>
              <span className="text-sm text-gray-500">Search in:</span>
              {typePredictions.map(({ type, label, count }) => (
                <Badge
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleTypeChipClick(type)}
                >
                  {label} {count > 1 && `(${count})`}
                </Badge>
              ))}
            </>
          )}
        </div>
      )}
      
      {/* Disambiguation Results */}
      {!isLoading && resolved && resolved.decision.mode === 'disambiguate' && resolved.alternatives.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">
            Multiple matches found. Choose one:
          </div>
          <div className="space-y-2">
            <EntityOption
              entity={resolved.primary}
              onSelect={handleEntitySelect}
              isTopResult
            />
            {resolved.alternatives.slice(0, 3).map((entity) => (
              <EntityOption
                key={entity.title_id}
                entity={entity}
                onSelect={handleEntitySelect}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          Search failed: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}
      
      {/* No Results */}
      {!isLoading && query && resolved && !resolved.primary.title_id.startsWith('tmdb:') && !resolved.primary.title_id.startsWith('openlibrary:') && (
        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
          No results found for "{query}". Try a different search term or check the spelling.
        </div>
      )}
    </div>
  );
}

// Individual entity option component
interface EntityOptionProps {
  entity: EntityCard;
  onSelect: (entity: EntityCard) => void;
  isTopResult?: boolean;
}

function EntityOption({ entity, onSelect, isTopResult = false }: EntityOptionProps) {
  return (
    <Button
      variant="outline"
      className={`w-full justify-start text-left h-auto p-3 ${
        isTopResult ? 'border-blue-200 bg-blue-50' : ''
      }`}
      onClick={() => onSelect(entity)}
    >
      <div className="flex items-center gap-3 w-full">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">
            {entity.display_title}
            {entity.year_start && (
              <span className="text-gray-500 ml-1">({entity.year_start})</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {entity.type.charAt(0).toUpperCase() + entity.type.slice(1)}
            </Badge>
            {entity.confidence && (
              <span className="text-xs text-gray-500">
                {Math.round(entity.confidence * 100)}% match
              </span>
            )}
            {isTopResult && (
              <span className="text-xs text-blue-600 font-medium">
                Best match
              </span>
            )}
          </div>
        </div>
      </div>
    </Button>
  );
}