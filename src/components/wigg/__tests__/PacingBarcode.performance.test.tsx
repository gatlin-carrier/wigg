import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { PacingBarcode } from '../PacingBarcode';

describe('PacingBarcode Performance', () => {
  const mockSegments = Array.from({ length: 20 }, (_, i) => ({
    startPct: i * 5,
    endPct: (i + 1) * 5,
    meanScore: Math.random() * 4,
    userScore: undefined,
  }));

  it('should optimize re-renders for complex segment arrays', () => {
    let renderCount = 0;

    // Mock the canvas rendering to count actual render operations
    const mockFillRect = vi.fn(() => { renderCount++; });
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

    const props = {
      titleId: 'test-title',
      segments: mockSegments,
      height: 60,
    };

    const { rerender } = render(<PacingBarcode {...props} />);
    const initialRenderCount = renderCount;

    // Create a new array with same content (should not re-render with proper memoization)
    const identicalSegments = mockSegments.map(s => ({ ...s }));
    rerender(<PacingBarcode {...props} segments={identicalSegments} />);

    // Without proper memoization, this will fail because React sees different array reference
    expect(renderCount).toBe(initialRenderCount);
  });
});