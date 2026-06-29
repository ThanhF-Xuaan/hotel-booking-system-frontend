import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import api from '../../../../services/api';
import { hotelRoomTypeApi } from '../../../inventory/hotel-room-type/api/hotelRoomTypeApi';
import { 
  SurchargeRuleResponse, 
  SurchargeRuleCreateRequest, 
  SurchargeRuleUpdateRequest 
} from '../../../../types/pricing';

export interface SurchargeRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: SurchargeRuleCreateRequest | SurchargeRuleUpdateRequest) => Promise<void>;
  editingItem: SurchargeRuleResponse | null;
}

interface DropdownItem {
  id: number;
  name: string;
}

interface HotelRoomTypeItem {
  id: number;
  hotelId: number;
  roomTypeId: number;
}

interface FormErrors {
  hotelRoomTypeId?: string;
  ruleType?: string;
  adjustmentType?: string;
  adjustmentValue?: string;
  startDate?: string;
  endDate?: string;
  dateOverlap?: string;
}

const SurchargeRuleModal: React.FC<SurchargeRuleModalProps> = ({ isOpen, onClose, onSave, editingItem }) => {
  const [hotels, setHotels] = useState<DropdownItem[]>([]);
  const [globalRoomTypes, setGlobalRoomTypes] = useState<DropdownItem[]>([]);
  const [hotelRoomTypes, setHotelRoomTypes] = useState<HotelRoomTypeItem[]>([]);
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    hotelRoomTypeId: '',
    ruleType: 'EXTRA_PERSON',
    guestType: '' as 'ADULT' | 'CHILD' | 'INFANT' | '',
    adjustmentType: 'FIXED' as 'PERCENT' | 'FIXED',
    adjustmentValue: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });

  const fetchInitializationData = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const [hotelsList, rTypesList, hrTypesList] = await Promise.all([
        api.get('/hotel/api/v1/inventory/hotels'),
        api.get('/hotel/api/v1/inventory/room-types'),
        hotelRoomTypeApi.getAll()
      ]);

      setHotels(Array.isArray(hotelsList) ? (hotelsList as DropdownItem[]) : []);
      setGlobalRoomTypes(Array.isArray(rTypesList) ? (rTypesList as DropdownItem[]) : []);
      setHotelRoomTypes(Array.isArray(hrTypesList) ? (hrTypesList as HotelRoomTypeItem[]) : []);
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
          ruleType: editingItem.ruleType || 'EXTRA_PERSON',
          guestType: editingItem.guestType || '',
          adjustmentType: editingItem.adjustmentType || 'FIXED',
          adjustmentValue: editingItem.adjustmentValue?.toString() || '',
          startDate: editingItem.startDate || '',
          endDate: editingItem.endDate || '',
          status: editingItem.status || 'ACTIVE'
        });
      } else {
        setFormData({
          hotelRoomTypeId: '',
          ruleType: 'EXTRA_PERSON',
          guestType: '',
          adjustmentType: 'FIXED',
          adjustmentValue: '',
          startDate: '',
          endDate: '',
          status: 'ACTIVE'
        });
      }
      setErrors({});
      setSubmitError(null);
    }
  }, [isOpen, editingItem]);

  const getHotelRoomTypeLabel = (hrType: HotelRoomTypeItem): string => {
    const matchedHotel = hotels.find(h => h.id === hrType.hotelId);
    const matchedRoomType = globalRoomTypes.find(rt => rt.id === hrType.roomTypeId);
    const hotelName = matchedHotel ? matchedHotel.name : `Hotel ${hrType.hotelId}`;
    const roomTypeName = matchedRoomType ? matchedRoomType.name : `Room Type ${hrType.roomTypeId}`;
    return `${hotelName} - ${roomTypeName} (ID: ${hrType.id})`;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.hotelRoomTypeId) {
      newErrors.hotelRoomTypeId = 'Hotel room type configuration is required';
    }

    if (!formData.ruleType) {
      newErrors.ruleType = 'Surcharge rule type is required';
    }

    if (!formData.adjustmentType) {
      newErrors.adjustmentType = 'Adjustment type is required';
    }

    const value = parseFloat(formData.adjustmentValue);
    if (isNaN(value)) {
      newErrors.adjustmentValue = 'Adjustment value is required';
    } else if (formData.guestType === 'INFANT') {
      if (value < 0) {
        newErrors.adjustmentValue = 'Adjustment value for INFANT guest type must be 0 or greater';
      }
    } else {
      if (value <= 0) {
        newErrors.adjustmentValue = 'Adjustment value must be a positive number greater than 0';
      }
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setSubmitError(null);

    const payload = {
      hotelRoomTypeId: parseInt(formData.hotelRoomTypeId, 10),
      ruleType: formData.ruleType,
      guestType: formData.guestType || null,
      adjustmentType: formData.adjustmentType,
      adjustmentValue: parseFloat(formData.adjustmentValue),
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: formData.status
    };

    console.log('[DEBUG] Submitting Surcharge Rule Payload:', JSON.stringify(payload, null, 2));

    try {
      await onSave(payload);
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { code?: number; message?: string } } };
      const errData = axiosError.response?.data;
      if (errData && errData.code === 8511) {
        setSubmitError('Validation Failed: Overlapping Surcharge Schedule detected.');
        setErrors(prev => ({
          ...prev,
          dateOverlap: 'An active surcharge rule of this type already overlaps with the selected date range for this room configuration.'
        }));
      } else {
        setSubmitError(errData?.message || 'Failed to save surcharge rule configuration.');
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
            {editingItem ? 'Edit Surcharge Rule' : 'Create Surcharge Rule'}
          </h3>
          <button 
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-red-655"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Overlap Error Warning Alert Box */}
          {errors.dateOverlap && (
            <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded flex items-start space-x-3 shadow-sm animate-shake mb-4">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-xs font-semibold text-red-750">
                <h5 className="text-sm font-extrabold text-red-800 uppercase tracking-wide">Surcharge Overlap Error</h5>
                <p className="mt-1 leading-relaxed">{errors.dateOverlap}</p>
              </div>
            </div>
          )}

          {/* Standard Submission Error */}
          {submitError && !errors.dateOverlap && (
            <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded flex items-start space-x-3 shadow-sm animate-fade-in mb-4">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-xs font-semibold text-red-700">
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

          {/* Surcharge Rule Type Selection */}
          <div>
            <label htmlFor="ruleType" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
              Surcharge Rule Type *
            </label>
            <select
              id="ruleType"
              value={formData.ruleType}
              onChange={(e) => setFormData({ ...formData, ruleType: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-650"
            >
              <option value="EXTRA_PERSON">EXTRA_PERSON</option>
              <option value="EXTRA_BED">EXTRA_BED</option>
              <option value="EARLY_CHECKIN">EARLY_CHECKIN</option>
              <option value="LATE_CHECKOUT">LATE_CHECKOUT</option>
            </select>
          </div>

          {/* Guest Type Selection */}
          <div>
            <label htmlFor="guestType" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
              Guest Type (Optional)
            </label>
            <select
              id="guestType"
              value={formData.guestType}
              onChange={(e) => setFormData({ ...formData, guestType: e.target.value as 'ADULT' | 'CHILD' | 'INFANT' | '' })}
              className="w-full px-3 py-2 border border-neutral-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="">All / None</option>
              <option value="ADULT">ADULT</option>
              <option value="CHILD">CHILD</option>
              <option value="INFANT">INFANT</option>
            </select>
          </div>

          {/* Adjustment Type & Value Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="adjustmentType" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                Adjustment Type *
              </label>
              <select
                id="adjustmentType"
                value={formData.adjustmentType}
                onChange={(e) => setFormData({ ...formData, adjustmentType: e.target.value as 'PERCENT' | 'FIXED' })}
                className="w-full px-3 py-2 border border-neutral-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-650"
              >
                <option value="PERCENT">PERCENT (%)</option>
                <option value="FIXED">FIXED (VND)</option>
              </select>
            </div>

            <div>
              <label htmlFor="adjustmentValue" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                Adjustment Value *
              </label>
              <input
                type="number"
                id="adjustmentValue"
                step="0.01"
                min="0"
                value={formData.adjustmentValue}
                onChange={(e) => setFormData({ ...formData, adjustmentValue: e.target.value })}
                className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600 font-mono font-bold
                  ${errors.adjustmentValue ? 'border-red-600' : 'border-neutral-300'}
                `}
                placeholder={formData.adjustmentType === 'PERCENT' ? 'e.g. 10.00' : 'e.g. 150000'}
              />
              {errors.adjustmentValue && <p className="text-red-600 text-xs mt-1 font-semibold">{errors.adjustmentValue}</p>}
            </div>
          </div>

          {/* Validity Period Grid */}
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

          {/* Status Selection */}
          <div>
            <label htmlFor="status" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
              Status *
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
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

export default SurchargeRuleModal;
