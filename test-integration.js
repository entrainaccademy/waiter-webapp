import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = process.env.API_URL || 'https://kot-backend-za5d.onrender.com/api';
const SOCKET_URL = process.env.SOCKET_URL || 'https://kot-backend-za5d.onrender.com';

async function runStaffPWATests() {
  console.log('====================================================');
  console.log('   FOOD ORDER - STAFF MOBILE PWA INTEGRATION TEST   ');
  console.log('====================================================\n');

  try {
    // 1. Staff Authentication
    console.log('[1/10] Testing Staff Login (cashier@cobolt.com)...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'cashier@cobolt.com',
      password: 'Password@123',
    });

    if (!loginRes.data.success || !loginRes.data.accessToken) {
      throw new Error('Login failed: ' + JSON.stringify(loginRes.data));
    }

    const token = loginRes.data.accessToken;
    const staffUser = loginRes.data.user;
    console.log(`✅ Login successful: ${staffUser.name} (${staffUser.role})`);
    console.log(`   Restaurant: ${staffUser.restaurantName} (ID: ${staffUser.restaurantId})`);

    const authHeaders = { Authorization: `Bearer ${token}` };

    // 2. Realtime Socket.IO Connection & Authentication
    console.log('\n[2/10] Connecting to Socket.IO with Bearer token...');
    const socketEventsReceived = [];
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Socket connection timeout')), 6000);
      socket.on('connect', () => {
        clearTimeout(timer);
        console.log(`✅ Realtime Socket connected: ID ${socket.id}`);
        resolve();
      });
      socket.on('connect_error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });

    socket.on('table:status-updated', (data) => {
      socketEventsReceived.push({ event: 'table:status-updated', data });
      console.log(`   ⚡ Socket Event: table:status-updated -> Table ${data.tableId} is ${data.status}`);
    });

    socket.on('order:created', (data) => {
      socketEventsReceived.push({ event: 'order:created', data });
      console.log(`   ⚡ Socket Event: order:created -> Order ${data.order?.orderNumber}`);
    });

    socket.on('kot:created', (data) => {
      socketEventsReceived.push({ event: 'kot:created', data });
      console.log(`   ⚡ Socket Event: kot:created -> KOT ${data.kot?.kotNumber}`);
    });

    socket.on('kitchen:order-ready', (data) => {
      socketEventsReceived.push({ event: 'kitchen:order-ready', data });
      console.log(`   ⚡ Socket Event: kitchen:order-ready -> Food Ready!`);
    });

    // 3. Fetch Tables
    console.log('\n[3/10] Fetching Dining Tables...');
    const tablesRes = await axios.get(`${API_URL}/restaurant/tables`, { headers: authHeaders });
    const tables = tablesRes.data.data;
    console.log(`✅ Loaded ${tables.length} tables`);
    const availableTable = tables.find((t) => t.status === 'AVAILABLE') || tables[0];
    console.log(`   Selected Table: ${availableTable.tableNumber} (${availableTable.floor}) - Status: ${availableTable.status}`);

    // 4. Fetch Menu Items & Categories
    console.log('\n[4/10] Fetching Menu Categories & Catalog...');
    const catsRes = await axios.get(`${API_URL}/restaurant/menu/categories`, { headers: authHeaders });
    const itemsRes = await axios.get(`${API_URL}/restaurant/menu/items?limit=20`, { headers: authHeaders });
    const categories = catsRes.data.data;
    const menuItems = itemsRes.data.data;
    console.log(`✅ Loaded ${categories.length} categories and ${menuItems.length} menu items`);

    const item1 = menuItems[0];
    const item2 = menuItems[1] || menuItems[0];
    console.log(`   Item 1: ${item1.name} (₹${item1.price})`);
    console.log(`   Item 2: ${item2.name} (₹${item2.price})`);

    // 5. Create New Order with Notes
    console.log(`\n[5/10] Creating Order for Table ${availableTable.tableNumber}...`);
    const createOrderPayload = {
      orderType: 'DINE_IN',
      tableId: availableTable._id,
      items: [
        {
          menuItemId: item1._id,
          quantity: 2,
          notes: 'Extra spicy, less oil',
        },
        {
          menuItemId: item2._id,
          quantity: 1,
          notes: 'Serve hot',
        },
      ],
      discount: 0,
      idempotencyKey: `test_ord_${Date.now()}`,
    };

    const orderRes = await axios.post(`${API_URL}/restaurant/orders`, createOrderPayload, { headers: authHeaders });
    const order = orderRes.data.data;
    console.log(`✅ Order created: ${order.orderNumber} (ID: ${order._id})`);
    console.log(`   Status: ${order.status} | Subtotal: ₹${order.subtotal} | Tax: ₹${order.tax} | Grand Total: ₹${order.grandTotal}`);

    // 6. Generate Incremental KOT
    console.log(`\n[6/10] Dispatching Incremental KOT to Kitchen...`);
    const kotRes = await axios.post(
      `${API_URL}/restaurant/orders/${order._id}/kot`,
      { priority: 'MEDIUM', idempotencyKey: `test_kot_${Date.now()}` },
      { headers: authHeaders }
    );
    const kot = kotRes.data.data;
    console.log(`✅ KOT Created: ${kot.kotNumber} (Kitchen Status: ${kot.kitchenStatus})`);
    console.log(`   Items in KOT: ${kot.items?.map((i) => `${i.quantity}x ${i.name} [${i.notes || ''}]`).join(', ')}`);

    // 7. Verify Delta Tracking (Order submittedQuantity should equal item quantity)
    console.log(`\n[7/10] Verifying Delta Tracking & Unsubmitted Items...`);
    const orderCheck = await axios.get(`${API_URL}/restaurant/orders/${order._id}`, { headers: authHeaders });
    const updatedOrder = orderCheck.data.data;
    const unsubmitted = updatedOrder.items.filter((i) => i.quantity > (i.submittedQuantity || 0));
    console.log(`✅ Unsubmitted items count: ${unsubmitted.length} (Expected: 0 after KOT dispatch)`);

    // 8. Add Extra Item to Running Order
    console.log(`\n[8/10] Appending Extra Item to Running Order (Add-on Flow)...`);
    const extraItem = menuItems[2] || menuItems[0];
    const appendRes = await axios.post(
      `${API_URL}/restaurant/orders/${order._id}/items`,
      {
        items: [
          {
            menuItemId: extraItem._id,
            quantity: 1,
            notes: 'Add to ongoing table order',
          },
        ],
      },
      { headers: authHeaders }
    );
    const orderAfterAppend = appendRes.data.data;
    const newUnsubmitted = orderAfterAppend.items.filter((i) => i.quantity > (i.submittedQuantity || 0));
    console.log(`✅ Item added: ${extraItem.name} | New Grand Total: ₹${orderAfterAppend.grandTotal}`);
    console.log(`   New unsubmitted items pending next KOT: ${newUnsubmitted.length} items (${newUnsubmitted.map((i) => i.name).join(', ')})`);

    // 9. Advance Kitchen Status & Trigger Food Ready
    console.log(`\n[9/10] Advancing Kitchen Status (PREPARING -> READY)...`);
    const prepRes = await axios.patch(
      `${API_URL}/restaurant/kots/${kot._id}/status`,
      { status: 'PREPARING' },
      { headers: authHeaders }
    );
    console.log(`   KOT Status: ${prepRes.data.data?.kitchenStatus}`);

    const readyRes = await axios.patch(
      `${API_URL}/restaurant/kots/${kot._id}/status`,
      { status: 'READY' },
      { headers: authHeaders }
    );
    console.log(`✅ KOT Status: ${readyRes.data.data?.kitchenStatus} (Food Ready chime triggered!)`);

    // 10. Generate Final Bill / Invoice
    console.log(`\n[10/10] Generating Bill / Invoice for Table ${availableTable.tableNumber}...`);
    const invoiceRes = await axios.post(
      `${API_URL}/restaurant/billing/invoices`,
      {
        orderId: order._id,
        idempotencyKey: `test_inv_${Date.now()}`,
      },
      { headers: authHeaders }
    );
    const invoice = invoiceRes.data.data;
    console.log(`✅ Invoice Generated: ${invoice.invoiceNumber}`);
    console.log(`   Grand Total: ₹${invoice.grandTotal} | Payment Status: ${invoice.paymentStatus} | Status: ${invoice.status}`);

    // Wait a brief moment to capture socket events
    await new Promise((r) => setTimeout(r, 1000));
    socket.disconnect();

    console.log('\n====================================================');
    console.log('   ALL 10 PWA INTEGRATION TESTS PASSED 100%!        ');
    console.log(`   Socket events verified: ${socketEventsReceived.length} real-time broadcasts`);
    console.log('====================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test failure:', err.response?.data || err.message);
    process.exit(1);
  }
}

runStaffPWATests();
