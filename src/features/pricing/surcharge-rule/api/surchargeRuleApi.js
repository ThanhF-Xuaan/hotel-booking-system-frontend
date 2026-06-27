import api from '../../../../services/api';

export const surchargeRuleApi = {
  getAll: (hotelRoomTypeId) => {
    const params = {};
    if (hotelRoomTypeId) {
      params.hotelRoomTypeId = hotelRoomTypeId;
    }
    return api.get('/hotel/api/v1/pricing/surcharge-rules', { params });
  },

  getById: (id) => {
    return api.get(`/hotel/api/v1/pricing/surcharge-rules/${id}`);
  },

  create: (data) => {
    return api.post('/hotel/api/v1/pricing/surcharge-rules', data);
  },

  update: (id, data) => {
    return api.put(`/hotel/api/v1/pricing/surcharge-rules/${id}`, data);
  },

  delete: (id) => {
    return api.delete(`/hotel/api/v1/pricing/surcharge-rules/${id}`);
  }
};
