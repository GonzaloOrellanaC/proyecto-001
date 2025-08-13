import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonModal, IonSelect, IonSelectOption } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useHistory } from 'react-router-dom';
import PageContainer from '../components/PageContainer';

const SellerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const history = useHistory();
  const [orgs, setOrgs] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [showStoreModal, setShowStoreModal] = useState(false);

  useEffect(() => {
    api.listMyOrganizations().then(r => setOrgs(r.organizations)).catch(() => setOrgs([]));
  }, []);

  const startPOS = (orgId: string) => {
    setSelectedOrg(orgId);
    setSelectedStore('');
    api.listStores(orgId).then(r => { setStores(r.stores || []); setShowStoreModal(true); }).catch(() => setStores([]));
  };
  const confirmStore = () => {
    if (!selectedOrg || !selectedStore) return;
    setShowStoreModal(false);
    history.push(`/pos/${selectedOrg}?storeId=${encodeURIComponent(selectedStore)}`);
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
          <IonModal isOpen={showStoreModal} onDidDismiss={() => setShowStoreModal(false)}>
            <div className="ion-padding">
              <h2>Selecciona la tienda</h2>
              <IonSelect value={selectedStore} placeholder="Elige una tienda" onIonChange={e => setSelectedStore(String(e.detail.value))}>
                {stores.map(s => (
                  <IonSelectOption key={s._id} value={s._id}>{s.name}</IonSelectOption>
                ))}
              </IonSelect>
              <div className="ion-margin-top">
                <IonButton color="medium" onClick={() => setShowStoreModal(false)}>Cancelar</IonButton>
                <IonButton color="primary" onClick={confirmStore} className="ion-margin-start" disabled={!selectedStore}>Continuar</IonButton>
              </div>
            </div>
          </IonModal>
        </PageContainer>
      </IonContent>
    </IonPage>
  );
};

export default SellerDashboard;
