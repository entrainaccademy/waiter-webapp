import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RoleGuard = ({
  permission,
  roles = [],
  fallback = null,
  showNotice = false,
  children,
}) => {
  const { user, hasPermission } = useAuth();

  if (!user) return fallback;

  let isAllowed = true;

  if (permission && !hasPermission(permission)) {
    isAllowed = false;
  }

  if (roles.length > 0 && !roles.includes(user.role) && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    isAllowed = false;
  }

  if (isAllowed) {
    return <>{children}</>;
  }

  if (showNotice) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center my-4">
        <ShieldAlert className="w-6 h-6 text-amber-600 mx-auto mb-1.5" />
        <h4 className="font-bold text-xs text-amber-900">Restricted Feature</h4>
        <p className="text-[11px] text-amber-700 mt-0.5">
          Your staff role ({user.role}) does not have permission ({permission || roles.join(', ')}) to access this action.
        </p>
      </div>
    );
  }

  return fallback;
};

export default RoleGuard;
