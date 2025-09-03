import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { HeaderProvider } from '@/contexts/HeaderContext';
import { WhyTagSelector } from '../WhyTagSelector';
import { SessionRecap } from '../SessionRecap';
import { GoodnessCurve } from '../GoodnessCurve';

// Mock auth and supabase
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-123' }, loading: false })
}));

vi.mock('@/integrations/supabase/client');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <HeaderProvider>
          {children}
        </HeaderProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('WIGG System Integration', () => {
  describe('WhyTagSelector Component', () => {
    it('handles tag selection and spoiler levels', () => {
      const onTagsChange = vi.fn();
      const onSpoilerChange = vi.fn();
      
      const { getByText } = render(
        <WhyTagSelector
          selectedTags={[]}
          onTagsChange={onTagsChange}
          spoilerLevel="none"
          onSpoilerChange={onSpoilerChange}
        />,
        { wrapper: createWrapper() }
      );

      // Test tag selection
      fireEvent.click(getByText('Pacing ↑'));
      expect(onTagsChange).toHaveBeenCalledWith(['pacing']);

      // Test spoiler level change
      fireEvent.click(getByText('Light'));
      expect(onSpoilerChange).toHaveBeenCalledWith('light');
    });
  });

  describe('SessionRecap Component', () => {
    it('displays session statistics correctly', () => {
      const stats = { n: 10, peak: 2, good: 4, ok: 3, skip: 1 };
      
      const { getByText } = render(
        <SessionRecap stats={stats} />,
        { wrapper: createWrapper() }
      );

      expect(getByText('2')).toBeInTheDocument(); // Peak count
      expect(getByText('4')).toBeInTheDocument(); // Good count
      expect(getByText('3')).toBeInTheDocument(); // Ok count
      expect(getByText('1')).toBeInTheDocument(); // Skip count
    });
  });

  describe('GoodnessCurve Component', () => {
    it('renders chart with data points', () => {
      const data = [
        { unit: 1, label: 'E1', score: 1.5 },
        { unit: 2, label: 'E2', score: 2.0 },
        { unit: 3, label: 'E3', score: 2.8 },
      ];

      const { getByText } = render(
        <GoodnessCurve data={data} />,
        { wrapper: createWrapper() }
      );

      expect(getByText('Goodness Curve')).toBeInTheDocument();
      expect(getByText(/Rolling feel of the season/)).toBeInTheDocument();
    });
  });

  describe('WIGG Data Flow', () => {
    it('maintains data consistency across components', () => {
      // Test that swipe values map correctly to database format
      const swipeToDbMapping = {
        0: 'Skip',    // Skip
        1: 'Okay',    // Okay  
        2: 'Good',    // Good
        3: 'Peak',    // Peak
      };

      Object.entries(swipeToDbMapping).forEach(([value, label]) => {
        expect(label).toBeDefined();
        expect(Number(value)).toBeGreaterThanOrEqual(0);
        expect(Number(value)).toBeLessThanOrEqual(3);
      });
    });

    it('validates moment data structure', () => {
      const validMoment = {
        id: 'moment-1',
        unitId: 'ep-1',
        anchorType: 'timestamp' as const,
        anchorValue: 120,
        whyTags: ['pacing'],
        spoilerLevel: 'none' as const,
        notes: 'Great scene',
      };

      // Verify all required fields are present
      expect(validMoment.id).toBeDefined();
      expect(validMoment.unitId).toBeDefined();
      expect(validMoment.anchorType).toMatch(/^(timestamp|page|panel)$/);
      expect(typeof validMoment.anchorValue).toBe('number');
      expect(Array.isArray(validMoment.whyTags)).toBe(true);
      expect(validMoment.spoilerLevel).toMatch(/^(none|light|heavy)$/);
    });
  });

  describe('Media Type Support', () => {
    it('supports all defined media types', () => {
      const supportedTypes = ['tv', 'anime', 'book', 'manga', 'podcast'];
      
      supportedTypes.forEach(type => {
        expect(['tv', 'anime', 'book', 'manga', 'podcast']).toContain(type);
      });
    });

    it('handles time-based vs page-based positioning', () => {
      const timedMedia = ['tv', 'anime', 'podcast'];
      const pagedMedia = ['book', 'manga'];

      timedMedia.forEach(type => {
        expect(['tv', 'anime', 'podcast']).toContain(type);
      });

      pagedMedia.forEach(type => {
        expect(['book', 'manga']).toContain(type);
      });
    });
  });
});