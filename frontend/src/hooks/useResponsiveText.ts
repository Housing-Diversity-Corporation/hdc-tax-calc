import { useState, useEffect, useRef } from 'react';

interface ResponsiveTextOptions {
  minFontSize?: number;
  maxFontSize?: number;
  truncateThreshold?: number;
}

export const useResponsiveText = (
  text: string,
  containerWidth: number,
  options: ResponsiveTextOptions = {}
) => {
  const {
    minFontSize = 10,
    maxFontSize = 14,
    truncateThreshold = 0.95,
  } = options;

  const [displayText, setDisplayText] = useState(text);
  const [fontSize, setFontSize] = useState(maxFontSize);

  // Track previous values to prevent unnecessary updates
  const prevValuesRef = useRef({ text, containerWidth, displayText, fontSize });

  useEffect(() => {
    // Skip if text or width hasn't changed meaningfully
    if (!text || containerWidth === 0) return;

    const prev = prevValuesRef.current;
    if (prev.text === text && Math.abs(prev.containerWidth - containerWidth) < 2) {
      // Width change is negligible (less than 2px), skip update
      return;
    }

    // Calculate approximate character width at maxFontSize (not current fontSize to avoid loops)
    const charWidth = maxFontSize * 0.6;
    const maxChars = Math.floor((containerWidth * truncateThreshold) / charWidth);

    let newDisplayText = text;
    let newFontSize = maxFontSize;

    if (text.length <= maxChars) {
      newDisplayText = text;
      newFontSize = maxFontSize;
    } else {
      // Try reducing font size first
      const reducedFontSize = Math.max(minFontSize, maxFontSize - 2);
      const reducedCharWidth = reducedFontSize * 0.6;
      const reducedMaxChars = Math.floor((containerWidth * truncateThreshold) / reducedCharWidth);

      if (text.length <= reducedMaxChars && reducedFontSize >= minFontSize) {
        newDisplayText = text;
        newFontSize = reducedFontSize;
      } else {
        // If still too long, truncate intelligently
        newFontSize = reducedFontSize;

        // Try to truncate at word boundaries
        const words = text.split(' ');
        let truncated = '';

        for (let i = 0; i < words.length; i++) {
          const testText = truncated + (truncated ? ' ' : '') + words[i];
          if (testText.length + 4 <= reducedMaxChars) { // +4 for " ..."
            truncated = testText;
          } else {
            break;
          }
        }

        // If we couldn't fit any words, just truncate by characters
        if (truncated.length === 0) {
          truncated = text.substring(0, Math.max(0, reducedMaxChars - 4));
        }

        newDisplayText = truncated + ' ...';
      }
    }

    // Only update state if values actually changed
    if (newDisplayText !== prev.displayText) {
      setDisplayText(newDisplayText);
    }
    if (newFontSize !== prev.fontSize) {
      setFontSize(newFontSize);
    }

    // Update ref with current values
    prevValuesRef.current = { text, containerWidth, displayText: newDisplayText, fontSize: newFontSize };
  }, [text, containerWidth, minFontSize, maxFontSize, truncateThreshold]);

  return { displayText, fontSize };
};

export const useContainerWidth = <T extends HTMLElement>() => {
  const [width, setWidth] = useState(0);
  const ref = useRef<T>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;

    const updateWidth = (newWidth: number) => {
      setWidth((prevWidth) => {
        // Use a smaller threshold for better responsiveness
        if (Math.abs(prevWidth - newWidth) > 0.5) {
          return Math.round(newWidth);
        }
        return prevWidth;
      });
    };

    const resizeObserver = new ResizeObserver((entries) => {
      // Cancel any pending updates
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Use requestAnimationFrame for smoother updates during active resizing
      animationFrameRef.current = requestAnimationFrame(() => {
        for (const entry of entries) {
          const newWidth = entry.contentRect.width;
          updateWidth(newWidth);
        }
      });
    });

    resizeObserver.observe(element);

    // Set initial width
    const initialWidth = element.offsetWidth;
    if (initialWidth > 0) {
      setWidth(initialWidth);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      resizeObserver.disconnect();
    };
  }, []);

  return { ref, width };
};
