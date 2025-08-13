import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonItem, IonLabel, IonList, IonIcon } from '@ionic/react';
import { addCircleOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import PageContainer from '../components/PageContainer';
import BackToDashboardButton from '../components/BackToDashboardButton';

const Users: React.FC = () => {
  const history = useHistory();
  const { logout } = useAuth();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    api.listUsers().then(r => setUsers(r.users)).catch(() => setUsers([]));
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Usuarios</IonTitle>
          <BackToDashboardButton slot="start" label="Inicio" />
          <IonButtons slot="end">
            <IonButton onClick={() => history.push('/manage/users/new')}>
              <IonIcon icon={addCircleOutline} slot="start" />
              Nuevo usuario
            </IonButton>
            <IonButton color="medium" onClick={logout}>Salir</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <PageContainer>
          <IonList>
            {users.map(u => (
              <IonItem key={u._id} button detail onClick={() => history.push(`/manage/users/${u._id}`)}>
                <IonLabel>
                  <h3>{u.name} ({u.email})</h3>
                  <p>Rol: {u.role}</p>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        </PageContainer>
      </IonContent>
    </IonPage>
  );
};

export default Users;
