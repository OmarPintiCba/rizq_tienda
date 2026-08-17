import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Product, CartItem } from '../types';
import { useToast } from './ToastContext';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  cartTotal: number;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('rizq_cart') || '[]'); } catch { return []; }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    localStorage.setItem('rizq_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: Product) => {
    // Check if product is active and has stock
    if (!product.isActive) {
      showToast('Este producto no está disponible actualmente.', 'error');
      return;
    }
    
    if (product.stock !== undefined && product.stock <= 0) {
      showToast('Producto sin stock.', 'error');
      return;
    }

    const existing = cartItems.find(item => item.id === product.id);
    if (existing) {
      if (product.stock !== undefined && existing.quantity >= product.stock) {
        showToast(`Stock insuficiente. Solo quedan ${product.stock} unidades.`, 'error');
        return;
      }
      showToast(`Se agregó otra unidad de ${product.name} al carrito.`, 'success');
    } else {
      showToast(`${product.name} agregado al carrito exitosamente.`, 'success');
    }

    setCartItems(prev => {
      const current = prev.find(item => item.id === product.id);
      if (current) {
        if (product.stock !== undefined && current.quantity >= product.stock) {
          return prev;
        }
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    
    // Auto-open drawer as part of the flow
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(prev => prev.map(item => {
      if (item.id !== productId) return item;
      const nextQuantity = Math.min(quantity, item.stock ?? quantity);
      if (nextQuantity < quantity) showToast(`Stock insuficiente. Solo quedan ${item.stock} unidades.`, 'error');
      return { ...item, quantity: nextQuantity };
    }));
  };

  const clearCart = () => setCartItems([]);

  const cartTotal = cartItems.reduce((total, item) => {
    const activePrice = item.salePrice || item.price;
    return total + (activePrice * item.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart, updateQuantity, 
      isCartOpen, setIsCartOpen, cartTotal, clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
