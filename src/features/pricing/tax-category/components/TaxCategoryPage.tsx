import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertCircle, Loader2 } from 'lucide-react';
import { taxCategoryApi } from '../api/taxCategoryApi';
import { TaxCategoryResponse, TaxCategoryCreateRequest, TaxCategoryUpdateRequest } from '../../../../types/pricing';

interface FormErrors {
  categoryCode?: string;
  categoryName?: string;
  description?: string;
}

const TaxCategoryPage: React.FC = () => {
  const [categories, setCategories] = useState<TaxCategoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<TaxCategoryResponse | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<TaxCategoryResponse | null>(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    categoryCode: '',
    categoryName: '',
    description: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });

  const fetchTaxCategories = async (): Promise<void> => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await taxCategoryApi.getAll();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setFetchError(axiosError.response?.data?.message || 'Failed to fetch tax categories.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxCategories();
  }, []);

  const handleOpenCreate = (): void => {
    setEditingItem(null);
    setFormData({
      categoryCode: '',
      categoryName: '',
      description: '',
      status: 'ACTIVE'
    });
    setErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: TaxCategoryResponse): void => {
    setEditingItem(item);
    setFormData({
      categoryCode: item.categoryCode,
      categoryName: item.categoryName,
      description: item.description || '',
      status: item.status
    });
    setErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.categoryCode.trim()) {
      newErrors.categoryCode = 'Category code is required';
    } else if (!/^[A-Z0-9_]{2,20}$/.test(formData.categoryCode.trim())) {
      newErrors.categoryCode = 'Code must be 2-20 uppercase alphanumeric characters or underscores';
    }

    if (!formData.categoryName.trim()) {
      newErrors.categoryName = 'Category name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setSubmitError(null);
    try {
      if (editingItem) {
        const payload: TaxCategoryUpdateRequest = {
          categoryCode: formData.categoryCode.trim().toUpperCase(),
          categoryName: formData.categoryName.trim(),
          description: formData.description.trim() || null,
          status: formData.status
        };
        await taxCategoryApi.update(editingItem.id, payload);
      } else {
        const payload: TaxCategoryCreateRequest = {
          categoryCode: formData.categoryCode.trim().toUpperCase(),
          categoryName: formData.categoryName.trim(),
          description: formData.description.trim() || null,
          status: formData.status
        };
        await taxCategoryApi.create(payload);
      }
      setIsModalOpen(false);
      fetchTaxCategories();
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setSubmitError(axiosError.response?.data?.message || 'Failed to save tax category.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDelete = (item: TaxCategoryResponse): void => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!itemToDelete) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      await taxCategoryApi.delete(itemToDelete.id);
      fetchTaxCategories();
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setFetchError(axiosError.response?.data?.message || 'Failed to delete tax category.');
    } finally {
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      setIsLoading(false);
    }
  };

  return (
    <div className="relative space-y-6 min-h-[400px]">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-[2px] flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            <span className="text-xs font-bold text-neutral-900 tracking-wider uppercase">Loading Tax Categories...</span>
          </div>
        </div>
      )}

      {/* Fetch error banner */}
      {fetchError && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-red-800">{fetchError}</span>
          </div>
          <button 
            type="button"
            onClick={() => setFetchError(null)}
            className="text-red-600 hover:text-red-800 transition-colors focus:outline-none"
            aria-label="Dismiss error banner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-black tracking-tight">Tax Categories</h2>
          <p className="text-sm text-neutral-500">Manage tax categories applied to room rates and catalog items.</p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-red-600 text-white font-bold rounded shadow hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 w-full sm:w-auto"
          aria-label="Create new tax category"
        >
          <Plus className="w-5 h-5" />
          <span>Create Tax Category</span>
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-900 text-white uppercase text-[11px] font-bold tracking-wider">
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">Category Code</th>
                <th className="py-4 px-6">Category Name</th>
                <th className="py-4 px-6">Description</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-sm">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500 font-medium bg-neutral-50">
                    No tax categories configured.
                  </td>
                </tr>
              ) : (
                categories.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-4 px-6 font-bold text-neutral-900">{item.id}</td>
                    <td className="py-4 px-6 font-bold text-red-600 font-mono">{item.categoryCode}</td>
                    <td className="py-4 px-6 font-semibold text-black">{item.categoryName}</td>
                    <td className="py-4 px-6 text-neutral-600 max-w-xs truncate">{item.description || '—'}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider
                        ${item.status === 'ACTIVE' 
                          ? 'bg-neutral-100 text-black border border-neutral-300' 
                          : 'bg-red-50 text-red-600 border border-red-200'
                        }
                      `}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-700 hover:text-black focus:outline-none focus:ring-2 focus:ring-red-600"
                          aria-label={`Edit tax category ${item.categoryCode}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(item)}
                          className="p-1.5 rounded hover:bg-red-50 text-neutral-600 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-600"
                          aria-label={`Delete tax category ${item.categoryCode}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-neutral-200 z-10 p-6">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-4 mb-4">
              <h3 className="text-lg font-extrabold text-black uppercase tracking-tight">
                {editingItem ? 'Edit Tax Category' : 'Create Tax Category'}
              </h3>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-500 hover:text-neutral-900 focus:outline-none"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {submitError && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-600 p-3 rounded flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span className="text-xs font-semibold text-red-800">{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="categoryCode" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                  Category Code <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="categoryCode"
                  value={formData.categoryCode}
                  onChange={(e) => setFormData({ ...formData, categoryCode: e.target.value })}
                  placeholder="e.g. ROOM, SERVICE"
                  className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600
                    ${errors.categoryCode ? 'border-red-600 focus:border-red-600' : 'border-neutral-300 focus:border-black'}
                  `}
                />
                {errors.categoryCode && (
                  <p className="mt-1 text-xs font-semibold text-red-600">{errors.categoryCode}</p>
                )}
              </div>

              <div>
                <label htmlFor="categoryName" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                  Category Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="categoryName"
                  value={formData.categoryName}
                  onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                  placeholder="e.g. Room Stays, Laundry"
                  className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600
                    ${errors.categoryName ? 'border-red-600 focus:border-red-600' : 'border-neutral-300 focus:border-black'}
                  `}
                />
                {errors.categoryName && (
                  <p className="mt-1 text-xs font-semibold text-red-600">{errors.categoryName}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional detail description of this category"
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-black"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-black"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="flex items-center space-x-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold py-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      {isDeleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 transition-opacity"
            onClick={() => { setIsDeleteModalOpen(false); setItemToDelete(null); }}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-neutral-200 z-10 p-6 text-center animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-extrabold text-black uppercase tracking-tight mb-2">Delete Tax Category</h4>
            <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
              Are you sure you want to permanently delete:
              <strong className="text-black block mt-2 font-bold bg-neutral-50 p-2.5 rounded border border-neutral-200 font-mono">
                {itemToDelete.categoryName} ({itemToDelete.categoryCode})
              </strong>
              This action cannot be undone.
            </p>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => { setIsDeleteModalOpen(false); setItemToDelete(null); }}
                className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold py-2 px-4 rounded transition-colors focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxCategoryPage;
