/**
 * GradientBackground - Entropic gradient background component
 * Provides consistent gradient background across the app based on theme
 */
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface GradientBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'full' | 'subtle';
}

const GradientBackground: React.FC<GradientBackgroundProps> = ({
  children,
  className = '',
  variant = 'full'
}) => {
  const { isDarkMode } = useTheme();

  const getGradientStyle = () => {
    if (variant === 'subtle') {
      // Very subtle gradient for content areas - concentrated brand color
      return {
        background: 'radial-gradient(ellipse 800px 600px at 15% 20%, var(--gradient-1) 0%, transparent 35%), radial-gradient(ellipse 700px 500px at 85% 80%, var(--gradient-2) 0%, transparent 30%), linear-gradient(180deg, var(--gradient-4) 0%, var(--gradient-3) 100%)'
      };
    }

    // Full entropic gradient - more concentrated and subtle
    return {
      background: 'radial-gradient(ellipse 900px 700px at 18% 25%, var(--gradient-1) 0%, transparent 40%), radial-gradient(ellipse 800px 600px at 82% 75%, var(--gradient-2) 0%, transparent 35%), radial-gradient(ellipse 600px 400px at 50% 95%, var(--gradient-1) 0%, transparent 30%), linear-gradient(180deg, var(--gradient-4) 0%, var(--gradient-3) 60%, var(--gradient-2) 100%)'
    };
  };

  return (
    <div
      className={`w-full min-h-full overflow-auto ${className}`}
      style={getGradientStyle()}
    >
      {children}
    </div>
  );
};

export default GradientBackground;
