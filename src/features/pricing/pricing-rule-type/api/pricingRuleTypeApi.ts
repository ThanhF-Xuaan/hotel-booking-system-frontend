import api from '../../../../services/api';
import { 
  RuleTypeResponse, 
  RuleTypeCreateRequest, 
  RuleTypeUpdateRequest 
} from '../../../../types/pricing';

export const pricingRuleTypeApi = {
  getAll: (): Promise<RuleTypeResponse[]> => {
    return api.get('/hotel/api/v1/pricing/pricing-rule-types');
  },

  getById: (code: string): Promise<RuleTypeResponse> => {
    return api.get(`/hotel/api/v1/pricing/pricing-rule-types/${code}`);
  },

  create: (data: RuleTypeCreateRequest): Promise<RuleTypeResponse> => {
    return api.post('/hotel/api/v1/pricing/pricing-rule-types', data);
  },

  update: (code: string, data: RuleTypeUpdateRequest): Promise<RuleTypeResponse> => {
    return api.put(`/hotel/api/v1/pricing/pricing-rule-types/${code}`, data);
  },

  delete: (code: string): Promise<void> => {
    return api.delete(`/hotel/api/v1/pricing/pricing-rule-types/${code}`);
  }
};
