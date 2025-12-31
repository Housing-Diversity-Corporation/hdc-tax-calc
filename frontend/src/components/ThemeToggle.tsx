import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <Button
      onClick={toggleTheme}
      variant="ghost"
      size="icon"
      className="w-12 h-12"
    >
      {isDarkMode ? (
        <Sun className="w-8 h-8" />
      ) : (
        <Moon className="w-8 h-8" />
      )}
    </Button>
  );
};

export default ThemeToggle;
