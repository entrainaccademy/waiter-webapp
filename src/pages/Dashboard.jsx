import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  ClipboardList,
  ChefHat,
  BookOpen,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Sparkles,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import orderService from '../services/orderService';
import tableService from '../services/tableService';
import socketService from '../services/socket';
import StatusBadge from '../components/StatusBadge';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();

  const [metrics, setMetrics] = useState(null);
  const [tables, setTables] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const promises = [];

      // 1. Metrics (requires dashboard:view)
      if (hasPermission('dashboard:view')) {
        promises.push(
          orderService.getDashboardMetrics().catch((err) => {
            console.warn('Dashboard metrics error:', err.message);
            return null;
          })
        );
      } else {
        promises.push(Promise.resolve(null));
      }

      // 2. Tables (requires orders:view)
      if (hasPermission('orders:view')) {
        promises.push(
          tableService.getTables().catch((err) => {
            console.warn('Tables load error:', err.message);
            return [];
          })
        );
      } else {
        promises.push(Promise.resolve([]));
      }

      // 3. Active Orders (requires orders:view)
      if (hasPermission('orders:view')) {
        promises.push(
          orderService
            .getOrders({ limit: 5 })
            .then((res) => res.orders)
            .catch((err) => {
              console.warn('Orders load error:', err.message);
              return [];
            })
        );
      } else {
        promises.push(Promise.resolve([]));
      }

      const [metricsData, tablesData, ordersData] = await Promise.all(promises);

      setMetrics(metricsData);
      setTables(tablesData || []);
      setActiveOrders(
        (ordersData || []).filter(
          (o) => !['COMPLETED', 'CANCELLED'].includes(o.status)
        )
      );
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Socket live updates
    const unsubTable = socketService.on('table:status-updated', () => fetchData());
    const unsubRelease = socketService.on('table:released', () => fetchData());
    const unsubOrderCreated = socketService.on('order:created', () => fetchData());
    const unsubOrderUpdated = socketService.on('order:updated', () => fetchData());
    const unsubOrderCompleted = socketService.on('order:completed', () => fetchData());
    const unsubKot = socketService.on('kot:created', () => fetchData());

    return () => {
      unsubTable();
      unsubRelease();
      unsubOrderCreated();
      unsubOrderUpdated();
      unsubOrderCompleted();
      unsubKot();
    };
  }, []);

  // Compute table counters
  const totalTablesCount = tables.length;
  const availableTablesCount = tables.filter((t) => t.status === 'AVAILABLE').length;
  const occupiedTablesCount = tables.filter((t) => t.status === 'OCCUPIED').length;
  const reservedTablesCount = tables.filter((t) => t.status === 'RESERVED').length;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Greeting */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <div className="flex items-center space-x-1.5 text-xs text-orange-600 font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome, {user?.name || 'Staff'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Floor Overview
          </h2>
        </div>
        <button
          onClick={fetchData}
          disabled={refreshing}
          className="p-2 rounded-xl bg-white border border-slate-200/80 text-slate-600 hover:text-orange-600 shadow-sm active:scale-95 transition-all"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-orange-600' : ''}`} />
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Tables */}
        <div
          onClick={() => navigate('/tables')}
          className="bg-white rounded-2xl p-4 border border-slate-100 shadow-touch cursor-pointer hover:border-slate-200 transition-all touch-press"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tables
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600">
              <Grid className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800">{totalTablesCount}</p>
          <div className="flex items-center space-x-2 text-[11px] mt-1 font-semibold">
            <span className="text-emerald-600">{availableTablesCount} Free</span>
            <span className="text-slate-300">•</span>
            <span className="text-orange-600">{occupiedTablesCount} Busy</span>
          </div>
        </div>

        {/* Available Tables */}
        <div
          onClick={() => navigate('/tables')}
          className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-touch cursor-pointer hover:border-emerald-200 transition-all touch-press"
        >
          <div className="flex items-center justify-between text-emerald-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Available
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600">{availableTablesCount}</p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Ready for guests</p>
        </div>

        {/* Active Orders */}
        <div
          onClick={() => navigate('/orders')}
          className="bg-white rounded-2xl p-4 border border-slate-100 shadow-touch cursor-pointer hover:border-slate-200 transition-all touch-press"
        >
          <div className="flex items-center justify-between text-blue-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Active Orders
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <ClipboardList className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800">
            {metrics?.todaysOrders !== undefined ? activeOrders.length : activeOrders.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">In dining room</p>
        </div>

        {/* Pending KOT */}
        <div
          onClick={() => navigate('/kot')}
          className="bg-white rounded-2xl p-4 border border-purple-100 shadow-touch cursor-pointer hover:border-purple-200 transition-all touch-press"
        >
          <div className="flex items-center justify-between text-purple-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
              Cooking KOT
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <ChefHat className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-600">
            {metrics?.pendingKotCount !== undefined ? metrics.pendingKotCount : 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Pending kitchen</p>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-touch">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => navigate('/tables')}
            className="p-3 bg-orange-50 hover:bg-orange-100/70 border border-orange-200/80 rounded-2xl text-left transition-all touch-press"
          >
            <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center mb-2 shadow-sm">
              <Grid className="w-4 h-4" />
            </div>
            <p className="font-bold text-xs text-orange-950">Select Table</p>
            <p className="text-[10px] text-orange-700/80">Start new dining order</p>
          </button>

          <button
            onClick={() => navigate('/menu')}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-2xl text-left transition-all touch-press"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center mb-2 shadow-sm">
              <BookOpen className="w-4 h-4" />
            </div>
            <p className="font-bold text-xs text-slate-800">Browse Menu</p>
            <p className="text-[10px] text-slate-400">Search dishes & prices</p>
          </button>

          <button
            onClick={() => navigate('/orders')}
            className="p-3 bg-blue-50/60 hover:bg-blue-100/70 border border-blue-200/80 rounded-2xl text-left transition-all touch-press"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-2 shadow-sm">
              <ClipboardList className="w-4 h-4" />
            </div>
            <p className="font-bold text-xs text-blue-950">Active Orders</p>
            <p className="text-[10px] text-blue-700/80">Track running tables</p>
          </button>

          <button
            onClick={() => navigate('/kot')}
            className="p-3 bg-purple-50/60 hover:bg-purple-100/70 border border-purple-200/80 rounded-2xl text-left transition-all touch-press"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-2 shadow-sm">
              <ChefHat className="w-4 h-4" />
            </div>
            <p className="font-bold text-xs text-purple-950">Kitchen KOT</p>
            <p className="text-[10px] text-purple-700/80">Live cooking status</p>
          </button>
        </div>
      </div>

      {/* Running Orders Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-slate-800">Running Table Orders</h3>
          <button
            onClick={() => navigate('/orders')}
            className="text-xs text-orange-600 hover:text-orange-700 font-bold flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-100">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs">Loading live floor activity...</span>
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center text-slate-400 border border-slate-100">
            <ClipboardList className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-semibold text-slate-600">No active dining orders</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Select an available table to take a guest order
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeOrders.map((ord) => (
              <div
                key={ord._id}
                onClick={() => navigate(`/orders/${ord._id}`)}
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-touch hover:border-orange-200 cursor-pointer transition-all touch-press flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-sm text-slate-800">
                      {ord.tableId?.tableNumber ? `Table ${ord.tableId.tableNumber}` : 'Takeaway'}
                    </span>
                    <StatusBadge status={ord.status} size="sm" />
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <span className="font-mono text-[11px]">{ord.orderNumber}</span>
                    <span>•</span>
                    <span>{ord.items?.length || 0} items</span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-black text-sm text-slate-900">
                    ₹{Number(ord.grandTotal || 0).toFixed(2)}
                  </p>
                  <span className="text-[11px] font-bold text-orange-600 flex items-center justify-end space-x-0.5">
                    <span>Manage</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
