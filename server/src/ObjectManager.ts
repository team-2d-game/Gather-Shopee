import { WorldObject, DrawLine, CaroGameState } from './types.js';
import { SERVER_CONFIG } from './config.js';

export class ObjectManager {
  private objects: Map<string, WorldObject> = new Map();
  private whiteboardLines: DrawLine[] = [];
  private caroGame: CaroGameState;

  constructor() {
    this.caroGame = this.initCaroGame();
    this.initDefaultObjects();
  }

  private initCaroGame(): CaroGameState {
    const board: Array<Array<'X' | 'O' | null>> = [];
    for (let r = 0; r < 15; r++) {
      board.push(new Array(15).fill(null));
    }
    return {
      id: 'caro-board-1',
      playerX: null,
      playerO: null,
      board,
      currentTurn: 'X',
      winner: null
    };
  }

  private initDefaultObjects(): void {
    // 1. Collaborative Whiteboard in Co-working Zone
    this.addObject({
      id: 'whiteboard-1',
      type: 'whiteboard',
      x: 480,
      y: 352,
      width: 96,
      height: 64,
      name: 'Bảng Trắng Sáng Tạo (Live Canvas)',
      interactionPrompt: 'Nhấn [E] để vẽ cùng mọi người'
    });

    // 2. Shopee Tech Booth
    this.addObject({
      id: 'shopee-booth-1',
      type: 'shopee_booth',
      x: 1344,
      y: 320,
      width: 96,
      height: 80,
      name: 'Shopee Tech & Gadget Zone',
      interactionPrompt: 'Nhấn [E] để xem gian hàng công nghệ',
      state: {
        title: 'Gian Hàng Công Nghệ Shopee',
        category: 'Tech & Electronics',
        products: [
          { id: 'p1', name: 'Bàn Phím Cơ Shopee Cyber RGB', price: '799.000đ', tag: 'Bán chạy', rating: 4.9 },
          { id: 'p2', name: 'Chuột Không Dây Ergonomic Pro', price: '450.000đ', tag: 'Sale 30%', rating: 4.8 },
          { id: 'p3', name: 'Tai Nghe Chống Ồn Spatial Audio', price: '1.290.000đ', tag: 'Mới', rating: 5.0 }
        ]
      }
    });

    // 3. Shopee Fashion Booth
    this.addObject({
      id: 'shopee-booth-2',
      type: 'shopee_booth',
      x: 1568,
      y: 320,
      width: 96,
      height: 80,
      name: 'Shopee Lifestyle & Merch',
      interactionPrompt: 'Nhấn [E] để xem quà lưu niệm Shopee',
      state: {
        title: 'Quầy Thời Trang & Phụ Kiện',
        category: 'Fashion & Merchandise',
        products: [
          { id: 'p4', name: 'Áo Hoodie Gather Shopee 2026', price: '320.000đ', tag: 'Độc quyền', rating: 4.9 },
          { id: 'p5', name: 'Gối Ôm Shopee Cực Êm', price: '180.000đ', tag: 'Yêu thích', rating: 5.0 },
          { id: 'p6', name: 'Bình Giữ Nhiệt Shopee Smart LED', price: '250.000đ', tag: 'Hot', rating: 4.7 }
        ]
      }
    });

    // 4. Lucky Wheel Station
    this.addObject({
      id: 'lucky-wheel-1',
      type: 'lucky_wheel',
      x: 1472,
      y: 544,
      width: 64,
      height: 64,
      name: 'Vòng Quay May Mắn Shopee',
      interactionPrompt: 'Nhấn [E] để quay nhận Voucher khủng!'
    });

    // 5. Caro Gaming Table
    this.addObject({
      id: 'caro-board-1',
      type: 'caro_board',
      x: 480,
      y: 928,
      width: 96,
      height: 80,
      name: 'Bàn Đấu Cờ Caro Gomoku (2 Người)',
      interactionPrompt: 'Nhấn [E] để thách đấu Cờ Caro'
    });

    // 6. Megaphone Podium Stage
    this.addObject({
      id: 'podium-1',
      type: 'podium',
      x: 960,
      y: 224,
      width: 64,
      height: 48,
      name: 'Bục Phát Biểu (Megaphone Stage)',
      interactionPrompt: 'Nhấn [E] để phát thanh toàn bản đồ'
    });

    // 7. Cyber Jukebox
    this.addObject({
      id: 'jukebox-1',
      type: 'jukebox',
      x: 672,
      y: 928,
      width: 64,
      height: 64,
      name: 'Hộp Nhạc Giai Điệu (Jukebox)',
      interactionPrompt: 'Nhấn [E] để hòa tấu giai điệu'
    });

    // 8. Weapon Pickup 1: Rainbow Lollipop Blade (Lobby)
    this.addObject({
      id: 'weapon-candy-blade',
      type: 'weapon_pickup',
      x: 768,
      y: 544,
      width: 48,
      height: 48,
      name: 'Kiếm Kẹo Mút Cầu Vồng',
      interactionPrompt: 'Nhấn [E] để nhặt Kiếm Kẹo Mút 🍭',
      state: {
        weaponType: 'candy_blade',
        name: 'Kiếm Kẹo Mút Cầu Vồng',
        icon: '🍭',
        damage: 25,
        range: 60,
        description: 'Vệt chém cầu vồng rực rỡ và ngọt ngào'
      }
    });

    // 9. Weapon Pickup 2: Squeaky Toy Hammer (Arcade)
    this.addObject({
      id: 'weapon-toy-hammer',
      type: 'weapon_pickup',
      x: 416,
      y: 1024,
      width: 48,
      height: 48,
      name: 'Búa Đồ Chơi Shopee',
      interactionPrompt: 'Nhấn [E] để nhặt Búa Đồ Chơi 🔨',
      state: {
        weaponType: 'toy_hammer',
        name: 'Búa Đồ Chơi Shopee',
        icon: '🔨',
        damage: 35,
        range: 50,
        description: 'Đập choáng váng tóe sao vàng kèm tiếng kêu chít chít'
      }
    });

    // 10. Weapon Pickup 3: Star Magical Wand (Stage)
    this.addObject({
      id: 'weapon-star-wand',
      type: 'weapon_pickup',
      x: 1088,
      y: 224,
      width: 48,
      height: 48,
      name: 'Gậy Phép Thuật Ngôi Sao',
      interactionPrompt: 'Nhấn [E] để nhặt Gậy Phép Thuật 🪄',
      state: {
        weaponType: 'star_wand',
        name: 'Gậy Phép Thuật Ngôi Sao',
        icon: '🪄',
        damage: 20,
        range: 75,
        description: 'Vung ra mưa sao băng và trái tim hồng lấp lánh'
      }
    });

    // 11. Weapon Pickup 4: Duckie Water Blaster (Garden Fountain)
    this.addObject({
      id: 'weapon-water-gun',
      type: 'weapon_pickup',
      x: 1120,
      y: 704,
      width: 48,
      height: 48,
      name: 'Súng Nước Vịt Vàng',
      interactionPrompt: 'Nhấn [E] để nhặt Súng Nước 🔫',
      state: {
        weaponType: 'water_gun',
        name: 'Súng Nước Vịt Vàng',
        icon: '🔫',
        damage: 15,
        range: 125,
        description: 'Bắn tia nước bong bóng mát rượi tầm xa'
      }
    });

    // 12. Mount Station 1: Shopee Delivery Kart (Lobby)
    this.addObject({
      id: 'mount-kart-1',
      type: 'mount_station',
      x: 640,
      y: 540,
      width: 54,
      height: 48,
      name: 'Xe Siêu Tốc Shopee',
      interactionPrompt: 'Nhấn [E] để Lái Xe Shopee 🚗 (Tốc độ +80%)',
      state: {
        mountType: 'kart',
        name: 'Xe Siêu Tốc Shopee',
        icon: '🚗',
        speedMultiplier: 1.8
      }
    });

    // 13. Mount Station 2: Rainbow Pony (Garden)
    this.addObject({
      id: 'mount-horse-1',
      type: 'mount_station',
      x: 1024,
      y: 768,
      width: 54,
      height: 48,
      name: 'Ngựa Thần Cầu Vồng',
      interactionPrompt: 'Nhấn [E] để Cưỡi Ngựa Thần 🦄 (Tốc độ +55%)',
      state: {
        mountType: 'horse',
        name: 'Ngựa Thần Cầu Vồng',
        icon: '🦄',
        speedMultiplier: 1.55
      }
    });

    // 14. Mount Station 3: Shopee Delivery Kart (Expo)
    this.addObject({
      id: 'mount-kart-2',
      type: 'mount_station',
      x: 1216,
      y: 448,
      width: 54,
      height: 48,
      name: 'Xe Siêu Tốc Shopee',
      interactionPrompt: 'Nhấn [E] để Lái Xe Shopee 🚗 (Tốc độ +80%)',
      state: {
        mountType: 'kart',
        name: 'Xe Siêu Tốc Shopee',
        icon: '🚗',
        speedMultiplier: 1.8
      }
    });

    // 15. Mount Station 4: Rainbow Pony (Arcade)
    this.addObject({
      id: 'mount-horse-2',
      type: 'mount_station',
      x: 544,
      y: 1024,
      width: 54,
      height: 48,
      name: 'Ngựa Thần Cầu Vồng',
      interactionPrompt: 'Nhấn [E] để Cưỡi Ngựa Thần 🦄 (Tốc độ +55%)',
      state: {
        mountType: 'horse',
        name: 'Ngựa Thần Cầu Vồng',
        icon: '🦄',
        speedMultiplier: 1.55
      }
    });
  }

