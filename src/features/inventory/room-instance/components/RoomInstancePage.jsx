import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import api from '../../../../services/api';
import { roomInstanceApi } from '../api/roomInstanceApi';
import { ROOM_STATUSES } from '../types';

const RoomInstancePage = () => {
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState('');
  const [globalRoomTypes, setGlobalRoomTypes] = useState([]);
  const [hotelRoomTypes, setHotelRoomTypes] = useState([]);
  const [roomInstances, setRoomInstances] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  
  // Submit errors for the two different modals
  const [submitError, setSubmitError] = useState(null);
  const [statusSubmitError, setStatusSubmitError] = useState(null);

  // Custom Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Create/Edit Room Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [errors, setErrors] = useState({});

  // Quick Status Modal State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusEditingItem, setStatusEditingItem] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('READY');

  // Form Fields State for Create/Edit
  const [formData, setFormData] = useState({
    roomNumber: '',
    hotelRoomTypeId: ''
  });

  // Fetch initial config data (Hotels and Global Room Types)
  const fetchConfigData = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [hotelsData, globalTypesData] = await Promise.all([
        api.get('/hotel/api/v1/inventory/hotels'),
        api.get('/hotel/api/v1/inventory/room-types')
      ]);

      const hotelsList = Array.isArray(hotelsData) ? hotelsData : [];
      setHotels(hotelsList);
      setGlobalRoomTypes(Array.isArray(globalTypesData) ? globalTypesData : []);

      if (hotelsList.length > 0) {
        setSelectedHotelId(hotelsList[0].id.toString());
      }
    } catch (err) {
      console.error(err);
      setFetchError(err.response?.data?.message || 'Failed to fetch setup configurations from the server.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Room Instances and Hotel Room Types configurations for the selected hotel
  const fetchHotelData = async (hotelId) => {
    if (!hotelId) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      const [instancesData, typesConfigData] = await Promise.all([
        roomInstanceApi.getByHotelId(hotelId),
        api.get('/hotel/api/v1/inventory/hotel-room-types', { params: { hotelId } })
      ]);

      setRoomInstances(Array.isArray(instancesData) ? instancesData : []);
      setHotelRoomTypes(Array.isArray(typesConfigData) ? typesConfigData : []);
    } catch (err) {
      console.error(err);
      setFetchError(err.response?.data?.message || 'Failed to load room details for the selected hotel.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigData();
  }, []);

  useEffect(() => {
    if (selectedHotelId) {
      fetchHotelData(selectedHotelId);
    } else {
      setRoomInstances([]);
      setHotelRoomTypes([]);
    }
  }, [selectedHotelId]);

  const handleOpenCreate = () => {
    if (!selectedHotelId) {
      setFetchError('Please select a hotel before adding a room instance.');
      return;
    }
    setEditingItem(null);
    setFormData({
      roomNumber: '',
      hotelRoomTypeId: hotelRoomTypes.length > 0 ? hotelRoomTypes[0].id.toString() : ''
    });
    setErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (room) => {
    setEditingItem(room);
    setFormData({
      roomNumber: room.roomNumber,
      hotelRoomTypeId: room.hotelRoomTypeId ? room.hotelRoomTypeId.toString() : ''
    });
    setErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleOpenStatusEdit = (room) => {
    setStatusEditingItem(room);
    setSelectedStatus(room.currentStatus);
    setStatusSubmitError(null);
    setIsStatusModalOpen(true);
  };

  // Strict uppercase alphanumeric + underscore matching constraint
  const ROOM_NUMBER_REGEX = /^[A-Z0-9_]{3,20}$/;

  const validateForm = () => {
    const newErrors = {};
    const roomNum = formData.roomNumber.trim();

    if (!roomNum) {
      newErrors.roomNumber = 'Room number is required';
    } else if (!ROOM_NUMBER_REGEX.test(roomNum)) {
      newErrors.roomNumber = 'Room number must be 3-20 characters, containing only uppercase letters, numbers, and underscores';
    }

    if (!formData.hotelRoomTypeId) {
      newErrors.hotelRoomTypeId = 'Room type configuration assignment is required';
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
        roomNumber: formData.roomNumber.trim(),
        hotelRoomTypeId: parseInt(formData.hotelRoomTypeId, 10)
      };

      if (editingItem) {
        // Update Room Number & Room Type (no hotelId or currentStatus allowed here)
        await roomInstanceApi.update(editingItem.id, payload);
      } else {
        // Create Room (hotelId and currentStatus required on create)
        payload.hotelId = parseInt(selectedHotelId, 10);
        payload.currentStatus = 'READY'; // default to READY on creation
        await roomInstanceApi.create(payload);
      }

      setIsModalOpen(false);
      fetchHotelData(selectedHotelId);
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.message || 'Failed to save room details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!statusEditingItem) return;

    setIsLoading(true);
    setStatusSubmitError(null);
    try {
      await roomInstanceApi.updateStatus(statusEditingItem.id, selectedStatus);
      setIsStatusModalOpen(false);
      fetchHotelData(selectedHotelId);
    } catch (err) {
      console.error(err);
      setStatusSubmitError(err.response?.data?.message || 'Failed to update room status.');
    } finally {
      setIsLoading(false);
    }
  };

  // Open custom delete confirmation modal
  const handleOpenDelete = (room) => {
    setItemToDelete(room);
    setIsDeleteModalOpen(true);
  };

  // Execute Asynchronous API Delete
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      await roomInstanceApi.delete(itemToDelete.id);
      fetchHotelData(selectedHotelId);
    } catch (err) {
      console.error(err);
      setFetchError(err.response?.data?.message || 'Failed to delete room.');
    } finally {
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      setIsLoading(false);
    }
  };

  // Resolve room type name helper mapping: hotelRoomTypeId -> roomTypeId -> roomType.name
  const getRoomTypeName = (hrtId) => {
    const config = hotelRoomTypes.find(t => t.id === hrtId);
    if (!config) return `Config ID: ${hrtId}`;
    const globalType = globalRoomTypes.find(gt => gt.id === config.roomTypeId);
    return globalType ? globalType.name : `Type ID: ${config.roomTypeId}`;
  };

  // Status color styles mapping
  const getStatusBadgeStyles = (status) => {
    switch (status) {
      case 'READY':
        return 'bg-neutral-100 text-black border border-neutral-300';
      case 'OCCUPIED':
        return 'bg-red-50 text-red-600 border border-red-200';
      case 'CLEANING':
        return 'bg-neutral-900 text-white border border-neutral-950';
      case 'MAINTENANCE':
        return 'bg-amber-50 text-amber-800 border border-amber-200';
      default:
        return 'bg-neutral-100 text-neutral-800 border border-neutral-300';
    }
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
          <h2 className="text-2xl font-extrabold text-black tracking-tight">Room Instances</h2>
          <p className="text-sm text-neutral-500">Manage physical rooms, monitor housekeeping statuses, and edit room profiles.</p>
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
            disabled={hotels.length === 0 || hotelRoomTypes.length === 0}
            className={`flex items-center justify-center space-x-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded shadow transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 w-full sm:w-auto
              ${(hotels.length === 0 || hotelRoomTypes.length === 0) ? 'opacity-50 cursor-not-allowed bg-neutral-400 hover:bg-neutral-400' : ''}
            `}
            aria-label="Add new physical room"
          >
            <Plus className="w-5 h-5" />
            <span>Add Physical Room</span>
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
                <th className="py-4 px-6">Room Number</th>
                <th className="py-4 px-6">Room Type Configuration</th>
                <th className="py-4 px-6 text-center">Current Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-sm">
              {roomInstances.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-neutral-500 font-medium bg-neutral-50">
                    No physical rooms set up for {selectedHotelId ? getHotelName(selectedHotelId) : 'this hotel'}.
                  </td>
                </tr>
              ) : (
                roomInstances.map((room) => (
                  <tr key={room.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-4 px-6 font-bold text-neutral-950">{room.id}</td>
                    <td className="py-4 px-6 font-bold text-black">{room.roomNumber}</td>
                    <td className="py-4 px-6 text-neutral-600 font-medium">{getRoomTypeName(room.hotelRoomTypeId)}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusBadgeStyles(room.currentStatus)}`}>
                        {room.currentStatus}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Status Change Button */}
                        <button
                          onClick={() => handleOpenStatusEdit(room)}
                          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-700 hover:text-black focus:outline-none focus:ring-2 focus:ring-red-600"
                          title="Quick update room status"
                          aria-label={`Change status for room ${room.roomNumber}`}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(room)}
                          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-700 hover:text-black focus:outline-none focus:ring-2 focus:ring-red-600"
                          aria-label={`Edit physical room ${room.roomNumber}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(room)}
                          className="p-1.5 rounded hover:bg-red-50 text-neutral-600 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-600"
                          aria-label={`Delete physical room ${room.roomNumber}`}
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

      {/* CREATE/EDIT OVERLAY MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-neutral-200 z-10 animate-scale-in">
            {/* Modal Header */}
            <div className="bg-neutral-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold tracking-tight">
                {editingItem ? 'Edit Physical Room' : 'Add Physical Room'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-white transition-colors focus:outline-none"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

              {/* Room Number */}
              <div>
                <label htmlFor="roomNumber" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">
                  Room Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="roomNumber"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600 uppercase"
                  placeholder="e.g. 101, DELUXE_01"
                />
                {errors.roomNumber && <p className="text-red-600 text-xs mt-1 font-semibold">{errors.roomNumber}</p>}
                <p className="text-[10px] text-neutral-400 mt-1">Accepts alphanumeric and underscores (e.g. 101, RM_202). Length: 3-20 characters.</p>
              </div>

              {/* Room Type Configuration */}
              <div>
                <label htmlFor="hotelRoomTypeId" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">
                  Room Type Configuration <span className="text-red-600">*</span>
                </label>
                <select
                  id="hotelRoomTypeId"
                  value={formData.hotelRoomTypeId}
                  onChange={(e) => setFormData({ ...formData, hotelRoomTypeId: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  <option value="">Select Room Type Config</option>
                  {hotelRoomTypes.map((t) => (
                    <option key={t.id} value={t.id.toString()}>
                      {getRoomTypeName(t.id)} (Price: {parseFloat(t.basePrice).toLocaleString()} VND)
                    </option>
                  ))}
                </select>
                {errors.hotelRoomTypeId && <p className="text-red-600 text-xs mt-1 font-semibold">{errors.hotelRoomTypeId}</p>}
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  {editingItem ? 'Save Changes' : 'Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK STATUS UPDATE MODAL */}
      {isStatusModalOpen && statusEditingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 transition-opacity"
            onClick={() => setIsStatusModalOpen(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden border border-neutral-200 z-10 animate-scale-in">
            {/* Modal Header */}
            <div className="bg-neutral-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold tracking-tight">
                Update Status: Room {statusEditingItem.roomNumber}
              </h3>
              <button 
                onClick={() => setIsStatusModalOpen(false)}
                className="text-neutral-400 hover:text-white transition-colors focus:outline-none"
                aria-label="Close status dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="p-6 space-y-4">
              {/* MODAL INLINE SUBMIT ERROR BOX */}
              {statusSubmitError && (
                <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded flex items-start space-x-3 shadow-sm">
                  <AlertCircle className="w-5 h-5 text-red-650 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-red-750">{statusSubmitError}</p>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="currentStatus" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-2">
                  Select Room Status
                </label>
                <select
                  id="currentStatus"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600 font-bold"
                >
                  {ROOM_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  Save Status
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
              <h4 className="text-lg font-extrabold text-black uppercase tracking-tight">Delete Physical Room</h4>
            </div>

            <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
              Are you sure you want to permanently delete this physical room record:
              <strong className="text-black block mt-2 font-bold bg-neutral-50 p-2.5 rounded border border-neutral-200">
                room: {itemToDelete.roomNumber} ({getRoomTypeName(itemToDelete.hotelRoomTypeId)})
              </strong>
              This action soft-deletes the room instance.
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

export default RoomInstancePage;
