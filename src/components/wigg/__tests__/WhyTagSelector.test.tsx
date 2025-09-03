import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { WhyTagSelector, WHY_TAGS } from '../WhyTagSelector';

describe('WhyTagSelector', () => {
  it('renders all available tags', () => {
    const onTagsChange = vi.fn();
    const onSpoilerChange = vi.fn();
    const { getByText } = render(
      <WhyTagSelector
        selectedTags={[]}
        onTagsChange={onTagsChange}
        spoilerLevel="none"
        onSpoilerChange={onSpoilerChange}
      />
    );

    WHY_TAGS.forEach(tag => {
      expect(getByText(tag.label)).toBeInTheDocument();
    });
  });

  it('calls onTagsChange when tag is clicked', () => {
    const onTagsChange = vi.fn();
    const onSpoilerChange = vi.fn();
    const { getByText } = render(
      <WhyTagSelector
        selectedTags={[]}
        onTagsChange={onTagsChange}
        spoilerLevel="none"
        onSpoilerChange={onSpoilerChange}
      />
    );

    fireEvent.click(getByText('Pacing ↑'));
    expect(onTagsChange).toHaveBeenCalledWith(['pacing']);
  });

  it('removes tag when already selected', () => {
    const onTagsChange = vi.fn();
    const onSpoilerChange = vi.fn();
    const { getByText } = render(
      <WhyTagSelector
        selectedTags={['pacing']}
        onTagsChange={onTagsChange}
        spoilerLevel="none"
        onSpoilerChange={onSpoilerChange}
      />
    );

    fireEvent.click(getByText('Pacing ↑'));
    expect(onTagsChange).toHaveBeenCalledWith([]);
  });

  it('handles spoiler level changes', () => {
    const onTagsChange = vi.fn();
    const onSpoilerChange = vi.fn();
    const { getByLabelText } = render(
      <WhyTagSelector
        selectedTags={[]}
        onTagsChange={onTagsChange}
        spoilerLevel="none"
        onSpoilerChange={onSpoilerChange}
      />
    );

    fireEvent.click(getByLabelText('Light'));
    expect(onSpoilerChange).toHaveBeenCalledWith('light');
  });

  it('shows selected tags with correct styling', () => {
    const onTagsChange = vi.fn();
    const onSpoilerChange = vi.fn();
    const { getByText } = render(
      <WhyTagSelector
        selectedTags={['pacing', 'twist']}
        onTagsChange={onTagsChange}
        spoilerLevel="heavy"
        onSpoilerChange={onSpoilerChange}
      />
    );

    const pacingButton = getByText('Pacing ↑');
    expect(pacingButton.closest('button')).toHaveClass('bg-primary');
  });
});