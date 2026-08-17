import { supabase } from './supabaseClient';
import { CartItem } from '../types';

export type CheckoutCustomer = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  document: string;
  street: string;
  streetNumber: string;
  city: string;
  province: string;
  postalCode: string;
};

const CART_SESSION_KEY = 'rizq_cart_session_token';

export function getCartSessionToken(): string {
  let token = localStorage.getItem(CART_SESSION_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(CART_SESSION_KEY, token);
  }
  return token;
}

export function renewCartSessionToken() {
  localStorage.setItem(CART_SESSION_KEY, crypto.randomUUID());
}

function serializeItems(items: CartItem[]) {
  return items.map(item => ({ productId: item.id, quantity: item.quantity }));
}

export async function saveCheckoutCart(customer: Partial<CheckoutCustomer>, items: CartItem[], notes = '') {
  if (items.length === 0) return { success: true };
  const { error } = await supabase.rpc('save_checkout_cart', {
    p_session_token: getCartSessionToken(),
    p_customer: customer,
    p_items: serializeItems(items),
    p_notes: notes,
  });
  return error ? { success: false, error: error.message } : { success: true };
}

export async function createCashSale(customer: CheckoutCustomer, items: CartItem[], notes = '') {
  const { data, error } = await supabase.rpc('create_cash_sale', {
    p_session_token: getCartSessionToken(),
    p_customer: customer,
    p_items: serializeItems(items),
    p_notes: notes,
  });
  if (error) return { success: false, error: error.message } as const;
  const row = Array.isArray(data) ? data[0] : data;
  return { success: true, data: row } as const;
}
