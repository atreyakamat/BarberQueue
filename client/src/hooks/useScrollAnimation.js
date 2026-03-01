import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook that detects when an element enters the viewport
 * and triggers animation classes
 */
export function useInView(options = {}) {
  const { threshold = 0.15, triggerOnce = true, rootMargin = '0px 0px -50px 0px' } = options;
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, triggerOnce, rootMargin]);

  return [ref, isInView];
}

/**
 * Hook for staggered children animations
 */
export function useStaggerAnimation(itemCount, baseDelay = 100) {
  const [ref, isInView] = useInView({ threshold: 0.1 });
  
  const getDelay = useCallback(
    (index) => `${index * baseDelay}ms`,
    [baseDelay]
  );

  return { ref, isInView, getDelay };
}

/**
 * Hook for animated counter
 */
export function useCountUp(end, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const [ref, isInView] = useInView({ triggerOnce: true });
  const hasStarted = useRef(false);

  useEffect(() => {
    if (startOnView && !isInView) return;
    if (hasStarted.current) return;
    hasStarted.current = true;

    let startTime;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [end, duration, isInView, startOnView]);

  return [ref, count];
}
