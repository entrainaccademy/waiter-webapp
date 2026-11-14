import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tables from './pages/Tables';
import Menu from './pages/Menu';
import NewOrder from './pages/NewOrder';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import KOT from './pages/KOT';
import Profile from './pages/Profile';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-orange-400 flex items-center justify-center text-white shadow-md animate-pulse mb-3">
          <span className="font-black text-xl">🍽️</span>
        </div>
        <p className="text-xs font-bold text-slate-500 tracking-wide uppercase">
          Initializing Food Order POS...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="tables" element={<Tables />} />
        <Route path="menu" element={<Menu />} />
        <Route path="new-order" element={<NewOrder />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetails />} />
        <Route path="kot" element={<KOT />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
