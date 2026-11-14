import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, Search, Filter, RefreshCw, Layers } from 'lucide-react';
import tableService from '../services/tableService';
import orderService from '../services/orderService';
import socketService from '../services/socket';
import { useCart } from '../context/CartContext';
import TableCard from '../components/TableCard';

export const Tables = () => {
  const navigate = useNavigate();
  const { selectedTable, selectTable, setAppendMode } = useCart();

  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const fetchTablesAndOrders = async () => {
    try {
      const [tablesData, ordersData] = await Promise.all([
        tableService.getTables(),
        orderService.getOrders({ limit: 50 }).then((res) => res.orders).catch(() => []),
      ]);

      setTables(tablesData || []);
      setOrders(ordersData || []);
    } catch (err) {
      console.error('Failed to fetch tables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTablesAndOrders();

    // Socket.IO real-time event subscriptions
    const unsubStatus = socketService.on('table:status-updated', (payload) => {
      console.log('⚡ Table status updated:', payload);
      setTables((prev) =>
        prev.map((t) =>
          t._id === payload.tableId ? { ...t, status: payload.status } : t
        )
      );
    });

    const unsubRelease = socketService.on('table:released', (payload) => {
      console.log('⚡ Table released:', payload);
      setTables((prev) =>
        prev.map((t) =>
          t._id === payload.tableId ? { ...t, status: 'AVAILABLE' } : t
        )
      );
    });

    const unsubOrder = socketService.on('order:created', () => fetchTablesAndOrders());
    const unsubCompleted = socketService.on('order:completed', () => fetchTablesAndOrders());

    return () => {
      unsubStatus();
      unsubRelease();
      unsubOrder();
      unsubCompleted();
    };
  }, []);

  // Find active order for a given table
  const getActiveOrderForTable = (tableId) => {
    return orders.find(
      (o) =>
        (o.tableId?._id === tableId || o.tableId === tableId) &&
        !['COMPLETED', 'CANCELLED'].includes(o.status)
    );
  };

  // Distinct floors
  const floors = ['ALL', ...Array.from(new Set(tables.map((t) => t.floor || 'Main Dining')))];

  // Filtered tables
  const filteredTables = tables.filter((table) => {
    const matchesSearch = table.tableNumber.toLowerCase().includes(search.toLowerCase());
    const matchesFloor = selectedFloor === 'ALL' || (table.floor || 'Main Dining') === selectedFloor;
    const matchesStatus = selectedStatus === 'ALL' || table.status === selectedStatus;
    return matchesSearch && matchesFloor && matchesStatus;
  });

  const handleSelectTable = (table) => {
    selectTable(table);
    if (table.status === 'AVAILABLE') {
      navigate('/menu');
    } else {
      const activeOrder = getActiveOrderForTable(table._id);
      if (activeOrder) {
        navigate(`/orders/${activeOrder._id}`);
      } else {
        navigate('/menu');
      }
    }
  };

  const handleViewOrder = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  const handleAddToOrder = (order, table) => {
    setAppendMode(order, table);
    navigate('/menu');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Title & Refresh */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            Dining Tables
          </h2>
          <p className="text-xs text-slate-400">
            {tables.filter((t) => t.status === 'AVAILABLE').length} of {tables.length} available for seating
          </p>
        </div>
        <button
          onClick={fetchTablesAndOrders}
          className="p-2 rounded-xl bg-white border border-slate-200/80 text-slate-600 hover:text-orange-600 shadow-sm active:scale-95 transition-all"
          title="Refresh Tables"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-600' : ''}`} />
        </button>
      </div>

      {/* Search & Status Filters */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search table number (e.g. T-01)..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        {/* Floor selector pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1">
          {floors.map((fl) => (
            <button
              key={fl}
              onClick={() => setSelectedFloor(fl)}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                selectedFloor === fl
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {fl === 'ALL' ? 'All Floors' : fl}
            </button>
          ))}
        </div>

        {/* Status filter tabs */}
        <div className="grid grid-cols-4 gap-1.5 bg-slate-200/60 p-1 rounded-xl text-center text-xs font-bold">
          {['ALL', 'AVAILABLE', 'OCCUPIED', 'RESERVED'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`py-1.5 rounded-lg transition-all ${
                selectedStatus === st
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {st === 'ALL' ? 'All' : st === 'AVAILABLE' ? 'Free' : st === 'OCCUPIED' ? 'Busy' : 'Rsvd'}
            </button>
          ))}
        </div>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-100">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Fetching floor layout...</p>
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center text-slate-400 border border-slate-100">
          <Grid className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-xs font-semibold text-slate-600">No tables matching filters</p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedFloor('ALL');
              setSelectedStatus('ALL');
            }}
            className="text-xs text-orange-600 font-bold mt-2"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredTables.map((table) => {
            const activeOrder = getActiveOrderForTable(table._id);
            const isSelected = selectedTable?._id === table._id;

            return (
              <TableCard
                key={table._id}
                table={table}
                activeOrder={activeOrder}
                isSelected={isSelected}
                onSelectTable={handleSelectTable}
                onViewOrder={handleViewOrder}
                onAddToOrder={handleAddToOrder}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Tables;
