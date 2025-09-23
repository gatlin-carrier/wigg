import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';

import type { ProgressSegment } from '@/hooks/useTitleProgress';

import { PacingBarcode } from '../PacingBarcode';

describe('PacingBarcode interactions', () => {
  it('ignores interactive handlers when rendered as a static sparkline', () => {
    const segments: ProgressSegment[] = Array.from({ length: 16 }, (_, i) => ({
      startPct: i * 6.25,
      endPct: (i + 1) * 6.25,
      meanScore: 1.5 + (i % 3) * 0.4,
    }));

    const onScrub = vi.fn();
    const onMarkWigg = vi.fn();

    const { container } = render(
      <PacingBarcode
        titleId="static"
        segments={segments}
        height={64}
        interactive={true}
        onScrub={onScrub}
        onMarkWigg={onMarkWigg}
      />
    );

    const svg = container.querySelector('svg');
    if (svg) {
      fireEvent.mouseMove(svg, { clientX: 120 });
      fireEvent.click(svg, { clientX: 120 });
    }

    expect(onScrub).not.toHaveBeenCalled();
    expect(onMarkWigg).not.toHaveBeenCalled();
  });
});