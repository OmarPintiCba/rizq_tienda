import React from 'react';
import { Link } from 'react-router-dom';
import { useCategories } from '../context/CategoryContext';
import { getCategoryPath } from '../utils/categoryPaths';

const getIconForCategory = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('computadora') || lowerName.includes('laptop')) return 'laptop_mac';
  if (lowerName.includes('celular') || lowerName.includes('smartphone')) return 'smartphone';
  if (lowerName.includes('mueble')) return 'chair';
  if (lowerName.includes('audio') || lowerName.includes('auricular')) return 'headset';
  if (lowerName.includes('reloj') || lowerName.includes('wearable')) return 'watch';
  if (lowerName.includes('teclado')) return 'keyboard';
  return 'category';
};

export default function Categories() {
  const { categories } = useCategories();
  const mainCategories = categories.filter(c => !c.parentId);

  return (
    <section className="mt-xxl px-margin-desktop">
      <h2 className="font-headline-md text-headline-md mb-lg text-on-background">Comprar por Categoría</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-md">
        {mainCategories.map((cat) => (
          <Link to={getCategoryPath(categories, cat)} key={cat.id} className="bg-white p-lg rounded-xl shadow-level-1 hover:shadow-level-2 transition-all cursor-pointer flex flex-col items-center group">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-md group-hover:bg-primary-container transition-colors">
              <span className="material-symbols-outlined text-primary text-3xl">{getIconForCategory(cat.name)}</span>
            </div>
            <span className="font-label-lg text-label-lg text-on-background text-center">{cat.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
