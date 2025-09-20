import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OnboardingFlow from '../OnboardingFlow';
import { OnboardingProvider } from '@/contexts/OnboardingContext';

describe('OnboardingFlow', () => {
  function setup() {
    render(
      <OnboardingProvider>
        <OnboardingFlow />
      </OnboardingProvider>
    );
  }

  it('renders the welcome step by default', () => {
    setup();
    expect(screen.getByText('Welcome to WIGG')).toBeInTheDocument();
  });

  it('advances to the next step when Next is clicked', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('How WIGG & T2G work')).toBeInTheDocument();
  });

  it('closes when Skip is clicked', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Skip tour' }));
    expect(screen.queryByText('Welcome to WIGG')).not.toBeInTheDocument();
  });
});
