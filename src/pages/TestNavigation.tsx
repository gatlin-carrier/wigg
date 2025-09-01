import React from 'react';
import { usePageHeader } from '@/contexts/HeaderContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function TestNavigation() {
  const navigate = useNavigate();
  
  // Configure global header for this test page
  usePageHeader({
    title: "Test Navigation",
    subtitle: "Testing global header navigation functionality",
    showBackButton: true,
    showHomeButton: true,
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Navigation Test Page</h2>
          <p className="text-muted-foreground">
            This page tests the global header navigation functionality.
            The header should show Back and Home buttons.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button 
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="h-20"
          >
            Go to Dashboard
          </Button>
          
          <Button 
            onClick={() => navigate('/search?q=test')}
            variant="outline"
            className="h-20"
          >
            Go to Search
          </Button>
          
          <Button 
            onClick={() => navigate('/feed')}
            variant="outline"
            className="h-20"
          >
            Go to Feed
          </Button>
          
          <Button 
            onClick={() => navigate('/auth')}
            variant="outline"
            className="h-20"
          >
            Go to Auth
          </Button>
        </div>
        
        <div className="text-center text-sm text-muted-foreground">
          <p>Test the Back and Home buttons in the header above.</p>
          <p>Back button should take you to the previous page.</p>
          <p>Home button should always take you to the landing page.</p>
        </div>
      </div>
    </div>
  );
}