import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const ONBOARDING_STORAGE_KEY = 'wigg:onboarding:state';
const ONBOARDING_VERSION = 1;

type OnboardingState = {
  version: number;
  completed: boolean;
  step: number;
  skipped?: boolean;
  completedAt?: string;
  updatedAt?: string;
};

const DEFAULT_STATE: OnboardingState = {
  version: ONBOARDING_VERSION,
  completed: false,
  step: 0,
};

function readState(): OnboardingState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as OnboardingState;
    if (!parsed || typeof parsed !== 'object') return DEFAULT_STATE;
    if (parsed.version !== ONBOARDING_VERSION) {
      return { ...DEFAULT_STATE, version: ONBOARDING_VERSION };
    }
    return {
      ...DEFAULT_STATE,
      ...parsed,
      version: ONBOARDING_VERSION,
      step: typeof parsed.step === 'number' ? parsed.step : 0,
      completed: Boolean(parsed.completed),
      skipped: Boolean(parsed.skipped),
    };
  } catch (error) {
    console.warn('[Onboarding] Failed to parse onboarding state', error);
    return DEFAULT_STATE;
  }
}

interface OnboardingContextValue {
  isActive: boolean;
  step: number;
  completed: boolean;
  skipped: boolean;
  start: () => void;
  complete: () => void;
  skip: () => void;
  setStep: (next: number) => void;
  state: OnboardingState;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const initialRef = useRef<OnboardingState | null>(null);
  if (!initialRef.current) {
    initialRef.current = readState();
  }
  const [state, setState] = useState<OnboardingState>(initialRef.current);
  const [isActive, setIsActive] = useState<boolean>(() => !initialRef.current?.completed);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('[Onboarding] Unable to persist onboarding state', error);
    }
  }, [state]);

  useEffect(() => {
    if (state.completed) {
      setIsActive(false);
    }
  }, [state.completed]);

  const setStep = useCallback((next: number) => {
    setState((prev) => {
      const clamped = Math.max(0, Math.trunc(next));
      if (clamped === prev.step) return prev;
      return {
        ...prev,
        step: clamped,
        updatedAt: new Date().toISOString(),
        version: ONBOARDING_VERSION,
      };
    });
  }, []);

  const start = useCallback(() => {
    setState((prev) => ({
      ...DEFAULT_STATE,
      version: ONBOARDING_VERSION,
      completed: false,
      skipped: false,
      updatedAt: new Date().toISOString(),
    }));
    setIsActive(true);
  }, []);

  const complete = useCallback(() => {
    setState((prev) => ({
      ...prev,
      completed: true,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: ONBOARDING_VERSION,
    }));
    setIsActive(false);
  }, []);

  const skip = useCallback(() => {
    setState((prev) => ({
      ...prev,
      completed: true,
      skipped: true,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: ONBOARDING_VERSION,
    }));
    setIsActive(false);
  }, []);

  const value = useMemo<OnboardingContextValue>(() => ({
    isActive,
    step: state.step,
    completed: state.completed,
    skipped: Boolean(state.skipped),
    start,
    complete,
    skip,
    setStep,
    state,
  }), [isActive, state.step, state.completed, state.skipped, start, complete, skip, setStep, state]);

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return ctx;
}
