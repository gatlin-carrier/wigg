import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderSearchProps {
  isExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
}

export default function HeaderSearch({ isExpanded = false, onToggle }: HeaderSearchProps) {
  const [q, setQ] = useState('');
  const navigate = useNavigate();

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
      <form onSubmit={go} className="hidden md:block">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search movies, TV, books…"
          data-onboarding-target="search-input"
          className="w-80"
        />
      </form>

      {/* Mobile search */}
      <div className="md:hidden flex items-center w-full">
        {!isExpanded ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMobileToggle}
            className="flex items-center gap-1 transition-all duration-300 ease-out"
          >
            <Search className="h-4 w-4 transition-transform duration-300 ease-out hover:scale-110" />
          </Button>
        ) : (
          <div className="flex items-center gap-2 w-full animate-in slide-in-from-right-2 duration-300">
            <form onSubmit={go} className="flex items-center gap-2 flex-1">
              <Input
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
              >
                <X className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
