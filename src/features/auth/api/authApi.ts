import api from '../../../services/api';
import { LoginPayload, LoginResponse } from '../../../types/auth';

export const authApi = {
  login: (payload: LoginPayload): Promise<LoginResponse> => {
    return api.post('/hotel/api/v1/iam/auth/token', payload);
  }
};
