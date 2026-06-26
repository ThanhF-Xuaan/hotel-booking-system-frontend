import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import api from '../../../../services/api';
import { hotelRoomTypeApi } from '../api/hotelRoomTypeApi';

const HotelRoomTypeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const hotelRoomTypeId = parseInt(id, 10);

  const [activeTab, setActiveTab] = useState('general'); // general, beds, features, catalog
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  
  // Tab-specific submission errors and success states
  const [generalError, setGeneralError] = useState(null);
  const [generalSuccess, setGeneralSuccess] = useState(null);
  const [bedsError, setBedsError] = useState(null);
  const [bedsSuccess, setBedsSuccess] = useState(null);
  const [featuresError, setFeaturesError] = useState(null);
  const [featuresSuccess, setFeaturesSuccess] = useState(null);
  const [catalogError, setCatalogError] = useState(null);
  const [catalogSuccess, setCatalogSuccess] = useState(null);

  // Core HotelRoomType Detail config
  const [hotelRoomType, setHotelRoomType] = useState(null);
  const [globalRoomTypes, setGlobalRoomTypes] = useState([]);
  const [hotels, setHotels] = useState([]);

  // Tab 1: General Info Form State
  const [generalForm, setGeneralForm] = useState({
    standardAdults: '2',
    standardChildren: '0',
    maxAdults: '2',
    maxChildren: '1',
    maxInfants: '1',
    maxTotalGuests: '3',
    maxExtraBeds: '1',
    maxBeds: '1',
    basePrice: '',
    totalQuantity: '10',
    status: 'ACTIVE'
  });
  const [generalValidationErrors, setGeneralValidationErrors] = useState({});

  // Tab 2: Beds State
  const [assignedBeds, setAssignedBeds] = useState([]);
  const [availableBeds, setAvailableBeds] = useState([]);
  const [isAddBedModalOpen, setIsAddBedModalOpen] = useState(false);
  const [newBedForm, setNewBedForm] = useState({ roomBedId: '', quantity: '1' });

  // Tab 3: Features State
  const [assignedFeatures, setAssignedFeatures] = useState([]);
  const [availableFeatures, setAvailableFeatures] = useState([]);

  // Tab 4: Catalog Items (Amenities) State
  const [assignedCatalogItems, setAssignedCatalogItems] = useState([]);
  const [hotelCatalogItems, setHotelCatalogItems] = useState([]);

  // Fetch baseline directories and the active room type details
  const fetchPageDetails = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [hotelsData, rTypesData, roomTypeConfig] = await Promise.all([
        api.get('/hotel/api/v1/inventory/hotels'),
        api.get('/hotel/api/v1/inventory/room-types'),
        hotelRoomTypeApi.getById(hotelRoomTypeId)
      ]);

      setHotels(Array.isArray(hotelsData) ? hotelsData : []);
      setGlobalRoomTypes(Array.isArray(rTypesData) ? rTypesData : []);
      setHotelRoomType(roomTypeConfig);

      // Prepopulate general info tab
      setGeneralForm({
        standardAdults: roomTypeConfig.standardAdults.toString(),
        standardChildren: roomTypeConfig.standardChildren.toString(),
        maxAdults: roomTypeConfig.maxAdults.toString(),
        maxChildren: roomTypeConfig.maxChildren.toString(),
        maxInfants: roomTypeConfig.maxInfants.toString(),
        maxTotalGuests: roomTypeConfig.maxTotalGuests.toString(),
        maxExtraBeds: roomTypeConfig.maxExtraBeds.toString(),
        maxBeds: roomTypeConfig.maxBeds !== null && roomTypeConfig.maxBeds !== undefined ? roomTypeConfig.maxBeds.toString() : '1',
        basePrice: roomTypeConfig.basePrice.toString(),
        totalQuantity: roomTypeConfig.totalQuantity.toString(),
        status: roomTypeConfig.status
      });

      // Load Tab-specific configurations
      await loadTabConfigurations(roomTypeConfig.hotelId, roomTypeConfig.id);
    } catch (err) {
      console.error(err);
      setFetchError(err.response?.data?.message || 'Failed to retrieve configuration details from the server.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTabConfigurations = async (hotelId, configId) => {
    try {
      const [
        bedsList,
        featuresList,
        catalogList,
        assignedBedsList,
        assignedFeaturesList,
        assignedCatalogItemsList
      ] = await Promise.all([
        api.get('/hotel/api/v1/inventory/room-beds'),
        api.get('/hotel/api/v1/inventory/room-features'),
        api.get('/hotel/api/v1/inventory/catalog-items', { params: { hotelId } }),
        hotelRoomTypeApi.getBeds(configId),
        hotelRoomTypeApi.getFeatures(configId),
        hotelRoomTypeApi.getCatalogItems(configId)
      ]);

      setAvailableBeds(Array.isArray(bedsList) ? bedsList : []);
      setAvailableFeatures(Array.isArray(featuresList) ? featuresList : []);
      setHotelCatalogItems(Array.isArray(catalogList) ? catalogList : []);

      setAssignedBeds(Array.isArray(assignedBedsList) ? assignedBedsList : []);
      setAssignedFeatures(Array.isArray(assignedFeaturesList) ? assignedFeaturesList : []);
      setAssignedCatalogItems(Array.isArray(assignedCatalogItemsList) ? assignedCatalogItemsList : []);
    } catch (err) {
      console.error('Error loading tab settings: ', err);
    }
  };

  useEffect(() => {
    if (hotelRoomTypeId) {
      fetchPageDetails();
    }
  }, [hotelRoomTypeId]);

  // Tab 1: General Info Submit
  const validateGeneralForm = () => {
    const newErrors = {};
    const price = parseFloat(generalForm.basePrice);
    if (isNaN(price) || price < 0) {
      newErrors.basePrice = 'Base price must be a valid non-negative number';
    }

    const qty = parseInt(generalForm.totalQuantity, 10);
    if (isNaN(qty) || qty < 0) {
      newErrors.totalQuantity = 'Total quantity must be a non-negative integer';
    }

    const maxBedsVal = parseInt(generalForm.maxBeds, 10);
    if (isNaN(maxBedsVal) || maxBedsVal < 0) {
      newErrors.maxBeds = 'Maximum physical beds must be at least 0';
    }

    const stdAdults = parseInt(generalForm.standardAdults, 10);
    const maxAdults = parseInt(generalForm.maxAdults, 10);
    const stdKids = parseInt(generalForm.standardChildren, 10);
    const maxKids = parseInt(generalForm.maxChildren, 10);
    const maxGuests = parseInt(generalForm.maxTotalGuests, 10);

    if (stdAdults > maxAdults) {
      newErrors.standardAdults = 'Standard adults capacity cannot exceed maximum adults';
    }
    if (stdKids > maxKids) {
      newErrors.standardChildren = 'Standard children capacity cannot exceed maximum children';
    }
    if (stdAdults + stdKids > maxGuests) {
      newErrors.maxTotalGuests = 'Sum of standard capacity exceeds maximum total guests';
    }
    if (maxAdults > maxGuests) {
      newErrors.maxAdults = 'Maximum adults cannot exceed maximum total guests';
    }
    if (maxKids > maxGuests) {
      newErrors.maxChildren = 'Maximum children cannot exceed maximum total guests';
    }

    setGeneralValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGeneralSubmit = async (e) => {
    e.preventDefault();
    if (!validateGeneralForm()) return;

    setIsLoading(true);
    setGeneralError(null);
    setGeneralSuccess(null);
    try {
      const payload = {
        standardAdults: parseInt(generalForm.standardAdults, 10),
        standardChildren: parseInt(generalForm.standardChildren, 10),
        maxAdults: parseInt(generalForm.maxAdults, 10),
        maxChildren: parseInt(generalForm.maxChildren, 10),
        maxInfants: parseInt(generalForm.maxInfants, 10),
        maxTotalGuests: parseInt(generalForm.maxTotalGuests, 10),
        maxExtraBeds: parseInt(generalForm.maxExtraBeds, 10),
        maxBeds: parseInt(generalForm.maxBeds, 10),
        basePrice: parseFloat(generalForm.basePrice),
        totalQuantity: parseInt(generalForm.totalQuantity, 10),
        status: generalForm.status
      };

      const result = await hotelRoomTypeApi.update(hotelRoomTypeId, payload);
      setHotelRoomType(result);
      setGeneralSuccess('General configurations updated successfully.');
    } catch (err) {
      console.error(err);
      const code = err.response?.data?.code;
      if (code === 5238) {
        setGeneralError('Maximum physical beds capacity is required and cannot be empty.');
      } else if (code === 5239) {
        setGeneralError('Maximum physical beds must be at least 0.');
      } else if (code === 5242) {
        setGeneralError('Maximum extra beds capacity cannot exceed maximum physical beds capacity.');
      } else {
        setGeneralError(err.response?.data?.message || 'Failed to update general configurations.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Tab 2: Bed Configuration Sync
  const handleOpenAddBed = () => {
    // Filter out beds already assigned
    const filteredBeds = availableBeds.filter(b => !assignedBeds.some(ab => ab.roomBedId === b.id));
    setNewBedForm({
      roomBedId: filteredBeds.length > 0 ? filteredBeds[0].id.toString() : '',
      quantity: '1'
    });
    setIsAddBedModalOpen(true);
  };

  const handleAddBedSubmit = (e) => {
    e.preventDefault();
    const bedId = parseInt(newBedForm.roomBedId, 10);
    const qty = parseInt(newBedForm.quantity, 10);

    if (isNaN(bedId) || isNaN(qty) || qty < 1) return;

    const selectedBed = availableBeds.find(b => b.id === bedId);
    if (!selectedBed) return;

    setAssignedBeds([
      ...assignedBeds,
      {
        roomBedId: bedId,
        bedName: selectedBed.name,
        quantity: qty
      }
    ]);
    setIsAddBedModalOpen(false);
  };

  const handleRemoveBed = (bedId) => {
    setAssignedBeds(assignedBeds.filter(b => b.roomBedId !== bedId));
  };

  const handleBedQuantityChange = (bedId, newQtyStr) => {
    const qty = parseInt(newQtyStr, 10);
    if (isNaN(qty) || qty < 1) return;
    setAssignedBeds(assignedBeds.map(b => b.roomBedId === bedId ? { ...b, quantity: qty } : b));
  };

  const handleBedsSync = async () => {
    if (assignedBeds.length === 0) {
      setBedsError('You must assign at least one bed to this room type template.');
      return;
    }

    setIsLoading(true);
    setBedsError(null);
    setBedsSuccess(null);
    try {
      const payload = {
        beds: assignedBeds.map(b => ({
          roomBedId: b.roomBedId,
          quantity: b.quantity
        }))
      };

      const result = await hotelRoomTypeApi.syncBeds(hotelRoomTypeId, payload);
      setAssignedBeds(result);
      setBedsSuccess('Beds configuration synchronized successfully.');
    } catch (err) {
      console.error(err);
      setBedsError(err.response?.data?.message || 'Failed to sync beds configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  // Tab 3: Features Sync
  const handleFeatureToggle = (featureId) => {
    const isAssigned = assignedFeatures.some(f => f.roomFeatureId === featureId);
    if (isAssigned) {
      setAssignedFeatures(assignedFeatures.filter(f => f.roomFeatureId !== featureId));
    } else {
      const selectedFeature = availableFeatures.find(f => f.id === featureId);
      if (selectedFeature) {
        setAssignedFeatures([
          ...assignedFeatures,
          {
            roomFeatureId: featureId,
            featureName: selectedFeature.name
          }
        ]);
      }
    }
  };

  const handleFeaturesSync = async () => {
    setIsLoading(true);
    setFeaturesError(null);
    setFeaturesSuccess(null);
    try {
      const payload = {
        roomFeatureIds: assignedFeatures.map(f => f.roomFeatureId)
      };

      const result = await hotelRoomTypeApi.syncFeatures(hotelRoomTypeId, payload);
      setAssignedFeatures(result);
      setFeaturesSuccess('Room features synchronized successfully.');
    } catch (err) {
      console.error(err);
      setFeaturesError(err.response?.data?.message || 'Failed to sync room features.');
    } finally {
      setIsLoading(false);
    }
  };

  // Tab 4: Catalog Items (Amenities) Sync
  const handleCatalogItemToggle = (itemId) => {
    const isAssigned = assignedCatalogItems.some(ci => ci.catalogItemId === itemId);
    if (isAssigned) {
      setAssignedCatalogItems(assignedCatalogItems.filter(ci => ci.catalogItemId !== itemId));
    } else {
      const dbItem = hotelCatalogItems.find(ci => ci.id === itemId);
      if (dbItem) {
        setAssignedCatalogItems([
          ...assignedCatalogItems,
          {
            catalogItemId: itemId,
            itemName: dbItem.name,
            itemUsage: 'OPTIONAL',
            price: dbItem.basePrice
          }
        ]);
      }
    }
  };

  const handleCatalogItemUsageToggle = (itemId) => {
    setAssignedCatalogItems(assignedCatalogItems.map(ci => 
      ci.catalogItemId === itemId 
        ? { ...ci, itemUsage: ci.itemUsage === 'MANDATORY' ? 'OPTIONAL' : 'MANDATORY' } 
        : ci
    ));
  };

  const handleCatalogItemPriceChange = (itemId, newPriceStr) => {
    const price = parseFloat(newPriceStr);
    if (isNaN(price) || price < 0) return;
    setAssignedCatalogItems(assignedCatalogItems.map(ci => 
      ci.catalogItemId === itemId ? { ...ci, price } : ci
    ));
  };

  const handleCatalogItemsSync = async () => {
    setIsLoading(true);
    setCatalogError(null);
    setCatalogSuccess(null);
    try {
      const payload = {
        items: assignedCatalogItems.map(ci => ({
          catalogItemId: ci.catalogItemId,
          itemUsage: ci.itemUsage,
          price: ci.price
        }))
      };

      const result = await hotelRoomTypeApi.syncCatalogItems(hotelRoomTypeId, payload);
      setAssignedCatalogItems(result);
      setCatalogSuccess('Catalog items (amenities) synchronized successfully.');
    } catch (err) {
      console.error(err);
      setCatalogError(err.response?.data?.message || 'Failed to sync catalog items.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resolver helper
  const getRoomTypeName = () => {
    if (!hotelRoomType) return 'Loading...';
    const matched = globalRoomTypes.find(rt => rt.id === hotelRoomType.roomTypeId);
    return matched ? matched.name : `Room Type ID: ${hotelRoomType.roomTypeId}`;
  };

  const getHotelName = () => {
    if (!hotelRoomType) return '';
    const matched = hotels.find(h => h.id === hotelRoomType.hotelId);
    return matched ? matched.name : `Hotel ID: ${hotelRoomType.hotelId}`;
  };

  const getFilteredAvailableBeds = () => {
    return availableBeds.filter(b => !assignedBeds.some(ab => ab.roomBedId === b.id));
  };

  return (
    <div className="relative space-y-6 min-h-[450px]">
      {/* LOADING OVERLAY */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-[2px] flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            <span className="text-xs font-bold text-neutral-900 tracking-wider uppercase">Loading settings...</span>
          </div>
        </div>
      )}

      {/* FETCH ERROR BANNER */}
      {fetchError && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-650 flex-shrink-0" />
            <span className="text-sm font-semibold text-red-750">{fetchError}</span>
          </div>
          <button 
            onClick={() => setFetchError(null)}
            className="text-red-600 hover:text-red-800 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-5">
        <div className="flex items-start space-x-4">
          <button
            onClick={() => navigate('/admin/hotel-room-types')}
            className="p-2 rounded-md border border-neutral-300 text-neutral-600 hover:text-black hover:bg-neutral-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 mt-1"
            title="Return to configuration list"
            aria-label="Back to configuration list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-extrabold text-black tracking-tight">{getRoomTypeName()}</h2>
            <p className="text-sm text-neutral-500 font-medium mt-0.5">{getHotelName()}</p>
          </div>
        </div>
      </div>

      {/* MASTER-DETAIL TABS BAR */}
      <div className="flex border-b border-neutral-200 overflow-x-auto space-x-8">
        {[
          { id: 'general', name: '1. General Info' },
          { id: 'beds', name: '2. Bed Configuration' },
          { id: 'features', name: '3. Features' },
          { id: 'catalog', name: '4. Catalog Items (Amenities)' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-4 text-sm font-bold border-b-2 whitespace-nowrap transition-all focus:outline-none
              ${activeTab === tab.id
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-neutral-500 hover:text-black'
              }
            `}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* TAB CONTENT LAYOUTS */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
        
        {/* TAB 1: GENERAL INFO */}
        {activeTab === 'general' && (
          <form onSubmit={handleGeneralSubmit} className="space-y-6">
            {generalError && (
              <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-650 flex-shrink-0" />
                <span className="text-xs font-bold text-red-750">{generalError}</span>
              </div>
            )}
            {generalSuccess && (
              <div className="bg-neutral-900 border-l-4 border-black p-4 rounded flex items-center space-x-3 text-white">
                <CheckCircle2 className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span className="text-xs font-bold tracking-wide uppercase">{generalSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="basePrice" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">Base Price (VND) *</label>
                <input
                  type="number"
                  id="basePrice"
                  value={generalForm.basePrice}
                  onChange={(e) => setGeneralForm({ ...generalForm, basePrice: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600 font-mono font-bold"
                />
                {generalValidationErrors.basePrice && <p className="text-red-600 text-xs mt-1 font-semibold">{generalValidationErrors.basePrice}</p>}
              </div>

              <div>
                <label htmlFor="totalQuantity" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">Total Quantity of Rooms *</label>
                <input
                  type="number"
                  id="totalQuantity"
                  value={generalForm.totalQuantity}
                  onChange={(e) => setGeneralForm({ ...generalForm, totalQuantity: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600 font-mono font-bold"
                />
                {generalValidationErrors.totalQuantity && <p className="text-red-600 text-xs mt-1 font-semibold">{generalValidationErrors.totalQuantity}</p>}
              </div>

              <div>
                <label htmlFor="status" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">Status</label>
                <select
                  id="status"
                  value={generalForm.status}
                  onChange={(e) => setGeneralForm({ ...generalForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600 font-bold"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="col-span-1 sm:col-span-2 md:col-span-3 border-b border-neutral-150 pb-1 mt-4">
                <h4 className="text-sm font-extrabold text-neutral-950 uppercase tracking-tight">Capacity & Limitations</h4>
              </div>

              <div>
                <label htmlFor="standardAdults" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">Standard Adults</label>
                <input
                  type="number"
                  id="standardAdults"
                  value={generalForm.standardAdults}
                  onChange={(e) => setGeneralForm({ ...generalForm, standardAdults: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                />
                {generalValidationErrors.standardAdults && <p className="text-red-600 text-xs mt-1 font-semibold">{generalValidationErrors.standardAdults}</p>}
              </div>

              <div>
                <label htmlFor="maxAdults" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">Max Adults</label>
                <input
                  type="number"
                  id="maxAdults"
                  value={generalForm.maxAdults}
                  onChange={(e) => setGeneralForm({ ...generalForm, maxAdults: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                />
                {generalValidationErrors.maxAdults && <p className="text-red-600 text-xs mt-1 font-semibold">{generalValidationErrors.maxAdults}</p>}
              </div>

              <div>
                <label htmlFor="standardChildren" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">Standard Children</label>
                <input
                  type="number"
                  id="standardChildren"
                  value={generalForm.standardChildren}
                  onChange={(e) => setGeneralForm({ ...generalForm, standardChildren: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                />
                {generalValidationErrors.standardChildren && <p className="text-red-600 text-xs mt-1 font-semibold">{generalValidationErrors.standardChildren}</p>}
              </div>

              <div>
                <label htmlFor="maxChildren" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">Max Children</label>
                <input
                  type="number"
                  id="maxChildren"
                  value={generalForm.maxChildren}
                  onChange={(e) => setGeneralForm({ ...generalForm, maxChildren: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                />
                {generalValidationErrors.maxChildren && <p className="text-red-600 text-xs mt-1 font-semibold">{generalValidationErrors.maxChildren}</p>}
              </div>

              <div>
                <label htmlFor="maxInfants" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">Max Infants</label>
                <input
                  type="number"
                  id="maxInfants"
                  value={generalForm.maxInfants}
                  onChange={(e) => setGeneralForm({ ...generalForm, maxInfants: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label htmlFor="maxTotalGuests" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">Max Total Guests</label>
                <input
                  type="number"
                  id="maxTotalGuests"
                  value={generalForm.maxTotalGuests}
                  onChange={(e) => setGeneralForm({ ...generalForm, maxTotalGuests: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                />
                {generalValidationErrors.maxTotalGuests && <p className="text-red-600 text-xs mt-1 font-semibold">{generalValidationErrors.maxTotalGuests}</p>}
              </div>

              <div>
                <label htmlFor="maxBeds" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">
                  Max Physical Beds <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  id="maxBeds"
                  value={generalForm.maxBeds}
                  onChange={(e) => setGeneralForm({ ...generalForm, maxBeds: e.target.value })}
                  className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600
                    ${generalValidationErrors.maxBeds ? 'border-red-600' : 'border-neutral-300'}
                  `}
                />
                {generalValidationErrors.maxBeds && <p className="text-red-600 text-xs mt-1 font-semibold">{generalValidationErrors.maxBeds}</p>}
              </div>

              <div>
                <label htmlFor="maxExtraBeds" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">Max Extra Beds</label>
                <input
                  type="number"
                  id="maxExtraBeds"
                  value={generalForm.maxExtraBeds}
                  onChange={(e) => setGeneralForm({ ...generalForm, maxExtraBeds: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
            </div>

            {/* Warning block if extra beds exceed physical beds capacity */}
            {parseInt(generalForm.maxExtraBeds, 10) > parseInt(generalForm.maxBeds, 10) && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-xs font-semibold flex items-center space-x-2 mt-4">
                <AlertCircle className="w-4.5 h-4.5 text-red-600 flex-shrink-0" />
                <span>Warning: Maximum extra beds cannot exceed maximum physical beds capacity. Save action is blocked.</span>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-neutral-100 mt-4">
              <button
                type="submit"
                disabled={parseInt(generalForm.maxExtraBeds, 10) > parseInt(generalForm.maxBeds, 10)}
                className={`flex items-center space-x-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded shadow transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2
                  ${parseInt(generalForm.maxExtraBeds, 10) > parseInt(generalForm.maxBeds, 10) ? 'opacity-50 cursor-not-allowed bg-neutral-400 hover:bg-neutral-400' : ''}
                `}
              >
                <Save className="w-5 h-5" />
                <span>Save General Info</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: BED CONFIGURATION */}
        {activeTab === 'beds' && (
          <div className="space-y-6">
            {bedsError && (
              <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-650 flex-shrink-0" />
                <span className="text-xs font-bold text-red-750">{bedsError}</span>
              </div>
            )}
            {bedsSuccess && (
              <div className="bg-neutral-900 border-l-4 border-black p-4 rounded flex items-center space-x-3 text-white">
                <CheckCircle2 className="w-5 h-5 text-red-650 flex-shrink-0" />
                <span className="text-xs font-bold tracking-wide uppercase">{bedsSuccess}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-extrabold text-black uppercase tracking-tight">Assigned Beds</h4>
                <p className="text-xs text-neutral-500">Configure bed types and quantities configured for this room template.</p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddBed}
                disabled={getFilteredAvailableBeds().length === 0}
                className={`flex items-center space-x-2 px-4 py-2 bg-neutral-900 text-white font-bold rounded text-xs hover:bg-black transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-900
                  ${getFilteredAvailableBeds().length === 0 ? 'opacity-55 cursor-not-allowed bg-neutral-400 hover:bg-neutral-400' : ''}
                `}
              >
                <Plus className="w-4 h-4" />
                <span>Add Bed Type</span>
              </button>
            </div>

            <div className="border border-neutral-200 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-900 text-white uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-3 px-6">Bed Type Name</th>
                    <th className="py-3 px-6 w-32">Quantity</th>
                    <th className="py-3 px-6 text-right w-24">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-sm">
                  {assignedBeds.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="py-8 text-center text-neutral-500 bg-neutral-50 font-medium">
                        No bed configuration specified. Click "Add Bed Type" to config one.
                      </td>
                    </tr>
                  ) : (
                    assignedBeds.map(bed => (
                      <tr key={bed.roomBedId} className="hover:bg-neutral-50 transition-colors">
                        <td className="py-3 px-6 font-bold text-neutral-950">{bed.bedName}</td>
                        <td className="py-3 px-6">
                          <input
                            type="number"
                            min="1"
                            value={bed.quantity}
                            onChange={(e) => handleBedQuantityChange(bed.roomBedId, e.target.value)}
                            className="w-20 px-2.5 py-1 border border-neutral-300 rounded text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-red-600 font-mono"
                          />
                        </td>
                        <td className="py-3 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveBed(bed.roomBedId)}
                            className="p-1 text-neutral-500 hover:text-red-650 hover:bg-red-50 rounded focus:outline-none focus:ring-2 focus:ring-red-600"
                            aria-label={`Remove bed ${bed.bedName}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-4 border-t border-neutral-100">
              <button
                type="button"
                onClick={handleBedsSync}
                className="flex items-center space-x-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded shadow transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
              >
                <Save className="w-5 h-5" />
                <span>Save Bed Configuration</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: FEATURES */}
        {activeTab === 'features' && (
          <div className="space-y-6">
            {featuresError && (
              <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-650 flex-shrink-0" />
                <span className="text-xs font-bold text-red-750">{featuresError}</span>
              </div>
            )}
            {featuresSuccess && (
              <div className="bg-neutral-900 border-l-4 border-black p-4 rounded flex items-center space-x-3 text-white">
                <CheckCircle2 className="w-5 h-5 text-red-650 flex-shrink-0" />
                <span className="text-xs font-bold tracking-wide uppercase">{featuresSuccess}</span>
              </div>
            )}

            <div>
              <h4 className="text-base font-extrabold text-black uppercase tracking-tight">Room Features & Comfort</h4>
              <p className="text-xs text-neutral-500 mt-0.5">Select amenities, views, and accessibility facilities included in this room type.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 border border-neutral-200 rounded-lg bg-neutral-50">
              {availableFeatures.length === 0 ? (
                <p className="col-span-full py-4 text-center text-neutral-500 font-medium">No room features registered in the system.</p>
              ) : (
                availableFeatures.map(feat => {
                  const isChecked = assignedFeatures.some(f => f.roomFeatureId === feat.id);
                  return (
                    <label 
                      key={feat.id} 
                      className={`flex items-center space-x-3 p-3 rounded-md border bg-white cursor-pointer select-none transition-all hover:shadow-sm
                        ${isChecked 
                          ? 'border-red-600 bg-red-50/20 text-red-700 font-bold' 
                          : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleFeatureToggle(feat.id)}
                        className="w-4 h-4 text-red-650 focus:ring-red-600 border-neutral-300 rounded focus:outline-none"
                      />
                      <span className="text-sm">{feat.name}</span>
                    </label>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-neutral-100">
              <button
                type="button"
                onClick={handleFeaturesSync}
                className="flex items-center space-x-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded shadow transition-colors focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <Save className="w-5 h-5" />
                <span>Save Features</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: CATALOG ITEMS (AMENITIES) */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            {catalogError && (
              <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-650 flex-shrink-0" />
                <span className="text-xs font-bold text-red-750">{catalogError}</span>
              </div>
            )}
            {catalogSuccess && (
              <div className="bg-neutral-900 border-l-4 border-black p-4 rounded flex items-center space-x-3 text-white">
                <CheckCircle2 className="w-5 h-5 text-red-650 flex-shrink-0" />
                <span className="text-xs font-bold tracking-wide uppercase">{catalogSuccess}</span>
              </div>
            )}

            <div>
              <h4 className="text-base font-extrabold text-black uppercase tracking-tight">Hotel Catalog Items Mapping</h4>
              <p className="text-xs text-neutral-500 mt-0.5">Attach hotel services, beverages, or amenities, specifying mandatory inclusions or optional add-ons.</p>
            </div>

            <div className="border border-neutral-200 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-900 text-white uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-3 px-6 w-16 text-center">Enable</th>
                    <th className="py-3 px-6">Item Name</th>
                    <th className="py-3 px-6 w-44">Item Usage</th>
                    <th className="py-3 px-6 w-44">Price Override (VND)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-sm">
                  {hotelCatalogItems.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-neutral-500 bg-neutral-50 font-medium">
                        No catalog items registered for this hotel location.
                      </td>
                    </tr>
                  ) : (
                    hotelCatalogItems.map(item => {
                      const matchedAssign = assignedCatalogItems.find(ci => ci.catalogItemId === item.id);
                      const isAssigned = !!matchedAssign;
                      return (
                        <tr key={item.id} className={`transition-colors ${isAssigned ? 'bg-neutral-50/50' : 'hover:bg-neutral-50'}`}>
                          <td className="py-3 px-6 text-center">
                            <input
                              type="checkbox"
                              checked={isAssigned}
                              onChange={() => handleCatalogItemToggle(item.id)}
                              className="w-4.5 h-4.5 text-red-650 border-neutral-300 rounded focus:ring-red-650 focus:outline-none"
                              aria-label={`Enable ${item.name}`}
                            />
                          </td>
                          <td className="py-3 px-6">
                            <div>
                              <p className="font-bold text-neutral-950">{item.name}</p>
                              <p className="text-[11px] text-neutral-450 font-mono uppercase tracking-wider">{item.itemType} (Catalog price: {parseFloat(item.basePrice).toLocaleString()} VND)</p>
                            </div>
                          </td>
                          <td className="py-3 px-6">
                            <button
                              type="button"
                              disabled={!isAssigned}
                              onClick={() => handleCatalogItemUsageToggle(item.id)}
                              className={`px-3 py-1 rounded text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-red-600
                                ${!isAssigned 
                                  ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed opacity-50' 
                                  : matchedAssign.itemUsage === 'MANDATORY'
                                    ? 'bg-red-600 text-white shadow-sm border border-red-700'
                                    : 'bg-neutral-200 text-neutral-800 border border-neutral-300 hover:bg-neutral-300'
                                }
                              `}
                            >
                              {isAssigned ? matchedAssign.itemUsage : 'DISABLED'}
                            </button>
                          </td>
                          <td className="py-3 px-6">
                            <input
                              type="number"
                              disabled={!isAssigned}
                              min="0"
                              value={isAssigned ? matchedAssign.price : ''}
                              onChange={(e) => handleCatalogItemPriceChange(item.id, e.target.value)}
                              className="w-36 px-2 py-1 border border-neutral-300 rounded text-sm font-mono font-bold focus:ring-2 focus:ring-red-600 focus:outline-none disabled:bg-neutral-100 disabled:text-neutral-450 disabled:cursor-not-allowed"
                              placeholder="Price"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-4 border-t border-neutral-100">
              <button
                type="button"
                onClick={handleCatalogItemsSync}
                className="flex items-center space-x-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded shadow transition-colors focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <Save className="w-5 h-5" />
                <span>Save Amenities</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SUB-MODAL FOR ADDING BED TYPE */}
      {isAddBedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 transition-opacity"
            onClick={() => setIsAddBedModalOpen(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden border border-neutral-200 z-10 animate-scale-in">
            {/* Modal Header */}
            <div className="bg-neutral-900 text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="text-sm font-bold tracking-tight uppercase">Add Bed Type Mapping</h3>
              <button 
                onClick={() => setIsAddBedModalOpen(false)}
                className="text-neutral-400 hover:text-white transition-colors focus:outline-none"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBedSubmit} className="p-5 space-y-4">
              <div>
                <label htmlFor="modalRoomBedId" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">Select Bed Template *</label>
                <select
                  id="modalRoomBedId"
                  value={newBedForm.roomBedId}
                  onChange={(e) => setNewBedForm({ ...newBedForm, roomBedId: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  required
                >
                  <option value="">Choose Bed Template</option>
                  {getFilteredAvailableBeds().map(b => (
                    <option key={b.id} value={b.id.toString()}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="modalBedQuantity" className="block text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">Quantity *</label>
                <input
                  type="number"
                  id="modalBedQuantity"
                  min="1"
                  value={newBedForm.quantity}
                  onChange={(e) => setNewBedForm({ ...newBedForm, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-600 font-mono font-bold"
                  required
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end space-x-3 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsAddBedModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded focus:outline-none focus:ring-2 focus:ring-neutral-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  Add Bed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotelRoomTypeDetailPage;
