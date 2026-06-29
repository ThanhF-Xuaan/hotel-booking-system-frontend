import api from '../../../../services/api';

export const discountRuleTypeApi = {
  getAll: (): Promise<unknown> => {
    return api.get('/hotel/api/v1/pricing/discount-rule-types');
  },

  getById: (code: string): Promise<unknown> => {
    return api.get(`/hotel/api/v1/pricing/discount-rule-types/${code}`);
  },

  create: (data: unknown): Promise<unknown> => {
    return api.post('/hotel/api/v1/pricing/discount-rule-types', data);
  },

  update: (code: string, data: unknown): Promise<unknown> => {
    return api.put(`/hotel/api/v1/pricing/discount-rule-types/${code}`, data);
  },

  delete: (code: string): Promise<unknown> => {
    return api.delete(`/hotel/api/v1/pricing/discount-rule-types/${code}`);
  }
};
