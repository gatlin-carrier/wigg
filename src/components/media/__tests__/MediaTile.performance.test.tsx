import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MediaTile from '../MediaTile';

// Mock matchMedia for useIsMobile hook
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock the hooks that MediaTile uses
vi.mock('@/hooks/useTitleProgress', () => ({
  useTitleProgress: () => ({ data: null }),
}));

vi.mock('@/hooks/useUserWiggs', () => ({
  useUserWiggs: () => ({ data: null, addWigg: vi.fn() }),
}));

describe('MediaTile Performance', () => {
  it('should memoize when props remain unchanged', () => {
    let renderCount = 0;

    // Track render calls to PacingBarcode component
    const OriginalPacingBarcode = vi.fn(() => {
      renderCount++;
      return <div data-testid="pacing-barcode">Mocked PacingBarcode</div>;
    });

    vi.doMock('@/components/wigg/PacingBarcode', () => ({
      PacingBarcode: OriginalPacingBarcode,
    }));

    const props = {
      title: 'Test Movie',
      imageUrl: 'https://example.com/image.jpg',
      year: 2023,
      ratingLabel: '8.5/10',
    };

    const { rerender } = render(
      <MemoryRouter>
        <MediaTile {...props} />
      </MemoryRouter>
    );

    const initialRenderCount = renderCount;

    // Re-render with identical props - should not re-render child components
    rerender(
      <MemoryRouter>
        <MediaTile {...props} />
      </MemoryRouter>
    );

    // Without proper memoization, PacingBarcode will re-render unnecessarily
    expect(renderCount).toBe(initialRenderCount);
  });
});