import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../../services/api';
import { normalizeDimensionString, parseDimensionString } from '../../../utils/dimension';

const RoomBedView = () => {
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
    width: '',
    height: '',
    status: 'ACTIVE'
  });

  // Fetch Room Beds from Backend
  const fetchRoomBeds = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await api.get('/hotel/api/v1/inventory/room-beds');
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setFetchError(err.response?.data?.message || 'Failed to fetch room beds from the server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomBeds();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      width: '',
      height: '',
      status: 'ACTIVE'
    });
    setErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (bed) => {
    const parsed = parseDimensionString(bed.size);
    setEditingItem(bed);
    setFormData({
      name: bed.name,
      width: parsed ? parsed.width.toString() : '',
      height: parsed ? parsed.height.toString() : '',
      status: bed.status
    });
    setErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleWidthBlur = () => {
    const val = parseFloat(formData.width);
    if (isNaN(val) || val <= 0) return;
    if (val > 10) {
      // Heuristic centimeter-to-meter conversion
      setFormData(prev => ({ ...prev, width: (val / 100).toString() }));
    }
    setErrors(prev => {
      const copy = { ...prev };
      delete copy.width;
      return copy;
    });
  };

  const handleHeightBlur = () => {
    const val = parseFloat(formData.height);
    if (isNaN(val) || val <= 0) return;
    if (val > 10) {
      // Heuristic centimeter-to-meter conversion
      setFormData(prev => ({ ...prev, height: (val / 100).toString() }));
    }
    setErrors(prev => {
      const copy = { ...prev };
      delete copy.height;
      return copy;
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Bed configuration name is required';
    
    const w = parseFloat(formData.width);
    const h = parseFloat(formData.height);

    if (isNaN(w) || w <= 0) {
      newErrors.width = 'Width must be a positive number';
    }
    if (isNaN(h) || h <= 0) {
      newErrors.height = 'Height must be a positive number';
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
      let wVal = parseFloat(formData.width);
      let hVal = parseFloat(formData.height);
      
      // Apply heuristic conversion just in case onBlur was bypassed
      if (wVal > 10) wVal = wVal / 100;
      if (hVal > 10) hVal = hVal / 100;

      // Format float meter numbers into middle-m standard format (e.g. 1.8 -> 1m8, 2 -> 2m, 2.05 -> 2m05)
      const formatDimension = (val) => {
        const str = (Math.round(val * 1000) / 1000).toString();
        const dotIdx = str.indexOf('.');
        if (dotIdx === -1) return `${str}m`;
        const whole = str.substring(0, dotIdx);
        const frac = str.substring(dotIdx + 1);
        return `${whole}m${frac}`;
      };

      const sizeString = `${formatDimension(wVal)} x ${formatDimension(hVal)}`;

      const payload = {
        name: formData.name.trim(),
        size: sizeString,
        status: formData.status
      };

      if (editingItem) {
        // PUT Request
        await api.put(`/hotel/api/v1/inventory/room-beds/${editingItem.id}`, payload);
      } else {
        // POST Request
        await api.post('/hotel/api/v1/inventory/room-beds', payload);
      }
      setIsModalOpen(false);
      fetchRoomBeds();
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.message || 'Failed to save bed configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  // Open custom delete confirmation modal
  const handleOpenDelete = (bed) => {
    setItemToDelete(bed);
    setIsDeleteModalOpen(true);
  };

  // Execute Asynchronous API Delete
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      await api.delete(`/hotel/api/v1/inventory/room-beds/${itemToDelete.id}`);
      fetchRoomBeds();
    } catch (err) {
      console.error(err);
      setFetchError(err.response?.data?.message || 'Failed to delete bed configuration.');
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
          <h2 className="text-2xl font-extrabold text-black tracking-tight">Room Beds</h2>
          <p className="text-sm text-neutral-500">Configure bed sizes and inventory properties.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-red-600 text-white font-bold rounded shadow hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 w-full sm:w-auto"
          aria-label="Add new bed config"
        >
          <Plus className="w-5 h-5" />
          <span>Add Bed Configuration</span>
        </button>
      </div>

      {/* Listing Table */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-900 text-white uppercase text-[11px] font-bold tracking-wider">
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Size Dimensions</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-sm">
              {items.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-neutral-500 font-medium bg-neutral-50">
                    No bed types registered. Click "Add Bed Configuration" to register one.
                  </td>
                </tr>
              ) : (
                items.map((bed) => (
                  <tr key={bed.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-4 px-6 font-bold text-neutral-950">{bed.id}</td>
                    <td className="py-4 px-6 font-semibold text-black">{bed.name}</td>
                    <td className="py-4 px-6 text-neutral-600 font-mono">{bed.size}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider
                        ${bed.status === 'ACTIVE' 
                          ? 'bg-neutral-100 text-black border border-neutral-300' 
                          : 'bg-red-50 text-red-600 border border-red-200'
                        }
                      `}>
                        {bed.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEdit(bed)}
                          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-700 hover:text-black focus:outline-none focus:ring-2 focus:ring-red-600"
                          aria-label={`Edit bed ${bed.name}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(bed)}
                          className="p-1.5 rounded hover:bg-red-50 text-neutral-600 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-600"
                          aria-label={`Delete bed ${bed.name}`}
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
                {editingItem ? 'Edit Bed Setup' : 'Add Bed Setup'}
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
                  className="text-red-600 hover:text-red-805 transition-colors focus:outline-none"
                  aria-label="Dismiss submit error"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Bed Name */}
              <div>
                <label htmlFor="bed-name" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                  Bed Name *
                </label>
                <input
                  type="text"
                  id="bed-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600
                    ${errors.name ? 'border-red-600 focus:border-red-600' : 'border-neutral-300 focus:border-black'}
                  `}
                  placeholder="E.g., Twin Bed, King Bed"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>

              {/* Width & Height Dimensions */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bed-width" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                    Width (m) *
                  </label>
                  <input
                    type="number"
                    id="bed-width"
                    step="0.01"
                    min="0.1"
                    value={formData.width}
                    onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                    onBlur={handleWidthBlur}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600
                      ${errors.width ? 'border-red-600 focus:border-red-600' : 'border-neutral-300 focus:border-black'}
                    `}
                    placeholder="E.g., 1.8 or 180"
                  />
                  {errors.width && (
                    <p className="mt-1 text-xs text-red-600 flex items-center space-x-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{errors.width}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="bed-height" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                    Height / Length (m) *
                  </label>
                  <input
                    type="number"
                    id="bed-height"
                    step="0.01"
                    min="0.1"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    onBlur={handleHeightBlur}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600
                      ${errors.height ? 'border-red-600 focus:border-red-600' : 'border-neutral-300 focus:border-black'}
                    `}
                    placeholder="E.g., 2.0 or 200"
                  />
                  {errors.height && (
                    <p className="mt-1 text-xs text-red-600 flex items-center space-x-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{errors.height}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                <label htmlFor="bed-status" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                  Status
                </label>
                <select
                  id="bed-status"
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
              Are you sure you want to permanently delete bed configuration: <strong className="text-neutral-900 font-bold">{itemToDelete?.name}</strong>? This action cannot be undone.
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

export default RoomBedView;
