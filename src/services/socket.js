import { io } from 'socket.io-client';
import { TOKEN_STORAGE_KEY } from './api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) return null;

    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Realtime Socket connected successfully:', this.socket.id);
      window.dispatchEvent(new CustomEvent('socket:connected'));
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('⚠️ Realtime Socket disconnected:', reason);
      window.dispatchEvent(new CustomEvent('socket:disconnected', { detail: reason }));
    });

    this.socket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err.message);
      window.dispatchEvent(new CustomEvent('socket:error', { detail: err.message }));
    });

    // Re-attach registered listeners
    for (const [event, callbacks] of this.listeners.entries()) {
      callbacks.forEach((cb) => this.socket.on(event, cb));
    }

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }

    // Return unbind function
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected. Cannot emit:', event);
    }
  }

  isConnected() {
    return Boolean(this.socket && this.socket.connected);
  }
}

export const socketService = new SocketService();
export default socketService;
