import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../../services/api';
import { taxCategoryApi } from '../tax-category/api/taxCategoryApi';
import { VatRuleResponse, VatRuleCreateRequest, VatRuleUpdateRequest, TaxCategoryResponse } from '../../../types/pricing';

interface FormErrors {
  vatCode?: string;
  vatName?: string;
  vatPercent?: string;
  taxCategoryId?: string;
  endDate?: string;
}

const VatRuleView: React.FC = () => {
  const [items, setItems] = useState<VatRuleResponse[]>([]);
  const [taxCategories, setTaxCategories] = useState<TaxCategoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Custom Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<VatRuleResponse | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<VatRuleResponse | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  // Form Fields State
  const [formData, setFormData] = useState({
    vatCode: '',
    vatName: '',
    vatPercent: '10.00',
    taxCategoryId: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });

  // Fetch VAT Rules from Backend
  const fetchVatRules = async (): Promise<void> => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await api.get('/hotel/api/v1/pricing/vat-rules');
      setItems(Array.isArray(data) ? (data as VatRuleResponse[]) : []);
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setFetchError(axiosError.response?.data?.message || 'Failed to fetch VAT rules from the server.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Tax Categories for Dropdown
  const fetchTaxCategories = async (): Promise<void> => {
    try {
      const data = await taxCategoryApi.getAll();
      setTaxCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load tax categories', err);
    }
  };

  useEffect(() => {
    fetchVatRules();
    fetchTaxCategories();
  }, []);

  const handleOpenCreate = (): void => {
    setEditingItem(null);
    setFormData({
      vatCode: '',
      vatName: '',
      vatPercent: '10.00',
      taxCategoryId: taxCategories.length > 0 ? taxCategories[0].id.toString() : '',
      startDate: '',
      endDate: '',
      status: 'ACTIVE'
    });
    setErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule: VatRuleResponse): void => {
    setEditingItem(rule);
    setFormData({
      vatCode: rule.vatCode,
      vatName: rule.vatName,
      vatPercent: rule.vatPercent.toString(),
      taxCategoryId: rule.taxCategoryId.toString(),
      startDate: rule.startDate || '',
      endDate: rule.endDate || '',
      status: rule.status
    });
    setErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Check vatCode validation only if creating
    if (!editingItem) {
      if (!formData.vatCode.trim()) {
        newErrors.vatCode = 'VAT code is required';
      } else if (!/^[A-Z0-9_]{3,20}$/.test(formData.vatCode.trim())) {
        newErrors.vatCode = 'Code must be 3-20 uppercase alphanumeric characters or underscores';
      }
    }

    if (!formData.vatName.trim()) {
      newErrors.vatName = 'VAT name is required';
    }

    const percentVal = parseFloat(formData.vatPercent);
    if (isNaN(percentVal) || percentVal < 0 || percentVal > 100) {
      newErrors.vatPercent = 'Percent must be a valid number between 0% and 100%';
    }

    if (!formData.taxCategoryId) {
      newErrors.taxCategoryId = 'Tax category assignment is required';
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        newErrors.endDate = 'End date cannot be earlier than start date';
      }
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
      const taxCategoryId = parseInt(formData.taxCategoryId, 10);
      const vatPercent = parseFloat(formData.vatPercent);

      if (editingItem) {
        // PUT Request
        const payload: VatRuleUpdateRequest = {
          vatName: formData.vatName.trim(),
          vatPercent,
          taxCategoryId,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          status: formData.status
        };
        await api.put(`/hotel/api/v1/pricing/vat-rules/${editingItem.id}`, payload);
      } else {
        // POST Request
        const payload: VatRuleCreateRequest = {
          vatCode: formData.vatCode.trim().toUpperCase(),
          vatName: formData.vatName.trim(),
          vatPercent,
          taxCategoryId,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          status: formData.status
        };
        await api.post('/hotel/api/v1/pricing/vat-rules', payload);
      }
      setIsModalOpen(false);
      fetchVatRules();
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setSubmitError(axiosError.response?.data?.message || 'Failed to save VAT rule.');
    } finally {
      setIsLoading(false);
    }
  };

  // Open custom delete confirmation modal
  const handleOpenDelete = (rule: VatRuleResponse): void => {
    setItemToDelete(rule);
    setIsDeleteModalOpen(true);
  };

  // Execute Asynchronous API Delete
  const handleConfirmDelete = async (): Promise<void> => {
    if (!itemToDelete) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      await api.delete(`/hotel/api/v1/pricing/vat-rules/${itemToDelete.id}`);
      fetchVatRules();
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setFetchError(axiosError.response?.data?.message || 'Failed to delete VAT rule.');
    } finally {
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      setIsLoading(false);
    }
  };

  const getTaxCategoryName = (taxCategoryId: number): string => {
    const matched = taxCategories.find(c => c.id === taxCategoryId);
    return matched ? `${matched.categoryName} (${matched.categoryCode})` : `Category ${taxCategoryId}`;
  };

  return (
    <div className="relative space-y-6 min-h-[400px]">
      {/* LOADING OVERLAY */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-[2px] flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            <span className="text-xs font-bold text-neutral-900 tracking-wider uppercase">Loading VAT Rules...</span>
          </div>
        </div>
      )}

      {/* TOP API FETCH ERROR BANNER */}
      {fetchError && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-red-800">{fetchError}</span>
          </div>
          <button 
            type="button"
            onClick={() => setFetchError(null)}
            className="text-red-600 hover:text-red-800 transition-colors focus:outline-none"
            aria-label="Dismiss fetch error"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-black tracking-tight">VAT Rules</h2>
          <p className="text-sm text-neutral-500">Configure value-added tax rates per category and dynamic dates.</p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-red-600 text-white font-bold rounded shadow hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 w-full sm:w-auto"
          aria-label="Add new VAT rule"
        >
          <Plus className="w-5 h-5" />
          <span>Add VAT Rule</span>
        </button>
      </div>

      {/* Table view */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-900 text-white uppercase text-[11px] font-bold tracking-wider">
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">VAT Code</th>
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Rate</th>
                <th className="py-4 px-6">Tax Category</th>
                <th className="py-4 px-6">Active Period</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-sm">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-neutral-500 font-medium bg-neutral-50">
                    No VAT rules registered. Click "Add VAT Rule" to create one.
                  </td>
                </tr>
              ) : (
                items.map((rule) => (
                  <tr key={rule.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-4 px-6 font-bold text-neutral-900">{rule.id}</td>
                    <td className="py-4 px-6 font-mono font-bold text-red-600">{rule.vatCode}</td>
                    <td className="py-4 px-6 font-semibold text-black">{rule.vatName}</td>
                    <td className="py-4 px-6 text-neutral-900 font-extrabold">{rule.vatPercent}%</td>
                    <td className="py-4 px-6 font-medium text-black">
                      {getTaxCategoryName(rule.taxCategoryId)}
                    </td>
                    <td className="py-4 px-6 text-neutral-600 text-xs">
                      {rule.startDate ? (
                        <span>
                          {rule.startDate} {rule.endDate ? `to ${rule.endDate}` : 'onwards'}
                        </span>
                      ) : (
                        <span className="text-neutral-400 italic">No start limit</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider
                        ${rule.status === 'ACTIVE' 
                          ? 'bg-neutral-100 text-black border border-neutral-300' 
                          : 'bg-red-50 text-red-600 border border-red-200'
                        }
                      `}>
                        {rule.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(rule)}
                          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-700 hover:text-black focus:outline-none focus:ring-2 focus:ring-red-600"
                          aria-label={`Edit VAT rule ${rule.vatCode}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(rule)}
                          className="p-1.5 rounded hover:bg-red-50 text-neutral-600 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-600"
                          aria-label={`Delete VAT rule ${rule.vatCode}`}
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

      {/* OVERLAY MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative bg-white border border-neutral-200 rounded-lg shadow-xl w-full max-w-md z-10 overflow-hidden animate-scale-up">
            {/* Header */}
            <div className="bg-neutral-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold uppercase tracking-wider">
                {editingItem ? 'Edit VAT Rule' : 'Add VAT Rule'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-red-600"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MUTATION ERROR ALERT BOX */}
            {submitError && (
              <div className="bg-red-50 border-l-4 border-red-600 p-4 m-6 mb-0 rounded flex items-center justify-between shadow-sm animate-fade-in">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <span className="text-sm font-semibold text-red-800">{submitError}</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setSubmitError(null)}
                  className="text-red-600 hover:text-red-800 transition-colors focus:outline-none"
                  aria-label="Dismiss submit error"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* VAT Code */}
              <div>
                <label htmlFor="vat-code" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                  VAT Code * {editingItem && <span className="text-[10px] text-neutral-500 font-normal lowercase tracking-normal">(immutable)</span>}
                </label>
                <input
                  type="text"
                  id="vat-code"
                  disabled={!!editingItem}
                  readOnly={!!editingItem}
                  value={formData.vatCode}
                  onChange={(e) => setFormData({ ...formData, vatCode: e.target.value.toUpperCase() })}
                  className={`w-full px-3 py-2 border rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-600
                    ${editingItem 
                      ? 'bg-neutral-100 border-neutral-300 text-neutral-500 cursor-not-allowed ring-0' 
                      : errors.vatCode 
                        ? 'border-red-600 focus:border-red-600' 
                        : 'border-neutral-300 focus:border-black'
                    }
                  `}
                  placeholder="E.g., VAT_ROOM_STD"
                  style={{ textTransform: 'uppercase' }}
                />
                {errors.vatCode && !editingItem && (
                  <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{errors.vatCode}</span>
                  </p>
                )}
              </div>

              {/* VAT Name */}
              <div>
                <label htmlFor="vat-name" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                  VAT Rule Name *
                </label>
                <input
                  type="text"
                  id="vat-name"
                  value={formData.vatName}
                  onChange={(e) => setFormData({ ...formData, vatName: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600
                    ${errors.vatName ? 'border-red-600 focus:border-red-600' : 'border-neutral-300 focus:border-black'}
                  `}
                  placeholder="E.g., Standard Room VAT"
                />
                {errors.vatName && (
                  <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{errors.vatName}</span>
                  </p>
                )}
              </div>

              {/* VAT Percent Rate */}
              <div>
                <label htmlFor="vat-percent" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                  Tax Rate Percent (%) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  id="vat-percent"
                  value={formData.vatPercent}
                  onChange={(e) => setFormData({ ...formData, vatPercent: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600
                    ${errors.vatPercent ? 'border-red-600 focus:border-red-600' : 'border-neutral-300 focus:border-black'}
                  `}
                  placeholder="10.00"
                />
                {errors.vatPercent && (
                  <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{errors.vatPercent}</span>
                  </p>
                )}
              </div>

              {/* Tax Category Dropdown */}
              <div>
                <label htmlFor="tax-category-id" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                  Tax Category *
                </label>
                <select
                  id="tax-category-id"
                  value={formData.taxCategoryId}
                  onChange={(e) => setFormData({ ...formData, taxCategoryId: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-600
                    ${errors.taxCategoryId ? 'border-red-600 focus:border-red-600' : 'border-neutral-300 focus:border-black'}
                  `}
                >
                  <option value="">Select Tax Category</option>
                  {taxCategories.map(cat => (
                    <option key={cat.id} value={cat.id.toString()}>{cat.categoryName} ({cat.categoryCode})</option>
                  ))}
                </select>
                {errors.taxCategoryId && (
                  <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{errors.taxCategoryId}</span>
                  </p>
                )}
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="vat-start-date" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="vat-start-date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-black"
                  />
                </div>
                <div>
                  <label htmlFor="vat-end-date" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="vat-end-date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600
                      ${errors.endDate ? 'border-red-600 focus:border-red-600' : 'border-neutral-300 focus:border-black'}
                    `}
                  />
                  {errors.endDate && (
                    <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{errors.endDate}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                <label htmlFor="vat-status" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                  Status
                </label>
                <select
                  id="vat-status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-black"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-200 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 rounded-md text-sm font-medium text-neutral-700 hover:text-black hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-md text-sm shadow transition-colors focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[1px] animate-fade-in">
          <div 
            className="fixed inset-0" 
            onClick={() => { setIsDeleteModalOpen(false); setItemToDelete(null); }}
          />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center border border-neutral-200 z-10 animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-black uppercase tracking-wider mb-2">Confirm Destruction</h3>
            <p className="text-sm text-neutral-600 mb-6">
              Are you sure you want to permanently delete VAT rule: <strong className="text-neutral-900 font-bold">{itemToDelete?.vatCode}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => { setIsDeleteModalOpen(false); setItemToDelete(null); }}
                className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold py-2 px-4 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400"
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

export default VatRuleView;
