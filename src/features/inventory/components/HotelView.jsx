import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../../services/api';

const HotelView = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // Custom Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [errors, setErrors] = useState({});

  // Form Fields State
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    serviceFeePercent: '5.00',
    status: 'ACTIVE'
  });

  // Fetch Hotels from Backend
  const fetchHotels = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await api.get('/hotel/api/v1/inventory/hotels');
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setFetchError(err.response?.data?.message || 'Failed to fetch hotels from the server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      address: '',
      phone: '',
      checkInTime: '14:00',
      checkOutTime: '12:00',
      serviceFeePercent: '5.00',
      status: 'ACTIVE'
    });
    setErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (hotel) => {
    setEditingItem(hotel);
    // Slice seconds (e.g. "14:00:00" to "14:00") for HTML time inputs
    const formattedCheckIn = hotel.checkInTime ? hotel.checkInTime.substring(0, 5) : '14:00';
    const formattedCheckOut = hotel.checkOutTime ? hotel.checkOutTime.substring(0, 5) : '12:00';

    setFormData({
      name: hotel.name,
      address: hotel.address,
      phone: hotel.phone || '',
      checkInTime: formattedCheckIn,
      checkOutTime: formattedCheckOut,
      serviceFeePercent: hotel.serviceFeePercent.toString(),
      status: hotel.status
    });
    setErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Hotel name is required';
    if (!formData.address.trim()) newErrors.address = 'Hotel address is required';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9+\s-]{8,15}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Phone number format is invalid (8-15 digits)';
    }
    if (!formData.checkInTime) newErrors.checkInTime = 'Check-in time is required';
    if (!formData.checkOutTime) newErrors.checkOutTime = 'Check-out time is required';
    
    const parsedFee = parseFloat(formData.serviceFeePercent);
    if (isNaN(parsedFee) || parsedFee < 0 || parsedFee > 100) {
      newErrors.serviceFeePercent = 'Service fee must be between 0% and 100%';
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
      // Append seconds ":00" to time inputs to match Java LocalTime format (e.g. "14:00" to "14:00:00")
      const checkInFormatted = formData.checkInTime.length === 5 ? `${formData.checkInTime}:00` : formData.checkInTime;
      const checkOutFormatted = formData.checkOutTime.length === 5 ? `${formData.checkOutTime}:00` : formData.checkOutTime;

      const payload = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        checkInTime: checkInFormatted,
        checkOutTime: checkOutFormatted,
        serviceFeePercent: parseFloat(formData.serviceFeePercent),
        status: formData.status
      };

      if (editingItem) {
        // PUT Request
        await api.put(`/hotel/api/v1/inventory/hotels/${editingItem.id}`, payload);
      } else {
        // POST Request
        await api.post('/hotel/api/v1/inventory/hotels', payload);
      }
      setIsModalOpen(false);
      fetchHotels();
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.message || 'Failed to save hotel.');
    } finally {
      setIsLoading(false);
    }
  };

  // Open custom delete confirmation modal
  const handleOpenDelete = (hotel) => {
    setItemToDelete(hotel);
    setIsDeleteModalOpen(true);
  };

  // Execute Asynchronous API Delete
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      await api.delete(`/hotel/api/v1/inventory/hotels/${itemToDelete.id}`);
      fetchHotels();
    } catch (err) {
      console.error(err);
      setFetchError(err.response?.data?.message || 'Failed to delete hotel.');
    } finally {
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      setIsLoading(false);
    }
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

      {/* TOP API FETCH ERROR BANNER (ON MAIN CANVAS BACKGROUND) */}
      {fetchError && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-red-700">{fetchError}</span>
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

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-black tracking-tight">Hotel Registry</h2>
          <p className="text-sm text-neutral-500">Configure corporate hotel branches, service fees, and checkout policies.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-red-600 text-white font-bold rounded shadow hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 w-full sm:w-auto"
          aria-label="Add new hotel"
        >
          <Plus className="w-5 h-5" />
          <span>Add Hotel</span>
        </button>
      </div>

      {/* Hotels Listing Table */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-900 text-white uppercase text-[11px] font-bold tracking-wider">
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Address</th>
                <th className="py-4 px-6">Phone</th>
                <th className="py-4 px-6">Check In/Out</th>
                <th className="py-4 px-6">Service Fee</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-sm">
              {items.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-neutral-500 font-medium bg-neutral-50">
                    No hotels registered. Click "Add Hotel" to register one.
                  </td>
                </tr>
              ) : (
                items.map((hotel) => (
                  <tr key={hotel.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-4 px-6 font-bold text-neutral-950">{hotel.id}</td>
                    <td className="py-4 px-6 font-semibold text-black">{hotel.name}</td>
                    <td className="py-4 px-6 text-neutral-600 max-w-xs truncate">{hotel.address}</td>
                    <td className="py-4 px-6 text-neutral-600 font-mono">{hotel.phone}</td>
                    <td className="py-4 px-6 text-neutral-600 font-medium">
                      {hotel.checkInTime ? hotel.checkInTime.substring(0, 5) : '—'} / {hotel.checkOutTime ? hotel.checkOutTime.substring(0, 5) : '—'}
                    </td>
                    <td className="py-4 px-6 text-neutral-950 font-bold">{hotel.serviceFeePercent}%</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider
                        ${hotel.status === 'ACTIVE' 
                          ? 'bg-neutral-100 text-black border border-neutral-300' 
                          : 'bg-red-50 text-red-600 border border-red-200'
                        }
                      `}>
                        {hotel.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEdit(hotel)}
                          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-700 hover:text-black focus:outline-none focus:ring-2 focus:ring-red-600"
                          aria-label={`Edit ${hotel.name}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(hotel)}
                          className="p-1.5 rounded hover:bg-red-50 text-neutral-600 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-600"
                          aria-label={`Delete ${hotel.name}`}
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

          <div className="relative bg-white border border-neutral-200 rounded-lg shadow-xl w-full max-w-lg z-10 overflow-hidden animate-scale-up">
            {/* Header */}
            <div className="bg-neutral-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold uppercase tracking-wider">
                {editingItem ? 'Edit Hotel Info' : 'Add New Hotel'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-red-600"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MUTATION ERROR ALERT BOX (INSIDE MODAL CARD) */}
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
              {/* Hotel Name */}
              <div>
                <label htmlFor="hotel-name" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                  Hotel Name *
                </label>
                <input
                  type="text"
                  id="hotel-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600
                    ${errors.name ? 'border-red-600 focus:border-red-600' : 'border-neutral-300 focus:border-black'}
                  `}
                  placeholder="Enter hotel name"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>

              {/* Hotel Address */}
              <div>
                <label htmlFor="hotel-address" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                  Address *
                </label>
                <textarea
                  id="hotel-address"
                  rows="2"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600
                    ${errors.address ? 'border-red-600 focus:border-red-600' : 'border-neutral-300 focus:border-black'}
                  `}
                  placeholder="Enter physical address"
                />
                {errors.address && (
                  <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{errors.address}</span>
                  </p>
                )}
              </div>

              {/* Hotel Phone */}
              <div>
                <label htmlFor="hotel-phone" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  id="hotel-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600
                    ${errors.phone ? 'border-red-600 focus:border-red-600' : 'border-neutral-300 focus:border-black'}
                  `}
                  placeholder="Enter telephone number"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{errors.phone}</span>
                  </p>
                )}
              </div>

              {/* Check-In / Check-Out Times */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="check-in-time" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                    Check-In Time *
                  </label>
                  <input
                    type="time"
                    id="check-in-time"
                    value={formData.checkInTime}
                    onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-black"
                  />
                </div>
                <div>
                  <label htmlFor="check-out-time" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                    Check-Out Time *
                  </label>
                  <input
                    type="time"
                    id="check-out-time"
                    value={formData.checkOutTime}
                    onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-black"
                  />
                </div>
              </div>

              {/* Service Fee & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="service-fee" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                    Service Fee (%) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="service-fee"
                    value={formData.serviceFeePercent}
                    onChange={(e) => setFormData({ ...formData, serviceFeePercent: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600
                      ${errors.serviceFeePercent ? 'border-red-600 focus:border-red-600' : 'border-neutral-300 focus:border-black'}
                    `}
                    placeholder="5.00"
                  />
                  {errors.serviceFeePercent && (
                    <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{errors.serviceFeePercent}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="status" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-black"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              {/* Action buttons */}
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
              Are you sure you want to permanently delete hotel: <strong className="text-neutral-900 font-bold">{itemToDelete?.name}</strong>? This action cannot be undone.
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

export default HotelView;