  public addObject(obj: WorldObject): void {
    this.objects.set(obj.id, obj);
  }

  public getAllObjects(): WorldObject[] {
    return Array.from(this.objects.values());
  }

  public getObject(id: string): WorldObject | undefined {
    return this.objects.get(id);
  }

  // --- Whiteboard Operations ---
  public getWhiteboardLines(): DrawLine[] {
    return this.whiteboardLines;
  }

  public addWhiteboardLine(line: DrawLine): void {
    this.whiteboardLines.push(line);
    if (this.whiteboardLines.length > SERVER_CONFIG.MAX_WHITEBOARD_LINES) {
      this.whiteboardLines.shift();
    }
  }

  public clearWhiteboard(): void {
    this.whiteboardLines = [];
  }

  // --- Caro / Gomoku Logic ---
  public getCaroState(): CaroGameState {
    return this.caroGame;
  }

  public joinCaroGame(player: { id: string; name: string }, role: 'X' | 'O'): { success: boolean; message?: string } {
    if (role === 'X') {
      if (this.caroGame.playerX && this.caroGame.playerX.id !== player.id) {
        return { success: false, message: 'Ghế người chơi X đã có người ngồi' };
      }
      this.caroGame.playerX = player;
    } else {
      if (this.caroGame.playerO && this.caroGame.playerO.id !== player.id) {
        return { success: false, message: 'Ghế người chơi O đã có người ngồi' };
      }
      this.caroGame.playerO = player;
    }
    return { success: true };
  }

