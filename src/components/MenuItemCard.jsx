import React, { useState } from 'react';
import { Plus, Minus, MessageSquare } from 'lucide-react';
import ItemNotesModal from './ItemNotesModal';

export const MenuItemCard = ({
  item,
  cartItem,
  onAddToCart,
  onUpdateQuantity,
  onUpdateNotes,
}) => {
  const [showNotesModal, setShowNotesModal] = useState(false);

  const quantity = cartItem?.quantity || 0;
  const notes = cartItem?.notes || '';
  const isAvailable = item.availability !== false;

  return (
    <>
      <div
        className={`bg-white rounded-2xl p-3.5 border transition-all ${
          quantity > 0
            ? 'border-orange-300 shadow-md ring-1 ring-orange-200'
            : 'border-slate-100 shadow-touch hover:border-slate-200'
        } ${!isAvailable ? 'opacity-60 bg-slate-50' : ''}`}
      >
        <div className="flex items-start justify-between space-x-2">
          {/* Left Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1.5 mb-1">
              {/* Veg / Non-Veg Icon */}
              <span
                className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
                  item.isVegetarian
                    ? 'border-emerald-600'
                    : 'border-rose-600'
                }`}
                title={item.isVegetarian ? 'Vegetarian' : 'Non-Vegetarian'}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    item.isVegetarian ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                />
              </span>
              <h4 className="font-bold text-sm text-slate-800 truncate">{item.name}</h4>
            </div>

            <p className="text-xs text-slate-500 line-clamp-1 mb-2">
              {item.description || 'Delicious freshly prepared dish'}
            </p>

            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm text-slate-900">
                ₹{Number(item.price).toFixed(2)}
              </span>
              {item.taxRate ? (
                <span className="text-[10px] text-slate-400 font-medium">
                  +{item.taxRate}% GST
                </span>
              ) : null}
            </div>

            {/* Note indicator badge if set */}
            {notes ? (
              <div
                onClick={() => setShowNotesModal(true)}
                className="mt-2 inline-flex items-center space-x-1 bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-md text-[11px] font-medium cursor-pointer hover:bg-amber-100"
              >
                <MessageSquare className="w-3 h-3 text-amber-600" />
                <span className="truncate max-w-[150px]">"{notes}"</span>
              </div>
            ) : null}
          </div>

          {/* Right Action: Quantity Stepper or Add button */}
          <div className="shrink-0 flex flex-col items-end justify-between space-y-2">
            {!isAvailable ? (
              <span className="text-[11px] font-bold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                Sold Out
              </span>
            ) : quantity === 0 ? (
              <button
                type="button"
                onClick={() => onAddToCart(item)}
                className="bg-orange-50 hover:bg-orange-100 active:scale-95 text-orange-600 border border-orange-200/80 font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-sm flex items-center space-x-1 transition-all touch-press"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ADD</span>
              </button>
            ) : (
              <div className="flex flex-col items-end space-y-1.5">
                <div className="flex items-center bg-orange-600 text-white rounded-xl shadow-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item._id, quantity - 1)}
                    className="w-7 h-7 flex items-center justify-center hover:bg-orange-700 active:bg-orange-800 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold font-mono">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item._id, quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center hover:bg-orange-700 active:bg-orange-800 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowNotesModal(true)}
                  className="text-[10px] text-slate-500 hover:text-orange-600 flex items-center space-x-1 font-semibold underline underline-offset-2"
                >
                  <MessageSquare className="w-2.5 h-2.5" />
                  <span>{notes ? 'Edit note' : 'Add note'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ItemNotesModal
        isOpen={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        itemName={item.name}
        initialNotes={notes}
        onSave={(newNotes) => onUpdateNotes(item._id, newNotes)}
      />
    </>
  );
};

export default MenuItemCard;
