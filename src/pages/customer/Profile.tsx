import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Address } from '../../types';

type Tab = 'datos' | 'direcciones' | 'seguridad';

const emptyAddress: Omit<Address, 'id'> = {
  label: '',
  street: '',
  city: '',
  province: '',
  postalCode: '',
  isDefault: false,
};

export default function Profile() {
  const { currentUser, logout, updateProfile, changePassword, addAddress, updateAddress, deleteAddress } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('datos');

  // --- Datos personales ---
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [dataMsg, setDataMsg] = useState<string | null>(null);

  // --- Seguridad ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSubmitting, setPwdSubmitting] = useState(false);

  // --- Direcciones ---
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<Omit<Address, 'id'>>(emptyAddress);

  if (!currentUser) return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSaveData = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, phone });
    setDataMsg('Datos guardados correctamente.');
    setTimeout(() => setDataMsg(null), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);

    if (newPassword !== confirmNewPassword) {
      setPwdError('Las contraseñas nuevas no coinciden.');
      return;
    }

    setPwdSubmitting(true);
    const result = await changePassword(currentPassword, newPassword);
    setPwdSubmitting(false);

    if (result.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      setPwdError(result.error || 'No se pudo cambiar la contraseña.');
    }
  };

  const openAddAddress = () => {
    setAddressForm(emptyAddress);
    setEditingAddressId(null);
    setIsAddingAddress(true);
  };

  const openEditAddress = (address: Address) => {
    const { id, ...rest } = address;
    setAddressForm(rest);
    setEditingAddressId(id);
    setIsAddingAddress(true);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAddressId) {
      updateAddress(editingAddressId, addressForm);
    } else {
      addAddress(addressForm);
    }
    setIsAddingAddress(false);
    setEditingAddressId(null);
    setAddressForm(emptyAddress);
  };

  const initials = currentUser.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Encabezado */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-fixed font-headline-sm text-headline-sm font-bold flex items-center justify-center">
          {initials}
        </div>
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-on-background">{currentUser.name}</h1>
          <p className="font-body-sm text-body-sm text-secondary">{currentUser.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="ml-auto flex items-center gap-1 text-error font-label-lg text-label-lg font-bold px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Cerrar sesión
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {[
          { id: 'datos' as Tab, label: 'Mis datos' },
          { id: 'direcciones' as Tab, label: 'Direcciones' },
          { id: 'seguridad' as Tab, label: 'Seguridad' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Mis datos */}
      {tab === 'datos' && (
        <div className="bg-white shadow-level-1 rounded-xl p-6 max-w-[32rem]">
          <form onSubmit={handleSaveData} className="space-y-4">
            <div>
              <label className="block font-label-lg text-label-lg text-on-background mb-1">Nombre completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-outline-variant rounded-lg px-4 py-2.5 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary-fixed"
              />
            </div>
            <div>
              <label className="block font-label-lg text-label-lg text-on-background mb-1">Correo electrónico</label>
              <input
                type="email"
                value={currentUser.email}
                disabled
                className="w-full border border-outline-variant rounded-lg px-4 py-2.5 font-body-md text-body-md bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block font-label-lg text-label-lg text-on-background mb-1">Teléfono</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: +54 351 123 4567"
                className="w-full border border-outline-variant rounded-lg px-4 py-2.5 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary-fixed"
              />
            </div>
            {dataMsg && <p className="text-green-600 font-body-sm text-body-sm">{dataMsg}</p>}
            <button
              type="submit"
              className="bg-primary-container text-on-primary-fixed font-label-lg text-label-lg font-bold px-6 py-2.5 rounded-lg hover:brightness-95 transition-all"
            >
              Guardar cambios
            </button>
          </form>
        </div>
      )}

      {/* Direcciones */}
      {tab === 'direcciones' && (
        <div>
          {!isAddingAddress && (
            <button
              onClick={openAddAddress}
              className="mb-4 flex items-center gap-1 bg-primary-container text-on-primary-fixed font-label-lg text-label-lg font-bold px-4 py-2 rounded-lg hover:brightness-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Agregar dirección
            </button>
          )}

          {isAddingAddress && (
            <form onSubmit={handleSaveAddress} className="bg-white shadow-level-1 rounded-xl p-6 max-w-[32rem] mb-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block font-label-lg text-label-lg text-on-background mb-1">Etiqueta</label>
                  <input
                    type="text"
                    required
                    placeholder="Casa, Trabajo, etc."
                    value={addressForm.label}
                    onChange={(e) => setAddressForm((p) => ({ ...p, label: e.target.value }))}
                    className="w-full border border-outline-variant rounded-lg px-4 py-2.5 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary-fixed"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-label-lg text-label-lg text-on-background mb-1">Calle y número</label>
                  <input
                    type="text"
                    required
                    value={addressForm.street}
                    onChange={(e) => setAddressForm((p) => ({ ...p, street: e.target.value }))}
                    className="w-full border border-outline-variant rounded-lg px-4 py-2.5 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary-fixed"
                  />
                </div>
                <div>
                  <label className="block font-label-lg text-label-lg text-on-background mb-1">Ciudad</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))}
                    className="w-full border border-outline-variant rounded-lg px-4 py-2.5 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary-fixed"
                  />
                </div>
                <div>
                  <label className="block font-label-lg text-label-lg text-on-background mb-1">Provincia</label>
                  <input
                    type="text"
                    required
                    value={addressForm.province}
                    onChange={(e) => setAddressForm((p) => ({ ...p, province: e.target.value }))}
                    className="w-full border border-outline-variant rounded-lg px-4 py-2.5 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary-fixed"
                  />
                </div>
                <div>
                  <label className="block font-label-lg text-label-lg text-on-background mb-1">Código postal</label>
                  <input
                    type="text"
                    required
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm((p) => ({ ...p, postalCode: e.target.value }))}
                    className="w-full border border-outline-variant rounded-lg px-4 py-2.5 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary-fixed"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 mt-6">
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={(e) => setAddressForm((p) => ({ ...p, isDefault: e.target.checked }))}
                    />
                    <span className="font-body-sm text-body-sm">Predeterminada</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingAddress(false);
                    setEditingAddressId(null);
                  }}
                  className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-container text-on-primary-fixed rounded-md font-bold hover:brightness-95"
                >
                  Guardar dirección
                </button>
              </div>
            </form>
          )}

          {currentUser.addresses.length === 0 && !isAddingAddress && (
            <p className="text-secondary font-body-md text-body-md">Todavía no tienes direcciones guardadas.</p>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            {currentUser.addresses.map((addr) => (
              <div key={addr.id} className="bg-white shadow-level-1 rounded-xl p-5 relative">
                {addr.isDefault && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold bg-primary-container text-on-primary-fixed px-2 py-0.5 rounded-full">
                    Predeterminada
                  </span>
                )}
                <p className="font-label-lg text-label-lg font-bold text-on-background">{addr.label}</p>
                <p className="font-body-sm text-body-sm text-secondary mt-1">{addr.street}</p>
                <p className="font-body-sm text-body-sm text-secondary">
                  {addr.city}, {addr.province} ({addr.postalCode})
                </p>
                <div className="flex gap-3 mt-3">
                  <button onClick={() => openEditAddress(addr)} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                    Editar
                  </button>
                  <button onClick={() => deleteAddress(addr.id)} className="text-red-600 hover:text-red-900 text-sm font-medium">
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seguridad */}
      {tab === 'seguridad' && (
        <div className="bg-white shadow-level-1 rounded-xl p-6 max-w-[32rem]">
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-background mb-4">Cambiar contraseña</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {pwdError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-error rounded-lg px-4 py-3">
                <span className="material-symbols-outlined text-[18px] mt-0.5">error</span>
                <span className="font-body-sm text-body-sm">{pwdError}</span>
              </div>
            )}
            <div>
              <label className="block font-label-lg text-label-lg text-on-background mb-1">Contraseña actual</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border border-outline-variant rounded-lg px-4 py-2.5 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary-fixed"
              />
            </div>
            <div>
              <label className="block font-label-lg text-label-lg text-on-background mb-1">Nueva contraseña</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-outline-variant rounded-lg px-4 py-2.5 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary-fixed"
              />
            </div>
            <div>
              <label className="block font-label-lg text-label-lg text-on-background mb-1">Confirmar nueva contraseña</label>
              <input
                type="password"
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full border border-outline-variant rounded-lg px-4 py-2.5 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary-fixed"
              />
            </div>
            <button
              type="submit"
              disabled={pwdSubmitting}
              className="bg-primary-container text-on-primary-fixed font-label-lg text-label-lg font-bold px-6 py-2.5 rounded-lg hover:brightness-95 transition-all disabled:opacity-60"
            >
              {pwdSubmitting ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
