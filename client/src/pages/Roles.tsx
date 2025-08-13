import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonGrid, IonRow, IonCol, IonItem, IonLabel, IonInput, IonTextarea, IonList, IonIcon, IonSelect, IonSelectOption, IonCheckbox } from '@ionic/react';
import { saveOutline } from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import PageContainer from '../components/PageContainer';
import BackToDashboardButton from '../components/BackToDashboardButton';

const Roles: React.FC = () => {
  const { logout } = useAuth();
  const [roles, setRoles] = useState<any[]>([]);
  const [newRole, setNewRole] = useState({ key: '', name: '', description: '', permissions: [] as string[] });
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [editRole, setEditRole] = useState<{ name: string; description: string }>({ name: '', description: '' });
  const [editPermissions, setEditPermissions] = useState<string[]>([]);

  // Catálogo de permisos (ajustar según backend)
  const PERMISSIONS: Array<{ value: string; label: string }> = [
    { value: 'manage-organizations', label: 'Gestionar organizaciones' },
    { value: 'manage-stores', label: 'Gestionar tiendas' },
    { value: 'manage-products', label: 'Gestionar productos' },
    { value: 'manage-users', label: 'Gestionar usuarios' },
    { value: 'manage-roles', label: 'Gestionar roles' },
    { value: 'sell', label: 'Vender (POS)' },
    { value: 'view-reports', label: 'Ver reportes' },
  ];

  useEffect(() => {
    api.listRoles().then(r => setRoles(r.roles)).catch(() => setRoles([]));
  }, []);

  const createRole = async () => {
  const res = await api.createRole({ key: newRole.key, name: newRole.name, description: newRole.description || undefined, permissions: newRole.permissions });
    setRoles(r => [res.role, ...r]);
  setNewRole({ key: '', name: '', description: '', permissions: [] });
  };

  const startEdit = (role: any) => {
    setSelectedRole(role);
    setEditRole({ name: role.name || '', description: role.description || '' });
  setEditPermissions(Array.isArray(role.permissions) ? role.permissions : []);
  };

  const cancelEdit = () => {
    setSelectedRole(null);
    setEditRole({ name: '', description: '' });
  setEditPermissions([]);
  };

  const saveEdit = async () => {
    if (!selectedRole) return;
    const res = await api.updateRole(selectedRole._id, {
      name: editRole.name,
  description: editRole.description,
  permissions: editPermissions,
    });
    setRoles(list => list.map(r => (r._id === res.role._id ? res.role : r)));
    cancelEdit();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Roles</IonTitle>
          <BackToDashboardButton slot="start" label="Inicio" />
          <IonButtons slot="end"><IonButton color="medium" onClick={logout}>Salir</IonButton></IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <PageContainer>
        {selectedRole ? (
          <>
            <h2>Editar rol</h2>
            <IonGrid>
              <IonRow>
                <IonCol size="12" sizeMd="6">
                  <IonItem>
                    <IonLabel position="stacked">Nombre</IonLabel>
                    <IonInput value={editRole.name} onIonChange={e=>setEditRole(r=>({ ...r, name: e.detail.value || '' }))} />
                  </IonItem>
                </IonCol>
                <IonCol size="12" sizeMd="6">
                  <IonItem>
                    <IonLabel position="stacked">Descripción</IonLabel>
                    <IonTextarea value={editRole.description} onIonChange={e=>setEditRole(r=>({ ...r, description: (e.detail as any).value || '' }))} />
                  </IonItem>
                </IonCol>
                <IonCol size="12">
                  <IonItem lines="none">
                    <IonCheckbox
                      slot="start"
                      checked={editPermissions.length === PERMISSIONS.length}
                      onIonChange={(e) => {
                        setEditPermissions(e.detail.checked ? PERMISSIONS.map(p => p.value) : []);
                      }}
                    />
                    <IonLabel>Seleccionar todo</IonLabel>
                  </IonItem>
                  <IonItem>
                    <IonLabel position="stacked">Permisos</IonLabel>
                    <IonSelect multiple value={editPermissions} onIonChange={e => {
                      const v = e.detail.value;
                      setEditPermissions(Array.isArray(v) ? v.map(String) : (v ? [String(v)] : []));
                    }} placeholder="Selecciona permisos">
                      {PERMISSIONS.map(p => (
                        <IonSelectOption key={p.value} value={p.value}>{p.label}</IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonItem>
                </IonCol>
                <IonCol size="12" className="ion-text-right">
                  <IonButton color="primary" onClick={saveEdit}><IonIcon slot="start" icon={saveOutline} />Guardar cambios</IonButton>
                  <IonButton color="medium" className="ion-margin-start" onClick={cancelEdit}>Cancelar</IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          </>
        ) : (
          <>
        <h2>Nuevo rol</h2>
  <IonGrid>
          <IonRow>
            <IonCol size="12" sizeMd="4"><IonItem><IonLabel position="stacked">Key</IonLabel><IonInput value={newRole.key} onIonChange={e=>setNewRole(r=>({...r, key: e.detail.value||''}))} /></IonItem></IonCol>
            <IonCol size="12" sizeMd="4"><IonItem><IonLabel position="stacked">Nombre</IonLabel><IonInput value={newRole.name} onIonChange={e=>setNewRole(r=>({...r, name: e.detail.value||''}))} /></IonItem></IonCol>
            <IonCol size="12" sizeMd="4"><IonItem><IonLabel position="stacked">Descripción</IonLabel><IonTextarea value={newRole.description} onIonChange={e=>setNewRole(r=>({...r, description: e.detail.value||''}))} /></IonItem></IonCol>
            <IonCol size="12">
              <IonItem lines="none">
                <IonCheckbox
                  slot="start"
                  checked={newRole.permissions.length === PERMISSIONS.length}
                  onIonChange={(e) => {
                    setNewRole(r => ({ ...r, permissions: e.detail.checked ? PERMISSIONS.map(p => p.value) : [] }));
                  }}
                />
                <IonLabel>Seleccionar todo</IonLabel>
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Permisos</IonLabel>
                <IonSelect multiple value={newRole.permissions} onIonChange={e => {
                  const v = e.detail.value;
                  setNewRole(r => ({ ...r, permissions: Array.isArray(v) ? v.map(String) : (v ? [String(v)] : []) }));
                }} placeholder="Selecciona permisos">
                  {PERMISSIONS.map(p => (
                    <IonSelectOption key={p.value} value={p.value}>{p.label}</IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
            </IonCol>
            <IonCol size="12" className="ion-text-right"><IonButton onClick={createRole}><IonIcon slot="start" icon={saveOutline} />Guardar</IonButton></IonCol>
          </IonRow>
        </IonGrid>
          </>
        )}
        <h2 className="ion-margin-top">Roles</h2>
  <IonList>
          {roles.map(r => (
            <IonItem key={r._id} button onClick={() => startEdit(r)}>
              <IonLabel>
                <h3>{r.name} ({r.key}){selectedRole?._id === r._id ? ' • editando' : ''}</h3>
                <p>{r.description}</p>
                {Array.isArray(r.permissions) && r.permissions.length > 0 && (
                  <p>Permisos: {r.permissions.join(', ')}</p>
                )}
              </IonLabel>
            </IonItem>
          ))}
  </IonList>
  </PageContainer>
      </IonContent>
    </IonPage>
  );
};

export default Roles;
