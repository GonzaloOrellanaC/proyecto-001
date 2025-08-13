import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonGrid, IonRow, IonCol, IonItem, IonLabel, IonInput, IonList, IonIcon } from '@ionic/react';
import { addCircleOutline } from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import OrganizationsList from '../components/OrganizationsList';
import PageContainer from '../components/PageContainer';
import BackToDashboardButton from '../components/BackToDashboardButton';

const Stores: React.FC = () => {
  const { user, logout } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [stores, setStores] = useState<any[]>([]);
  const [newStore, setNewStore] = useState({ name: '', code: '', address: '', lat: '', lng: '' });

  useEffect(() => {
    api.listRoles().then(r => {
      const superRole = r.roles.find((ro: any) => ro.key === 'super-admin');
      const roleId = (user as any)?.roleId ? String((user as any).roleId) : null;
      setIsSuperAdmin(Boolean(superRole && roleId && String(superRole._id) === roleId));
    }).catch(() => setIsSuperAdmin(false));
    // Load orgs based on role
    const loadOrgs = async () => {
      try {
        const res = await api.listMyAdminOrganizations();
        setOrganizations(res.organizations);
        if (res.organizations.length) setSelectedOrgId(res.organizations[0]._id);
      } catch {}
      try {
        // If super admin, override with all orgs
        const all = await api.listOrganizations();
        if (all?.organizations?.length) {
          setOrganizations(all.organizations);
          setSelectedOrgId(prev => prev || all.organizations[0]._id);
        }
      } catch {}
    };
    loadOrgs();
  }, [user?._id]);

  useEffect(() => {
    if (!selectedOrgId) { setStores([]); return; }
    api.listStores(selectedOrgId).then(r => setStores(r.stores)).catch(() => setStores([]));
  }, [selectedOrgId]);

  const createStore = async () => {
    if (!selectedOrgId) return;
    const lat = newStore.lat ? Number(newStore.lat) : undefined;
    const lng = newStore.lng ? Number(newStore.lng) : undefined;
    const res = await api.createStore({ orgId: selectedOrgId, name: newStore.name, code: newStore.code || undefined, address: newStore.address || undefined, lat, lng });
    setStores(s => [res.store, ...s]);
    setNewStore({ name: '', code: '', address: '', lat: '', lng: '' });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Locales (Tiendas)</IonTitle>
          <BackToDashboardButton slot="start" label="Inicio" />
          <IonButtons slot="end"><IonButton color="medium" onClick={logout}>Salir</IonButton></IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <PageContainer>
          {isSuperAdmin && (
            <OrganizationsList organizations={organizations} selectable selectedId={selectedOrgId} onSelect={setSelectedOrgId} />
          )}

        <h2>Nueva tienda {selectedOrgId ? '' : '(selecciona una organización)'}</h2>
        <IonGrid>
          <IonRow>
            <IonCol size="12" sizeMd="6"><IonItem><IonLabel position="stacked">Nombre</IonLabel><IonInput value={newStore.name} onIonChange={e=>setNewStore(s=>({...s, name: e.detail.value||''}))} /></IonItem></IonCol>
            <IonCol size="6" sizeMd="3"><IonItem><IonLabel position="stacked">Código</IonLabel><IonInput value={newStore.code} onIonChange={e=>setNewStore(s=>({...s, code: e.detail.value||''}))} /></IonItem></IonCol>
            <IonCol size="6" sizeMd="3"><IonItem><IonLabel position="stacked">Dirección</IonLabel><IonInput value={newStore.address} onIonChange={e=>setNewStore(s=>({...s, address: e.detail.value||''}))} /></IonItem></IonCol>
            <IonCol size="6" sizeMd="3"><IonItem><IonLabel position="stacked">Lat</IonLabel><IonInput type="number" value={newStore.lat} onIonChange={e=>setNewStore(s=>({...s, lat: e.detail.value||''}))} /></IonItem></IonCol>
            <IonCol size="6" sizeMd="3"><IonItem><IonLabel position="stacked">Lng</IonLabel><IonInput type="number" value={newStore.lng} onIonChange={e=>setNewStore(s=>({...s, lng: e.detail.value||''}))} /></IonItem></IonCol>
            <IonCol size="12" className="ion-text-right"><IonButton onClick={createStore} disabled={!selectedOrgId}><IonIcon slot="start" icon={addCircleOutline} />Crear</IonButton></IonCol>
          </IonRow>
        </IonGrid>
        <h2 className="ion-margin-top">Tiendas</h2>
  <IonList>
          {stores.map(s => (
            <IonItem key={s._id}>
              <IonLabel>
                <h3>{s.name} {s.code ? `(${s.code})` : ''}</h3>
                <p>{s.address || ''}</p>
                <p>{s?.location?.coordinates ? `Lng: ${s.location.coordinates[0]}, Lat: ${s.location.coordinates[1]}` : ''}</p>
              </IonLabel>
            </IonItem>
          ))}
  </IonList>
  </PageContainer>
      </IonContent>
    </IonPage>
  );
};

export default Stores;
