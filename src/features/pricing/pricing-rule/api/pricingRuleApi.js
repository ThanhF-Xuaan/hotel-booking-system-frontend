import api from '../../../../services/api';

export const pricingRuleApi = {
  getAll: (hotelRoomTypeId) => {
    const params = {};
    if (hotelRoomTypeId) {
      params.hotelRoomTypeId = hotelRoomTypeId;
    }
    return api.get('/hotel/api/v1/pricing/pricing-rules', { params });
  },

  getById: (id) => {
    return api.get(`/hotel/api/v1/pricing/pricing-rules/${id}`);
  },

  create: (data) => {
    return api.post('/hotel/api/v1/pricing/pricing-rules', data);
  },

  update: (id, data) => {
    return api.put(`/hotel/api/v1/pricing/pricing-rules/${id}`, data);
  },

  delete: (id) => {
    return api.delete(`/hotel/api/v1/pricing/pricing-rules/${id}`);
  }
};
