import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MediaTileSkeleton } from '../MediaTileSkeleton';

describe('MediaTileSkeleton', () => {
  it('should render skeleton with fixed dimensions to prevent layout shifts', () => {
    const { container } = render(<MediaTileSkeleton />);

    // Should have image skeleton with exact aspect ratio
    const imageSkeleton = container.querySelector('.aspect-\\[2\\/3\\]');
    expect(imageSkeleton).toBeTruthy();

    // Should have multiple skeleton elements for different content areas
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(3); // Image, title, rating, barcode
  });
});