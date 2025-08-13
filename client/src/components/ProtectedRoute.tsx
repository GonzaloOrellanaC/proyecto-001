import React from 'react';
import { Redirect, Route, RouteProps } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { useAuth } from '../context/AuthContext';

type Props = RouteProps & { roles?: Array<'admin' | 'cashier'>; permissions?: string[] };

export const ProtectedRoute: React.FC<Props> = ({ roles, permissions, ...rest }) => {
  const { user, loading, permissions: myPerms } = useAuth();
  if (loading) {
    // Render a Route that shows a centered spinner so Switch keeps routing behavior
    const path = (rest as any).path;
    const exact = (rest as any).exact;
    const strict = (rest as any).strict;
    const sensitive = (rest as any).sensitive;
    return (
      <Route
        path={path}
        exact={exact}
        strict={strict}
        sensitive={sensitive}
        render={() => (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <IonSpinner name="crescent" />
          </div>
        )}
      />
    );
  }
  if (!user) return <Redirect to="/login" />;
  if (roles && !roles.includes(user.role)) return <Redirect to={user.role === 'admin' ? '/admin' : '/seller'} />;
  if (permissions && permissions.length > 0) {
    const ok = permissions.every(p => myPerms.includes(p));
    if (!ok) return <Redirect to={user.role === 'admin' ? '/admin' : '/seller'} />;
  }
  return <Route {...rest} />;
};
