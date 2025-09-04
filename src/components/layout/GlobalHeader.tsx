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
    <header className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
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
                  Back
                </Button>
              )}
              
              {showHomeButton && !isHomePage && !isDashboardPage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleHome}
                  className="flex items-center gap-2"
                  title="Go to dashboard"
                >
                  <Home className="h-4 w-4" />
                  Home
                </Button>
              )}
            </div>
            
            {/* Page Title */}
            {(title || subtitle) && (
              <div className="flex items-center gap-3 min-w-0">
                <img 
                  src="/favicon.png" 
                  alt="WIGG Logo" 
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
                <div className="min-w-0">
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
              </div>
            )}
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
            
            <ThemeToggle />
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