import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../../../services/api';
import { catalogItemApi } from '../api/catalogItemApi';
import { taxCategoryApi } from '../../../pricing/tax-category/api/taxCategoryApi';
import { ITEM_TYPES, CatalogItemResponse } from '../../../../types/inventory';
import { TaxCategoryResponse } from '../../../../types/pricing';

interface DropdownItem {
  id: number;
  name: string;
}

interface FormErrors {
  name?: string;
  itemType?: string;
  taxCategoryId?: string;
  basePrice?: string;
}

const CatalogItemPage: React.FC = () => {
  const [hotels, setHotels] = useState<DropdownItem[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string>('');
  const [taxCategories, setTaxCategories] = useState<TaxCategoryResponse[]>([]);
  const [items, setItems] = useState<CatalogItemResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Custom Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<CatalogItemResponse | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<CatalogItemResponse | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  // Form Fields State
  const [formData, setFormData] = useState({
    name: '',
    itemType: 'ROOM_SERVICE' as CatalogItemResponse['itemType'],
    taxCategoryId: '',
    basePrice: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });

  // Fetch initial configuration data (Hotels & Tax Categories)
  const fetchConfigData = async (): Promise<void> => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [hotelsData, taxData] = await Promise.all([
        api.get('/hotel/api/v1/inventory/hotels'),
        taxCategoryApi.getAll()
      ]);

      const hotelsList = Array.isArray(hotelsData) ? (hotelsData as DropdownItem[]) : [];
      setHotels(hotelsList);
      setTaxCategories(Array.isArray(taxData) ? taxData : []);

      if (hotelsList.length > 0) {
        setSelectedHotelId(hotelsList[0].id.toString());
      }
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setFetchError(axiosError.response?.data?.message || 'Failed to initialize configurations from the server.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch catalog items for the selected hotel
  const fetchCatalogItems = async (hotelId: string): Promise<void> => {
    if (!hotelId) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await catalogItemApi.getByHotelId(hotelId);
      setItems(Array.isArray(data) ? (data as CatalogItemResponse[]) : []);
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setFetchError(axiosError.response?.data?.message || 'Failed to fetch catalog items for the selected hotel.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigData();
  }, []);

  useEffect(() => {
    if (selectedHotelId) {
      fetchCatalogItems(selectedHotelId);
    } else {
      setItems([]);
    }
  }, [selectedHotelId]);

  const handleOpenCreate = (): void => {
    if (!selectedHotelId) {
      setFetchError('Please select a hotel before adding a catalog item.');
      return;
    }
    setEditingItem(null);
    setFormData({
      name: '',
      itemType: 'ROOM_SERVICE',
      taxCategoryId: taxCategories.length > 0 ? taxCategories[0].id.toString() : '',
      basePrice: '',
      status: 'ACTIVE'
    });
    setErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: CatalogItemResponse): void => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      itemType: item.itemType,
      taxCategoryId: item.taxCategoryId ? item.taxCategoryId.toString() : '',
      basePrice: item.basePrice.toString(),
      status: item.status
    });
    setErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Item name is required';
    if (!formData.itemType) newErrors.itemType = 'Item type category is required';
    if (!formData.taxCategoryId) newErrors.taxCategoryId = 'Tax category assignment is required';

    const priceVal = parseFloat(formData.basePrice);
    if (isNaN(priceVal) || priceVal < 0) {
      newErrors.basePrice = 'Base price must be a valid non-negative number';
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
      const payload = {
        name: formData.name.trim(),
        itemType: formData.itemType,
        taxCategoryId: parseInt(formData.taxCategoryId, 10),
        basePrice: parseFloat(formData.basePrice),
        status: formData.status
      };

      if (editingItem) {
        // PUT request
        await catalogItemApi.update(editingItem.id, payload);
      } else {
        // POST request
        const createPayload = {
          ...payload,
          hotelId: parseInt(selectedHotelId, 10)
        };
        await catalogItemApi.create(createPayload);
      }
      setIsModalOpen(false);
      fetchCatalogItems(selectedHotelId);
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setSubmitError(axiosError.response?.data?.message || 'Failed to save catalog item.');
    } finally {
      setIsLoading(false);
    }
  };

  // Open custom delete confirmation modal
  const handleOpenDelete = (item: CatalogItemResponse): void => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  // Execute Asynchronous API Delete
  const handleConfirmDelete = async (): Promise<void> => {
    if (!itemToDelete) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      await catalogItemApi.delete(itemToDelete.id);
      fetchCatalogItems(selectedHotelId);
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setFetchError(axiosError.response?.data?.message || 'Failed to delete catalog item.');
    } finally {
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      setIsLoading(false);
    }
  };

  // Find Tax Category helper
  const getTaxCategoryDisplay = (taxCatId: number): string => {
    const matched = taxCategories.find(c => c.id === taxCatId);
    return matched ? `${matched.categoryName} (${matched.categoryCode})` : `ID: ${taxCatId}`;
  };

  // Find Hotel Name helper
  const getHotelName = (hotelIdStr: string): string => {
    const matched = hotels.find(h => h.id.toString() === hotelIdStr);
    return matched ? matched.name : 'Unknown';
  };

  return (
    <div className="relative space-y-6 min-h-[400px]">
      {/* LOADING OVERLAY */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-[2px] flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            <span className="text-xs font-bold text-neutral-900 tracking-wider uppercase">Processing Request...</span>
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

      {/* Header section & Hotel filter dropdown */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-black tracking-tight">Catalog Items</h2>
          <p className="text-sm text-neutral-500">Manage catalog merchandise, optional services, and custom extra options.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {/* Hotel selector */}
          <div className="flex items-center space-x-2">
            <label htmlFor="hotel-filter" className="text-xs font-bold uppercase text-neutral-900 tracking-wider whitespace-nowrap">
              Hotel:
            </label>
            <select
              id="hotel-filter"
              value={selectedHotelId}
              onChange={(e) => setSelectedHotelId(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              {hotels.length === 0 ? (
                <option value="">No Hotels Registered</option>
              ) : (
                hotels.map((h) => (
                  <option key={h.id} value={h.id.toString()}>{h.name}</option>
                ))
              )}
            </select>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            disabled={hotels.length === 0}
            className={`flex items-center justify-center space-x-2 px-5 py-2.5 bg-red-600 text-white font-bold rounded shadow hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 w-full sm:w-auto
              ${hotels.length === 0 ? 'opacity-50 cursor-not-allowed bg-neutral-400 hover:bg-neutral-400' : ''}
            `}
            aria-label="Add new catalog item"
          >
            <Plus className="w-5 h-5" />
            <span>Add Catalog Item</span>
          </button>
        </div>
      </div>

      {/* Listing Table */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-900 text-white uppercase text-[11px] font-bold tracking-wider">
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Item Type</th>
                <th className="py-4 px-6">Tax Category</th>
                <th className="py-4 px-6">Base Price</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-sm">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-500 font-medium bg-neutral-50">
                    No catalog items configured for {selectedHotelId ? getHotelName(selectedHotelId) : 'this hotel'}.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-4 px-6 font-bold text-neutral-950">{item.id}</td>
                    <td className="py-4 px-6 font-semibold text-black">{item.name}</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-neutral-100 text-neutral-800 border border-neutral-300">
                        {item.itemType}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-neutral-600">{getTaxCategoryDisplay(item.taxCategoryId)}</td>
                    <td className="py-4 px-6 text-neutral-900 font-extrabold font-mono">
                      {parseFloat(item.basePrice.toString()).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
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
                          aria-label={`Edit item ${item.name}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(item)}
                          className="p-1.5 rounded hover:bg-red-50 text-neutral-600 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-600"
                          aria-label={`Delete item ${item.name}`}
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
                {editingItem ? 'Edit Catalog Item' : 'Add Catalog Item'}
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
                  <span className="text-sm font-semibold text-red-700">{submitError}</span>
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
              {/* Hotel Owner (Read-Only) */}
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                  Owning Hotel Branch
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={getHotelName(selectedHotelId)}
                  className="w-full px-3 py-2 border border-neutral-300 bg-neutral-100 rounded-md text-sm text-neutral-500 cursor-not-allowed focus:outline-none"
                />
              </div>

              {/* Item Name */}
              <div>
                <label htmlFor="item-name" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  id="item-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600
                    ${errors.name ? 'border-red-600 focus:border-red-600' : 'border-neutral-300 focus:border-black'}
                  `}
                  placeholder="E.g., Laundry Service, Minibar Soda"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>

              {/* Item Type (Dropdown) */}
              <div>
                <label htmlFor="item-type" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                  Category Type *
                </label>
                <select
                  id="item-type"
                  value={formData.itemType}
                  onChange={(e) => setFormData({ ...formData, itemType: e.target.value as CatalogItemResponse['itemType'] })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-black"
                >
                  {ITEM_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Tax Category (Dropdown) */}
              <div>
                <label htmlFor="item-tax" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                  Tax Category Assignment *
                </label>
                <select
                  id="item-tax"
                  value={formData.taxCategoryId}
                  onChange={(e) => setFormData({ ...formData, taxCategoryId: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600
                    ${errors.taxCategoryId ? 'border-red-600 focus:border-red-600' : 'border-neutral-300 focus:border-black'}
                  `}
                >
                  <option value="">-- Select Tax Category --</option>
                  {taxCategories.map((cat) => (
                    <option key={cat.id} value={cat.id.toString()}>
                      {cat.categoryName} ({cat.categoryCode})
                    </option>
                  ))}
                </select>
                {errors.taxCategoryId && (
                  <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{errors.taxCategoryId}</span>
                  </p>
                )}
              </div>

              {/* Base Price */}
              <div>
                <label htmlFor="item-price" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                  Base Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  id="item-price"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600
                    ${errors.basePrice ? 'border-red-600 focus:border-red-600' : 'border-neutral-300 focus:border-black'}
                  `}
                  placeholder="0.00"
                />
                {errors.basePrice && (
                  <p className="mt-1 text-xs text-red-600 flex items-center space-x-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{errors.basePrice}</span>
                  </p>
                )}
              </div>

              {/* Status */}
              <div>
                <label htmlFor="item-status" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                  Status
                </label>
                <select
                  id="item-status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-black"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              {/* Actions Footer */}
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
              Are you sure you want to permanently delete catalog item: <strong className="text-neutral-900 font-bold">{itemToDelete?.name}</strong>? This action cannot be undone.
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

export default CatalogItemPage;
