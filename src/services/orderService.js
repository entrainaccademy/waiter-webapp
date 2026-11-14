import api from './api';

export const orderService = {
  // 1. ORDERS
  async createOrder({ orderType = 'DINE_IN', tableId, customerId, items, discount = 0 }) {
    const payload = {
      orderType,
      items: items.map((item) => ({
        menuItemId: item.menuItemId || item._id,
        quantity: item.quantity,
        ...(item.notes ? { notes: item.notes } : {}),
      })),
      discount: Number(discount) || 0,
      idempotencyKey: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    };

    if (tableId) {
      payload.tableId = tableId;
    }
    if (customerId) {
      payload.customerId = customerId;
    }

    const response = await api.post('/restaurant/orders', payload);
    return response.data.data;
  },

  async getOrders(params = {}) {
    const response = await api.get('/restaurant/orders', { params });
    return {
      orders: response.data.data || [],
      pagination: response.data.pagination || {},
    };
  },

  async getOrderById(id) {
    const response = await api.get(`/restaurant/orders/${id}`);
    return {
      order: response.data.data,
      kots: response.data.kots || [],
    };
  },

  async addItemsToOrder(orderId, items) {
    const payload = {
      items: items.map((item) => ({
        menuItemId: item.menuItemId || item._id,
        quantity: item.quantity,
        ...(item.notes ? { notes: item.notes } : {}),
      })),
    };
    const response = await api.post(`/restaurant/orders/${orderId}/items`, payload);
    return response.data.data;
  },

  async cancelOrder(orderId, reason = 'Cancelled by staff') {
    const response = await api.post(`/restaurant/orders/${orderId}/cancel`, { reason });
    return response.data.data;
  },

  // 2. KOT
  async generateKOT(orderId, priority = 'MEDIUM') {
    const payload = {
      priority,
      idempotencyKey: `kot_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    };
    const response = await api.post(`/restaurant/orders/${orderId}/kot`, payload);
    return response.data.data;
  },

  async getKOTs(params = {}) {
    const response = await api.get('/restaurant/kots', { params });
    return {
      kots: response.data.data || [],
      pagination: response.data.pagination || {},
    };
  },

  async getKitchenOrders() {
    const response = await api.get('/restaurant/kitchen/orders');
    return response.data.data || [];
  },

  async updateKOTStatus(kotId, status) {
    const response = await api.patch(`/restaurant/kots/${kotId}/status`, { status });
    return response.data.data;
  },

  // 3. BILLING & BILL REQUESTS
  async requestBill(orderId) {
    const response = await api.post(`/restaurant/orders/${orderId}/bill-request`);
    return response.data;
  },

  async cancelBillRequest(orderId, reason = 'Cancelled by staff') {
    const response = await api.post(`/restaurant/orders/${orderId}/bill-request/cancel`, { reason });
    return response.data;
  },

  async createInvoice(orderId, options = {}) {
    const payload = {
      orderId,
      idempotencyKey: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...options,
    };
    const response = await api.post('/restaurant/billing/invoices', payload);
    return response.data.data;
  },

  async getInvoiceById(id) {
    const response = await api.get(`/restaurant/billing/invoices/${id}`);
    return response.data.data;
  },

  // 4. METRICS & RESTAURANT INFO
  async getDashboardMetrics() {
    const response = await api.get('/restaurant/dashboard');
    return response.data.data;
  },

  async getRestaurantProfile() {
    const response = await api.get('/restaurant/profile');
    return response.data.data;
  },
};

export default orderService;
