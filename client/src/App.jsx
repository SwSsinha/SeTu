import Layout from './components/layout/Layout';
import { ThemeProvider } from './context/ThemeProvider';
import SingleProcessForm from './components/process/SingleProcessForm';
import { HistoryList } from './components/history/HistoryList';
import { useSingleProcessState } from './hooks/useSingleProcessState';

// App with base layout shell (Step 1.2) – static placeholders only.
export default function App() {
  // Provide a top-level instance of the hook so history list can access combined state
  const state = useSingleProcessState();
  return (
    <ThemeProvider>
      <Layout>
        <div className="grid gap-8 md:grid-cols-[1fr_300px] items-start">
          <div className="space-y-6">
            <SingleProcessForm externalState={state} />
          </div>
          <div className="space-y-6">
            <HistoryList history={state.history} setHistory={state.setHistory} onSelect={() => {}} />
          </div>
        </div>
      </Layout>
    </ThemeProvider>
  );
}
