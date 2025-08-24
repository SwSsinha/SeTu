import { useEffect, useState } from 'react';

export function OfflineBanner() {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  useEffect(() => {
    function up() { setOnline(true); }
    function down() { setOnline(false); }
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);
  if (online) return null;
  return (
    <div className="w-full bg-amber-600 text-black text-center text-[11px] py-1" role="status" aria-live="polite">
      Offline: some actions disabled until connection returns.
    </div>
  );
}
