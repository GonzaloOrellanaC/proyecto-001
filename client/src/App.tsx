import { Redirect, Route, Switch } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Home from './pages/Home';
import Login from './pages/Login';
import SellerDashboard from './pages/SellerDashboard';
import POS from './pages/POS';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';
import './theme/responsive.css';
import Dashboard from './pages/Dashboard';
import Organizations from './pages/Organizations';
import Stores from './pages/Stores';
import Products from './pages/Products';
import Users from './pages/Users';
import UserEdit from './pages/UserEdit';
import Roles from './pages/Roles';

setupIonicReact();

const RootRedirect: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Redirect to="/login" />;
  return <Redirect to={user.role === 'admin' ? '/dashboard' : '/seller'} />;
};

const App: React.FC = () => (
  <AuthProvider>
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Switch>
            <Route exact path="/login" component={Login} />
            {/* Legacy dashboard route can be kept temporarily; redirect to new dashboard */}
            <ProtectedRoute exact path="/admin" roles={['admin']} component={Dashboard} />
            <ProtectedRoute exact path="/dashboard" roles={['admin']} component={Dashboard} />
            <ProtectedRoute exact path="/manage/organizations" roles={['admin']} permissions={['manage-organizations']} component={Organizations} />
            <ProtectedRoute exact path="/manage/stores" roles={['admin']} permissions={['manage-stores']} component={Stores} />
            <ProtectedRoute exact path="/manage/products" roles={['admin']} permissions={['manage-products']} component={Products} />
            <ProtectedRoute exact path="/manage/users" roles={['admin']} permissions={['manage-users']} component={Users} />
            <ProtectedRoute exact path="/manage/users/new" roles={['admin']} permissions={['manage-users']} component={UserEdit} />
            <ProtectedRoute exact path="/manage/users/:userId" roles={['admin']} permissions={['manage-users']} component={UserEdit} />
            <ProtectedRoute exact path="/manage/roles" roles={['admin']} permissions={['manage-roles']} component={Roles} />
            <ProtectedRoute exact path="/seller" roles={['cashier']} permissions={['sell']} component={SellerDashboard} />
            <ProtectedRoute exact path="/pos/:orgId" roles={['cashier']} permissions={['sell']} component={POS} />
            <ProtectedRoute exact path="/home" component={Home} />
            <Route exact path="/" component={RootRedirect} />
            <Route path="*">
              <Redirect to="/" />
            </Route>
          </Switch>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  </AuthProvider>
);

export default App;
