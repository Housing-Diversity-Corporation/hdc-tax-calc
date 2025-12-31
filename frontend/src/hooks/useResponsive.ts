import { useState, useEffect } from 'react';

interface BreakpointConfig {
  mobile: number;
  tablet: number;
  desktop: number;
}

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

const defaultBreakpoints: BreakpointConfig = {
  mobile: 768,  // Matches navbar hamburger breakpoint
  tablet: 1024,
  desktop: 1200
};

export const useResponsive = (breakpoints: BreakpointConfig = defaultBreakpoints): ResponsiveState => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    const THRESHOLD = 10; // Ignore size changes smaller than 10px
    const DEBOUNCE_MS = 250; // Wait 250ms after resize stops (increased from 100ms)

    const handleResize = () => {
      // Debounce resize events to reduce re-renders
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;

        // Only update if change exceeds threshold
        const widthDiff = Math.abs(newWidth - windowSize.width);
        const heightDiff = Math.abs(newHeight - windowSize.height);

        if (widthDiff > THRESHOLD || heightDiff > THRESHOLD) {
          setWindowSize({
            width: newWidth,
            height: newHeight,
          });
        }
      }, DEBOUNCE_MS);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [windowSize.width, windowSize.height]); // Add dependencies to access current values

  // Calculate breakpoint state based on current width
  const isMobile = windowSize.width <= breakpoints.mobile;
  const isTablet = windowSize.width > breakpoints.mobile && windowSize.width <= breakpoints.tablet;
  const isDesktop = windowSize.width > breakpoints.tablet;

  return {
    isMobile,
    isTablet,
    isDesktop,
    width: windowSize.width,
    height: windowSize.height,
  };
};