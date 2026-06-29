import api from '../../../../services/api';
import { 
  SurchargeRuleResponse, 
  SurchargeRuleCreateRequest, 
  SurchargeRuleUpdateRequest 
} from '../../../../types/pricing';

export const surchargeRuleApi = {
  getAll: (hotelRoomTypeId?: number): Promise<SurchargeRuleResponse[]> => {
    const params: Record<string, number> = {};
    if (hotelRoomTypeId) {
      params.hotelRoomTypeId = hotelRoomTypeId;
    }
    return api.get('/hotel/api/v1/pricing/surcharge-rules', { params });
  },

  getById: (id: number): Promise<SurchargeRuleResponse> => {
    return api.get(`/hotel/api/v1/pricing/surcharge-rules/${id}`);
  },

  create: (data: SurchargeRuleCreateRequest): Promise<SurchargeRuleResponse> => {
    return api.post('/hotel/api/v1/pricing/surcharge-rules', data);
  },

  update: (id: number, data: SurchargeRuleUpdateRequest): Promise<SurchargeRuleResponse> => {
    return api.put(`/hotel/api/v1/pricing/surcharge-rules/${id}`, data);
  },

  delete: (id: number): Promise<void> => {
    return api.delete(`/hotel/api/v1/pricing/surcharge-rules/${id}`);
  }
};
