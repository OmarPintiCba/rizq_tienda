import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminLogin() {
  const { login, createFirstAdmin, hasAnyAdmin, isLoading } = useAdminAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-on-background">
        <span className="material-symbols-outlined animate-spin text-white text-4xl">progress_activity</span>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'No se pudo iniciar sesión.');
      return;
    }
    navigate('/admin', { replace: true });
  };

  const handleCreateFirstAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = await createFirstAdmin(name, email, password);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'No se pudo crear la cuenta.');
      return;
    }
    navigate('/admin', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-on-background">
      <div className="w-full max-w-[24rem] bg-white rounded-xl shadow-level-2 p-8">
        <div className="text-center mb-8">
          <span className="material-symbols-outlined text-primary text-[40px]">admin_panel_settings</span>
          <h1 className="font-headline-md text-headline-md font-bold text-on-background mt-2">
            {hasAnyAdmin ? 'Panel Administrativo' : 'Configuración inicial'}
          </h1>
          <p className="font-body-sm text-body-sm text-secondary mt-1">
            {hasAnyAdmin
              ? 'Acceso exclusivo para administradores de Rizq Tienda'
              : 'Todavía no hay ninguna cuenta de administrador. Creá la primera para continuar.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-error rounded-lg px-4 py-3">
            <span className="material-symbols-outlined text-[18px] mt-0.5">error</span>
            <span className="font-body-sm text-body-sm">{error}</span>
          </div>
        )}

        {!hasAnyAdmin && (
          <form onSubmit={handleCreateFirstAdmin} className="space-y-4">
            <div>
              <label className="block font-label-lg text-label-lg text-on-background mb-1">Nombre completo</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-outline-variant rounded-lg px-4 py-2.5 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary-fixed"
                placeholder="Nombre del administrador"
              />
            </div>
            <div>
              <label className="block font-label-lg text-label-lg text-on-background mb-1">Correo</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-outline-variant rounded-lg px-4 py-2.5 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary-fixed"
                placeholder="rizq.tienda@gmail.com"
              />
            </div>
            <div>
              <label className="block font-label-lg text-label-lg text-on-background mb-1">Contraseña (mín. 8 caracteres)</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-outline-variant rounded-lg px-4 py-2.5 pr-10 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary-fixed"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-on-background text-white font-label-lg text-label-lg font-bold py-3 rounded-lg hover:brightness-110 transition-all disabled:opacity-60"
            >
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta de administrador'}
            </button>
          </form>
        )}

        {hasAnyAdmin && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block font-label-lg text-label-lg text-on-background mb-1">Correo de administrador</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-outline-variant rounded-lg px-4 py-2.5 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary-fixed"
                placeholder="rizq.tienda@gmail.com"
              />
            </div>
            <div>
              <label className="block font-label-lg text-label-lg text-on-background mb-1">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-outline-variant rounded-lg px-4 py-2.5 pr-10 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary-fixed"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-on-background text-white font-label-lg text-label-lg font-bold py-3 rounded-lg hover:brightness-110 transition-all disabled:opacity-60"
            >
              {isSubmitting ? 'Verificando...' : 'Ingresar al panel'}
            </button>
          </form>
        )}

        <p className="text-center font-body-sm text-body-sm text-secondary mt-6">
          ¿Sos cliente y buscás tu cuenta?{' '}
          <a href="/login" className="text-primary font-bold hover:underline">
            Ingresá acá
          </a>
        </p>
      </div>
    </div>
  );
}
