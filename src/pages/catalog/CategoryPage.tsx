import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ProductCard from '../../components/ProductCard';
import { useCategories } from '../../context/CategoryContext';
import { useProducts } from '../../context/ProductContext';
import {
  getCategoryAncestors,
  getCategoryChildren,
  getCategoryPath,
  getDescendantIds,
  resolveCategoryFromPath,
} from '../../utils/categoryPaths';

type SortOption = 'relevant' | 'price-asc' | 'price-desc' | 'newest';

export default function CategoryPage() {
  const location = useLocation();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { products, isLoading: productsLoading } = useProducts();
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('relevant');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const rawPath = location.pathname.replace(/^\/categoria\/?/, '');
  const currentCategory = useMemo(
    () => resolveCategoryFromPath(categories, rawPath),
    [categories, rawPath]
  );

  const breadcrumbs = useMemo(
    () => currentCategory ? getCategoryAncestors(categories, currentCategory) : [],
    [categories, currentCategory]
  );

  const children = useMemo(
    () => currentCategory ? getCategoryChildren(categories, currentCategory.id) : [],
    [categories, currentCategory]
  );

  const categoryProductIds = useMemo(
    () => currentCategory ? getDescendantIds(categories, currentCategory.id) : new Set<string>(),
    [categories, currentCategory]
  );

  const baseProducts = useMemo(() => {
    if (!currentCategory) return [];
    return products.filter((product) =>
      product.isActive && !!product.categoryId && categoryProductIds.has(product.categoryId)
    );
  }, [products, currentCategory, categoryProductIds]);

  const brands = useMemo<string[]>(
    () => Array.from(new Set<string>(baseProducts.map((product) => product.brand).filter((brand): brand is string => Boolean(brand)))).sort((a, b) => a.localeCompare(b)),
    [baseProducts]
  );

  const filteredProducts = useMemo(() => {
    let result = baseProducts.filter((product) => {
      const finalPrice = product.salePrice || product.price;
      if (selectedBrands.length && !selectedBrands.includes(product.brand)) return false;
      if (minPrice && finalPrice < Number(minPrice)) return false;
      if (maxPrice && finalPrice > Number(maxPrice)) return false;
      if (inStockOnly && product.stock <= 0) return false;
      return true;
    });

    result = [...result].sort((a, b) => {
      const priceA = a.salePrice || a.price;
      const priceB = b.salePrice || b.price;
      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      if (sortBy === 'newest') return 0;
      if (a.isFeatured !== b.isFeatured) return Number(b.isFeatured) - Number(a.isFeatured);
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [baseProducts, selectedBrands, minPrice, maxPrice, inStockOnly, sortBy]);

  const clearFilters = () => {
    setSelectedBrands([]);
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
  };

  if (categoriesLoading) {
    return <div className="w-full max-max-width mx-auto px-margin-desktop py-16 text-center text-secondary">Cargando categoría...</div>;
  }

  if (!currentCategory) {
    return (
      <main className="w-full max-max-width mx-auto px-margin-desktop py-16 flex-grow">
        <div className="bg-white rounded-xl border border-[#EEEEEE] p-8 text-center shadow-level-1">
          <h1 className="font-headline-md text-headline-md font-bold mb-3">Categoría no encontrada</h1>
          <p className="text-secondary mb-6">La categoría solicitada no existe o fue modificada.</p>
          <Link to="/" className="inline-flex bg-primary-container text-on-primary-fixed px-5 py-3 rounded-lg font-bold">Volver al inicio</Link>
        </div>
      </main>
    );
  }

  const FiltersContent = () => (
    <div className="space-y-7">
      <div>
        <p className="font-bold text-on-background mb-3">Categorías</p>
        {children.length ? (
          <div className="space-y-2">
            {children.map((child) => (
              <Link
                key={child.id}
                to={getCategoryPath(categories, child)}
                onClick={() => setMobileFiltersOpen(false)}
                className="block text-secondary hover:text-primary transition-colors"
              >
                {child.name}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-secondary">No hay subcategorías.</p>
        )}
      </div>

      {brands.length > 0 && (
        <div className="border-t border-[#EEEEEE] pt-5">
          <p className="font-bold text-on-background mb-3">Marca</p>
          <div className="space-y-2">
            {brands.map((brand) => (
              <label key={brand} className="flex items-center gap-2 text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={(event) => setSelectedBrands((current) =>
                    event.target.checked ? [...current, brand] : current.filter((item) => item !== brand)
                  )}
                  className="accent-primary"
                />
                <span>{brand}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-[#EEEEEE] pt-5">
        <p className="font-bold text-on-background mb-3">Precio</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            placeholder="Mínimo"
            className="w-full min-w-0 border border-[#DDDDDD] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <span className="text-secondary">—</span>
          <input
            type="number"
            min="0"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            placeholder="Máximo"
            className="w-full min-w-0 border border-[#DDDDDD] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="border-t border-[#EEEEEE] pt-5">
        <p className="font-bold text-on-background mb-3">Disponibilidad</p>
        <label className="flex items-center gap-2 text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(event) => setInStockOnly(event.target.checked)}
            className="accent-primary"
          />
          <span>Solo productos con stock</span>
        </label>
      </div>

      {(selectedBrands.length > 0 || minPrice || maxPrice || inStockOnly) && (
        <button onClick={clearFilters} className="text-primary font-bold hover:underline">Limpiar filtros</button>
      )}
    </div>
  );

  return (
    <>
      <main className="w-full max-max-width mx-auto flex-grow pb-xxl">
        <section className="bg-primary-container text-on-primary-fixed px-margin-desktop py-8 md:py-10">
          <div className="max-max-width mx-auto">
            <h1 className="font-headline-md text-headline-md md:text-3xl font-bold">{currentCategory.name}</h1>
          </div>
        </section>

        <div className="px-margin-desktop pt-6">
          <nav className="flex items-center gap-2 flex-wrap text-sm text-secondary mb-6" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-primary">Inicio</Link>
            {breadcrumbs.map((category, index) => (
              <React.Fragment key={category.id}>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                {index === breadcrumbs.length - 1 ? (
                  <span className="font-bold text-on-background">{category.name}</span>
                ) : (
                  <Link to={getCategoryPath(categories, category)} className="hover:text-primary">{category.name}</Link>
                )}
              </React.Fragment>
            ))}
          </nav>

          {children.length > 0 && (
            <div className="mb-7 md:hidden overflow-x-auto no-scrollbar flex gap-2 pb-1">
              {children.map((child) => (
                <Link key={child.id} to={getCategoryPath(categories, child)} className="bg-white border border-[#EEEEEE] rounded-full px-4 py-2 whitespace-nowrap text-sm font-medium shadow-level-1">
                  {child.name}
                </Link>
              ))}
            </div>
          )}

          <div className="flex items-start gap-8">
            <aside className="hidden md:block w-56 lg:w-64 flex-shrink-0">
              <div className="mb-6">
                {breadcrumbs.length > 1 && (
                  <p className="text-secondary mb-2">{breadcrumbs[breadcrumbs.length - 2].name}</p>
                )}
                <h2 className="text-xl font-bold text-on-background">{currentCategory.name}</h2>
                <p className="text-sm text-secondary mt-1">{baseProducts.length} producto{baseProducts.length === 1 ? '' : 's'}</p>
              </div>
              <FiltersContent />
            </aside>

            <section className="min-w-0 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-on-background">Productos en {currentCategory.name}</h2>
                  <p className="text-sm text-secondary mt-1">{filteredProducts.length} resultado{filteredProducts.length === 1 ? '' : 's'}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMobileFiltersOpen(true)}
                    className="md:hidden flex-1 sm:flex-none border border-[#DDDDDD] bg-white rounded-lg px-4 py-2 font-bold flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[19px]">tune</span>
                    Filtrar
                  </button>
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value as SortOption)}
                    className="border border-[#DDDDDD] bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    aria-label="Ordenar productos"
                  >
                    <option value="relevant">Más relevantes</option>
                    <option value="price-asc">Menor precio</option>
                    <option value="price-desc">Mayor precio</option>
                    <option value="newest">Novedades</option>
                  </select>
                </div>
              </div>

              {productsLoading ? (
                <div className="py-16 text-center text-secondary">Cargando productos...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#EEEEEE] p-8 text-center shadow-level-1">
                  <span className="material-symbols-outlined text-4xl text-secondary mb-2">inventory_2</span>
                  <h3 className="font-bold text-lg mb-2">No hay productos para mostrar</h3>
                  <p className="text-secondary">Probá quitando algún filtro o cargá productos en esta categoría desde el administrador.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-lg">
                  {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {mobileFiltersOpen && (
        <div className="md:hidden fixed inset-0 z-[70]">
          <button className="absolute inset-0 bg-black/40" aria-label="Cerrar filtros" onClick={() => setMobileFiltersOpen(false)} />
          <aside className="absolute right-0 top-0 bottom-0 w-[88%] max-w-sm bg-white shadow-xl overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Filtros</h2>
              <button onClick={() => setMobileFiltersOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100" aria-label="Cerrar">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <FiltersContent />
          </aside>
        </div>
      )}
    </>
  );
}
