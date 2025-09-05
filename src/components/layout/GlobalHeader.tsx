import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User } from 'lucide-react';
import HeaderSearch from '@/components/search/HeaderSearch';
import ThemeToggle from '@/components/ThemeToggle';
import { useHeader } from '@/contexts/HeaderContext';
import { useAuth } from '@/hooks/useAuth';

export default function GlobalHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { config } = useHeader();
  const { user } = useAuth();
  const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  
  const { 
    title, 
    subtitle, 
    showBackButton = true, 
    showHomeButton = true, 
    rightContent 
  } = config;
  
  // Determine if we should show navigation buttons based on current route
  const isHomePage = location.pathname === '/';
  const isDashboardPage = location.pathname === '/dashboard';
  const canGoBack = window.history.length > 1;
  
  const handleBack = () => {
    if (canGoBack) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };
  
  const handleHome = () => {
    navigate('/dashboard');
  };

  // Close mobile search on scroll or outside click
  useEffect(() => {
    if (!isMobileSearchExpanded) return;

    // Add a small delay to prevent immediate closing when opening
    const timeoutId = setTimeout(() => {
      const handleScroll = () => {
        setIsMobileSearchExpanded(false);
      };

      const handleClickOutside = (event: MouseEvent) => {
        if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
          setIsMobileSearchExpanded(false);
        }
      };

      const handleTouchStart = (event: TouchEvent) => {
        if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
          setIsMobileSearchExpanded(false);
        }
      };

      // Add event listeners
      window.addEventListener('scroll', handleScroll, { passive: true });
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleTouchStart, { passive: true });

      return () => {
        // Cleanup event listeners
        window.removeEventListener('scroll', handleScroll);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleTouchStart);
      };
    }, 100); // 100ms delay

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isMobileSearchExpanded]);
  
  // Don't show header on home page to preserve the hero design
  if (isHomePage) {
    return null;
  }
  
  return (
    <header ref={headerRef} className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 left-0 right-0 z-[100] relative">
      <div className="container mx-auto px-4 py-2.5">
        <div className="flex items-center justify-between">
          {/* Left: Navigation and Title */}
          <div className="flex items-center gap-4 flex-1">
            {/* Navigation Buttons */}
            <div className="flex items-center gap-2">
              {showBackButton && !isHomePage && !isDashboardPage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                  className="flex items-center gap-2"
                  title="Go back"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
              )}
              
            </div>
            
            {/* Page Title with smooth compression animation */}
            <div className={`flex items-center gap-3 min-w-0 transition-all duration-300 ease-out overflow-hidden ${
              isMobileSearchExpanded 
                ? 'md:flex w-0 opacity-0 scale-x-0' 
                : 'flex w-auto opacity-100 scale-x-100'
            }`}>
              <button 
                onClick={handleHome}
                className={`w-8 h-8 rounded-full object-cover flex-shrink-0 hover:opacity-80 transition-all duration-300 ease-out ${
                  isMobileSearchExpanded ? 'scale-75 opacity-0' : 'scale-100 opacity-100'
                }`}
                title="Go to dashboard"
              >
                <img 
                  src="/favicon.png" 
                  alt="WIGG Logo" 
                  className="w-full h-full rounded-full object-cover"
                />
              </button>
              {(title || subtitle) && (
                <div className={`min-w-0 transition-all duration-300 ease-out ${
                  isMobileSearchExpanded ? 'w-0 opacity-0 scale-x-0' : 'w-auto opacity-100 scale-x-100'
                }`}>
                  {title && (
                    <h1 className="text-lg sm:text-xl font-bold bg-gradient-primary bg-clip-text text-transparent truncate whitespace-nowrap">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="text-xs sm:text-sm text-muted-foreground truncate whitespace-nowrap">
                      {subtitle}
                    </p>
                  )}
                </div>
              )}
            </div>
            
            {/* Mobile search with smooth expansion animation */}
            <div className={`md:hidden transition-all duration-300 ease-out overflow-hidden ${
              isMobileSearchExpanded 
                ? 'flex-1 opacity-100 scale-x-100' 
                : 'w-0 opacity-0 scale-x-0'
            }`}>
              {isMobileSearchExpanded && (
                <HeaderSearch 
                  isExpanded={isMobileSearchExpanded} 
                  onToggle={setIsMobileSearchExpanded}
                />
              )}
            </div>
          </div>
          
          {/* Right: Search, Custom Content, and Theme Toggle */}
          <div className="flex items-center gap-3">
            {!isMobileSearchExpanded && (
              <HeaderSearch 
                isExpanded={isMobileSearchExpanded} 
                onToggle={setIsMobileSearchExpanded}
              />
            )}
            {rightContent}
            
            {/* Profile button - only show when logged in */}
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/profile')}
                className="flex items-center gap-1"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </Button>
            )}
            
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

