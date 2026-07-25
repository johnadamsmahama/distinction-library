'use client';

import { useEffect, useState } from 'react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setVisible(false);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!visible) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  return (
    <div className="bg-navy rounded-2xl p-4 mb-6 flex items-center justify-between gap-3">
      <div>
        <div className="font-condensed font-bold text-sm text-white">
          Install Distinction Library
        </div>
        <p className="font-body text-xs text-white/70 mt-0.5">
          Add it to your home screen for quick, app-like access.
        </p>
      </div>
      <button
        onClick={handleInstall}
        className="flex-shrink-0 bg-gold text-navy font-condensed font-bold text-xs uppercase px-4 py-2.5 rounded-lg hover:bg-gold-light transition-colors"
      >
        Install
      </button>
    </div>
  );
}