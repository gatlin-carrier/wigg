import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { MomentCapture } from '../MomentCapture';

const mockUnit = {
  id: 'ep-1',
  title: 'S1E1: Pilot',
  ordinal: 1,
  subtype: 'episode' as const,
  runtimeSec: 2520,
};

const mockPlayerControls = {
  getTime: vi.fn(() => 120),
  play: vi.fn(),
  pause: vi.fn(),
  isPlaying: vi.fn(() => true),
  seekBy: vi.fn(),
  seekTo: vi.fn(),
};

describe('MomentCapture', () => {
  it('renders moment tool button', () => {
    const onAddMoment = vi.fn();
    const { getByText } = render(
      <MomentCapture
        mediaType="tv"
        unit={mockUnit}
        onAddMoment={onAddMoment}
      />
    );

    expect(getByText('Moment Tool')).toBeInTheDocument();
  });

  it('opens moment capture form when tool button is clicked', () => {
    const onAddMoment = vi.fn();
    const { getByText } = render(
      <MomentCapture
        mediaType="tv"
        unit={mockUnit}
        onAddMoment={onAddMoment}
      />
    );

    fireEvent.click(getByText('Moment Tool'));
    expect(getByText('Drop a moment on S1E1: Pilot')).toBeInTheDocument();
  });

  it('shows timestamp controls for timed media', () => {
    const onAddMoment = vi.fn();
    const { getByText } = render(
      <MomentCapture
        mediaType="tv"
        unit={mockUnit}
        onAddMoment={onAddMoment}
      />
    );

    fireEvent.click(getByText('Moment Tool'));
    expect(getByText('-5s')).toBeInTheDocument();
    expect(getByText('+5s')).toBeInTheDocument();
  });

  it('shows page controls for book media', () => {
    const onAddMoment = vi.fn();
    const { getByLabelText } = render(
      <MomentCapture
        mediaType="book"
        unit={mockUnit}
        onAddMoment={onAddMoment}
      />
    );

    fireEvent.click(getByText('Moment Tool'));
    expect(getByLabelText('Page')).toBeInTheDocument();
  });

  it('saves moment with correct data structure', async () => {
    const onAddMoment = vi.fn();
    const { getByText } = render(
      <MomentCapture
        mediaType="tv"
        unit={mockUnit}
        onAddMoment={onAddMoment}
        externalPlayer={mockPlayerControls}
      />
    );

    fireEvent.click(getByText('Moment Tool'));
    fireEvent.click(getByText('Save moment'));

    await waitFor(() => {
      expect(onAddMoment).toHaveBeenCalledWith(
        expect.objectContaining({
          unitId: 'ep-1',
          anchorType: 'timestamp',
          anchorValue: 120,
          whyTags: [],
          spoilerLevel: 'none',
        })
      );
    });
  });

  it('integrates with external player controls', () => {
    const onAddMoment = vi.fn();
    render(
      <MomentCapture
        mediaType="tv"
        unit={mockUnit}
        onAddMoment={onAddMoment}
        externalPlayer={mockPlayerControls}
      />
    );

    expect(mockPlayerControls.getTime).toHaveBeenCalled();
  });
});