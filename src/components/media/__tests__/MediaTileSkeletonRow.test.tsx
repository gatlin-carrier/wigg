import { render } from '@testing-library/react';
import { MediaTileSkeletonRow } from '../MediaTileSkeleton';

describe('MediaTileSkeletonRow', () => {
  it('renders the requested number of wrappers', () => {
    const { container } = render(<MediaTileSkeletonRow count={3} />);
    const items = container.querySelectorAll('[data-testid="media-tile-skeleton"]');
    expect(items.length).toBe(3);
  });
});
