import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonGrid, IonRow, IonCol, IonItem, IonLabel, IonInput, IonList, IonIcon } from '@ionic/react';
import { addCircleOutline } from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import OrganizationsList from '../components/OrganizationsList';
import PageContainer from '../components/PageContainer';
import BackToDashboardButton from '../components/BackToDashboardButton';

const Products: React.FC = () => {
  const { user, logout } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [newProduct, setNewProduct] = useState({ sku: '', name: '', price: '' });

  useEffect(() => {
    api.listRoles().then(r => {
      const superRole = r.roles.find((ro: any) => ro.key === 'super-admin');
      const roleId = (user as any)?.roleId ? String((user as any).roleId) : null;
      setIsSuperAdmin(Boolean(superRole && roleId && String(superRole._id) === roleId));
    }).catch(() => setIsSuperAdmin(false));

    const loadOrgs = async () => {
      try {
        const res = await api.listMyAdminOrganizations();
        setOrganizations(res.organizations);
        if (res.organizations.length) setSelectedOrgId(res.organizations[0]._id);
      } catch {}
      try {
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
    if (!selectedOrgId) { setProducts([]); return; }
    api.listProducts(selectedOrgId).then(r => setProducts(r.products)).catch(() => setProducts([]));
  }, [selectedOrgId]);

  const createProduct = async () => {
    if (!selectedOrgId) return;
    const price = Number(newProduct.price || '0');
    const res = await api.createProduct({ orgId: selectedOrgId, sku: newProduct.sku, name: newProduct.name, price });
    setProducts(p => [res.product, ...p]);
    setNewProduct({ sku: '', name: '', price: '' });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Productos</IonTitle>
          <BackToDashboardButton slot="start" label="Inicio" />
          <IonButtons slot="end"><IonButton color="medium" onClick={logout}>Salir</IonButton></IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <PageContainer>
          {isSuperAdmin && (
            <OrganizationsList organizations={organizations} selectable selectedId={selectedOrgId} onSelect={setSelectedOrgId} />
          )}
        <h2>Nuevo producto {selectedOrgId ? '' : '(selecciona una organización)'} </h2>
        <IonGrid>
          <IonRow>
            <IonCol size="12" sizeMd="4"><IonItem><IonLabel position="stacked">SKU</IonLabel><IonInput value={newProduct.sku} onIonChange={e=>setNewProduct(p=>({...p, sku: e.detail.value||''}))} /></IonItem></IonCol>
            <IonCol size="12" sizeMd="4"><IonItem><IonLabel position="stacked">Nombre</IonLabel><IonInput value={newProduct.name} onIonChange={e=>setNewProduct(p=>({...p, name: e.detail.value||''}))} /></IonItem></IonCol>
            <IonCol size="12" sizeMd="4"><IonItem><IonLabel position="stacked">Precio</IonLabel><IonInput type="number" value={newProduct.price} onIonChange={e=>setNewProduct(p=>({...p, price: e.detail.value||''}))} /></IonItem></IonCol>
            <IonCol size="12" className="ion-text-right"><IonButton onClick={createProduct} disabled={!selectedOrgId}><IonIcon slot="start" icon={addCircleOutline} />Crear</IonButton></IonCol>
          </IonRow>
        </IonGrid>
        <h2 className="ion-margin-top">Productos</h2>
  <IonList>
          {products.map(p => (
            <IonItem key={p._id}>
              <IonLabel>
                <h3>{p.name}</h3>
                <p>SKU: {p.sku} • ${p.price}</p>
              </IonLabel>
            </IonItem>
          ))}
  </IonList>
  </PageContainer>
      </IonContent>
    </IonPage>
  );
};

export default Products;
