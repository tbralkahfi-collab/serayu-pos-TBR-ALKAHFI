import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const BANNER_DISMISSED_KEY = 'install-banner-dismissed';

export function InstallBanner() {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Only show on mobile, not in standalone, and not dismissed
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    const isDismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
    const isMobile = window.innerWidth < 768;

    if (isMobile && !isStandalone && !isDismissed) {
      // Delay to not annoy on first load
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] p-3 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-primary text-primary-foreground rounded-xl p-3 shadow-lg flex items-center gap-3 max-w-lg mx-auto">
        <Download className="w-6 h-6 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Install Serayu POS</p>
          <p className="text-xs opacity-80">Akses lebih cepat dari home screen</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="flex-shrink-0 text-xs h-8"
          onClick={() => {
            dismiss();
            navigate('/install-app');
          }}
        >
          Install
        </Button>
        <button onClick={dismiss} className="p-1 opacity-70 hover:opacity-100 flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
