import api from '../api/axios';

// Register user
const register = async (username, email, password, isAdmin) => {
  const response = await api.post('/auth/register', { username, email, password, isAdmin });
  return response.data;
};

// Login user
const login = async (userData) => {
  const response = await api.post('/auth/login', userData);
  return response.data;
};

const authService = {
  register,
  login,
};

export default authService;
