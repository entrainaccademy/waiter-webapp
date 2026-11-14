import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Grid,
  BookOpen,
  ClipboardList,
  ChefHat,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();
  const { totalItems } = useCart();

  const navItems = [
    {
      label: 'Home',
      path: '/',
      icon: LayoutDashboard,
      permission: 'dashboard:view',
    },
    {
      label: 'Tables',
      path: '/tables',
      icon: Grid,
      permission: 'orders:view',
    },
    {
      label: 'Menu',
      path: '/menu',
      icon: BookOpen,
      permission: 'orders:view',
      badge: totalItems > 0 ? totalItems : null,
    },
    {
      label: 'Orders',
      path: '/orders',
      icon: ClipboardList,
      permission: 'orders:view',
    },
    {
      label: 'KOT',
      path: '/kot',
      icon: ChefHat,
      permission: 'kot:view',
    },
  ];

  // Filter based on user permissions
  const visibleItems = navItems.filter((item) =>
    item.permission ? hasPermission(item.permission) : true
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-lg border-t border-slate-100 shadow-lg pb-safe">
      <div className="max-w-md sm:max-w-xl mx-auto flex items-center justify-around px-2 h-16">
        {visibleItems.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1.5 transition-colors touch-press ${
                isActive
                  ? 'text-orange-600 font-bold'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {item.badge ? (
                  <span className="absolute -top-1.5 -right-2.5 bg-orange-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-orange-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
