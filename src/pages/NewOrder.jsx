import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  MessageSquare,
  Layers,
  UtensilsCrossed,
  Send,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import orderService from '../services/orderService';
import tableService from '../services/tableService';
import socketService from '../services/socket';
import ItemNotesModal from '../components/ItemNotesModal';

export const NewOrder = () => {
  const navigate = useNavigate();
  const { hasPermission, isOnline } = useAuth();
  const {
    items,
    selectedTable,
    orderType,
    appendOrderId,
    totalItems,
    subtotal,
    estimatedTax,
    grandTotal,
    selectTable,
    setOrderType,
    updateQuantity,
    updateNotes,
    removeItem,
    clearCart,
  } = useCart();

  const [tables, setTables] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [editingNoteItem, setEditingNoteItem] = useState(null);

  // Fetch tables if not chosen yet & subscribe to live table status changes
  useEffect(() => {
    if (!selectedTable && orderType === 'DINE_IN') {
      tableService
        .getTables()
        .then((data) => setTables(data || []))
        .catch((err) => console.warn('Could not load tables:', err));
    }

    const unsubTableStatus = socketService.on('table:status-updated', (payload) => {
      setTables((prev) =>
        prev.map((t) => (t._id === payload.tableId ? { ...t, status: payload.status } : t))
      );
    });

    const unsubTableReleased = socketService.on('table:released', (payload) => {
      setTables((prev) =>
        prev.map((t) => (t._id === payload.tableId ? { ...t, status: 'AVAILABLE' } : t))
      );
    });

    return () => {
      unsubTableStatus();
      unsubTableReleased();
    };
  }, [selectedTable, orderType]);

  const handleSubmitOrder = async () => {
    if (!isOnline) {
      setError('Cannot submit orders while offline. Please connect to internet.');
      return;
    }

    if (items.length === 0) {
      setError('Please add at least one menu item before placing an order.');
      return;
    }

    if (orderType === 'DINE_IN' && !selectedTable && !appendOrderId) {
      setError('Please select a dining table for Dine-In orders.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      let resultOrder;

      // 1. Appending to existing order
      if (appendOrderId) {
        const idempotencyKey = `add_${appendOrderId}_${Date.now()}`;
        resultOrder = await orderService.addItemsToOrder(appendOrderId, items, idempotencyKey);
        setSuccessMsg('Items added to running order successfully!');
      } else {
        // 2. Creating brand new order
        resultOrder = await orderService.createOrder({
          orderType,
          tableId: orderType === 'DINE_IN' ? selectedTable?._id : undefined,
          items,
          discount: Number(discount) || 0,
        });
        setSuccessMsg(
          orderType === 'TAKEAWAY'
            ? 'Takeaway order placed successfully!'
            : 'Dine-In order placed successfully!'
        );
      }

      // Clear local cart
      clearCart();

      // Navigate to order details
      setTimeout(() => {
        navigate(`/orders/${resultOrder._id}`);
      }, 700);
    } catch (err) {
      setError(err.message || 'Failed to submit order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4 animate-in fade-in">
        <div className="w-16 h-16 rounded-3xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Your Cart is Empty</h3>
          <p className="text-xs text-slate-400 mt-1">
            Browse the menu catalog and add food items to take guest order.
          </p>
        </div>
        <button
          onClick={() => navigate('/menu')}
          className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md active:scale-95 transition-all inline-flex items-center space-x-1.5"
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>Browse Menu Items</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => navigate('/menu')}
          className="flex items-center space-x-1 text-slate-500 hover:text-slate-800 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Menu</span>
        </button>
        <button
          onClick={clearCart}
          className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center space-x-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Cart</span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-2xl flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-2xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Order Context & Table Selection */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-touch space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-800">Order Type</h3>
            <p className="text-[11px] text-slate-400">Choose service type for this order</p>
          </div>
          {appendOrderId && (
            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
              Appending to Running Order
            </span>
          )}
        </div>

        {/* 1. ORDER TYPE SELECTION: 2 options (Dine-In vs Takeaway) */}
        {!appendOrderId ? (
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setOrderType('DINE_IN')}
              className={`p-3 rounded-2xl border text-left transition-all flex items-center space-x-3 cursor-pointer ${
                orderType === 'DINE_IN'
                  ? 'bg-orange-50/80 border-orange-500 shadow-sm ring-1 ring-orange-500/30'
                  : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/70 text-slate-600'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  orderType === 'DINE_IN'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-white text-slate-500 border border-slate-200'
                }`}
              >
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div>
                <p className={`text-xs font-black ${orderType === 'DINE_IN' ? 'text-orange-950' : 'text-slate-800'}`}>
                  Dine-In
                </p>
                <p className={`text-[10px] ${orderType === 'DINE_IN' ? 'text-orange-700/80' : 'text-slate-400'}`}>
                  Serve at table
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setOrderType('TAKEAWAY')}
              className={`p-3 rounded-2xl border text-left transition-all flex items-center space-x-3 cursor-pointer ${
                orderType === 'TAKEAWAY'
                  ? 'bg-blue-50/80 border-blue-500 shadow-sm ring-1 ring-blue-500/30'
                  : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/70 text-slate-600'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  orderType === 'TAKEAWAY'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-500 border border-slate-200'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <p className={`text-xs font-black ${orderType === 'TAKEAWAY' ? 'text-blue-950' : 'text-slate-800'}`}>
                  Takeaway
                </p>
                <p className={`text-[10px] ${orderType === 'TAKEAWAY' ? 'text-blue-700/80' : 'text-slate-400'}`}>
                  Pack for pickup
                </p>
              </div>
            </button>
          </div>
        ) : (
          <div className="pt-1">
            <span className="text-xs font-black text-slate-800 bg-slate-100 px-3 py-1.5 rounded-xl inline-block">
              {orderType === 'TAKEAWAY' ? 'Takeaway Order' : 'Dine-In Order'}
            </span>
          </div>
        )}

        {/* 2. DINE-IN WORKFLOW: Table Selector */}
        {orderType === 'DINE_IN' && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-bold text-slate-700">Dining Table</span>
              </div>

              {selectedTable && !appendOrderId && (
                <button
                  type="button"
                  onClick={() => navigate('/tables')}
                  className="text-xs text-orange-600 font-bold hover:underline"
                >
                  Change Table
                </button>
              )}
            </div>

            {selectedTable ? (
              <div className="bg-orange-50/60 border border-orange-200/80 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-extrabold text-orange-950 block">
                    Table {selectedTable.tableNumber}
                  </span>
                  <span className="text-[10px] text-orange-700/80">
                    {selectedTable.floor || 'Floor'} • {selectedTable.capacity ? `${selectedTable.capacity} Seats` : 'Standard'}
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-200/70 text-orange-800 px-2 py-0.5 rounded-full">
                  Assigned
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <select
                  onChange={(e) => {
                    const t = tables.find((tbl) => tbl._id === e.target.value);
                    if (t) selectTable(t);
                  }}
                  defaultValue=""
                  className="w-full text-xs py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="" disabled>
                    Choose an available table...
                  </option>
                  {tables
                    .filter((t) => t.status === 'AVAILABLE')
                    .map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.tableNumber} - {t.floor} ({t.capacity} Seats)
                      </option>
                    ))}
                </select>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => navigate('/tables')}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 inline-flex items-center space-x-1"
                  >
                    <span>Or select from interactive table floor map</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. TAKEAWAY WORKFLOW: Banner (No table required) */}
        {orderType === 'TAKEAWAY' && (
          <div className="pt-3 border-t border-slate-100">
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-950">
                  Takeaway Order
                </p>
                <p className="text-[10px] text-blue-700/80">
                  No table required. Items will be packed for takeaway pickup.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cart Items List */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-touch space-y-3">
        <h3 className="font-bold text-sm text-slate-800">
          Order Items ({totalItems})
        </h3>

        <div className="divide-y divide-slate-100">
          {items.map((item) => (
            <div key={item.menuItemId} className="py-3 flex items-start justify-between space-x-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span
                    className={`w-3 h-3 rounded-sm border flex items-center justify-center shrink-0 ${
                      item.isVegetarian ? 'border-emerald-600' : 'border-rose-600'
                    }`}
                  >
                    <span
                      className={`w-1 h-1 rounded-full ${
                        item.isVegetarian ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    />
                  </span>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-800 truncate">
                    {item.name}
                  </h4>
                </div>

                <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                  <span>₹{Number(item.price).toFixed(2)} each</span>
                  {item.taxRate ? <span>• {item.taxRate}% GST</span> : null}
                </div>

                {item.notes ? (
                  <div
                    onClick={() => setEditingNoteItem(item)}
                    className="mt-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block cursor-pointer hover:bg-amber-100"
                  >
                    "{item.notes}"
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingNoteItem(item)}
                    className="mt-1 text-[10px] text-slate-400 hover:text-orange-600 flex items-center space-x-1 font-semibold"
                  >
                    <MessageSquare className="w-2.5 h-2.5" />
                    <span>Add special instruction</span>
                  </button>
                )}
              </div>

              {/* Quantity Stepper & Subtotal */}
              <div className="flex flex-col items-end space-y-1 shrink-0">
                <div className="flex items-center bg-slate-100 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                    className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 active:bg-slate-300"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center text-xs font-extrabold text-slate-800 font-mono">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 active:bg-slate-300"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="font-bold text-xs text-slate-900">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary & Pricing */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-touch space-y-2.5">
        <h3 className="font-bold text-sm text-slate-800 mb-2">Billing Summary</h3>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Subtotal</span>
          <span className="font-bold text-slate-800">₹{subtotal.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Estimated GST Tax</span>
          <span className="font-bold text-slate-800">₹{estimatedTax.toFixed(2)}</span>
        </div>

        {!appendOrderId && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Special Discount (₹)</span>
            <input
              type="number"
              min="0"
              max={subtotal}
              value={discount}
              onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
              className="w-20 text-right text-xs py-1 px-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-sm font-black text-slate-900">Grand Total</span>
          <span className="text-lg font-black text-orange-600">
            ₹{Math.max(0, grandTotal - (Number(discount) || 0)).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Submission Button */}
      <div className="pt-2">
        <button
          type="button"
          disabled={submitting}
          onClick={handleSubmitOrder}
          className="w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-extrabold text-sm rounded-2xl shadow-float flex items-center justify-center space-x-2 disabled:opacity-50 touch-press transition-all cursor-pointer"
        >
          {submitting ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>
                {appendOrderId
                  ? 'Add Items to Order'
                  : orderType === 'TAKEAWAY'
                  ? 'Submit Takeaway Order'
                  : 'Submit Dine-In Order'}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Instruction Modal for Cart Item */}
      {editingNoteItem && (
        <ItemNotesModal
          isOpen={Boolean(editingNoteItem)}
          onClose={() => setEditingNoteItem(null)}
          itemName={editingNoteItem.name}
          initialNotes={editingNoteItem.notes}
          onSave={(newNotes) => {
            updateNotes(editingNoteItem.menuItemId, newNotes);
            setEditingNoteItem(null);
          }}
        />
      )}
    </div>
  );
};

export default NewOrder;
