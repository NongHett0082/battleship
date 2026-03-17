// server.js — Battleship Full Rules
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const PORT = process.env.PORT || 3000;

// Fix CSP before anything else
app.use((req, res, next) => {
    res.removeHeader('Content-Security-Policy');
    res.setHeader('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;");
    next();
});
app.use(express.static(path.join(__dirname, '..', 'public')));

// Allow socket.io and inline scripts
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "connect-src 'self' ws: wss:; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data:;"
    );
    next();
});

const roomManager = require('./roomManager');
const gameLogic = require('./gameLogic');

function broadcastRoomState(roomCode) {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;
    io.to(roomCode).emit('roomState', {
        roomCode, status: room.status, maxPlayers: room.maxPlayers,
        players: room.getPlayerList().map(p => ({
            socketId: p.socketId, name: p.name, isHost: p.isHost,
            ready: p.ready, alive: p.alive, color: p.color
        })),
        currentTurn: room.currentTurnPlayerId()
    });
}

function getTurnState(room) {
    const currentId = room.currentTurnPlayerId();
    const currentPlayer = room.players.get(currentId);
    const maxBullets = currentPlayer ? gameLogic.calcMaxBullets(currentPlayer.board) : 1;
    return {
        currentTurn: currentId,
        currentPlayerName: currentPlayer?.name,
        bulletsLeft: room.bulletsLeft,
        maxBullets,
        shotsFiredThisTurn: room.shotsFiredThisTurn || []
    };
}

