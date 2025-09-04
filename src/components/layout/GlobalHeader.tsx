import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, User } from 'lucide-react';
import HeaderSearch from '@/components/search/HeaderSearch';
import ThemeToggle from '@/components/ThemeToggle';
import { useHeader } from '@/contexts/HeaderContext';
import { useAuth } from '@/hooks/useAuth';

export default function GlobalHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { config } = useHeader();
  const { user } = useAuth();
  
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
  
  // Don't show header on home page to preserve the hero design
  if (isHomePage) {
    return null;
  }
  
  return (
    <header className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 fixed sm:sticky top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Navigation and Title */}
          <div className="flex items-center gap-4">
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
              
              {showHomeButton && !isHomePage && !isDashboardPage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleHome}
                  className="hidden sm:flex items-center gap-2"
                  title="Go to dashboard"
                >
                  <Home className="h-4 w-4" />
                  Home
                </Button>
              )}
            </div>
            
            {/* Page Title */}
            <div className="flex items-center gap-3 min-w-0">
              <button 
                onClick={handleHome}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0 hover:opacity-80 transition-opacity"
                title="Go to dashboard"
              >
                <img 
                  src="/favicon.png" 
                  alt="WIGG Logo" 
                  className="w-full h-full rounded-full object-cover"
                />
              </button>
              {(title || subtitle) && (
                <div className="hidden sm:block min-w-0">
                  {title && (
                    <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent truncate">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="text-sm text-muted-foreground truncate">
                      {subtitle}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Right: Search, Custom Content, and Theme Toggle */}
          <div className="flex items-center gap-3">
            <HeaderSearch />
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

// Hook to configure header for each page
export function usePageHeader(config: {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
}) {
  return config;
}