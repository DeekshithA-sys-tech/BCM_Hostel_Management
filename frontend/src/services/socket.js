import { io } from 'socket.io-client';

let socket = null;

/**
 * Connect (or reconnect) with a fresh token.
 * Safe to call multiple times — disconnects old socket first.
 */
export const connectSocket = (token) => {
  if (!token) return null;

  // If already connected with the same auth, skip
  if (socket?.connected && socket.auth?.token === token) return socket;

  // Disconnect stale socket before creating a new one
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  });

  socket.on('connect', () => {
    console.log('[Socket] ✅ Connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] ⚠️ Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    // Only log once, don't spam
    console.warn('[Socket] ❌ Auth error:', err.message);
  });

  return socket;
};

/** Disconnect and clean up. */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/** Get current socket instance. */
export const getSocket = () => socket;

/**
 * Subscribe to a socket event.
 * Returns an unsubscribe function — always safe to call.
 */
export const onSocketEvent = (event, handler) => {
  if (!socket) return () => {};
  socket.on(event, handler);
  return () => {
    if (socket) socket.off(event, handler);
  };
};

/** Emit a socket event safely. */
export const emitSocketEvent = (event, data) => {
  if (socket?.connected) socket.emit(event, data);
};

/** Join a specific complaint room for real-time updates. */
export const joinComplaintRoom = (complaintId) => {
  emitSocketEvent('complaint:join', complaintId);
};
