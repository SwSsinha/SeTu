import Layout from './components/layout/Layout';
import SingleProcessForm from './components/process/SingleProcessForm';

// App with base layout shell (Step 1.2) – static placeholders only.
export default function App() {
  return (
    <Layout>
      <div className="space-y-6">
        <SingleProcessForm />
      </div>
    </Layout>
  );
}
