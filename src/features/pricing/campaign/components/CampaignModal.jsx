import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import api from '../../../../services/api';

const CampaignModal = ({ isOpen, onClose, onSave, editingItem }) => {
  const [hotels, setHotels] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    hotelId: '',
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE'
  });

  const fetchHotels = async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/hotel/api/v1/inventory/hotels');
      setHotels(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load hotels directory: ', err);
      setSubmitError('Failed to fetch hotels list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHotels();
      if (editingItem) {
        setFormData({
          hotelId: editingItem.hotelId?.toString() || '',
          name: editingItem.name || '',
          description: editingItem.description || '',
          startDate: editingItem.startDate || '',
          endDate: editingItem.endDate || '',
          status: editingItem.status || 'ACTIVE'
        });
      } else {
        setFormData({
          hotelId: '',
          name: '',
          description: '',
          startDate: '',
          endDate: '',
          status: 'ACTIVE'
        });
      }
      setErrors({});
      setSubmitError(null);
    }
  }, [isOpen, editingItem]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.hotelId) {
      newErrors.hotelId = 'Hotel selection is required';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Campaign name is required';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'End date cannot be earlier than start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setSubmitError(null);

    const payload = {
      hotelId: parseInt(formData.hotelId, 10),
      name: formData.name.trim(),
      description: formData.description.trim(),
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: formData.status
    };

    try {
      await onSave(payload);
    } catch (err) {
      console.error(err);
      const errData = err.response?.data;
      if (errData && errData.code === 8407) {
        setSubmitError('Validation Failed: Overlapping Schedule detected.');
        setErrors(prev => ({
          ...prev,
          campaignOverlap: 'A campaign with this name already exists for the selected hotel with overlapping date schedules.'
        }));
      } else {
        setSubmitError(errData?.message || 'Failed to save campaign configuration.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-65 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white border border-neutral-200 rounded-lg shadow-2xl w-full max-w-md z-10 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-neutral-900 text-white px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold uppercase tracking-wider">
            {editingItem ? 'Edit Campaign' : 'Create Campaign'}
          </h3>
          <button 
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-red-650"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Overlap Error Warning Alert Box with Shake Effect */}
          {errors.campaignOverlap && (
            <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded flex items-start space-x-3 shadow-sm animate-shake mb-4">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-xs font-semibold text-red-750">
                <h5 className="text-sm font-extrabold text-red-800 uppercase tracking-wide">Campaign Overlap Error</h5>
                <p className="mt-1 leading-relaxed">{errors.campaignOverlap}</p>
              </div>
            </div>
          )}

          {/* Standard Submission Error */}
          {submitError && !errors.campaignOverlap && (
            <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded flex items-start space-x-3 shadow-sm animate-fade-in mb-4">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-xs font-semibold text-red-705">
                <h5 className="text-sm font-bold text-red-800">Operation Error</h5>
                <p className="mt-0.5">{submitError}</p>
              </div>
            </div>
          )}

          {/* Hotel location dropdown */}
          <div>
            <label htmlFor="hotelId" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
              Hotel Location *
            </label>
            <select
              id="hotelId"
              value={formData.hotelId}
              onChange={(e) => setFormData({ ...formData, hotelId: e.target.value })}
              className={`w-full px-3 py-2 border rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600
                ${errors.hotelId ? 'border-red-600' : 'border-neutral-300'}
              `}
            >
              <option value="">Select Hotel</option>
              {hotels.map((h) => (
                <option key={h.id} value={h.id.toString()}>
                  {h.name}
                </option>
              ))}
            </select>
            {errors.hotelId && <p className="text-red-600 text-xs mt-1 font-semibold">{errors.hotelId}</p>}
          </div>

          {/* Campaign name */}
          <div>
            <label htmlFor="campaign-name" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
              Campaign Name *
            </label>
            <input
              type="text"
              id="campaign-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600
                ${errors.name ? 'border-red-600' : 'border-neutral-300'}
              `}
              placeholder="e.g. Summer Sale 2026"
            />
            {errors.name && <p className="text-red-600 text-xs mt-1 font-semibold">{errors.name}</p>}
          </div>

          {/* Campaign Description */}
          <div>
            <label htmlFor="campaign-desc" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
              Description
            </label>
            <textarea
              id="campaign-desc"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600 min-h-[60px]"
              placeholder="Provide simple description of marketing target..."
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                Start Date *
              </label>
              <input
                type="date"
                id="startDate"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600
                  ${errors.startDate || errors.campaignOverlap ? 'border-red-600' : 'border-neutral-300'}
                `}
              />
              {errors.startDate && <p className="text-red-600 text-xs mt-1 font-semibold">{errors.startDate}</p>}
            </div>

            <div>
              <label htmlFor="endDate" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                End Date *
              </label>
              <input
                type="date"
                id="endDate"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600
                  ${errors.endDate || errors.campaignOverlap ? 'border-red-600' : 'border-neutral-300'}
                `}
              />
              {errors.endDate && <p className="text-red-600 text-xs mt-1 font-semibold">{errors.endDate}</p>}
            </div>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
              Status *
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

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-neutral-300 rounded text-sm font-medium text-neutral-700 hover:text-black hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-sm shadow transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 disabled:bg-neutral-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CampaignModal;
