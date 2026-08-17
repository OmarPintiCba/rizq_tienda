import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Category } from '../types';
import { useToast } from './ToastContext';

type Result = { success: boolean; error?: string };

interface CategoryContextType {
  categories: Category[];
  isLoading: boolean;
  addCategory: (category: Omit<Category, 'id'>) => Promise<Result>;
  updateCategory: (id: string, updatedCategory: Partial<Category>) => Promise<Result>;
  deleteCategory: (id: string) => Promise<Result>;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

function dbRowToCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    parentId: row.parent_id || undefined,
  };
}

export const CategoryProvider = ({ children }: { children: ReactNode }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const refresh = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('No se pudieron cargar las categorías:', error.message);
      showToast('No se pudieron cargar las categorías: ' + error.message, 'error');
      setIsLoading(false);
      return;
    }

    setCategories((data || []).map(dbRowToCategory));
    setIsLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const addCategory = async (category: Omit<Category, 'id'>): Promise<Result> => {
    const { error } = await supabase.from('categories').insert({
      name: category.name,
      parent_id: category.parentId || null,
    });

    if (error) {
      const message = 'No se pudo crear la categoría: ' + error.message;
      showToast(message, 'error');
      return { success: false, error: message };
    }

    await refresh();
    showToast('Categoría creada.', 'success');
    return { success: true };
  };

  const updateCategory = async (id: string, updatedCategory: Partial<Category>): Promise<Result> => {
    const payload: Record<string, any> = {};
    if (updatedCategory.name !== undefined) payload.name = updatedCategory.name;
    if ('parentId' in updatedCategory) payload.parent_id = updatedCategory.parentId || null;

    const { error } = await supabase.from('categories').update(payload).eq('id', id);

    if (error) {
      const message = 'No se pudo actualizar la categoría: ' + error.message;
      showToast(message, 'error');
      return { success: false, error: message };
    }

    await refresh();
    showToast('Categoría actualizada.', 'success');
    return { success: true };
  };

  const deleteCategory = async (id: string): Promise<Result> => {
    // Las subcategorías cuyo parent_id apunte a esta quedan con parent_id
    // en null automáticamente (por el "on delete set null" de la tabla),
    // no se borran en cascada — así no se pierden categorías hijas sin querer.
    const { error } = await supabase.from('categories').delete().eq('id', id);

    if (error) {
      const message = 'No se pudo eliminar la categoría: ' + error.message;
      showToast(message, 'error');
      return { success: false, error: message };
    }

    await refresh();
    showToast('Categoría eliminada.', 'info');
    return { success: true };
  };

  return (
    <CategoryContext.Provider value={{ categories, isLoading, addCategory, updateCategory, deleteCategory }}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
};
