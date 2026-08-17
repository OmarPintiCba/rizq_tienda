import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Product } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useToast } from './ToastContext';

type Result<T = undefined> = { success: boolean; data?: T; error?: string };

interface ProductContextType {
  products: Product[];
  isLoading: boolean;
  refreshProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<Result<Product>>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<Result>;
  deleteProduct: (id: string) => Promise<Result>;
  uploadProductImages: (files: File[]) => Promise<Result<string[]>>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

function dbRowToProduct(row: any, cost = 0): Product {
  const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    price: Number(row.price) || 0,
    salePrice: row.sale_price === null || row.sale_price === undefined ? undefined : Number(row.sale_price),
    cost,
    sku: row.sku || '',
    barcode: row.barcode || '',
    categoryId: row.category_id || undefined,
    category: category?.name || 'Sin categoría',
    brand: row.brand || '',
    stock: Number(row.stock) || 0,
    minStock: Number(row.min_stock) || 0,
    isActive: Boolean(row.is_active),
    isFeatured: Boolean(row.is_featured),
    images: Array.isArray(row.images) ? row.images : [],
    badge: row.badge || undefined,
  };
}

function productToDbPayload(product: Partial<Product>) {
  const payload: Record<string, unknown> = {};
  if (product.name !== undefined) payload.name = product.name.trim();
  if (product.description !== undefined) payload.description = product.description;
  if (product.price !== undefined) payload.price = product.price;
  if (product.salePrice !== undefined) payload.sale_price = product.salePrice || null;
  if (product.sku !== undefined) payload.sku = product.sku.trim();
  if (product.barcode !== undefined) payload.barcode = product.barcode.trim() || null;
  if (product.categoryId !== undefined) payload.category_id = product.categoryId || null;
  if (product.brand !== undefined) payload.brand = product.brand.trim();
  if (product.stock !== undefined) payload.stock = product.stock;
  if (product.minStock !== undefined) payload.min_stock = product.minStock;
  if (product.isActive !== undefined) payload.is_active = product.isActive;
  if (product.isFeatured !== undefined) payload.is_featured = product.isFeatured;
  if (product.images !== undefined) payload.images = product.images;
  if (product.badge !== undefined) payload.badge = product.badge || null;
  return payload;
}

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const refreshProducts = async () => {
    setIsLoading(true);

    const { data, error } = await supabase
      .from('products')
      .select('*, categories(id, name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('No se pudieron cargar los productos:', error.message);
      showToast('No se pudieron cargar los productos: ' + error.message, 'error');
      setIsLoading(false);
      return;
    }

    // product_private está protegido por RLS: visitantes obtienen 0 filas;
    // administradores activos obtienen los costos y se mezclan por product_id.
    const { data: privateRows } = await supabase
      .from('product_private')
      .select('product_id, cost');

    const costs = new Map<string, number>(
      (privateRows || []).map((row: any) => [row.product_id, Number(row.cost) || 0])
    );

    setProducts((data || []).map((row: any) => dbRowToProduct(row, costs.get(row.id) || 0)));
    setIsLoading(false);
  };

  useEffect(() => {
    refreshProducts();

    // Si cambia la sesión (cliente/admin/logout), recargamos para aplicar el RLS
    // correcto: un admin puede ver inactivos/costos; el público no.
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      refreshProducts();
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const addProduct = async (product: Omit<Product, 'id'>): Promise<Result<Product>> => {
    const { cost: _ignoredCost, category: _ignoredCategory, categoryId: _ignoredCategoryId, ...rest } = product;

    const { data, error } = await supabase
      .from('products')
      .insert({ ...productToDbPayload(rest), category_id: product.categoryId || null })
      .select('*, categories(id, name)')
      .single();

    if (error) {
      const message = 'No se pudo crear el producto: ' + error.message;
      showToast(message, 'error');
      return { success: false, error: message };
    }

    const { error: costError } = await supabase.from('product_private').insert({
      product_id: data.id,
      cost: product.cost || 0,
    });

    if (costError) {
      // Evitamos dejar un producto a medio crear si falla la parte privada.
      await supabase.from('products').delete().eq('id', data.id);
      const message = 'No se pudo guardar el costo del producto: ' + costError.message;
      showToast(message, 'error');
      return { success: false, error: message };
    }

    await refreshProducts();
    const created = dbRowToProduct(data, product.cost || 0);
    showToast('Producto creado.', 'success');
    return { success: true, data: created };
  };

  const updateProduct = async (id: string, product: Partial<Product>): Promise<Result> => {
    const { cost, category: _category, ...publicFields } = product;
    const payload = productToDbPayload(publicFields);

    if (Object.keys(payload).length > 0) {
      const { error } = await supabase.from('products').update(payload).eq('id', id);
      if (error) {
        const message = 'No se pudo actualizar el producto: ' + error.message;
        showToast(message, 'error');
        return { success: false, error: message };
      }
    }

    if (cost !== undefined) {
      const { error: costError } = await supabase.from('product_private').upsert({
        product_id: id,
        cost,
      });
      if (costError) {
        const message = 'El producto se actualizó, pero no se pudo guardar el costo: ' + costError.message;
        showToast(message, 'error');
        await refreshProducts();
        return { success: false, error: message };
      }
    }

    await refreshProducts();
    showToast('Producto actualizado.', 'success');
    return { success: true };
  };

  const deleteProduct = async (id: string): Promise<Result> => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      const message = 'No se pudo eliminar el producto: ' + error.message;
      showToast(message, 'error');
      return { success: false, error: message };
    }

    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast('Producto eliminado.', 'info');
    return { success: true };
  };

  const uploadProductImages = async (files: File[]): Promise<Result<string[]>> => {
    const selected = files.slice(0, 3);
    if (selected.length === 0) return { success: true, data: [] };

    for (const file of selected) {
      if (!file.type.startsWith('image/')) {
        return { success: false, error: `${file.name} no es una imagen válida.` };
      }
      if (file.size > 5 * 1024 * 1024) {
        return { success: false, error: `${file.name} supera el límite de 5 MB.` };
      }
    }

    const urls: string[] = [];
    for (const file of selected) {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const safeExtension = extension.replace(/[^a-z0-9]/g, '') || 'jpg';
      const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${safeExtension}`;

      const { error } = await supabase.storage
        .from('product-images')
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (error) {
        const message = 'No se pudo subir la imagen: ' + error.message;
        showToast(message, 'error');
        return { success: false, error: message };
      }

      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      urls.push(data.publicUrl);
    }

    return { success: true, data: urls };
  };

  return (
    <ProductContext.Provider
      value={{ products, isLoading, refreshProducts, addProduct, updateProduct, deleteProduct, uploadProductImages }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
