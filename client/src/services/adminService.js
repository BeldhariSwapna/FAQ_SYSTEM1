import api from '../api/axios';

const getStats = async () => {
  const response = await api.get('/admin/stats');
  return response.data;
};

const getUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

const promoteUser = async (id) => {
  const response = await api.patch(`/admin/users/${id}/promote`);
  return response.data;
};

const deleteUser = async (id) => {
  const response = await api.delete(`/admin/users/${id}`);
  return response.data;
};

const adminService = {
  getStats,
  getUsers,
  promoteUser,
  deleteUser
};

export default adminService;