import React, { useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonItem, IonLabel, IonButton, IonList, IonText, IonSpinner, IonGrid, IonRow, IonCol } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { useHistory } from 'react-router-dom';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
  const u = await login(email, password);
  const path = u.role === 'admin' ? '/dashboard' : '/seller';
      history.replace(path);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Inicio de sesión</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid>
            <IonRow>
                <IonCol />
                <IonCol sizeXs="12" sizeMd="6" sizeLg="4" sizeXl='3'>
                    <form onSubmit={onSubmit}>
                        <IonList>
                            <IonItem>
                            <IonLabel position="stacked">Email</IonLabel>
                            <IonInput type="email" value={email} onIonChange={(e) => setEmail(e.detail.value || '')} required />
                            </IonItem>
                            <IonItem>
                            <IonLabel position="stacked">Contraseña</IonLabel>
                            <IonInput type="password" value={password} onIonChange={(e) => setPassword(e.detail.value || '')} required />
                            </IonItem>
                        </IonList>
                        {error && <IonText color="danger">{error}</IonText>}
                        <div className="ion-margin-top">
                            <IonButton type="submit" expand="block" disabled={loading}>
                            {loading ? <IonSpinner name="crescent" /> : 'Ingresar'}
                            </IonButton>
                        </div>
                        </form>
                </IonCol>
                <IonCol />
            </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Login;
