import api from '../../../../services/api';
import { 
  CatalogItemResponse, 
  CatalogItemCreateRequest, 
  CatalogItemUpdateRequest 
} from '../../../../types/inventory';

export const catalogItemApi = {
  getByHotelId: (hotelId: number | string): Promise<CatalogItemResponse[]> => 
    api.get(`/hotel/api/v1/inventory/catalog-items`, { params: { hotelId } }),
  getById: (id: number | string): Promise<CatalogItemResponse> => 
    api.get(`/hotel/api/v1/inventory/catalog-items/${id}`),
  create: (data: CatalogItemCreateRequest): Promise<CatalogItemResponse> => 
    api.post('/hotel/api/v1/inventory/catalog-items', data),
  update: (id: number | string, data: CatalogItemUpdateRequest): Promise<CatalogItemResponse> => 
    api.put(`/hotel/api/v1/inventory/catalog-items/${id}`, data),
  delete: (id: number | string): Promise<void> => 
    api.delete(`/hotel/api/v1/inventory/catalog-items/${id}`),
};
export default catalogItemApi;
