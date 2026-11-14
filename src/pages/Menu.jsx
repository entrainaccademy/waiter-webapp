import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  BookOpen,
  Filter,
  Layers,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  Check,
} from 'lucide-react';
import menuService from '../services/menuService';
import socketService from '../services/socket';
import { useCart } from '../context/CartContext';
import MenuItemCard from '../components/MenuItemCard';

export const Menu = () => {
  const navigate = useNavigate();
  const {
    items: cartItems,
    selectedTable,
    appendOrderId,
    addItem,
    updateQuantity,
    updateNotes,
  } = useCart();

  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [vegOnly, setVegOnly] = useState(false);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const [cats, itemsRes] = await Promise.all([
          menuService.getCategories(),
          menuService.getMenuItems(),
        ]);
        setCategories(cats || []);
        setMenuItems(itemsRes.items || []);
      } catch (err) {
        console.error('Failed to load menu catalog:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();

    // Listen for live availability changes
    const unsubAvailability = socketService.on('menu:availability_changed', (payload) => {
      console.log('⚡ Menu item availability changed:', payload);
      setMenuItems((prev) =>
        prev.map((item) =>
          item._id === payload.itemId
            ? { ...item, availability: payload.availability }
            : item
        )
      );
    });

    return () => {
      unsubAvailability();
    };
  }, []);

  // Filter items
  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      activeCategory === 'ALL' ||
      item.categoryId?._id === activeCategory ||
      item.categoryId === activeCategory;

    const matchesVeg = !vegOnly || item.isVegetarian === true;

    return matchesSearch && matchesCategory && matchesVeg;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Table / Order Context Banner */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-3 border border-slate-100 shadow-touch">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-slate-800">
                {appendOrderId
                  ? 'Adding to Running Order'
                  : selectedTable
                  ? `Table ${selectedTable.tableNumber}`
                  : 'Dine-In (No Table)'}
              </span>
              {selectedTable && (
                <span className="text-[10px] text-slate-400 font-medium">
                  • {selectedTable.floor || 'Floor'}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400">
              {appendOrderId
                ? 'Items will be added to the active bill'
                : selectedTable
                ? 'Ready to take guest selection'
                : 'Tap to assign dining table'}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/tables')}
          className="text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 px-2.5 py-1.5 rounded-xl border border-orange-200/80 active:scale-95 transition-all"
        >
          {selectedTable ? 'Change Table' : 'Select Table'}
        </button>
      </div>

      {/* Search & Veg toggle */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes (e.g. Tikka, Biryani)..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>

          {/* Veg Only Toggle Button */}
          <button
            type="button"
            onClick={() => setVegOnly(!vegOnly)}
            className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-all ${
              vegOnly
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Veg</span>
          </button>
        </div>

        {/* Category Horizontal Scrolling Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            type="button"
            onClick={() => setActiveCategory('ALL')}
            className={`text-xs px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeCategory === 'ALL'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              type="button"
              onClick={() => setActiveCategory(cat._id)}
              className={`text-xs px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                activeCategory === cat._id
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Catalog Grid */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-100">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading fresh restaurant menu...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center text-slate-400 border border-slate-100">
          <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-xs font-semibold text-slate-600">No dishes found</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Try adjusting your search query or category filter
          </p>
          <button
            onClick={() => {
              setSearch('');
              setActiveCategory('ALL');
              setVegOnly(false);
            }}
            className="text-xs text-orange-600 font-bold mt-2"
          >
            Reset Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredItems.map((item) => {
            const cartItem = cartItems.find((i) => i.menuItemId === item._id);

            return (
              <MenuItemCard
                key={item._id}
                item={item}
                cartItem={cartItem}
                onAddToCart={addItem}
                onUpdateQuantity={updateQuantity}
                onUpdateNotes={updateNotes}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Menu;
