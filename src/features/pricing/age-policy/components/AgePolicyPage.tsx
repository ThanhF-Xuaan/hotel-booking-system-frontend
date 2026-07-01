import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../../../services/api';
import { agePolicyApi } from '../api/agePolicyApi';
import { HotelAgePolicyResponse, HotelAgePolicyCreateRequest, HotelAgePolicyUpdateRequest } from '../../../../types/pricing';

interface DropdownItem {
  id: number;
  name: string;
}

interface FormErrors {
  hotelId?: string;
  guestType?: string;
  minAge?: string;
  maxAge?: string;
}

const GUEST_TYPES = ['ADULT', 'CHILD', 'INFANT'] as const;

const AgePolicyPage: React.FC = () => {
  const [policies, setPolicies] = useState<HotelAgePolicyResponse[]>([]);
  const [hotels, setHotels] = useState<DropdownItem[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<HotelAgePolicyResponse | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<HotelAgePolicyResponse | null>(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    hotelId: '',
    guestType: 'CHILD' as typeof GUEST_TYPES[number],
    minAge: '0',
    maxAge: '17',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });

  const fetchHotels = async (): Promise<void> => {
    try {
      const response = await api.get('/hotel/api/v1/inventory/hotels');
      setHotels(Array.isArray(response) ? (response as DropdownItem[]) : []);
    } catch (err) {
      console.error('Failed to load hotels list', err);
    }
  };

  const fetchAgePolicies = async (hotelId?: string): Promise<void> => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const hId = hotelId ? parseInt(hotelId, 10) : undefined;
      const data = await agePolicyApi.getAll(hId);
      setPolicies(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setFetchError(axiosError.response?.data?.message || 'Failed to fetch age policies.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  useEffect(() => {
    fetchAgePolicies(selectedHotelId);
  }, [selectedHotelId]);

  const handleOpenCreate = (): void => {
    setEditingItem(null);
    setFormData({
      hotelId: hotels.length > 0 ? hotels[0].id.toString() : '',
      guestType: 'CHILD',
      minAge: '6',
      maxAge: '11',
      status: 'ACTIVE'
    });
    setErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: HotelAgePolicyResponse): void => {
    setEditingItem(item);
    setFormData({
      hotelId: item.hotelId.toString(),
      guestType: item.guestType as typeof GUEST_TYPES[number],
      minAge: item.minAge.toString(),
      maxAge: item.maxAge.toString(),
      status: item.status
    });
    setErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.hotelId) {
      newErrors.hotelId = 'Hotel selection is required';
    }

    if (!formData.guestType) {
      newErrors.guestType = 'Guest type is required';
    }

    const minAgeVal = parseInt(formData.minAge, 10);
    const maxAgeVal = parseInt(formData.maxAge, 10);

    if (isNaN(minAgeVal) || minAgeVal < 0 || minAgeVal > 120) {
      newErrors.minAge = 'Min age must be a positive integer';
    }

    if (isNaN(maxAgeVal) || maxAgeVal < 0 || maxAgeVal > 120) {
      newErrors.maxAge = 'Max age must be a positive integer';
    }

    if (!newErrors.minAge && !newErrors.maxAge && minAgeVal > maxAgeVal) {
      newErrors.maxAge = 'Max age cannot be less than minimum age';
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
      const minAge = parseInt(formData.minAge, 10);
      const maxAge = parseInt(formData.maxAge, 10);

      if (editingItem) {
        const payload: HotelAgePolicyUpdateRequest = {
          guestType: formData.guestType,
          minAge,
          maxAge,
          status: formData.status
        };
        await agePolicyApi.update(editingItem.id, payload);
      } else {
        const payload: HotelAgePolicyCreateRequest = {
          hotelId: parseInt(formData.hotelId, 10),
          guestType: formData.guestType,
          minAge,
          maxAge,
          status: formData.status
        };
        await agePolicyApi.create(payload);
      }
      setIsModalOpen(false);
      fetchAgePolicies(selectedHotelId);
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setSubmitError(axiosError.response?.data?.message || 'Failed to save age policy.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDelete = (item: HotelAgePolicyResponse): void => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!itemToDelete) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      await agePolicyApi.delete(itemToDelete.id);
      fetchAgePolicies(selectedHotelId);
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setFetchError(axiosError.response?.data?.message || 'Failed to delete age policy.');
    } finally {
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      setIsLoading(false);
    }
  };

  const getHotelName = (hotelId: number): string => {
    const matched = hotels.find(h => h.id === hotelId);
    return matched ? matched.name : `Hotel ${hotelId}`;
  };

  return (
    <div className="relative space-y-6 min-h-[400px]">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-[2px] flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            <span className="text-xs font-bold text-neutral-900 tracking-wider uppercase">Loading Age Policies...</span>
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
          <h2 className="text-2xl font-extrabold text-black tracking-tight">Hotel Age Policies</h2>
          <p className="text-sm text-neutral-500">Configure child, adult, and infant age boundaries per hotel property.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {/* Hotel Filter */}
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
              <option value="">All Hotels</option>
              {hotels.map((h) => (
                <option key={h.id} value={h.id.toString()}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-red-600 text-white font-bold rounded shadow hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 w-full sm:w-auto"
            aria-label="Create new age policy"
          >
            <Plus className="w-5 h-5" />
            <span>Create Age Policy</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-900 text-white uppercase text-[11px] font-bold tracking-wider">
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">Hotel Property</th>
                <th className="py-4 px-6">Guest Type</th>
                <th className="py-4 px-6">Age Range</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-sm">
              {policies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500 font-medium bg-neutral-50">
                    No age policies configured.
                  </td>
                </tr>
              ) : (
                policies.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-4 px-6 font-bold text-neutral-900">{item.id}</td>
                    <td className="py-4 px-6 font-semibold text-black">{getHotelName(item.hotelId)}</td>
                    <td className="py-4 px-6 font-bold text-red-600 font-mono">{item.guestType}</td>
                    <td className="py-4 px-6 font-bold text-neutral-900 font-mono">{item.minAge} - {item.maxAge} years</td>
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
                          aria-label={`Edit age policy for ${item.guestType}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(item)}
                          className="p-1.5 rounded hover:bg-red-50 text-neutral-600 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-600"
                          aria-label={`Delete age policy for ${item.guestType}`}
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
                {editingItem ? 'Edit Age Policy' : 'Create Age Policy'}
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
                <label htmlFor="hotelId" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                  Hotel Property <span className="text-red-600">*</span>
                </label>
                <select
                  id="hotelId"
                  value={formData.hotelId}
                  disabled={!!editingItem}
                  onChange={(e) => setFormData({ ...formData, hotelId: e.target.value })}
                  className={`w-full px-3 py-2 border rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-600
                    ${errors.hotelId ? 'border-red-600 focus:border-red-600' : 'border-neutral-300 focus:border-black'}
                  `}
                >
                  <option value="">Select Hotel</option>
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id.toString()}>
                      {h.name}
                    </option>
                  ))}
                </select>
                {errors.hotelId && (
                  <p className="mt-1 text-xs font-semibold text-red-600">{errors.hotelId}</p>
                )}
              </div>

              <div>
                <label htmlFor="guestType" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                  Guest Type <span className="text-red-600">*</span>
                </label>
                <select
                  id="guestType"
                  value={formData.guestType}
                  onChange={(e) => setFormData({ ...formData, guestType: e.target.value as typeof GUEST_TYPES[number] })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-black"
                >
                  {GUEST_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="minAge" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                    Min Age <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    id="minAge"
                    value={formData.minAge}
                    onChange={(e) => setFormData({ ...formData, minAge: e.target.value })}
                    className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600
                      ${errors.minAge ? 'border-red-600 focus:border-red-600' : 'border-neutral-300 focus:border-black'}
                    `}
                  />
                  {errors.minAge && (
                    <p className="mt-1 text-xs font-semibold text-red-600">{errors.minAge}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="maxAge" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                    Max Age <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    id="maxAge"
                    value={formData.maxAge}
                    onChange={(e) => setFormData({ ...formData, maxAge: e.target.value })}
                    className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600
                      ${errors.maxAge ? 'border-red-600 focus:border-red-600' : 'border-neutral-300 focus:border-black'}
                    `}
                  />
                  {errors.maxAge && (
                    <p className="mt-1 text-xs font-semibold text-red-600">{errors.maxAge}</p>
                  )}
                </div>
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
                  Save Policy
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
            <h4 className="text-lg font-extrabold text-black uppercase tracking-tight mb-2">Delete Age Policy</h4>
            <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
              Are you sure you want to permanently delete age policy:
              <strong className="text-black block mt-2 font-bold bg-neutral-50 p-2.5 rounded border border-neutral-200">
                ID: {itemToDelete.id} ({getHotelName(itemToDelete.hotelId)} — {itemToDelete.guestType})
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

export default AgePolicyPage;
