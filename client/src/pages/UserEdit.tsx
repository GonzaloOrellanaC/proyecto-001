import React, { useEffect, useMemo, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption } from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import PageContainer from '../components/PageContainer';
import BackToDashboardButton from '../components/BackToDashboardButton';

type RouteParams = { userId: string };

const UserEdit: React.FC = () => {
  const { user: sessionUser, logout } = useAuth();
  const { userId } = useParams<RouteParams>();
  const isCreate = !userId || userId === 'new';
  const history = useHistory();

  const [roles, setRoles] = useState<any[]>([]);
  const [roleId, setRoleId] = useState<string>('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userRec, setUserRec] = useState<any | null>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'cashier'>('cashier');
  const [orgId, setOrgId] = useState('');
  const [storeIds, setStoreIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // roles for detecting super-admin
    api.listRoles().then(r => setRoles(r.roles)).catch(() => setRoles([]));
  }, []);

  useEffect(() => {
    if (!roles || roles.length === 0 || !sessionUser) return;
  const sa = roles.find((ro: any) => ro.key === 'super-admin');
    const roleId = (sessionUser as any)?.roleId ? String((sessionUser as any).roleId) : null;
    setIsSuperAdmin(Boolean(sa && roleId && String(sa._id) === roleId));
  }, [roles, sessionUser]);

  // Load for edit mode; if create, stay in create mode
  useEffect(() => {
    if (isCreate) { setUserRec(null); return; }
    api.listUsers().then(r => {
      const found = r.users.find(u => u._id === userId) || null;
      setUserRec(found);
      if (found) {
        setName(found.name || '');
        setEmail(found.email || '');
        setRole((found.role === 'admin' || found.role === 'cashier') ? found.role : 'cashier');
  if (found.roleId) setRoleId(String(found.roleId));
      }
    }).catch(() => setUserRec(null));
  }, [userId, isCreate]);

  // Load organizations available
  useEffect(() => {
    const loadOrgs = async () => {
      try {
        // admins get their orgs
        const mine = await api.listMyAdminOrganizations();
        setOrganizations(mine.organizations || []);
      } catch { setOrganizations([]); }
      if (isSuperAdmin) {
        try {
          const all = await api.listOrganizations();
          if (all?.organizations?.length) setOrganizations(all.organizations);
        } catch {}
      }
    };
    loadOrgs();
  }, [isSuperAdmin]);

  const defaultAdminOrgId = useMemo(() => (organizations && organizations.length > 0 ? organizations[0]._id : ''), [organizations]);

  // Apply default org for admin when ready
  useEffect(() => {
    if (!isSuperAdmin) setOrgId(defaultAdminOrgId);
  }, [isSuperAdmin, defaultAdminOrgId]);

  // Load stores when org changes
  useEffect(() => {
    if (!orgId) { setStores([]); setStoreIds([]); return; }
    api.listStores(orgId).then(r => setStores(r.stores)).catch(() => setStores([]));
    setStoreIds([]);
  }, [orgId]);

  // Preload existing org and stores links for the user when record is ready
  useEffect(() => {
    if (!userRec) return;
    // Preselect first org link; for multi-org support, UX could be expanded later
    api.listOrganizationsByUser(userRec._id).then(async ({ links }) => {
      const userOrgIds = (links || []).map(l => String(l.orgId));
      if (userOrgIds.length > 0) {
        const first = userOrgIds[0];
        setOrgId(prev => (isSuperAdmin ? (prev || first) : prev));
        // Load stores for org and then preselect
        try {
          const r = await api.listStores(first);
          setStores(r.stores);
          const storeLinks = await api.listStoresByUser(userRec._id);
          const userStoreIds = (storeLinks.links || []).map(l => String(l.storeId));
          setStoreIds(userStoreIds);
        } catch {
          // ignore
        }
      }
    }).catch(() => {});
  }, [userRec, isSuperAdmin]);

  const save = async () => {
    setSaving(true);
    try {
      let targetUserId = userRec?._id as string | undefined;
      // Create mode
      if (isCreate || !targetUserId) {
        const created = await api.createUser({ name, email, password, role, roleId: roleId || undefined });
        targetUserId = created.user._id;
      } else {
        const updated = await api.updateUser(targetUserId, { name, role, roleId: roleId || undefined });
        setUserRec(updated.user);
      }
      if (orgId && targetUserId) await api.linkUserToOrganizations(targetUserId, [orgId], role);
      if (storeIds.length && targetUserId) await api.linkUserToStores(targetUserId, storeIds);
      history.replace('/manage/users');
    } finally {
      setSaving(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Editar usuario</IonTitle>
          <BackToDashboardButton slot="start" label="Inicio" />
          <IonButtons slot="end"><IonButton color="medium" onClick={logout}>Salir</IonButton></IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <PageContainer>
          {!isCreate && !userRec ? (
            <p>Usuario no encontrado o no autorizado.</p>
          ) : (
            <>
              <IonItem>
                <IonLabel position="stacked">Nombre</IonLabel>
                <IonInput value={name} onIonChange={e => setName(e.detail.value || '')} />
              </IonItem>
              {isCreate && (
                <>
                  <IonItem>
                    <IonLabel position="stacked">Email</IonLabel>
                    <IonInput value={email} onIonChange={e => setEmail(e.detail.value || '')} />
                  </IonItem>
                  <IonItem>
                    <IonLabel position="stacked">Contraseña</IonLabel>
                    <IonInput type="password" value={password} onIonChange={e => setPassword(e.detail.value || '')} />
                  </IonItem>
                </>
              )}
              <IonItem>
                <IonLabel position="stacked">Email</IonLabel>
                <IonInput value={isCreate ? email : (userRec?.email || '')} readonly={!isCreate} />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Rol</IonLabel>
                <IonSelect value={role} onIonChange={e => setRole((e.detail.value as 'admin'|'cashier') || 'cashier')}>
                  <IonSelectOption value="admin">Admin</IonSelectOption>
                  <IonSelectOption value="cashier">Cashier</IonSelectOption>
                </IonSelect>
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Perfil (RoleId)</IonLabel>
                <IonSelect value={roleId} onIonChange={e => setRoleId(String(e.detail.value || ''))} placeholder="Selecciona perfil de permisos">
                  {roles.map(r => (
                    <IonSelectOption key={r._id} value={r._id}>{r.name} ({r.key})</IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Organización</IonLabel>
                {isSuperAdmin ? (
                  <IonSelect placeholder="Selecciona organización" value={orgId} onIonChange={e => setOrgId(String(e.detail.value || ''))}>
                    {organizations.map(o => (
                      <IonSelectOption key={o._id} value={o._id}>{o.name}</IonSelectOption>
                    ))}
                  </IonSelect>
                ) : (
                  <IonSelect disabled placeholder="Se usa tu organización por defecto" value={defaultAdminOrgId}>
                    {organizations.map(o => (
                      <IonSelectOption key={o._id} value={o._id}>{o.name}</IonSelectOption>
                    ))}
                  </IonSelect>
                )}
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Locales</IonLabel>
                <IonSelect multiple disabled={!orgId || stores.length === 0} value={storeIds} onIonChange={e => {
                  const v = e.detail.value;
                  setStoreIds(Array.isArray(v) ? v.map(String) : (v ? [String(v)] : []));
                }} placeholder={!orgId ? 'Selecciona una organización primero' : (stores.length === 0 ? 'No hay locales para esta organización' : 'Selecciona locales')}>
                  {stores.map(s => (
                    <IonSelectOption key={s._id} value={s._id}>{s.name}{s.code ? ` (${s.code})` : ''}</IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              <div className="ion-margin-top">
                <IonButton onClick={save} disabled={saving}>Guardar</IonButton>
                <IonButton color="medium" className="ion-margin-start" onClick={() => history.replace('/manage/users')} disabled={saving}>Cancelar</IonButton>
              </div>
            </>
          )}
        </PageContainer>
      </IonContent>
    </IonPage>
  );
};

export default UserEdit;
