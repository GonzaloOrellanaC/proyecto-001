import React from 'react';
import { IonButtons, IonButton, IonIcon } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homeOutline } from 'ionicons/icons';

type Props = { slot?: 'start' | 'end' | 'primary' | 'secondary'; label?: string; icon?: string };

const BackToDashboardButton: React.FC<Props> = ({ slot = 'start', label = 'Inicio', icon }) => {
  const history = useHistory();
  const { user } = useAuth();
  const goHome = () => {
    const path = user?.role === 'admin' ? '/dashboard' : '/seller';
    history.push(path);
  };
  return (
    <IonButtons slot={slot}>
      <IonButton onClick={goHome}>
        <IonIcon icon={icon || homeOutline} slot="start" />
        {label}
      </IonButton>
    </IonButtons>
  );
};

export default BackToDashboardButton;
