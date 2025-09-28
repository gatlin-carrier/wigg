import { useRef, useEffect, useState } from 'react';
import { useTitleProgress } from './useTitleProgress';

export function useLazyTitleProgress(titleKey: string) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);
  const progressData = useTitleProgress(titleKey, { enabled: false });

  useEffect(() => {
    if (!elementRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { rootMargin: '50px', threshold: 0.1 }
    );
    observer.observe(elementRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  return {
    ...progressData,
    elementRef,
    isVisible,
  };
}