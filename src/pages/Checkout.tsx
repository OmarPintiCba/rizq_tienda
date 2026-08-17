import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { CheckoutCustomer, createCashSale, renewCartSessionToken, saveCheckoutCart } from '../lib/commerce';

const initialCustomer: CheckoutCustomer = {
  firstName: '', lastName: '', email: '', phone: '', document: '',
  street: '', streetNumber: '', city: '', province: 'Córdoba', postalCode: ''
};

const money = (value: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);

export default function Checkout() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { showToast } = useToast();
  const { currentUser, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(initialCustomer);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mercadopago'>('cash');
  const [saving, setSaving] = useState(false);

  const itemsKey = useMemo(() => cartItems.map(i => `${i.id}:${i.quantity}`).join('|'), [cartItems]);

  useEffect(() => {
    if (!currentUser) return;
    const parts = currentUser.name.trim().split(/\s+/);
    const firstName = parts.shift() || '';
    const lastName = parts.join(' ');
    const defaultAddress = currentUser.addresses?.find(a => a.isDefault) || currentUser.addresses?.[0];

    setCustomer(prev => ({
      ...prev,
      firstName: prev.firstName || firstName,
      lastName: prev.lastName || lastName,
      email: currentUser.email,
      phone: prev.phone || currentUser.phone || '',
      street: prev.street || defaultAddress?.street || '',
      city: prev.city || defaultAddress?.city || '',
      province: prev.province || defaultAddress?.province || 'Córdoba',
      postalCode: prev.postalCode || defaultAddress?.postalCode || '',
    }));
  }, [currentUser]);

  useEffect(() => {
    if (!isAuthenticated || !cartItems.length) return;
    const timer = setTimeout(() => {
      saveCheckoutCart(customer, cartItems, notes).catch(() => undefined);
    }, 700);
    return () => clearTimeout(timer);
  }, [itemsKey, customer, notes]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomer(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const fields: Array<[keyof CheckoutCustomer, string]> = [
      ['firstName','Nombre'], ['lastName','Apellido'], ['email','Email'], ['phone','Teléfono'], ['document','DNI/CUIT'],
      ['street','Calle'], ['streetNumber','Número'], ['city','Ciudad'], ['province','Provincia'], ['postalCode','Código postal']
    ];
    const missing = fields.find(([key]) => !customer[key].trim());
    if (missing) { showToast(`Completa el campo ${missing[1]}.`, 'error'); return false; }
    if (!/\S+@\S+\.\S+/.test(customer.email)) { showToast('Ingresa un email válido.', 'error'); return false; }
    return true;
  };

  const confirmCashOrder = async () => {
    if (!validate()) return;
    if (!cartItems.length) return;
    setSaving(true);
    const result = await createCashSale(customer, cartItems, notes);
    setSaving(false);
    if (!result.success) { showToast(result.error || 'No se pudo confirmar la operación.', 'error'); return; }
    const number = result.data?.sale_number;
    clearCart();
    renewCartSessionToken();
    navigate(`/compra-confirmada?numero=${number}`);
  };

  if (isLoading) {
    return <main className="max-w-4xl mx-auto px-4 py-16 text-center flex-grow"><p className="text-gray-500">Verificando tu cuenta...</p></main>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: '/checkout' }} />;
  }

  if (!cartItems.length) {
    return <main className="max-w-4xl mx-auto px-4 py-16 text-center flex-grow"><h1 className="text-3xl font-bold mb-4">Tu carrito está vacío</h1><Link to="/" className="text-primary font-bold">Volver a la tienda</Link></main>;
  }

  return (
    <main className="w-full max-w-6xl mx-auto px-4 md:px-8 py-8 flex-grow">
      <div className="mb-6"><Link to="/" className="text-sm text-secondary hover:text-primary">Inicio</Link><span className="mx-2 text-gray-400">›</span><span className="text-sm font-bold">Checkout</span></div>
      <h1 className="text-3xl font-bold mb-8">Finalizar compra</h1>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
        <div className="space-y-6">
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold mb-1">Datos del comprador</h2>
            <p className="text-sm text-gray-500 mb-5">Usamos los datos de tu cuenta. Completa únicamente la información que falte para esta compra.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[['firstName','Nombre'],['lastName','Apellido'],['email','Email'],['phone','Teléfono'],['document','DNI / CUIT'],['street','Calle'],['streetNumber','Número'],['city','Ciudad'],['province','Provincia'],['postalCode','Código postal']].map(([name,label]) => (
                <label key={name} className="block">
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                  <input
                    name={name}
                    value={(customer as any)[name]}
                    onChange={handleChange}
                    readOnly={name === 'email'}
                    className={`mt-1 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary/30 outline-none ${name === 'email' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                  />
                </label>
              ))}
            </div>
            <label className="block mt-4"><span className="text-sm font-medium text-gray-700">Observaciones</span><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1 w-full border border-gray-300 rounded-lg p-3" placeholder="Aclaraciones sobre la compra..." /></label>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold mb-4">Entrega</h2>
            <div className="border-2 border-primary rounded-xl p-4 flex gap-3 items-start bg-primary/5">
              <span className="material-symbols-outlined text-primary">storefront</span><div><div className="font-bold">Retiro en local</div><div className="text-sm text-gray-500">Para pago en efectivo, el retiro en el local es obligatorio.</div></div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold mb-4">Forma de pago</h2>
            <label className="border-2 border-primary rounded-xl p-4 flex gap-3 cursor-pointer bg-primary/5"><input type="radio" checked={paymentMethod==='cash'} onChange={() => setPaymentMethod('cash')} /><div><div className="font-bold">Efectivo en el local</div><div className="text-sm text-gray-500">La operación queda en Ventas pendientes hasta que el administrador confirme el cobro.</div></div></label>
            <label className="mt-3 border border-gray-200 rounded-xl p-4 flex gap-3 opacity-60"><input type="radio" disabled /><div><div className="font-bold">Mercado Pago</div><div className="text-sm text-gray-500">Se habilitará en la v24 con confirmación automática del pago.</div></div></label>
          </section>
        </div>

        <aside className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:sticky lg:top-24">
          <h2 className="text-xl font-bold mb-5">Resumen</h2>
          <div className="space-y-4 max-h-72 overflow-y-auto pr-1">{cartItems.map(item => <div key={item.id} className="flex gap-3"><img src={item.images[0]} className="w-14 h-14 object-cover rounded-lg border" /><div className="flex-1"><div className="text-sm font-bold line-clamp-2">{item.name}</div><div className="text-xs text-gray-500">Cantidad: {item.quantity}</div></div><div className="text-sm font-bold">{money((item.salePrice || item.price)*item.quantity)}</div></div>)}</div>
          <div className="border-t mt-5 pt-4 space-y-2"><div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{money(cartTotal)}</span></div><div className="flex justify-between text-gray-600"><span>Retiro en local</span><span className="font-bold text-green-700">Gratis</span></div><div className="flex justify-between text-xl font-bold border-t pt-4 mt-3"><span>Total</span><span>{money(cartTotal)}</span></div></div>
          <button onClick={confirmCashOrder} disabled={saving || paymentMethod!=='cash'} className="mt-6 w-full bg-primary-container text-on-primary-fixed py-4 rounded-xl font-bold hover:brightness-95 disabled:opacity-50">{saving ? 'Confirmando...' : 'Confirmar pedido en efectivo'}</button>
          <p className="text-xs text-gray-500 mt-3 text-center">No se registra como ingreso hasta que el pago en efectivo sea confirmado en el local.</p>
        </aside>
      </div>
    </main>
  );
}
