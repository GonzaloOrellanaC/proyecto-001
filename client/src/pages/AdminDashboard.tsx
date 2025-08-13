import React, { useEffect, useMemo, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonSegment, IonSegmentButton, IonLabel, IonList, IonItem, IonInput, IonGrid, IonRow, IonCol, IonIcon, IonTextarea, IonButtons, IonSelect, IonSelectOption } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { addCircleOutline, saveOutline } from 'ionicons/icons';
import OrganizationsList from '../components/OrganizationsList';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<'stores'|'products'|'users'|'roles'>('stores');
  // Organization selection to scope stores/products
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');

  // Stores state
  const [stores, setStores] = useState<any[]>([]);
  const [newStore, setNewStore] = useState({ name: '', code: '', address: '', lat: '', lng: '' });

  // Products state
  const [products, setProducts] = useState<any[]>([]);
  const [newProduct, setNewProduct] = useState({ sku: '', name: '', price: '' });

  // Users + Orgs linking
  const [users, setUsers] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [newSeller, setNewSeller] = useState({ name: '', email: '', password: '' });
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);
  const [selectedOrgForStores, setSelectedOrgForStores] = useState<string>('');
  const [storesForSelectedOrg, setStoresForSelectedOrg] = useState<any[]>([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);

  // Roles
  const [roles, setRoles] = useState<any[]>([]);
  const [newRole, setNewRole] = useState({ key: '', name: '', description: '' });
  // Super admin gate (role.key === 'super-admin')
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');

  useEffect(() => {
    if (tab === 'stores') api.listStores(selectedOrgId || '000000000000000000000000').then(r => setStores(r.stores)).catch(() => {});
    if (tab === 'products') api.listProducts(selectedOrgId || '000000000000000000000000').then(r => setProducts(r.products)).catch(() => {});
    if (tab === 'users') {
      api.listUsers().then(r => setUsers(r.users)).catch(() => {});
      const loadOrgs = async () => {
        try {
          const r = isSuperAdmin ? await api.listOrganizations() : await api.listMyAdminOrganizations();
          setOrganizations(r.organizations);
        } catch { /* noop */ }
      };
      loadOrgs();
    }
    if (tab === 'roles') api.listRoles().then(r => setRoles(r.roles)).catch(() => {});
  }, [tab, selectedOrgId, isSuperAdmin]);

  // Resolve if current user is super-admin by comparing their roleId to Role.key === 'super-admin'
  useEffect(() => {
    api.listRoles()
      .then(r => {
        setRoles(prev => prev.length ? prev : r.roles);
        const superRole = r.roles.find((ro: any) => ro.key === 'super-admin');
        const roleId = (user as any)?.roleId ? String((user as any).roleId) : null;
        setIsSuperAdmin(Boolean(superRole && roleId && String(superRole._id) === roleId));
        if (superRole && roleId && String(superRole._id) === roleId) {
          // Preload orgs for super admin convenience
          api.listOrganizations().then(x => {
            setOrganizations(x.organizations);
            if (!selectedOrgId && x.organizations.length) setSelectedOrgId(x.organizations[0]._id);
          }).catch(() => {});
        } else {
          // Load organizations where current user is admin
          api.listMyAdminOrganizations().then(x => {
            setOrganizations(x.organizations);
            if (!selectedOrgId && x.organizations.length) setSelectedOrgId(x.organizations[0]._id);
          }).catch(() => {});
        }
      })
      .catch(() => setIsSuperAdmin(false));
  }, [user?._id]);

  useEffect(() => {
    if (tab !== 'users') return;
    if (!selectedOrgForStores) { setStoresForSelectedOrg([]); return; }
    api.listStores(selectedOrgForStores).then(r => setStoresForSelectedOrg(r.stores)).catch(() => setStoresForSelectedOrg([]));
  }, [tab, selectedOrgForStores]);

  const createStore = async () => {
    const lat = newStore.lat ? Number(newStore.lat) : undefined;
    const lng = newStore.lng ? Number(newStore.lng) : undefined;
    if (!selectedOrgId) return;
    const res = await api.createStore({ orgId: selectedOrgId, name: newStore.name, code: newStore.code || undefined, address: newStore.address || undefined, lat, lng });
    setStores(s => [res.store, ...s]);
    setNewStore({ name: '', code: '', address: '', lat: '', lng: '' });
  };

  const createProduct = async () => {
    const price = Number(newProduct.price || '0');
    if (!selectedOrgId) return;
    const res = await api.createProduct({ orgId: selectedOrgId, sku: newProduct.sku, name: newProduct.name, price });
    setProducts(p => [res.product, ...p]);
    setNewProduct({ sku: '', name: '', price: '' });
  };

  const createRole = async () => {
    const res = await api.createRole({ key: newRole.key, name: newRole.name, description: newRole.description || undefined });
    setRoles(r => [res.role, ...r]);
    setNewRole({ key: '', name: '', description: '' });
  };

  const createSeller = async () => {
    const res = await api.createUser({ name: newSeller.name, email: newSeller.email, password: newSeller.password, role: 'cashier' });
    if (res?.ok) {
      setUsers(u => [res.user, ...u]);
      setNewSeller({ name: '', email: '', password: '' });
    }
  };

  const toggleOrgSelection = (orgId: string) => {
    setSelectedOrgIds(prev => prev.includes(orgId) ? prev.filter(id => id !== orgId) : [...prev, orgId]);
  };

  const linkSellerToOrgs = async () => {
    if (!selectedUserId || selectedOrgIds.length === 0) return;
    await api.linkUserToOrganizations(selectedUserId, selectedOrgIds, 'cashier');
    setSelectedOrgIds([]);
  };

  const toggleStoreSelection = (storeId: string) => {
    setSelectedStoreIds(prev => prev.includes(storeId) ? prev.filter(id => id !== storeId) : [...prev, storeId]);
  };

  const linkSellerToStores = async () => {
    if (!selectedUserId || selectedStoreIds.length === 0) return;
    await api.linkUserToStores(selectedUserId, selectedStoreIds);
    setSelectedStoreIds([]);
  };

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
          <IonTitle>Admin - {user?.name}</IonTitle>
          <IonButtons slot="end"><IonButton color="medium" onClick={logout}>Salir</IonButton></IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {isSuperAdmin && (
          <>
            <h2>Crear organización (Super Admin)</h2>
            <IonGrid>
              <IonRow>
                <IonCol size="12" sizeMd="9">
                  <IonItem>
                    <IonLabel position="stacked">Nombre de la organización</IonLabel>
                    <IonInput value={newOrgName} onIonChange={e=>setNewOrgName(e.detail.value||'')} />
                  </IonItem>
                </IonCol>
                <IonCol size="12" sizeMd="3" className="ion-text-right">
                  <IonButton className="ion-margin-top" onClick={createOrganization}><IonIcon icon={addCircleOutline} slot="start" />Crear</IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          </>
        )}

  {/* Listado de organizaciones visibles según permisos: selectable to scope tabs */}
  <OrganizationsList organizations={organizations} selectable selectedId={selectedOrgId} onSelect={setSelectedOrgId} />
        <IonSegment value={tab} onIonChange={(e) => setTab((e.detail.value as any) || 'stores')}>
          <IonSegmentButton value="stores"><IonLabel>Tiendas</IonLabel></IonSegmentButton>
          <IonSegmentButton value="products"><IonLabel>Productos</IonLabel></IonSegmentButton>
          <IonSegmentButton value="users"><IonLabel>Usuarios</IonLabel></IonSegmentButton>
          <IonSegmentButton value="roles"><IonLabel>Roles</IonLabel></IonSegmentButton>
        </IonSegment>

        {tab === 'stores' && (
          <>
            <h2>Nueva tienda {selectedOrgId ? '' : '(selecciona una organización)'} </h2>
            <IonGrid>
              <IonRow>
                <IonCol size="12" sizeMd="6"><IonItem><IonLabel position="stacked">Nombre</IonLabel><IonInput value={newStore.name} onIonChange={e=>setNewStore(s=>({...s, name: e.detail.value||''}))} /></IonItem></IonCol>
                <IonCol size="6" sizeMd="3"><IonItem><IonLabel position="stacked">Código</IonLabel><IonInput value={newStore.code} onIonChange={e=>setNewStore(s=>({...s, code: e.detail.value||''}))} /></IonItem></IonCol>
                <IonCol size="6" sizeMd="3"><IonItem><IonLabel position="stacked">Dirección</IonLabel><IonInput value={newStore.address} onIonChange={e=>setNewStore(s=>({...s, address: e.detail.value||''}))} /></IonItem></IonCol>
                <IonCol size="6" sizeMd="3"><IonItem><IonLabel position="stacked">Lat</IonLabel><IonInput type="number" value={newStore.lat} onIonChange={e=>setNewStore(s=>({...s, lat: e.detail.value||''}))} /></IonItem></IonCol>
                <IonCol size="6" sizeMd="3"><IonItem><IonLabel position="stacked">Lng</IonLabel><IonInput type="number" value={newStore.lng} onIonChange={e=>setNewStore(s=>({...s, lng: e.detail.value||''}))} /></IonItem></IonCol>
                <IonCol size="12" className="ion-text-right"><IonButton onClick={createStore} disabled={!selectedOrgId}><IonIcon icon={addCircleOutline} slot="start" />Crear</IonButton></IonCol>
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
          </>
        )}

        {tab === 'products' && (
          <>
            <h2>Nuevo producto {selectedOrgId ? '' : '(selecciona una organización)'} </h2>
            <IonGrid>
              <IonRow>
                <IonCol size="12" sizeMd="4"><IonItem><IonLabel position="stacked">SKU</IonLabel><IonInput value={newProduct.sku} onIonChange={e=>setNewProduct(p=>({...p, sku: e.detail.value||''}))} /></IonItem></IonCol>
                <IonCol size="12" sizeMd="4"><IonItem><IonLabel position="stacked">Nombre</IonLabel><IonInput value={newProduct.name} onIonChange={e=>setNewProduct(p=>({...p, name: e.detail.value||''}))} /></IonItem></IonCol>
                <IonCol size="12" sizeMd="4"><IonItem><IonLabel position="stacked">Precio</IonLabel><IonInput type="number" value={newProduct.price} onIonChange={e=>setNewProduct(p=>({...p, price: e.detail.value||''}))} /></IonItem></IonCol>
                <IonCol size="12" className="ion-text-right"><IonButton onClick={createProduct} disabled={!selectedOrgId}><IonIcon icon={addCircleOutline} slot="start" />Crear</IonButton></IonCol>
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
          </>
        )}

        {tab === 'users' && (
          <>
            <h2>Crear vendedor</h2>
            <IonGrid>
              <IonRow>
                <IonCol size="12" sizeMd="4"><IonItem><IonLabel position="stacked">Nombre</IonLabel><IonInput value={newSeller.name} onIonChange={e=>setNewSeller(s=>({...s, name: e.detail.value||''}))} /></IonItem></IonCol>
                <IonCol size="12" sizeMd="4"><IonItem><IonLabel position="stacked">Email</IonLabel><IonInput value={newSeller.email} onIonChange={e=>setNewSeller(s=>({...s, email: e.detail.value||''}))} /></IonItem></IonCol>
                <IonCol size="12" sizeMd="4"><IonItem><IonLabel position="stacked">Contraseña</IonLabel><IonInput type="password" value={newSeller.password} onIonChange={e=>setNewSeller(s=>({...s, password: e.detail.value||''}))} /></IonItem></IonCol>
                <IonCol size="12" className="ion-text-right"><IonButton onClick={createSeller}><IonIcon icon={addCircleOutline} slot="start" />Crear vendedor</IonButton></IonCol>
              </IonRow>
            </IonGrid>

            <h2 className="ion-margin-top">Asociar vendedor a negocios</h2>
            <IonGrid>
              <IonRow>
                <IonCol size="12" sizeMd="6">
                  <IonItem>
                    <IonLabel position="stacked">Usuario</IonLabel>
                    <IonSelect placeholder="Selecciona usuario" value={selectedUserId} onIonChange={e=>setSelectedUserId(String(e.detail.value||''))}>
                      {users.map(u => (
                        <IonSelectOption key={u._id} value={u._id}>{u.name} ({u.email})</IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonItem>
                </IonCol>
                <IonCol size="12" sizeMd="6">
                  <IonLabel>Negocios</IonLabel>
                  <IonList>
                    {organizations.map(o => (
                      <IonItem key={o._id} button onClick={()=>toggleOrgSelection(o._id)}>
                        <IonLabel>{selectedOrgIds.includes(o._id) ? '✅ ' : ''}{o.name}</IonLabel>
                      </IonItem>
                    ))}
                  </IonList>
                  <IonButton className="ion-margin-top" onClick={linkSellerToOrgs} disabled={!selectedUserId || selectedOrgIds.length===0}>Asociar</IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>

            <h2 className="ion-margin-top">Asociar vendedor a tiendas</h2>
            <IonGrid>
              <IonRow>
                <IonCol size="12" sizeMd="6">
                  <IonItem>
                    <IonLabel position="stacked">Organización</IonLabel>
                    <IonSelect placeholder="Selecciona organización" value={selectedOrgForStores} onIonChange={e=>{ setSelectedOrgForStores(String(e.detail.value||'')); setSelectedStoreIds([]); }}>
                      {organizations.map(o => (
                        <IonSelectOption key={o._id} value={o._id}>{o.name}</IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonItem>
                </IonCol>
                <IonCol size="12" sizeMd="6">
                  <IonLabel>Tiendas</IonLabel>
                  <IonList>
                    {storesForSelectedOrg.map(s => (
                      <IonItem key={s._id} button onClick={()=>toggleStoreSelection(s._id)}>
                        <IonLabel>{selectedStoreIds.includes(s._id) ? '✅ ' : ''}{s.name} {s.code ? `(${s.code})` : ''}</IonLabel>
                      </IonItem>
                    ))}
                  </IonList>
                  <IonButton className="ion-margin-top" onClick={linkSellerToStores} disabled={!selectedUserId || selectedStoreIds.length===0}>Asociar a tiendas</IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>

            <h2 className="ion-margin-top">Usuarios</h2>
            <IonList>
              {users.map(u => (
                <IonItem key={u._id}>
                  <IonLabel>
                    <h3>{u.name} ({u.email})</h3>
                    <p>Rol: {u.role}</p>
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
          </>
        )}

        {tab === 'roles' && (
          <>
            <h2>Nuevo rol</h2>
            <IonGrid>
              <IonRow>
                <IonCol size="12" sizeMd="4"><IonItem><IonLabel position="stacked">Key</IonLabel><IonInput value={newRole.key} onIonChange={e=>setNewRole(r=>({...r, key: e.detail.value||''}))} /></IonItem></IonCol>
                <IonCol size="12" sizeMd="4"><IonItem><IonLabel position="stacked">Nombre</IonLabel><IonInput value={newRole.name} onIonChange={e=>setNewRole(r=>({...r, name: e.detail.value||''}))} /></IonItem></IonCol>
                <IonCol size="12" sizeMd="4"><IonItem><IonLabel position="stacked">Descripción</IonLabel><IonTextarea value={newRole.description} onIonChange={e=>setNewRole(r=>({...r, description: e.detail.value||''}))} /></IonItem></IonCol>
                <IonCol size="12" className="ion-text-right"><IonButton onClick={createRole}><IonIcon icon={saveOutline} slot="start" />Guardar</IonButton></IonCol>
              </IonRow>
            </IonGrid>
            <h2 className="ion-margin-top">Roles</h2>
            <IonList>
              {roles.map(r => (
                <IonItem key={r._id}>
                  <IonLabel>
                    <h3>{r.name} ({r.key})</h3>
                    <p>{r.description}</p>
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default AdminDashboard;
