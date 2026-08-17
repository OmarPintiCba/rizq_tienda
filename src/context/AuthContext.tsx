import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CustomerProfile, Address } from '../types';
import { useToast } from './ToastContext';

interface AuthContextType {
  currentUser: CustomerProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<Pick<CustomerProfile, 'name' | 'phone'>>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  addAddress: (address: Omit<Address, 'id'>) => Promise<void>;
  updateAddress: (id: string, address: Partial<Address>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Traducción entre las columnas de la base (snake_case) y el tipo que
// usa el resto de la app (camelCase) ---
function dbAddressToAddress(row: any): Address {
  return {
    id: row.id,
    label: row.label,
    street: row.street,
    city: row.city,
    province: row.province,
    postalCode: row.postal_code,
    isDefault: row.is_default,
  };
}

function mapAuthError(message: string): string {
  const known: Record<string, string> = {
    'Invalid login credentials': 'Correo o contraseña incorrectos.',
    'User already registered': 'Ya existe una cuenta registrada con este correo.',
    'Email not confirmed': 'Todavía no confirmaste tu correo electrónico.',
    'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
  };
  return known[message] || message;
}

async function fetchFullProfile(userId: string, email: string): Promise<CustomerProfile | null> {
  const { data: customerRow, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', userId)
    .single();

  if (customerError || !customerRow) return null;

  const { data: addressRows } = await supabase
    .from('customer_addresses')
    .select('*')
    .eq('customer_id', userId)
    .order('created_at', { ascending: true });

  return {
    id: customerRow.id,
    name: customerRow.name,
    email,
    phone: customerRow.phone || undefined,
    createdAt: customerRow.created_at,
    addresses: (addressRows || []).map(dbAddressToAddress),
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const loadFromSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await fetchFullProfile(session.user.id, session.user.email!);
      setCurrentUser(profile);
    } else {
      setCurrentUser(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadFromSession();

    // Mantiene el estado sincronizado si el token se refresca, si la
    // sesión expira, o si el usuario cierra sesión desde otra pestaña.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchFullProfile(session.user.id, session.user.email!).then(setCurrentUser);
      } else {
        setCurrentUser(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const register = async (name: string, email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!name.trim() || !normalizedEmail || !password) {
      return { success: false, error: 'Completa todos los campos.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
    }

    const { data, error } = await supabase.auth.signUp({ email: normalizedEmail, password });

    if (error) return { success: false, error: mapAuthError(error.message) };
    if (!data.user) return { success: false, error: 'No se pudo crear la cuenta.' };

    // Supabase puede devolver un usuario ofuscado cuando el correo ya está
    // registrado. En ese caso identities viene vacío: no creamos otro perfil
    // y guiamos al cliente a iniciar sesión con la cuenta existente.
    if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return {
        success: false,
        error: 'Ya existe una cuenta con este correo. Iniciá sesión para continuar.'
      };
    }

    if (!data.session) {
      // El proyecto tiene "Confirm email" activado: el usuario existe pero
      // todavía no puede loguearse hasta confirmar el correo.
      return { success: false, error: 'Te enviamos un correo de confirmación. Confirmalo antes de ingresar.' };
    }

    const { error: profileError } = await supabase
      .from('customers')
      .insert({ id: data.user.id, name: name.trim(), phone: null });

    if (profileError) {
      return { success: false, error: 'La cuenta se creó pero hubo un error guardando tu perfil: ' + profileError.message };
    }

    const profile = await fetchFullProfile(data.user.id, normalizedEmail);
    setCurrentUser(profile);
    showToast(`¡Bienvenido/a, ${name.trim()}!`, 'success');
    return { success: true };
  };

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });

    if (error) return { success: false, error: mapAuthError(error.message) };
    if (!data.user) return { success: false, error: 'No se pudo iniciar sesión.' };

    const profile = await fetchFullProfile(data.user.id, normalizedEmail);
    if (!profile) {
      return { success: false, error: 'Tu cuenta existe pero falta tu perfil de cliente. Contactá a soporte.' };
    }

    setCurrentUser(profile);
    showToast(`¡Hola de nuevo, ${profile.name}!`, 'success');
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    showToast('Sesión cerrada correctamente.', 'info');
  };

  const updateProfile = async (data: Partial<Pick<CustomerProfile, 'name' | 'phone'>>) => {
    if (!currentUser) return;

    const { error } = await supabase
      .from('customers')
      .update({ name: data.name, phone: data.phone })
      .eq('id', currentUser.id);

    if (error) {
      showToast('No se pudo actualizar el perfil: ' + error.message, 'error');
      return;
    }

    setCurrentUser((prev) => (prev ? { ...prev, ...data } : prev));
    showToast('Perfil actualizado correctamente.', 'success');
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!currentUser) return { success: false, error: 'No hay sesión activa.' };
    if (newPassword.length < 6) {
      return { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' };
    }

    // Verificamos la contraseña actual re-autenticando antes de cambiarla.
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: currentUser.email,
      password: currentPassword,
    });
    if (verifyError) {
      return { success: false, error: 'La contraseña actual es incorrecta.' };
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };

    showToast('Contraseña actualizada correctamente.', 'success');
    return { success: true };
  };

  const addAddress = async (address: Omit<Address, 'id'>) => {
    if (!currentUser) return;

    if (address.isDefault) {
      await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('customer_id', currentUser.id);
    }

    const { error } = await supabase.from('customer_addresses').insert({
      customer_id: currentUser.id,
      label: address.label,
      street: address.street,
      city: address.city,
      province: address.province,
      postal_code: address.postalCode,
      is_default: address.isDefault,
    });

    if (error) {
      showToast('No se pudo agregar la dirección: ' + error.message, 'error');
      return;
    }

    const profile = await fetchFullProfile(currentUser.id, currentUser.email);
    setCurrentUser(profile);
    showToast('Dirección agregada.', 'success');
  };

  const updateAddress = async (id: string, addressData: Partial<Address>) => {
    if (!currentUser) return;

    if (addressData.isDefault) {
      await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('customer_id', currentUser.id);
    }

    const { error } = await supabase
      .from('customer_addresses')
      .update({
        label: addressData.label,
        street: addressData.street,
        city: addressData.city,
        province: addressData.province,
        postal_code: addressData.postalCode,
        is_default: addressData.isDefault,
      })
      .eq('id', id);

    if (error) {
      showToast('No se pudo actualizar la dirección: ' + error.message, 'error');
      return;
    }

    const profile = await fetchFullProfile(currentUser.id, currentUser.email);
    setCurrentUser(profile);
    showToast('Dirección actualizada.', 'success');
  };

  const deleteAddress = async (id: string) => {
    if (!currentUser) return;

    const { error } = await supabase.from('customer_addresses').delete().eq('id', id);
    if (error) {
      showToast('No se pudo eliminar la dirección: ' + error.message, 'error');
      return;
    }

    const profile = await fetchFullProfile(currentUser.id, currentUser.email);
    setCurrentUser(profile);
    showToast('Dirección eliminada.', 'info');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        register,
        login,
        logout,
        updateProfile,
        changePassword,
        addAddress,
        updateAddress,
        deleteAddress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
