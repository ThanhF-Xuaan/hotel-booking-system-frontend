import api from '../../../../services/api';
import { 
  StaffResponse, 
  StaffCreateRequest, 
  StaffUpdateRequest 
} from '../../../../types/iam';

export const staffApi = {
  getAll: (): Promise<StaffResponse[]> => api.get('/hotel/api/v1/iam/staffs'),
  getById: (id: number): Promise<StaffResponse> => api.get(`/hotel/api/v1/iam/staffs/${id}`),
  create: (data: StaffCreateRequest): Promise<StaffResponse> => api.post('/hotel/api/v1/iam/staffs', data),
  update: (id: number, data: StaffUpdateRequest): Promise<StaffResponse> => api.put(`/hotel/api/v1/iam/staffs/${id}`, data),
  delete: (id: number): Promise<void> => api.delete(`/hotel/api/v1/iam/staffs/${id}`),
};
