import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useCategories } from '../context/CategoryContext';
import { useAuth } from '../context/AuthContext';
import { getCategoryPath } from '../utils/categoryPaths';

export default function Header() {
  const { cartItems, setIsCartOpen } = useCart();
  const { categories } = useCategories();
  const { currentUser, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [openSubCategoryId, setOpenSubCategoryId] = useState<string | null>(null);
  const categoriesMenuRef = useRef<HTMLDivElement>(null);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const mainCategories = categories.filter((category) => !category.parentId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
      if (categoriesMenuRef.current && !categoriesMenuRef.current.contains(event.target as Node)) {
        setIsCategoriesOpen(false);
        setOpenSubCategoryId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeCategories = () => {
    setIsCategoriesOpen(false);
    setOpenSubCategoryId(null);
  };

  const handleLogout = () => {
    setIsAccountMenuOpen(false);
    logout();
    navigate('/');
  };

  return (
    <header className="bg-on-tertiary-fixed shadow-sm sticky top-0 z-40">
      <div className="flex justify-between items-center px-margin-desktop w-full max-max-width mx-auto py-sm">
        <Link className="font-headline-md text-headline-md font-bold text-primary-container mr-lg" to="/">
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjmK9wTyuuJmzh2LEjvbdEW5dhIbNhSmbXKK7odqxJxMXiCaNvnw3ozxdgH3rrt0HawLAJAGjZACzX-kZNWiClF5CFWFT530b9xJyooJ7ms-wqGFcgqVxC7YEaj77wjnYPn4vqISsN3hfdTQDqLkVDL2WPAkOoexiUMGJF0gsje83PrsFD95niKSbJUqiw1r6AdM_JGXspnq9FpFAkuMx5DBGVKeiw9Ebnm6YDFyYuT0XyavDAoUEv9YLcTrHM2huWzx03TrKvOfE" alt="Rizq Logo" className="h-10 w-auto object-contain" />
        </Link>

        <div className="flex-grow max-w-2xl relative mx-md hidden sm:block">
          <div className="flex items-center bg-white rounded-lg overflow-hidden border border-[#EEEEEE] shadow-level-1 h-10">
            <span className="material-symbols-outlined ml-md text-secondary">search</span>
            <input className="w-full px-md py-sm border-none focus:outline-none font-body-md text-body-md" placeholder="Buscar productos, marcas y más..." type="text" />
            <button className="bg-primary-container text-on-primary-fixed px-xl h-full font-label-lg text-label-lg font-bold hover:brightness-95 transition-all">Buscar</button>
          </div>
        </div>

        <nav className="hidden md:flex items-center space-x-lg">
          <div className="relative" ref={accountMenuRef}>
            {isAuthenticated ? (
              <div className="flex flex-col items-center cursor-pointer group" onClick={() => setIsAccountMenuOpen((open) => !open)}>
                <span className="material-symbols-outlined text-white group-hover:text-primary-fixed transition-colors">person</span>
                <span className="font-label-sm text-label-sm text-white group-hover:text-primary-fixed max-w-[80px] truncate">{currentUser?.name.split(' ')[0]}</span>
              </div>
            ) : (
              <Link to="/login" className="flex flex-col items-center cursor-pointer group">
                <span className="material-symbols-outlined text-white group-hover:text-primary-fixed transition-colors">person</span>
                <span className="font-label-sm text-label-sm text-white group-hover:text-primary-fixed">Ingresar</span>
              </Link>
            )}

            {isAuthenticated && isAccountMenuOpen && (
              <div className="absolute top-full right-0 mt-2 bg-white shadow-lg rounded-lg min-w-[200px] z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-label-lg text-label-lg font-bold text-on-background truncate">{currentUser?.name}</p>
                  <p className="font-body-sm text-body-sm text-secondary truncate">{currentUser?.email}</p>
                </div>
                <Link to="/perfil" onClick={() => setIsAccountMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary">
                  <span className="material-symbols-outlined text-[18px]">account_circle</span>
                  Mi perfil
                </Link>
                <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 text-left">
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
          <button className="flex flex-col items-center cursor-pointer group relative" onClick={() => setIsCartOpen(true)}>
            <span className="material-symbols-outlined text-white group-hover:text-primary-fixed transition-colors">shopping_cart</span>
            <span className="font-label-sm text-label-sm text-white group-hover:text-primary-fixed">Carrito</span>
            {totalItems > 0 && <span className="absolute -top-1 -right-1 bg-primary text-on-primary text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{totalItems}</span>}
          </button>
        </nav>

        <div className="flex md:hidden items-center space-x-4">
          <span className="material-symbols-outlined text-white cursor-pointer" onClick={() => setIsCartOpen(true)}>shopping_cart</span>
        </div>
      </div>

      <div className="bg-on-tertiary-fixed border-t border-outline-variant/10">
        <div className="flex justify-start items-center px-margin-desktop w-full max-max-width mx-auto h-12 space-x-lg relative">
          <div className="relative h-full flex items-center flex-shrink-0" ref={categoriesMenuRef}>
            <button
              onClick={() => {
                setIsCategoriesOpen((open) => !open);
                setOpenSubCategoryId(null);
              }}
              className="text-white hover:text-primary-fixed transition-colors font-body-md text-body-md whitespace-nowrap cursor-pointer flex items-center gap-1"
            >
              Categorías
              <span className="material-symbols-outlined text-[16px]">{isCategoriesOpen ? 'expand_less' : 'expand_more'}</span>
            </button>

            {isCategoriesOpen && (
              <div className="absolute top-full left-0 bg-white shadow-lg rounded-b-lg min-w-[220px] z-50 py-1">
                {mainCategories.length === 0 && <p className="px-4 py-3 text-sm text-gray-500">No hay categorías cargadas todavía.</p>}
                {mainCategories.map((mainCategory) => {
                  const children = categories.filter((category) => category.parentId === mainCategory.id);
                  return (
                    <div key={mainCategory.id} className="relative">
                      <div className="flex items-center hover:bg-gray-50">
                        <Link
                          to={getCategoryPath(categories, mainCategory)}
                          onClick={closeCategories}
                          className="flex-1 px-4 py-3 text-sm text-gray-700 hover:text-primary"
                        >
                          {mainCategory.name}
                        </Link>
                        {children.length > 0 && (
                          <button
                            onClick={() => setOpenSubCategoryId((id) => id === mainCategory.id ? null : mainCategory.id)}
                            className="px-3 py-3 text-gray-500 hover:text-primary"
                            aria-label={`Ver subcategorías de ${mainCategory.name}`}
                          >
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                          </button>
                        )}
                      </div>

                      {children.length > 0 && openSubCategoryId === mainCategory.id && (
                        <div className="absolute top-0 left-full bg-white shadow-lg rounded-lg min-w-[220px] py-1">
                          <Link to={getCategoryPath(categories, mainCategory)} onClick={closeCategories} className="block px-4 py-3 text-sm font-bold text-on-background hover:bg-gray-50 hover:text-primary">
                            Ver todo en {mainCategory.name}
                          </Link>
                          {children.map((child) => (
                            <Link key={child.id} to={getCategoryPath(categories, child)} onClick={closeCategories} className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary">
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-lg overflow-x-auto no-scrollbar h-full">
            <a className="text-white hover:text-primary-fixed transition-colors font-body-md text-body-md whitespace-nowrap" href="#">Ofertas</a>
            <a className="text-white hover:text-primary-fixed transition-colors font-body-md text-body-md whitespace-nowrap" href="#">Novedades</a>
          </div>
        </div>
      </div>
    </header>
  );
}
