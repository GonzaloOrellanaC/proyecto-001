import React, { useEffect, useMemo, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonGrid, IonRow, IonCol } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useParams } from 'react-router-dom';
import PageContainer from '../components/PageContainer';

const POS: React.FC = () => {
  const { user, logout } = useAuth();
  const params = useParams<{ orgId?: string }>();
  const orgId = useMemo(() => params.orgId || '', [params.orgId]);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<{ id: string; name: string; price: number; qty: number }[]>([]);

  useEffect(() => {
    if (!orgId) return;
    api.listProducts(orgId).then(r => setProducts(r.products)).catch(() => {});
  }, [orgId]);

  const addToCart = (p: any) => {
    setCart(c => {
      const idx = c.findIndex(i => i.id === p._id);
      if (idx >= 0) { const copy = [...c]; copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 }; return copy; }
      return [...c, { id: p._id, name: p.name, price: p.price, qty: 1 }];
    });
  };

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>POS - {user?.name}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <PageContainer>
        <IonGrid>
          <IonRow>
            <IonCol size="12" sizeMd="7">
              <h2>Productos</h2>
              {!orgId && <p>Selecciona una organización primero.</p>}
              <IonList>
                {products.map(p => (
                  <IonItem key={p._id} button onClick={() => addToCart(p)}>
                    <IonLabel>
                      <h3>{p.name}</h3>
                      <p>SKU: {p.sku} • ${p.price}</p>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
            </IonCol>
            <IonCol size="12" sizeMd="5">
              <h2>Carrito</h2>
              {cart.length === 0 && <p>Vacío</p>}
              <IonList>
                {cart.map(i => (
                  <IonItem key={i.id}>
                    <IonLabel>
                      <h3>{i.name} x{i.qty}</h3>
                      <p>${i.price} c/u</p>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
              <h3>Total: ${total.toFixed(2)}</h3>
              <IonButton color="success" disabled={cart.length===0}>Cobrar</IonButton>
              <IonButton color="medium" onClick={logout} className="ion-margin-start">Salir</IonButton>
            </IonCol>
          </IonRow>
  </IonGrid>
  </PageContainer>
      </IonContent>
    </IonPage>
  );
};

export default POS;
