import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../../../services/api';
import { hotelRoomTypeApi } from '../../../inventory/hotel-room-type/api/hotelRoomTypeApi';
import { campaignApi } from '../../campaign/api/campaignApi';
import { discountRuleApi } from '../api/discountRuleApi';
import DiscountRuleModal from './DiscountRuleModal';
import { 
  DiscountRuleResponse, 
  DiscountRuleCreateRequest, 
  DiscountRuleUpdateRequest, 
  DiscountCondition 
} from '../../../../types/pricing';

interface DropdownItem {
  id: number;
  name: string;
}

interface HotelRoomTypeItem {
  id: number;
  hotelId: number;
  roomTypeId: number;
}

const DiscountRulePage: React.FC = () => {
  const [rules, setRules] = useState<DiscountRuleResponse[]>([]);
  const [hotels, setHotels] = useState<DropdownItem[]>([]);
  const [globalRoomTypes, setGlobalRoomTypes] = useState<DropdownItem[]>([]);
  const [hotelRoomTypes, setHotelRoomTypes] = useState<HotelRoomTypeItem[]>([]);
  const [campaigns, setCampaigns] = useState<DropdownItem[]>([]);

  // Selection states
  const [filterHotelRoomTypeId, setFilterHotelRoomTypeId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<DiscountRuleResponse | null>(null);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<DiscountRuleResponse | null>(null);

  const fetchInitializationData = async (): Promise<void> => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [hotelsList, rTypesList, hrTypesList, campaignsList] = await Promise.all([
        api.get('/hotel/api/v1/inventory/hotels'),
        api.get('/hotel/api/v1/inventory/room-types'),
        hotelRoomTypeApi.getAll(),
        campaignApi.getAll()
      ]);

      setHotels(Array.isArray(hotelsList) ? (hotelsList as DropdownItem[]) : []);
      setGlobalRoomTypes(Array.isArray(rTypesList) ? (rTypesList as DropdownItem[]) : []);
      setHotelRoomTypes(Array.isArray(hrTypesList) ? (hrTypesList as HotelRoomTypeItem[]) : []);
      setCampaigns(Array.isArray(campaignsList) ? (campaignsList as DropdownItem[]) : []);
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setFetchError(axiosError.response?.data?.message || 'Failed to load master configuration listings.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDiscountRules = async (roomTypeId: string): Promise<void> => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await discountRuleApi.getAll(roomTypeId ? parseInt(roomTypeId, 10) : undefined);
      setRules(Array.isArray(data) ? (data as DiscountRuleResponse[]) : []);
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setFetchError(axiosError.response?.data?.message || 'Failed to fetch discount rules.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitializationData();
  }, []);

  useEffect(() => {
    fetchDiscountRules(filterHotelRoomTypeId);
  }, [filterHotelRoomTypeId]);

  const handleOpenCreate = (): void => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule: DiscountRuleResponse): void => {
    setEditingItem(rule);
    setIsModalOpen(true);
  };

  const handleSave = async (payload: DiscountRuleCreateRequest | DiscountRuleUpdateRequest): Promise<void> => {
    if (editingItem) {
      const result = await discountRuleApi.update(editingItem.id, payload as DiscountRuleUpdateRequest);
      setRules(prev => prev.map(r => r.id === editingItem.id ? (result as DiscountRuleResponse) : r));
    } else {
      const result = await discountRuleApi.create(payload as DiscountRuleCreateRequest); // returns list of rules
      setRules(prev => [...(result as DiscountRuleResponse[]), ...prev]);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleOpenDelete = (rule: DiscountRuleResponse): void => {
    setItemToDelete(rule);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!itemToDelete) return;
    setIsLoading(true);
    try {
      await discountRuleApi.delete(itemToDelete.id);
      setRules(prev => prev.filter(r => r.id !== itemToDelete.id));
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setFetchError(axiosError.response?.data?.message || 'Failed to delete discount rule.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCampaignName = (campaignId: number | null | undefined): string => {
    if (!campaignId) return '';
    const matched = campaigns.find(c => c.id === campaignId);
    return matched ? matched.name : `Campaign ID: ${campaignId}`;
  };

  const getHotelRoomTypeLabel = (hrType: HotelRoomTypeItem): string => {
    const matchedHotel = hotels.find(h => h.id === hrType.hotelId);
    const matchedRoomType = globalRoomTypes.find(rt => rt.id === hrType.roomTypeId);
    const hotelName = matchedHotel ? matchedHotel.name : `Hotel ${hrType.hotelId}`;
    const roomTypeName = matchedRoomType ? matchedRoomType.name : `Room Type ${hrType.roomTypeId}`;
    return `${hotelName} - ${roomTypeName}`;
  };

  const formatConditions = (conditions: DiscountCondition | undefined): string => {
    if (!conditions) return 'None';
    const parts: string[] = [];
    if (conditions.minNights !== null && conditions.minNights !== undefined && conditions.minNights !== 0) {
      parts.push(`Min Nights: ${conditions.minNights}`);
    }
    if (conditions.maxNights !== null && conditions.maxNights !== undefined && conditions.maxNights !== 0) {
      parts.push(`Max Nights: ${conditions.maxNights}`);
    }
    if (conditions.minAdvanceBookingDays !== null && conditions.minAdvanceBookingDays !== undefined && conditions.minAdvanceBookingDays !== 0) {
      parts.push(`Book ${conditions.minAdvanceBookingDays}d in advance`);
    }
    if (conditions.promoCode) {
      parts.push(`Promo Code: ${conditions.promoCode}`);
    }
    return parts.length > 0 ? parts.join(', ') : 'None';
  };

  return (
    <div className="relative space-y-6 min-h-[400px]">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-[2px] flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            <span className="text-xs font-bold text-neutral-900 tracking-wider uppercase">Loading Discount Rules...</span>
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

      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-black tracking-tight">Discount Rules</h2>
          <p className="text-sm text-neutral-500">Configure room booking promotional discount strategies, stays, and campaigns.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {/* Room Type Config Filter */}
          <div className="flex items-center space-x-2">
            <label htmlFor="room-type-filter" className="text-xs font-bold uppercase text-neutral-900 tracking-wider whitespace-nowrap">
              Room Config:
            </label>
            <select
              id="room-type-filter"
              value={filterHotelRoomTypeId}
              onChange={(e) => setFilterHotelRoomTypeId(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="">All Room Types</option>
              {hotelRoomTypes.map((hrt) => (
                <option key={hrt.id} value={hrt.id.toString()}>
                  {getHotelRoomTypeLabel(hrt)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-red-600 text-white font-bold rounded shadow hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 w-full sm:w-auto"
            aria-label="Create new discount rule"
          >
            <Plus className="w-5 h-5" />
            <span>Create Discount Rule</span>
          </button>
        </div>
      </div>

      {/* Discount Rules Table */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-900 text-white uppercase text-[11px] font-bold tracking-wider">
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">Room Type Name</th>
                <th className="py-4 px-6">Rule Type</th>
                <th className="py-4 px-6">Conditions</th>
                <th className="py-4 px-6">Discount</th>
                <th className="py-4 px-6">Start Date</th>
                <th className="py-4 px-6">End Date</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-sm">
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-neutral-500 font-medium bg-neutral-50">
                    No discount rules configured.
                  </td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-4 px-6 font-bold text-neutral-950">{rule.id}</td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-black">{rule.hotelRoomTypeName}</div>
                      {rule.campaignId && (
                        <div className="text-xs text-neutral-450 font-semibold mt-0.5">
                          Campaign: {getCampaignName(rule.campaignId)}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-red-650">
                      {rule.ruleTypeCode}
                    </td>
                    <td className="py-4 px-6 text-neutral-700 font-medium font-mono text-xs text-wrap max-w-xs">
                      {formatConditions(rule.conditions)}
                    </td>
                    <td className="py-4 px-6 font-extrabold text-neutral-900 font-mono">
                      {rule.discountType === 'PERCENT' ? (
                        `- ${rule.discountValue}%`
                      ) : (
                        `- ${parseFloat(rule.discountValue.toString()).toLocaleString()} VND`
                      )}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs font-semibold text-neutral-600">
                      {rule.startDate}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs font-semibold text-neutral-600">
                      {rule.endDate}
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
                          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-700 hover:text-black focus:outline-none focus:ring-2 focus:ring-red-650"
                          aria-label={`Edit discount rule ${rule.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(rule)}
                          className="p-1.5 rounded hover:bg-red-50 text-neutral-600 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-650"
                          aria-label={`Delete discount rule ${rule.id}`}
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

      {/* SAVE DIALOG MODAL */}
      <DiscountRuleModal
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
            <h4 className="text-lg font-extrabold text-black uppercase tracking-tight mb-2">Delete Discount Rule</h4>
            <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
              Are you sure you want to permanently delete discount rule:
              <strong className="text-black block mt-2 font-bold bg-neutral-50 p-2.5 rounded border border-neutral-200">
                Rule ID: {itemToDelete.id} ({itemToDelete.hotelRoomTypeName} - {itemToDelete.ruleTypeCode})
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

export default DiscountRulePage;
