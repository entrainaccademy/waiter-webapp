import React from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const OfflineBanner = () => {
  const { isOnline, socketConnected } = useAuth();

  if (isOnline && socketConnected) {
    return null;
  }

  if (!isOnline) {
    return (
      <div className="bg-rose-600 text-white px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-between shadow-md sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <WifiOff className="w-4 h-4 animate-bounce shrink-0" />
          <span>You are currently offline. Orders cannot be submitted until connection is restored.</span>
        </div>
        <span className="bg-rose-700 px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider">
          Offline
        </span>
      </div>
    );
  }

  // Online but socket connecting/disconnected
  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-1.5 text-xs font-medium flex items-center justify-between shadow-sm sticky top-0 z-50">
      <div className="flex items-center space-x-2">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        <span>Connecting to live restaurant kitchen sync...</span>
      </div>
      <span className="bg-amber-600/30 text-amber-950 px-1.5 py-0.5 rounded text-[10px] font-mono">
        Reconnecting
      </span>
    </div>
  );
};

export default OfflineBanner;
