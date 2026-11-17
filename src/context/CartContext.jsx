import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

const CART_STORAGE_KEY = 'kot_staff_cart_state';

export const CartProvider = ({ children }) => {
  const [selectedTable, setSelectedTable] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.selectedTable || null;
      }
    } catch {}
    return null;
  });

  const [orderType, setOrderType] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.orderType || 'DINE_IN';
      }
    } catch {}
    return 'DINE_IN';
  });
  const [appendOrderId, setAppendOrderId] = useState(null); // When adding to existing order
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.items || [];
      }
    } catch {}
    return [];
  });

  // Persist cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify({
          selectedTable,
          orderType,
          appendOrderId,
          items,
        })
      );
    } catch (err) {
      console.warn('Failed to persist cart:', err);
    }
  }, [selectedTable, orderType, appendOrderId, items]);

  const selectTable = (table) => {
    setSelectedTable(table);
    setOrderType('DINE_IN');
  };

  const clearTable = () => {
    setSelectedTable(null);
  };

  const handleSetOrderType = (type) => {
    setOrderType(type);
    if (type === 'TAKEAWAY') {
      setSelectedTable(null);
    }
  };

  const setAppendMode = (order, table) => {
    setAppendOrderId(order._id);
    setSelectedTable(table || order.tableId || null);
    setOrderType(order.orderType || (order.tableId ? 'DINE_IN' : 'TAKEAWAY'));
  };

  const addItem = (menuItem, quantity = 1, notes = '') => {
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (i) => i.menuItemId === menuItem._id
      );

      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
          notes: notes || updated[existingIndex].notes,
        };
        return updated;
      }

      return [
        ...prevItems,
        {
          menuItemId: menuItem._id,
          name: menuItem.name,
          price: menuItem.price,
          taxRate: menuItem.taxRate || 5,
          isVegetarian: menuItem.isVegetarian ?? true,
          quantity,
          notes,
          category: menuItem.categoryId?.name || '',
        },
      ];
    });
  };

  const updateQuantity = (menuItemId, quantity) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.menuItemId === menuItemId ? { ...item, quantity } : item
      )
    );
  };

  const updateNotes = (menuItemId, notes) => {
    setItems((prev) =>
      prev.map((item) =>
        item.menuItemId === menuItemId ? { ...item, notes } : item
      )
    );
  };

  const removeItem = (menuItemId) => {
    setItems((prev) => prev.filter((item) => item.menuItemId !== menuItemId));
  };

  const clearCart = () => {
    setItems([]);
    setAppendOrderId(null);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  // Computations
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const estimatedTax = items.reduce(
    (sum, item) => sum + item.price * item.quantity * ((item.taxRate || 5) / 100),
    0
  );

  const grandTotal = Math.round((subtotal + estimatedTax) * 100) / 100;

  const value = {
    selectedTable,
    orderType,
    appendOrderId,
    items,
    totalItems,
    subtotal,
    estimatedTax,
    grandTotal,
    selectTable,
    clearTable,
    setOrderType: handleSetOrderType,
    setAppendMode,
    addItem,
    updateQuantity,
    updateNotes,
    removeItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
