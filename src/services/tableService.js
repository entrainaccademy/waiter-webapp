import api from './api';

export const tableService = {
  async getTables(params = {}) {
    const response = await api.get('/restaurant/tables', { params });
    return response.data.data || [];
  },

  async getTableById(id) {
    const response = await api.get(`/restaurant/tables/${id}`);
    return response.data.data;
  },

  async updateTableStatus(id, status) {
    const response = await api.patch(`/restaurant/tables/${id}`, { status });
    return response.data.data;
  },
};

export default tableService;
