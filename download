// roomManager.js — Multi-player (2-10 players per room)
const { v4: uuidv4 } = require('uuid');

const MAX_PLAYERS = 10;
const MIN_PLAYERS = 2;

const rooms = new Map();

function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code;
    do {
        code = '';
        for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    } while (rooms.has(code));
    return code;
}

function createEmptyBoard() {
    const cells = [];
    for (let r = 0; r < 6; r++) {
        cells[r] = [];
        for (let c = 1; c <= 8; c++) {
            cells[r][c] = { state: 'water', content: null };
        }
    }
    return { cells, ships: [], lands: [], turrets: [] };
}

class Room {
    constructor(roomCode, hostId, hostName, maxPlayers) {
        this.roomCode = roomCode;
        this.status = 'waiting'; // waiting | setup | battle | finished
        this.createdAt = Date.now();
        this.maxPlayers = Math.min(Math.max(maxPlayers || 2, MIN_PLAYERS), MAX_PLAYERS);
        this.currentTurnIndex = 0;
        this.turnOrder = []; // array of socketIds in turn order
        this.winner = null;

        this.players = new Map(); // socketId -> player object
        this.addPlayer(hostId, hostName, true);
    }

    addPlayer(socketId, name, isHost = false) {
        this.players.set(socketId, {
            socketId,
            name,
            isHost,
            board: createEmptyBoard(),
            ready: false,
            alive: true,
            color: PLAYER_COLORS[this.players.size % PLAYER_COLORS.length]
        });
    }

    getPlayer(socketId) { return this.players.get(socketId); }
    getPlayerList() { return [...this.players.values()]; }
    isFull() { return this.players.size >= this.maxPlayers; }
    playerCount() { return this.players.size; }

    allReady() {
        return this.players.size >= MIN_PLAYERS &&
            [...this.players.values()].every(p => p.ready);
    }

    currentTurnPlayerId() {
        return this.turnOrder[this.currentTurnIndex] || null;
    }

    advanceTurn() {
        const alive = this.turnOrder.filter(id => {
            const p = this.players.get(id);
            return p && p.alive;
        });
        if (alive.length === 0) return;
        const currentPos = alive.indexOf(this.currentTurnPlayerId());
        const next = alive[(currentPos + 1) % alive.length];
        this.currentTurnIndex = this.turnOrder.indexOf(next);
    }

    alivePlayers() {
        return [...this.players.values()].filter(p => p.alive);
    }
}

const PLAYER_COLORS = [
    '#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6',
    '#1abc9c','#e67e22','#e91e63','#00bcd4','#cddc39'
];

function createRoom(hostId, hostName, maxPlayers) {
    const roomCode = generateRoomCode();
    const room = new Room(roomCode, hostId, hostName, maxPlayers);
    rooms.set(roomCode, room);
    console.log(`[Room ${roomCode}] Created by ${hostName}, max ${room.maxPlayers} players`);
    return roomCode;
}

function joinRoom(roomCode, socketId, playerName) {
    const room = rooms.get(roomCode);
    if (!room) return { error: 'ไม่พบห้องนี้' };
    if (room.status !== 'waiting') return { error: 'ห้องนี้เริ่มเกมแล้ว' };
    if (room.isFull()) return { error: `ห้องเต็มแล้ว (สูงสุด ${room.maxPlayers} คน)` };
    room.addPlayer(socketId, playerName, false);
    console.log(`[Room ${roomCode}] ${playerName} joined (${room.playerCount()}/${room.maxPlayers})`);
    return { success: true, room };
}

function getRoom(roomCode) { return rooms.get(roomCode); }

function deleteRoom(roomCode) {
    rooms.delete(roomCode);
    console.log(`[Room ${roomCode}] Deleted`);
}

function cleanupExpiredRooms(maxAgeMs = 24 * 60 * 60 * 1000) {
    const now = Date.now();
    for (const [code, room] of rooms) {
        if (now - room.createdAt > maxAgeMs) { rooms.delete(code); }
    }
}

module.exports = {
    rooms, Room, PLAYER_COLORS,
    createRoom, joinRoom, getRoom, deleteRoom, cleanupExpiredRooms,
    MAX_PLAYERS, MIN_PLAYERS
};
