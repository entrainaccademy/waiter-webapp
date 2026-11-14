import React from 'react';

const statusStyles = {
  // Tables
  AVAILABLE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  OCCUPIED: 'bg-orange-50 text-orange-700 border-orange-200',
  RESERVED: 'bg-amber-50 text-amber-700 border-amber-200',
  OUT_OF_SERVICE: 'bg-slate-100 text-slate-500 border-slate-200',

  // Orders
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
  PREPARING: 'bg-purple-50 text-purple-700 border-purple-200',
  READY: 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse',
  SERVED: 'bg-teal-50 text-teal-700 border-teal-200',
  BILLED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  COMPLETED: 'bg-slate-100 text-slate-700 border-slate-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',

  // KOT Kitchen Status
  ACCEPTED: 'bg-blue-50 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-purple-50 text-purple-700 border-purple-200',
};

const statusLabels = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  RESERVED: 'Reserved',
  OUT_OF_SERVICE: 'Out of Service',

  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  READY: 'Food Ready',
  SERVED: 'Served',
  BILLED: 'Billed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',

  ACCEPTED: 'Accepted',
  IN_PROGRESS: 'Cooking',
};

export const StatusBadge = ({ status, size = 'md', className = '' }) => {
  const normalized = (status || '').toUpperCase();
  const style = statusStyles[normalized] || 'bg-slate-100 text-slate-600 border-slate-200';
  const label = statusLabels[normalized] || status;

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center rounded-full border ${style} ${sizeClass} tracking-wide transition-colors ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {label}
    </span>
  );
};

export default StatusBadge;
