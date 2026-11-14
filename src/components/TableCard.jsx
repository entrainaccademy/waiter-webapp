import React from 'react';
import { Users, Layers, ArrowRight, PlusCircle, Eye } from 'lucide-react';
import StatusBadge from './StatusBadge';

export const TableCard = ({
  table,
  activeOrder,
  isSelected,
  onSelectTable,
  onViewOrder,
  onAddToOrder,
}) => {
  const isAvailable = table.status === 'AVAILABLE';
  const isOccupied = table.status === 'OCCUPIED';

  return (
    <div
      onClick={() => onSelectTable(table)}
      className={`relative bg-white rounded-2xl p-4 border transition-all cursor-pointer touch-press ${
        isSelected
          ? 'border-orange-500 ring-2 ring-orange-400/30 shadow-md bg-orange-50/20'
          : isOccupied
          ? 'border-orange-100 hover:border-orange-200 shadow-sm'
          : 'border-slate-100 hover:border-slate-200 shadow-touch'
      }`}
    >
      <div className="flex items-start justify-between mb-2.5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-extrabold text-slate-800 tracking-tight">
              {table.tableNumber}
            </span>
            <StatusBadge status={table.status} size="sm" />
          </div>
          <div className="flex items-center space-x-3 text-xs text-slate-400 mt-0.5">
            <span className="flex items-center space-x-1">
              <Layers className="w-3 h-3" />
              <span>{table.floor || 'Floor'}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Users className="w-3 h-3" />
              <span>{table.capacity} Seats</span>
            </span>
          </div>
        </div>
      </div>

      {/* Active Order snippet if occupied */}
      {isOccupied && activeOrder ? (
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 font-mono text-[11px]">
              {activeOrder.orderNumber}
            </span>
            <p className="font-bold text-slate-800">
              ₹{Number(activeOrder.grandTotal || 0).toFixed(2)}
            </p>
          </div>
          <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => onViewOrder(activeOrder._id)}
              className="p-1.5 text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg"
              title="View Order Details"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onAddToOrder(activeOrder, table)}
              className="px-2 py-1 bg-orange-50 text-orange-600 hover:bg-orange-100 font-bold text-[11px] rounded-lg flex items-center space-x-1"
              title="Add more items to order"
            >
              <PlusCircle className="w-3 h-3" />
              <span>Add Items</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">
            {isAvailable ? 'Ready for seating' : 'Status: ' + table.status}
          </span>
          {isAvailable && (
            <span className="text-orange-600 font-bold flex items-center space-x-0.5 text-[11px]">
              <span>Take Order</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default TableCard;
