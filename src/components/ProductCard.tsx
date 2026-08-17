import React from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product }: { product: Product, key?: React.Key }) {
  const { addToCart } = useCart();

  return (
    <div className="bg-white rounded-xl product-card overflow-hidden transition-all flex flex-col h-full border border-[#EEEEEE]">
      <div className="relative h-64">
        <img className="w-full h-full object-cover" alt={product.name} src={product.images[0]} />
        {product.badge && (
          <span className="absolute top-3 left-3 bg-error text-white px-md py-1 rounded font-label-sm text-label-sm font-bold">
            {product.badge}
          </span>
        )}
        <button className="absolute top-3 right-3 bg-white/80 hover:bg-white p-2 rounded-full transition-colors">
          <span className="material-symbols-outlined text-primary text-sm">favorite</span>
        </button>
      </div>
      <div className="p-md flex flex-col flex-grow">
        <span className="font-label-sm text-label-sm text-secondary mb-1">{product.category}</span>
        <h3 className="font-label-lg text-label-lg font-bold mb-md truncate text-on-background">{product.name}</h3>
        <div className="mt-auto flex items-center justify-between">
          <div>
            <span className="font-headline-sm text-headline-sm font-bold text-on-background">
              ${(product.salePrice || product.price).toFixed(2)}
            </span>
            {product.salePrice && (
              <span className="text-secondary line-through text-xs ml-2">${product.price.toFixed(2)}</span>
            )}
          </div>
          <button 
            onClick={() => {
              if (product.stock !== undefined && product.stock <= 0) return;
              addToCart(product);
            }}
            disabled={product.stock !== undefined && product.stock <= 0}
            aria-label={product.stock !== undefined && product.stock <= 0 ? `${product.name} sin stock` : `Agregar ${product.name} al carrito`}
            className={`p-3 rounded-lg transition-all min-w-[44px] min-h-[44px] flex items-center justify-center focus:ring-2 focus:ring-primary focus:outline-none ${
              product.stock !== undefined && product.stock <= 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-primary-container hover:brightness-95 active:scale-95 text-on-primary-fixed'
            }`}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              {product.stock !== undefined && product.stock <= 0 ? 'block' : 'add_shopping_cart'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
