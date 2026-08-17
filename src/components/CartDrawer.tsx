import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function CartDrawer() {
  const { cartItems, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, cartTotal } = useCart();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-[100]"
        onClick={() => setIsCartOpen(false)}
      />
      
      <div 
        className="fixed top-0 right-0 h-full w-full max-w-[28rem] bg-white shadow-2xl z-[110] flex flex-col"
      >
        <div className="flex items-center justify-between p-lg border-b border-gray-100">
          <h2 className="font-headline-md text-headline-md text-on-background">Tu Carrito</h2>
          <button onClick={() => setIsCartOpen(false)} aria-label="Cerrar carrito" className="p-2 hover:bg-gray-100 rounded-full transition-colors focus:ring-2 focus:ring-primary focus:outline-none">
            <span className="material-symbols-outlined text-secondary" aria-hidden="true">close</span>
          </button>
        </div>

            <div className="flex-1 overflow-y-auto p-lg">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-secondary">
                  <span className="material-symbols-outlined text-6xl mb-md opacity-50">shopping_cart</span>
                  <p className="font-body-lg text-body-lg">Tu carrito está vacío.</p>
                  <button onClick={() => setIsCartOpen(false)} className="mt-lg text-primary font-bold hover:underline">
                    Continuar Comprando
                  </button>
                </div>
              ) : (
                <div className="space-y-lg">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-md border-b border-gray-100 pb-md last:border-0">
                      <div className="w-24 h-24 bg-gray-50 rounded-lg overflow-hidden shrink-0">
                        <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col flex-grow">
                        <div className="flex justify-between items-start">
                          <h3 className="font-label-lg text-label-lg font-bold truncate pr-4 text-on-background">{item.name}</h3>
                          <button onClick={() => removeFromCart(item.id)} aria-label={`Eliminar ${item.name} del carrito`} className="text-secondary hover:text-error transition-colors focus:ring-2 focus:ring-error focus:outline-none rounded">
                            <span className="material-symbols-outlined text-xl" aria-hidden="true">delete</span>
                          </button>
                        </div>
                        <span className="font-label-sm text-label-sm text-secondary mb-2">{item.category}</span>
                        <div className="mt-auto flex justify-between items-center">
                          <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label="Disminuir cantidad" className="px-3 py-1 hover:bg-gray-50 text-on-background focus:bg-gray-100 focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center">-</button>
                            <span className="px-2 py-1 font-label-md text-label-md text-on-background min-w-[32px] text-center" aria-live="polite">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Aumentar cantidad" className="px-3 py-1 hover:bg-gray-50 text-on-background focus:bg-gray-100 focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center">+</button>
                          </div>
                          <span className="font-headline-sm text-headline-sm font-bold text-on-background">
                            ${((item.salePrice || item.price) * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

              {cartItems.length > 0 && (
                <div className="p-lg border-t border-gray-100 bg-white">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-body-md text-body-md text-secondary">Subtotal</span>
                    <span className="font-label-lg text-label-lg font-bold text-on-background">${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-md border-b border-gray-100 pb-md">
                    <span className="font-body-md text-body-md text-secondary">Retiro en local</span>
                    <span className="font-label-lg text-label-lg font-bold text-green-700">Gratis</span>
                  </div>
                  <div className="flex justify-between items-center mb-lg">
                    <span className="font-body-lg text-body-lg font-bold text-on-background">Total</span>
                    <span className="font-headline-md text-headline-md font-bold text-primary">
                      ${cartTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => { setIsCartOpen(false); navigate('/checkout'); }} className="w-full bg-primary-container text-on-primary-fixed py-md rounded-lg font-label-lg text-label-lg font-bold hover:brightness-95 transition-all shadow-md focus:ring-2 focus:ring-primary focus:outline-none">
                      Finalizar compra
                    </button>
                    <button 
                      onClick={() => setIsCartOpen(false)} 
                      className="w-full bg-white border border-gray-300 text-gray-700 py-md rounded-lg font-label-lg text-label-lg font-bold hover:bg-gray-50 transition-all focus:ring-2 focus:ring-gray-400 focus:outline-none"
                    >
                      Seguir Comprando
                    </button>
                  </div>
                </div>
              )}
      </div>
    </>
  );
}
