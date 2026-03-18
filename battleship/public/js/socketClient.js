(function(window) {
  'use strict';
  let _socket = null;
  
  const socketClient = {
    connect: function() {
      if (_socket && _socket.connected) return _socket;
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
      _socket.on('connect', function() { console.log('[Socket] Connected:', _socket.id); });
      _socket.on('connect_error', function(err) { console.error('[Socket] Error:', err.message); });
      _socket.on('disconnect', function(r) { console.warn('[Socket] Disconnected:', r); });
      _socket.on('reconnect', function() { console.log('[Socket] Reconnected:', _socket.id); });
      return _socket;
    },
    get id() { return _socket ? _socket.id : null; },
    get connected() { return _socket ? _socket.connected : false; },
    createRoom: function(n, max, cb) { if (_socket) _socket.emit('createRoom', { playerName: n, maxPlayers: max }, cb); },
    joinRoom: function(code, name, cb) { if (_socket) _socket.emit('joinRoom', { roomCode: code, playerName: name }, cb); },
    startSetup: function(room) { if (_socket) _socket.emit('startSetup', { roomCode: room }); },
    rejoinRoom: function(room, name) { if (_socket) _socket.emit('rejoinRoom', { roomCode: room, playerName: name }); },
    placeShip: function(room, ori, size, r, c) { if (_socket) _socket.emit('placeShip', { roomCode: room, orientation: ori, size: size, startRow: r, startCol: c }); },
    placeLand: function(room, r, c) { if (_socket) _socket.emit('placeLand', { roomCode: room, row: r, col: c }); },
    placeTurret: function(room, r, c) { if (_socket) _socket.emit('placeTurret', { roomCode: room, row: r, col: c }); },
    removeItem: function(room, r, c) { if (_socket) _socket.emit('removeItem', { roomCode: room, row: r, col: c }); },
    markReady: function(room) { if (_socket) _socket.emit('markReady', { roomCode: room }); },
    attack: function(room, target, r, c) { if (_socket) _socket.emit('attack', { roomCode: room, targetId: target, row: r, col: c }); },
    endTurn: function(room) { if (_socket) _socket.emit('endTurn', { roomCode: room }); },
    forfeit: function(room) { if (_socket) _socket.emit('forfeit', { roomCode: room }); },
    on: function(e, cb) { if (_socket) _socket.on(e, cb); },
    off: function(e, cb) { if (_socket) _socket.off(e, cb); }
  };
  
  window.SC = socketClient;
  window.socketClient = socketClient;
})(window);
