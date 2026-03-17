// public/js/socketClient.js
// Shared socket.io client wrapper used by lobby, setup, and battle pages

(function(window){
    let _socket = null;

    const socketClient = {
        // ── Connection ──────────────────────────────────────────
        connect() {
            if (_socket && _socket.connected) return _socket;
            _socket = io({ transports: ['websocket', 'polling'] });

            _socket.on('connect', () => {
                console.log('[Socket] Connected:', _socket.id);
            });
            _socket.on('connect_error', (err) => {
                console.error('[Socket] Connection error:', err.message);
            });
            _socket.on('disconnect', (reason) => {
                console.warn('[Socket] Disconnected:', reason);
            });

            return _socket;
        },

        get id() { return _socket?.id || null; },
        get connected() { return _socket?.connected || false; },

        // ── Room actions ────────────────────────────────────────
        createRoom(playerName, maxPlayers, cb) {
            _socket?.emit('createRoom', { playerName, maxPlayers }, cb);
        },
        joinRoom(roomCode, playerName, cb) {
            _socket?.emit('joinRoom', { roomCode, playerName }, cb);
        },
        startSetup(roomCode) {
            _socket?.emit('startSetup', { roomCode });
        },

        // ── Setup actions ───────────────────────────────────────
        placeShip(roomCode, orientation, size, startRow, startCol) {
            _socket?.emit('placeShip', { roomCode, orientation, size, startRow, startCol });
        },
        placeLand(roomCode, row, col) {
            _socket?.emit('placeLand', { roomCode, row, col });
        },
        placeTurret(roomCode, row, col) {
            _socket?.emit('placeTurret', { roomCode, row, col });
        },
        removeItem(roomCode, row, col) {
            _socket?.emit('removeItem', { roomCode, row, col });
        },
        markReady(roomCode) {
            _socket?.emit('markReady', { roomCode });
        },

        // ── Battle actions ──────────────────────────────────────
        attack(roomCode, targetId, row, col) {
            _socket?.emit('attack', { roomCode, targetId, row, col });
        },
        endTurn(roomCode) {
            _socket?.emit('endTurn', { roomCode });
        },
        forfeit(roomCode) {
            _socket?.emit('forfeit', { roomCode });
        },

        // ── Event listeners ─────────────────────────────────────
        on(event, cb)  { _socket?.on(event, cb); },
        off(event, cb) { _socket?.off(event, cb); },
    };

    window.SC = socketClient; // short alias
    window.socketClient = socketClient;
})(window);
