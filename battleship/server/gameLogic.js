// gameLogic.js — Battleship Full Rules
// Board: 6 rows (0-5) x 8 columns (1-8)
// Rules:
//   - 12 land cells, max 2 islands
//   - 3 turrets (each = +1 bullet), max on land
//   - Ships: 1×4, 1×3, 1×2, 2×1 = 5 ships total
//   - Base bullets: 1 + turrets alive (max 4)
//   - Must spread bullets (no double-targeting same player per turn)
//   - Hit land → bullet refunded; hit water → bullet lost
//   - Only HIT positions may be marked; misses are secret
//   - On hit: announce "โดน" only; on sink: announce "ล่ม"

const ROWS = 6;
const COLS = 8;

const LAND_LIMIT = 12;
const MAX_TURRETS = 3;
const BASE_BULLETS = 1;
const SHIP_QUOTA = [
    { size: 4, count: 1 },
    { size: 3, count: 1 },
    { size: 2, count: 1 },
    { size: 1, count: 2 },
]; // total 5 ships

// ── Board factory ─────────────────────────────────────────────
function createEmptyBoard() {
    const cells = [];
    for (let r = 0; r < ROWS; r++) {
        cells[r] = [];
        for (let c = 1; c <= COLS; c++) {
            cells[r][c] = { state: 'water', content: null };
        }
    }
    return { cells, ships: [], lands: [], turrets: [] };
}

// ── Land placement ────────────────────────────────────────────
function placeLand(board, row, col) {
    if (row < 0 || row >= ROWS || col < 1 || col > COLS)
        return { success: false, error: 'ตำแหน่งเกินขอบเขต' };

    const cell = board.cells[row][col];
    if (cell.content === 'ship')  return { success: false, error: 'ไม่สามารถวางดินทับเรือ' };
    if (cell.content === 'turret') return { success: false, error: 'ไม่สามารถวางดินทับป้อม' };

    if (cell.content === 'land') {
        // Remove land
        board.cells[row][col] = { state: 'water', content: null };
        board.lands = board.lands.filter(l => !(l.row === row && l.col === col));
        return { success: true };
    }

    // Check land limit
    if (board.lands.length >= LAND_LIMIT)
        return { success: false, error: `วางดินได้สูงสุด ${LAND_LIMIT} ช่อง` };

    // Place land (island validation is done separately via validateLandIslands)
    board.cells[row][col] = { state: 'land', content: 'land' };
    board.lands.push({ row, col });
    return { success: true };
}

// ── Island validation (max 2 connected islands) ───────────────
function validateLandIslands(board) {
    const visited = new Set();
    const landSet = new Set(board.lands.map(l => `${l.row},${l.col}`));
    let islandCount = 0;

    for (const land of board.lands) {
        const key = `${land.row},${land.col}`;
        if (visited.has(key)) continue;
        // BFS flood-fill
        const queue = [key];
        visited.add(key);
        while (queue.length) {
            const cur = queue.shift();
            const [r, c] = cur.split(',').map(Number);
            for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                const nk = `${r+dr},${c+dc}`;
                if (!visited.has(nk) && landSet.has(nk)) {
                    visited.add(nk);
                    queue.push(nk);
                }
            }
        }
        islandCount++;
        if (islandCount > 2) return { valid: false, error: 'วางดินได้สูงสุด 2 เกาะ ห้ามกระจายเป็นหลายเกาะ' };
    }
    return { valid: true, islandCount };
}

// ── Turret placement ──────────────────────────────────────────
function placeTurret(board, row, col) {
    if (row < 0 || row >= ROWS || col < 1 || col > COLS)
        return { success: false, error: 'ตำแหน่งเกินขอบเขต' };

    const cell = board.cells[row][col];
    if (cell.state !== 'land')
        return { success: false, error: 'วางป้อมได้บนดินเท่านั้น' };

    if (cell.content === 'turret') {
        // Toggle off
        board.cells[row][col] = { state: 'land', content: 'land' };
        board.turrets = board.turrets.filter(t => !(t.row === row && t.col === col));
        return { success: true, removed: true };
    }

    if (board.turrets.length >= MAX_TURRETS)
        return { success: false, error: `วางป้อมได้สูงสุด ${MAX_TURRETS} ป้อม` };

    board.cells[row][col] = { state: 'land', content: 'turret' };
    board.turrets.push({ row, col, destroyed: false });
    return { success: true, removed: false };
}

// ── Ship placement ────────────────────────────────────────────
function placeShip(board, orientation, size, startRow, startCol) {
    if (startRow < 0 || startRow >= ROWS || startCol < 1 || startCol > COLS)
        return { success: false, error: 'ตำแหน่งเกินขอบเขต' };

    // Check quota
    const existing = board.ships.filter(s => s.size === size).length;
    const quota = SHIP_QUOTA.find(q => q.size === size);
    if (!quota) return { success: false, error: `ขนาดเรือ ${size} ไม่ถูกต้อง` };
    if (existing >= quota.count)
        return { success: false, error: `เรือขนาด ${size} ช่อง วางได้สูงสุด ${quota.count} ลำ` };

    for (let i = 0; i < size; i++) {
        const r = orientation === 'horizontal' ? startRow : startRow + i;
        const c = orientation === 'horizontal' ? startCol + i : startCol;
        if (r >= ROWS || c > COLS) return { success: false, error: 'เรือยาวเกินกระดาน' };
        const cell = board.cells[r][c];
        if (cell.state === 'land') return { success: false, error: 'วางเรือบนดินไม่ได้' };
        if (cell.content === 'ship') return { success: false, error: 'ช่องนี้มีเรืออยู่แล้ว' };
    }

    const shipId = `ship-${Date.now()}-${Math.random().toString(36).substr(2,5)}`;
    for (let i = 0; i < size; i++) {
        const r = orientation === 'horizontal' ? startRow : startRow + i;
        const c = orientation === 'horizontal' ? startCol + i : startCol;
        board.cells[r][c] = { state: 'ship', content: 'ship', shipId };
    }
    board.ships.push({ id: shipId, size, orientation, startRow, startCol, hits: 0, sunk: false });
    return { success: true, shipId };
}

