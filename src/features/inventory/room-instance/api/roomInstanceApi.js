import api from '../../../../services/api';

export const roomInstanceApi = {
  getByHotelId: (hotelId) => api.get('/hotel/api/v1/inventory/room-instances', { params: { hotelId } }),
  create: (data) => api.post('/hotel/api/v1/inventory/room-instances', data),
  update: (id, data) => api.put(`/hotel/api/v1/inventory/room-instances/${id}`, data),
  updateStatus: (id, currentStatus) => api.put(`/hotel/api/v1/inventory/room-instances/${id}/status`, { currentStatus }),
  delete: (id) => api.delete(`/hotel/api/v1/inventory/room-instances/${id}`),
};
