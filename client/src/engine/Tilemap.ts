import { MapZone, WorldObject } from '../types';
import { AssetManager } from './AssetManager';

export const TILE_SIZE = 32;
export const MAP_TILES_X = 60;
export const MAP_TILES_Y = 40;
export const MAP_WIDTH = MAP_TILES_X * TILE_SIZE;   // 1920px
export const MAP_HEIGHT = MAP_TILES_Y * TILE_SIZE;  // 1280px

export class Tilemap {
  private collisionGrid: boolean[][];

  constructor() {
    this.collisionGrid = [];
    this.initCollision();
  }

  private initCollision(): void {
    for (let y = 0; y < MAP_TILES_Y; y++) {
      this.collisionGrid[y] = [];
      for (let x = 0; x < MAP_TILES_X; x++) {
        // Outer boundaries
        if (x <= 1 || x >= MAP_TILES_X - 2 || y <= 1 || y >= MAP_TILES_Y - 2) {
          this.collisionGrid[y][x] = true;
          continue;
        }

        // Meeting Room Alpha walls (x: 10 to 19, y: 20 to 27)
        if (
          ((x === 10 || x === 19) && y >= 20 && y <= 27) ||
          ((y === 20 || y === 27) && x >= 10 && x <= 19)
        ) {
          // Doorway at x: 14..15
          if ((x === 14 || x === 15) && y === 20) {
            this.collisionGrid[y][x] = false;
          } else {
            this.collisionGrid[y][x] = true;
            continue;
          }
        }

        // Meeting Room Beta walls (x: 21 to 30, y: 20 to 27)
        if (
          ((x === 21 || x === 30) && y >= 20 && y <= 27) ||
          ((y === 20 || y === 27) && x >= 21 && x <= 30)
        ) {
          // Doorway at x: 25..26
          if ((x === 25 || x === 26) && y === 20) {
            this.collisionGrid[y][x] = false;
          } else {
            this.collisionGrid[y][x] = true;
            continue;
          }
        }

        // Co-working & Whiteboard wall boundary
        if (y === 6 && x >= 10 && x <= 22) {
          this.collisionGrid[y][x] = true;
          continue;
        }

        // Stage back wall (Town Hall)
        if (y === 5 && x >= 26 && x <= 36) {
          this.collisionGrid[y][x] = true;
          continue;
        }

        // Shopee Expo partition walls
        if (y === 6 && x >= 39 && x <= 54) {
          this.collisionGrid[y][x] = true;
          continue;
        }

        // Central fountain collision (in Grand Lounge: tx: 29..31, ty: 21..22)
        if (x >= 29 && x <= 31 && y >= 21 && y <= 22) {
          this.collisionGrid[y][x] = true;
          continue;
        }

        this.collisionGrid[y][x] = false;
      }
    }
  }

  public isBlocked(x: number, y: number): boolean {
    const tx = Math.floor(x / TILE_SIZE);
    const ty = Math.floor(y / TILE_SIZE);

    if (tx < 0 || tx >= MAP_TILES_X || ty < 0 || ty >= MAP_TILES_Y) {
      return true;
    }
    return this.collisionGrid[ty][tx] === true;
  }

  public isBlockedTile(tx: number, ty: number): boolean {
    if (tx < 0 || tx >= MAP_TILES_X || ty < 0 || ty >= MAP_TILES_Y) {
      return true;
    }
    return this.collisionGrid[ty][tx] === true;
  }

