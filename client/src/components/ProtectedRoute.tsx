import React from 'react';
import { Redirect, Route, RouteProps } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type Props = RouteProps & { roles?: Array<'admin' | 'cashier'>; permissions?: string[] };

export const ProtectedRoute: React.FC<Props> = ({ roles, permissions, ...rest }) => {
  const { user, loading, permissions: myPerms } = useAuth();
  if (loading) return null;
  if (!user) return <Redirect to="/login" />;
  if (roles && !roles.includes(user.role)) return <Redirect to={user.role === 'admin' ? '/admin' : '/seller'} />;
  if (permissions && permissions.length > 0) {
    const ok = permissions.every(p => myPerms.includes(p));
    if (!ok) return <Redirect to={user.role === 'admin' ? '/admin' : '/seller'} />;
  }
  return <Route {...rest} />;
};