io.on('connection', (socket) => {
    console.log(`+ ${socket.id}`);

    socket.on('createRoom', (data, cb) => {
        const { playerName, maxPlayers } = data;
        if (!playerName?.trim()) { socket.emit('error', { message: 'กรุณาใส่ชื่อ' }); return; }
        const roomCode = roomManager.createRoom(socket.id, playerName.trim(), maxPlayers || 2);
        socket.join(roomCode);
        socket.emit('roomCreated', { roomCode, playerId: socket.id, playerName: playerName.trim() });
        broadcastRoomState(roomCode);
        if (cb) cb({ roomCode });
    });

    socket.on('joinRoom', (data, cb) => {
        const { roomCode, playerName } = data;
        const code = roomCode?.trim().toUpperCase();
        if (!code || !playerName?.trim()) { socket.emit('error', { message: 'กรุณาใส่ชื่อและรหัสห้อง' }); if (cb) cb({ error: 'missing' }); return; }
        const result = roomManager.joinRoom(code, socket.id, playerName.trim());
        if (result.error) { socket.emit('error', { message: result.error }); if (cb) cb({ error: result.error }); return; }
        socket.join(code);
        socket.emit('roomJoined', { roomCode: code, playerId: socket.id, playerName: playerName.trim() });
        io.to(code).emit('playerJoined', { playerId: socket.id, playerName: playerName.trim(), playerCount: result.room.playerCount() });
        broadcastRoomState(code);
        if (cb) cb({ success: true, roomCode: code });
    });

    // REJOIN ROOM (after page navigation — socket.id changes on each page load)
    socket.on('rejoinRoom', (data) => {
        const { roomCode, playerName } = data;
        const room = roomManager.getRoom(roomCode);
        if (!room) { socket.emit('error', { message: 'ห้องหมดอายุแล้ว กลับไป Lobby' }); return; }

        socket.join(roomCode);

        // Find player by name and update their socketId to the new one
        let found = null;
        for (const [oldId, p] of room.players) {
            if (p.name === playerName) {
                found = p;
                if (oldId !== socket.id) {
                    // Re-register with new socket id
                    room.players.delete(oldId);
                    p.socketId = socket.id;
                    room.players.set(socket.id, p);
                    // Update turnOrder if needed
                    const idx = room.turnOrder.indexOf(oldId);
                    if (idx !== -1) room.turnOrder[idx] = socket.id;
                    // Update host/join ids
                    if (room.hostId === oldId) room.hostId = socket.id;
                    if (room.joinId === oldId) room.joinId = socket.id;
                }
                break;
            }
        }

        broadcastRoomState(roomCode);

        if (room.status === 'battle') {
            socket.emit('battlePhaseStart', {
                firstPlayerId: room.currentTurnPlayerId(),
                players: room.getPlayerList().map(p => ({
                    socketId: p.socketId, name: p.name, color: p.color,
                    maxBullets: gameLogic.calcMaxBullets(p.board)
                })),
                ...getTurnState(room)
            });
        }
    });

    socket.on('startSetup', (data) => {
        const { roomCode } = data;
        const room = roomManager.getRoom(roomCode);
        if (!room) return;
        if (!room.getPlayer(socket.id)?.isHost) { socket.emit('error', { message: 'เฉพาะ host' }); return; }
        if (room.playerCount() < roomManager.MIN_PLAYERS) { socket.emit('error', { message: `ต้องมีอย่างน้อย ${roomManager.MIN_PLAYERS} คน` }); return; }
        room.status = 'setup';
        io.to(roomCode).emit('setupPhaseStart', { roomCode });
        broadcastRoomState(roomCode);
    });

    socket.on('placeShip', (data) => {
        const { roomCode, orientation, size, startRow, startCol } = data;
        const room = roomManager.getRoom(roomCode);
        if (!room || room.status !== 'setup') return;
        const player = room.getPlayer(socket.id);
        if (!player) return;
        const result = gameLogic.placeShip(player.board, orientation, size, startRow, startCol);
        if (!result.success) { socket.emit('error', { message: result.error }); return; }
        socket.to(roomCode).emit('opponentPlacedShip', { playerId: socket.id, orientation, size, startRow, startCol });
    });

    socket.on('placeLand', (data) => {
        const { roomCode, row, col } = data;
        const room = roomManager.getRoom(roomCode);
        if (!room || room.status !== 'setup') return;
        const player = room.getPlayer(socket.id);
        if (!player) return;
        const result = gameLogic.placeLand(player.board, row, col);
        if (!result.success) { socket.emit('error', { message: result.error }); return; }
        socket.to(roomCode).emit('opponentPlacedLand', { playerId: socket.id, row, col });
    });

    socket.on('placeTurret', (data) => {
        const { roomCode, row, col } = data;
        const room = roomManager.getRoom(roomCode);
        if (!room || room.status !== 'setup') return;
        const player = room.getPlayer(socket.id);
        if (!player) return;
        const result = gameLogic.placeTurret(player.board, row, col);
        if (!result.success) { socket.emit('error', { message: result.error }); return; }
        socket.to(roomCode).emit('opponentPlacedTurret', { playerId: socket.id, row, col });
    });

    socket.on('removeItem', (data) => {
        const { roomCode, row, col } = data;
        const room = roomManager.getRoom(roomCode);
        if (!room) return;
        const player = room.getPlayer(socket.id);
        if (!player) return;
        gameLogic.removeItem(player.board, row, col);
        socket.to(roomCode).emit('opponentRemovedItem', { playerId: socket.id, row, col });
    });

    socket.on('markReady', (data) => {
        const { roomCode } = data;
        const room = roomManager.getRoom(roomCode);
        if (!room || room.status !== 'setup') return;
        const player = room.getPlayer(socket.id);
        if (!player) return;

        player.ready = true;
        io.to(roomCode).emit('playerReady', { playerId: socket.id, playerName: player.name });
        broadcastRoomState(roomCode);

        if (room.allReady()) {
            room.status = 'battle';
            room.turnOrder = [...room.players.keys()].sort(() => Math.random() - 0.5);
            room.currentTurnIndex = 0;
            const firstId = room.currentTurnPlayerId();
            room.bulletsLeft = gameLogic.calcMaxBullets(room.players.get(firstId).board);
            room.shotsFiredThisTurn = [];

            io.to(roomCode).emit('battlePhaseStart', {
                firstPlayerId: firstId,
                players: room.getPlayerList().map(p => ({
                    socketId: p.socketId, name: p.name, color: p.color,
                    maxBullets: gameLogic.calcMaxBullets(p.board)
                })),
                ...getTurnState(room)
            });
            broadcastRoomState(roomCode);
        }
    });

    socket.on('attack', (data) => {
        const { roomCode, targetId, row, col } = data;
        const room = roomManager.getRoom(roomCode);
        if (!room || room.status !== 'battle') return;

        const attackerId = socket.id;
        if (attackerId !== room.currentTurnPlayerId()) { socket.emit('error', { message: 'ยังไม่ถึงตาคุณ' }); return; }
        if (targetId === attackerId) { socket.emit('error', { message: 'โจมตีตัวเองไม่ได้' }); return; }
        if (room.bulletsLeft <= 0) { socket.emit('error', { message: 'กระสุนหมดแล้ว' }); return; }

        const target = room.getPlayer(targetId);
        if (!target || !target.alive) { socket.emit('error', { message: 'เป้าหมายไม่ถูกต้อง' }); return; }

        // ── Spread rule ──────────────────────────────────────────
        const aliveOpponents = room.alivePlayers().filter(p => p.socketId !== attackerId);
        const shots = room.shotsFiredThisTurn || [];
        const shotTargets = [...new Set(shots.map(s => s.targetId))];
        const unshotOpponents = aliveOpponents.filter(p => !shotTargets.includes(p.socketId));

        // If there are unshot opponents, must shoot one of them first
        if (unshotOpponents.length > 0 && !unshotOpponents.find(p => p.socketId === targetId)) {
            socket.emit('error', { message: `ต้องยิง ${unshotOpponents.map(p=>p.name).join(', ')} ก่อน! (กระจายกระสุน)` });
            return;
        }

        // Process attack
        const result = gameLogic.processAttack(target.board, row, col);
        if (result.alreadyAttacked) { socket.emit('error', { message: 'โจมตีช่องนี้ไปแล้ว' }); return; }

        room.shotsFiredThisTurn = [...shots, { targetId }];

        // Bullet: refund on land/turret hit, consume on water/ship
        if (!result.refund) {
            room.bulletsLeft = Math.max(0, room.bulletsLeft - 1);
        }
        // (if refund, bullets stay the same)

        // Elimination check
        let eliminated = false;
        if (gameLogic.checkWinCondition(target.board)) {
            target.alive = false;
            eliminated = true;
        }

        // Broadcast:
        // Everyone sees: hit/miss, sunk (if any), row/col of attacker+target
        // 'what' (land/turret/ship/water) only visible to attacker & target
        // Others see only "โดน" or "พลาด"
        io.to(roomCode).emit('attackResult', {
            attackerId, targetId, row, col,
            hit: result.hit,
            sunk: result.sunk || false,
            what: result.what,       // frontend filters per viewer
            refund: result.refund,
            bulletsLeft: room.bulletsLeft,
            eliminated
        });

        if (eliminated) {
            io.to(roomCode).emit('playerEliminated', {
                eliminatedId: targetId, eliminatedName: target.name,
                eliminatedBy: attackerId, eliminatedByName: room.getPlayer(attackerId)?.name
            });
        }

        // Win check
        const alive = room.alivePlayers();
        if (alive.length <= 1) {
            room.status = 'finished';
            io.to(roomCode).emit('gameOver', alive.length === 1
                ? { winnerId: alive[0].socketId, winnerName: alive[0].name }
                : { winnerId: null, winnerName: 'ไม่มีผู้ชนะ' });
            return;
        }

        // Continue or advance turn
        if (room.bulletsLeft > 0) {
            io.to(roomCode).emit('turnContinue', { ...getTurnState(room), sameTurn: true });
        } else {
            room.advanceTurn();
            const nextId = room.currentTurnPlayerId();
            room.bulletsLeft = gameLogic.calcMaxBullets(room.players.get(nextId).board);
            room.shotsFiredThisTurn = [];
            io.to(roomCode).emit('turnUpdate', { ...getTurnState(room), sameTurn: false });
        }
    });

    // End turn early (pass remaining bullets)
    socket.on('endTurn', (data) => {
        const { roomCode } = data;
        const room = roomManager.getRoom(roomCode);
        if (!room || room.status !== 'battle') return;
        if (socket.id !== room.currentTurnPlayerId()) return;
        room.advanceTurn();
        const nextId = room.currentTurnPlayerId();
        room.bulletsLeft = gameLogic.calcMaxBullets(room.players.get(nextId).board);
        room.shotsFiredThisTurn = [];
        io.to(roomCode).emit('turnUpdate', { ...getTurnState(room), sameTurn: false });
    });

    socket.on('forfeit', (data) => {
        const { roomCode } = data;
        const room = roomManager.getRoom(roomCode);
        if (!room) return;
        const player = room.getPlayer(socket.id);
        if (!player) return;
        player.alive = false;
        io.to(roomCode).emit('playerEliminated', { eliminatedId: socket.id, eliminatedName: player.name, forfeit: true });
        const alive = room.alivePlayers();
        if (alive.length <= 1) {
            room.status = 'finished';
            io.to(roomCode).emit('gameOver', alive.length === 1
                ? { winnerId: alive[0].socketId, winnerName: alive[0].name }
                : { winnerId: null, winnerName: 'ไม่มีผู้ชนะ' });
        } else if (socket.id === room.currentTurnPlayerId()) {
            room.advanceTurn();
            const nextId = room.currentTurnPlayerId();
            room.bulletsLeft = gameLogic.calcMaxBullets(room.players.get(nextId).board);
            room.shotsFiredThisTurn = [];
            io.to(roomCode).emit('turnUpdate', { ...getTurnState(room), sameTurn: false });
        }
        broadcastRoomState(roomCode);
    });

    socket.on('disconnect', () => {
        console.log(`- ${socket.id}`);
        for (const [code, room] of roomManager.rooms) {
            if (!room.players.has(socket.id)) continue;
            const player = room.getPlayer(socket.id);
            io.to(code).emit('playerDisconnected', { playerId: socket.id, playerName: player?.name });
            if (room.status === 'battle') {
                player.alive = false;
                const isCurrent = socket.id === room.currentTurnPlayerId();
                const alive = room.alivePlayers();
                if (alive.length <= 1) {
                    room.status = 'finished';
                    io.to(code).emit('gameOver', alive.length === 1
                        ? { winnerId: alive[0].socketId, winnerName: alive[0].name }
                        : { winnerId: null, winnerName: 'ไม่มีผู้ชนะ' });
                } else if (isCurrent) {
                    room.advanceTurn();
                    const nextId = room.currentTurnPlayerId();
                    room.bulletsLeft = gameLogic.calcMaxBullets(room.players.get(nextId).board);
                    room.shotsFiredThisTurn = [];
                    io.to(code).emit('turnUpdate', { ...getTurnState(room), sameTurn: false });
                }
            } else {
                if (player?.isHost && room.playerCount() > 1) {
                    const others = room.getPlayerList().filter(p => p.socketId !== socket.id);
                    others[0].isHost = true;
                    io.to(code).emit('hostChanged', { newHostId: others[0].socketId, newHostName: others[0].name });
                }
                room.players.delete(socket.id);
                if (room.playerCount() === 0) setTimeout(() => roomManager.deleteRoom(code), 5000);
                else broadcastRoomState(code);
            }
            break;
        }
    });
});

setInterval(() => roomManager.cleanupExpiredRooms(), 60 * 60 * 1000);
server.listen(PORT, () => console.log(`Battleship server on http://localhost:${PORT}`));
