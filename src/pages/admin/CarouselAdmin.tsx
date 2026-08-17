import React, { useState } from 'react';
import { useCarousel } from '../../context/CarouselContext';
import { CarouselItem } from '../../types';

export default function CarouselAdmin() {
  const { carouselItems, updateCarouselItem } = useCarousel();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CarouselItem>>({});

  const handleEditClick = (item: CarouselItem) => {
    setEditingId(item.id);
    setEditForm(item);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = (id: string) => {
    updateCarouselItem(id, editForm);
    setEditingId(null);
    setEditForm({});
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditForm(prev => ({
        ...prev,
        image: reader.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white shadow-level-1 rounded-xl overflow-hidden p-6">
      <h2 className="text-xl font-bold mb-4">Administrar Carrusel</h2>
      <p className="text-sm text-gray-500 mb-6">
        Sube imágenes para los banners principales. Tamaño recomendado: <strong>1280x400 px</strong> (formato horizontal panorámico).
      </p>

      <div className="space-y-6">
        {carouselItems.map(item => (
          <div key={item.id} className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row gap-6">
            <div className="w-full flex flex-col gap-4">
              <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden border">
                <img 
                  src={editingId === item.id && editForm.image ? editForm.image : item.image} 
                  alt="Banner" 
                  className="w-full h-full object-cover" 
                />
              </div>
              
              {editingId === item.id ? (
                <div className="flex flex-col gap-4">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary-container file:text-primary-fixed
                      hover:file:bg-primary-container/80
                      border border-gray-300 rounded-md p-2"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={handleCancel} className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50">
                      Cancelar
                    </button>
                    <button onClick={() => handleSave(item.id)} className="px-4 py-2 bg-primary-container text-on-primary-fixed rounded-md font-bold hover:brightness-95">
                      Guardar Cambios
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end gap-2">
                  <button onClick={() => handleEditClick(item)} className="px-4 py-2 border rounded-md text-primary hover:bg-primary/5">
                    Cambiar Imagen
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
