import api from '../../../../services/api';
import { 
  TaxCategoryResponse, 
  TaxCategoryCreateRequest, 
  TaxCategoryUpdateRequest 
} from '../../../../types/pricing';

export const taxCategoryApi = {
  getAll: (): Promise<TaxCategoryResponse[]> => {
    return api.get('/hotel/api/v1/pricing/tax-categories');
  },

  getById: (id: number): Promise<TaxCategoryResponse> => {
    return api.get(`/hotel/api/v1/pricing/tax-categories/${id}`);
  },

  create: (data: TaxCategoryCreateRequest): Promise<TaxCategoryResponse> => {
    return api.post('/hotel/api/v1/pricing/tax-categories', data);
  },

  update: (id: number, data: TaxCategoryUpdateRequest): Promise<TaxCategoryResponse> => {
    return api.put(`/hotel/api/v1/pricing/tax-categories/${id}`, data);
  },

  delete: (id: number): Promise<void> => {
    return api.delete(`/hotel/api/v1/pricing/tax-categories/${id}`);
  }
};
