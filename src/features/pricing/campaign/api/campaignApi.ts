import api from '../../../../services/api';

export const campaignApi = {
  getAll: (hotelId?: number | string): Promise<unknown> => {
    const params: Record<string, unknown> = {};
    if (hotelId) {
      params.hotelId = hotelId;
    }
    return api.get('/hotel/api/v1/pricing/campaigns', { params });
  },

  getById: (id: number | string): Promise<unknown> => {
    return api.get(`/hotel/api/v1/pricing/campaigns/${id}`);
  },

  create: (data: unknown): Promise<unknown> => {
    return api.post('/hotel/api/v1/pricing/campaigns', data);
  },

  update: (id: number | string, data: unknown): Promise<unknown> => {
    return api.put(`/hotel/api/v1/pricing/campaigns/${id}`, data);
  },

  delete: (id: number | string): Promise<unknown> => {
    return api.delete(`/hotel/api/v1/pricing/campaigns/${id}`);
  }
};
