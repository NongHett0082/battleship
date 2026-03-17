(function(window){
  let _socket = null;

  const socketClient = {
    connect() {
      if (_socket && _socket.connected) return _socket;
      
      // ✅ Detect server URL automatically for production
      const serverUrl = window.location.origin;
      
      _socket = io(serverUrl, {
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: true
      });
      
      _socket.on('connect', () => console.log('[Socket] Connected:', _socket.id));
      _socket.on('connect_error', (err) => console.error('[Socket] Error:', err.message));
      _socket.on('disconnect', (r) => console.warn('[Socket] Disconnected:', r));
      _socket.on('reconnect', () => console.log('[Socket] Reconnected:', _socket.id));
      return _socket;
    },
    
    get id() { return _socket?.id || null; },
    get connected() { return _socket?.connected || false; },
    
    createRoom(n, max, cb) { _socket?.emit('createRoom', { playerName:n, maxPlayers:max }, cb); },
    joinRoom(code, name, cb) { _socket?.emit('joinRoom', { roomCode:code, playerName:name }, cb); },
    startSetup(room) { _socket?.emit('startSetup', { roomCode:room }); },
    rejoinRoom(room, name) { _socket?.emit('rejoinRoom', { roomCode:room, playerName:name }); },
    placeShip(room, ori, size, r, c) { _socket?.emit('placeShip', { roomCode:room, orientation:ori, size, startRow:r, startCol:c }); },
    placeLand(room, r, c) { _socket?.emit('placeLand', { roomCode:room, row:r, col:c }); },
    placeTurret(room, r, c) { _socket?.emit('placeTurret', { roomCode:room, row:r, col:c }); },
    removeItem(room, r, c) { _socket?.emit('removeItem', { roomCode:room, row:r, col:c }); },
    markReady(room) { _socket?.emit('markReady', { roomCode:room }); },
    attack(room, target, r, c) { _socket?.emit('attack', { roomCode:room, targetId:target, row:r, col:c }); },
    endTurn(room) { _socket?.emit('endTurn', { roomCode:room }); },
    forfeit(room) { _socket?.emit('forfeit', { roomCode:room }); },
    
    on(e, cb) { _socket?.on(e, cb); },
    off(e, cb) { _socket?.off(e, cb); },
  };
  
  window.SC = socketClient;
  window.socketClient = socketClient;
})(window);