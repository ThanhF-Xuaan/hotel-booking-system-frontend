import api from '../../../../services/api';
import { 
  HotelAgePolicyResponse, 
  HotelAgePolicyCreateRequest, 
  HotelAgePolicyUpdateRequest 
} from '../../../../types/pricing';

export const agePolicyApi = {
  getAll: (hotelId?: number): Promise<HotelAgePolicyResponse[]> => {
    const params: Record<string, number> = {};
    if (hotelId !== undefined) {
      params.hotelId = hotelId;
    }
    return api.get('/hotel/api/v1/pricing/age-policies', { params });
  },

  getById: (id: number): Promise<HotelAgePolicyResponse> => {
    return api.get(`/hotel/api/v1/pricing/age-policies/${id}`);
  },

  create: (data: HotelAgePolicyCreateRequest): Promise<HotelAgePolicyResponse> => {
    return api.post('/hotel/api/v1/pricing/age-policies', data);
  },

  update: (id: number, data: HotelAgePolicyUpdateRequest): Promise<HotelAgePolicyResponse> => {
    return api.put(`/hotel/api/v1/pricing/age-policies/${id}`, data);
  },

  delete: (id: number): Promise<void> => {
    return api.delete(`/hotel/api/v1/pricing/age-policies/${id}`);
  }
};
