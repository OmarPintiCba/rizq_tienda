import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../../context/ProductContext';
import { useCategories } from '../../context/CategoryContext';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Product } from '../../types';
import CarouselAdmin from './CarouselAdmin';
import CategoryAdmin from './CategoryAdmin';
import AdminUsersManagement from './AdminUsersManagement';
import SalesAdmin from './SalesAdmin';
import AbandonedCartsAdmin from './AbandonedCartsAdmin';

export default function AdminDashboard() {
  const { products, isLoading: productsLoading, addProduct, updateProduct, deleteProduct, uploadProductImages } = useProducts();
  const { categories } = useCategories();
  const { currentAdmin, isSuperAdmin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'products' | 'carousel' | 'categories' | 'sales' | 'abandoned' | 'users'>('products');

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({ images: [] });
  const [isAdding, setIsAdding] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);

  const handleEditClick = (product: Product) => {
    setIsEditing(product.id);
    setEditForm(product);
    setIsFormOpen(true);
  };

  const handleCancelEdit = () => {
    setIsFormOpen(false);
    setIsEditing(null);
    setIsAdding(false);
    setEditForm({ images: [] });
  };

  const handleSaveEdit = async (id: string) => {
    setIsSaving(true);
    const result = await updateProduct(id, editForm);
    setIsSaving(false);
    if (result.success) handleCancelEdit();
  };

  const handleSaveNew = async () => {
    if (editForm.name && editForm.price && editForm.categoryId && editForm.images && editForm.images.length > 0) {
      setIsSaving(true);
      const result = await addProduct(editForm as Omit<Product, 'id'>);
      setIsSaving(false);
      if (result.success) handleCancelEdit();
    } else {
      alert('Por favor, completa los campos requeridos (Nombre, Categoría, Precio y al menos 1 imagen).');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setEditForm((prev) => ({ ...prev, [name]: checked }));
    } else if (name === 'price' || name === 'salePrice' || name === 'cost' || name === 'stock' || name === 'minStock') {
      setEditForm((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setEditForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const availableSlots = 3 - (editForm.images?.length || 0);
    if (availableSlots <= 0) return;

    setIsUploadingImages(true);
    const result = await uploadProductImages(files.slice(0, availableSlots));
    setIsUploadingImages(false);

    if (result.success && result.data) {
      setEditForm(prev => ({
        ...prev,
        images: [...(prev.images || []), ...result.data!]
      }));
    } else if (result.error) {
      alert(result.error);
    }

    e.target.value = '';
  };

  const removeImage = (indexToRemove: number) => {
    setEditForm(prev => ({
      ...prev,
      images: prev.images?.filter((_, index) => index !== indexToRemove)
    }));
  };

  const renderImageUploader = () => (
    <div className="mt-2">
      <input 
        type="file" 
        multiple 
        accept="image/*" 
        onChange={handleImageUpload} 
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-md file:border-0
          file:text-sm file:font-semibold
          file:bg-primary-container file:text-primary-fixed
          hover:file:bg-primary-container/80
          border border-gray-300 rounded-md p-2"
        disabled={isUploadingImages || Boolean(editForm.images && editForm.images.length >= 3)}
      />
      <p className="text-xs text-gray-500 mt-1">Hasta 3 imágenes, máximo 5 MB cada una. Se guardan en Supabase Storage.</p>
      {isUploadingImages && <p className="text-xs text-primary mt-1 font-medium">Subiendo imágenes...</p>}
      
      {editForm.images && editForm.images.length > 0 && (
        <div className="flex gap-2 mt-2">
          {editForm.images.map((img, idx) => (
            <div key={idx} className="relative w-16 h-16 border rounded-md overflow-hidden">
              <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
              <button 
                onClick={() => removeImage(idx)}
                className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 rounded-bl flex items-center justify-center text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-on-background">Panel de Administración</h1>
          {currentAdmin && (
            <p className="text-sm text-gray-500 mt-1">Conectado como {currentAdmin.name} ({currentAdmin.email})</p>
          )}
        </div>
        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="flex items-center gap-1 text-red-600 font-bold text-sm px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Cerrar sesión
        </button>
      </div>

      <div className="flex flex-wrap border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('products')}
          className={`py-2 px-4 border-b-2 font-medium text-sm ${
            activeTab === 'products'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Productos
        </button>
        <button
          onClick={() => setActiveTab('carousel')}
          className={`py-2 px-4 border-b-2 font-medium text-sm ${
            activeTab === 'carousel'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Carrusel
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`py-2 px-4 border-b-2 font-medium text-sm ${
            activeTab === 'categories'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Categorías
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`py-2 px-4 border-b-2 font-medium text-sm ${activeTab === 'sales' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          Ventas
        </button>
        <button
          onClick={() => setActiveTab('abandoned')}
          className={`py-2 px-4 border-b-2 font-medium text-sm ${activeTab === 'abandoned' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          Carritos abandonados
        </button>
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-4 border-b-2 font-medium text-sm flex items-center gap-1 ${
              activeTab === 'users'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">shield_person</span>
            Usuarios administrativos
          </button>
        )}
      </div>

      {activeTab === 'users' && <AdminUsersManagement />}
      {activeTab === 'sales' && <SalesAdmin />}
      {activeTab === 'abandoned' && <AbandonedCartsAdmin />}

      {activeTab === 'products' && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => {
                setIsAdding(true);
                setEditForm({ name: '', description: '', category: '', categoryId: '', brand: '', price: 0, cost: 0, stock: 0, minStock: 0, isActive: true, isFeatured: false, images: [] });
                setIsFormOpen(true);
              }}
              className="bg-primary-container text-on-primary-fixed px-4 py-2 rounded-lg font-bold hover:brightness-95 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined">add</span>
              Nuevo Producto
            </button>
          </div>

          {isFormOpen ? (
            <div className="bg-white shadow-level-1 rounded-xl p-6">
               <h2 className="text-xl font-bold mb-4">{isAdding ? 'Nuevo Producto' : 'Editar Producto'}</h2>
               {/* Form Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Nombre</label>
                    <input type="text" name="name" value={editForm.name || ''} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm p-2 border" />
                  </div>
                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Descripción</label>
                    <textarea name="description" value={editForm.description || ''} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm p-2 border h-24" />
                  </div>
                  {/* Category & Brand */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Categoría</label>
                    <select
                      name="categoryId"
                      value={editForm.categoryId || ''}
                      onChange={(e) => {
                        const category = categories.find(c => c.id === e.target.value);
                        setEditForm(prev => ({ ...prev, categoryId: e.target.value, category: category?.name || '' }));
                      }} className="mt-1 w-full border-gray-300 rounded-md shadow-sm p-2 border">
                      <option value="">Selecciona una categoría</option>
                      {categories.filter(c => !c.parentId).map(mainCat => (
                        <optgroup key={mainCat.id} label={mainCat.name}>
                          <option value={mainCat.id}>{mainCat.name}</option>
                          {categories.filter(sub => sub.parentId === mainCat.id).map(subCat => (
                            <option key={subCat.id} value={subCat.id}>{subCat.name}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Marca</label>
                    <input type="text" name="brand" value={editForm.brand || ''} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm p-2 border" />
                  </div>
                  {/* Prices */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Precio Regular</label>
                    <input type="number" name="price" value={editForm.price || ''} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm p-2 border" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Precio Oferta</label>
                    <input type="number" name="salePrice" value={editForm.salePrice || ''} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm p-2 border" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Costo</label>
                    <input type="number" name="cost" value={editForm.cost || ''} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm p-2 border" />
                  </div>
                  {/* SKU & Barcode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">SKU</label>
                    <input type="text" name="sku" value={editForm.sku || ''} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm p-2 border" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Código de barras</label>
                    <input type="text" name="barcode" value={editForm.barcode || ''} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm p-2 border" />
                  </div>
                  {/* Stock */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stock</label>
                    <input type="number" name="stock" value={editForm.stock || ''} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm p-2 border" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stock mínimo</label>
                    <input type="number" name="minStock" value={editForm.minStock || ''} onChange={handleChange} className="mt-1 w-full border-gray-300 rounded-md shadow-sm p-2 border" />
                  </div>
                  {/* State / Featured */}
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="isActive" checked={editForm.isActive || false} onChange={handleChange} />
                      <span className="text-sm">Activo</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="isFeatured" checked={editForm.isFeatured || false} onChange={handleChange} />
                      <span className="text-sm">Destacado</span>
                    </label>
                  </div>
                  {/* Images */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Imágenes</label>
                    {renderImageUploader()}
                  </div>
               </div>
               {/* Actions */}
               <div className="flex justify-end gap-2 mt-6">
                  <button onClick={handleCancelEdit} className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50">Cancelar</button>
                  <button
                    onClick={isAdding ? handleSaveNew : () => handleSaveEdit(editForm.id!)}
                    disabled={isSaving || isUploadingImages}
                    className="px-4 py-2 bg-primary-container text-on-primary-fixed rounded-md font-bold hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </button>
               </div>
            </div>
          ) : (
            <div className="bg-white shadow-level-1 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {productsLoading && (
                      <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">Cargando productos...</td></tr>
                    )}
                    {!productsLoading && products.length === 0 && (
                      <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">No hay productos cargados.</td></tr>
                    )}
                    {!productsLoading && products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <img className="h-10 w-10 rounded-md object-cover border" src={product.images[0]} alt="" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${product.salePrice ? product.salePrice.toFixed(2) : product.price.toFixed(2)}
                          {product.salePrice && <span className="line-through text-xs ml-2 text-gray-400">${product.price.toFixed(2)}</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.stock}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.isActive ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Activo</span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Inactivo</span>
                          )}
                          {product.isFeatured && (
                            <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Destacado</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditClick(product)}
                            disabled={busyProductId === product.id}
                            className="text-indigo-600 hover:text-indigo-900 mr-3 disabled:opacity-50"
                          >Editar</button>
                          <button
                            onClick={async () => {
                              setBusyProductId(product.id);
                              await updateProduct(product.id, { isActive: !product.isActive });
                              setBusyProductId(null);
                            }}
                            disabled={busyProductId === product.id}
                            className={`${product.isActive ? 'text-amber-600 hover:text-amber-800' : 'text-green-600 hover:text-green-800'} mr-3 disabled:opacity-50`}
                          >
                            {busyProductId === product.id ? 'Procesando...' : product.isActive ? 'Desactivar' : 'Reactivar'}
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`¿Eliminar definitivamente ${product.name}? Esta acción no se puede deshacer.`)) {
                                setBusyProductId(product.id);
                                await deleteProduct(product.id);
                                setBusyProductId(null);
                              }
                            }}
                            disabled={busyProductId === product.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'carousel' && (
        <CarouselAdmin />
      )}

      {activeTab === 'categories' && (
        <CategoryAdmin />
      )}
    </div>
  );
}
