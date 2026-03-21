import { useState, useEffect, useRef } from 'react';

/**
 * LazySection - renders children only when user scrolls within rootMargin.
 * Uses IntersectionObserver and disconnects after first intersection.
 */
export default function LazySection({ children, fallback = null, rootMargin = '200px' }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref}>
      {isVisible ? children : fallback}
    </div>
  );
}
