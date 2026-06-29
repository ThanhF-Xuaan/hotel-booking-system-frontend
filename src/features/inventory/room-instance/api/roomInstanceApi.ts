import api from '../../../../services/api';
import { 
  RoomInstanceResponse, 
  RoomInstanceCreateRequest, 
  RoomInstanceUpdateRequest 
} from '../../../../types/inventory';

export const roomInstanceApi = {
  getByHotelId: (hotelId: number | string): Promise<RoomInstanceResponse[]> => 
    api.get('/hotel/api/v1/inventory/room-instances', { params: { hotelId } }),
  create: (data: RoomInstanceCreateRequest): Promise<RoomInstanceResponse> => 
    api.post('/hotel/api/v1/inventory/room-instances', data),
  update: (id: number | string, data: RoomInstanceUpdateRequest): Promise<RoomInstanceResponse> => 
    api.put(`/hotel/api/v1/inventory/room-instances/${id}`, data),
  updateStatus: (id: number | string, currentStatus: 'READY' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE'): Promise<RoomInstanceResponse> => 
    api.put(`/hotel/api/v1/inventory/room-instances/${id}/status`, { currentStatus }),
  delete: (id: number | string): Promise<void> => 
    api.delete(`/hotel/api/v1/inventory/room-instances/${id}`),
};
export default roomInstanceApi;
