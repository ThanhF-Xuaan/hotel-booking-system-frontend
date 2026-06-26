import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, X, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../../../services/api';
import { hotelRoomTypeApi } from '../api/hotelRoomTypeApi';

const HotelRoomTypeListPage = () => {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState('');
  const [globalRoomTypes, setGlobalRoomTypes] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // Custom Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [errors, setErrors] = useState({});

  // Form Fields State
  const [formData, setFormData] = useState({
    roomTypeId: '',
    standardAdults: '2',
    standardChildren: '0',
    maxAdults: '2',
    maxChildren: '1',
    maxInfants: '1',
    maxTotalGuests: '3',
    maxExtraBeds: '1',
    maxBeds: '1',
    basePrice: '',
    totalQuantity: '10',
    status: 'ACTIVE'
  });

  // Fetch Hotels and Global Room Types on init
  const fetchInitData = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [hotelsData, roomTypesData] = await Promise.all([
        api.get('/hotel/api/v1/inventory/hotels'),
        api.get('/hotel/api/v1/inventory/room-types')
      ]);

      const hotelsList = Array.isArray(hotelsData) ? hotelsData : [];
      setHotels(hotelsList);
      setGlobalRoomTypes(Array.isArray(roomTypesData) ? roomTypesData : []);

      if (hotelsList.length > 0) {
        setSelectedHotelId(hotelsList[0].id.toString());
      }
    } catch (err) {
      console.error(err);
      setFetchError(err.response?.data?.message || 'Failed to fetch setup configurations.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch configurations for selected hotel
  const fetchConfigs = async (hotelId) => {
    if (!hotelId) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await hotelRoomTypeApi.getByHotelId(hotelId);
      setConfigs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setFetchError(err.response?.data?.message || 'Failed to fetch room type configurations for the selected hotel.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitData();
  }, []);

  useEffect(() => {
    if (selectedHotelId) {
      fetchConfigs(selectedHotelId);
    } else {
      setConfigs([]);
    }
  }, [selectedHotelId]);

  const handleOpenCreate = () => {
    if (!selectedHotelId) {
      setFetchError('Please select a hotel first.');
      return;
    }
    setFormData({
      roomTypeId: globalRoomTypes.length > 0 ? globalRoomTypes[0].id.toString() : '',
      standardAdults: '2',
      standardChildren: '0',
      maxAdults: '2',
      maxChildren: '1',
      maxInfants: '1',
      maxTotalGuests: '3',
      maxExtraBeds: '1',
      maxBeds: '1',
      basePrice: '',
      totalQuantity: '10',
      status: 'ACTIVE'
    });
    setErrors({});
    setSubmitError(null);
    setIsCreateModalOpen(true);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.roomTypeId) newErrors.roomTypeId = 'Room type is required';

    const price = parseFloat(formData.basePrice);
    if (isNaN(price) || price < 0) {
      newErrors.basePrice = 'Base price must be a valid non-negative number';
    }

    const qty = parseInt(formData.totalQuantity, 10);
    if (isNaN(qty) || qty < 0) {
      newErrors.totalQuantity = 'Total quantity must be a non-negative integer';
    }

    const maxBedsVal = parseInt(formData.maxBeds, 10);
    if (isNaN(maxBedsVal) || maxBedsVal < 0) {
      newErrors.maxBeds = 'Maximum physical beds must be at least 0';
    }

    const stdAdults = parseInt(formData.standardAdults, 10);
    const maxAdults = parseInt(formData.maxAdults, 10);
    const stdKids = parseInt(formData.standardChildren, 10);
    const maxKids = parseInt(formData.maxChildren, 10);
    const maxGuests = parseInt(formData.maxTotalGuests, 10);

    if (stdAdults > maxAdults) {
      newErrors.standardAdults = 'Standard adults capacity cannot exceed maximum adults';
    }
    if (stdKids > maxKids) {
      newErrors.standardChildren = 'Standard children capacity cannot exceed maximum children';
    }
    if (stdAdults + stdKids > maxGuests) {
      newErrors.maxTotalGuests = 'Sum of standard capacity exceeds maximum total guests';
    }
    if (maxAdults > maxGuests) {
      newErrors.maxAdults = 'Maximum adults cannot exceed maximum total guests';
    }
    if (maxKids > maxGuests) {
      newErrors.maxChildren = 'Maximum children cannot exceed maximum total guests';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setSubmitError(null);
    try {
      const payload = {
        hotelId: parseInt(selectedHotelId, 10),
        roomTypeId: parseInt(formData.roomTypeId, 10),
        standardAdults: parseInt(formData.standardAdults, 10),
        standardChildren: parseInt(formData.standardChildren, 10),
        maxAdults: parseInt(formData.maxAdults, 10),
        maxChildren: parseInt(formData.maxChildren, 10),
        maxInfants: parseInt(formData.maxInfants, 10),
        maxTotalGuests: parseInt(formData.maxTotalGuests, 10),
        maxExtraBeds: parseInt(formData.maxExtraBeds, 10),
        maxBeds: parseInt(formData.maxBeds, 10),
        basePrice: parseFloat(formData.basePrice),
        totalQuantity: parseInt(formData.totalQuantity, 10),
        status: formData.status
      };

      const result = await hotelRoomTypeApi.create(payload);
      setIsCreateModalOpen(false);
      // Redirect directly to details page of the newly configured Room Type
      if (result && result.id) {
        navigate(`/admin/hotel-room-types/${result.id}`);
      } else {
        fetchConfigs(selectedHotelId);
      }
    } catch (err) {
      console.error(err);
      const code = err.response?.data?.code;
      if (code === 5238) {
        setSubmitError('Maximum physical beds capacity is required and cannot be empty.');
      } else if (code === 5239) {
        setSubmitError('Maximum physical beds must be at least 0.');
      } else if (code === 5242) {
        setSubmitError('Maximum extra beds capacity cannot exceed maximum physical beds capacity.');
      } else {
        setSubmitError(err.response?.data?.message || 'Failed to create room type configuration.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDelete = (config) => {
    setItemToDelete(config);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      await hotelRoomTypeApi.delete(itemToDelete.id);
      fetchConfigs(selectedHotelId);
    } catch (err) {
      console.error(err);
      setFetchError(err.response?.data?.message || 'Failed to delete room type configuration.');
    } finally {
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      setIsLoading(false);
    }
  };

  const getRoomTypeName = (rtId) => {
    const matched = globalRoomTypes.find(rt => rt.id === rtId);
    return matched ? matched.name : `Room Type ${rtId}`;
  };

  const getHotelName = (hotelIdStr) => {
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
            <AlertCircle className="w-5 h-5 text-red-650 flex-shrink-0" />
            <span className="text-sm font-semibold text-red-750">{fetchError}</span>
          </div>
          <button 
            onClick={() => setFetchError(null)}
            className="text-red-600 hover:text-red-800 transition-colors focus:outline-none"
            aria-label="Dismiss fetch error"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header section & Hotel filter dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-black tracking-tight">Hotel Room Types</h2>
          <p className="text-sm text-neutral-500">Configure capacities, pricing, beds, features, and amenities for hotel room types.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
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
            onClick={handleOpenCreate}
            disabled={hotels.length === 0 || globalRoomTypes.length === 0}
            className={`flex items-center justify-center space-x-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded shadow transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 w-full sm:w-auto
              ${(hotels.length === 0 || globalRoomTypes.length === 0) ? 'opacity-50 cursor-not-allowed bg-neutral-400 hover:bg-neutral-400' : ''}
            `}
            aria-label="Add new configuration"
          >
            <Plus className="w-5 h-5" />
            <span>Configure Room Type</span>
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
                <th className="py-4 px-6">Room Type Name</th>
                <th className="py-4 px-6">Base Price</th>
                <th className="py-4 px-6">Total Qty</th>
                <th className="py-4 px-6">Capacity (Std / Max)</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-sm">
              {configs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-neutral-500 font-medium bg-neutral-50">
                    No room types configured for {selectedHotelId ? getHotelName(selectedHotelId) : 'this hotel'}.
                  </td>
                </tr>
              ) : (
                configs.map((cfg) => (
                  <tr key={cfg.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-4 px-6 font-bold text-neutral-950">{cfg.id}</td>
                    <td className="py-4 px-6 font-bold text-black">{getRoomTypeName(cfg.roomTypeId)}</td>
                    <td className="py-4 px-6 text-neutral-950 font-extrabold font-mono">
                      {parseFloat(cfg.basePrice).toLocaleString()} VND
                    </td>
                    <td className="py-4 px-6 text-neutral-600 font-bold font-mono">{cfg.totalQuantity} rooms</td>
                    <td className="py-4 px-6 text-neutral-600">
                      Adults: {cfg.standardAdults}/{cfg.maxAdults} | Kids: {cfg.standardChildren}/{cfg.maxChildren}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider
                        ${cfg.status === 'ACTIVE' 
                          ? 'bg-neutral-100 text-black border border-neutral-300' 
                          : 'bg-red-50 text-red-600 border border-red-200'
                        }
                      `}>
                        {cfg.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/admin/hotel-room-types/${cfg.id}`)}
                          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-700 hover:text-black focus:outline-none focus:ring-2 focus:ring-red-600"
                          title="View and Edit mappings (Detail tabs)"
                          aria-label={`View details of configuration ${cfg.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(cfg)}
                          className="p-1.5 rounded hover:bg-red-50 text-neutral-600 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-600"
                          aria-label={`Delete configuration ${cfg.id}`}
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

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 transition-opacity"
            onClick={() => setIsCreateModalOpen(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden border border-neutral-200 z-10 animate-scale-in">
            {/* Modal Header */}
            <div className="bg-neutral-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold tracking-tight">Configure Hotel Room Type</h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-neutral-400 hover:text-white transition-colors focus:outline-none"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* MODAL INLINE SUBMIT ERROR BOX */}
              {submitError && (
                <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded flex items-start space-x-3 shadow-sm">
                  <AlertCircle className="w-5 h-5 text-red-650 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h5 className="text-sm font-bold text-red-800">Submission Failed</h5>
                    <p className="text-xs text-red-750 mt-0.5">{submitError}</p>
                  </div>
                </div>
              )}

              {/* Grid Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Hotel Display */}
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Hotel Location</label>
                  <input
                    type="text"
                    disabled
                    value={getHotelName(selectedHotelId)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded text-sm bg-neutral-50 text-neutral-500 font-semibold"
                  />
                </div>

                {/* Room Type Dropdown */}
                <div>
                  <label htmlFor="roomTypeId" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">
                    Room Type Template <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="roomTypeId"
                    value={formData.roomTypeId}
                    onChange={(e) => setFormData({ ...formData, roomTypeId: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    <option value="">Select Room Type</option>
                    {globalRoomTypes.map((rt) => (
                      <option key={rt.id} value={rt.id.toString()}>{rt.name}</option>
                    ))}
                  </select>
                  {errors.roomTypeId && <p className="text-red-600 text-xs mt-1 font-semibold">{errors.roomTypeId}</p>}
                </div>

                {/* Pricing & Stock */}
                <div>
                  <label htmlFor="basePrice" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">
                    Base Price (VND) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    id="basePrice"
                    min="0"
                    step="1000"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600 font-mono"
                    placeholder="e.g. 1200000"
                  />
                  {errors.basePrice && <p className="text-red-600 text-xs mt-1 font-semibold">{errors.basePrice}</p>}
                </div>

                <div>
                  <label htmlFor="totalQuantity" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">
                    Total Qty of Rooms <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    id="totalQuantity"
                    min="0"
                    value={formData.totalQuantity}
                    onChange={(e) => setFormData({ ...formData, totalQuantity: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600 font-mono"
                  />
                  {errors.totalQuantity && <p className="text-red-600 text-xs mt-1 font-semibold">{errors.totalQuantity}</p>}
                </div>

                {/* CAPACITY PARAMETERS */}
                <h4 className="col-span-1 sm:col-span-2 text-sm font-extrabold text-neutral-950 uppercase border-b border-neutral-100 pb-1 mt-2">Capacity Configurations</h4>

                <div>
                  <label htmlFor="standardAdults" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">Standard Adults</label>
                  <input
                    type="number"
                    id="standardAdults"
                    min="1"
                    value={formData.standardAdults}
                    onChange={(e) => setFormData({ ...formData, standardAdults: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                  {errors.standardAdults && <p className="text-red-600 text-xs mt-1 font-semibold">{errors.standardAdults}</p>}
                </div>

                <div>
                  <label htmlFor="maxAdults" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">Max Adults Limit</label>
                  <input
                    type="number"
                    id="maxAdults"
                    min="1"
                    value={formData.maxAdults}
                    onChange={(e) => setFormData({ ...formData, maxAdults: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                  {errors.maxAdults && <p className="text-red-600 text-xs mt-1 font-semibold">{errors.maxAdults}</p>}
                </div>

                <div>
                  <label htmlFor="standardChildren" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">Standard Children</label>
                  <input
                    type="number"
                    id="standardChildren"
                    min="0"
                    value={formData.standardChildren}
                    onChange={(e) => setFormData({ ...formData, standardChildren: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                  {errors.standardChildren && <p className="text-red-600 text-xs mt-1 font-semibold">{errors.standardChildren}</p>}
                </div>

                <div>
                  <label htmlFor="maxChildren" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">Max Children Limit</label>
                  <input
                    type="number"
                    id="maxChildren"
                    min="0"
                    value={formData.maxChildren}
                    onChange={(e) => setFormData({ ...formData, maxChildren: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                  {errors.maxChildren && <p className="text-red-600 text-xs mt-1 font-semibold">{errors.maxChildren}</p>}
                </div>

                <div>
                  <label htmlFor="maxInfants" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">Max Infants Limit</label>
                  <input
                    type="number"
                    id="maxInfants"
                    min="0"
                    value={formData.maxInfants}
                    onChange={(e) => setFormData({ ...formData, maxInfants: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div>
                  <label htmlFor="maxTotalGuests" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">Max Total Guests Limit</label>
                  <input
                    type="number"
                    id="maxTotalGuests"
                    min="1"
                    value={formData.maxTotalGuests}
                    onChange={(e) => setFormData({ ...formData, maxTotalGuests: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                  {errors.maxTotalGuests && <p className="text-red-600 text-xs mt-1 font-semibold">{errors.maxTotalGuests}</p>}
                </div>

                <div>
                  <label htmlFor="maxBeds" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">
                    Max Physical Beds Limit <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    id="maxBeds"
                    min="0"
                    value={formData.maxBeds}
                    onChange={(e) => setFormData({ ...formData, maxBeds: e.target.value })}
                    className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600
                      ${errors.maxBeds ? 'border-red-600' : 'border-neutral-300'}
                    `}
                  />
                  {errors.maxBeds && <p className="text-red-600 text-xs mt-1 font-semibold">{errors.maxBeds}</p>}
                </div>

                <div>
                  <label htmlFor="maxExtraBeds" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">Max Extra Beds Allowed</label>
                  <input
                    type="number"
                    id="maxExtraBeds"
                    min="0"
                    value={formData.maxExtraBeds}
                    onChange={(e) => setFormData({ ...formData, maxExtraBeds: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>

                {/* Status */}
                <div>
                  <label htmlFor="status" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">Status</label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>

                {/* Capacity warning alert card */}
                {parseInt(formData.maxExtraBeds, 10) > parseInt(formData.maxBeds, 10) && (
                  <div className="col-span-1 sm:col-span-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded text-xs font-semibold flex items-center space-x-2">
                    <AlertCircle className="w-4.5 h-4.5 text-red-600 flex-shrink-0" />
                    <span>Warning: Maximum extra beds cannot exceed maximum physical beds capacity. Save action is blocked.</span>
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={parseInt(formData.maxExtraBeds, 10) > parseInt(formData.maxBeds, 10)}
                  className={`px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-600
                    ${parseInt(formData.maxExtraBeds, 10) > parseInt(formData.maxBeds, 10) ? 'opacity-50 cursor-not-allowed bg-neutral-400 hover:bg-neutral-400' : ''}
                  `}
                >
                  Configure & Map Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRM DELETE MODAL */}
      {isDeleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 transition-opacity"
            onClick={() => { setIsDeleteModalOpen(false); setItemToDelete(null); }}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-neutral-200 z-10 animate-scale-in p-6">
            <div className="flex items-center space-x-3 text-red-600 mb-4">
              <AlertCircle className="w-8 h-8 flex-shrink-0" />
              <h4 className="text-lg font-extrabold text-black uppercase tracking-tight">Delete Configuration</h4>
            </div>

            <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
              Are you sure you want to delete this hotel room type configuration:
              <strong className="text-black block mt-2 font-bold bg-neutral-50 p-2.5 rounded border border-neutral-200">
                {getRoomTypeName(itemToDelete.roomTypeId)} ({getHotelName(selectedHotelId)})
              </strong>
              This action soft-deletes the configuration.
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

export default HotelRoomTypeListPage;
