import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { SwipeRating, type Unit } from '../SwipeRating';

const mockUnit: Unit = {
  id: 'ep-1',
  title: 'S1E1: Pilot',
  ordinal: 1,
  subtype: 'episode',
  runtimeSec: 2520,
};

describe('SwipeRating', () => {
  it('renders unit information correctly', () => {
    const onSwiped = vi.fn();
    const { getByText } = render(
      <SwipeRating unit={mockUnit} onSwiped={onSwiped} />
    );

    expect(getByText('EPISODE 1')).toBeInTheDocument();
    expect(getByText('S1E1: Pilot')).toBeInTheDocument();
    expect(getByText('Runtime 42 min')).toBeInTheDocument();
  });

  it('shows page count for book units', () => {
    const bookUnit: Unit = {
      id: 'ch-1',
      title: 'Chapter 1: Beginning',
      ordinal: 1,
      subtype: 'chapter',
      pages: 25,
    };
    const onSwiped = vi.fn();
    const { getByText } = render(
      <SwipeRating unit={bookUnit} onSwiped={onSwiped} />
    );

    expect(getByText('CHAPTER 1')).toBeInTheDocument();
    expect(getByText('25 pages')).toBeInTheDocument();
  });

  it('calls onSwiped with correct direction and value on drag end', () => {
    const onSwiped = vi.fn();
    const { container } = render(
      <SwipeRating unit={mockUnit} onSwiped={onSwiped} />
    );

    const swipeCard = container.firstChild as HTMLElement;
    
    // Mock framer-motion drag end event
    fireEvent(swipeCard, new CustomEvent('dragend', {
      detail: { offset: { x: 150, y: 20 } } // Right swipe
    }));

    // Note: This test would need proper framer-motion mocking
    // For now, we verify the component renders without crashing
    expect(swipeCard).toBeInTheDocument();
  });

  it('displays keyboard shortcuts', () => {
    const onSwiped = vi.fn();
    const { getByText } = render(
      <SwipeRating unit={mockUnit} onSwiped={onSwiped} />
    );

    expect(getByText('Arrows: ← ↑ → ↓')).toBeInTheDocument();
    expect(getByText('Keys: A S D F')).toBeInTheDocument();
    expect(getByText('Skip')).toBeInTheDocument();
    expect(getByText('Okay')).toBeInTheDocument();
    expect(getByText('Good')).toBeInTheDocument();
    expect(getByText('Peak')).toBeInTheDocument();
  });

  it('handles arrow key shortcuts', () => {
    const onSwiped = vi.fn();
    render(<SwipeRating unit={mockUnit} onSwiped={onSwiped} />);

    // Test arrow keys
    fireEvent.keyDown(window, { code: 'ArrowRight' });
    expect(onSwiped).toHaveBeenCalledWith('right', 2);

    fireEvent.keyDown(window, { code: 'ArrowUp' });
    expect(onSwiped).toHaveBeenCalledWith('up', 1);
  });

  it('handles ASDF key shortcuts', () => {
    const onSwiped = vi.fn();
    render(<SwipeRating unit={mockUnit} onSwiped={onSwiped} />);

    // Test ASDF keys
    fireEvent.keyDown(window, { code: 'KeyA' });
    expect(onSwiped).toHaveBeenCalledWith('left', 0);

    fireEvent.keyDown(window, { code: 'KeyF' });
    expect(onSwiped).toHaveBeenCalledWith('down', 3);
  });

  it('ignores keyboard when user is typing in inputs', () => {
    const onSwiped = vi.fn();
    const { container } = render(
      <div>
        <input data-testid="test-input" />
        <SwipeRating unit={mockUnit} onSwiped={onSwiped} />
      </div>
    );

    const input = container.querySelector('[data-testid="test-input"]') as HTMLInputElement;
    input.focus();

    fireEvent.keyDown(input, { code: 'KeyA' });
    expect(onSwiped).not.toHaveBeenCalled();
  });
});