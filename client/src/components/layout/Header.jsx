import { ThemeToggle } from './ThemeToggle';

export default function Header() {
  return (
    <header className="border-b px-4 py-3 flex items-center gap-4" role="banner">
      <h1 id="app-title" className="text-lg font-semibold">SeTu</h1>
      <span className="text-xs text-muted-foreground" aria-label="release stage">Beta</span>
      <div className="ml-auto" role="presentation">
        <ThemeToggle />
      </div>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-primary text-primary-foreground px-3 py-1 rounded">Skip to content</a>
    </header>
  );
}

