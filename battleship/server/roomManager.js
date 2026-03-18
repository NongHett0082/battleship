const { v4: uuidv4 } = require('uuid');

class Room {
  constructor(roomCode, hostId, hostName, maxPlayers = 2) {
    this.roomCode = roomCode;
    this.hostId = hostId;
    this.maxPlayers = maxPlayers;
    this.players = new Map();
    this.status = 'waiting'; // waiting, setup, battle, finished
    this.turnOrder = [];
    this.currentTurnIndex = 0;
    this.bulletsLeft = 0;
    this.shotsFiredThisTurn = [];
    
    // Add host player
    this.players.set(hostId, {
      socketId: hostId,
      name: hostName,
      isHost: true,
      ready: false,
      alive: true,
      color: this.generateColor(),
      board: this.createEmptyBoard()
    });
  }
  
  createEmptyBoard() {
    const board = [];
    for (let i = 0; i < 10; i++) {
      board[i] = [];
      for (let j = 0; j < 10; j++) {
        board[i][j] = { type: 'water', hit: false };
      }
    }
    return board;
  }
  
  generateColor() {
    const colors = ['#4ade80', '#60a5fa', '#f472b6', '#fbbf24', '#a78bfa', '#34d399'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  playerCount() {
    return this.players.size;
  }
  
  getPlayer(socketId) {
    return this.players.get(socketId);
  }
  
  getPlayerList() {
    return Array.from(this.players.values());
  }
  
  alivePlayers() {
    return this.getPlayerList().filter(p => p.alive);
  }
  
  allReady() {
    return this.getPlayerList().every(p => p.ready);
  }
  
  currentTurnPlayerId() {
    if (this.turnOrder.length === 0) return null;
    return this.turnOrder[this.currentTurnIndex];
  }
  
  advanceTurn() {
    if (this.turnOrder.length === 0) return;
    this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
  }
}

class RoomManager {
  constructor() {
    this.rooms = new Map();
    this.MIN_PLAYERS = 2;
  }
  
  generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
  
  createRoom(hostId, hostName, maxPlayers = 2) {
    const roomCode = this.generateRoomCode();
    const room = new Room(roomCode, hostId, hostName, maxPlayers);
    this.rooms.set(roomCode, room);
    return roomCode;
  }
  
  getRoom(roomCode) {
    return this.rooms.get(roomCode);
  }
  
  joinRoom(roomCode, socketId, playerName) {
    const room = this.rooms.get(roomCode);
    if (!room) {
      return { error: 'ไม่พบห้องนี้' };
    }
    if (room.players.has(socketId)) {
      return { error: 'คุณอยู่ในห้องนี้แล้ว' };
    }
    if (room.playerCount() >= room.maxPlayers) {
      return { error: 'ห้องเต็มแล้ว' };
    }
    if (room.status !== 'waiting') {
      return { error: 'เกมเริ่มแล้ว' };
    }
    
    room.players.set(socketId, {
      socketId,
      name: playerName,
      isHost: false,
      ready: false,
      alive: true,
      color: room.generateColor(),
      board: room.createEmptyBoard()
    });
    
    return { success: true, room };
  }
  
  deleteRoom(roomCode) {
    this.rooms.delete(roomCode);
  }
  
  cleanupExpiredRooms() {
    // ลบห้องที่ไม่มีผู้เล่นเกิน 1 ชั่วโมง
    const now = Date.now();
    for (const [code, room] of this.rooms) {
      if (room.playerCount() === 0) {
        this.rooms.delete(code);
      }
    }
  }
}

module.exports = new RoomManager();
