import { useContext } from 'react';
import { ThemeContext } from '../../context/ThemeProvider';
import { Button } from '../ui/button';

export function ThemeToggle() {
  const { theme, toggle } = useContext(ThemeContext);
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={toggle}
      aria-label="Toggle dark mode"
    >
      {theme === 'dark' ? 'Light' : 'Dark'}
    </Button>
  );
}

