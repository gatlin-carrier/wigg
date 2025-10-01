import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OnboardingFlow from '../OnboardingFlow';
import { OnboardingProvider } from '@/contexts/OnboardingContext';

describe('OnboardingFlow', () => {
  beforeEach(() => {
    (window as any).scrollTo = vi.fn();
  });
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

  it('closes when the backdrop is clicked', () => {
    setup();
    const overlay = screen.getByTestId('onboarding-overlay');
    fireEvent.click(overlay);
    expect(screen.queryByText('Welcome to WIGG')).not.toBeInTheDocument();
  });

  it('supports keyboard navigation shortcuts', () => {
    setup();
    const overlay = screen.getByTestId('onboarding-overlay');
    overlay.focus();
    fireEvent.keyDown(overlay, { key: 'ArrowRight' });
    expect(screen.getByText('How WIGG & T2G work')).toBeInTheDocument();
    fireEvent.keyDown(overlay, { key: 'ArrowLeft' });
    expect(screen.getByText('Welcome to WIGG')).toBeInTheDocument();
    fireEvent.keyDown(overlay, { key: 's' });
    expect(screen.queryByText('Welcome to WIGG')).not.toBeInTheDocument();
  });

  it('scrolls to top when modal opens to ensure visibility on mobile', () => {
    window.localStorage.clear();
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    setup();
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });
    scrollToSpy.mockRestore();
  });
});
