import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { ProductProvider } from './context/ProductContext';
import { CarouselProvider } from './context/CarouselContext';
import { CategoryProvider } from './context/CategoryContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { isSupabaseConfigured } from './lib/supabaseClient';
import Header from './components/Header';
import Hero from './components/Hero';
import Categories from './components/Categories';
import ProductList from './components/ProductList';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLogin from './pages/admin/AdminLogin';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profile from './pages/customer/Profile';
import CategoryPage from './pages/catalog/CategoryPage';
import Checkout from './pages/Checkout';
import PurchaseConfirmed from './pages/PurchaseConfirmed';


import { useCart } from './context/CartContext';
import { useAuth } from './context/AuthContext';

function Storefront() {
  const { setIsCartOpen, cartItems } = useCart();
  const { isAuthenticated } = useAuth();
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <main className="w-full max-max-width mx-auto pb-xxl flex-grow">
        <Hero />
        <Categories />
        <ProductList />
      </main>
      <Footer />
      <CartDrawer />
      
      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg flex justify-around items-center py-sm border-t border-[#EEEEEE] z-40">
        <button className="flex flex-col items-center text-primary font-bold min-w-[44px] min-h-[44px] justify-center focus:outline-none">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">home</span>
          <span className="text-[10px]">Inicio</span>
        </button>
        <button className="flex flex-col items-center text-secondary min-w-[44px] min-h-[44px] justify-center focus:outline-none">
          <span className="material-symbols-outlined" aria-hidden="true">category</span>
          <span className="text-[10px]">Categorías</span>
        </button>
        <button onClick={() => setIsCartOpen(true)} className="flex flex-col items-center text-secondary relative min-w-[44px] min-h-[44px] justify-center focus:outline-none">
          <span className="material-symbols-outlined" aria-hidden="true">shopping_cart</span>
          <span className="text-[10px]">Carrito</span>
          {totalItems > 0 && (
            <span className="absolute top-1 right-2 bg-primary text-on-primary text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {totalItems}
            </span>
          )}
        </button>
        <Link
          to={isAuthenticated ? '/perfil' : '/login'}
          className="flex flex-col items-center text-secondary min-w-[44px] min-h-[44px] justify-center focus:outline-none"
        >
          <span className="material-symbols-outlined" aria-hidden="true">person</span>
          <span className="text-[10px]">Cuenta</span>
        </Link>
      </div>
    </>
  );
}

function Layout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-sans">
      {!isAdmin && <Header />}
      
      {isAdmin && (
        <header className="bg-on-tertiary-fixed shadow-sm sticky top-0 z-40 py-sm">
           <div className="flex justify-between items-center px-margin-desktop w-full max-max-width mx-auto">
             <div className="flex items-center gap-md">
               <Link to="/" className="font-headline-md text-headline-md font-bold text-primary-container">
                  Rizq Admin
               </Link>
             </div>
             <Link to="/" className="text-white hover:text-primary-fixed transition-colors font-label-lg flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">storefront</span>
                Volver a la tienda
             </Link>
           </div>
        </header>
      )}

      <Routes>
        <Route path="/" element={<Storefront />} />
        <Route path="/categoria/*" element={<><CategoryPage /><Footer /><CartDrawer /></>} />
        <Route path="/checkout" element={<><Checkout /><Footer /></>} />
        <Route path="/compra-confirmada" element={<><PurchaseConfirmed /><Footer /></>} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default function App() {
  if (!isSupabaseConfigured) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#1a1c1c', color: 'white', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <div style={{ maxWidth: 480 }}>
          <h1 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>⚠️ Faltan configurar las variables de Supabase</h1>
          <p style={{ fontSize: 14, opacity: 0.8, lineHeight: 1.5 }}>
            El sitio no puede conectarse a la base de datos porque faltan <code>VITE_SUPABASE_URL</code> y/o <code>VITE_SUPABASE_ANON_KEY</code>.
            <br /><br />
            En Vercel: <b>Settings → Environment Variables</b>, agregá ambas, y hacé <b>Redeploy</b> sin caché.
            <br /><br />
            En local: revisá que exista el archivo <code>.env</code> en la raíz del proyecto.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <AuthProvider>
        <AdminAuthProvider>
          <CategoryProvider>
            <CarouselProvider>
              <ProductProvider>
                <CartProvider>
                  <BrowserRouter>
                    <Layout />
                  </BrowserRouter>
                </CartProvider>
              </ProductProvider>
            </CarouselProvider>
          </CategoryProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
