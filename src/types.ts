export interface Category {
  id: string;
  name: string;
  parentId?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  cost: number;
  sku: string;
  barcode: string;
  category: string;
  categoryId?: string;
  brand: string;
  stock: number;
  minStock: number;
  isActive: boolean;
  isFeatured: boolean;
  images: string[];
  badge?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface CarouselItem {
  id: string;
  image: string;
}

export interface Address {
  id: string;
  label: string; // Ej: "Casa", "Trabajo"
  street: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  addresses: Address[];
  createdAt: string;
}

// Con Supabase Auth manejando la autenticación, el perfil público y el
// "Customer" interno ya son lo mismo (no hay passwordHash que ocultar).
export type CustomerProfile = Customer;

// --- Administradores: sistema completamente aparte del de clientes ---
// No comparte tabla, políticas, ni flujo de registro/login con customers.
export type AdminRole = 'super_admin' | 'admin' | 'operador' | 'vendedor' | 'deposito' | 'marketing';

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  createdBy: string | null; // id del super admin que lo creó (null para el primero)
}

export type AdminProfile = Admin;
