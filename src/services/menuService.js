import api from './api';

export const menuService = {
  async getCategories() {
    const response = await api.get('/restaurant/menu/categories');
    return response.data.data || [];
  },

  async getMenuItems(params = {}) {
    // Default limit to 100 for staff ordering catalog
    const query = { limit: 100, availability: true, ...params };
    const response = await api.get('/restaurant/menu/items', { params: query });
    return {
      items: response.data.data || [],
      pagination: response.data.pagination || {},
    };
  },

  async getMenuItemById(id) {
    const response = await api.get(`/restaurant/menu/items/${id}`);
    return response.data.data;
  },
};

export default menuService;