  public draw(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    viewW: number,
    viewH: number,
    zones: MapZone[],
    objects: WorldObject[]
  ): void {
    const assets = AssetManager.get();
    const startTileX = Math.max(0, Math.floor(cameraX / TILE_SIZE));
    const endTileX = Math.min(MAP_TILES_X, Math.ceil((cameraX + viewW) / TILE_SIZE) + 1);
    const startTileY = Math.max(0, Math.floor(cameraY / TILE_SIZE));
    const endTileY = Math.min(MAP_TILES_Y, Math.ceil((cameraY + viewH) / TILE_SIZE) + 1);

    const texWhiteBrick = assets.getTexture('floor_white_brick');
    const texGrass = assets.getTexture('floor_grass');
    const texMarble = assets.getTexture('floor_marble');
    const texWood = assets.getTexture('floor_wood');
    const texCarpet = assets.getTexture('floor_carpet_indigo');
    const texShopee = assets.getTexture('floor_shopee');
    const texCyber = assets.getTexture('floor_cyber');
    const texWall = assets.getTexture('wall_brick');
    const texGlass = assets.getTexture('wall_glass');

    // 1. Draw Floor & Wall Tiles
    for (let ty = startTileY; ty < endTileY; ty++) {
      for (let tx = startTileX; tx < endTileX; tx++) {
        const px = tx * TILE_SIZE;
        const py = ty * TILE_SIZE;

        const isWall = this.isBlockedTile(tx, ty);

        if (isWall) {
          // Check if glass wall of meeting rooms
          const isGlass =
            (ty >= 20 && ty <= 27 && (tx === 10 || tx === 19 || tx === 21 || tx === 30 || ty === 20 || ty === 27)) &&
            !(tx >= 29 && tx <= 31 && ty >= 21 && ty <= 22);

          if (isGlass && texGlass) {
            ctx.drawImage(texGlass, px, py);
          } else if (texWall) {
            ctx.drawImage(texWall, px, py);
          } else {
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          }
        } else {
          // Select Floor Texture based on Zone
          if (tx >= 39 && ty >= 6 && ty <= 21 && texShopee) {
            ctx.drawImage(texShopee, px, py);
          } else if (ty >= 20 && ty <= 27 && tx >= 10 && tx <= 30 && texCarpet) {
            ctx.drawImage(texCarpet, px, py);
          } else if (tx >= 26 && tx <= 36 && ty >= 5 && ty <= 11 && texWood) {
            ctx.drawImage(texWood, px, py);
          } else if (tx >= 12 && tx <= 24 && ty >= 27 && ty <= 36 && texCyber) {
            ctx.drawImage(texCyber, px, py);
          } else {
            // White Square Brick Tiles with Black Borders (High Contrast Background)
            if (texWhiteBrick) {
              ctx.drawImage(texWhiteBrick, px, py);
            } else {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
              ctx.strokeStyle = '#0f172a';
              ctx.lineWidth = 1.5;
              ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
            }
          }
        }
      }
    }

    // 2. Draw Zone Outlines & Carpets
    for (const zone of zones) {
      if (zone.type === 'meeting') {
        // Meeting Room Glow Border
        ctx.strokeStyle = 'rgba(129, 140, 248, 0.6)';
        ctx.lineWidth = 2;
        ctx.strokeRect(zone.x + 8, zone.y + 8, zone.width - 16, zone.height - 16);
      } else if (zone.type === 'shopee') {
        // Shopee Expo Warm Orange Border
        ctx.strokeStyle = 'rgba(255, 112, 67, 0.45)';
        ctx.lineWidth = 2;
        ctx.strokeRect(zone.x + 4, zone.y + 4, zone.width - 8, zone.height - 8);
      } else if (zone.type === 'stage') {
        // Red / Rose Pastel Carpet to Stage
        ctx.fillStyle = 'rgba(251, 113, 133, 0.25)';
        ctx.fillRect(zone.x + 48, zone.y + 48, zone.width - 96, zone.height - 64);
        ctx.strokeStyle = '#fb7185';
        ctx.lineWidth = 2;
        ctx.strokeRect(zone.x + 48, zone.y + 48, zone.width - 96, zone.height - 64);
      }
    }

    // 3. Draw Zone Labels
    for (const zone of zones) {
      ctx.font = 'bold 13px "Be Vietnam Pro", "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      if (zone.type === 'meeting') {
        ctx.fillStyle = '#6366f1';
        ctx.fillText(zone.name, zone.x + zone.width / 2, zone.y + 36);
        ctx.font = '600 11px "Be Vietnam Pro", sans-serif';
        ctx.fillStyle = '#818cf8';
        ctx.fillText('🔒 Cách âm (Private Bubble)', zone.x + zone.width / 2, zone.y + 52);
      } else if (zone.type === 'shopee') {
        ctx.fillStyle = '#ea580c';
        ctx.fillText('🛍️ ' + zone.name, zone.x + zone.width / 2, zone.y + 30);
      } else if (zone.type === 'stage') {
        ctx.fillStyle = '#e11d48';
        ctx.fillText('📢 ' + zone.name, zone.x + zone.width / 2, zone.y + 24);
      } else if (zone.type === 'game') {
        ctx.fillStyle = '#059669';
        ctx.fillText('🎮 ' + zone.name, zone.x + zone.width / 2, zone.y + 26);
      }
    }

