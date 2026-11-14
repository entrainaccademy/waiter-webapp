import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Layers,
  Clock,
  User,
  ChefHat,
  Receipt,
  PlusCircle,
  XCircle,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Send,
} from 'lucide-react';
import orderService from '../services/orderService';
import socketService from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import StatusBadge from '../components/StatusBadge';

export const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission, isOnline } = useAuth();
  const { setAppendMode } = useCart();

  const [order, setOrder] = useState(null);
  const [kots, setKots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const canManageOrders = hasPermission('orders:manage');
  const canManageKOT = hasPermission('kot:manage');
  const canCreateBilling = hasPermission('billing:create');

  const fetchOrderDetails = async () => {
    try {
      const res = await orderService.getOrderById(id);
      setOrder(res.order);
      setKots(res.kots || []);
    } catch (err) {
      setError(err.message || 'Order not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();

    const unsubOrder = socketService.on('order:updated', (payload) => {
      if (payload.order?._id === id || payload.orderId === id) {
        fetchOrderDetails();
      }
    });

    const unsubKotCreated = socketService.on('kot:created', (payload) => {
      if (payload.kot?.orderId === id || payload.orderId === id) {
        fetchOrderDetails();
      }
    });

    const unsubKotUpdated = socketService.on('kot:updated', () => fetchOrderDetails());
    const unsubBilled = socketService.on('order:billed', () => fetchOrderDetails());
    const unsubCompleted = socketService.on('order:completed', () => fetchOrderDetails());

    return () => {
      unsubOrder();
      unsubKotCreated();
      unsubKotUpdated();
      unsubBilled();
      unsubCompleted();
    };
  }, [id]);

  // Compute unsubmitted items delta
  const unsubmittedItems = (order?.items || []).filter(
    (item) => item.quantity > (item.submittedQuantity || 0) && item.status !== 'CANCELLED'
  );

  const hasUnsubmittedItems = unsubmittedItems.length > 0;

  // 1. Dispatch KOT to Kitchen
  const handleGenerateKOT = async () => {
    if (!isOnline) {
      setError('Cannot dispatch KOT while offline.');
      return;
    }
    try {
      setActionLoading(true);
      setError('');
      await orderService.generateKOT(id, 'MEDIUM');
      setSuccessMsg('Incremental KOT generated and sent to kitchen!');
      await fetchOrderDetails();
    } catch (err) {
      setError(err.message || 'Failed to generate KOT.');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Request / Generate Bill
  const handleRequestBill = async () => {
    if (!isOnline) {
      setError('Cannot generate bill while offline.');
      return;
    }
    if (!window.confirm('Generate bill and lock this order for counter payment?')) {
      return;
    }
    try {
      setActionLoading(true);
      setError('');
      await orderService.createInvoice(id);
      setSuccessMsg('Bill generated successfully! Order locked for settlement.');
      await fetchOrderDetails();
    } catch (err) {
      setError(err.message || 'Failed to generate invoice.');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Add more items to this order
  const handleAddMoreItems = () => {
    setAppendMode(order, order.tableId);
    navigate('/menu');
  };

  // 4. Cancel Order
  const handleCancelOrder = async () => {
    const reason = window.prompt('Please enter cancellation reason:', 'Guest cancelled');
    if (!reason) return;

    try {
      setActionLoading(true);
      setError('');
      await orderService.cancelOrder(id, reason);
      setSuccessMsg('Order cancelled and table released.');
      await fetchOrderDetails();
    } catch (err) {
      setError(err.message || 'Failed to cancel order.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-100 max-w-lg mx-auto my-12">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center text-slate-400 border border-slate-100 max-w-lg mx-auto my-12 space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="font-bold text-slate-800 text-sm">Order Not Found</h3>
        <p className="text-xs text-slate-400">{error || 'This order does not exist or was removed.'}</p>
        <button
          onClick={() => navigate('/orders')}
          className="text-xs font-bold text-orange-600 underline"
        >
          Return to Orders
        </button>
      </div>
    );
  }

  const tableNum = order.tableId?.tableNumber;
  const isBilledOrCompleted = ['BILLED', 'COMPLETED', 'CANCELLED'].includes(order.status);

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center space-x-1 text-slate-500 hover:text-slate-800 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Orders</span>
        </button>
        <button
          onClick={fetchOrderDetails}
          disabled={actionLoading}
          className="p-2 rounded-xl bg-white border border-slate-200/80 text-slate-600 hover:text-orange-600 shadow-sm active:scale-95 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
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

      {/* Order Header Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-touch space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-base font-black text-slate-800">
                {order.orderNumber}
              </span>
              <StatusBadge status={order.status} />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
              <span className="flex items-center space-x-1 font-bold text-slate-700">
                <Layers className="w-3.5 h-3.5 text-orange-500" />
                <span>{tableNum ? `Table ${tableNum}` : order.orderType}</span>
                {order.tableId?.floor && ` (${order.tableId.floor})`}
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{new Date(order.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Total Amount
            </span>
            <p className="text-xl font-black text-slate-900">
              ₹{Number(order.grandTotal || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {order.createdBy && (
          <div className="pt-2 border-t border-slate-100 flex items-center space-x-1.5 text-[11px] text-slate-400">
            <User className="w-3 h-3" />
            <span>Taken by: {order.createdBy.name || 'Staff'} ({order.createdBy.role})</span>
          </div>
        )}
      </div>

      {/* Unsubmitted Items Warning Banner */}
      {hasUnsubmittedItems && !isBilledOrCompleted && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ChefHat className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-900">
                {unsubmittedItems.length} new item{unsubmittedItems.length > 1 ? 's' : ''} not sent to kitchen!
              </p>
              <p className="text-[11px] text-amber-700">
                Tap Dispatch KOT to notify the chefs.
              </p>
            </div>
          </div>
          {canManageKOT ? (
            <button
              onClick={handleGenerateKOT}
              disabled={actionLoading}
              className="bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-sm shrink-0 flex items-center space-x-1"
            >
              <Send className="w-3 h-3" />
              <span>Send KOT</span>
            </button>
          ) : (
            <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-2 py-1 rounded">
              Requires KOT permission
            </span>
          )}
        </div>
      )}

      {/* Items Breakdown */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-touch space-y-3">
        <h3 className="font-bold text-sm text-slate-800">
          Items Ordered ({order.items?.length || 0})
        </h3>

        <div className="divide-y divide-slate-100">
          {order.items?.map((item, idx) => {
            const isFullySubmitted = (item.submittedQuantity || 0) >= item.quantity;
            return (
              <div key={idx} className="py-2.5 flex items-start justify-between space-x-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-800">
                      {item.name}
                    </h4>
                    {isFullySubmitted ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        KOT Sent
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded animate-pulse">
                        Unsent ({item.quantity - (item.submittedQuantity || 0)})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                    <span>
                      {item.quantity} × ₹{Number(item.price).toFixed(2)}
                    </span>
                    {item.taxRate ? <span>• {item.taxRate}% GST</span> : null}
                  </div>

                  {item.notes && (
                    <p className="text-[11px] text-amber-800 bg-amber-50/80 px-2 py-0.5 rounded inline-block mt-1">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                <p className="font-extrabold text-xs text-slate-900">
                  ₹{Number(item.itemTotal || item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Pricing Subtotals */}
        <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-bold text-slate-700">₹{Number(order.subtotal || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>GST Tax</span>
            <span className="font-bold text-slate-700">₹{Number(order.tax || 0).toFixed(2)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-600 font-bold">
              <span>Discount</span>
              <span>-₹{Number(order.discount || 0).toFixed(2)}</span>
            </div>
          )}
          <div className="pt-1.5 border-t border-slate-100 flex justify-between text-sm font-black text-slate-900">
            <span>Grand Total</span>
            <span className="text-orange-600">₹{Number(order.grandTotal || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* KOT Tickets Section */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-touch space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <ChefHat className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-sm text-slate-800">
              Kitchen Tickets ({kots.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">Incremental KOTs</span>
        </div>

        {kots.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">
            No KOT generated yet. Items waiting to be sent to kitchen.
          </p>
        ) : (
          <div className="space-y-2.5">
            {kots.map((kot) => (
              <div
                key={kot._id}
                className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-slate-800">
                      {kot.kotNumber}
                    </span>
                    <StatusBadge status={kot.kitchenStatus} size="sm" />
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(kot.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  {kot.items?.map((ki, kIdx) => (
                    <div key={kIdx} className="flex justify-between text-slate-700">
                      <span>{ki.quantity}x {ki.name}</span>
                      {ki.notes && <span className="text-amber-700 font-medium">({ki.notes})</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Operational Actions */}
      {!isBilledOrCompleted && (
        <div className="space-y-2 pt-2">
          {/* Add more items */}
          {canManageOrders && (
            <button
              onClick={handleAddMoreItems}
              className="w-full py-3 px-4 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center space-x-1.5 touch-press transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add More Items to this Table</span>
            </button>
          )}

          {/* Request / Generate Bill */}
          {canCreateBilling ? (
            <button
              onClick={handleRequestBill}
              disabled={actionLoading}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-extrabold text-sm rounded-2xl shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 touch-press transition-all"
            >
              <Receipt className="w-4 h-4 text-orange-400" />
              <span>Request Bill / Generate Invoice</span>
            </button>
          ) : (
            <div className="text-center p-2 text-xs text-slate-400">
              Billing generation is handled at the counter.
            </div>
          )}

          {/* Cancel Order */}
          {canManageOrders && (
            <button
              onClick={handleCancelOrder}
              disabled={actionLoading}
              className="w-full py-2.5 px-4 text-rose-600 hover:text-rose-700 font-semibold text-xs flex items-center justify-center space-x-1"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel Order</span>
            </button>
          )}
        </div>
      )}

      {order.status === 'BILLED' && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-center space-y-1">
          <Receipt className="w-6 h-6 text-indigo-600 mx-auto" />
          <h4 className="font-bold text-xs text-indigo-950">Invoice Generated</h4>
          <p className="text-[11px] text-indigo-700">
            Bill has been dispatched to the counter. Table will be released once cashier settles payment.
          </p>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
