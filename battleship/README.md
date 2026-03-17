# ⚓ Battleship Multiplayer

เกม Battleship ออนไลน์ 2-10 คน ภาษาไทย

## โครงสร้างไฟล์

```
battleship/
├── server/
│   ├── server.js        ← Express + Socket.io server
│   ├── roomManager.js   ← จัดการห้องและผู้เล่น
│   └── gameLogic.js     ← กฎเกมทั้งหมด
├── public/
│   ├── lobby.html       ← หน้าสร้าง/เข้าห้อง
│   ├── setup.html       ← หน้าวางเรือ
│   ├── battle.html      ← หน้าต่อสู้
│   ├── css/style.css    ← CSS รวม
│   └── js/socketClient.js ← Socket wrapper
├── package.json
├── render.yaml
└── .gitignore
```

## รันในเครื่อง (Local)

```bash
npm install
npm start
# เปิด http://localhost:3000/lobby.html
```

## Deploy บน Render.com (ฟรี)

1. Push code ขึ้น GitHub
2. ไปที่ [render.com](https://render.com) → New → Web Service
3. เชื่อม GitHub repo
4. ตั้งค่า:
   - **Build Command:** `npm install`
   - **Start Command:** `node server/server.js`
   - **Environment:** `Node`
5. กด Deploy → รอ 2-3 นาที
6. รับ URL เช่น `https://battleship-multiplayer.onrender.com`

> ⚠️ Render free tier จะ sleep หลัง 15 นาทีไม่มีคนใช้ ครั้งแรกโหลดช้า ~30 วินาที

## กฎเกม

- **สนาม:** 8×6 ช่อง
- **ดิน:** 12 ช่อง, สูงสุด 2 เกาะ
- **ป้อมปืน:** 3 ป้อม (แต่ละป้อม = +1 กระสุน/เทิร์น)
- **เรือ:** 5 ลำ (4, 3, 2, 1, 1 ช่อง)
- **กระสุน:** 1 ฐาน + จำนวนป้อมที่เหลือ = สูงสุด 4 นัด/เทิร์น
- **Spread:** ต้องกระจายยิงทุกคนก่อนยิงซ้ำ
- **Refund:** โดนดิน/ป้อม = คืนกระสุน | โดนน้ำ/เรือ = เสียกระสุน
- **Log:** เฉพาะผู้โจมตีและเป้าหมายเห็น detail | คนอื่นเห็นแค่ "โดน/พลาด/ล่ม"
