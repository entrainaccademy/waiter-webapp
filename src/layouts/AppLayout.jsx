import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import OfflineBanner from '../components/OfflineBanner';
import FloatingCartBar from '../components/FloatingCartBar';
import PWAInstallPrompt from '../components/PWAInstallPrompt';
import socketService from '../services/socket';
import { Bell, CheckCircle2 } from 'lucide-react';

export const AppLayout = () => {
  const [kitchenReadyAlert, setKitchenReadyAlert] = useState(null);

  useEffect(() => {
    // Listen for food ready notification from kitchen display
    const unsubscribeReady = socketService.on('kitchen:order-ready', (data) => {
      console.log('🔔 Kitchen marked order ready:', data);
      
      // Mobile vibration
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }

      setKitchenReadyAlert({
        orderNumber: data.orderNumber || 'Order',
        tableNumber: data.tableNumber || '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setKitchenReadyAlert(null);
      }, 6000);
    });

    return () => {
      unsubscribeReady();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <OfflineBanner />
      <PWAInstallPrompt />
      <Navbar />

      {/* Real-time Kitchen Alert Toast */}
      {kitchenReadyAlert && (
        <div className="fixed top-16 left-4 right-4 max-w-md mx-auto z-50 bg-emerald-600 text-white p-3.5 rounded-2xl shadow-float flex items-center justify-between animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                Food Ready for Pickup!
              </p>
              <p className="text-sm font-extrabold">
                {kitchenReadyAlert.orderNumber}{' '}
                {kitchenReadyAlert.tableNumber && `• Table ${kitchenReadyAlert.tableNumber}`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setKitchenReadyAlert(null)}
            className="text-emerald-200 hover:text-white text-xs font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Page Content */}
      <main className="flex-1 pb-28 pt-2 max-w-7xl w-full mx-auto px-4 sm:px-6">
        <Outlet />
      </main>

      <FloatingCartBar />
      <BottomNav />
    </div>
  );
};

export default AppLayout;
