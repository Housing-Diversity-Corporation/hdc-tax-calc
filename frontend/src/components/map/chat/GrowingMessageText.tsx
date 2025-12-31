import React from 'react';
import { useGrowingMessageText } from '@/hooks/useGrowingMessageText';

interface GrowingMessageTextProps {
  text: string;
  speed?: number;
  enabled?: boolean;
  className?: string;
}

/**
 * Component that displays text with a word-by-word growing animation
 * Used for chat messages to create a natural conversation feel
 */
export const GrowingMessageText: React.FC<GrowingMessageTextProps> = ({
  text,
  speed = 120,
  enabled = true,
  className = '',
}) => {
  const { displayedText } = useGrowingMessageText({
    text,
    speed,
    enabled,
  });

  return (
    <p className={className}>
      {displayedText}
    </p>
  );
};
