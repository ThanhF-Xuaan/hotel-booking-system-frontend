import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../../../services/api';
import { hotelRoomTypeApi } from '../../../inventory/hotel-room-type/api/hotelRoomTypeApi';
import { pricingRuleApi } from '../api/pricingRuleApi';
import PricingRuleModal from './PricingRuleModal';

const PricingRulePage = () => {
  const [rules, setRules] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [globalRoomTypes, setGlobalRoomTypes] = useState([]);
  const [hotelRoomTypes, setHotelRoomTypes] = useState([]);
  
  // Selection states
  const [filterHotelRoomTypeId, setFilterHotelRoomTypeId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Modal actions
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Custom Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Fetch initial setup configurations
  const fetchSetupData = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [hotelsList, rTypesList, hrTypesList] = await Promise.all([
        api.get('/hotel/api/v1/inventory/hotels'),
        api.get('/hotel/api/v1/inventory/room-types'),
        hotelRoomTypeApi.getAll()
      ]);

      setHotels(Array.isArray(hotelsList) ? hotelsList : []);
      setGlobalRoomTypes(Array.isArray(rTypesList) ? rTypesList : []);
      setHotelRoomTypes(Array.isArray(hrTypesList) ? hrTypesList : []);
    } catch (err) {
      console.error(err);
      setFetchError(err.response?.data?.message || 'Failed to retrieve baseline configuration directories.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch pricing rules
  const fetchRules = async (roomTypeId) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await pricingRuleApi.getAll(roomTypeId ? parseInt(roomTypeId, 10) : undefined);
      setRules(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setFetchError(err.response?.data?.message || 'Failed to fetch pricing rules list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSetupData();
  }, []);

  useEffect(() => {
    fetchRules(filterHotelRoomTypeId);
  }, [filterHotelRoomTypeId]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule) => {
    setEditingItem(rule);
    setIsModalOpen(true);
  };

  const handleSave = async (payload) => {
    if (editingItem) {
      // Update
      const result = await pricingRuleApi.update(editingItem.id, payload);
      setRules(prev => prev.map(r => r.id === editingItem.id ? result : r));
    } else {
      // Create
      const result = await pricingRuleApi.create(payload);
      setRules(prev => [result, ...prev]);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleOpenDelete = (rule) => {
    setItemToDelete(rule);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsLoading(true);
    try {
      await pricingRuleApi.delete(itemToDelete.id);
      setRules(prev => prev.filter(r => r.id !== itemToDelete.id));
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err) {
      console.error(err);
      setFetchError(err.response?.data?.message || 'Failed to delete pricing rule.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoomTypeName = (hrtId) => {
    const matchedHrt = hotelRoomTypes.find(hrt => hrt.id === hrtId);
    if (!matchedHrt) return `Room Config ${hrtId}`;
    const matchedRoomType = globalRoomTypes.find(rt => rt.id === matchedHrt.roomTypeId);
    return matchedRoomType ? matchedRoomType.name : `Room Type ${matchedHrt.roomTypeId}`;
  };

  const getHotelName = (hrtId) => {
    const matchedHrt = hotelRoomTypes.find(hrt => hrt.id === hrtId);
    if (!matchedHrt) return '';
    const matchedHotel = hotels.find(h => h.id === matchedHrt.hotelId);
    return matchedHotel ? matchedHotel.name : `Hotel ${matchedHrt.hotelId}`;
  };

  const getHotelRoomTypeLabel = (hrType) => {
    const matchedHotel = hotels.find(h => h.id === hrType.hotelId);
    const matchedRoomType = globalRoomTypes.find(rt => rt.id === hrType.roomTypeId);
    const hotelName = matchedHotel ? matchedHotel.name : `Hotel ${hrType.hotelId}`;
    const roomTypeName = matchedRoomType ? matchedRoomType.name : `Room Type ${hrType.roomTypeId}`;
    return `${hotelName} - ${roomTypeName}`;
  };

  return (
    <div className="relative space-y-6 min-h-[400px]">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-[2px] flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            <span className="text-xs font-bold text-neutral-900 tracking-wider uppercase">Loading Pricing Rules...</span>
          </div>
        </div>
      )}

      {/* Top Banner Error */}
      {fetchError && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-655 flex-shrink-0" />
            <span className="text-sm font-semibold text-red-750">{fetchError}</span>
          </div>
          <button 
            onClick={() => setFetchError(null)}
            className="text-red-600 hover:text-red-800 transition-colors focus:outline-none"
            aria-label="Dismiss error banner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Title & Add Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-black tracking-tight">Pricing Rules</h2>
          <p className="text-sm text-neutral-500">Configure dynamically adjusted pricing parameters for specific hotel room configurations.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {/* Room Type Selector */}
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
            onClick={handleOpenCreate}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-red-600 text-white font-bold rounded shadow hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 w-full sm:w-auto"
            aria-label="Add new pricing rule"
          >
            <Plus className="w-5 h-5" />
            <span>Create Pricing Rule</span>
          </button>
        </div>
      </div>

      {/* Listing Data Table */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-900 text-white uppercase text-[11px] font-bold tracking-wider">
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">Hotel Location & Room Type</th>
                <th className="py-4 px-6">Rule Type</th>
                <th className="py-4 px-6">Adjustment</th>
                <th className="py-4 px-6">Date Duration</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-sm">
              {rules.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-neutral-500 font-medium bg-neutral-50">
                    No pricing rules registered.
                  </td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-4 px-6 font-bold text-neutral-950">{rule.id}</td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-black">{getRoomTypeName(rule.hotelRoomTypeId)}</div>
                      <div className="text-xs text-neutral-450 font-semibold">{getHotelName(rule.hotelRoomTypeId)}</div>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-red-600">
                      {rule.ruleTypeCode}
                    </td>
                    <td className="py-4 px-6 font-extrabold text-neutral-900 font-mono">
                      {rule.adjustmentType === 'PERCENT' ? (
                        `+ ${rule.adjustmentValue}%`
                      ) : (
                        `+ ${parseFloat(rule.adjustmentValue).toLocaleString()} VND`
                      )}
                    </td>
                    <td className="py-4 px-6 text-neutral-600 font-medium font-mono text-xs">
                      {rule.startDate} to {rule.endDate}
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
                          onClick={() => handleOpenEdit(rule)}
                          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-700 hover:text-black focus:outline-none focus:ring-2 focus:ring-red-600"
                          aria-label={`Edit pricing rule ${rule.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(rule)}
                          className="p-1.5 rounded hover:bg-red-50 text-neutral-600 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-600"
                          aria-label={`Delete pricing rule ${rule.id}`}
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

      {/* FORM DIALOG MODAL */}
      <PricingRuleModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
        onSave={handleSave}
        editingItem={editingItem}
      />

      {/* CUSTOM CONFIRM DELETE MODAL */}
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
            <h4 className="text-lg font-extrabold text-black uppercase tracking-tight mb-2">Delete Pricing Rule</h4>
            <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
              Are you sure you want to permanently delete pricing rule: 
              <strong className="text-black block mt-2 font-bold bg-neutral-50 p-2.5 rounded border border-neutral-200">
                Rule ID: {itemToDelete.id} ({getRoomTypeName(itemToDelete.hotelRoomTypeId)} - {itemToDelete.ruleTypeCode})
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

export default PricingRulePage;