  public leaveCaroGame(playerId: string): boolean {
    let changed = false;
    if (this.caroGame.playerX?.id === playerId) {
      this.caroGame.playerX = null;
      changed = true;
    }
    if (this.caroGame.playerO?.id === playerId) {
      this.caroGame.playerO = null;
      changed = true;
    }
    if (!this.caroGame.playerX && !this.caroGame.playerO) {
      this.resetCaroBoard();
    }
    return changed;
  }

  public resetCaroBoard(): void {
    const fresh = this.initCaroGame();
    this.caroGame.board = fresh.board;
    this.caroGame.currentTurn = 'X';
    this.caroGame.winner = null;
    this.caroGame.winningLine = undefined;
  }

  public makeCaroMove(playerId: string, row: number, col: number): { success: boolean; winner?: 'X' | 'O' | 'draw' | null } {
    if (this.caroGame.winner) return { success: false };
    const isPlayerX = this.caroGame.playerX?.id === playerId;
    const isPlayerO = this.caroGame.playerO?.id === playerId;

    if (!isPlayerX && !isPlayerO) return { success: false };
    const currentSymbol = this.caroGame.currentTurn;
    if ((currentSymbol === 'X' && !isPlayerX) || (currentSymbol === 'O' && !isPlayerO)) {
      return { success: false };
    }

    if (row < 0 || row >= 15 || col < 0 || col >= 15 || this.caroGame.board[row][col] !== null) {
      return { success: false };
    }

    this.caroGame.board[row][col] = currentSymbol;

    // Check win condition (5 in a row)
    const winningLine = this.checkWin(row, col, currentSymbol);
    if (winningLine) {
      this.caroGame.winner = currentSymbol;
      this.caroGame.winningLine = winningLine;
      return { success: true, winner: currentSymbol };
    }

    // Check draw
    const isDraw = this.caroGame.board.every(r => r.every(cell => cell !== null));
    if (isDraw) {
      this.caroGame.winner = 'draw';
      return { success: true, winner: 'draw' };
    }

    // Next turn
    this.caroGame.currentTurn = currentSymbol === 'X' ? 'O' : 'X';
    return { success: true, winner: null };
  }

