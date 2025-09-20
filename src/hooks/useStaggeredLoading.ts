import { useEffect, useState } from 'react';

export function useStaggeredLoading<T>(items: T[], delay = 200): T[] {
  const [visibleItems, setVisibleItems] = useState<T[]>(items.length > 0 ? [items[0]] : []);

  useEffect(() => {
    if (items.length <= 1) return;
    const timeouts: Array<ReturnType<typeof setTimeout>> = [];

    for (let index = 1; index < items.length; index += 1) {
      const timeout = setTimeout(() => {
        setVisibleItems((current) => {
          if (current.length >= index + 1) return current;
          return [...current, items[index]];
        });
      }, delay * index);
      timeouts.push(timeout);
    }

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [items, delay]);

  return visibleItems;
}
