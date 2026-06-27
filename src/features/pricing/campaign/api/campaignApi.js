import api from '../../../../services/api';

export const campaignApi = {
  getAll: (hotelId) => {
    const params = {};
    if (hotelId) {
      params.hotelId = hotelId;
    }
    return api.get('/hotel/api/v1/pricing/campaigns', { params });
  },

  getById: (id) => {
    return api.get(`/hotel/api/v1/pricing/campaigns/${id}`);
  },

  create: (data) => {
    return api.post('/hotel/api/v1/pricing/campaigns', data);
  },

  update: (id, data) => {
    return api.put(`/hotel/api/v1/pricing/campaigns/${id}`, data);
  },

  delete: (id) => {
    return api.delete(`/hotel/api/v1/pricing/campaigns/${id}`);
  }
};
