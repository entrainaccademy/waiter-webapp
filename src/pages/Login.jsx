import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UtensilsCrossed, Lock, Mail, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect to home
  React.useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login(email, password);
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill helper for testing existing seeded accounts
  const quickFill = (testEmail, testPass) => {
    setEmail(testEmail);
    setPassword(testPass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-slate-50 to-slate-100 flex flex-col justify-center px-4 sm:px-6 py-12">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-orange-600 to-orange-400 rounded-2xl mx-auto flex items-center justify-center text-white shadow-float shadow-orange-500/20">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800">
            Food Order
          </h1>
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-600 bg-orange-100/60 inline-block px-2.5 py-1 rounded-full">
            Staff Mobile Ordering PWA
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-float p-6 sm:p-8 border border-slate-100">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-800">Staff Portal Sign In</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your credentials to access tables, menu & orders
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-2xl flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                Staff Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@restaurant.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50 touch-press"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Staff Demo Accounts */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center space-x-1 mb-2.5 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>Existing Test Staff Accounts</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-left">
              <button
                type="button"
                onClick={() => quickFill('cashier@cobolt.com', 'Password@123')}
                className="p-2.5 bg-slate-50 hover:bg-orange-50/60 rounded-xl border border-slate-200/80 text-[11px] text-slate-700 hover:text-orange-700 hover:border-orange-200 transition-colors"
              >
                <span className="font-bold block text-slate-800">Cashier Role</span>
                <span className="text-[10px] text-slate-400 truncate block">cashier@cobolt.com</span>
              </button>

              <button
                type="button"
                onClick={() => quickFill('admin@cobolt.com', 'Password@123')}
                className="p-2.5 bg-slate-50 hover:bg-purple-50/60 rounded-xl border border-slate-200/80 text-[11px] text-slate-700 hover:text-purple-700 hover:border-purple-200 transition-colors"
              >
                <span className="font-bold block text-slate-800">Admin Role</span>
                <span className="text-[10px] text-slate-400 truncate block">admin@cobolt.com</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          Connected to Restaurant POS SaaS Backend
        </p>
      </div>
    </div>
  );
};

export default Login;
