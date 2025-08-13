import React from 'react';
import { IonList, IonItem, IonLabel } from '@ionic/react';

type Organization = { _id: string; name: string };

type Props = {
  organizations: Organization[];
  title?: string;
  emptyMessage?: string;
  selectable?: boolean;
  selectedId?: string;
  onSelect?: (id: string) => void;
};

export const OrganizationsList: React.FC<Props>
  = ({ organizations, title = 'Organizaciones', emptyMessage = 'No hay organizaciones para mostrar.', selectable = false, selectedId, onSelect }) => {
  return (
    <>
      {title && <h2 className="ion-margin-top">{title}</h2>}
      <IonList>
        {organizations.map(o => (
          <IonItem key={o._id} button={selectable} onClick={selectable ? () => onSelect && onSelect(o._id) : undefined}>
            <IonLabel>
              <h3>{selectedId === o._id ? '✅ ' : ''}{o.name}</h3>
              <p>ID: {o._id}</p>
            </IonLabel>
          </IonItem>
        ))}
        {organizations.length === 0 && (
          <IonItem>
            <IonLabel>{emptyMessage}</IonLabel>
          </IonItem>
        )}
      </IonList>
    </>
  );
};

export default OrganizationsList;
