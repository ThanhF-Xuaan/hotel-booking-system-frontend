import api from '../../../../services/api';

export const staffApi = {
  getAll: () => api.get('/hotel/api/v1/iam/staffs'),
  getById: (id) => api.get(`/hotel/api/v1/iam/staffs/${id}`),
  create: (data) => api.post('/hotel/api/v1/iam/staffs', data),
  update: (id, data) => api.put(`/hotel/api/v1/iam/staffs/${id}`, data),
  delete: (id) => api.delete(`/hotel/api/v1/iam/staffs/${id}`),
};
