import { useRef, useEffect, useState } from 'react';
import { useTitleProgress } from './useTitleProgress';

export function useLazyTitleProgress(titleKey: string) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);
  const progressData = useTitleProgress(titleKey, { enabled: false });

  useEffect(() => {
    new IntersectionObserver(
      () => {},
      { rootMargin: '50px', threshold: 0.1 }
    );
  }, []);

  return {
    ...progressData,
    elementRef,
    isVisible,
  };
}