    // 4. Draw Rich Environment Props & Furniture
    this.drawFurnitureAndProps(ctx, assets);

    // 5. Draw Interactive Stations
    for (const obj of objects) {
      this.drawWorldObject(ctx, obj);
    }
  }

  private drawFurnitureAndProps(ctx: CanvasRenderingContext2D, assets: AssetManager): void {
    const time = Date.now();
    const texChair = assets.getTexture('office_chair');
    const texLaptop = assets.getTexture('laptop');
    const texPlant = assets.getTexture('plant_monstera');
    const texFountain = assets.getTexture('fountain');

    // Central Animated Fountain (Lounge at x: 960, y: 688)
    if (texFountain) {
      ctx.drawImage(texFountain, 928, 656);

      // Water wave ripple effect
      const rippleRadius = 10 + (Math.sin(time / 400) + 1) * 6;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(960, 688, rippleRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Meeting Room Alpha Table & Chairs (x: 416, y: 720)
    this.drawConferenceTable(ctx, 416, 730, 128, 64, texChair, texLaptop);

    // Meeting Room Beta Table & Chairs (x: 768, y: 720)
    this.drawConferenceTable(ctx, 768, 730, 128, 64, texChair, texLaptop);

    // Monstera Plants in corners
    if (texPlant) {
      ctx.drawImage(texPlant, 336, 208); // Coworking
      ctx.drawImage(texPlant, 688, 208);
      ctx.drawImage(texPlant, 720, 464); // Lounge corners
      ctx.drawImage(texPlant, 1200, 464);
      ctx.drawImage(texPlant, 1264, 208); // Shopee
      ctx.drawImage(texPlant, 1712, 208);
    }
  }

  private drawConferenceTable(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    chairTex?: HTMLCanvasElement,
    laptopTex?: HTMLCanvasElement
  ): void {
    // Soft cute shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.beginPath();
    ctx.roundRect(x - 2, y + 4, w + 4, h + 8, 14);
    ctx.fill();

    // Warm Maple Blonde Table
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 12);
    ctx.fill();

    // Table Warm Caramel Border
    ctx.strokeStyle = '#fcd34d';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center pastel lavender runner mat
    ctx.fillStyle = '#ede9fe';
    ctx.beginPath();
    ctx.roundRect(x + 12, y + 10, w - 24, h - 20, 8);
    ctx.fill();

    // Chairs top row
    if (chairTex) {
      ctx.drawImage(chairTex, x + 16, y - 18);
      ctx.drawImage(chairTex, x + w / 2 - 12, y - 18);
      ctx.drawImage(chairTex, x + w - 40, y - 18);

      // Chairs bottom row
      ctx.drawImage(chairTex, x + 16, y + h - 6);
      ctx.drawImage(chairTex, x + w / 2 - 12, y + h - 6);
      ctx.drawImage(chairTex, x + w - 40, y + h - 6);
    }

    // Laptops on Table
    if (laptopTex) {
      ctx.drawImage(laptopTex, x + 24, y + 18);
      ctx.drawImage(laptopTex, x + w - 44, y + 18);
    }
  }

  private drawWorldObject(ctx: CanvasRenderingContext2D, obj: WorldObject): void {
    const { x, y, width, height, type, name } = obj;
    const time = Date.now();

    switch (type) {
      case 'whiteboard': {
        // Soft Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.beginPath();
        ctx.roundRect(x - 4, y + 6, width + 8, height + 4, 10);
        ctx.fill();

        // Whiteboard pastel lavender frame
        ctx.fillStyle = '#c4b5fd';
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 10);
        ctx.fill();

        // Whiteboard surface
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(x + 4, y + 4, width - 8, height - 8, 6);
        ctx.fill();

        // Top pastel blue banner
        ctx.fillStyle = '#7dd3fc';
        ctx.fillRect(x + 4, y + 4, width - 8, 8);

        // Marker doodles
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x + 16, y + 26);
        ctx.lineTo(x + 36, y + 44);
        ctx.stroke();

        ctx.strokeStyle = '#34d399';
        ctx.beginPath();
        ctx.arc(x + 64, y + 36, 12, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = 'bold 12px "Be Vietnam Pro", sans-serif';
        ctx.fillStyle = '#6366f1';
        ctx.textAlign = 'center';
        ctx.fillText('🎨 Live Canvas', x + width / 2, y + height + 18);
        break;
      }

      case 'shopee_booth': {
        // Soft Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + height + 4, width / 2 + 6, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shopee Kiosk Counter (warm honey peach)
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.roundRect(x, y + 16, width, height - 16, 12);
        ctx.fill();

        // Striped Awning (Roof)
        const stripeW = width / 6;
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = i % 2 === 0 ? '#ff7043' : '#ffffff';
          ctx.beginPath();
          ctx.roundRect(x + i * stripeW, y - 10, stripeW, 26, 6);
          ctx.fill();
        }

        // Glowing Shopee Sign
        ctx.fillStyle = '#ff5722';
        ctx.beginPath();
        ctx.roundRect(x + 10, y + 24, width - 20, 24, 8);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px "Be Vietnam Pro", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🛍️ Shopee', x + width / 2, y + 41);

        ctx.font = 'bold 11px "Be Vietnam Pro", sans-serif';
        ctx.fillStyle = '#fef08a';
        ctx.fillText(name.includes('Tech') ? 'CÔNG NGHỆ' : 'THỜI TRANG', x + width / 2, y + 62);
        break;
      }

      case 'lucky_wheel': {
        const cx = x + width / 2;
        const cy = y + height / 2;

        // Base shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + width / 2 + 4, width / 2, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wheel outer pastel golden frame
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(cx, cy, width / 2 + 6, 0, Math.PI * 2);
        ctx.fill();

        // Flashing bulbs rim
        const numBulbs = 12;
        for (let i = 0; i < numBulbs; i++) {
          const bulbAngle = (i * Math.PI * 2) / numBulbs;
          const bx = cx + Math.cos(bulbAngle) * (width / 2 + 4);
          const by = cy + Math.sin(bulbAngle) * (width / 2 + 4);
          const bulbGlow = (Math.sin(time / 150 + i) + 1) / 2;

          ctx.fillStyle = bulbGlow > 0.5 ? '#fef08a' : '#ffffff';
          ctx.beginPath();
          ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Wheel colorful segments (sweet pastel candy palette)
        const segments = ['#f43f5e', '#fb923c', '#34d399', '#38bdf8', '#a855f7', '#ec4899'];
        for (let i = 0; i < 6; i++) {
          const startAngle = (i * Math.PI) / 3;
          const endAngle = ((i + 1) * Math.PI) / 3;
          ctx.fillStyle = segments[i];
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, width / 2 - 2, startAngle, endAngle);
          ctx.fill();
        }

        // Golden center hub
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.font = 'bold 12px "Be Vietnam Pro", sans-serif';
        ctx.fillStyle = '#d97706';
        ctx.textAlign = 'center';
        ctx.fillText('🎰 Vòng Quay Shopee', cx, y + height + 18);
        break;
      }

      case 'caro_board': {
        // Table shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.beginPath();
        ctx.roundRect(x - 4, y + 4, width + 8, height + 8, 14);
        ctx.fill();

        // Warm Caramel Blonde Table
        ctx.fillStyle = '#fde68a';
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 12);
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Bamboo board cloth
        ctx.fillStyle = '#fffbeb';
        ctx.beginPath();
        ctx.roundRect(x + 8, y + 8, width - 16, height - 16, 8);
        ctx.fill();

        // Grid lines
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1;
        for (let i = 1; i <= 3; i++) {
          ctx.beginPath();
          ctx.moveTo(x + 8 + i * 20, y + 8);
          ctx.lineTo(x + 8 + i * 20, y + height - 8);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(x + 8, y + 8 + i * 16);
          ctx.lineTo(x + width - 8, y + 8 + i * 16);
          ctx.stroke();
        }

        // 3D stones
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(x + 28, y + 32, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(x + 52, y + 44, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = 'bold 12px "Be Vietnam Pro", sans-serif';
        ctx.fillStyle = '#059669';
        ctx.textAlign = 'center';
        ctx.fillText('⚔️ Cờ Caro (2P)', x + width / 2, y + height + 18);
        break;
      }

      case 'podium': {
        // Spotlight cone from above
        ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
        ctx.beginPath();
        ctx.moveTo(x + width / 2, y - 50);
        ctx.lineTo(x - 30, y + height + 20);
        ctx.lineTo(x + width + 30, y + height + 20);
        ctx.closePath();
        ctx.fill();

        // Podium wooden block
        ctx.fillStyle = '#fb923c';
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 10);
        ctx.fill();

        // Gold trim
        ctx.fillStyle = '#fde047';
        ctx.fillRect(x, y + 6, width, 5);

        // Gooseneck Mics
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + width / 2 - 8, y + 10);
        ctx.lineTo(x + width / 2 - 8, y - 8);
        ctx.moveTo(x + width / 2 + 8, y + 10);
        ctx.lineTo(x + width / 2 + 8, y - 8);
        ctx.stroke();

        ctx.font = 'bold 12px "Be Vietnam Pro", sans-serif';
        ctx.fillStyle = '#e11d48';
        ctx.textAlign = 'center';
        ctx.fillText('🎙️ Bục Megaphone', x + width / 2, y + height + 18);
        break;
      }

      case 'jukebox': {
        // Neon pulse shadow
        const pulse = (Math.sin(time / 200) + 1) / 2;
        ctx.fillStyle = `rgba(56, 189, 248, ${0.15 + pulse * 0.2})`;
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, width / 2 + 14, 0, Math.PI * 2);
        ctx.fill();

        // Pastel Cute Jukebox body
        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 14);
        ctx.fill();

        // Sky blue arch
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 4, y + 4, width - 8, height - 8);

        ctx.fillStyle = '#f43f5e';
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎵', x + width / 2, y + height / 2 + 8);

        ctx.font = 'bold 12px "Be Vietnam Pro", sans-serif';
        ctx.fillStyle = '#0284c7';
        ctx.fillText('🎶 Kawaii Jukebox', x + width / 2, y + height + 18);
        break;
      }

      case 'weapon_pickup': {
        const cx = x + width / 2;
        const cy = y + height / 2;
        const weaponType = obj.state?.weaponType || 'candy_blade';

        // 1. Soft Pedestal Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 18, 22, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Glowing Magic Ring on Floor
        const pulse = (Math.sin(time / 250) + 1) / 2;
        let ringColor = 'rgba(244, 63, 94, ';
        if (weaponType === 'toy_hammer') ringColor = 'rgba(245, 158, 11, ';
        else if (weaponType === 'star_wand') ringColor = 'rgba(192, 132, 252, ';
        else if (weaponType === 'water_gun') ringColor = 'rgba(56, 189, 248, ';

        ctx.strokeStyle = `${ringColor}${0.4 + pulse * 0.4})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(cx, cy + 17, 24 + pulse * 3, 10 + pulse * 1.5, 0, 0, Math.PI * 2);
        ctx.stroke();

        // 3. Cute Marble Pedestal
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.roundRect(cx - 16, cy + 6, 32, 12, 4);
        ctx.fill();

        // Golden Trim Rim
        ctx.fillStyle = '#fde047';
        ctx.fillRect(cx - 16, cy + 6, 32, 3);

        // Marble Cap Top
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 6, 17, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 4. Floating & Bobbing Weapon
        const bob = Math.sin(time / 200) * 5;
        const wy = cy - 8 + bob;

        ctx.save();
        ctx.translate(cx, wy);

        // Twinkling floating motes
        for (let i = 0; i < 3; i++) {
          const sparkAngle = (time / 400 + (i * Math.PI * 2) / 3);
          const sx = Math.cos(sparkAngle) * 16;
          const sy = Math.sin(sparkAngle) * 8;
          ctx.fillStyle = i === 0 ? '#fde047' : (i === 1 ? '#f43f5e' : '#38bdf8');
          ctx.beginPath();
          ctx.arc(sx, sy, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        if (weaponType === 'candy_blade') {
          // 🍭 Rainbow Lollipop Blade
          // Stick
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(-2, 4, 4, 18);
          // Swirl candy circle
          const rainbow = ['#f43f5e', '#fb923c', '#fde047', '#4ade80', '#38bdf8', '#c084fc'];
          for (let i = 0; i < 6; i++) {
            ctx.fillStyle = rainbow[i];
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, 14, (i * Math.PI) / 3, ((i + 1) * Math.PI) / 3);
            ctx.fill();
          }
          // White center swirl dot
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (weaponType === 'toy_hammer') {
          // 🔨 Squeaky Toy Hammer
          // Handle
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(-2, 2, 4, 18);
          // Hammer Mallet Head (Shopee Orange)
          ctx.fillStyle = '#ea580c';
          ctx.beginPath();
          ctx.roundRect(-15, -10, 30, 16, 5);
          ctx.fill();
          // Yellow Star Decal
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(0, -2, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (weaponType === 'star_wand') {
          // 🪄 Star Magical Wand
          // Wand Stick
          ctx.fillStyle = '#f472b6';
          ctx.fillRect(-2, 0, 4, 20);
          // Golden Star Head
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const rot = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            const rOuter = 12;
            const rInner = 6;
            ctx.lineTo(Math.cos(rot) * rOuter, -6 + Math.sin(rot) * rOuter);
            const rotInner = rot + Math.PI / 5;
            ctx.lineTo(Math.cos(rotInner) * rInner, -6 + Math.sin(rotInner) * rInner);
          }
          ctx.closePath();
          ctx.fill();
        } else if (weaponType === 'water_gun') {
          // 🔫 Duckie Water Blaster
          // Duck beak & head
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.roundRect(-14, -6, 26, 14, 6);
          ctx.fill();
          // Orange Beak
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.roundRect(10, -2, 8, 6, 2);
          ctx.fill();
          // Water Tank (Aqua)
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.roundRect(-12, -14, 14, 9, 3);
          ctx.fill();
          // Cute duck eye
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(4, -1, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        // 5. Cute Name Label Under Pedestal
        ctx.font = 'bold 11px "Be Vietnam Pro", sans-serif';
        ctx.textAlign = 'center';
        let labelColor = '#ea580c';
        if (weaponType === 'toy_hammer') labelColor = '#d97706';
        else if (weaponType === 'star_wand') labelColor = '#9333ea';
        else if (weaponType === 'water_gun') labelColor = '#0284c7';

        ctx.fillStyle = labelColor;
        ctx.fillText(obj.name, cx, cy + height + 16);
        break;
      }

      case 'mount_station': {
        const cx = x + width / 2;
        const cy = y + height / 2;
        const mountType = obj.state?.mountType || 'kart';

        // 1. Base Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 16, 26, 11, 0, 0, Math.PI * 2);
        ctx.fill();

        if (mountType === 'kart') {
          // --- SHOPEE DELIVERY KART ---
          // Parking spot mat
          ctx.fillStyle = 'rgba(255, 237, 213, 0.6)';
          ctx.beginPath();
          ctx.roundRect(cx - 24, cy - 14, 48, 36, 8);
          ctx.fill();
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Yellow parking dashes
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(cx - 21, cy - 11, 42, 30);
          ctx.setLineDash([]);

          // 4 Black Rubber Wheels
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.roundRect(cx - 20, cy - 10, 7, 12, 3);
          ctx.roundRect(cx + 13, cy - 10, 7, 12, 3);
          ctx.roundRect(cx - 20, cy + 6, 7, 12, 3);
          ctx.roundRect(cx + 13, cy + 6, 7, 12, 3);
          ctx.fill();

          // Kart Main Chassis (Shopee Red/Orange)
          ctx.fillStyle = '#ee4d2d';
          ctx.beginPath();
          ctx.roundRect(cx - 15, cy - 12, 30, 26, 7);
          ctx.fill();

          // White Racing Stripe
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(cx - 3, cy - 12, 6, 26);

          // Golden 'S' emblem on hood
          ctx.fillStyle = '#fef08a';
          ctx.font = '900 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('S', cx, cy - 3);

          // Headlights (glowing yellow)
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(cx - 10, cy - 11, 3, 0, Math.PI * 2);
          ctx.arc(cx + 10, cy - 11, 3, 0, Math.PI * 2);
          ctx.fill();

          // Steering Wheel
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy + 4, 5, 0, Math.PI * 2);
          ctx.stroke();

          // Parcel Box on Back Rack
          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.roundRect(cx - 8, cy + 9, 16, 10, 2);
          ctx.fill();
          ctx.fillStyle = '#fef3c7';
          ctx.fillRect(cx - 1.5, cy + 9, 3, 10);

          // Name Badge
          ctx.font = 'bold 11px "Be Vietnam Pro", sans-serif';
          ctx.fillStyle = '#ea580c';
          ctx.textAlign = 'center';
          ctx.fillText('🚗 ' + obj.name, cx, cy + height + 14);
        } else {
          // --- RAINBOW PONY ---
          // Floral Paddock Mat
          ctx.fillStyle = 'rgba(254, 243, 199, 0.6)';
          ctx.beginPath();
          ctx.ellipse(cx, cy + 4, 26, 16, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Floating sparkling stars around pony
          const ponyPulse = Math.sin(time / 220) * 3;
          for (let i = 0; i < 3; i++) {
            const starAngle = (time / 350 + (i * Math.PI * 2) / 3);
            const sx = cx + Math.cos(starAngle) * 20;
            const sy = cy - 8 + Math.sin(starAngle) * 10;
            ctx.fillStyle = i === 0 ? '#f472b6' : (i === 1 ? '#38bdf8' : '#fde047');
            ctx.beginPath();
            ctx.arc(sx, sy, 2.2, 0, Math.PI * 2);
            ctx.fill();
          }

          // Pony Body (Chibi White)
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(cx, cy + 2 + ponyPulse * 0.3, 15, 10, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1;
          ctx.stroke();

          // 4 Legs & Golden Hooves
          ctx.fillStyle = '#ffffff';
          [-10, -3, 3, 10].forEach((lx) => {
            ctx.fillRect(cx + lx - 2, cy + 6, 4, 10);
          });
          ctx.fillStyle = '#f59e0b'; // Gold hooves
          [-10, -3, 3, 10].forEach((lx) => {
            ctx.fillRect(cx + lx - 2, cy + 14, 4, 3);
          });

          // Pony Head
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(cx - 8, cy - 7 + ponyPulse * 0.3, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Ears with pink blush
          ctx.fillStyle = '#fbcfe8';
          ctx.beginPath();
          ctx.ellipse(cx - 10, cy - 15, 2.5, 5, -0.3, 0, Math.PI * 2);
          ctx.fill();

          // Golden Unicorn Horn
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.moveTo(cx - 10, cy - 14);
          ctx.lineTo(cx - 15, cy - 24);
          ctx.lineTo(cx - 6, cy - 14);
          ctx.closePath();
          ctx.fill();

          // Flowing Rainbow Mane (Pink, Yellow, Cyan)
          ctx.fillStyle = '#f472b6';
          ctx.beginPath();
          ctx.arc(cx - 2, cy - 12, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(cx + 2, cy - 8, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(cx + 5, cy - 4, 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Rainbow Tail
          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.ellipse(cx + 16, cy + 2, 4, 8, 0.5, 0, Math.PI * 2);
          ctx.fill();

          // Golden Saddle
          ctx.fillStyle = '#ee4d2d';
          ctx.beginPath();
          ctx.roundRect(cx - 5, cy - 4, 10, 8, 2);
          ctx.fill();
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(cx - 5, cy - 1, 10, 2);

          // Cute Big Anime Eye
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(cx - 10, cy - 7, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(cx - 10.8, cy - 7.6, 0.8, 0, Math.PI * 2);
          ctx.fill();

          // Name Badge
          ctx.font = 'bold 11px "Be Vietnam Pro", sans-serif';
          ctx.fillStyle = '#059669';
          ctx.textAlign = 'center';
          ctx.fillText('🦄 ' + obj.name, cx, cy + height + 14);
        }
        break;
      }
    }
  }
}
