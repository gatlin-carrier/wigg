import React, { useId, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderSearchProps {
  isExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  inputId?: string;
}

export default function HeaderSearch({ isExpanded = false, onToggle, inputId }: HeaderSearchProps) {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const generatedId = useId();
  const baseId = inputId ?? generatedId;
  const desktopInputId = `${baseId}-desktop`;
  const mobileInputId = `${baseId}-mobile`;
  const mobileFormId = `${baseId}-mobile-form`;

  function go(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const query = q.trim();
    if (!query) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
  }

  function handleMobileToggle() {
    const newExpanded = !isExpanded;
    onToggle?.(newExpanded);
    if (isExpanded) {
      setQ('');
    }
  }

  return (
    <>
      {/* Desktop search - always visible */}
      <form
        onSubmit={go}
        className="hidden md:block"
        role="search"
        aria-label="Site search"
      >
        <label htmlFor={desktopInputId} className="sr-only">
          Search the WIGG catalog
        </label>
        <Input
          id={desktopInputId}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search movies, TV, books…"
          data-onboarding-target="search-input"
          aria-describedby={`${desktopInputId}-description`}
          className="w-80"
        />
        <p id={`${desktopInputId}-description`} className="sr-only">
          Type a title or keyword and press Enter to view search results.
        </p>
      </form>

      {/* Mobile search */}
      <div className="md:hidden flex items-center w-full">
        {!isExpanded ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMobileToggle}
            className="flex items-center gap-1 transition-all duration-300 ease-out"
            aria-label="Open site search"
            aria-expanded={isExpanded}
            aria-controls={mobileFormId}
          >
            <Search className="h-4 w-4 transition-transform duration-300 ease-out hover:scale-110" aria-hidden />
          </Button>
        ) : (
          <div className="flex items-center gap-2 w-full animate-in slide-in-from-right-2 duration-300">
            <form
              id={mobileFormId}
              onSubmit={go}
              className="flex items-center gap-2 flex-1"
              role="search"
              aria-label="Site search"
            >
              <label htmlFor={mobileInputId} className="sr-only">
                Search the WIGG catalog
              </label>
              <Input
                id={mobileInputId}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                data-onboarding-target="search-input"
                className="flex-1 transition-all duration-200 ease-out focus:scale-[1.02] focus-visible:ring-0 focus-visible:ring-offset-0"
                autoFocus
              />
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={handleMobileToggle}
                className="transition-all duration-200 ease-out hover:scale-110 hover:rotate-90"
                aria-label="Close site search"
              >
                <X className="h-4 w-4" aria-hidden />
              </Button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
