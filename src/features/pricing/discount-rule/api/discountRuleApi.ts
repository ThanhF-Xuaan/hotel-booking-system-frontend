import api from '../../../../services/api';
import { 
  DiscountRuleResponse, 
  DiscountRuleCreateRequest, 
  DiscountRuleUpdateRequest 
} from '../../../../types/pricing';

export const discountRuleApi = {
  getAll: (hotelRoomTypeId?: number): Promise<DiscountRuleResponse[]> => {
    const params: Record<string, number> = {};
    if (hotelRoomTypeId) {
      params.hotelRoomTypeId = hotelRoomTypeId;
    }
    return api.get('/hotel/api/v1/pricing/discount-rules', { params });
  },

  getById: (id: number): Promise<DiscountRuleResponse> => {
    return api.get(`/hotel/api/v1/pricing/discount-rules/${id}`);
  },

  create: (data: DiscountRuleCreateRequest): Promise<DiscountRuleResponse[]> => {
    return api.post('/hotel/api/v1/pricing/discount-rules', data);
  },

  update: (id: number, data: DiscountRuleUpdateRequest): Promise<DiscountRuleResponse> => {
    return api.put(`/hotel/api/v1/pricing/discount-rules/${id}`, data);
  },

  delete: (id: number): Promise<void> => {
    return api.delete(`/hotel/api/v1/pricing/discount-rules/${id}`);
  }
};
