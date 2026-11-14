import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChefHat,
  Clock,
  Layers,
  RefreshCw,
  CheckCircle2,
  Play,
  Check,
  AlertCircle,
  Flame,
} from 'lucide-react';
import orderService from '../services/orderService';
import socketService from '../services/socket';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

export const KOT = () => {
  const navigate = useNavigate();
  const { hasPermission, isOnline } = useAuth();

  const [kots, setKots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState('');

  const canManageKOT = hasPermission('kot:manage');

  const fetchKOTs = async () => {
    try {
      const res = await orderService.getKOTs({ limit: 50 });
      setKots(res.kots || []);
    } catch (err) {
      console.error('Failed to load KOTs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKOTs();

    const unsubCreated = socketService.on('kot:created', () => fetchKOTs());
    const unsubUpdated = socketService.on('kot:updated', () => fetchKOTs());

    return () => {
      unsubCreated();
      unsubUpdated();
    };
  }, []);

  const handleUpdateStatus = async (kotId, nextStatus) => {
    if (!isOnline) {
      setError('Cannot update kitchen status while offline.');
      return;
    }

    try {
      setActionLoadingId(kotId);
      setError('');
      await orderService.updateKOTStatus(kotId, nextStatus);
      await fetchKOTs();
    } catch (err) {
      setError(err.message || 'Failed to update KOT status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filters = ['ALL', 'PENDING', 'PREPARING', 'READY', 'SERVED'];

  const filteredKOTs = kots.filter((kot) => {
    if (activeFilter === 'ALL') return true;
    return kot.kitchenStatus === activeFilter;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <div className="flex items-center space-x-1.5 text-xs text-purple-600 font-bold uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5" />
            <span>Kitchen Display System</span>
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            Kitchen Order Tickets
          </h2>
        </div>
        <button
          onClick={fetchKOTs}
          className="p-2 rounded-xl bg-white border border-slate-200/80 text-slate-600 hover:text-purple-600 shadow-sm active:scale-95 transition-all"
          title="Refresh KOTs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
        {filters.map((fl) => (
          <button
            key={fl}
            onClick={() => setActiveFilter(fl)}
            className={`text-xs px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeFilter === fl
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            {fl === 'ALL' ? 'All Tickets' : fl}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-2xl flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* KOT Cards Grid */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-100">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Connecting to kitchen line...</p>
        </div>
      ) : filteredKOTs.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center text-slate-400 border border-slate-100">
          <ChefHat className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-xs font-semibold text-slate-600">No Kitchen Tickets</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Tickets sent to kitchen will show up here in real-time
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredKOTs.map((kot) => {
            const isPending = kot.kitchenStatus === 'PENDING';
            const isPreparing = kot.kitchenStatus === 'PREPARING';
            const isReady = kot.kitchenStatus === 'READY';
            const isActionLoading = actionLoadingId === kot._id;

            const timeStr = new Date(kot.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={kot._id}
                className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-touch space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm font-black text-slate-800">
                          {kot.kotNumber}
                        </span>
                        <StatusBadge status={kot.kitchenStatus} size="sm" />
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
                        <span className="flex items-center space-x-1 font-bold text-slate-700">
                          <Layers className="w-3.5 h-3.5 text-orange-500" />
                          <span>Table {kot.tableNumber || kot.orderId?.tableId?.tableNumber || 'N/A'}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{timeStr}</span>
                        </span>
                      </div>
                    </div>

                    {kot.priority === 'HIGH' || kot.priority === 'URGENT' ? (
                      <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {kot.priority}
                      </span>
                    ) : null}
                  </div>

                  {/* Items list */}
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-2">
                    {kot.items?.map((it, idx) => (
                      <div key={idx} className="text-xs">
                        <div className="flex justify-between font-bold text-slate-800">
                          <span className="flex items-center space-x-1.5">
                            <span className="w-5 h-5 rounded-md bg-purple-100 text-purple-800 flex items-center justify-center text-[11px] font-extrabold font-mono">
                              {it.quantity}
                            </span>
                            <span>{it.name}</span>
                          </span>
                        </div>
                        {it.notes && (
                          <p className="text-[11px] text-amber-800 font-medium pl-6 mt-0.5">
                            ↳ Note: "{it.notes}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Advancement Actions */}
                {canManageKOT && (
                  <div className="pt-2 border-t border-slate-100">
                    {isPending && (
                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => handleUpdateStatus(kot._id, 'PREPARING')}
                        className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-1.5 transition-all touch-press"
                      >
                        {isActionLoading ? (
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Start Preparing Dish</span>
                          </>
                        )}
                      </button>
                    )}

                    {isPreparing && (
                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => handleUpdateStatus(kot._id, 'READY')}
                        className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-1.5 transition-all touch-press"
                      >
                        {isActionLoading ? (
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Mark Food Ready (Alert Waiter)</span>
                          </>
                        )}
                      </button>
                    )}

                    {isReady && (
                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => handleUpdateStatus(kot._id, 'SERVED')}
                        className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all"
                      >
                        {isActionLoading ? (
                          <span className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Delivered / Served to Table</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KOT;
