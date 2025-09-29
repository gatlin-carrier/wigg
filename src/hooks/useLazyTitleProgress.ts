import { useRef, useEffect, useState } from 'react';
import { useTitleProgress } from './useTitleProgress';

export function useLazyTitleProgress(titleKey: string) {
  const [isVisible, setIsVisible] = useState(false);
  const [element, setElement] = useState<HTMLElement | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);
  const progressData = useTitleProgress(titleKey, { enabled: isVisible });

  // Update elementRef callback to trigger state update
  const setElementRef = (el: HTMLElement | null) => {
    elementRef.current = el;
    setElement(el);
  };

  useEffect(() => {
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { rootMargin: '50px', threshold: 0.1 }
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [element]);

  return {
    ...progressData,
    elementRef: setElementRef,
    isVisible,
  };
}