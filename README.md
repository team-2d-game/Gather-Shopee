# Gather Shopee - Không Gian Ảo Tương Tác 2D (Real-Time Virtual Space)

> Nền tảng không gian ảo tương tác thời gian thực 2D Top-Down lấy cảm hứng từ Gather.town, xây dựng trên nền tảng **TypeScript Full-Stack (Vite + React Canvas 2D + Node.js WebSocket)**.

---

## 🌟 Tính Năng Nổi Bật (Features)

1. **Đồng Bộ Không Gian Đa Người Chơi (Real-Time Multiplayer Sync)**:
   - Di chuyển mượt mà 8 hướng (WASD / Mũi tên), tích hợp thuật toán LERP (Linear Interpolation) trên client.
   - Hệ thống va chạm vật lý (Collision system) và phân vùng phòng kín (Zone detection).
   - Tùy biến nhân vật tự do (Skin tone, Màu tóc, Màu áo, Tên hiển thị).
   - Tư thế ngồi ghế tương tác (Nhấn phím `Z`).

2. **Giao Tiếp & Chat Đa Kênh Theo Cự Ly (Spatial & Proximity Chat)**:
   - **Kênh Toàn Bộ (Global)**: Trò chuyện toàn bản đồ.
   - **Kênh Gần Đây (Proximity)**: Chỉ nghe và chat với người trong bán kính ~6 ô gạch (<200px).
   - **Kênh Phòng Kín (Private Zone)**: Tự động cách âm khi bước vào Phòng Họp Alpha / Beta.
   - **Bong bóng thoại trên đầu (Overhead Speech Bubble)** xuất hiện tức thời khi nhân vật chat.
   - **Biểu cảm cảm xúc (Emotes)**: Thả tim ❤️, vẫy tay 👋, ăn mừng 🎉, cười 😂, cháy 🔥 nổi bồng bềnh.

3. **Gian Hàng Ảo & Vòng Quay May Mắn (Shopee Expo & Lucky Wheel)**:
   - **Gian hàng công nghệ & thời trang Shopee**: Xem sản phẩm, nhận mã Voucher độc quyền với pháo hoa giấy (confetti).
   - **Vòng quay may mắn (Lucky Wheel)**: Quay thưởng trúng voucher giảm giá hoặc 1.000 Xu Shopee thần tài.

4. **Khu Vực Làm Việc & Giải Trí (Work & Entertainment Stations)**:
   - **Bảng trắng cộng tác (Collaborative Whiteboard)**: Cùng vẽ phác thảo ý tưởng thời gian thực với bảng màu và nét vẽ tùy chỉnh.
   - **Bàn đấu Cờ Caro Gomoku 15x15**: 2 người chơi có thể ngồi vào ghế X và O thách đấu trực tiếp, tự động bắt lỗi và phát hiện 5 quân thẳng hàng.
   - **Bục phát biểu Megaphone**: Phát thanh thông báo chữ to nổi bật trên toàn bộ màn hình người tham gia.
   - **Cyber Jukebox (Piano)**: Đàn 8 nốt cơ bản bằng âm thanh tổng hợp Web Audio API, truyền âm thanh đến những người đứng gần.

5. **Minimap & Radar Tương Tác**:
   - Bản đồ thu nhỏ góc trên bên phải hiển thị chấm vàng (bản thân) và chấm xanh (người chơi khác) theo thời gian thực.

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy (Quick Start)

### Yêu cầu hệ thống:
- Node.js version 18+ (khuyên dùng Node.js 20 hoặc 24)
- npm version 9+

### Cách 1: Chạy đồng thời cả Server và Client (Khuyên dùng)
```bash
# Cài đặt toàn bộ dependencies cho root, server và client
npm run install:all

# Khởi chạy đồng thời cả Server (Port 3001) và Client (Port 5173)
npm run dev
```

### Cách 2: Chạy riêng biệt từng tiến trình

1. **Khởi chạy WebSocket Server**:
```bash
cd server
npm install
npm run dev
# Server lắng nghe tại: ws://localhost:3001 và http://localhost:3001/health
```

2. **Khởi chạy Web Client**:
```bash
cd client
npm install
npm run dev
# Mở trình duyệt tại: http://localhost:5173
```

---

## 🎮 Hướng Dẫn Phím Tắt (Keybindings)

| Phím | Chức năng |
|------|-----------|
| **W, A, S, D** hoặc **Mũi tên** | Di chuyển nhân vật 4 hướng hoặc 8 hướng chéo |
| **Phím E** | Tương tác với đồ vật/trạm ở gần (Bảng trắng, Gian hàng, Vòng quay, Bàn cờ, Bục phát biểu) |
| **Phím Z** | Ngồi xuống / Đứng dậy khỏi ghế |
| **Phím 1 - 8** | Bắn nhanh biểu cảm cảm xúc (Emotes) |
| **Click chuột** | Click vào gian hàng hoặc vật thể ở gần để mở nhanh |

---

## 🏗️ Cấu Trúc Dự Án (Project Architecture)

```
Gather_Shopee/
├── SPEC.md                      # Đặc tả kỹ thuật chi tiết
├── README.md                    # Hướng dẫn dự án
├── package.json                 # Quản lý script khởi chạy root
├── server/                      # WebSocket Real-Time Server
│   ├── src/
│   │   ├── index.ts             # Entry point HTTP & WebSocket listener
│   │   ├── config.ts            # Cấu hình map, tick rate (30Hz), proximity
│   │   ├── types.ts             # Giao thức WS messages & data models
│   │   ├── SpatialGrid.ts       # Tính toán cự ly & phân vùng phòng (AoI)
│   │   ├── RoomManager.ts       # Quản lý vòng đời kết nối, chat, sync
│   │   ├── ObjectManager.ts     # Trạng thái Whiteboard, Cờ Caro, Vòng quay
│   │   └── botSimulation.ts     # Script test tự động đa bot headless
└── client/                      # Vite + React + Canvas 2D Game
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx              # Kết nối Canvas Engine & React UI
    │   ├── index.css            # Dark Theme Glassmorphism
    │   ├── engine/
    │   │   ├── GameEngine.ts    # Vòng lặp game 60 FPS, Camera, Y-sorting
    │   │   ├── Tilemap.ts       # Render floor, tường, va chạm, đồ vật
    │   │   └── AudioSynth.ts    # Web Audio API tổng hợp âm thanh đa tần
    │   ├── network/
    │   │   └── socketClient.ts  # Quản lý WebSocket client & auto-reconnect
    │   └── components/          # HUD, ChatBox, EmotePicker, Modals
```
