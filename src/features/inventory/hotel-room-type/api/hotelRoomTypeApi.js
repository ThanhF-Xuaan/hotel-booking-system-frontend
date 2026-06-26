import api from '../../../../services/api';

export const hotelRoomTypeApi = {
  // Core CRUD
  getAll: () => api.get('/hotel/api/v1/inventory/hotel-room-types'),
  getByHotelId: (hotelId) => api.get('/hotel/api/v1/inventory/hotel-room-types', { params: { hotelId } }),
  getById: (id) => api.get(`/hotel/api/v1/inventory/hotel-room-types/${id}`),
  create: (data) => api.post('/hotel/api/v1/inventory/hotel-room-types', data),
  update: (id, data) => api.put(`/hotel/api/v1/inventory/hotel-room-types/${id}`, data),
  delete: (id) => api.delete(`/hotel/api/v1/inventory/hotel-room-types/${id}`),

  // Bed Mappings
  getBeds: (id) => api.get(`/hotel/api/v1/inventory/hotel-room-types/${id}/beds`),
  syncBeds: (id, data) => api.put(`/hotel/api/v1/inventory/hotel-room-types/${id}/beds`, data),

  // Feature Mappings
  getFeatures: (id) => api.get(`/hotel/api/v1/inventory/hotel-room-types/${id}/features`),
  syncFeatures: (id, data) => api.put(`/hotel/api/v1/inventory/hotel-room-types/${id}/features`, data),

  // Catalog Item Mappings
  getCatalogItems: (id) => api.get(`/hotel/api/v1/inventory/hotel-room-types/${id}/catalog-items`),
  syncCatalogItems: (id, data) => api.put(`/hotel/api/v1/inventory/hotel-room-types/${id}/catalog-items`, data),
};
