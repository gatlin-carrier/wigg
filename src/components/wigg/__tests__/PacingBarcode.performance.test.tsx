import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import type { ProgressSegment } from '@/hooks/useTitleProgress';

import { PacingBarcode } from '../PacingBarcode';

describe('PacingBarcode Goodness Curve', () => {
  it('renders fallback messaging when no scores are present', () => {
    const segments: ProgressSegment[] = Array.from({ length: 10 }, (_, i) => ({
      startPct: i * 10,
      endPct: (i + 1) * 10,
    }));

    render(
      <PacingBarcode
        titleId="fallback"
        segments={segments}
        height={48}
      />
    );

    expect(screen.getByText(/No community data yet/i)).toBeInTheDocument();
  });

  it('stays visually stable when re-rendered with equivalent data', () => {
    const segments: ProgressSegment[] = Array.from({ length: 20 }, (_, i) => ({
      startPct: i * 5,
      endPct: (i + 1) * 5,
      meanScore: 2 + (i % 4) * 0.3,
    }));

    const { container, rerender } = render(
      <PacingBarcode titleId="stable" segments={segments} height={60} />
    );

    const initialMarkup = container.innerHTML;

    const clonedSegments: ProgressSegment[] = segments.map((segment) => ({ ...segment }));
    rerender(<PacingBarcode titleId="stable" segments={clonedSegments} height={60} />);

    expect(container.innerHTML).toBe(initialMarkup);
  });
});