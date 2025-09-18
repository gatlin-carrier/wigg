import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MediaTile } from '../MediaTile';

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

describe('MediaTile Layout Stability', () => {
  it('should have explicit dimensions on images to prevent layout shifts', () => {
    const { container } = render(
      <MemoryRouter>
        <MediaTile
          title="Test Movie"
          imageUrl="https://example.com/poster.jpg"
          year={2023}
          ratingLabel="8.5/10"
        />
      </MemoryRouter>
    );

    const image = container.querySelector('img');
    expect(image).toBeTruthy();

    // Images should have explicit width and height attributes to prevent CLS
    expect(image?.getAttribute('width')).toBeTruthy();
    expect(image?.getAttribute('height')).toBeTruthy();

    // Should maintain aspect ratio
    const width = parseInt(image?.getAttribute('width') || '0');
    const height = parseInt(image?.getAttribute('height') || '0');
    const aspectRatio = width / height;
    expect(aspectRatio).toBeCloseTo(2/3, 1); // 2:3 aspect ratio for posters
  });
});