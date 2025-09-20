import { fireEvent, render, screen } from '@testing-library/react';
import OnboardingFlow from '../OnboardingFlow';
import { OnboardingProvider } from '@/contexts/OnboardingContext';

describe('OnboardingFlow behaviour', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  const renderFlow = () =>
    render(
      <OnboardingProvider>
        <OnboardingFlow />
      </OnboardingProvider>
    );

  it('shows the welcome step by default', () => {
    renderFlow();
    expect(screen.getByText('Welcome to WIGG')).toBeInTheDocument();
  });

  it('advances to the next step when Next is clicked', async () => {
    renderFlow();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('How WIGG & T2G work')).toBeInTheDocument();
    const persisted = JSON.parse(window.localStorage.getItem('wigg:onboarding:state') ?? '{}');
    expect(persisted.step).toBe(1);
  });

  it('closes when Escape is pressed', () => {
    renderFlow();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByText('Welcome to WIGG')).not.toBeInTheDocument();
  });
});
