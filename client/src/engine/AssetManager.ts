/**
 * AssetManager - Kawaii Edition
 * Generates bright, adorable, cheerful pastel textures, furniture, and decorations
 */

export class AssetManager {
  private static instance: AssetManager;
  private textures: Map<string, HTMLCanvasElement> = new Map();

  private constructor() {
    this.generateAllTextures();
  }

  public static get(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  public getTexture(name: string): HTMLCanvasElement | undefined {
    return this.textures.get(name);
  }

  private createOffscreen(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    return [canvas, ctx];
  }

  private generateAllTextures(): void {
    this.generateFloorTextures();
    this.generateWallTextures();
    this.generateDecorations();
  }

  // 1. BRIGHT & KAWAII FLOOR PATTERNS (32x32)
  private generateFloorTextures(): void {
    // 1. Crisp White Square Brick Tiles with Black Borders (High Contrast Floor)
    {
      const [c, ctx] = this.createOffscreen(32, 32);
      // Clean white brick surface
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 32, 32);

      // Subtle light grey inner bevel for ceramic brick feel
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(2, 2, 28, 28);

      // Pure white center highlight
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, 4, 24, 24);

      // Crisp solid black outline (brick grout line)
      ctx.strokeStyle = '#aeaeaeff';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, 32, 32);

