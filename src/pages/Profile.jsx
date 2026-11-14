import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Shield,
  Building,
  LogOut,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Smartphone,
  Phone,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import orderService from '../services/orderService';

export const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, isOnline, socketConnected } = useAuth();

  const [restaurantProfile, setRestaurantProfile] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    orderService
      .getRestaurantProfile()
      .then((data) => setRestaurantProfile(data))
      .catch((err) => console.warn('Could not load restaurant profile:', err));
  }, []);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out of the staff terminal?')) {
      await logout();
      navigate('/login');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordError('');
      setPasswordMsg('');
      await authService.changePassword(currentPassword, newPassword);
      setPasswordMsg('Password changed successfully! Please log in again.');
      setTimeout(async () => {
        await logout();
        navigate('/login');
      }, 1500);
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 animate-in fade-in duration-200">
      <div className="pt-1">
        <h2 className="text-xl font-black text-slate-800 tracking-tight">
          Staff Profile
        </h2>
        <p className="text-xs text-slate-400">Account credentials & restaurant info</p>
      </div>

      {/* Staff ID Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-touch space-y-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 to-orange-400 text-white flex items-center justify-center text-xl font-black shadow-md">
            {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-base text-slate-800">{user?.name}</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200 px-2 py-0.5 rounded-md">
                {user?.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Status badges */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 bg-slate-50 rounded-xl flex items-center space-x-2">
            <Wifi className={`w-4 h-4 ${isOnline ? 'text-emerald-500' : 'text-rose-500'}`} />
            <div>
              <span className="text-[10px] text-slate-400 block">Connection</span>
              <span className="font-bold text-slate-700">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl flex items-center space-x-2">
            <Smartphone className="w-4 h-4 text-purple-500" />
            <div>
              <span className="text-[10px] text-slate-400 block">Live Sync</span>
              <span className="font-bold text-slate-700">{socketConnected ? 'Connected' : 'Connecting'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant Tenant Information */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-touch space-y-3">
        <div className="flex items-center space-x-2">
          <Building className="w-4 h-4 text-orange-500" />
          <h3 className="font-bold text-sm text-slate-800">Restaurant Information</h3>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-400">Establishment</span>
            <span className="font-bold text-slate-800">{restaurantProfile?.name || user?.restaurantName || 'Cobolt Kitchen'}</span>
          </div>

          {restaurantProfile?.phone && (
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Phone</span>
              <span className="font-medium text-slate-700">{restaurantProfile.phone}</span>
            </div>
          )}

          {restaurantProfile?.taxSettings?.gstNumber && (
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">GSTIN</span>
              <span className="font-mono font-bold text-slate-700">{restaurantProfile.taxSettings.gstNumber}</span>
            </div>
          )}

          {restaurantProfile?.address && (
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Address</span>
              <span className="font-medium text-slate-700 text-right max-w-[200px]">
                {restaurantProfile.address.street}, {restaurantProfile.address.city}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Permissions List */}
      {user?.permissions && user.permissions.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-touch space-y-2.5">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-sm text-slate-800">Assigned Capabilities</h3>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {user.permissions.map((perm) => (
              <span
                key={perm}
                className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
              >
                {perm}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Security & Password Action */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-touch space-y-2">
        <button
          onClick={() => setShowPasswordModal(true)}
          className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-left text-xs font-bold text-slate-700 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center space-x-2">
            <KeyRound className="w-4 h-4 text-slate-500" />
            <span>Change Staff Password</span>
          </div>
          <span className="text-slate-400">→</span>
        </button>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-3.5 px-4 bg-rose-50 hover:bg-rose-100 active:scale-[0.99] border border-rose-200 text-rose-700 font-extrabold text-sm rounded-2xl flex items-center justify-center space-x-2 touch-press transition-all"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign Out of Terminal</span>
      </button>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 pb-8 sm:pb-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-800">Change Password</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {passwordError && (
              <div className="bg-rose-50 text-rose-700 text-xs p-3 rounded-xl">
                {passwordError}
              </div>
            )}

            {passwordMsg && (
              <div className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded-xl">
                {passwordMsg}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  New Password (min 8 chars, 1 uppercase, 1 number)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 py-2 px-3 bg-orange-600 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
