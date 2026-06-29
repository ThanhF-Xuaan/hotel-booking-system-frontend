import api from '../../../services/api';

export const authApi = {
  login: (username, password) => {
    return api.post('/hotel/api/v1/iam/auth/token', { username, password });
  }
};
