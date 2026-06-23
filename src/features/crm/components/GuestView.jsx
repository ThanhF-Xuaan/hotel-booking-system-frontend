import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../../services/api';

const GuestView = () => {
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
    firstName: '',
    lastName: '',
    fullName: '',
    phone: '',
    email: '',
    identityType: 'CCCD',
    identityNumber: '',
    birthDate: '',
    nationality: 'Vietnam',
    status: 'ACTIVE'
  });

  // Fetch Guests from Backend API
  const fetchGuests = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await api.get('/hotel/api/v1/crm/guests');
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setFetchError(err.response?.data?.message || 'Failed to fetch guests from the server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      firstName: '',
      lastName: '',
      fullName: '',
      phone: '',
      email: '',
      identityType: 'CCCD',
      identityNumber: '',
      birthDate: '',
      nationality: 'Vietnam',
      status: 'ACTIVE'
    });
    setErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (guest) => {
    setEditingItem(guest);
    setFormData({
      firstName: guest.firstName || '',
      lastName: guest.lastName || '',
      fullName: guest.fullName || '',
      phone: guest.phone || '',
      email: guest.email || '',
      identityType: guest.identityType || 'CCCD',
      identityNumber: guest.identityNumber || '',
      birthDate: guest.birthDate || '',
      nationality: guest.nationality || 'Vietnam',
      status: guest.status
    });
    setErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  };

  // Helper to handle name changes and auto-generate full name
  const handleNameChange = (field, val) => {
    const updated = { ...formData, [field]: val };
    const cleanLast = updated.lastName.trim();
    const cleanFirst = updated.firstName.trim();
    updated.fullName = `${cleanLast} ${cleanFirst}`.trim();
    setFormData(updated);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name / Middle name is required';
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    
    if (formData.email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        newErrors.email = 'Invalid email address format';
      }
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9+\s-]{8,15}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Invalid phone number (8-15 digits)';
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
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        identityType: formData.identityType || null,
        identityNumber: formData.identityNumber.trim() || null,
        birthDate: formData.birthDate || null,
        nationality: formData.nationality.trim() || null,
        status: formData.status
      };

      if (editingItem) {
        // PUT Request
        await api.put(`/hotel/api/v1/crm/guests/${editingItem.id}`, payload);
      } else {
        // POST Request
        await api.post('/hotel/api/v1/crm/guests', payload);
      }
      setIsModalOpen(false);
      fetchGuests();
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.message || 'Failed to save guest.');
    } finally {
      setIsLoading(false);
    }
  };

  // Open custom delete confirmation modal
  const handleOpenDelete = (guest) => {
    setItemToDelete(guest);
    setIsDeleteModalOpen(true);
  };

  // Execute Asynchronous API Delete
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      await api.delete(`/hotel/api/v1/crm/guests/${itemToDelete.id}`);
      fetchGuests();
    } catch (err) {
      console.error(err);
      setFetchError(err.response?.data?.message || 'Failed to delete guest.');
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
          <h2 className="text-2xl font-extrabold text-black tracking-tight">Guest Directory</h2>
          <p className="text-sm text-neutral-500">Manage registered hotel guests, email and telephone contacts.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-red-600 text-white font-bold rounded shadow hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 w-full sm:w-auto"
          aria-label="Add new guest"
        >
          <Plus className="w-5 h-5" />
          <span>Add Guest</span>
        </button>
      </div>

      {/* Guests Table */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-900 text-white uppercase text-[11px] font-bold tracking-wider">
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">Full Name</th>
                <th className="py-4 px-6">Email Address</th>
                <th className="py-4 px-6">Phone</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-sm">
              {items.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-neutral-500 font-medium bg-neutral-50">
                    No guests registered. Click "Add Guest" to register one.
                  </td>
                </tr>
              ) : (
                items.map((guest) => (
                  <tr key={guest.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-4 px-6 font-bold text-neutral-950">{guest.id}</td>
                    <td className="py-4 px-6 font-semibold text-black">{guest.fullName}</td>
                    <td className="py-4 px-6 text-neutral-600 font-mono">{guest.email || <span className="text-neutral-400 italic">None</span>}</td>
                    <td className="py-4 px-6 text-neutral-650 font-mono font-medium">{guest.phone}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider
                        ${guest.status === 'ACTIVE' 
                          ? 'bg-neutral-100 text-black border border-neutral-300' 
                          : 'bg-red-50 text-red-600 border border-red-200'
                        }
                      `}>
                        {guest.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEdit(guest)}
                          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-700 hover:text-black focus:outline-none focus:ring-2 focus:ring-red-600"
                          aria-label={`Edit guest ${guest.fullName}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(guest)}
                          className="p-1.5 rounded hover:bg-red-50 text-neutral-600 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-600"
                          aria-label={`Delete guest ${guest.fullName}`}
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
                {editingItem ? 'Edit Guest Profile' : 'Register New Guest'}
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
              {/* Last Name and First Name in Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="guest-lastname" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="guest-lastname"
                    value={formData.lastName}
                    onChange={(e) => handleNameChange('lastName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600
                      ${errors.lastName ? 'border-red-600 focus:border-red-600' : 'border-neutral-300 focus:border-black'}
                    `}
                    placeholder="E.g., Nguyen Van"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{errors.lastName}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="guest-firstname" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="guest-firstname"
                    value={formData.firstName}
                    onChange={(e) => handleNameChange('firstName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600
                      ${errors.firstName ? 'border-red-600 focus:border-red-600' : 'border-neutral-300 focus:border-black'}
                    `}
                    placeholder="E.g., An"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{errors.firstName}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="guest-fullname" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="guest-fullname"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600
                    ${errors.fullName ? 'border-red-600 focus:border-red-600' : 'border-neutral-300 focus:border-black'}
                  `}
                  placeholder="E.g., Nguyen Van An"
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{errors.fullName}</span>
                  </p>
                )}
              </div>

              {/* Phone and Email in Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="guest-phone" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                    Telephone *
                  </label>
                  <input
                    type="tel"
                    id="guest-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-600
                      ${errors.phone ? 'border-red-600 focus:border-red-600' : 'border-neutral-300 focus:border-black'}
                    `}
                    placeholder="E.g., 0901234567"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{errors.phone}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="guest-email" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="guest-email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600
                      ${errors.email ? 'border-red-600 focus:border-red-600' : 'border-neutral-300 focus:border-black'}
                    `}
                    placeholder="E.g., john.doe@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Identity Type and Number in Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="guest-identity-type" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                    Identity Type
                  </label>
                  <select
                    id="guest-identity-type"
                    value={formData.identityType}
                    onChange={(e) => setFormData({ ...formData, identityType: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-black"
                  >
                    <option value="CCCD">CCCD / ID Card</option>
                    <option value="PASSPORT">Passport</option>
                    <option value="DRIVER_LICENSE">Driver License</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="guest-identity-number" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                    Identity Number
                  </label>
                  <input
                    type="text"
                    id="guest-identity-number"
                    value={formData.identityNumber}
                    onChange={(e) => setFormData({ ...formData, identityNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-black"
                    placeholder="E.g., 012345678901"
                  />
                </div>
              </div>

              {/* Birth Date and Nationality in Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="guest-birthdate" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                    Birth Date
                  </label>
                  <input
                    type="date"
                    id="guest-birthdate"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-black"
                  />
                </div>
                <div>
                  <label htmlFor="guest-nationality" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                    Nationality
                  </label>
                  <input
                    type="text"
                    id="guest-nationality"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-black"
                    placeholder="E.g., Vietnam"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label htmlFor="guest-status" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                  Status
                </label>
                <select
                  id="guest-status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
              Are you sure you want to permanently delete guest: <strong className="text-neutral-900 font-bold">{itemToDelete?.fullName}</strong>? This action cannot be undone.
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

export default GuestView;
