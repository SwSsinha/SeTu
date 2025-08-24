import Header from './Header';
import Footer from './Footer';
import { ErrorBoundary } from '../system/ErrorBoundary';
import { OfflineBanner } from '../system/OfflineBanner';

// Base layout shell – will evolve with navigation, side panels, etc.
export default function Layout({ children }) {
  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground" data-app-root>
      <OfflineBanner />
      <Header />
      <ErrorBoundary>
        <main className="flex-1 container mx-auto w-full max-w-5xl px-4 py-6" id="main-content" role="main" aria-labelledby="app-title">
          {children}
        </main>
      </ErrorBoundary>
      <Footer />
    </div>
  );
}
