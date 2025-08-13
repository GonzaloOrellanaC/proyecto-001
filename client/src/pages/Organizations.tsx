import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonGrid, IonRow, IonCol, IonItem, IonLabel, IonInput, IonText, IonIcon } from '@ionic/react';
import { addCircleOutline } from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import OrganizationsList from '../components/OrganizationsList';
import { useHistory } from 'react-router-dom';
import PageContainer from '../components/PageContainer';
import BackToDashboardButton from '../components/BackToDashboardButton';

const Organizations: React.FC = () => {
  const { user, logout } = useAuth();
  const history = useHistory();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [newOrgName, setNewOrgName] = useState('');

  useEffect(() => {
    api.listRoles().then(r => {
      const superRole = r.roles.find((ro: any) => ro.key === 'super-admin');
      const roleId = (user as any)?.roleId ? String((user as any).roleId) : null;
      const ok = Boolean(superRole && roleId && String(superRole._id) === roleId);
      setIsSuperAdmin(ok);
      if (!ok) history.replace('/dashboard');
    }).catch(() => history.replace('/dashboard'));
  }, [user?._id]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    api.listOrganizations().then(r => setOrganizations(r.organizations)).catch(() => setOrganizations([]));
  }, [isSuperAdmin]);

  const createOrganization = async () => {
    if (!newOrgName.trim()) return;
    const res = await api.createOrganization({ name: newOrgName.trim() }).catch(() => null);
    if (res?.ok) {
      setOrganizations(list => [res.organization, ...list]);
      setNewOrgName('');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Organizaciones</IonTitle>
          <BackToDashboardButton slot="start" label="Inicio" />
          <IonButtons slot="end"><IonButton color="medium" onClick={logout}>Salir</IonButton></IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <PageContainer>
        {!isSuperAdmin && (
          <IonText color="danger">No autorizado</IonText>
        )}
        {isSuperAdmin && (
          <>
            <h2>Crear organización</h2>
            <IonGrid>
              <IonRow>
                <IonCol size="12" sizeMd="9">
                  <IonItem>
                    <IonLabel position="stacked">Nombre de la organización</IonLabel>
                    <IonInput value={newOrgName} onIonChange={e=>setNewOrgName(e.detail.value||'')} />
                  </IonItem>
                </IonCol>
                <IonCol size="12" sizeMd="3" className="ion-text-right">
                  <IonButton className="ion-margin-top" onClick={createOrganization}><IonIcon slot="start" icon={addCircleOutline} />Crear</IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
            <OrganizationsList organizations={organizations} />
          </>
        )}
        </PageContainer>
      </IonContent>
    </IonPage>
  );
};

export default Organizations;
