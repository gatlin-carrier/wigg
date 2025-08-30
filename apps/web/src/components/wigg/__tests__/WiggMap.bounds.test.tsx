import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { WiggMap } from '../WiggMap';

const baseConsensus = {
  posKind: 'sec' as const,
  duration: 100,
  windows: [],
};

describe('WiggMap bounds clamping', () => {
  it('clamps click outside width and still calls onSeek', () => {
    const onSeek = vi.fn();
    const { getByRole } = render(
      <WiggMap
        consensus={baseConsensus}
        points={[]}
        width={200}
        height={40}
        onSeek={onSeek}
      />
    );

    const svg = getByRole('img');

    // Mock getBoundingClientRect to control offset/width
    vi.spyOn(svg as any, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 200,
      bottom: 40,
      width: 200,
      height: 40,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    // Click far left (negative)
    fireEvent.click(svg, { clientX: -10 });
    expect(onSeek).toHaveBeenCalledTimes(1);
    const firstPos = onSeek.mock.calls[0][0];
    expect(firstPos).toBe(0);

    // Click far right (beyond width)
    fireEvent.click(svg, { clientX: 250 });
    expect(onSeek).toHaveBeenCalledTimes(2);
    const secondPos = onSeek.mock.calls[1][0];
    expect(secondPos).toBe(100);
  });
});

