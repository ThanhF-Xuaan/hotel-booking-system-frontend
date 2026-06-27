import api from '../../../../services/api';

export const pricingRuleTypeApi = {
  getAll: () => {
    return api.get('/hotel/api/v1/pricing/pricing-rule-types');
  },

  getById: (code) => {
    return api.get(`/hotel/api/v1/pricing/pricing-rule-types/${code}`);
  },

  create: (data) => {
    return api.post('/hotel/api/v1/pricing/pricing-rule-types', data);
  },

  update: (code, data) => {
    return api.put(`/hotel/api/v1/pricing/pricing-rule-types/${code}`, data);
  },

  delete: (code) => {
    return api.delete(`/hotel/api/v1/pricing/pricing-rule-types/${code}`);
  }
};
