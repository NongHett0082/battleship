const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Socket.io Configuration
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [/\.onrender\.com$/, /\.vercel\.app$/, 'http://localhost:3000', 'http://localhost:10000']
      : '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  allowUpgrades: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

const PORT = process.env.PORT || 3000;

// ✅ CSP Header - แก้ไขครบถ้วน
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', 
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https: wss: data:; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: cdn.socket.io cdnjs.cloudflare.com; " +
    "style-src 'self' 'unsafe-inline' https: fonts.googleapis.com; " +
    "connect-src 'self' ws: wss: https: http:; " +
    "img-src 'self' blob: https: data:; " +
    "font-src 'self' https: fonts.gstatic.com data:; " +
    "media-src 'self' blob: https:; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';");
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'lobby.html')));
app.get('/lobby.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'lobby.html')));
app.get('/setup.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'setup.html')));
app.get('/battle.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'battle.html')));

const roomManager = require('./roomManager');
const gameLogic = require('./gameLogic');

function broadcastRoomState(roomCode) {
  const room = roomManager.getRoom(roomCode);
  if (!room) return;
  io.to(roomCode).emit('roomState', {
    roomCode,
    status: room.status,
    maxPlayers: room.maxPlayers,
    players: room.getPlayerList().map(p => ({
      socketId: p.socketId,
      name: p.name,
      isHost: p.isHost,
      ready: p.ready,
      alive: p.alive,
      color: p.color
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
    currentPlayerName: currentPlayer ? currentPlayer.name : null,
    bulletsLeft: room.bulletsLeft,
    maxBullets,
    shotsFiredThisTurn: room.shotsFiredThisTurn || []
  };
}

function updateSocketId(room, playerName, newSocketId) {
  for (const [oldId, p] of room.players) {
    if (p.name === playerName && oldId !== newSocketId) {
      room.players.delete(oldId);
      p.socketId = newSocketId;
      room.players.set(newSocketId, p);
      const idx = room.turnOrder ? room.turnOrder.indexOf(oldId) : -1;
      if (idx !== -1) room.turnOrder[idx] = newSocketId;
      if (room.hostId === oldId) room.hostId = newSocketId;
      if (room.joinId === oldId) room.joinId = newSocketId;
      return true;
    }
  }
  return false;
}

io.on('connection', (socket) => {
  console.log('[Socket] Connected:', socket.id.substr(0, 8));

  socket.on('createRoom', (data, cb) => {
    const { playerName, maxPlayers } = data;
    if (!playerName || !playerName.trim()) {
      socket.emit('error', { message: 'กรุณาใส่ชื่อ' });
      return;
    }
    const roomCode = roomManager.createRoom(socket.id, playerName.trim(), maxPlayers || 2);
    socket.join(roomCode);
    socket.emit('roomCreated', { roomCode, playerId: socket.id, playerName: playerName.trim() });
    broadcastRoomState(roomCode);
    if (cb) cb({ roomCode });
  });

  socket.on('joinRoom', (data, cb) => {
    const { roomCode, playerName } = data;
    const code = roomCode ? roomCode.trim().toUpperCase() : '';
    if (!code || !playerName || !playerName.trim()) {
      socket.emit('error', { message: 'กรุณาใส่ชื่อและรหัสห้อง' });
      if (cb) cb({ error: 'missing' });
      return;
    }
    const result = roomManager.joinRoom(code, socket.id, playerName.trim());
    if (result.error) {
      socket.emit('error', { message: result.error });
      if (cb) cb({ error: result.error });
      return;
    }
    socket.join(code);
    socket.emit('roomJoined', { roomCode: code, playerId: socket.id, playerName: playerName.trim() });
    io.to(code).emit('playerJoined', { playerId: socket.id, playerName: playerName.trim(), playerCount: result.room.playerCount() });
    broadcastRoomState(code);
    if (cb) cb({ success: true, roomCode: code });
  });

  socket.on('rejoinRoom', (data) => {
    const { roomCode, playerName } = data;
    if (!roomCode || !playerName) return;
    const room = roomManager.getRoom(roomCode);
    if (!room) {
      socket.emit('error', { message: 'ห้องหมดอายุแล้ว' });
      return;
    }
    socket.join(roomCode);
    updateSocketId(room, playerName, socket.id);
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
    } else if (room.status === 'setup') {
      socket.emit('setupPhaseStart', { roomCode });
    }
  });

  socket.on('startSetup', (data) => {
    const { roomCode } = data;
    const room = roomManager.getRoom(roomCode);
    if (!room) return;
    if (!room.getPlayer(socket.id) || !room.getPlayer(socket.id).isHost) {
      socket.emit('error', { message: 'เฉพาะ host เท่านั้นที่เริ่มเกมได้' });
      return;
    }
    if (room.playerCount() < roomManager.MIN_PLAYERS) {
      socket.emit('error', { message: 'ต้องมีอย่างน้อย ' + roomManager.MIN_PLAYERS + ' คน' });
      return;
    }
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
    if (!result.success) socket.emit('error', { message: result.error });
  });

  socket.on('placeLand', (data) => {
    const { roomCode, row, col } = data;
    const room = roomManager.getRoom(roomCode);
    if (!room || room.status !== 'setup') return;
    const player = room.getPlayer(socket.id);
    if (!player) return;
    gameLogic.placeLand(player.board, row, col);
  });

  socket.on('placeTurret', (data) => {
    const { roomCode, row, col } = data;
    const room = roomManager.getRoom(roomCode);
    if (!room || room.status !== 'setup') return;
    const player = room.getPlayer(socket.id);
    if (!player) return;
    gameLogic.placeTurret(player.board, row, col);
  });

  socket.on('removeItem', (data) => {
    const { roomCode, row, col } = data;
    const room = roomManager.getRoom(roomCode);
    if (!room) return;
    const player = room.getPlayer(socket.id);
    if (!player) return;
    gameLogic.removeItem(player.board, row, col);
  });

  socket.on('markReady', (data) => {
  const { roomCode } = data;
  const room = roomManager.getRoom(roomCode);
  if (!room || room.status !== 'setup') {
    console.log('[markReady] SKIP room=' + roomCode + ' status=' + (room ? room.status : 'null'));
    return;
  }
  const player = room.getPlayer(socket.id);
  if (!player) {
    console.log('[markReady] Player not found: ' + socket.id + ' in room ' + roomCode);
    socket.emit('error', { message: 'ไม่พบผู้เล่น' });
    return;
  }

  player.ready = true;
  console.log('[Ready] ' + player.name + ' ready in room ' + roomCode);
  
  // ✅ ส่ง event ให้ทุกคนรู้
  io.to(roomCode).emit('playerReady', { playerId: socket.id, playerName: player.name });
  
  // ✅ สำคัญมาก: ส่ง roomState ให้อัพเดท UI ของทุกคน
  broadcastRoomState(roomCode);

  if (room.allReady()) {
    room.status = 'battle';
    room.turnOrder = Array.from(room.players.keys()).sort(() => Math.random() - 0.5);
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
    if (attackerId !== room.currentTurnPlayerId()) {
      socket.emit('error', { message: 'ยังไม่ถึงตาคุณ' });
      return;
    }
    if (targetId === attackerId) {
      socket.emit('error', { message: 'โจมตีตัวเองไม่ได้' });
      return;
    }
    if (room.bulletsLeft <= 0) {
      socket.emit('error', { message: 'กระสุนหมดแล้ว' });
      return;
    }
    const target = room.getPlayer(targetId);
    if (!target || !target.alive) {
      socket.emit('error', { message: 'เป้าหมายไม่ถูกต้อง' });
      return;
    }

    const aliveOpponents = room.alivePlayers().filter(p => p.socketId !== attackerId);
    const shots = room.shotsFiredThisTurn || [];
    const shotTargets = [...new Set(shots.map(s => s.targetId))];
    const unshotOpponents = aliveOpponents.filter(p => !shotTargets.includes(p.socketId));
    if (unshotOpponents.length > 0 && !unshotOpponents.find(p => p.socketId === targetId)) {
      socket.emit('error', { message: 'ต้องยิง ' + unshotOpponents.map(p => p.name).join(', ') + ' ก่อน!' });
      return;
    }

    const result = gameLogic.processAttack(target.board, row, col);
    if (result.alreadyAttacked) {
      socket.emit('error', { message: 'โจมตีช่องนี้ไปแล้ว' });
      return;
    }

    room.shotsFiredThisTurn = [...shots, { targetId }];
    if (!result.refund) room.bulletsLeft = Math.max(0, room.bulletsLeft - 1);

    let eliminated = false;
    if (gameLogic.checkWinCondition(target.board)) {
      target.alive = false;
      eliminated = true;
    }

    io.to(roomCode).emit('attackResult', {
      attackerId, targetId, row, col,
      hit: result.hit, sunk: result.sunk || false,
      what: result.what, refund: result.refund,
      bulletsLeft: room.bulletsLeft, eliminated
    });

    if (eliminated) {
      io.to(roomCode).emit('playerEliminated', {
        eliminatedId: targetId, eliminatedName: target.name,
        eliminatedBy: attackerId, eliminatedByName: room.getPlayer(attackerId) ? room.getPlayer(attackerId).name : 'Unknown'
      });
    }

    const alive = room.alivePlayers();
    if (alive.length <= 1) {
      room.status = 'finished';
      io.to(roomCode).emit('gameOver', alive.length === 1
        ? { winnerId: alive[0].socketId, winnerName: alive[0].name }
        : { winnerId: null, winnerName: 'ไม่มีผู้ชนะ' });
      return;
    }

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
    console.log('[Socket] Disconnected:', socket.id.substr(0, 8));
    for (const [code, room] of roomManager.rooms) {
      if (!room.players.has(socket.id)) continue;
      if (room.status === 'waiting' || room.status === 'setup') {
        setTimeout(() => {
          const r = roomManager.getRoom(code);
          if (r && r.players.has(socket.id)) {
            r.players.delete(socket.id);
            if (r.playerCount() === 0) roomManager.deleteRoom(code);
            else broadcastRoomState(code);
          }
        }, 60000);
      }
      break;
    }
  });
});

setInterval(() => roomManager.cleanupExpiredRooms(), 60 * 60 * 1000);

server.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Battleship server running on port ' + PORT);
});
