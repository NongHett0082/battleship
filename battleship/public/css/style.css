/* public/css/style.css — Battleship Multiplayer shared styles */
@import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600;700&family=Share+Tech+Mono&display=swap');

:root {
    --ocean:   #0a1628;
    --deep:    #0d1f3c;
    --panel:   #111c33;
    --border:  #1e3a5f;
    --accent:  #f1c40f;
    --water:   #1565c0;
    --water-h: #1976d2;
    --green:   #27ae60;
    --red:     #e74c3c;
    --orange:  #e67e22;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
    font-family: 'Kanit', sans-serif;
    background: var(--ocean);
    color: white;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px 12px;
    background-image:
        radial-gradient(ellipse at 20% 20%, rgba(21,101,192,0.15) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, rgba(233,69,96,0.08) 0%, transparent 50%);
}

/* ── Typography ─────────────────────────────────────────────── */
h1 {
    font-size: 1.8rem; font-weight: 700; color: var(--accent);
    text-shadow: 0 0 20px rgba(241,196,15,0.5);
    letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px;
}
.sub {
    font-family: 'Share Tech Mono', monospace;
    color: #4a90b8; font-size: 0.72rem; letter-spacing: 3px; margin-bottom: 20px;
}

/* ── Panels ─────────────────────────────────────────────────── */
.panel {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 20px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}
.section-title {
    font-size: 0.62rem; font-family: 'Share Tech Mono', monospace;
    color: #4a90b8; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 10px;
}
.divider { border-bottom: 1px solid var(--border); margin: 12px 0; }

/* ── Buttons ─────────────────────────────────────────────────── */
.btn {
    width: 100%; padding: 11px 16px; margin: 3px 0;
    cursor: pointer; border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px; font-weight: 600;
    font-family: 'Kanit', sans-serif; font-size: 0.9rem;
    transition: all 0.2s; color: white;
    display: flex; align-items: center; gap: 8px;
}
.btn:hover   { filter: brightness(1.15); transform: translateY(-1px); }
.btn:active  { transform: translateY(0); }
.btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

