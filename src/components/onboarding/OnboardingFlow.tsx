import { useCallback, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import type { LucideIcon } from 'lucide-react';
import { Sparkles, Compass, Search, Rocket, Flag } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  points?: string[];
  highlightSelector?: string;
  final?: boolean;
}

const STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to WIGG',
    description: 'WIGG shows you the exact moment movies, shows, games, and books finally click so you can skip the slog and jump to the good part.',
    icon: Sparkles,
    points: [
      'Community-sourced “When It Gets Good” (WIGG) markers',
      'Time-to-Get-Good (T2G) snapshots that set expectations',
      'Pacing visuals that show the ride before you commit',
    ],
  },
  {
    id: 'concepts',
    title: 'How WIGG & T2G work',
    description: 'Every WIGG point is a community signal that a specific episode, chapter, or moment is where the story truly hooks.',
    icon: Compass,
    points: [
      'T2G measures how long it takes before the magic happens',
      'You can add single points or capture a binge session live',
      'Ratings, spoiler levels, and tags keep context crystal clear',
    ],
  },
  {
    id: 'search',
    title: 'Search smarter',
    description: 'Use the global search bar to surface T2G insights instantly for any title you are curious about.',
    icon: Search,
    highlightSelector: '[data-onboarding-target="search-input"]',
    points: [
      'Compare T2G across media types with one query',
      'Open details to see pacing charts and community notes',
    ],
  },
  {
    id: 'dashboard',
    title: 'Log your own WIGG points',
    description: 'Your dashboard is the quickest path to share when something gets good. Use the glowing WIGG orb in the header to jump back any time.',
    icon: Rocket,
    highlightSelector: '[data-onboarding-target="home-button"]',
    points: [
      'Add a single WIGG point or launch a live capture session',
      'Your contributions refine T2G for everyone in the community',
    ],
  },
  {
    id: 'finish',
    title: 'You are ready to explore',
    description: 'Start a search, browse recommendations, or log the moments you love. You can reopen this tour from Settings → Onboarding.',
    icon: Flag,
    final: true,
  },
];

export function OnboardingFlow() {
  const { isActive, step, setStep, skip, complete } = useOnboarding();

  const clampedIndex = useMemo(() => {
    if (Number.isNaN(step)) return 0;
    return Math.min(Math.max(step, 0), STEPS.length - 1);
  }, [step]);

  const activeStep = STEPS[clampedIndex];
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  const handleNext = useCallback(() => {
    if (clampedIndex >= STEPS.length - 1 || activeStep?.final) {
      complete();
    } else {
      setStep(clampedIndex + 1);
    }
  }, [clampedIndex, activeStep, complete, setStep]);

  const handleBack = useCallback(() => {
    if (clampedIndex === 0) {
      skip();
      return;
    }
    setStep(Math.max(0, clampedIndex - 1));
  }, [clampedIndex, setStep, skip]);

  useEffect(() => {
    if (!isActive) return;
    if (typeof window === 'undefined') return;
    const keyHandler = (event: KeyboardEvent) => {
      if (!dialogRef.current) {
        return;
      }
      if (event.key === 'Escape') {
        skip();
      }
      if (event.key === 'ArrowRight') {
        handleNext();
      }
      if (event.key === 'ArrowLeft') {
        handleBack();
      }
      if (event.key === 'Tab') {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) {
          return;
        }
        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];
        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault();
            last.focus();
          }
        } else if (document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', keyHandler);
    return () => window.removeEventListener('keydown', keyHandler);
  }, [isActive, handleBack, handleNext, skip]);

  useEffect(() => {
    if (!isActive) return;
    if (typeof document === 'undefined') return;
    const selector = activeStep?.highlightSelector;
    if (!selector) return;
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) return;
    el.classList.add('onboarding-highlight');
    return () => {
      el.classList.remove('onboarding-highlight');
    };
  }, [isActive, activeStep?.highlightSelector, clampedIndex]);

  useEffect(() => {
    if (!isActive) return;
    if (typeof document === 'undefined') return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isActive]);

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    if (!isActive) {
      if (previouslyFocusedElement.current && previouslyFocusedElement.current.isConnected) {
        previouslyFocusedElement.current.focus();
      }
      previouslyFocusedElement.current = null;
      return;
    }
    previouslyFocusedElement.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = window.requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [isActive]);

  if (!isActive || !activeStep) {
    return null;
  }

  const progressPercent = ((clampedIndex + 1) / STEPS.length) * 100;
  const Icon = activeStep.icon;
  const headingId = `onboarding-step-${activeStep.id}`;
  const descriptionId = `${headingId}-description`;
  const liveRegionId = `${headingId}-live`;

  const overlay = (
    <div className="fixed inset-0 z-[220] pointer-events-none">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" aria-hidden="true" />
      {/* Modal positioning: vertical center on all sizes, horizontal: center on mobile/desktop, right on tablets for optimal UX across devices */}
      <div className="absolute inset-0 flex items-center justify-center md:justify-end lg:justify-center p-4 md:p-8 pointer-events-none">
        <div
          ref={dialogRef}
          className="pointer-events-auto w-full max-w-lg rounded-3xl border border-border/60 bg-card/95 shadow-2xl shadow-primary/10 backdrop-blur px-6 py-6 md:px-8 md:py-7 space-y-6 animate-in fade-in slide-in-from-bottom-6 md:slide-in-from-right-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          aria-describedby={`${descriptionId} ${liveRegionId}`.trim()}
          tabIndex={-1}
        >
          <p id={liveRegionId} className="sr-only" aria-live="polite">
            Step {clampedIndex + 1} of {STEPS.length}: {activeStep.title}
          </p>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Step {clampedIndex + 1} of {STEPS.length}</p>
              <h2 id={headingId} className="text-xl md:text-2xl font-semibold">{activeStep.title}</h2>
            </div>
          </div>

          <p id={descriptionId} className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {activeStep.description}
          </p>

          {activeStep.points && (
            <ul className="space-y-2 text-sm text-muted-foreground">
              {activeStep.points.map((point) => (
                <li key={point} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-primary" aria-hidden />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={STEPS.length}
                aria-valuenow={clampedIndex}
                aria-valuetext={`Step ${clampedIndex + 1} of ${STEPS.length}`}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Button variant="ghost" size="sm" onClick={skip} className="text-muted-foreground" data-testid="onboarding-skip">
                Skip tour
              </Button>
              <div className="flex items-center gap-2" aria-hidden="true">
                {STEPS.map((stepDef, idx) => (
                  <span
                    key={stepDef.id}
                    className={`h-2 w-6 rounded-full transition-colors duration-300 ${idx <= clampedIndex ? 'bg-primary' : 'bg-muted-foreground/20'}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {clampedIndex > 0 && (
                  <Button variant="outline" size="sm" onClick={handleBack}>
                    Back
                  </Button>
                )}
                <Button size="sm" onClick={handleNext} data-testid="primary-cta">
                  {activeStep.final ? 'Finish' : 'Next'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

export default OnboardingFlow;
