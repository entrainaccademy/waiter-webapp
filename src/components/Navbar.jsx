import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Wifi, WifiOff, User, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export const Navbar = () => {
  const navigate = useNavigate();
  const { user, isOnline, socketConnected } = useAuth();
  const { selectedTable, clearTable } = useCart();

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CASHIER':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'WAITER':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'KITCHEN_STAFF':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand / Logo */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center space-x-2.5 cursor-pointer select-none"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-600 to-orange-400 flex items-center justify-center text-white shadow-sm">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-sm tracking-tight text-slate-800">
                {user?.restaurantName || 'Food Order'}
              </span>
              <span className="inline-flex items-center">
                {socketConnected ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Realtime Sync Connected" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-400" title="Reconnecting socket..." />
                )}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium -mt-0.5">Staff Mobile POS</p>
          </div>
        </div>

        {/* Center / Table context */}
        {selectedTable ? (
          <div className="flex items-center space-x-1.5 bg-orange-50 border border-orange-200 text-orange-800 px-2.5 py-1 rounded-full text-xs font-semibold">
            <Layers className="w-3.5 h-3.5 text-orange-600" />
            <span>Table {selectedTable.tableNumber}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearTable();
              }}
              className="text-orange-400 hover:text-orange-700 ml-1 font-bold text-xs"
              title="Clear table selection"
            >
              ×
            </button>
          </div>
        ) : null}

        {/* Right: Staff Role & Profile */}
        <div className="flex items-center space-x-2">
          {user ? (
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center space-x-1.5 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors"
            >
              <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold">
                {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
              </div>
              <div className="hidden sm:block text-left text-xs">
                <span className="font-semibold text-slate-700 block truncate max-w-[100px]">
                  {user.name}
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${getRoleBadgeColor(
                  user.role
                )}`}
              >
                {user.role}
              </span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 px-3 py-1.5 rounded-lg border border-orange-200"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
