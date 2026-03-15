<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Battleship — Lobby</title>
    <link rel="stylesheet" href="css/style.css">
    <script src="/socket.io/socket.io.js"></script>
    <script src="js/socketClient.js"></script>
    <style>
        .lobby-wrap { display:flex; flex-wrap:wrap; gap:20px; justify-content:center; width:100%; max-width:920px; }
        .card { width:280px; }
        .card-room { width:100%; max-width:560px; display:none; }
        .range-row { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
        input[type=range] { flex:1; accent-color:var(--accent); }
        #max-val { color:var(--accent); font-weight:700; }
        .waiting-msg { font-family:'Share Tech Mono',monospace; color:#4a90b8; font-size:0.72rem; text-align:center; margin:10px 0; }
        .rules-box { background:var(--deep); border:1px solid var(--border); border-radius:10px; padding:14px; font-size:0.78rem; color:#8ab; line-height:1.7; margin-top:16px; }
        .rules-box h4 { color:var(--accent); font-size:0.7rem; font-family:'Share Tech Mono',monospace; letter-spacing:2px; text-transform:uppercase; margin-bottom:8px; }
        .rules-box li { margin-left:16px; margin-bottom:3px; }
    </style>
</head>
<body>
<h1>⚓ Battleship</h1>
<p class="sub">MULTIPLAYER · 2–10 PLAYERS</p>

<div class="lobby-wrap">

    <!-- CREATE -->
    <div class="panel card">
        <div class="section-title">🏠 สร้างห้องใหม่</div>
        <label>ชื่อของคุณ</label>
        <input type="text" id="host-name" placeholder="กรอกชื่อ..." maxlength="20">
        <label>จำนวนผู้เล่นสูงสุด (<span id="max-val">4</span> คน)</label>
        <div class="range-row">
            <span style="color:#8ab;font-size:0.75rem">2</span>
            <input type="range" id="max-players" min="2" max="10" value="4">
            <span style="color:#8ab;font-size:0.75rem">10</span>
        </div>
        <button class="btn btn-create" onclick="createRoom()">+ สร้างห้อง</button>
    </div>

    <!-- JOIN -->
    <div class="panel card">
        <div class="section-title">🚪 เข้าร่วมห้อง</div>
        <label>รหัสห้อง (4 ตัว)</label>
        <input type="text" id="room-code" placeholder="เช่น AB12" maxlength="4"
            style="text-transform:uppercase;letter-spacing:5px;font-family:'Share Tech Mono',monospace;font-size:1.3rem;text-align:center">
        <label>ชื่อของคุณ</label>
        <input type="text" id="join-name" placeholder="กรอกชื่อ..." maxlength="20">
        <button class="btn btn-join" onclick="joinRoom()">→ เข้าร่วม</button>
    </div>

    <!-- ROOM LOBBY (after create/join) -->
    <div class="panel card-room" id="room-card">
        <div class="room-code-box">
            <div class="code" id="display-code">----</div>
            <p>แชร์รหัสนี้ให้เพื่อน</p>
        </div>
        <div class="waiting-msg" id="waiting-msg">รอผู้เล่นเพิ่มเติม...</div>
        <div id="player-list" style="margin-bottom:12px"></div>
        <button class="btn btn-start" id="start-btn" onclick="startSetup()" style="display:none">▶ เริ่มเกม!</button>
    </div>

    <!-- RULES -->
    <div class="panel" style="width:100%;max-width:560px">
        <div class="rules-box">
            <h4>📖 กฎการเล่น</h4>
            <ul>
                <li>วางดิน <b>12 ช่อง</b> ได้สูงสุด <b>2 เกาะ</b></li>
                <li>วางป้อมปืน <b>3 ป้อม</b> (แต่ละป้อม = +1 กระสุน)</li>
                <li>วางเรือ <b>5 ลำ</b>: ขนาด 4, 3, 2, 1, 1 ช่อง</li>
                <li>เริ่มต้น <b>4 กระสุน/เทิร์น</b> (1 ฐาน + 3 จากป้อม)</li>
                <li>ต้อง <b>กระจายกระสุน</b> ยิงทุกคนก่อนยิงซ้ำ</li>
                <li>ยิงโดน<b>ดิน/ป้อม</b> → คืนกระสุน | ยิงโดน<b>น้ำ/เรือ</b> → เสียกระสุน</li>
                <li>เมื่อถูกยิง → บอกแค่ <b>"โดน"</b> หรือ <b>"ล่ม"</b> เท่านั้น</li>
            </ul>
        </div>
    </div>

</div>
<div id="toast"></div>

<script>
let myId=null, myRoomCode=null, isHost=false;

document.getElementById('max-players').addEventListener('input',function(){
    document.getElementById('max-val').textContent=this.value;
});
document.getElementById('room-code').addEventListener('input',function(){
    this.value=this.value.toUpperCase();
});

function init(){
    SC.connect();
    SC.on('connect',()=>{ myId=SC.id; });

    SC.on('roomCreated',(d)=>{
        myId=d.playerId; myRoomCode=d.roomCode; isHost=true;
        document.getElementById('display-code').textContent=d.roomCode;
        showRoomCard();
    });
    SC.on('roomJoined',(d)=>{
        myId=d.playerId; myRoomCode=d.roomCode; isHost=false;
        document.getElementById('display-code').textContent=d.roomCode;
        showRoomCard();
    });
    SC.on('roomState',(d)=>renderRoomState(d));
    SC.on('hostChanged',(d)=>{
        if(d.newHostId===myId){ isHost=true; toast('คุณเป็น Host คนใหม่แล้ว',true); }
    });
    SC.on('setupPhaseStart',(d)=>{
        const name=encodeURIComponent(
            document.getElementById('host-name').value.trim() ||
            document.getElementById('join-name').value.trim() || ''
        );
        window.location.href=`setup.html?room=${myRoomCode}&player=${myId}&name=${name}`;
    });
    SC.on('error',(d)=>toast(d.message));
}

function showRoomCard(){
    document.getElementById('room-card').style.display='block';
    document.querySelector('.card').style.display='none';
    document.querySelectorAll('.card')[1].style.display='none';
    // hide second card too
    document.querySelectorAll('.panel.card').forEach(c=>c.style.display='none');
}

function renderRoomState(d){
    const list=document.getElementById('player-list');
    list.innerHTML=d.players.map(p=>`
        <div class="player-row">
            <div class="player-dot" style="background:${p.color}"></div>
            <span class="player-name">${p.name}</span>
            ${p.isHost?'<span class="badge badge-host">HOST</span>':''}
            ${p.ready?'<span class="badge badge-ready">✓ พร้อม</span>':''}
            ${p.socketId===myId?'<span class="badge-you">คุณ</span>':''}
        </div>`).join('');

    const canStart=isHost&&d.players.length>=2;
    const btn=document.getElementById('start-btn');
    btn.style.display=isHost?'flex':'none';
    btn.disabled=!canStart;
    btn.textContent=canStart?`▶ เริ่มเกม! (${d.players.length} คน)`:`รอผู้เล่รอีก ${2-d.players.length} คน...`;
    document.getElementById('waiting-msg').textContent=
        d.players.length<2?'รอผู้เล่นเพิ่มเติม...':isHost?'พร้อมเริ่มได้!':'รอ Host กดเริ่ม...';
}

function createRoom(){
    const name=document.getElementById('host-name').value.trim();
    const max=parseInt(document.getElementById('max-players').value);
    if(!name){toast('กรุณาใส่ชื่อ');return;}
    SC.createRoom(name,max);
}
function joinRoom(){
    const code=document.getElementById('room-code').value.trim().toUpperCase();
    const name=document.getElementById('join-name').value.trim();
    if(code.length<4){toast('กรุณาใส่รหัส 4 ตัว');return;}
    if(!name){toast('กรุณาใส่ชื่อ');return;}
    SC.joinRoom(code,name);
}
function startSetup(){
    if(isHost&&myRoomCode) SC.startSetup(myRoomCode);
}

function toast(msg,ok=false){
    const t=document.getElementById('toast');
    t.textContent=msg; t.className=ok?'ok':'';
    t.style.display='block';
    setTimeout(()=>t.style.display='none',3000);
}

['host-name'].forEach(id=>document.getElementById(id)?.addEventListener('keypress',e=>{if(e.key==='Enter')createRoom();}));
['room-code','join-name'].forEach(id=>document.getElementById(id)?.addEventListener('keypress',e=>{if(e.key==='Enter')joinRoom();}));

init();
</script>
</body>
</html>
