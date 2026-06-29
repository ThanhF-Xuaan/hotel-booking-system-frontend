import api from '../../../../services/api';

export const hotelRoomTypeApi = {
  // Core CRUD
  getAll: (): Promise<unknown> => api.get('/hotel/api/v1/inventory/hotel-room-types'),
  getByHotelId: (hotelId: number | string): Promise<unknown> => api.get('/hotel/api/v1/inventory/hotel-room-types', { params: { hotelId } }),
  getById: (id: number | string): Promise<unknown> => api.get(`/hotel/api/v1/inventory/hotel-room-types/${id}`),
  create: (data: unknown): Promise<unknown> => api.post('/hotel/api/v1/inventory/hotel-room-types', data),
  update: (id: number | string, data: unknown): Promise<unknown> => api.put(`/hotel/api/v1/inventory/hotel-room-types/${id}`, data),
  delete: (id: number | string): Promise<unknown> => api.delete(`/hotel/api/v1/inventory/hotel-room-types/${id}`),

  // Bed Mappings
  getBeds: (id: number | string): Promise<unknown> => api.get(`/hotel/api/v1/inventory/hotel-room-types/${id}/beds`),
  syncBeds: (id: number | string, data: unknown): Promise<unknown> => api.put(`/hotel/api/v1/inventory/hotel-room-types/${id}/beds`, data),

  // Feature Mappings
  getFeatures: (id: number | string): Promise<unknown> => api.get(`/hotel/api/v1/inventory/hotel-room-types/${id}/features`),
  syncFeatures: (id: number | string, data: unknown): Promise<unknown> => api.put(`/hotel/api/v1/inventory/hotel-room-types/${id}/features`, data),

  // Catalog Item Mappings
  getCatalogItems: (id: number | string): Promise<unknown> => api.get(`/hotel/api/v1/inventory/hotel-room-types/${id}/catalog-items`),
  syncCatalogItems: (id: number | string, data: unknown): Promise<unknown> => api.put(`/hotel/api/v1/inventory/hotel-room-types/${id}/catalog-items`, data),
};
