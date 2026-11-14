import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const FloatingCartBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems, grandTotal, selectedTable, appendOrderId } = useCart();

  // Don't show if on New Order / Checkout page or if cart is empty
  if (totalItems === 0 || location.pathname === '/new-order') {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-20 animate-in slide-in-from-bottom-4 duration-200">
      <div
        onClick={() => navigate('/new-order')}
        className="glass-panel bg-orange-600 text-white rounded-2xl p-3 shadow-float flex items-center justify-between cursor-pointer border border-orange-500/50 hover:bg-orange-500 active:scale-[0.99] transition-all"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-sm">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold uppercase tracking-wider bg-black/20 px-1.5 py-0.5 rounded text-orange-100">
                {appendOrderId ? 'Add to Running Order' : (selectedTable ? `Table ${selectedTable.tableNumber}` : 'No Table')}
              </span>
              <span className="text-xs text-orange-100">({totalItems} items)</span>
            </div>
            <p className="text-base font-extrabold tracking-tight">₹{grandTotal.toFixed(2)}</p>
          </div>
        </div>

        <button className="flex items-center space-x-1.5 bg-white text-orange-600 font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm hover:bg-orange-50">
          <span>Review Order</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default FloatingCartBar;
