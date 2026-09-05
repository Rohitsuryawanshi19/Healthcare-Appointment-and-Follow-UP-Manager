import { io } from 'socket.io-client';

let socket = null;

function getSocketUrl() {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  const apiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (apiUrl && apiUrl.startsWith('http')) {
    return apiUrl.replace(/\/api\/?$/, '');
  }

  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:5000';
  }

  return typeof window !== 'undefined' ? window.location.origin : '/';
}

/**
 * Connects to the Socket.IO server with credentials
 * Fully degradable: fails silently if connection cannot be established
 */
export function connectSocket() {
  if (socket && socket.connected) {
    return socket;
  }

  if (socket) {
    socket.connect();
    return socket;
  }

  const url = getSocketUrl();

  try {
    socket = io(url, {
      withCredentials: true,
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect_error', (err) => {
      // Degrade gracefully without impacting application functionality
      console.debug('Real-time notification socket unavailable (falling back to REST):', err.message);
    });
  } catch (err) {
    console.debug('Failed to instantiate socket client:', err);
    socket = null;
  }

  return socket;
}

/**
 * Disconnects existing socket session
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Returns current socket instance
 */
export function getSocket() {
  return socket;
}
