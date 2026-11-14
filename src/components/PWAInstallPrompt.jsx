import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Don't show if user previously dismissed in this session
      if (!sessionStorage.getItem('pwa_prompt_dismissed')) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed top-14 left-3 right-3 sm:left-auto sm:right-4 sm:w-96 z-40 bg-white border border-orange-200 rounded-2xl shadow-float p-3.5 flex items-center justify-between space-x-3 transition-all animate-in fade-in slide-in-from-top-4">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shrink-0 shadow-sm">
          <Download className="w-5 h-5" />
        </div>
        <div className="text-left">
          <p className="text-xs font-bold text-slate-800">Install Staff Ordering App</p>
          <p className="text-[11px] text-slate-500">Add to Home Screen for fast offline access</p>
        </div>
      </div>
      <div className="flex items-center space-x-1.5 shrink-0">
        <button
          onClick={handleInstallClick}
          className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
