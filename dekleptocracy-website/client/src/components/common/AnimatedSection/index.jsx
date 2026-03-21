import { useRef, useEffect, useState } from 'react';
import './AnimatedSection.css';

/**
 * useInView - Hook to detect when element enters viewport
 * Uses IntersectionObserver for performant scroll detection.
 * @param {Object} [options] - IntersectionObserver options
 * @param {number} [options.threshold=0.1] - Visibility threshold (0-1)
 * @param {string} [options.rootMargin='0px'] - Root margin for observer
 * @returns {[React.RefObject, boolean]} Ref to attach and inView boolean
 */
export const useInView = (options = {}) => {
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(element);
        }
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '0px',
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options.threshold, options.rootMargin]);

  return [ref, inView];
};

/**
 * AnimatedSection - Wrapper that animates children when scrolled into view
 * Supports multiple animation types with configurable timing.
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to animate
 * @param {'fade-up'|'fade-in'|'slide-left'|'slide-right'} [props.animation='fade-up'] - Animation type
 * @param {number} [props.delay=0] - Animation delay in milliseconds
 * @param {number} [props.duration=600] - Animation duration in milliseconds
 * @param {number} [props.threshold=0.1] - Visibility threshold to trigger (0-1)
 * @param {string} [props.className=''] - Additional CSS classes
 * @returns {JSX.Element}
 */
export const AnimatedSection = ({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 600,
  threshold = 0.1,
  className = '',
}) => {
  const [ref, inView] = useInView({ threshold });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (inView) {
      const timer = setTimeout(() => setIsVisible(true), delay);
      return () => clearTimeout(timer);
    }
  }, [inView, delay]);

  const animationClasses = `animated-section ${animation} ${isVisible ? 'visible' : ''} ${className}`;

  const style = {
    '--animation-duration': `${duration}ms`,
    '--animation-delay': `${delay}ms`,
  };

  return (
    <div ref={ref} className={animationClasses} style={style}>
      {children}
    </div>
  );
};

export default AnimatedSection;
