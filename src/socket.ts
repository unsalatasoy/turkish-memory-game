import { io } from "socket.io-client";

// Use Render.com URL for production, localhost for development
const SOCKET_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-app-name.onrender.com'  // Replace with your Render.com URL
  : 'http://localhost:3001';

console.log('Environment:', process.env.NODE_ENV);
console.log('Connecting to socket server:', SOCKET_URL);

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  randomizationFactor: 0.5,
  transports: ['websocket', 'polling'],
  path: '/socket.io/',
  withCredentials: true,
  forceNew: true,
  timeout: 20000,
});

let isConnected = false;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5;

// Add connection event listeners for debugging
socket.on('connect_error', (error) => {
  console.error('Socket connection error details:', {
    message: error.message,
    name: error.name,
    stack: error.stack
  });
  isConnected = false;
  connectionAttempts++;

  if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
    console.error('Max connection attempts reached. Please check if the server is running.');
    socket.disconnect();
  }
});

socket.on('connect', () => {
  console.log('Socket connected successfully. Socket ID:', socket.id);
  isConnected = true;
  connectionAttempts = 0;
});

socket.on('disconnect', (reason) => {
  console.log('Socket disconnected. Reason:', reason);
  isConnected = false;
  
  // If the disconnection was not initiated by the client, try to reconnect
  if (reason !== 'io client disconnect') {
    socket.connect();
  }
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log('Attempting to reconnect. Attempt:', attemptNumber);
});

socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected successfully after', attemptNumber, 'attempts');
  isConnected = true;
  connectionAttempts = 0;
});

socket.on('reconnect_error', (error) => {
  console.error('Reconnection error:', error);
});

socket.on('reconnect_failed', () => {
  console.error('Failed to reconnect after all attempts');
  isConnected = false;
});

// Export a function to check connection status
export const isSocketConnected = () => isConnected; 