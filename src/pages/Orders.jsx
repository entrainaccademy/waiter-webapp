import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Search,
  RefreshCw,
  Clock,
  Layers,
  ArrowRight,
  Filter,
  ShoppingBag,
  UtensilsCrossed,
} from 'lucide-react';
import orderService from '../services/orderService';
import socketService from '../services/socket';
import StatusBadge from '../components/StatusBadge';

export const Orders = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL'); // ALL, DINE_IN, TAKEAWAY

  const fetchOrders = async () => {
    try {
      const result = await orderService.getOrders({ limit: 50 });
      setOrders(result.orders || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const unsubCreated = socketService.on('order:created', () => fetchOrders());
    const unsubUpdated = socketService.on('order:updated', () => fetchOrders());
    const unsubCompleted = socketService.on('order:completed', () => fetchOrders());
    const unsubCancelled = socketService.on('order:cancelled', () => fetchOrders());
    const unsubBilled = socketService.on('order:billed', () => fetchOrders());

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubCompleted();
      unsubCancelled();
      unsubBilled();
    };
  }, []);
  
  const statuses = [
    'ALL',
    'CONFIRMED',
    'PREPARING',
    'READY',
    'SERVED',
    'BILLED',
    'COMPLETED',
    'CANCELLED',
  ];

  const filteredOrders = orders.filter((ord) => {
    const tableNum = ord.tableId?.tableNumber || '';
    const matchesSearch =
      ord.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      tableNum.toLowerCase().includes(search.toLowerCase()) ||
      (ord.orderType && ord.orderType.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = selectedStatus === 'ALL' || ord.status === selectedStatus;
    const matchesType = selectedType === 'ALL' || ord.orderType === selectedType;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            Order History
          </h2>
          <p className="text-xs text-slate-400">
            {orders.length} orders recorded in system
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="p-2 rounded-xl bg-white border border-slate-200/80 text-slate-600 hover:text-orange-600 shadow-sm active:scale-95 transition-all"
          title="Refresh Orders"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-600' : ''}`} />
        </button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order number (ORD-...) or table..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        {/* Order Type Toggle Pills */}
        <div className="flex items-center space-x-1.5 py-0.5">
          {[
            { id: 'ALL', label: 'All Services', icon: null },
            { id: 'DINE_IN', label: 'Dine-In', icon: UtensilsCrossed },
            { id: 'TAKEAWAY', label: 'Takeaway', icon: ShoppingBag },
          ].map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelectedType(type.id)}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1 transition-all ${
                  isSelected
                    ? type.id === 'TAKEAWAY'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : type.id === 'DINE_IN'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'bg-slate-800 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                {Icon && <Icon className="w-3 h-3" />}
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>

        {/* Status Horizontal Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
          {statuses.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                selectedStatus === st
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {st === 'ALL' ? 'All Orders' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-100">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Fetching orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center text-slate-400 border border-slate-100">
          <ClipboardList className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-xs font-semibold text-slate-600">No matching orders</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Try searching a different order number or changing status filter
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((ord) => {
            const tableNum = ord.tableId?.tableNumber;
            const createdDate = new Date(ord.createdAt);
            const timeStr = createdDate.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={ord._id}
                onClick={() => navigate(`/orders/${ord._id}`)}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-touch hover:border-orange-200 cursor-pointer transition-all touch-press space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-black text-slate-800">
                        {ord.orderNumber}
                      </span>
                      <StatusBadge status={ord.status} size="sm" />
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
                      {ord.orderType === 'TAKEAWAY' ? (
                        <span className="flex items-center space-x-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 text-[11px]">
                          <ShoppingBag className="w-3 h-3 text-blue-600" />
                          <span>Takeaway</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 font-semibold text-slate-600">
                          <Layers className="w-3.5 h-3.5 text-orange-500" />
                          <span>{tableNum ? `Table ${tableNum}` : 'Dine-In'}</span>
                        </span>
                      )}
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{timeStr}</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-base font-black text-slate-900">
                      ₹{Number(ord.grandTotal || 0).toFixed(2)}
                    </p>
                    <span className="text-[11px] text-slate-400">
                      {ord.items?.length || 0} item{(ord.items?.length || 0) > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Items preview snippet */}
                <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
                  <span className="truncate max-w-[260px] text-[11px]">
                    {ord.items?.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                  </span>
                  <span className="text-orange-600 font-bold flex items-center space-x-0.5 text-[11px] shrink-0 ml-2">
                    <span>Details</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
