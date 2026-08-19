# 📸 Polaroid Wall

เว็บแอปพลิเคชันกระดานโพลารอยด์สไตล์เรโทร (Retro Cork Board) สำหรับโปรเจกต์อบรม Docker, Containerization และ GCP Cloud Deployment 

ผู้เข้าร่วมอบรมสามารถสร้างการ์ดโพลารอยด์ของทีม อัปโหลดรูปถ่ายจริง ปักลงบนกระดานไม้คอร์กบอร์ดแบบ Full-Width พร้อมระบบคลิกพลิกการ์ด 3D Flip Card, การกดถูกใจ (Toggle Like) และการจัดการข้อมูล (CRUD) ครบวงจร

---

## ✨ ฟีเจอร์หลัก (Key Features)

- 🎨 **Retro Cork Board Design**: ดีไซน์กระดานไม้คอร์กบอร์ดเต็มจอโทนสีครีมอบอุ่น (`#FDF6E3`) พร้อมการ์ดโพลารอยด์ปักหมุดแดงเอียงสุ่มอย่างสมจริง
- 🔄 **3D Flip Card Interactive**: แตะ/คลิกที่การ์ดเพื่อพลิกดู:
  - **ด้านหน้า**: รูปถ่ายทีม, ชื่อทีม, ข้อความสั้น
  - **ด้านหลัง**: ข้อมูลสมาชิกคนที่ 1 & 2 (ชื่อ + รหัสนักศึกษา), วันเวลาที่ Deploy, ปุ่ม Like ❤️, ปุ่ม Edit ✏️, ปุ่ม Delete 🗑️
- 🪟 **Floating Modal Form**: หน้าต่างฟอร์มสไตล์เรโทรแบบ Modal Popup ช่วยให้หน้ากระดานสะอาดตา ไม่เกะกะ
- 📷 **Photo Upload System**: อัปโหลดรูปถ่ายจริง (JPG, PNG, GIF, WebP ไม่เกิน 5MB) พร้อมระบบพรีวิว หรือเลือกแปะเป็น Image URL ได้
- 💖 **Anti-Cheat 1-Like-per-Person**: ป้องกันการปั๊ม Like ด้วยระบบ Persistent Secure Cookie + ตาราง `card_likes` บน PostgreSQL พร้อม Unique Constraint
- 📱 **Fully Mobile Responsive**: รองรับทั้งสมาร์ตโฟน, แท็บเล็ต และคอมพิวเตอร์

---

## 🏗️ สถาปัตยกรรมระบบ (Tech Stack)

- **Frontend:** Next.js (App Router), React, Tailwind CSS v4, Framer Motion, Lucide Icons
- **Backend:** Next.js Route Handlers (REST API)
- **Database:** PostgreSQL 15 (Alpine) + node-postgres (`pg`)
- **Container & Deploy:** Docker (Multi-stage build), Docker Compose on Google Cloud VM

---

## 🚀 วิธีการรันด้วย Docker Compose (แนะนำ)

1. Clone repository นี้:
   ```bash
   git clone https://github.com/fuzzfizz/web-polaroid-wall.git
   cd web-polaroid-wall
   ```

2. สั่งรัน container ทั้งหมด (Web App + PostgreSQL Database):
   ```bash
   docker-compose up --build
   ```

3. เปิดเบราว์เซอร์ไปที่:
   ```
   http://localhost:3000
   ```

---

## 🛠️ วิธีการรันสำหรับ Local Development

1. ติดตั้ง Dependencies:
   ```bash
   npm install
   ```

2. สตาร์ท PostgreSQL Database:
   ```bash
   docker-compose up db
   ```

3. รัน Development Server:
   ```bash
   npm run dev
   ```

---

## 📦 สำหรับขั้นตอนการฝึกอบรม (Workshop Workflow on GCP VM)

1. **Build Docker Image** สำหรับโปรเจกต์:
   ```bash
   docker build -t <your-dockerhub-username>/polaroid-wall:latest .
   ```

2. **Push Image** ไปยัง Docker Hub:
   ```bash
   docker push <your-dockerhub-username>/polaroid-wall:latest
   ```

3. **เตรียมไฟล์บน Google Cloud VM**:
   สร้างโฟลเดอร์บน VM และวางไฟล์ `docker-compose.yml` และ `init.sql`

4. **สั่งรันบน VM**:
   ```bash
   docker-compose up -d
   ```

5. ให้สมาชิกทั้ง 2 คนในทีมเข้า URL ของ VM แล้วกรอกข้อมูลทีมและปักการ์ดส่งให้อาจารย์/ผู้ตรวจดูผลงาน

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/wall` | ดึงรายการการ์ดทั้งหมด พร้อมสถานะ `is_liked_by_me` |
| `POST` | `/api/wall` | สร้างการ์ดโพลารอยด์ใหม่ |
| `PUT` | `/api/wall/:id` | แก้ไขข้อมูลการ์ด |
| `DELETE` | `/api/wall/:id` | ลบการ์ด |
| `POST` | `/api/wall/:id/like` | กดถูกใจ / ยกเลิกถูกใจ (Toggle Like) |
| `POST` | `/api/upload` | อัปโหลดรูปภาพลงระบบ |
| `GET` | `/uploads/:filename` | Dynamic Image Handler สำหรับดึงรูปภาพที่อัปโหลด |
