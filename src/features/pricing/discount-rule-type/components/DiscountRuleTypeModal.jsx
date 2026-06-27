import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

const DiscountRuleTypeModal = ({ isOpen, onClose, onSave, editingItem }) => {
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    displayName: '',
    priority: '0',
    status: 'ACTIVE'
  });

  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        setFormData({
          code: editingItem.code || '',
          displayName: editingItem.displayName || '',
          priority: editingItem.priority !== null && editingItem.priority !== undefined ? editingItem.priority.toString() : '0',
          status: editingItem.status || 'ACTIVE'
        });
      } else {
        setFormData({
          code: '',
          displayName: '',
          priority: '0',
          status: 'ACTIVE'
        });
      }
      setErrors({});
      setSubmitError(null);
    }
  }, [isOpen, editingItem]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Code is required';
    } else if (!/^[A-Z0-9_]+$/.test(formData.code.trim())) {
      newErrors.code = 'Code must contain only uppercase letters, numbers, and underscores';
    }

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    const priorityVal = parseInt(formData.priority, 10);
    if (isNaN(priorityVal) || priorityVal < 0) {
      newErrors.priority = 'Priority must be a non-negative integer';
    }

    if (!formData.status) {
      newErrors.status = 'Status is required';
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
      code: formData.code.trim().toUpperCase(),
      displayName: formData.displayName.trim(),
      priority: parseInt(formData.priority, 10),
      status: formData.status || 'ACTIVE'
    };

    try {
      await onSave(payload);
    } catch (err) {
      console.error(err);
      const errData = err.response?.data;
      setSubmitError(errData?.message || 'Failed to save discount rule type configuration.');
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
            {editingItem ? 'Edit Discount Rule Type' : 'Create Discount Rule Type'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Operation Error */}
          {submitError && (
            <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded flex items-start space-x-3 shadow-sm animate-fade-in">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-xs font-semibold text-red-700">
                <h5 className="text-sm font-bold text-red-800">Operation Error</h5>
                <p className="mt-0.5">{submitError}</p>
              </div>
            </div>
          )}

          {/* Rule Type Code */}
          <div>
            <label htmlFor="code" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
              Rule Type Code *
            </label>
            <input
              type="text"
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              disabled={!!editingItem}
              placeholder="e.g. EARLY_BIRD"
              className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600
                ${editingItem 
                  ? 'bg-neutral-150 text-neutral-500 cursor-not-allowed border-neutral-200 font-semibold' 
                  : errors.code ? 'border-red-600' : 'border-neutral-300'
                }
              `}
            />
            {errors.code && <p className="text-red-600 text-xs mt-1 font-semibold">{errors.code}</p>}
            {editingItem && (
              <p className="text-neutral-400 text-[10px] mt-0.5 font-medium">
                Rule type code is immutable and cannot be changed after creation.
              </p>
            )}
          </div>

          {/* Display Name */}
          <div>
            <label htmlFor="displayName" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
              Display Name *
            </label>
            <input
              type="text"
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="e.g. Early Bird Booking Special"
              className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-650
                ${errors.displayName ? 'border-red-600' : 'border-neutral-300'}
              `}
            />
            {errors.displayName && <p className="text-red-600 text-xs mt-1 font-semibold">{errors.displayName}</p>}
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
              Priority Ranking *
            </label>
            <input
              type="number"
              id="priority"
              min="0"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600 font-mono
                ${errors.priority ? 'border-red-600' : 'border-neutral-300'}
              `}
            />
            {errors.priority && <p className="text-red-600 text-xs mt-1 font-semibold">{errors.priority}</p>}
            <p className="text-neutral-400 text-[10px] mt-0.5 font-medium">
              Higher value signifies higher precedence when multiple rules apply.
            </p>
          </div>

          {/* Status Selection */}
          <div>
            <label htmlFor="status" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
              Status *
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-650"
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
              {isLoading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DiscountRuleTypeModal;
