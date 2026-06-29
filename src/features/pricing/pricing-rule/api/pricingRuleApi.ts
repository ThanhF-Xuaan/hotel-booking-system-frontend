import api from '../../../../services/api';
import { 
  PricingRuleResponse, 
  PricingRuleCreateRequest, 
  PricingRuleUpdateRequest 
} from '../../../../types/pricing';

export const pricingRuleApi = {
  getAll: (hotelRoomTypeId?: number): Promise<PricingRuleResponse[]> => {
    const params: Record<string, number> = {};
    if (hotelRoomTypeId) {
      params.hotelRoomTypeId = hotelRoomTypeId;
    }
    return api.get('/hotel/api/v1/pricing/pricing-rules', { params });
  },

  getById: (id: number): Promise<PricingRuleResponse> => {
    return api.get(`/hotel/api/v1/pricing/pricing-rules/${id}`);
  },

  create: (data: PricingRuleCreateRequest): Promise<PricingRuleResponse> => {
    return api.post('/hotel/api/v1/pricing/pricing-rules', data);
  },

  update: (id: number, data: PricingRuleUpdateRequest): Promise<PricingRuleResponse> => {
    return api.put(`/hotel/api/v1/pricing/pricing-rules/${id}`, data);
  },

  delete: (id: number): Promise<void> => {
    return api.delete(`/hotel/api/v1/pricing/pricing-rules/${id}`);
  }
};
