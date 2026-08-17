import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AdminProfile, AdminRole } from '../types';
import { useToast } from './ToastContext';

interface AdminAuthContextType {
  currentAdmin: AdminProfile | null;
  isAdminAuthenticated: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  hasAnyAdmin: boolean;
  createFirstAdmin: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  listAdmins: () => Promise<AdminProfile[]>;
  createAdmin: (name: string, email: string, password: string, role: AdminRole) => Promise<{ success: boolean; error?: string }>;
  updateAdminRole: (id: string, role: AdminRole) => Promise<{ success: boolean; error?: string }>;
  toggleAdminActive: (id: string, currentValue: boolean) => Promise<{ success: boolean; error?: string }>;
  deleteAdmin: (id: string) => Promise<{ success: boolean; error?: string }>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

function dbRowToAdminProfile(row: any): AdminProfile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

function mapAuthError(message: string): string {
  const known: Record<string, string> = {
    'Invalid login credentials': 'Correo o contraseña incorrectos.',
    'User already registered': 'Ya existe una cuenta registrada con este correo.',
  };
  return known[message] || message;
}

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentAdmin, setCurrentAdmin] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAnyAdmin, setHasAnyAdmin] = useState(false);
  const { showToast } = useToast();

  const checkHasAnyAdmin = async () => {
    // No podemos consultar admin_users directamente para esto: las políticas
    // de RLS bloquean a cualquiera que no esté logueado, así que un simple
    // select siempre devolvería 0 filas aunque SÍ exista un admin. Por eso
    // usamos una función de base de datos (RPC) diseñada para responder
    // solo "sí/no", sin exponer ninguna fila real.
    const { data, error } = await supabase.rpc('admin_exists');
    if (error) {
      console.error('No se pudo verificar si existe un administrador:', error.message);
      return;
    }
    setHasAnyAdmin(Boolean(data));
  };

  const loadAdminSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: row } = await supabase.from('admin_users').select('*').eq('id', session.user.id).single();
      if (row) {
        setCurrentAdmin(dbRowToAdminProfile(row));
      } else {
        // Hay sesión de Supabase pero no es una cuenta de administrador
        // (por ejemplo, es un cliente). No lo tratamos como admin.
        setCurrentAdmin(null);
      }
    } else {
      setCurrentAdmin(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    checkHasAnyAdmin();
    loadAdminSession();
  }, []);

  const createFirstAdmin = async (name: string, email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!name.trim() || !normalizedEmail || !password) {
      return { success: false, error: 'Completa todos los campos.' };
    }
    if (password.length < 8) {
      return { success: false, error: 'La contraseña de administrador debe tener al menos 8 caracteres.' };
    }

    // Usamos una Edge Function (con la clave secreta del lado del servidor)
    // en vez del registro público (auth.signUp), porque este último puede
    // estar bloqueado por la configuración "Allow new users to sign up"
    // del proyecto de Supabase. Esta vía no depende de ese interruptor.
    const { data: bootstrapResult, error: bootstrapError } = await supabase.functions.invoke('bootstrap-admin', {
      body: { name: name.trim(), email: normalizedEmail, password },
    });

    if (bootstrapError) {
      // supabase-js no expone el mensaje real del servidor en
      // bootstrapError.message (queda como texto genérico "Edge Function
      // returned a non-2xx status code"). El cuerpo de verdad viene en
      // bootstrapError.context, que es la Response cruda — hay que leerlo
      // a mano para mostrar el motivo real (ej: "Ya existe una cuenta...").
      let detail = bootstrapError.message;
      try {
        const context = (bootstrapError as any).context;
        if (context && typeof context.json === 'function') {
          const parsed = await context.json();
          if (parsed?.error) detail = parsed.error;
        }
      } catch {
        // Si no se pudo leer el detalle, nos quedamos con el mensaje genérico.
      }
      return { success: false, error: 'No se pudo crear la cuenta: ' + detail };
    }
    if (bootstrapResult?.error) {
      return { success: false, error: bootstrapResult.error };
    }

    // El usuario ya existe del lado de Supabase; ahora sí iniciamos sesión
    // normalmente (esto es un LOGIN, no un registro, así que no lo afecta
    // el interruptor de "Allow signups").
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (loginError || !loginData.user) {
      return { success: false, error: 'La cuenta se creó pero no se pudo iniciar sesión automáticamente. Probá loguearte de nuevo.' };
    }

    const { data: row } = await supabase.from('admin_users').select('*').eq('id', loginData.user.id).single();
    setCurrentAdmin(row ? dbRowToAdminProfile(row) : null);
    setHasAnyAdmin(true);
    showToast(`Cuenta de Super Administrador creada. ¡Bienvenido/a, ${name.trim()}!`, 'success');
    return { success: true };
  };

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });

    if (error) return { success: false, error: mapAuthError(error.message) };
    if (!data.user) return { success: false, error: 'No se pudo iniciar sesión.' };

    const { data: row, error: rowError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (rowError || !row) {
      await supabase.auth.signOut();
      return { success: false, error: 'Esta cuenta no tiene acceso administrativo.' };
    }

    if (!row.is_active) {
      await supabase.auth.signOut();
      return { success: false, error: 'Esta cuenta fue bloqueada por un Super Administrador.' };
    }

    setCurrentAdmin(dbRowToAdminProfile(row));
    showToast(`Bienvenido/a al panel, ${row.name}.`, 'success');
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentAdmin(null);
    showToast('Sesión de administrador cerrada.', 'info');
  };

  const listAdmins = async (): Promise<AdminProfile[]> => {
    const { data, error } = await supabase.from('admin_users').select('*').order('created_at', { ascending: true });
    if (error || !data) return [];
    return data.map(dbRowToAdminProfile);
  };

  // NOTA IMPORTANTE: crear un administrador nuevo requiere crear también su
  // usuario de autenticación (auth.users), y hacerlo desde el navegador con
  // supabase.auth.signUp() reemplazaría la sesión actual del Super Admin por
  // la del usuario recién creado (te dejaría deslogueado a vos). Por eso esta
  // función depende de una Edge Function del lado del servidor, que todavía
  // hay que desplegar — ver supabase/functions/create-admin.
  const createAdmin = async (name: string, email: string, password: string, role: AdminRole) => {
    if (!currentAdmin || currentAdmin.role !== 'super_admin') {
      return { success: false, error: 'Solo un Super Administrador puede realizar esta acción.' };
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) return { success: false, error: 'Sesión inválida, volvé a ingresar.' };

    const { data, error } = await supabase.functions.invoke('create-admin', {
      body: { name: name.trim(), email: email.trim().toLowerCase(), password, role },
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (error) {
      let detail = error.message;
      try {
        const context = (error as any).context;
        if (context && typeof context.json === 'function') {
          const parsed = await context.json();
          if (parsed?.error) detail = parsed.error;
        }
      } catch {
        // Nos quedamos con el mensaje genérico si no se pudo leer el detalle.
      }
      return { success: false, error: 'No se pudo crear el administrador: ' + detail };
    }
    if (data?.error) {
      return { success: false, error: data.error };
    }

    showToast(`Administrador "${name.trim()}" creado con rol ${role}.`, 'success');
    return { success: true };
  };

  const updateAdminRole = async (id: string, role: AdminRole) => {
    const { error } = await supabase.from('admin_users').update({ role }).eq('id', id);
    if (error) return { success: false, error: error.message };
    showToast('Rol actualizado.', 'success');
    return { success: true };
  };

  const toggleAdminActive = async (id: string, currentValue: boolean) => {
    if (id === currentAdmin?.id) {
      return { success: false, error: 'No podés bloquearte a vos mismo.' };
    }
    const { error } = await supabase.from('admin_users').update({ is_active: !currentValue }).eq('id', id);
    if (error) return { success: false, error: error.message };
    showToast(currentValue ? 'Administrador bloqueado.' : 'Administrador reactivado.', 'success');
    return { success: true };
  };

  const deleteAdmin = async (id: string) => {
    if (id === currentAdmin?.id) {
      return { success: false, error: 'No podés eliminar tu propia cuenta.' };
    }
    const { error } = await supabase.from('admin_users').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    showToast('Administrador eliminado.', 'success');
    return { success: true };
  };

  return (
    <AdminAuthContext.Provider
      value={{
        currentAdmin,
        isAdminAuthenticated: !!currentAdmin,
        isSuperAdmin: currentAdmin?.role === 'super_admin',
        isLoading,
        hasAnyAdmin,
        createFirstAdmin,
        login,
        logout,
        listAdmins,
        createAdmin,
        updateAdminRole,
        toggleAdminActive,
        deleteAdmin,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
