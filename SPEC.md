# VIRTUAL SPACE - GATHER SHOPEE (SPECIFICATION)

> **Dự án**: Gather Shopee - Nền tảng không gian ảo tương tác thời gian thực 2D  
> **Kiến trúc**: TypeScript Full-Stack (Client: Vite + React + Canvas 2D Engine; Server: Node.js + WebSocket)  
> **Phiên bản**: 1.0.0 (MVP+)

---

## 1. TỔNG QUAN HỆ THỐNG (SYSTEM OVERVIEW)

Gather Shopee là một không gian ảo tương tác thời gian thực phong cách 2D Top-Down (tương tự Gather.town), cho phép nhiều người dùng kết nối qua trình duyệt web:
- Tự do tùy biến nhân vật (tên, màu sắc, trang phục, status).
- Di chuyển nhân vật trong bản đồ 2D liên hoàn với hệ thống va chạm (collision), tầm nhìn (Area of Interest), và phân vùng phòng họp (Private Acoustic Zones).
- Giao tiếp đa tầng: Proximity Speech Bubbles (bong bóng chat trên đầu theo khoảng cách), Global Chat, Private Zone Chat, và biểu cảm động (Emote Reactions).
- Tương tác đồ vật phong phú (nhấn phím `E` hoặc Click):
  - **Bàn họp (Meeting Area)**: Ngồi vào ghế, thảo luận riêng tư trong vùng cách âm.
  - **Bảng trắng cộng tác (Collaborative Whiteboard)**: Cùng vẽ phác thảo thời gian thực.
  - **Shopee Booth & Vòng quay may mắn (Lucky Wheel)**: Tương tác gian hàng, quay thưởng nhận voucher ảo.
  - **Khu trò chơi (Arcade Zone)**: Minigame Cờ Caro (Gomoku) hoặc Đố vui thách đấu trực tiếp.
  - **Bục phát biểu (Podium Stage)**: Phát biểu thông báo toàn không gian (Megaphone Broadcast).
  - **Jukebox / Piano**: Phát âm thanh tổng hợp (Web Audio API) cho những người xung quanh.

---

## 2. KIẾN TRÚC HỆ THỐNG & TECH STACK

### 2.1 Backend (Real-Time WebSocket Server)
- **Runtime**: Node.js v24+ (TypeScript / ES Module).
- **Core Engine**: `ws` (Lightweight, high-performance WebSocket server) + `node:http`.
- **State Management**:
  - `RoomManager`: Quản lý các phòng và phân vùng không gian.
  - `SpatialGrid`: Chia bản đồ thành các ô lưới (Grid partitioning) để tối ưu hóa tính toán khoảng cách và phát sóng (broadcast) chỉ tới các client liên quan.
  - `ObjectManager`: Quản lý trạng thái các đối tượng tương tác (bảng vẽ whiteboard, trạng thái ghế ngồi, minigame room).
- **Tick-rate**: Server loop 20-30Hz cho việc đồng bộ chuyển động và kiểm tra tính hợp lệ (anti-cheat position checks).

### 2.2 Frontend (Web Client)
- **Framework**: React 18+ với Vite & TypeScript.
- **Styling**: Tailwind CSS & Glassmorphism Design System (phong cách hiện đại, tối ưu cho cả desktop và tablet).
- **Rendering Layer**: Custom HTML5 Canvas 2D Game Renderer:
  - Tối ưu 60 FPS với `requestAnimationFrame`.
  - Hỗ trợ Camera Viewport theo dõi người chơi, Tilemap đa lớp (Floor, Walls, Furniture, Foreground).
  - Interpolation (LERP) mượt mà cho các remote players, loại bỏ hiện tượng giật lag khi ping mạng biến động.
- **Audio Engine**: Web Audio API tổng hợp âm thanh đa tần (Footsteps, Emote sounds, Door chimes, Jukebox notes) mà không phụ thuộc file media ngoài.

---

## 3. WEBSOCKET PROTOCOL SPECIFICATION

Giao thức truyền thông điệp dạng JSON qua WebSocket với định dạng chung:
```typescript
interface WSMessage<T = any> {
  type: string;
  senderId?: string;
  timestamp: number;
  payload: T;
}
```

### 3.1 Client -> Server Messages
- `JOIN_SPACE`: `{ name: string, skin: PlayerSkin, customColor: string }`
- `PLAYER_MOVE`: `{ x: number, y: number, dir: 'up'|'down'|'left'|'right', isMoving: boolean }`
- `CHAT_MESSAGE`: `{ text: string, channel: 'global' | 'proximity' | 'zone', zoneId?: string }`
- `EMOTE`: `{ emote: string }` (ví dụ: 'wave', 'heart', 'clap', 'laugh', 'fire')
- `INTERACT_OBJECT`: `{ objectId: string, action: string, data?: any }`
- `UPDATE_STATUS`: `{ status: string, customStatus?: string }`
- `WHITEBOARD_DRAW`: `{ x0: number, y0: number, x1: number, y1: number, color: string, width: number }`
- `MINIGAME_ACTION`: `{ gameId: string, action: string, payload: any }`

