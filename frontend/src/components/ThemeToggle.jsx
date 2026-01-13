import { Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '../contexts/ThemeContext';

export const ThemeToggle = ({ className = '', variant = 'ghost', size = 'default' }) => {
  const { theme, toggleTheme } = useTheme();

  const baseClasses = "inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-1";
  const sizeClasses = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-10 w-10' : 'h-9 w-9';
  
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleTheme();
      }}
      className={`${baseClasses} ${sizeClasses} ${className}`}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
};

