import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useHistory } from 'react-router-dom';
import PageContainer from '../components/PageContainer';

const SellerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const history = useHistory();
  const [orgs, setOrgs] = useState<any[]>([]);

  useEffect(() => {
    api.listMyOrganizations().then(r => setOrgs(r.organizations)).catch(() => setOrgs([]));
  }, []);

  const startPOS = (orgId: string) => {
    history.push(`/pos/${orgId}`);
  };
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Selecciona negocio - {user?.name}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <PageContainer>
          <p>Elige con qué organización vas a operar hoy:</p>
          <IonList>
            {orgs.map(o => (
              <IonItem key={o._id} button onClick={() => startPOS(o._id)}>
                <IonLabel>
                  <h3>{o.name}</h3>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
          <IonButton color="medium" onClick={logout} className="ion-margin-top">Salir</IonButton>
        </PageContainer>
      </IonContent>
    </IonPage>
  );
};

export default SellerDashboard;