### 3.2 Server -> Client Messages
- `INIT_WORLD`: `{ selfId: string, worldMap: WorldMapData, players: Player[], objects: WorldObject[] }`
- `PLAYER_JOINED`: `{ player: Player }`
- `PLAYER_LEFT`: `{ id: string }`
- `PLAYERS_SYNC`: `{ positions: Array<{ id: string, x: number, y: number, dir: string, isMoving: boolean }> }`
- `CHAT_BROADCAST`: `{ id: string, senderId: string, senderName: string, text: string, channel: string, x: number, y: number, timestamp: number }`
- `EMOTE_TRIGGER`: `{ senderId: string, emote: string }`
- `OBJECT_UPDATED`: `{ objectId: string, state: any }`
- `WHITEBOARD_SYNC`: `{ lines: DrawLine[] }`
- `BROADCAST_ANNOUNCEMENT`: `{ senderName: string, message: string }`

---

## 4. BẢN ĐỒ & KHÔNG GIAN TƯƠNG TÁC (MAP LAYOUT & ZONES)

Bản đồ được thiết kế với kích thước 60x40 ô lưới (Tile size 32x32 px):
1. **The Grand Lounge (Sảnh trung tâm)**: Khu vực xuất hiện (Spawn point) với thảm tiếp tân, cây xanh, đài phun nước và bảng tin thông báo.
2. **Shopee Expo Pavilion (Gian hàng Shopee)**:
   - Các gian hàng giới thiệu sản phẩm tương tác (Pop-up modal xem hàng).
   - Vòng quay may mắn (Lucky Wheel): Quay nhận voucher giảm giá ảo hoặc coin.
3. **Meeting Rooms & Private Zones (Phòng họp riêng tư)**:
   - 2 phòng họp riêng (Alpha & Beta) có cửa kính và bàn hội nghị lớn.
   - Hiệu ứng Private Bubble: Khi bước vào phòng, chat và âm thanh chỉ chia sẻ với người trong cùng phòng.
   - Bàn ghế có thể ngồi (`Press E to sit`).
4. **Co-working & Whiteboard Station**:
   - Bàn làm việc với Bảng vẽ tương tác thời gian thực (Collaborative Canvas).
5. **Gaming Lounge (Khu giải trí)**:
   - Bàn cờ Caro 2 người chơi tương tác.
   - Máy phát nhạc Jukebox chơi phím đàn Piano qua Web Audio.
6. **Town Hall / Podium Stage (Bục phát biểu)**:
   - Khi đứng lên bục, người chơi kích hoạt chế độ "Megaphone" thông báo chữ to và hiệu ứng phát sáng toàn bản đồ.

---

## 5. THIẾT KẾ GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG (UI/UX)

- **HUD Overlay**:
  - Top-left: Thông tin phòng, số người online, trạng thái kết nối WebSocket & ping.
  - Top-right: Minimap tương tác thu nhỏ hiển thị vị trí tất cả người chơi.
  - Bottom-center: Thanh công cụ nhanh (Emotes bar, Mic/Audio toggle, Sit button, Settings).
  - Bottom-left: Cửa sổ Chat thời gian thực với các tab (All, Gần đây, Phòng họp) và bong bóng chat nổi bật.
  - Right: Danh sách người tham gia (Participant List) với avatar, tên và status.
- **Visual Aesthetics**:
  - Giao diện Dark theme cao cấp, phối màu Modern Neon & Indigo Glassmorphism (phù hợp với tiêu chuẩn thẩm mỹ cao cấp).
  - Micro-animations mượt mà cho avatar, bóng đổ nhân vật, và hiệu ứng hạt (particles) khi tương tác.

---

## 6. KẾ HOẠCH TRIỂN KHAI (PHASES)

- **Phase 1: Project Setup & Real-time Server Foundation**
  - Khởi tạo monorepo / cấu trúc client-server đồng nhất.
  - Thiết lập WebSocket Server với `ws`, quản lý connection lifecycle, heartbeat, và spatial state.
- **Phase 2: Client Canvas Engine & Multiplayer Movement**
  - Xây dựng 2D Tilemap Renderer & Camera follow player.
  - Client prediction & smooth lerp cho remote avatars.
  - Hệ thống va chạm (Collision system) và phân vùng phòng (Zone triggers).
- **Phase 3: Communication & Proximity Chat**
  - Chat box đa kênh với bộ lọc khoảng cách Proximity.
  - Bong bóng thoại (Speech Bubbles) hiển thị trực tiếp trên đầu avatar trong canvas.
  - Hệ thống biểu cảm (Emotes) hoạt họa.
- **Phase 4: Interactive Stations & Minigames**
  - Bảng trắng vẽ cộng tác thời gian thực (Shared Whiteboard).
  - Shopee Booth & Vòng quay may mắn (Lucky Wheel).
  - Bàn cờ Caro tương tác 2 người chơi (Gomoku).
  - Jukebox âm thanh Web Audio API.
  - Bục phát biểu toàn không gian (Podium Broadcast).
- **Phase 5: UI Polish, Minimap, Sound Effects & Verification**
  - Tích hợp Minimap, Player List, Audio Synthesizer cho hiệu ứng bước chân và tương tác.
  - Kiểm thử tải nhiều client đồng thời qua automation script.
