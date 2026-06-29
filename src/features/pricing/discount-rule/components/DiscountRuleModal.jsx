import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Plus, Trash2 } from 'lucide-react';
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

  // Split state between Create Mode and Edit Mode formats
  const [formData, setFormData] = useState({
    campaignId: '',
    ruleTypeCode: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE',
    
    // Create Mode only fields
    appliedRoomTypeIds: [], // array of numbers
    tiers: [
      {
        discountType: 'PERCENT',
        discountValue: '',
        conditions: {
          minNights: '3',
          maxNights: '',
          minAdvanceBookingDays: '',
          promoCode: ''
        }
      }
    ],

    // Edit Mode only fields
    hotelRoomTypeId: '',
    discountType: 'PERCENT',
    discountValue: '',
    conditions: {
      minNights: '3',
      maxNights: '',
      minAdvanceBookingDays: '',
      promoCode: ''
    }
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
        // Populate edit mode fields
        const conditionsObj = editingItem.conditions || {};
        setFormData({
          campaignId: editingItem.campaignId?.toString() || '',
          ruleTypeCode: editingItem.ruleTypeCode || '',
          startDate: editingItem.startDate || '',
          endDate: editingItem.endDate || '',
          status: editingItem.status || 'ACTIVE',
          
          hotelRoomTypeId: editingItem.hotelRoomTypeId?.toString() || '',
          discountType: editingItem.discountType || 'PERCENT',
          discountValue: editingItem.discountValue?.toString() || '',
          conditions: {
            minNights: conditionsObj.minNights !== null && conditionsObj.minNights !== undefined ? conditionsObj.minNights.toString() : '3',
            maxNights: conditionsObj.maxNights !== null && conditionsObj.maxNights !== undefined ? conditionsObj.maxNights.toString() : '',
            minAdvanceBookingDays: conditionsObj.minAdvanceBookingDays !== null && conditionsObj.minAdvanceBookingDays !== undefined ? conditionsObj.minAdvanceBookingDays.toString() : '',
            promoCode: conditionsObj.promoCode || ''
          },
          appliedRoomTypeIds: [],
          tiers: []
        });
      } else {
        // Reset create mode fields
        setFormData({
          campaignId: '',
          ruleTypeCode: '',
          startDate: '',
          endDate: '',
          status: 'ACTIVE',
          appliedRoomTypeIds: [],
          tiers: [
            {
              discountType: 'PERCENT',
              discountValue: '',
              conditions: {
                minNights: '3',
                maxNights: '',
                minAdvanceBookingDays: '',
                promoCode: ''
              }
            }
          ],
          hotelRoomTypeId: '',
          discountType: 'PERCENT',
          discountValue: '',
          conditions: {
            minNights: '3',
            maxNights: '',
            minAdvanceBookingDays: '',
            promoCode: ''
          }
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

  const handleRoomTypeCheckboxChange = (id) => {
    setFormData(prev => {
      const isChecked = prev.appliedRoomTypeIds.includes(id);
      const newIds = isChecked 
        ? prev.appliedRoomTypeIds.filter(item => item !== id)
        : [...prev.appliedRoomTypeIds, id];
      return { ...prev, appliedRoomTypeIds: newIds };
    });
  };

  const handleAddTier = () => {
    setFormData(prev => ({
      ...prev,
      tiers: [
        ...prev.tiers,
        {
          discountType: 'PERCENT',
          discountValue: '',
          conditions: {
            minNights: '3',
            maxNights: '',
            minAdvanceBookingDays: '',
            promoCode: ''
          }
        }
      ]
    }));
  };

  const handleRemoveTier = (index) => {
    setFormData(prev => ({
      ...prev,
      tiers: prev.tiers.filter((_, i) => i !== index)
    }));
  };

  const handleTierChange = (index, field, value) => {
    setFormData(prev => {
      const updatedTiers = [...prev.tiers];
      updatedTiers[index] = {
        ...updatedTiers[index],
        [field]: value
      };
      return { ...prev, tiers: updatedTiers };
    });
  };

  const handleTierConditionChange = (index, field, value) => {
    setFormData(prev => {
      const updatedTiers = [...prev.tiers];
      updatedTiers[index] = {
        ...updatedTiers[index],
        conditions: {
          ...updatedTiers[index].conditions,
          [field]: value
        }
      };
      return { ...prev, tiers: updatedTiers };
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.ruleTypeCode) {
      newErrors.ruleTypeCode = 'Rule type is required';
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

    if (!editingItem) {
      // Create Mode validation
      if (formData.appliedRoomTypeIds.length === 0) {
        newErrors.appliedRoomTypeIds = 'At least one Room Type Configuration must be selected';
      }

      const tierErrors = [];
      formData.tiers.forEach((tier, idx) => {
        const errorsForTier = {};
        const val = parseFloat(tier.discountValue);
        if (isNaN(val) || val <= 0) {
          errorsForTier.discountValue = 'Must be greater than 0';
        }

        if (formData.ruleTypeCode === 'LONG_STAY') {
          const nights = parseInt(tier.conditions.minNights, 10);
          if (isNaN(nights) || nights < 3) {
            errorsForTier.minNights = 'Must be >= 3';
          }
        }

        const minAdv = tier.conditions.minAdvanceBookingDays ? parseInt(tier.conditions.minAdvanceBookingDays, 10) : null;
        if (minAdv !== null && (isNaN(minAdv) || minAdv < 0)) {
          errorsForTier.minAdvanceBookingDays = 'Must be >= 0';
        }

        const maxN = tier.conditions.maxNights ? parseInt(tier.conditions.maxNights, 10) : null;
        if (maxN !== null && (isNaN(maxN) || maxN < 0)) {
          errorsForTier.maxNights = 'Must be >= 0';
        }

        if (Object.keys(errorsForTier).length > 0) {
          tierErrors[idx] = errorsForTier;
        }
      });

      if (tierErrors.length > 0) {
        newErrors.tiers = tierErrors;
      }
    } else {
      // Edit Mode validation
      if (!formData.hotelRoomTypeId) {
        newErrors.hotelRoomTypeId = 'Hotel room type is required';
      }

      const val = parseFloat(formData.discountValue);
      if (isNaN(val) || val <= 0) {
        newErrors.discountValue = 'Discount value must be a positive number greater than 0';
      }

      if (formData.ruleTypeCode === 'LONG_STAY') {
        const nights = parseInt(formData.conditions.minNights, 10);
        if (isNaN(nights) || nights < 3) {
          newErrors.minNights = 'Minimum nights must be at least 3 for LONG_STAY';
        }
      }

      const minAdv = formData.conditions.minAdvanceBookingDays ? parseInt(formData.conditions.minAdvanceBookingDays, 10) : null;
      if (minAdv !== null && (isNaN(minAdv) || minAdv < 0)) {
        newErrors.minAdvanceBookingDays = 'Must be >= 0';
      }

      const maxN = formData.conditions.maxNights ? parseInt(formData.conditions.maxNights, 10) : null;
      if (maxN !== null && (isNaN(maxN) || maxN < 0)) {
        newErrors.maxNights = 'Must be >= 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setSubmitError(null);

    let payload;
    if (!editingItem) {
      // Construct Create Payload (DiscountRuleCreateRequest)
      payload = {
        campaignId: formData.campaignId ? parseInt(formData.campaignId, 10) : null,
        ruleTypeCode: formData.ruleTypeCode,
        startDate: formData.startDate,
        endDate: formData.endDate,
        appliedRoomTypeIds: formData.appliedRoomTypeIds.map(id => parseInt(id, 10)),
        status: formData.status,
        tiers: formData.tiers.map(t => {
          const isLongStay = formData.ruleTypeCode === 'LONG_STAY';
          return {
            discountType: t.discountType,
            discountValue: parseFloat(t.discountValue),
            conditions: {
              minNights: isLongStay ? parseInt(t.conditions.minNights, 10) : null,
              maxNights: t.conditions.maxNights ? parseInt(t.conditions.maxNights, 10) : null,
              minAdvanceBookingDays: t.conditions.minAdvanceBookingDays ? parseInt(t.conditions.minAdvanceBookingDays, 10) : null,
              promoCode: t.conditions.promoCode || null
            }
          };
        })
      };
    } else {
      // Construct Update Payload (DiscountRuleUpdateRequest)
      const isLongStay = formData.ruleTypeCode === 'LONG_STAY';
      payload = {
        hotelRoomTypeId: parseInt(formData.hotelRoomTypeId, 10),
        campaignId: formData.campaignId ? parseInt(formData.campaignId, 10) : null,
        ruleTypeCode: formData.ruleTypeCode,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
        conditions: {
          minNights: isLongStay ? parseInt(formData.conditions.minNights, 10) : null,
          maxNights: formData.conditions.maxNights ? parseInt(formData.conditions.maxNights, 10) : null,
          minAdvanceBookingDays: formData.conditions.minAdvanceBookingDays ? parseInt(formData.conditions.minAdvanceBookingDays, 10) : null,
          promoCode: formData.conditions.promoCode || null
        }
      };
    }

    try {
      await onSave(payload);
    } catch (err) {
      console.error(err);
      const errData = err.response?.data;
      if (errData && errData.code === 8313) {
        setSubmitError('Validation Failed: Overlapping Schedule detected.');
        setErrors(prev => ({
          ...prev,
          dateOverlap: 'An active discount rule of this type already overlaps with the selected date range.'
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
      <div className="relative bg-white border border-neutral-200 rounded-lg shadow-2xl w-full max-w-2xl z-10 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-neutral-900 text-white px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold uppercase tracking-wider">
            {editingItem ? 'Edit Discount Rule' : 'Create Discount Rule (Tiered)'}
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
          {/* Overlap Error Warning Alert Box */}
          {errors.dateOverlap && (
            <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded flex items-start space-x-3 shadow-sm animate-shake mb-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-xs font-semibold text-red-750">
                <h5 className="text-sm font-extrabold text-red-800 uppercase tracking-wide">Discount Overlap Error</h5>
                <p className="mt-1 leading-relaxed">{errors.dateOverlap}</p>
              </div>
            </div>
          )}

          {/* Standard Submission Error */}
          {submitError && !errors.dateOverlap && (
            <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded flex items-start space-x-3 shadow-sm animate-fade-in mb-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-xs font-semibold text-red-700">
                <h5 className="text-sm font-bold text-red-800">Operation Error</h5>
                <p className="mt-0.5">{submitError}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Rule Type Dropdown */}
            <div>
              <label htmlFor="ruleTypeCode" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                Discount Rule Type *
              </label>
              <select
                id="ruleTypeCode"
                value={formData.ruleTypeCode}
                onChange={(e) => setFormData({ ...formData, ruleTypeCode: e.target.value })}
                className={`w-full px-3 py-2 border rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600
                  ${errors.ruleTypeCode ? 'border-red-600' : 'border-neutral-300'}
                `}
              >
                <option value="">Select Rule Type</option>
                {ruleTypes.map((rt) => (
                  <option key={rt.code} value={rt.code}>
                    {rt.displayName}
                  </option>
                ))}
              </select>
              {errors.ruleTypeCode && <p className="text-red-600 text-xs mt-1 font-semibold">{errors.ruleTypeCode}</p>}
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
          </div>

          {/* CREATE MODE: Multi-Select Room Types Grid */}
          {!editingItem ? (
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase text-neutral-900 tracking-wider">
                Target Room Configurations *
              </label>
              <p className="text-[10px] text-neutral-400 font-semibold mb-2">Select all room types that this tiered rule will be created for.</p>
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 border rounded bg-neutral-50
                ${errors.appliedRoomTypeIds ? 'border-red-600' : 'border-neutral-200'}
              `}>
                {hotelRoomTypes.map((hrt) => (
                  <label 
                    key={hrt.id} 
                    className={`flex items-center space-x-2.5 p-2 rounded border cursor-pointer select-none text-xs transition-colors
                      ${formData.appliedRoomTypeIds.includes(hrt.id)
                        ? 'border-red-600 bg-red-50/20 text-neutral-950 font-bold'
                        : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={formData.appliedRoomTypeIds.includes(hrt.id)}
                      onChange={() => handleRoomTypeCheckboxChange(hrt.id)}
                      className="rounded text-red-600 focus:ring-red-650 h-3.5 w-3.5"
                    />
                    <span className="truncate">{getHotelRoomTypeLabel(hrt)}</span>
                  </label>
                ))}
              </div>
              {errors.appliedRoomTypeIds && (
                <p className="text-red-600 text-xs mt-1 font-semibold">{errors.appliedRoomTypeIds}</p>
              )}
            </div>
          ) : (
            /* EDIT MODE: Read-Only Hotel Room Configuration */
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                Hotel Room Configuration
              </label>
              <div className="w-full px-3 py-2 border border-neutral-200 rounded text-sm bg-neutral-100 text-neutral-600 font-semibold select-none">
                {editingItem.hotelRoomTypeName} (ID: {editingItem.hotelRoomTypeId})
              </div>
            </div>
          )}

          {/* DATES GRID */}
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

          {/* DYNAMIC DISCOUNT TIERS (CREATE MODE ONLY) */}
          {!editingItem ? (
            <div className="space-y-4 pt-2 border-t border-neutral-100">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-neutral-950 uppercase tracking-wide">
                  Discount Tiers Config ({formData.tiers.length})
                </h4>
                <button
                  type="button"
                  onClick={handleAddTier}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-600 text-white font-bold rounded text-xs hover:bg-red-700 transition-colors focus:outline-none"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Tier</span>
                </button>
              </div>

              {formData.tiers.map((tier, idx) => (
                <div key={idx} className="p-4 border border-neutral-200 bg-neutral-50 rounded-lg relative space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-2 mb-2">
                    <span className="text-xs font-extrabold text-neutral-900 uppercase">Tier #{idx + 1}</span>
                    {formData.tiers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTier(idx)}
                        className="text-neutral-400 hover:text-red-600 transition-colors p-1"
                        title="Remove this tier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-neutral-500 mb-1">
                        Discount Type
                      </label>
                      <select
                        value={tier.discountType}
                        onChange={(e) => handleTierChange(idx, 'discountType', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-neutral-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-red-600"
                      >
                        <option value="PERCENT">PERCENT (%)</option>
                        <option value="FIXED">FIXED (VND)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-neutral-500 mb-1">
                        Discount Value
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={tier.discountValue}
                        onChange={(e) => handleTierChange(idx, 'discountValue', e.target.value)}
                        placeholder="e.g. 10.00"
                        className={`w-full px-2.5 py-1.5 border rounded text-xs focus:ring-1 focus:ring-red-600 font-mono font-bold
                          ${errors.tiers?.[idx]?.discountValue ? 'border-red-600' : 'border-neutral-300'}
                        `}
                      />
                      {errors.tiers?.[idx]?.discountValue && (
                        <p className="text-red-600 text-[10px] mt-0.5 font-bold">{errors.tiers[idx].discountValue}</p>
                      )}
                    </div>
                  </div>

                  {/* Tier Conditions Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {formData.ruleTypeCode === 'LONG_STAY' && (
                      <div>
                        <label className="block text-[9px] font-extrabold uppercase text-neutral-400 mb-0.5">
                          Min Nights
                        </label>
                        <input
                          type="number"
                          min="3"
                          value={tier.conditions.minNights}
                          onChange={(e) => handleTierConditionChange(idx, 'minNights', e.target.value)}
                          className={`w-full px-2 py-1 border rounded text-xs font-mono
                            ${errors.tiers?.[idx]?.minNights ? 'border-red-600' : 'border-neutral-350'}
                          `}
                        />
                        {errors.tiers?.[idx]?.minNights && (
                          <p className="text-red-600 text-[9px] font-bold mt-0.5">{errors.tiers[idx].minNights}</p>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-[9px] font-extrabold uppercase text-neutral-400 mb-0.5">
                        Max Nights
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={tier.conditions.maxNights}
                        onChange={(e) => handleTierConditionChange(idx, 'maxNights', e.target.value)}
                        className="w-full px-2 py-1 border border-neutral-300 rounded text-xs font-mono"
                        placeholder="Optional"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-extrabold uppercase text-neutral-400 mb-0.5">
                        Advance Days
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={tier.conditions.minAdvanceBookingDays}
                        onChange={(e) => handleTierConditionChange(idx, 'minAdvanceBookingDays', e.target.value)}
                        className="w-full px-2 py-1 border border-neutral-300 rounded text-xs font-mono"
                        placeholder="Optional"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-extrabold uppercase text-neutral-400 mb-0.5">
                        Promo Code
                      </label>
                      <input
                        type="text"
                        value={tier.conditions.promoCode}
                        onChange={(e) => handleTierConditionChange(idx, 'promoCode', e.target.value)}
                        className="w-full px-2 py-1 border border-neutral-300 rounded text-xs font-semibold"
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* EDIT MODE: SINGLE RULE UPDATE FIELDS */
            <div className="space-y-4 pt-2 border-t border-neutral-100 bg-neutral-50 p-4 rounded-lg border border-neutral-200">
              <h4 className="text-xs font-extrabold text-neutral-900 uppercase tracking-wider">
                Discount Details & Apply Conditions
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="discountType" className="block text-[10px] font-extrabold uppercase text-neutral-500 mb-1">
                    Discount Type *
                  </label>
                  <select
                    id="discountType"
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded text-xs bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    <option value="PERCENT">PERCENT (%)</option>
                    <option value="FIXED">FIXED (VND)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="discountValue" className="block text-[10px] font-extrabold uppercase text-neutral-500 mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    id="discountValue"
                    step="0.01"
                    min="0.01"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className={`w-full px-3 py-2 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-red-600 font-mono font-bold
                      ${errors.discountValue ? 'border-red-600' : 'border-neutral-300'}
                    `}
                  />
                  {errors.discountValue && <p className="text-red-600 text-xs mt-1 font-semibold">{errors.discountValue}</p>}
                </div>
              </div>

              {/* Conditions grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {formData.ruleTypeCode === 'LONG_STAY' && (
                  <div>
                    <label htmlFor="edit-minNights" className="block text-[9px] font-extrabold uppercase text-neutral-400 mb-0.5">
                      Min Nights *
                    </label>
                    <input
                      type="number"
                      id="edit-minNights"
                      min="3"
                      value={formData.conditions.minNights}
                      onChange={(e) => setFormData({
                        ...formData,
                        conditions: { ...formData.conditions, minNights: e.target.value }
                      })}
                      className={`w-full px-2.5 py-1.5 border rounded text-xs font-mono
                        ${errors.minNights ? 'border-red-600 font-bold' : 'border-neutral-300'}
                      `}
                    />
                    {errors.minNights && <p className="text-red-600 text-[10px] mt-0.5 font-bold">{errors.minNights}</p>}
                  </div>
                )}

                <div>
                  <label htmlFor="edit-maxNights" className="block text-[9px] font-extrabold uppercase text-neutral-400 mb-0.5">
                    Max Nights
                  </label>
                  <input
                    type="number"
                    id="edit-maxNights"
                    min="0"
                    value={formData.conditions.maxNights}
                    onChange={(e) => setFormData({
                      ...formData,
                      conditions: { ...formData.conditions, maxNights: e.target.value }
                    })}
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded text-xs font-mono"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label htmlFor="edit-minAdvanceBookingDays" className="block text-[9px] font-extrabold uppercase text-neutral-400 mb-0.5">
                    Advance Days
                  </label>
                  <input
                    type="number"
                    id="edit-minAdvanceBookingDays"
                    min="0"
                    value={formData.conditions.minAdvanceBookingDays}
                    onChange={(e) => setFormData({
                      ...formData,
                      conditions: { ...formData.conditions, minAdvanceBookingDays: e.target.value }
                    })}
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded text-xs font-mono"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label htmlFor="edit-promoCode" className="block text-[9px] font-extrabold uppercase text-neutral-400 mb-0.5">
                    Promo Code
                  </label>
                  <input
                    type="text"
                    id="edit-promoCode"
                    value={formData.conditions.promoCode}
                    onChange={(e) => setFormData({
                      ...formData,
                      conditions: { ...formData.conditions, promoCode: e.target.value }
                    })}
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded text-xs font-semibold"
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STATUS SELECTION */}
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

export default DiscountRuleModal;
