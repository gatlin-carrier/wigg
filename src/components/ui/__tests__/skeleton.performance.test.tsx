import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton } from '../skeleton';

describe('Skeleton Performance', () => {
  it('should prevent animation-induced layout shifts with transform optimization', () => {
    const { container } = render(
      <Skeleton className="w-48 h-64" />
    );

    const skeleton = container.querySelector('.animate-pulse');
    expect(skeleton).toBeTruthy();

    // Should use transform to prevent layout shifts during animation
    const hasTransformOptimization = skeleton?.classList.contains('transform-gpu') ||
      skeleton?.style.transform === 'translateZ(0)' ||
      getComputedStyle(skeleton!).transform !== 'none';

    expect(hasTransformOptimization).toBe(true);
  });
});