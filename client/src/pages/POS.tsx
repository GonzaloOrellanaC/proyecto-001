import React, { useEffect, useMemo, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonGrid, IonRow, IonCol, IonSelect, IonSelectOption, IonInput, IonModal, IonToast } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useParams, useLocation } from 'react-router-dom';
import PageContainer from '../components/PageContainer';
import BackToDashboardButton from '../components/BackToDashboardButton';

const POS: React.FC = () => {
  const { user, logout } = useAuth();
  const params = useParams<{ orgId?: string }>();
  const location = useLocation();
  const orgId = useMemo(() => params.orgId || '', [params.orgId]);
  const [products, setProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [storeId, setStoreId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<{ id: string; name: string; price: number; qty: number }[]>([]);
  const [showPay, setShowPay] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash'|'card'>('cash');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [toast, setToast] = useState<{ open: boolean; message: string; color?: 'success'|'danger'|'warning' }>(() => ({ open: false, message: '' }));

  useEffect(() => {
    if (!orgId) return;
    api.listProducts(orgId).then(r => setProducts(r.products)).catch(() => {});
    api.listStores(orgId).then(r => setStores(r.stores)).catch(() => setStores([]));
  }, [orgId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sid = params.get('storeId') || '';
    if (sid) setStoreId(sid);
  }, [location.search]);

  const addToCart = (p: any) => {
    setCart(c => {
      const idx = c.findIndex(i => i.id === p._id);
      if (idx >= 0) { const copy = [...c]; copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 }; return copy; }
      return [...c, { id: p._id, name: p.name, price: p.price, qty: 1 }];
    });
  };

  const incQty = (id: string) => setCart(c => c.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i));
  const decQty = (id: string) => setCart(c => c.flatMap(i => i.id === id ? (i.qty > 1 ? [{ ...i, qty: i.qty - 1 }] : []) : [i]));
  const removeItem = (id: string) => setCart(c => c.filter(i => i.id !== id));

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const change = paymentMethod === 'cash' ? Math.max(0, (parseFloat(cashReceived || '0') || 0) - total) : 0;

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p => `${p.name} ${p.sku}`.toLowerCase().includes(q));
  }, [products, search]);

  const canCheckout = cart.length > 0 && !!orgId && !!storeId && (paymentMethod === 'card' || ((parseFloat(cashReceived || '0') || 0) >= total));

  const startCheckout = () => {
    if (!storeId) { setToast({ open: true, message: 'Selecciona una tienda primero', color: 'warning' }); return; }
    setShowPay(true);
  };

  const confirmCheckout = async () => {
    try {
      const items = cart.map(i => ({ productId: i.id, qty: i.qty }));
      const res = await api.createSale({ orgId, storeId, items });
      if (res?.ok) {
        setShowPay(false);
        setCart([]);
        setCashReceived('');
        setPaymentMethod('cash');
        setToast({ open: true, message: 'Venta realizada', color: 'success' });
      } else {
        throw new Error('Error al crear la venta');
      }
    } catch (err: any) {
      setToast({ open: true, message: err.message || 'Error al cobrar', color: 'danger' });
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>POS - {user?.name}</IonTitle>
          <BackToDashboardButton slot="start" label="Inicio" />
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <PageContainer>
        <IonGrid>
          <IonRow>
            <IonCol size="12" sizeMd="7">
              <h2>Productos</h2>
              {!orgId && <p>Selecciona una organización primero.</p>}
              <div className="ion-margin-bottom">
                <IonLabel>Negocio</IonLabel>
                <div>{orgId}</div>
              </div>
              <div className="ion-margin-bottom">
                <IonLabel>Tienda</IonLabel>
                <IonSelect value={storeId} onIonChange={e => setStoreId(String(e.detail.value))} placeholder="Selecciona una tienda">
                  {stores.map(s => (
                    <IonSelectOption key={s._id} value={s._id}>{s.name}</IonSelectOption>
                  ))}
                </IonSelect>
              </div>
              <IonInput
                label="Buscar producto"
                labelPlacement="stacked"
                value={search}
                onIonInput={e => setSearch(String(e.detail.value || ''))}
                placeholder="Nombre o SKU"
                className="ion-margin-bottom"
              />
              <IonList>
                {filteredProducts.map(p => (
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
                    <div className="ion-margin-start">
                      <IonButton size="small" onClick={() => decQty(i.id)}>-</IonButton>
                      <IonButton size="small" onClick={() => incQty(i.id)} className="ion-margin-horizontal">+</IonButton>
                      <IonButton size="small" color="danger" onClick={() => removeItem(i.id)}>Quitar</IonButton>
                    </div>
                  </IonItem>
                ))}
              </IonList>
              <h3>Total: ${total.toFixed(2)}</h3>
              <IonButton color="success" disabled={cart.length===0 || !storeId} onClick={startCheckout}>Cobrar</IonButton>
              <IonButton color="medium" onClick={logout} className="ion-margin-start">Salir</IonButton>
            </IonCol>
          </IonRow>
  </IonGrid>
  </PageContainer>

  <IonModal isOpen={showPay} onDidDismiss={() => setShowPay(false)}>
    <div className="ion-padding">
      <h2>Pago</h2>
      <div className="ion-margin-bottom">
        <IonLabel>Método</IonLabel>
        <IonSelect value={paymentMethod} onIonChange={e => setPaymentMethod(e.detail.value)}>
          <IonSelectOption value="cash">Efectivo</IonSelectOption>
          <IonSelectOption value="card">Tarjeta</IonSelectOption>
        </IonSelect>
      </div>
      {paymentMethod === 'cash' && (
        <IonInput
          type="number"
          label="Efectivo recibido"
          labelPlacement="stacked"
          value={cashReceived}
          onIonInput={e => setCashReceived(String(e.detail.value || ''))}
          placeholder="0.00"
          className="ion-margin-bottom"
        />
      )}
      <p>Total: ${total.toFixed(2)}</p>
      {paymentMethod === 'cash' && <p>Cambio: ${change.toFixed(2)}</p>}
      <div className="ion-margin-top">
        <IonButton color="medium" onClick={() => setShowPay(false)}>Cancelar</IonButton>
        <IonButton color="success" disabled={!canCheckout} onClick={confirmCheckout} className="ion-margin-start">Confirmar</IonButton>
      </div>
    </div>
  </IonModal>

  <IonToast isOpen={toast.open} message={toast.message} color={toast.color} duration={2000} onDidDismiss={() => setToast({ open: false, message: '' })} />
      </IonContent>
    </IonPage>
  );
};

export default POS;
