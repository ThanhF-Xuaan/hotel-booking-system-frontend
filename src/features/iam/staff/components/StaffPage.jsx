import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../../../services/api';
import { staffApi } from '../api/staffApi';

const StaffPage = () => {
  const [staffs, setStaffs] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [roles, setRoles] = useState([]);
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
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    hotelId: '',
    roleId: '',
    status: 'ACTIVE'
  });

  // Fetch initial config data (Hotels, Roles, Staffs)
  const fetchData = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [hotelsData, rolesData, staffsData] = await Promise.all([
        api.get('/hotel/api/v1/inventory/hotels'),
        api.get('/hotel/api/v1/iam/roles'),
        staffApi.getAll()
      ]);

      setHotels(Array.isArray(hotelsData) ? hotelsData : []);
      
      // Map roles: filter for ACTIVE roles to display in select box
      const rolesList = Array.isArray(rolesData) ? rolesData : [];
      setRoles(rolesList);

      setStaffs(Array.isArray(staffsData) ? staffsData : []);
    } catch (err) {
      console.error(err);
      setFetchError(err.response?.data?.message || 'Failed to initialize staff details from the server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      username: '',
      password: '',
      firstName: '',
      lastName: '',
      hotelId: hotels.length > 0 ? hotels[0].id.toString() : '',
      roleId: roles.length > 0 ? roles[0].id.toString() : '',
      status: 'ACTIVE'
    });
    setErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (staff) => {
    setEditingItem(staff);
    setFormData({
      username: staff.username,
      password: '', // Password empty on edit unless resetting
      firstName: staff.firstName || '',
      lastName: staff.lastName || '',
      hotelId: staff.hotelId ? staff.hotelId.toString() : '',
      roleId: staff.roleId ? staff.roleId.toString() : '',
      status: staff.status
    });
    setErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!editingItem) {
      if (!formData.username.trim()) {
        newErrors.username = 'Username is required';
      } else if (formData.username.trim().length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      }
      if (!formData.password) {
        newErrors.password = 'Password is required for new staff accounts';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    } else {
      // For updates, password is optional, but if entered, validate minimum length
      if (formData.password && formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    }

    if (!formData.hotelId) newErrors.hotelId = 'Assigned Hotel is required';
    if (!formData.roleId) newErrors.roleId = 'Assigned Role is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setSubmitError(null);
    try {
      if (editingItem) {
        // Update Payload
        const payload = {
          firstName: formData.firstName.trim() || null,
          lastName: formData.lastName.trim() || null,
          roleId: parseInt(formData.roleId, 10),
          status: formData.status
        };
        // Add password only if it is filled in
        if (formData.password) {
          payload.password = formData.password;
        }

        await staffApi.update(editingItem.id, payload);
      } else {
        // Create Payload
        const payload = {
          username: formData.username.trim(),
          password: formData.password,
          firstName: formData.firstName.trim() || null,
          lastName: formData.lastName.trim() || null,
          hotelId: parseInt(formData.hotelId, 10),
          roleId: parseInt(formData.roleId, 10),
          status: formData.status
        };

        await staffApi.create(payload);
      }
      setIsModalOpen(false);
      // Re-fetch all staffs
      const updatedStaffs = await staffApi.getAll();
      setStaffs(Array.isArray(updatedStaffs) ? updatedStaffs : []);
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.message || 'Failed to save staff member.');
    } finally {
      setIsLoading(false);
    }
  };

  // Open custom delete confirmation modal
  const handleOpenDelete = (staff) => {
    setItemToDelete(staff);
    setIsDeleteModalOpen(true);
  };

  // Execute Asynchronous API Delete
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      await staffApi.delete(itemToDelete.id);
      const updatedStaffs = await staffApi.getAll();
      setStaffs(Array.isArray(updatedStaffs) ? updatedStaffs : []);
    } catch (err) {
      console.error(err);
      setFetchError(err.response?.data?.message || 'Failed to delete staff member.');
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

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-black tracking-tight">Staff Accounts</h2>
          <p className="text-sm text-neutral-500">Manage operator profiles, system roles, and assigned branch locations.</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded shadow transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 w-full sm:w-auto"
          aria-label="Add new staff member"
        >
          <Plus className="w-5 h-5" />
          <span>Add Staff Account</span>
        </button>
      </div>

      {/* Listing Table */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-900 text-white uppercase text-[11px] font-bold tracking-wider">
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">Username</th>
                <th className="py-4 px-6">Full Name</th>
                <th className="py-4 px-6">Hotel Location</th>
                <th className="py-4 px-6">Role</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-sm">
              {staffs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-neutral-500 font-medium bg-neutral-50">
                    No staff records found. Click "Add Staff Account" to register one.
                  </td>
                </tr>
              ) : (
                staffs.map((staff) => (
                  <tr key={staff.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-4 px-6 font-bold text-neutral-950">{staff.id}</td>
                    <td className="py-4 px-6 font-semibold text-black">{staff.username}</td>
                    <td className="py-4 px-6 text-neutral-800">{staff.fullName || `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || 'N/A'}</td>
                    <td className="py-4 px-6 text-neutral-600 font-medium">{staff.hotelName || `ID: ${staff.hotelId}`}</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-neutral-100 text-neutral-800 border border-neutral-300">
                        {staff.roleName || `ID: ${staff.roleId}`}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider
                        ${staff.status === 'ACTIVE' 
                          ? 'bg-neutral-100 text-black border border-neutral-300' 
                          : 'bg-red-50 text-red-600 border border-red-200'
                        }
                      `}>
                        {staff.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEdit(staff)}
                          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-700 hover:text-black focus:outline-none focus:ring-2 focus:ring-red-600"
                          aria-label={`Edit staff account ${staff.username}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(staff)}
                          className="p-1.5 rounded hover:bg-red-50 text-neutral-600 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-600"
                          aria-label={`Delete staff account ${staff.username}`}
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
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-neutral-200 z-10 animate-scale-in">
            {/* Modal Header */}
            <div className="bg-neutral-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold tracking-tight">
                {editingItem ? 'Edit Staff Account' : 'Register New Staff Member'}
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

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Username */}
                <div className="col-span-1 sm:col-span-2">
                  <label htmlFor="username" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">
                    Username <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="username"
                    disabled={!!editingItem}
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600 disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed"
                    placeholder="Enter login username"
                  />
                  {errors.username && <p className="text-red-600 text-xs mt-1 font-semibold">{errors.username}</p>}
                </div>

                {/* Password */}
                <div className="col-span-1 sm:col-span-2">
                  <label htmlFor="password" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">
                    Password {editingItem ? '(Reset Only)' : <span className="text-red-600">*</span>}
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                    placeholder={editingItem ? 'Leave empty to keep current password' : 'Enter login password'}
                  />
                  {errors.password && <p className="text-red-600 text-xs mt-1 font-semibold">{errors.password}</p>}
                </div>

                {/* First Name */}
                <div>
                  <label htmlFor="firstName" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                    placeholder="e.g. John"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="lastName" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                    placeholder="e.g. Doe"
                  />
                </div>

                {/* Assigned Hotel */}
                <div>
                  <label htmlFor="hotelId" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">
                    Assigned Hotel <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="hotelId"
                    disabled={!!editingItem}
                    value={formData.hotelId}
                    onChange={(e) => setFormData({ ...formData, hotelId: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600 disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Hotel</option>
                    {hotels.map((h) => (
                      <option key={h.id} value={h.id.toString()}>{h.name}</option>
                    ))}
                  </select>
                  {errors.hotelId && <p className="text-red-600 text-xs mt-1 font-semibold">{errors.hotelId}</p>}
                </div>

                {/* Role */}
                <div>
                  <label htmlFor="roleId" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">
                    System Role <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="roleId"
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    <option value="">Select Role</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id.toString()}>{r.name}</option>
                    ))}
                  </select>
                  {errors.roleId && <p className="text-red-600 text-xs mt-1 font-semibold">{errors.roleId}</p>}
                </div>

                {/* Status */}
                <div className="col-span-1 sm:col-span-2">
                  <label htmlFor="status" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">
                    Account Status <span className="text-red-600">*</span>
                  </label>
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
                  {editingItem ? 'Save Changes' : 'Create Account'}
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
              <h4 className="text-lg font-extrabold text-black uppercase tracking-tight">Confirm Account Deletion</h4>
            </div>

            <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
              Are you sure you want to permanently disable and delete this staff member:
              <strong className="text-black block mt-2 font-bold bg-neutral-50 p-2.5 rounded border border-neutral-200">
                {itemToDelete.fullName || `${itemToDelete.firstName || ''} ${itemToDelete.lastName || ''}`.trim() || 'N/A'} ({itemToDelete.username})
              </strong>
              This action soft-deletes the record in the backend database.
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

export default StaffPage;