.btn-land    { background: linear-gradient(135deg,#2e4a2a,#4a6741); }
.btn-ship    { background: linear-gradient(135deg,#1e8449,#27ae60); }
.btn-turret  { background: linear-gradient(135deg,#ca6f1e,#e67e22); }
.btn-rotate  { background: linear-gradient(135deg,#1a5276,#2980b9); font-size: 0.8rem; margin-top: 6px; }
.btn-primary { background: linear-gradient(135deg,#b7950b,#f1c40f); color: #000; font-weight: 700; }
.btn-secondary { background: linear-gradient(135deg,#1c2833,#2e4053); color: #aaa; font-size: 0.82rem; }
.btn-danger  { background: linear-gradient(135deg,#922b21,#e74c3c); }
.btn-blue    { background: linear-gradient(135deg,#1a5276,#2980b9); }
.btn-create  { background: linear-gradient(135deg,#1a5276,#2980b9); }
.btn-join    { background: linear-gradient(135deg,#1e8449,#27ae60); }
.btn-start   { background: linear-gradient(135deg,#b7950b,#f1c40f); color: #000; font-weight: 700; }

.btn.active, .active-mode {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
    box-shadow: 0 0 12px rgba(241,196,15,0.35);
}

/* ── Inputs ─────────────────────────────────────────────────── */
input, select {
    width: 100%; padding: 10px 14px;
    background: var(--deep); color: white;
    border: 1px solid var(--border); border-radius: 8px;
    margin-bottom: 10px; font-family: 'Kanit', sans-serif; font-size: 0.9rem;
    outline: none; transition: border-color 0.2s;
}
input:focus, select:focus { border-color: var(--accent); }
select { appearance: none; cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23f1c40f'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 12px center;
}
label { font-size: 0.78rem; color: #8ab; margin-bottom: 4px; display: block; }

/* ── Grid / Board ───────────────────────────────────────────── */
.grid {
    display: grid;
    grid-template-columns: 28px repeat(8, 44px);
    gap: 3px;
}
.cell {
    width: 44px; height: 44px; background: var(--water);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; border-radius: 4px;
    transition: filter 0.12s, transform 0.1s;
    position: relative; overflow: hidden;
}
.cell:hover        { filter: brightness(1.25); transform: scale(1.06); z-index: 2; }
.cell svg          { display: block; pointer-events: none; }
.header-cell {
    width: 28px; height: 44px; background: transparent; cursor: default;
    color: var(--accent); font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.75rem; font-family: 'Share Tech Mono', monospace;
}
.top-header { width: 44px; height: 28px; }

/* Cell states */
.land      { background: #3a5c35 !important; }
.ship      { background: #0e2240 !important; overflow: visible !important; }
.hit       { background: linear-gradient(135deg,#c0392b,#e74c3c) !important; }
.miss      { background: linear-gradient(135deg,#1a3a5c,#2980b9) !important; }
.hit::after  { content: '💥'; font-size: 13px; position: absolute; }
.miss::after { content: '💧'; font-size: 11px; position: absolute; }

/* ── Player dot / badges ────────────────────────────────────── */
.player-row {
    display: flex; align-items: center; gap: 8px;
    padding: 7px 10px; border-radius: 8px;
    background: rgba(255,255,255,0.04); margin-bottom: 5px;
}
.player-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.player-name { flex: 1; font-size: 0.85rem; }
.badge {
    font-size: 0.65rem; font-family: 'Share Tech Mono', monospace;
    padding: 2px 7px; border-radius: 4px;
}
.badge-host    { background: rgba(241,196,15,0.2); color: var(--accent); }
.badge-ready   { background: rgba(46,204,113,0.2); color: #2ecc71; }
.badge-waiting { background: rgba(52,152,219,0.15); color: #5dade2; }
.badge-you     { color: var(--accent); font-size: 0.65rem; font-family: 'Share Tech Mono', monospace; }
.badge-elim    { color: #c0392b; text-decoration: line-through; opacity: 0.5; }

/* ── Toast ──────────────────────────────────────────────────── */
#toast {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: var(--red); color: white; padding: 10px 24px;
    border-radius: 8px; font-size: 0.9rem; font-family: 'Kanit', sans-serif;
    display: none; z-index: 9999; box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    max-width: 90vw; text-align: center; white-space: pre-line;
}
#toast.ok { background: #27ae60; }

/* ── Modal overlay ──────────────────────────────────────────── */
.modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.75);
    display: none; z-index: 1000;
    align-items: center; justify-content: center;
}
.modal-overlay.show { display: flex; }
.modal-box {
    background: var(--panel); border-radius: 18px; padding: 36px;
    text-align: center; border: 2px solid var(--accent);
    box-shadow: 0 0 40px rgba(241,196,15,0.3); max-width: 360px; width: 90%;
}
.modal-box h2 { font-size: 1.8rem; color: var(--accent); margin-bottom: 8px; }
.modal-box p  { color: #bdc3c7; margin-bottom: 20px; font-size: 0.95rem; }

/* ── Legend ─────────────────────────────────────────────────── */
.legend { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; }
.legend-item { display: flex; align-items: center; gap: 5px; font-size: 0.7rem; color: #8ab; }
.legend-dot  { width: 12px; height: 12px; border-radius: 3px; }

/* ── Room code display ──────────────────────────────────────── */
.room-code-box {
    background: var(--deep); border: 2px solid var(--accent);
    border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 14px;
}
.room-code-box .code {
    font-family: 'Share Tech Mono', monospace;
    font-size: 2.6rem; color: var(--accent); letter-spacing: 10px; font-weight: 700;
}
.room-code-box p { font-size: 0.72rem; color: #8ab; margin-top: 6px; }

/* ── Bullet bar ─────────────────────────────────────────────── */
.bullet-bar {
    display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    background: var(--panel); border: 1px solid var(--border);
    border-radius: 10px; padding: 10px 16px;
    width: 100%; max-width: 860px; margin-bottom: 12px;
}
.bullet-label { font-family: 'Share Tech Mono', monospace; font-size: 0.7rem; color: #4a90b8; white-space: nowrap; }
.bullets-row  { display: flex; gap: 5px; flex-wrap: wrap; }
.bullet-icon  { font-size: 1.2rem; transition: transform 0.2s, opacity 0.3s; }
.bullet-icon.spent { opacity: 0.18; transform: scale(0.75); }
.bullet-info  { font-family: 'Share Tech Mono', monospace; font-size: 0.7rem; color: #555; }

/* ── Turn banner ────────────────────────────────────────────── */
.turn-banner {
    width: 100%; max-width: 860px;
    padding: 10px 20px; border-radius: 10px;
    font-weight: 700; font-size: 1rem; margin-bottom: 8px;
    border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    gap: 12px; flex-wrap: wrap; transition: background 0.3s;
}
.turn-banner.my-turn {
    background: linear-gradient(135deg,#1e6e3a,#27ae60);
    border-color: #27ae60;
    animation: pulse-green 1.5s ease-in-out infinite;
}
.turn-banner.other-turn { background: #1a2a3a; }
@keyframes pulse-green {
    0%,100% { box-shadow: 0 0 0 0 rgba(46,204,113,0.3); }
    50%      { box-shadow: 0 0 0 8px rgba(46,204,113,0); }
}

/* ── Log ────────────────────────────────────────────────────── */
.log-wrap {
    font-family: 'Share Tech Mono', monospace; font-size: 0.68rem;
    max-height: 160px; overflow-y: auto;
    display: flex; flex-direction: column; gap: 2px;
}
.log-hit   { color: #e74c3c; }
.log-miss  { color: #3498db; }
.log-sunk  { color: var(--accent); font-weight: 700; }
.log-elim  { color: #9b59b6; font-weight: 700; }
.log-info  { color: #555; }

/* ── Ship picker ────────────────────────────────────────────── */
.ship-pick-btn {
    width: 100%; padding: 7px 10px; margin: 2px 0;
    background: var(--deep); border: 1px solid var(--border);
    border-radius: 6px; color: #bdc3c7;
    font-family: 'Kanit', sans-serif; font-size: 0.78rem;
    cursor: pointer; display: flex; justify-content: space-between;
    align-items: center; transition: all 0.15s;
}
.ship-pick-btn:hover          { border-color: #2980b9; color: white; }
.ship-pick-btn.active-ship    { border-color: var(--accent); color: white; background: #1a3a5c; }
.ship-pick-btn.quota-full     { opacity: 0.4; cursor: default; }

/* ── Quota tracker ──────────────────────────────────────────── */
.quota-box { background: var(--deep); border: 1px solid var(--border); border-radius: 10px; padding: 12px; margin-top: 8px; }
.quota-box h4 { font-size: 0.6rem; font-family: 'Share Tech Mono', monospace; color: #4a90b8; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 10px; }
.quota-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; font-size: 0.78rem; }
.quota-label { color: #bdc3c7; }
.quota-val   { font-family: 'Share Tech Mono', monospace; font-size: 0.75rem; }
.q-ok   { color: #2ecc71; }
.q-warn { color: #f39c12; }
.q-err  { color: #e74c3c; }

/* ── Target selector ────────────────────────────────────────── */
.target-btn {
    width: 100%; padding: 8px 12px; margin-bottom: 5px;
    border-radius: 8px; border: 2px solid transparent;
    background: var(--deep); cursor: pointer;
    display: flex; align-items: center; gap: 8px;
    font-family: 'Kanit', sans-serif; font-size: 0.85rem; color: white;
    transition: all 0.2s;
}
.target-btn:hover       { border-color: rgba(255,255,255,0.25); filter: brightness(1.2); }
.target-btn.selected    { border-color: var(--accent); background: #1a3a5c; box-shadow: 0 0 8px rgba(241,196,15,0.3); }
.target-btn.eliminated  { opacity: 0.3; cursor: not-allowed; text-decoration: line-through; }
.target-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