// ── Remove item ───────────────────────────────────────────────
function removeItem(board, row, col) {
    if (row < 0 || row >= ROWS || col < 1 || col > COLS)
        return { success: false, error: 'ตำแหน่งเกินขอบเขต' };

    const cell = board.cells[row][col];
    if (cell.content === 'ship') {
        const shipId = cell.shipId;
        for (let r = 0; r < ROWS; r++)
            for (let c = 1; c <= COLS; c++)
                if (board.cells[r][c].shipId === shipId)
                    board.cells[r][c] = { state: 'water', content: null };
        board.ships = board.ships.filter(s => s.id !== shipId);
    } else if (cell.content === 'turret') {
        board.cells[row][col] = { state: 'land', content: 'land' };
        board.turrets = board.turrets.filter(t => !(t.row === row && t.col === col));
    } else if (cell.content === 'land') {
        board.cells[row][col] = { state: 'water', content: null };
        board.lands = board.lands.filter(l => !(l.row === row && l.col === col));
    }
    return { success: true };
}

// ── Setup validation ──────────────────────────────────────────
function validateSetup(board) {
    const errors = [];

    // Land count
    if (board.lands.length !== LAND_LIMIT)
        errors.push(`ต้องวางดินครบ ${LAND_LIMIT} ช่อง (ตอนนี้ ${board.lands.length} ช่อง)`);

    // Island count
    if (board.lands.length > 0) {
        const iv = validateLandIslands(board);
        if (!iv.valid) errors.push(iv.error);
    }

    // Turrets
    if (board.turrets.length !== MAX_TURRETS)
        errors.push(`ต้องวางป้อมปืนครบ ${MAX_TURRETS} ป้อม (ตอนนี้ ${board.turrets.length} ป้อม)`);

    // Ships
    for (const q of SHIP_QUOTA) {
        const have = board.ships.filter(s => s.size === q.size).length;
        if (have !== q.count)
            errors.push(`เรือขนาด ${q.size} ช่อง ต้องมี ${q.count} ลำ (ตอนนี้ ${have} ลำ)`);
    }

    return { valid: errors.length === 0, errors };
}

// ── Bullet calculation ────────────────────────────────────────
function calcMaxBullets(board) {
    const aliveTurrets = board.turrets.filter(t => !t.destroyed).length;
    return BASE_BULLETS + aliveTurrets;
}

// ── Process attack ────────────────────────────────────────────
// Returns: { hit, what, refund, sunk, gameOver, row, col }
// what: 'ship' | 'turret' | 'land' | 'water'
// refund: true if bullet should be returned (hit land/turret on land)
function processAttack(board, row, col) {
    if (row < 0 || row >= ROWS || col < 1 || col > COLS)
        return { success: false, error: 'ตำแหน่งโจมตีไม่ถูกต้อง' };

    const cell = board.cells[row][col];

    // Already attacked
    if (cell.state === 'hit' || cell.state === 'miss') {
        return { alreadyAttacked: true, hit: false, row, col };
    }

    let result = { hit: false, what: 'water', refund: false, sunk: false, gameOver: false, row, col };

    if (cell.content === 'ship') {
        // Hit ship
        cell.state = 'hit';
        result.hit = true;
        result.what = 'ship';
        result.refund = false; // hitting water/ship = no refund

        const ship = board.ships.find(s => s.id === cell.shipId);
        if (ship) {
            ship.hits++;
            if (ship.hits >= ship.size) {
                ship.sunk = true;
                result.sunk = true;
                // Mark all cells of this ship as hit
                for (let r = 0; r < ROWS; r++)
                    for (let c = 1; c <= COLS; c++)
                        if (board.cells[r][c].shipId === ship.id)
                            board.cells[r][c].state = 'hit';
            }
        }
        result.gameOver = board.ships.every(s => s.sunk);

    } else if (cell.content === 'turret') {
        // Hit turret (on land)
        cell.state = 'hit';
        result.hit = true;
        result.what = 'turret';
        result.refund = true; // land hit = refund

        const turret = board.turrets.find(t => t.row === row && t.col === col);
        if (turret) turret.destroyed = true;

    } else if (cell.content === 'land') {
        // Hit bare land
        cell.state = 'hit';
        result.hit = true;
        result.what = 'land';
        result.refund = true; // land hit = refund

    } else {
        // Hit water — no refund, bullet lost
        cell.state = 'miss';
        result.hit = false;
        result.what = 'water';
        result.refund = false;
    }

    return result;
}

// ── Win condition ─────────────────────────────────────────────
function checkWinCondition(board) {
    return board.ships.length > 0 && board.ships.every(s => s.sunk);
}

module.exports = {
    createEmptyBoard,
    placeLand,
    placeTurret,
    placeShip,
    removeItem,
    validateSetup,
    validateLandIslands,
    calcMaxBullets,
    processAttack,
    checkWinCondition,
    ROWS, COLS, LAND_LIMIT, MAX_TURRETS, BASE_BULLETS, SHIP_QUOTA
};
