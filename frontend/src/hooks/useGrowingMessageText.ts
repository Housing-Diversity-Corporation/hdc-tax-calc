import { useState, useEffect, useRef } from 'react';

interface UseGrowingMessageTextOptions {
  text: string;
  speed?: number; // milliseconds per word
  enabled?: boolean; // whether to animate or show full text immediately
}

/**
 * Hook that gradually displays text word by word
 * Similar to a typewriter effect but grows by words instead of characters
 */
export const useGrowingMessageText = ({
  text,
  speed = 120, // Default 120ms per word (slower, more readable)
  enabled = true,
}: UseGrowingMessageTextOptions) => {
  const [displayedText, setDisplayedText] = useState(enabled ? '' : text);
  const [isComplete, setIsComplete] = useState(!enabled);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    // If not enabled, show full text immediately
    if (!enabled) {
      setDisplayedText(text);
      setIsComplete(true);
      return;
    }

    // Reset state when text changes
    setDisplayedText('');
    setIsComplete(false);
    currentIndexRef.current = 0;

    // Split text by spaces (words)
    const words = text.split(' ');

    const showNextWord = () => {
      if (currentIndexRef.current < words.length) {
        const currentWords = words.slice(0, currentIndexRef.current + 1);
        const newText = currentWords.join(' ');
        setDisplayedText(newText);
        currentIndexRef.current += 1;

        // Schedule next word
        timeoutRef.current = setTimeout(showNextWord, speed);
      } else {
        // Animation complete
        setIsComplete(true);
      }
    };

    // Start animation
    timeoutRef.current = setTimeout(showNextWord, speed);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed, enabled]);

  return {
    displayedText,
    isComplete,
  };
};
