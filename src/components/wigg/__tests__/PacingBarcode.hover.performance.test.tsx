import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { PacingBarcode } from '../PacingBarcode';

describe('PacingBarcode Hover Performance', () => {
  it('should not re-render entire canvas on hover when not interactive', () => {
    let canvasRenderCount = 0;

    const mockFillRect = vi.fn(() => { canvasRenderCount++; });
    const mockGetContext = vi.fn(() => ({
      scale: vi.fn(),
      clearRect: vi.fn(),
      fillRect: mockFillRect,
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      closePath: vi.fn(),
      arc: vi.fn(),
      setLineDash: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      clip: vi.fn(),
      quadraticCurveTo: vi.fn(),
    }));

    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: mockGetContext,
    });

    const segments = Array.from({ length: 20 }, (_, i) => ({
      startPct: i * 5,
      endPct: (i + 1) * 5,
      meanScore: 2.0,
    }));

    const { container } = render(
      <PacingBarcode
        titleId="test-title"
        segments={segments}
        height={60}
        interactive={false}
        highlightOnHover={false}
      />
    );

    const initialRenderCount = canvasRenderCount;

    // Simulate multiple hover events (common in dashboard scrolling)
    const canvas = container.querySelector('canvas');
    if (canvas) {
      fireEvent.mouseMove(canvas, { clientX: 100 });
      fireEvent.mouseMove(canvas, { clientX: 150 });
      fireEvent.mouseMove(canvas, { clientX: 200 });
    }

    // For non-interactive components, canvas should not re-render on hover
    expect(canvasRenderCount).toBe(initialRenderCount);
  });
});