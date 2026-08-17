import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await login(email, password);

    setIsSubmitting(false);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error || 'No se pudo iniciar sesión.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-[28rem] bg-white rounded-xl shadow-level-2 p-8">
        <div className="text-center mb-8">
          <h1 className="font-headline-md text-headline-md font-bold text-on-background">Iniciar sesión</h1>
          <p className="font-body-md text-body-md text-secondary mt-1">Ingresa a tu cuenta de Rizq Tienda</p>
        </div>

        {from === '/checkout' && (
          <div className="mb-5 bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 text-sm text-gray-700">
            Iniciá sesión para continuar con la compra. Tu carrito se conservará.
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-error rounded-lg px-4 py-3">
            <span className="material-symbols-outlined text-[18px] mt-0.5">error</span>
            <span className="font-body-sm text-body-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-label-lg text-label-lg text-on-background mb-1">Correo electrónico</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-outline-variant rounded-lg px-4 py-2.5 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary-fixed"
              placeholder="tu@correo.com"
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
            className="w-full bg-primary-container text-on-primary-fixed font-label-lg text-label-lg font-bold py-3 rounded-lg hover:brightness-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="text-center font-body-sm text-body-sm text-secondary mt-6">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" state={{ from }} className="text-primary font-bold hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
