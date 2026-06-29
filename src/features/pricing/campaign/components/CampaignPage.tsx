import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../../../services/api';
import { campaignApi } from '../api/campaignApi';
import CampaignModal from './CampaignModal';
import { 
  CampaignResponse, 
  CampaignCreateRequest, 
  CampaignUpdateRequest 
} from '../../../../types/pricing';

interface HotelDropdownItem {
  id: number;
  name: string;
}

const CampaignPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<CampaignResponse[]>([]);
  const [hotels, setHotels] = useState<HotelDropdownItem[]>([]);
  
  // Selection/filtering state
  const [filterHotelId, setFilterHotelId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<CampaignResponse | null>(null);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<CampaignResponse | null>(null);

  // Fetch hotels directory
  const fetchHotels = async (): Promise<void> => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await api.get('/hotel/api/v1/inventory/hotels');
      setHotels(Array.isArray(data) ? (data as HotelDropdownItem[]) : []);
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setFetchError(axiosError.response?.data?.message || 'Failed to fetch hotels directory.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch campaigns list
  const fetchCampaigns = async (hotelId: string): Promise<void> => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await campaignApi.getAll(hotelId ? parseInt(hotelId, 10) : undefined);
      setCampaigns(Array.isArray(data) ? (data as CampaignResponse[]) : []);
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setFetchError(axiosError.response?.data?.message || 'Failed to retrieve campaigns list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  useEffect(() => {
    fetchCampaigns(filterHotelId);
  }, [filterHotelId]);

  const handleOpenCreate = (): void => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (campaign: CampaignResponse): void => {
    setEditingItem(campaign);
    setIsModalOpen(true);
  };

  const handleSave = async (payload: CampaignCreateRequest | CampaignUpdateRequest): Promise<void> => {
    if (editingItem) {
      const result = await campaignApi.update(editingItem.id, payload as CampaignUpdateRequest);
      setCampaigns(prev => prev.map(c => c.id === editingItem.id ? (result as CampaignResponse) : c));
    } else {
      const result = await campaignApi.create(payload as CampaignCreateRequest);
      setCampaigns(prev => [result as CampaignResponse, ...prev]);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleOpenDelete = (campaign: CampaignResponse): void => {
    setItemToDelete(campaign);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!itemToDelete) return;
    setIsLoading(true);
    try {
      await campaignApi.delete(itemToDelete.id);
      setCampaigns(prev => prev.filter(c => c.id !== itemToDelete.id));
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setFetchError(axiosError.response?.data?.message || 'Failed to delete campaign.');
    } finally {
      setIsLoading(false);
    }
  };

  const getHotelName = (hotelId: number): string => {
    const matched = hotels.find(h => h.id === hotelId);
    return matched ? matched.name : `Hotel ID: ${hotelId}`;
  };

  return (
    <div className="relative space-y-6 min-h-[400px]">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-[2px] flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            <span className="text-xs font-bold text-neutral-900 tracking-wider uppercase">Processing campaigns...</span>
          </div>
        </div>
      )}

      {/* Fetch error banner */}
      {fetchError && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-655 flex-shrink-0" />
            <span className="text-sm font-semibold text-red-750">{fetchError}</span>
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

      {/* Header title & add controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-black tracking-tight">Marketing Campaigns</h2>
          <p className="text-sm text-neutral-500">Configure discounts, sales events, and promotions mapped to hotel locations.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {/* Hotel Filter Dropdown */}
          <div className="flex items-center space-x-2">
            <label htmlFor="hotel-filter" className="text-xs font-bold uppercase text-neutral-900 tracking-wider whitespace-nowrap">
              Hotel:
            </label>
            <select
              id="hotel-filter"
              value={filterHotelId}
              onChange={(e) => setFilterHotelId(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="">All Locations</option>
              {hotels.map((h) => (
                <option key={h.id} value={h.id.toString()}>{h.name}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-red-600 text-white font-bold rounded shadow hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 w-full sm:w-auto"
            aria-label="Create new campaign"
          >
            <Plus className="w-5 h-5" />
            <span>Create Campaign</span>
          </button>
        </div>
      </div>

      {/* Campaigns Listing Table */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-900 text-white uppercase text-[11px] font-bold tracking-wider">
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">Campaign Name</th>
                <th className="py-4 px-6">Hotel Location</th>
                <th className="py-4 px-6">Description</th>
                <th className="py-4 px-6">Date Schedule</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-sm">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-500 font-medium bg-neutral-50">
                    No marketing campaigns configured.
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-4 px-6 font-bold text-neutral-955">{c.id}</td>
                    <td className="py-4 px-6 font-bold text-black">{c.name}</td>
                    <td className="py-4 px-6 font-semibold text-neutral-800">{getHotelName(c.hotelId)}</td>
                    <td className="py-4 px-6 text-neutral-500 max-w-xs truncate">{c.description || 'No description provided.'}</td>
                    <td className="py-4 px-6 font-mono font-semibold text-neutral-600 text-xs">
                      {c.startDate} to {c.endDate}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider
                        ${c.status === 'ACTIVE' 
                          ? 'bg-neutral-100 text-black border border-neutral-300' 
                          : 'bg-red-50 text-red-600 border border-red-200'
                        }
                      `}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-700 hover:text-black focus:outline-none focus:ring-2 focus:ring-red-650"
                          aria-label={`Edit campaign ${c.name}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(c)}
                          className="p-1.5 rounded hover:bg-red-50 text-neutral-600 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-650"
                          aria-label={`Delete campaign ${c.name}`}
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

      {/* EDIT/CREATE MODAL */}
      <CampaignModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
        onSave={handleSave}
        editingItem={editingItem}
      />

      {/* CONFIRM DELETE DIALOG */}
      {isDeleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 transition-opacity"
            onClick={() => { setIsDeleteModalOpen(false); setItemToDelete(null); }}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-neutral-200 z-10 animate-scale-in p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-extrabold text-black uppercase tracking-tight mb-2">Delete Campaign</h4>
            <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
              Are you sure you want to permanently delete marketing campaign:
              <strong className="text-black block mt-2 font-bold bg-neutral-50 p-2.5 rounded border border-neutral-200">
                {itemToDelete.name} ({getHotelName(itemToDelete.hotelId)})
              </strong>
              This action cannot be undone.
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
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-650"
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

export default CampaignPage;
