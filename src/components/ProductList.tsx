import React from 'react';
import ProductCard from './ProductCard';
import { useProducts } from '../context/ProductContext';

export default function ProductList() {
  const { products, isLoading } = useProducts();
  const activeProducts = products.filter(product => product.isActive);

  return (
    <section className="mt-xxl px-margin-desktop">
      <div className="flex justify-between items-end mb-lg">
        <h2 className="font-headline-md text-headline-md text-on-background">Productos en Tendencia</h2>
        <a className="text-primary font-label-lg text-label-lg hover:underline" href="#">Ver Todas las Tendencias</a>
      </div>
      {isLoading ? (
        <div className="py-12 text-center text-secondary">Cargando productos...</div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-lg">
        {activeProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      )}
    </section>
  );
}
