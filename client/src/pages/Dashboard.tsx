import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonLabel, IonIcon } from '@ionic/react';
import { businessOutline, storefrontOutline, peopleOutline, pricetagOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import PageContainer from '../components/PageContainer';

const Dashboard: React.FC = () => {
  const { user, logout, permissions } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    // Determine super-admin using roles list and user.roleId
    api.listRoles().then(r => {
      const superRole = r.roles.find((ro: any) => ro.key === 'super-admin');
      const roleId = (user as any)?.roleId ? String((user as any).roleId) : null;
      setIsSuperAdmin(Boolean(superRole && roleId && String(superRole._id) === roleId));
    }).catch(() => setIsSuperAdmin(false));
  }, [user?._id]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Panel de gestión</IonTitle>
          <IonButtons slot="end"><IonButton color="medium" onClick={logout}>Salir</IonButton></IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <PageContainer>
          <IonList>
          {(isSuperAdmin || permissions.includes('manage-organizations')) && (
            <IonItem routerLink="/manage/organizations" detail>
              <IonIcon icon={businessOutline} slot="start" />
              <IonLabel>Organizaciones</IonLabel>
            </IonItem>
          )}
          {(isSuperAdmin || permissions.includes('manage-stores')) && (
          <IonItem routerLink="/manage/stores" detail>
            <IonIcon icon={storefrontOutline} slot="start" />
            <IonLabel>Locales (Tiendas)</IonLabel>
          </IonItem>
          )}
          {(isSuperAdmin || permissions.includes('manage-users')) && (
          <IonItem routerLink="/manage/users" detail>
            <IonIcon icon={peopleOutline} slot="start" />
            <IonLabel>Usuarios</IonLabel>
          </IonItem>
          )}
          {(isSuperAdmin || permissions.includes('manage-products')) && (
          <IonItem routerLink="/manage/products" detail>
            <IonIcon icon={pricetagOutline} slot="start" />
            <IonLabel>Productos</IonLabel>
          </IonItem>
          )}
          {(isSuperAdmin || permissions.includes('manage-roles')) && (
          <IonItem routerLink="/manage/roles" detail>
            <IonIcon icon={shieldCheckmarkOutline} slot="start" />
            <IonLabel>Roles</IonLabel>
          </IonItem>
          )}
          </IonList>
        </PageContainer>
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