  private checkWin(row: number, col: number, symbol: 'X' | 'O'): Array<[number, number]> | null {
    const directions: Array<[number, number]> = [
      [0, 1],   // Horizontal
      [1, 0],   // Vertical
      [1, 1],   // Diagonal \
      [1, -1]   // Diagonal /
    ];

    for (const [dr, dc] of directions) {
      const line: Array<[number, number]> = [[row, col]];

      // Check positive direction
      let r = row + dr;
      let c = col + dc;
      while (r >= 0 && r < 15 && c >= 0 && c < 15 && this.caroGame.board[r][c] === symbol) {
        line.push([r, c]);
        r += dr;
        c += dc;
      }

      // Check negative direction
      r = row - dr;
      c = col - dc;
      while (r >= 0 && r < 15 && c >= 0 && c < 15 && this.caroGame.board[r][c] === symbol) {
        line.push([r, c]);
        r -= dr;
        c -= dc;
      }

      if (line.length >= 5) {
        return line;
      }
    }
    return null;
  }

  // --- Lucky Wheel Spin ---
  public spinLuckyWheel(playerId: string): { prize: string; voucherCode: string; icon: string } {
    const prizes = [
      { prize: 'Voucher Shopee 50.000đ', voucherCode: 'SP50K-VIRTUAL', icon: '🎟️', weight: 30 },
      { prize: 'Voucher Giảm 20% Tối Đa 100k', voucherCode: 'SP20PCT-LUCKY', icon: '🔥', weight: 20 },
      { prize: 'Freeship Đơn 0Đ Toàn Quốc', voucherCode: 'FREESHIP-0D', icon: '🚚', weight: 25 },
      { prize: '1000 Xu Shopee Thần Tài', voucherCode: 'COIN-1000XU', icon: '🪙', weight: 20 },
      { prize: 'Jackpot Voucher 500.000đ', voucherCode: 'JACKPOT-500K', icon: '👑', weight: 5 }
    ];

    const totalWeight = prizes.reduce((acc, p) => acc + p.weight, 0);
    let rand = Math.random() * totalWeight;

    for (const p of prizes) {
      if (rand < p.weight) {
        return { prize: p.prize, voucherCode: p.voucherCode, icon: p.icon };
      }
      rand -= p.weight;
    }

    return prizes[0];
  }
}
