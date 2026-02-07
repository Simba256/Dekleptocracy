import { useRef, useEffect, useState } from 'react';
import './AnimatedSection.css';

export const useInView = (options = {}) => {
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.unobserve(element);
      }
    }, {
      threshold: options.threshold || 0.1,
      rootMargin: options.rootMargin || '0px'
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options.threshold, options.rootMargin]);

  return [ref, inView];
};

export const AnimatedSection = ({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 600,
  threshold = 0.1,
  className = ''
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
    '--animation-delay': `${delay}ms`
  };

  return (
    <div
      ref={ref}
      className={animationClasses}
      style={style}
    >
      {children}
    </div>
  );
};

export default AnimatedSection;
