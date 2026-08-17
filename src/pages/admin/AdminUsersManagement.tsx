import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminRole, AdminProfile } from '../../types';

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Administrador',
  admin: 'Administrador',
  operador: 'Operador',
  vendedor: 'Vendedor',
  deposito: 'Depósito',
  marketing: 'Marketing',
};

const ASSIGNABLE_ROLES: AdminRole[] = ['admin', 'operador', 'vendedor', 'deposito', 'marketing', 'super_admin'];

export default function AdminUsersManagement() {
  const { currentAdmin, isSuperAdmin, listAdmins, createAdmin, updateAdminRole, toggleAdminActive, deleteAdmin } = useAdminAuth();

  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AdminRole>('operador');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refresh = async () => {
    setIsLoadingList(true);
    const list = await listAdmins();
    setAdmins(list);
    setIsLoadingList(false);
  };

  useEffect(() => {
    if (isSuperAdmin) refresh();
    else setIsLoadingList(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin]);

  if (!isSuperAdmin) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <span className="material-symbols-outlined text-red-500 text-4xl">lock</span>
        <p className="mt-2 text-gray-600">Solo un Super Administrador puede ver y gestionar los usuarios administrativos.</p>
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = await createAdmin(name, email, password, role);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'No se pudo crear el administrador.');
      return;
    }

    setName('');
    setEmail('');
    setPassword('');
    setRole('operador');
    setIsFormOpen(false);
    refresh();
  };

  const handleRoleChange = async (id: string, newRole: AdminRole) => {
    const result = await updateAdminRole(id, newRole);
    if (result.success) refresh();
    else if (result.error) alert(result.error);
  };

  const handleToggleActive = async (id: string, currentValue: boolean) => {
    const result = await toggleAdminActive(id, currentValue);
    if (result.success) refresh();
    else if (result.error) alert(result.error);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este administrador? Esta acción no se puede deshacer.')) return;
    const result = await deleteAdmin(id);
    if (result.success) refresh();
    else if (result.error) alert(result.error);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">
          Como Super Administrador, sos el único que puede crear, editar roles, bloquear o eliminar otros administradores.
        </p>
        {!isFormOpen && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-1 bg-primary-container text-on-primary-fixed font-bold px-4 py-2 rounded-lg hover:brightness-95 transition-all whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Nuevo administrador
          </button>
        )}
      </div>

      {isFormOpen && (
        <form onSubmit={handleCreate} className="bg-white shadow-sm rounded-xl p-6 mb-6 space-y-4 max-w-lg">
          <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-4 py-2 text-xs">
            Esto requiere que la Edge Function <code>create-admin</code> esté desplegada en tu proyecto de Supabase.
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nombre completo</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Correo</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña (mín. 8 caracteres)</label>
            <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Rol</label>
            <select value={role} onChange={(e) => setRole(e.target.value as AdminRole)} className="w-full border border-gray-300 rounded-md p-2">
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setIsFormOpen(false); setError(null); }} className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-container text-on-primary-fixed rounded-md font-bold hover:brightness-95 disabled:opacity-60">
              {isSubmitting ? 'Creando...' : 'Crear administrador'}
            </button>
          </div>
        </form>
      )}

      {isLoadingList ? (
        <p className="text-gray-500 text-sm">Cargando administradores...</p>
      ) : (
        <div className="bg-white shadow-sm rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-left">
              <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">Correo</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="p-3 font-medium">
                    {a.name} {a.id === currentAdmin?.id && <span className="text-xs text-gray-400">(vos)</span>}
                  </td>
                  <td className="p-3 text-gray-500">{a.email}</td>
                  <td className="p-3">
                    <select
                      value={a.role}
                      onChange={(e) => handleRoleChange(a.id, e.target.value as AdminRole)}
                      disabled={a.id === currentAdmin?.id}
                      className="border border-gray-300 rounded-md p-1 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      {ASSIGNABLE_ROLES.map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${a.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {a.isActive ? 'Activo' : 'Bloqueado'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleToggleActive(a.id, a.isActive)}
                        disabled={a.id === currentAdmin?.id}
                        className="text-amber-600 hover:text-amber-800 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {a.isActive ? 'Bloquear' : 'Reactivar'}
                      </button>
                      <button
                        onClick={() => handleDelete(a.id)}
                        disabled={a.id === currentAdmin?.id}
                        className="text-red-600 hover:text-red-800 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
