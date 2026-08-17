import React, { useMemo, useState } from 'react';
import { useCategories } from '../../context/CategoryContext';
import { Category } from '../../types';
import { getCategoryDepth, getDescendantIds, wouldCreateCategoryCycle } from '../../utils/categoryPaths';

export default function CategoryAdmin() {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Category>>({});
  const [isAdding, setIsAdding] = useState(false);

  const orderedCategories = useMemo(() => {
    const result: Category[] = [];
    const walk = (parentId?: string) => {
      categories
        .filter((category) => (category.parentId || undefined) === parentId)
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((category) => {
          result.push(category);
          walk(category.id);
        });
    };
    walk(undefined);
    return result;
  }, [categories]);

  const handleEditClick = (category: Category) => {
    setIsEditing(category.id);
    setIsAdding(false);
    setEditForm(category);
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
    setIsAdding(false);
    setEditForm({});
  };

  const handleSaveEdit = async (id: string) => {
    if (!editForm.name?.trim()) {
      alert('Por favor, ingresá el nombre de la categoría.');
      return;
    }
    if (wouldCreateCategoryCycle(categories, id, editForm.parentId)) {
      alert('Esa categoría no puede depender de sí misma ni de una categoría hija.');
      return;
    }
    const result = await updateCategory(id, { ...editForm, name: editForm.name.trim() });
    if (result.success) handleCancelEdit();
  };

  const handleSaveNew = async () => {
    if (!editForm.name?.trim()) {
      alert('Por favor, ingresá el nombre de la categoría.');
      return;
    }
    const result = await addCategory({
      name: editForm.name.trim(),
      parentId: editForm.parentId,
    });
    if (result.success) handleCancelEdit();
  };

  const handleDelete = async (category: Category) => {
    const descendants = getDescendantIds(categories, category.id).size - 1;
    const detail = descendants > 0
      ? `\n\nTiene ${descendants} categoría${descendants === 1 ? '' : 's'} dentro. Al eliminarla, esas categorías pasarán al nivel principal.`
      : '';
    if (!window.confirm(`¿Eliminar la categoría "${category.name}"?${detail}`)) return;
    await deleteCategory(category.id);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value === '' ? undefined : value }));
  };

  const parentOptions = (editingId?: string) => {
    const forbidden = editingId ? getDescendantIds(categories, editingId) : new Set<string>();
    return orderedCategories.filter((category) => !forbidden.has(category.id));
  };

  const renderParentSelect = (editingId?: string) => (
    <select
      name="parentId"
      value={editForm.parentId || ''}
      onChange={handleChange}
      className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
    >
      <option value="">Ninguna (Categoría principal)</option>
      {parentOptions(editingId).map((category) => {
        const depth = getCategoryDepth(categories, category);
        return (
          <option key={category.id} value={category.id}>
            {'— '.repeat(depth)}{category.name}
          </option>
        );
      })}
    </select>
  );

  return (
    <div className="bg-white shadow-level-1 rounded-xl p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold">Administrar Categorías</h2>
          <p className="text-sm text-gray-500 mt-1">Podés crear niveles como Tecnología → Accesorios → Cargadores y seguir escalando.</p>
        </div>
        <button
          onClick={() => {
            setIsAdding(true);
            setIsEditing(null);
            setEditForm({ name: '', parentId: undefined });
          }}
          className="bg-primary-container text-on-primary-fixed px-4 py-2 rounded-lg font-bold hover:brightness-95 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add</span>
          Nueva Categoría
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Depende de</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isAdding && (
              <tr className="bg-yellow-50">
                <td className="px-6 py-4 min-w-[240px]">
                  <input type="text" name="name" value={editForm.name || ''} onChange={handleChange} placeholder="Ej: Accesorios" className="w-full border-gray-300 rounded-md shadow-sm p-2 border" />
                </td>
                <td className="px-6 py-4 min-w-[260px]">{renderParentSelect()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={handleSaveNew} className="text-green-600 hover:text-green-900 mr-3">Guardar</button>
                  <button onClick={handleCancelEdit} className="text-gray-600 hover:text-gray-900">Cancelar</button>
                </td>
              </tr>
            )}

            {orderedCategories.map((category) => {
              const depth = getCategoryDepth(categories, category);
              const parent = category.parentId ? categories.find((item) => item.id === category.parentId) : undefined;
              return (
                <tr key={category.id} className={depth === 0 ? 'bg-gray-50/50' : ''}>
                  {isEditing === category.id ? (
                    <>
                      <td className="px-6 py-4 min-w-[240px]">
                        <input type="text" name="name" value={editForm.name || ''} onChange={handleChange} className="w-full border-gray-300 rounded-md shadow-sm p-2 border" />
                      </td>
                      <td className="px-6 py-4 min-w-[260px]">{renderParentSelect(category.id)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleSaveEdit(category.id)} className="text-green-600 hover:text-green-900 mr-3">Guardar</button>
                        <button onClick={handleCancelEdit} className="text-gray-600 hover:text-gray-900">Cancelar</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className={`px-6 py-4 whitespace-nowrap ${depth === 0 ? 'font-bold' : 'text-gray-700'}`}>
                        <span style={{ paddingLeft: `${depth * 24}px` }}>
                          {depth > 0 && <span className="text-gray-400 mr-2">↳</span>}
                          {category.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">{parent?.name || 'Principal'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleEditClick(category)} className="text-indigo-600 hover:text-indigo-900 mr-3">Editar</button>
                        <button onClick={() => handleDelete(category)} className="text-red-600 hover:text-red-900">Eliminar</button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}

            {!isAdding && orderedCategories.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-gray-500">Todavía no hay categorías. Creá la primera para empezar.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
