import api from '../../../../services/api';

export const catalogItemApi = {
  getByHotelId: (hotelId) => api.get(`/hotel/api/v1/inventory/catalog-items`, { params: { hotelId } }),
  getById: (id) => api.get(`/hotel/api/v1/inventory/catalog-items/${id}`),
  create: (data) => api.post('/hotel/api/v1/inventory/catalog-items', data),
  update: (id, data) => api.put(`/hotel/api/v1/inventory/catalog-items/${id}`, data),
  delete: (id) => api.delete(`/hotel/api/v1/inventory/catalog-items/${id}`),
};
