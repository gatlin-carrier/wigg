import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RatingButtons } from '../RatingButtons';
import type { SwipeValue } from '../SwipeRating';

// Mock querySelector for flyTo animation testing
const mockQuerySelector = vi.fn();
Object.defineProperty(document, 'querySelector', {
  value: mockQuerySelector,
  writable: true,
});

describe('RatingButtons', () => {
  it('should render all four rating buttons with correct emojis', () => {
    render(<RatingButtons />);
    
    // Check for face emojis corresponding to ratings 0-3
    expect(screen.getByText('😴')).toBeInTheDocument(); // Rating 0
    expect(screen.getByText('🙂')).toBeInTheDocument(); // Rating 1
    expect(screen.getByText('😃')).toBeInTheDocument(); // Rating 2
    expect(screen.getByText('🤩')).toBeInTheDocument(); // Rating 3
    
    // Verify radiogroup role
    expect(screen.getByRole('radiogroup', { name: 'Rate moment' })).toBeInTheDocument();
    
    // Verify all buttons have radio role
    const radioButtons = screen.getAllByRole('radio');
    expect(radioButtons).toHaveLength(4);
  });

  it('should call onChange when rating is clicked', () => {
    const mockOnChange = vi.fn();
    
    render(<RatingButtons onChange={mockOnChange} />);
    
    // Test clicking different ratings
    const rating0Button = screen.getByText('😴').closest('button')!;
    const rating1Button = screen.getByText('🙂').closest('button')!; 
    const rating2Button = screen.getByText('😃').closest('button')!;
    const rating3Button = screen.getByText('🤩').closest('button')!;
    
    fireEvent.click(rating0Button);
    expect(mockOnChange).toHaveBeenCalledWith("0");
    
    fireEvent.click(rating1Button);
    expect(mockOnChange).toHaveBeenCalledWith("1");
    
    fireEvent.click(rating2Button);
    expect(mockOnChange).toHaveBeenCalledWith("2");
    
    fireEvent.click(rating3Button);
    expect(mockOnChange).toHaveBeenCalledWith("3");
    
    expect(mockOnChange).toHaveBeenCalledTimes(4);
  });

  it('should apply correct size classes based on size prop', () => {
    const { rerender } = render(<RatingButtons size="compact" />);
    
    let buttons = screen.getAllByRole('radio');
    expect(buttons[0]).toHaveClass('h-11', 'w-11', 'text-base');
    
    rerender(<RatingButtons size="regular" />);
    buttons = screen.getAllByRole('radio');
    expect(buttons[0]).toHaveClass('h-12', 'w-12', 'text-lg');
    
    rerender(<RatingButtons size="large" />);
    buttons = screen.getAllByRole('radio');
    expect(buttons[0]).toHaveClass('h-14', 'w-14', 'text-xl');
  });
});