      this.textures.set('floor_white_brick', c);
    }

    // 1b. Kawaii Green Grass Meadow
    {
      const [c, ctx] = this.createOffscreen(32, 32);
      // Fresh spring lawn green base
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(0, 0, 32, 32);

      // Soft natural dappled tones
      ctx.fillStyle = '#3ecc71';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillRect(16, 16, 16, 16);

      // Soft lawn light sheen
      ctx.fillStyle = '#86efac';
      ctx.fillRect(1, 1, 14, 14);
      ctx.fillRect(17, 17, 14, 14);

      // Cute Grass Blades (tufts)
      ctx.fillStyle = '#16a34a';
      // Tuft 1
      ctx.beginPath();
      ctx.moveTo(8, 12);
      ctx.lineTo(6, 6);
      ctx.lineTo(10, 8);
      ctx.closePath();
      ctx.fill();

      // Tuft 2
      ctx.beginPath();
      ctx.moveTo(24, 26);
      ctx.lineTo(22, 20);
      ctx.lineTo(26, 22);
      ctx.closePath();
      ctx.fill();

      // Tiny 3-leaf clover at center-right
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(20, 10, 1.8, 0, Math.PI * 2);
      ctx.arc(22, 9, 1.8, 0, Math.PI * 2);
      ctx.arc(21, 12, 1.8, 0, Math.PI * 2);
      ctx.fill();

      this.textures.set('floor_grass', c);
    }

    // 1b. Grass with Cute Wildflower Daisies
    {
      const [c, ctx] = this.createOffscreen(32, 32);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(0, 0, 32, 32);

      ctx.fillStyle = '#3ecc71';
      ctx.fillRect(16, 0, 16, 16);
      ctx.fillRect(0, 16, 16, 16);

      ctx.fillStyle = '#86efac';
      ctx.fillRect(17, 1, 14, 14);
      ctx.fillRect(1, 17, 14, 14);

      // Grass tuft
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.moveTo(10, 24);
      ctx.lineTo(8, 18);
      ctx.lineTo(12, 20);
      ctx.closePath();
      ctx.fill();

      // Cute White Daisy with Yellow Center (x: 20, y: 14)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(18, 14, 2, 0, Math.PI * 2);
      ctx.arc(22, 14, 2, 0, Math.PI * 2);
      ctx.arc(20, 12, 2, 0, Math.PI * 2);
      ctx.arc(20, 16, 2, 0, Math.PI * 2);
      ctx.fill();

      // Daisy golden center
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(20, 14, 1.5, 0, Math.PI * 2);
      ctx.fill();

      this.textures.set('floor_grass_flower', c);
    }

    // Marble / Cream Tiles (Grand Lounge)
    {
      const [c, ctx] = this.createOffscreen(32, 32);
      ctx.fillStyle = '#fefcf8';
      ctx.fillRect(0, 0, 32, 32);

      // Soft cream bevel
      ctx.fillStyle = '#fbf2e3';
      ctx.fillRect(1, 1, 30, 30);

      // Cute warm gold sparkle dot
      ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
      ctx.beginPath();
      ctx.arc(16, 16, 2, 0, Math.PI * 2);
      ctx.fill();

      // Soft light border
      ctx.strokeStyle = '#f3e5ce';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, 32, 32);

      this.textures.set('floor_marble', c);
    }

    // Honey Blonde Wood (Town Hall Stage)
    {
      const [c, ctx] = this.createOffscreen(32, 32);
      ctx.fillStyle = '#f8dfb8';
      ctx.fillRect(0, 0, 32, 32);

      for (let i = 0; i < 4; i++) {
        const y = i * 8;
        ctx.fillStyle = i % 2 === 0 ? '#fae8cb' : '#f5d9ad';
        ctx.fillRect(0, y, 32, 7);

        // Soft seam
        ctx.fillStyle = 'rgba(180, 83, 9, 0.12)';
        ctx.fillRect(0, y + 7, 32, 1);
      }
      this.textures.set('floor_wood', c);
    }

    // Pastel Lavender Carpet (Meeting Rooms)
    {
      const [c, ctx] = this.createOffscreen(32, 32);
      ctx.fillStyle = '#f3e8ff';
      ctx.fillRect(0, 0, 32, 32);

      // Cute Polka Dots
      ctx.fillStyle = '#e9d5ff';
      ctx.beginPath();
      ctx.arc(8, 8, 2.5, 0, Math.PI * 2);
      ctx.arc(24, 8, 2.5, 0, Math.PI * 2);
      ctx.arc(16, 24, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ddd6fe';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, 32, 32);

      this.textures.set('floor_carpet_indigo', c);
    }

    // Shopee Pastel Peach Tiles
    {
      const [c, ctx] = this.createOffscreen(32, 32);
      ctx.fillStyle = '#fff1ee';
      ctx.fillRect(0, 0, 32, 32);

      ctx.fillStyle = '#ffe2dc';
      ctx.fillRect(1, 1, 30, 30);

      // Cute pastel peach diamond
      ctx.fillStyle = '#ffd1c7';
      ctx.beginPath();
      ctx.moveTo(16, 6);
      ctx.lineTo(26, 16);
      ctx.lineTo(16, 26);
      ctx.lineTo(6, 16);
      ctx.closePath();
      ctx.fill();

      this.textures.set('floor_shopee', c);
    }

    // Pastel Mint & Candy Pop Grid (Arcade)
    {
      const [c, ctx] = this.createOffscreen(32, 32);
      ctx.fillStyle = '#ecfdf5';
      ctx.fillRect(0, 0, 32, 32);

      ctx.strokeStyle = '#a7f3d0';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, 32, 32);

      // Cute mint clover dots
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(16, 16, 2, 0, Math.PI * 2);
      ctx.fill();

      this.textures.set('floor_cyber', c);
    }
  }

  // 2. SOFT & BRIGHT WALLS
  private generateWallTextures(): void {
    // Soft Pastel Cream Wall
    {
      const [c, ctx] = this.createOffscreen(32, 32);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, 0, 32, 32);

      // Wall top soft wood/coral trim
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(0, 0, 32, 6);
      ctx.fillStyle = '#ff8a65';
      ctx.fillRect(0, 0, 32, 2);

      // Brick pattern
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 19);
      ctx.lineTo(32, 19);
      ctx.moveTo(16, 6);
      ctx.lineTo(16, 19);
      ctx.moveTo(8, 19);
      ctx.lineTo(8, 32);
      ctx.moveTo(24, 19);
      ctx.lineTo(24, 32);
      ctx.stroke();

      // Bottom soft shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 28, 32, 4);

      this.textures.set('wall_brick', c);
    }

    // Dreamy Pastel Glass Wall (Meeting Rooms)
    {
      const [c, ctx] = this.createOffscreen(32, 32);
      ctx.fillStyle = 'rgba(238, 242, 255, 0.7)';
      ctx.fillRect(0, 0, 32, 32);

      // Lavender Frame
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 30, 30);

      // Cute Sparkle Glint
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(16, 8);
      ctx.lineTo(18, 13);
      ctx.lineTo(23, 15);
      ctx.lineTo(18, 17);
      ctx.lineTo(16, 22);
      ctx.lineTo(14, 17);
      ctx.lineTo(9, 15);
      ctx.lineTo(14, 13);
      ctx.closePath();
      ctx.fill();

      this.textures.set('wall_glass', c);
    }
  }

  // 3. KAWAII DECORATIONS
  private generateDecorations(): void {
    // Chubby Plant with Flower Bud
    {
      const [c, ctx] = this.createOffscreen(32, 32);
      // Soft shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.beginPath();
      ctx.ellipse(16, 28, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pastel Pink Pot
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.roundRect(10, 18, 12, 10, 3);
      ctx.fill();
      ctx.fillStyle = '#f472b6';
      ctx.fillRect(9, 17, 14, 2);

      // Cute face on pot
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(13, 22, 1.5, 2);
      ctx.fillRect(17, 22, 1.5, 2);
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.arc(12, 24, 1.5, 0, Math.PI * 2);
      ctx.arc(19, 24, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Cute Round Leaves
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(11, 12, 6, 0, Math.PI * 2);
      ctx.arc(21, 11, 5.5, 0, Math.PI * 2);
      ctx.arc(16, 7, 7, 0, Math.PI * 2);
      ctx.fill();

      // Little Blossom
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(16, 6, 2.5, 0, Math.PI * 2);
      ctx.fill();

      this.textures.set('plant_monstera', c);
    }

    // Sparkly Water Fountain with Floating Duckie (64x64)
    {
      const [c, ctx] = this.createOffscreen(64, 64);
      const cx = 32;
      const cy = 32;

      // Outer Marble Basin
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.beginPath();
      ctx.arc(cx, cy + 3, 28, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, 23, 0, Math.PI * 2);
      ctx.fill();

      // Crystal Aqua Water
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#7dd3fc';
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();

      // Floating Yellow Rubber Duckie 🐤
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(cx - 5, cy - 4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx - 3, cy - 7, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f97316';
      ctx.fillRect(cx - 1, cy - 7, 2, 1.5); // beak

      // Center Spout
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();

      this.textures.set('fountain', c);
    }

    // Cute Pastel Blue Ergonomic Chair
    {
      const [c, ctx] = this.createOffscreen(24, 24);
      // Soft shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.beginPath();
      ctx.ellipse(12, 18, 7, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cute Seat Cushion
      ctx.fillStyle = '#60a5fa';
      ctx.beginPath();
      ctx.roundRect(4, 8, 16, 11, 4);
      ctx.fill();

      // Backrest
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.roundRect(6, 2, 12, 6, 3);
      ctx.fill();

      this.textures.set('office_chair', c);
    }

    // Cute Pastel Laptop with Heart
    {
      const [c, ctx] = this.createOffscreen(20, 16);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(2, 8, 16, 6);

      // Pastel pink glowing screen
      ctx.fillStyle = '#fbcfe8';
      ctx.fillRect(3, 2, 14, 7);

      // Heart on screen
      ctx.fillStyle = '#f43f5e';
      ctx.font = '7px sans-serif';
      ctx.fillText('♥', 7, 7);

      this.textures.set('laptop', c);
    }
  }
}
