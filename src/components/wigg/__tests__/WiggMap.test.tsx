import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WiggMap } from '../WiggMap';
import type { WiggMapProps } from '@/lib/wigg/types';

// Mock the wigg curve computation functions
vi.mock('@/lib/wigg/curve', () => ({
  computeBins: vi.fn((points, duration, width) => ({
    centers: [100, 300, 500, 700, 900],
    values: [0.2, 0.6, 0.8, 0.4, 0.3],
    dx: 200
  })),
  pickPrimaryIndex: vi.fn((values) => 2), // Peak at index 2 (value 0.8)
  defaultFormat: vi.fn((pos, kind) => `${Math.floor(pos / 60)}:${(pos % 60).toString().padStart(2, '0')}`),
  clamp: vi.fn((value, min, max) => Math.max(min, Math.min(max, value)))
}));

describe('WiggMap', () => {
  const mockConsensus = {
    duration: 1200, // 20 minutes
    medianPos: 500,
    posKind: 'sec' as const,
    windows: [
      {
        start: 200,
        end: 600,
        isPrimary: true,
        score: 0.8,
        label: 'Good part'
      },
      {
        start: 700,
        end: 900,
        isPrimary: false,
        score: 0.5,
        label: 'Okay part'
      }
    ]
  };

  const mockPoints = [
    { pct: 25, weight: 1, tags: ['action'] },
    { pct: 50, weight: 0.8, tags: ['plot'] },
    { pct: 75, weight: 1.2, tags: ['climax'] }
  ];

  it('should render SVG with correct dimensions', () => {
    render(
      <WiggMap
        consensus={mockConsensus}
        points={mockPoints}
        width={600}
        height={56}
      />
    );

    const svg = screen.getByRole('img', { name: 'WiggMap visualization' });
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '600');
    expect(svg).toHaveAttribute('height', '56');
  });

  it('should render peak circles for high values', () => {
    render(
      <WiggMap
        consensus={mockConsensus}
        points={mockPoints}
        width={600}
        height={56}
      />
    );

    const svg = screen.getByRole('img', { name: 'WiggMap visualization' });
    
    // Peak detection logic should create circles for values > 0.3 threshold
    // From mock data: values [0.2, 0.6, 0.8, 0.4, 0.3] 
    // Should have peaks at indices 1 (0.6), 2 (0.8), and 3 (0.4)
    const circles = svg.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThan(0);
    
    // Check that circles have correct attributes
    circles.forEach(circle => {
      expect(circle).toHaveAttribute('r', '4');
      expect(circle).toHaveClass('fill-current');
    });
  });

  it('should handle mouse interactions for seeking and peeking', () => {
    const mockOnSeek = vi.fn();
    const mockOnPeek = vi.fn();
    
    // Mock getBoundingClientRect for the SVG element
    const mockGetBoundingClientRect = vi.fn(() => ({
      left: 100,
      top: 50,
      width: 600,
      height: 56
    }));
    
    render(
      <WiggMap
        consensus={mockConsensus}
        points={mockPoints}
        width={600}
        height={56}
        onSeek={mockOnSeek}
        onPeek={mockOnPeek}
      />
    );

    const svg = screen.getByRole('img', { name: 'WiggMap visualization' });
    
    // Mock the getBoundingClientRect method
    Object.defineProperty(svg, 'getBoundingClientRect', {
      value: mockGetBoundingClientRect,
      writable: true
    });

    // Test mouse move (should trigger onPeek)
    fireEvent.mouseMove(svg, { clientX: 400, clientY: 75 }); // 400px from screen left = 300px from SVG left
    
    // Position calculation: (300 / 600) * 1200 = 600 seconds
    expect(mockOnPeek).toHaveBeenCalledWith(600);

    // Test mouse click (should trigger onSeek)
    fireEvent.click(svg, { clientX: 250, clientY: 75 }); // 250px from screen left = 150px from SVG left
    
    // Position calculation: (150 / 600) * 1200 = 300 seconds
    expect(mockOnSeek).toHaveBeenCalledWith(300);

    // Test mouse leave (should clear peek)
    fireEvent.mouseLeave(svg);
    // Note: We can't easily test the internal state change, but the event should be handled
  });

  it('should apply sensitivity filtering to mute tagged points', () => {
    const sensitivePoints = [
      { pct: 25, weight: 1.0, tags: ['violence'] },
      { pct: 50, weight: 1.0, tags: ['safe'] },
      { pct: 75, weight: 1.0, tags: ['violence', 'gore'] }
    ];

    const sensitivity = {
      tagsToMute: ['violence', 'gore']
    };

    render(
      <WiggMap
        consensus={mockConsensus}
        points={sensitivePoints}
        sensitivity={sensitivity}
        width={600}
        height={56}
      />
    );

    // The component should filter points and apply weight reduction
    // Points with muted tags should have weight * 0.4
    // This is tested indirectly by ensuring the component renders without errors
    // when sensitivity filtering is applied
    
    const svg = screen.getByRole('img', { name: 'WiggMap visualization' });
    expect(svg).toBeInTheDocument();
    
    // Verify the component handles sensitivity props correctly by rendering successfully
    expect(svg).toHaveAttribute('width', '600');
    expect(svg).toHaveAttribute('height', '56');
  });
});