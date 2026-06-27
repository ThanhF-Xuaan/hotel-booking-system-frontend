import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import api from '../../../../services/api';
import { hotelRoomTypeApi } from '../../../inventory/hotel-room-type/api/hotelRoomTypeApi';
import { campaignApi } from '../../campaign/api/campaignApi';
import { discountRuleTypeApi } from '../../discount-rule-type/api/discountRuleTypeApi';

const DiscountRuleModal = ({ isOpen, onClose, onSave, editingItem }) => {
  const [hotels, setHotels] = useState([]);
  const [globalRoomTypes, setGlobalRoomTypes] = useState([]);
  const [hotelRoomTypes, setHotelRoomTypes] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [ruleTypes, setRuleTypes] = useState([]);
  
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    hotelRoomTypeId: '',
    campaignId: '',
    ruleTypeCode: '',
    minNights: '3',
    discountType: 'PERCENT',
    discountValue: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE'
  });

  const fetchInitializationData = async () => {
    setIsLoading(true);
    try {
      const [hotelsList, rTypesList, hrTypesList, campaignsList, ruleTypesList] = await Promise.all([
        api.get('/hotel/api/v1/inventory/hotels'),
        api.get('/hotel/api/v1/inventory/room-types'),
        hotelRoomTypeApi.getAll(),
        campaignApi.getAll(),
        discountRuleTypeApi.getAll()
      ]);

      setHotels(Array.isArray(hotelsList) ? hotelsList : []);
      setGlobalRoomTypes(Array.isArray(rTypesList) ? rTypesList : []);
      setHotelRoomTypes(Array.isArray(hrTypesList) ? hrTypesList : []);
      setCampaigns(Array.isArray(campaignsList) ? campaignsList : []);
      setRuleTypes(Array.isArray(ruleTypesList) ? ruleTypesList : []);
    } catch (err) {
      console.error('Failed to load initial dropdown mappings: ', err);
      setSubmitError('Failed to fetch dependencies.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchInitializationData();
      if (editingItem) {
        setFormData({
          hotelRoomTypeId: editingItem.hotelRoomTypeId?.toString() || '',
          campaignId: editingItem.campaignId?.toString() || '',
          ruleTypeCode: editingItem.ruleTypeCode || '',
          minNights: editingItem.minNights?.toString() || '3',
          discountType: editingItem.discountType || 'PERCENT',
          discountValue: editingItem.discountValue?.toString() || '',
          startDate: editingItem.startDate || '',
          endDate: editingItem.endDate || '',
          status: editingItem.status || 'ACTIVE'
        });
      } else {
        setFormData({
          hotelRoomTypeId: '',
          campaignId: '',
          ruleTypeCode: '',
          minNights: '3',
          discountType: 'PERCENT',
          discountValue: '',
          startDate: '',
          endDate: '',
          status: 'ACTIVE'
        });
      }
      setErrors({});
      setSubmitError(null);
    }
  }, [isOpen, editingItem]);

  const getHotelRoomTypeLabel = (hrType) => {
    const matchedHotel = hotels.find(h => h.id === hrType.hotelId);
    const matchedRoomType = globalRoomTypes.find(rt => rt.id === hrType.roomTypeId);
    const hotelName = matchedHotel ? matchedHotel.name : `Hotel ${hrType.hotelId}`;
    const roomTypeName = matchedRoomType ? matchedRoomType.name : `Room Type ${hrType.roomTypeId}`;
    return `${hotelName} - ${roomTypeName} (ID: ${hrType.id})`;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.hotelRoomTypeId) {
      newErrors.hotelRoomTypeId = 'Hotel room type is required';
    }

    if (!formData.ruleTypeCode) {
      newErrors.ruleTypeCode = 'Rule type is required';
    }

    if (formData.ruleTypeCode === 'LONG_STAY') {
      const nights = parseInt(formData.minNights, 10);
      if (isNaN(nights) || nights < 3) {
        newErrors.minNights = 'Minimum nights must be at least 3 for LONG_STAY rules';
      }
    }

    if (!formData.discountType) {
      newErrors.discountType = 'Discount type is required';
    }

    const value = parseFloat(formData.discountValue);
    if (isNaN(value) || value <= 0) {
      newErrors.discountValue = 'Discount value must be a positive number greater than 0';
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
      hotelRoomTypeId: parseInt(formData.hotelRoomTypeId, 10),
      campaignId: formData.campaignId ? parseInt(formData.campaignId, 10) : null,
      ruleTypeCode: formData.ruleTypeCode,
      minNights: formData.ruleTypeCode === 'LONG_STAY' ? parseInt(formData.minNights, 10) : null,
      discountType: formData.discountType,
      discountValue: parseFloat(formData.discountValue),
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: formData.status
    };

    try {
      await onSave(payload);
    } catch (err) {
      console.error(err);
      const errData = err.response?.data;
      if (errData && errData.code === 8313) {
        setSubmitError('Validation Failed: Overlapping Schedule detected.');
        setErrors(prev => ({
          ...prev,
          dateOverlap: 'An active discount rule of this type already overlaps with the selected date range for this room configuration.'
        }));
      } else {
        setSubmitError(errData?.message || 'Failed to save discount rule configuration.');
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
      <div className="relative bg-white border border-neutral-200 rounded-lg shadow-2xl w-full max-w-lg z-10 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-neutral-900 text-white px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold uppercase tracking-wider">
            {editingItem ? 'Edit Discount Rule' : 'Create Discount Rule'}
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
          {errors.dateOverlap && (
            <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded flex items-start space-x-3 shadow-sm animate-shake mb-4">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-xs font-semibold text-red-750">
                <h5 className="text-sm font-extrabold text-red-800 uppercase tracking-wide">Discount Overlap Error</h5>
                <p className="mt-1 leading-relaxed">{errors.dateOverlap}</p>
              </div>
            </div>
          )}

          {/* Standard Submission Error */}
          {submitError && !errors.dateOverlap && (
            <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded flex items-start space-x-3 shadow-sm animate-fade-in mb-4">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-xs font-semibold text-red-705">
                <h5 className="text-sm font-bold text-red-800">Operation Error</h5>
                <p className="mt-0.5">{submitError}</p>
              </div>
            </div>
          )}

          {/* Hotel Room Type Selection */}
          <div>
            <label htmlFor="hotelRoomTypeId" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
              Room Type Configuration *
            </label>
            <select
              id="hotelRoomTypeId"
              value={formData.hotelRoomTypeId}
              onChange={(e) => setFormData({ ...formData, hotelRoomTypeId: e.target.value })}
              className={`w-full px-3 py-2 border rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600
                ${errors.hotelRoomTypeId ? 'border-red-600' : 'border-neutral-300'}
              `}
            >
              <option value="">Select Room Type Config</option>
              {hotelRoomTypes.map((hrt) => (
                <option key={hrt.id} value={hrt.id.toString()}>
                  {getHotelRoomTypeLabel(hrt)}
                </option>
              ))}
            </select>
            {errors.hotelRoomTypeId && <p className="text-red-600 text-xs mt-1 font-semibold">{errors.hotelRoomTypeId}</p>}
          </div>

          {/* Campaign Selection */}
          <div>
            <label htmlFor="campaignId" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
              Marketing Campaign (Optional)
            </label>
            <select
              id="campaignId"
              value={formData.campaignId}
              onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="">No Associated Campaign</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id.toString()}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rule Type Dropdown */}
          <div>
            <label htmlFor="ruleTypeCode" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
              Discount Rule Type *
            </label>
            <select
              id="ruleTypeCode"
              value={formData.ruleTypeCode}
              onChange={(e) => setFormData({ 
                ...formData, 
                ruleTypeCode: e.target.value, 
                minNights: e.target.value === 'LONG_STAY' ? formData.minNights : '' 
              })}
              className={`w-full px-3 py-2 border rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600
                ${errors.ruleTypeCode ? 'border-red-600' : 'border-neutral-300'}
              `}
            >
              <option value="">Select Rule Type</option>
              {ruleTypes.map((rt) => (
                <option key={rt.code} value={rt.code}>
                  {rt.displayName} (Prio: {rt.priority})
                </option>
              ))}
            </select>
            {errors.ruleTypeCode && <p className="text-red-600 text-xs mt-1 font-semibold">{errors.ruleTypeCode}</p>}
          </div>

          {/* Conditional minNights Input field */}
          {formData.ruleTypeCode === 'LONG_STAY' && (
            <div className="animate-fade-in">
              <label htmlFor="minNights" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                Minimum Nights Limit *
              </label>
              <input
                type="number"
                id="minNights"
                min="3"
                value={formData.minNights}
                onChange={(e) => setFormData({ ...formData, minNights: e.target.value })}
                className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600 font-mono
                  ${errors.minNights ? 'border-red-600 font-bold' : 'border-neutral-300'}
                `}
                placeholder="e.g. 3"
              />
              {errors.minNights && <p className="text-red-600 text-xs mt-1 font-semibold">{errors.minNights}</p>}
            </div>
          )}

          {/* Discount values settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="discountType" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                Discount Type *
              </label>
              <select
                id="discountType"
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="PERCENT">PERCENT (%)</option>
                <option value="FIXED">FIXED (VND)</option>
              </select>
            </div>

            <div>
              <label htmlFor="discountValue" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                Discount Value *
              </label>
              <input
                type="number"
                id="discountValue"
                step="0.01"
                min="0.01"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600 font-mono font-bold
                  ${errors.discountValue ? 'border-red-600' : 'border-neutral-300'}
                `}
                placeholder={formData.discountType === 'PERCENT' ? 'e.g. 10.00' : 'e.g. 150000'}
              />
              {errors.discountValue && <p className="text-red-600 text-xs mt-1 font-semibold">{errors.discountValue}</p>}
            </div>
          </div>

          {/* Dates mapping */}
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
                  ${errors.startDate || errors.dateOverlap ? 'border-red-600' : 'border-neutral-300'}
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
                  ${errors.endDate || errors.dateOverlap ? 'border-red-600' : 'border-neutral-300'}
                `}
              />
              {errors.endDate && <p className="text-red-600 text-xs mt-1 font-semibold">{errors.endDate}</p>}
            </div>
          </div>

          {/* Date Overlap text label error */}
          {errors.dateOverlap && (
            <p className="text-red-650 text-xs font-semibold flex items-center space-x-1 mt-1 animate-pulse">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{errors.dateOverlap}</span>
            </p>
          )}

          {/* Status mapping */}
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
              {isLoading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DiscountRuleModal;
