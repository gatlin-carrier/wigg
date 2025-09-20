import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MediaTileSkeleton } from '../MediaTileSkeleton';

describe('MediaTileSkeleton', () => {
  it('renders structural skeleton placeholders', () => {
    const { container } = render(<MediaTileSkeleton />);
    const imageSkeleton = container.querySelector('.aspect-\\[2\\/3\\]');
    expect(imageSkeleton).toBeTruthy();
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(3);
  });

  it('applies animation delay when provided', () => {
    const { container } = render(<MediaTileSkeleton delay={0.2} />);
    const firstSkeleton = container.querySelector('.animate-pulse') as HTMLElement | null;
    expect(firstSkeleton?.style.animationDelay).toBe('0.20s');
  });
});
