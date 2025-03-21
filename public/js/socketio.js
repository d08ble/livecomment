// Socket.IO Client Configuration
const socketConfig = {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  autoConnect: true,
  port: 8980
};

// Socket.IO Client Class
class SocketIOClient {
  constructor(host, port) {
    this.socket = null;
    this.host = host;
    this.port = port;
    this.connected = false;
    this.reconnectAttempts = 0;
  }

  connect() {
    const url = `${this.host}:${this.port}`;
    this.socket = io(url, socketConfig);

    this.socket.on('connect', () => {
      console.log('Socket.IO connected');
      this.connected = true;
      this.reconnectAttempts = 0;
      this.onConnect();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
      this.connected = false;
      this.onDisconnect(reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      this.onError(error);
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Socket.IO reconnection attempt:', attemptNumber);
      this.reconnectAttempts = attemptNumber;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Socket.IO reconnection failed');
      this.onReconnectFailed();
    });

    this.socket.on('message', (msg) => {
      this.onMessage(msg);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
    }
  }

  send(data) {
    if (this.socket && this.connected) {
      this.socket.emit('message', data);
    } else {
      console.error('Socket not connected');
    }
  }

  // Event handlers that can be overridden
  onConnect() {}
  onDisconnect(reason) {}
  onError(error) {}
  onReconnectFailed() {}
  onMessage(msg) {}
}

// Export the client
window.SocketIOClient = SocketIOClient; 