import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-2 border-[#174C3A] border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-sm text-[#202820]/70">Checking your account…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/auth?mode=login&next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallback =
      user.role === 'admin'
        ? '/admin'
        : user.role === 'owner'
        ? '/owner/dashboard'
        : '/student/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
