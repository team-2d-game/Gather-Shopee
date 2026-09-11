import { Player, MapZone, WorldObject, Direction, WeaponType, GroundCoin, MountType } from '../types';
import { Tilemap, MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } from './Tilemap';
import { soundManager } from './AudioSynth';

export interface GameEngineOptions {
  canvas: HTMLCanvasElement;
  tilemap: Tilemap;
  onPlayerMove: (x: number, y: number, dir: Direction, isMoving: boolean, isSitting: boolean) => void;
  onInteract: (obj: WorldObject) => void;
  onZoneChange: (zone: MapZone | null) => void;
  onAttack?: (weapon: WeaponType) => void;
  onMountToggle?: (mount: MountType | null) => void;
  onToggleRanking?: () => void;
}

interface SlashEffect {
  x: number;
  y: number;
  angle: number;
  dir: Direction;
  weapon: WeaponType;
  attackerCoins?: number;
  life: number;
  maxLife: number;
}

interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  shape: 'star' | 'heart' | 'bubble' | 'circle';
  life: number;
  maxLife: number;
}

interface DamageText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

interface DroppedCoin {
  x: number;
  y: number;
  vx: number;
  vy: number;
  groundY: number;
  life: number;
  maxLife: number;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private tilemap: Tilemap;

  // World State
  private localPlayer: Player | null = null;
  private remotePlayers: Map<string, Player> = new Map();
  private zones: MapZone[] = [];
  private objects: WorldObject[] = [];
  private activeZone: MapZone | null = null;
  private groundCoins: Map<string, GroundCoin> = new Map();

  // Camera
  private cameraX = 0;
  private cameraY = 0;
  private viewW = 800;
  private viewH = 600;

  // Input & Movement
  private keysDown: Set<string> = new Set();
  private clickTarget: { x: number; y: number } | null = null;
  private moveSpeed = 3.5; // pixels per frame
  private isInputDisabled = false;
  private stepSoundTimer = 0;
  private lastAttackTime = 0;

  // Callbacks
  private onPlayerMove: (x: number, y: number, dir: Direction, isMoving: boolean, isSitting: boolean) => void;
  private onInteract: (obj: WorldObject) => void;
  private onZoneChange: (zone: MapZone | null) => void;
  private onAttack?: (weapon: WeaponType) => void;
  private onMountToggle?: (mount: MountType | null) => void;
  private onToggleRanking?: () => void;

  // Combat Visual State
  private slashes: SlashEffect[] = [];
  private sparks: SparkParticle[] = [];
  private damageTexts: DamageText[] = [];
  private droppedCoins: DroppedCoin[] = [];
  private attackSwings: Map<string, { startTime: number; weapon: WeaponType; angle: number; dir: Direction }> = new Map();

  // Animation Loop
  private animFrameId: number | null = null;
  private lastTime = 0;

  constructor(opts: GameEngineOptions) {
    this.canvas = opts.canvas;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2d context from canvas');
    this.ctx = ctx;
    this.tilemap = opts.tilemap;
    this.onPlayerMove = opts.onPlayerMove;
    this.onInteract = opts.onInteract;
    this.onZoneChange = opts.onZoneChange;
    this.onAttack = opts.onAttack;
    this.onMountToggle = opts.onMountToggle;
    this.onToggleRanking = opts.onToggleRanking;

    this.setupListeners();
    this.handleResize();
  }

  public setInputDisabled(disabled: boolean): void {
    this.isInputDisabled = disabled;
    if (disabled) {
      this.keysDown.clear();
      if (this.localPlayer && this.localPlayer.isMoving) {
        this.localPlayer.isMoving = false;
        this.onPlayerMove(
          this.localPlayer.x,
          this.localPlayer.y,
          this.localPlayer.dir,
          false,
          this.localPlayer.isSitting
        );
      }
    }
  }

  public setWorldData(zones: MapZone[], objects: WorldObject[]): void {
    this.zones = zones;
    this.objects = objects;
  }

  public setLocalPlayer(player: Player): void {
    let px = player.x;
    let py = player.y;
    // Auto-fix if spawned in a wall
    if (this.tilemap.isBlocked(px, py + 6)) {
      px = 960;
      py = 520;
    }
    this.localPlayer = { ...player, x: px, y: py };
    // Center camera initially
    this.cameraX = px - this.viewW / 2;
    this.cameraY = py - this.viewH / 2;
    this.clampCamera();
  }

  public updateRemotePlayer(player: Player): void {
    const existing = this.remotePlayers.get(player.id);
    if (existing) {
      existing.name = player.name;
      existing.targetX = player.x;
      existing.targetY = player.y;
      existing.dir = player.dir;
      existing.isMoving = player.isMoving;
      existing.isSitting = player.isSitting;
      existing.skin = player.skin;
      existing.status = player.status;
      existing.zoneId = player.zoneId;
    } else {
      this.remotePlayers.set(player.id, {
        ...player,
        targetX: player.x,
        targetY: player.y
      });
    }
  }

  public removeRemotePlayer(id: string): void {
    this.remotePlayers.delete(id);
  }

  public syncPositions(positions: Array<{ id: string; x: number; y: number; dir: Direction; isMoving: boolean; isSitting?: boolean; zoneId: string | null; hp?: number; maxHp?: number; equippedWeapon?: WeaponType | null; isKnockedOut?: boolean; invincibleUntil?: number; coins?: number; currentMount?: MountType | null; kills?: number }>): void {
    for (const pos of positions) {
      if (this.localPlayer && pos.id === this.localPlayer.id) {
        if (typeof pos.hp === 'number') this.localPlayer.hp = pos.hp;
        if (typeof pos.isKnockedOut === 'boolean') this.localPlayer.isKnockedOut = pos.isKnockedOut;
        if (pos.equippedWeapon !== undefined) this.localPlayer.equippedWeapon = pos.equippedWeapon;
        if (pos.invincibleUntil !== undefined) this.localPlayer.invincibleUntil = pos.invincibleUntil;
        if (typeof pos.coins === 'number') this.localPlayer.coins = pos.coins;
        if (pos.currentMount !== undefined) this.localPlayer.currentMount = pos.currentMount;
        if (typeof pos.kills === 'number') this.localPlayer.kills = pos.kills;
        continue;
      }
      const remote = this.remotePlayers.get(pos.id);
      if (remote) {
        remote.targetX = pos.x;
        remote.targetY = pos.y;
        remote.dir = pos.dir;
        remote.isMoving = pos.isMoving;
        if (typeof pos.isSitting === 'boolean') {
          remote.isSitting = pos.isSitting;
        }
        remote.zoneId = pos.zoneId;
        if (typeof pos.hp === 'number') remote.hp = pos.hp;
        if (typeof pos.isKnockedOut === 'boolean') remote.isKnockedOut = pos.isKnockedOut;
        if (pos.equippedWeapon !== undefined) remote.equippedWeapon = pos.equippedWeapon;
        if (pos.invincibleUntil !== undefined) remote.invincibleUntil = pos.invincibleUntil;
        if (typeof pos.coins === 'number') remote.coins = pos.coins;
        if (pos.currentMount !== undefined) remote.currentMount = pos.currentMount;
        if (typeof pos.kills === 'number') remote.kills = pos.kills;
      }
    }
  }

  public setGroundCoins(coins: GroundCoin[]): void {
    this.groundCoins.clear();
    for (const c of coins) {
      this.groundCoins.set(c.id, c);
    }
  }

  public addGroundCoin(coin: GroundCoin): void {
    this.groundCoins.set(coin.id, coin);
    this.spawnRespawnSparks(coin.x, coin.y);
  }

  public removeGroundCoin(coinId: string, collectorId?: string): void {
    const coin = this.groundCoins.get(coinId);
    if (coin) {
      this.groundCoins.delete(coinId);
      this.addDamageText(coin.x, coin.y - 12, '+1 Xu 🪙', '#f59e0b');
      if (this.localPlayer && collectorId === this.localPlayer.id) {
        soundManager.playCoinPickup();
      }
    }
  }

  public updatePlayerMount(playerId: string, mount: MountType | null): void {
    if (this.localPlayer && this.localPlayer.id === playerId) {
      this.localPlayer.currentMount = mount;
      soundManager.playVehicleMount();
    } else {
      const r = this.remotePlayers.get(playerId);
      if (r) r.currentMount = mount;
    }
  }

  public triggerLocalAttack(): void {
    if (this.isInputDisabled || !this.localPlayer || this.localPlayer.isKnockedOut) return;

    const now = Date.now();
    if (now - this.lastAttackTime < 280) return; // Attack cooldown 280ms
    this.lastAttackTime = now;

    const weapon = this.localPlayer.equippedWeapon || 'candy_blade';
    let baseAngle = Math.PI / 2;
    if (this.localPlayer.dir === 'up') baseAngle = -Math.PI / 2;
    else if (this.localPlayer.dir === 'left') baseAngle = Math.PI;
    else if (this.localPlayer.dir === 'right') baseAngle = 0;

    // Register local swing animation
    this.attackSwings.set(this.localPlayer.id, {
      startTime: now,
      weapon,
      angle: baseAngle,
      dir: this.localPlayer.dir
    });

    // Add local slash effect immediately with coins upgrade
    this.addSlashEffect(this.localPlayer.x, this.localPlayer.y, baseAngle, this.localPlayer.dir, weapon, this.localPlayer.coins || 0);
    soundManager.playWeaponSlash(weapon);

    if (this.onAttack) {
      this.onAttack(weapon);
    }
  }

  public handleRemoteAttack(attackerId: string, weapon: WeaponType, x: number, y: number, dir: Direction, angle: number): void {
    const now = Date.now();
    const attacker = this.remotePlayers.get(attackerId);
    const coins = attacker?.coins || 0;
    this.attackSwings.set(attackerId, { startTime: now, weapon, angle, dir });
    this.addSlashEffect(x, y, angle, dir, weapon, coins);

    if (this.localPlayer && attackerId !== this.localPlayer.id) {
      soundManager.playWeaponSlash(weapon);
    }
  }

  public handlePlayerHit(payload: { attackerId: string; victimId: string; damage: number; victimHp: number; weapon: WeaponType; x: number; y: number; knockbackX?: number; knockbackY?: number }): void {
    const { victimId, damage, victimHp, weapon, x, y, knockbackX, knockbackY } = payload;
    let victim: Player | null = null;
    if (this.localPlayer && this.localPlayer.id === victimId) {
      victim = this.localPlayer;
    } else {
      victim = this.remotePlayers.get(victimId) || null;
    }

    if (victim) {
      victim.hp = victimHp;
      victim.hitFlashUntil = Date.now() + 180;
      if (typeof knockbackX === 'number' && typeof knockbackY === 'number') {
        victim.x += knockbackX;
        victim.y += knockbackY;
        if ('targetX' in victim) {
          victim.targetX = victim.x;
          victim.targetY = victim.y;
        }
      }
    }

    // Spawn floating damage text
    this.addDamageText(x, y - 24, `-${damage}`, '#f43f5e');

    // Spawn sparks
    this.spawnHitSparks(x, y, weapon);

    // Audio hit
    soundManager.playWeaponHit(weapon);
  }

  public handlePlayerKnockout(payload: { victimId: string; attackerId: string; weapon: WeaponType; x: number; y: number }): void {
    const { victimId, x, y } = payload;
    let victim: Player | null = null;
    if (this.localPlayer && this.localPlayer.id === victimId) {
      victim = this.localPlayer;
    } else {
      victim = this.remotePlayers.get(victimId) || null;
    }

    if (victim) {
      victim.isKnockedOut = true;
      victim.hp = 0;
    }

    this.spawnDroppedCoins(x, y);
    soundManager.playKnockout();
  }

  public handlePlayerRespawn(payload: { playerId: string; hp: number; x?: number; y?: number; invincibleUntil: number }): void {
    const { playerId, hp, x, y, invincibleUntil } = payload;
    let p: Player | null = null;
    if (this.localPlayer && this.localPlayer.id === playerId) {
      p = this.localPlayer;
    } else {
      p = this.remotePlayers.get(playerId) || null;
    }

    if (p) {
      p.hp = hp;
      p.isKnockedOut = false;
      p.invincibleUntil = invincibleUntil;
      if (typeof x === 'number' && typeof y === 'number') {
        p.x = x;
        p.y = y;
        p.targetX = x;
        p.targetY = y;
      }
      this.spawnRespawnSparks(p.x, p.y);
    }

    soundManager.playRespawn();
  }

  public handleWeaponEquip(playerId: string, weapon: WeaponType): void {
    let p: Player | null = null;
    if (this.localPlayer && this.localPlayer.id === playerId) {
      p = this.localPlayer;
      soundManager.playWeaponEquip();
    } else {
      p = this.remotePlayers.get(playerId) || null;
    }

    if (p) {
      p.equippedWeapon = weapon;
    }
  }

  private addSlashEffect(x: number, y: number, angle: number, dir: Direction, weapon: WeaponType, attackerCoins: number = 0): void {
    this.slashes.push({
      x,
      y: y + 2,
      angle,
      dir,
      weapon,
      attackerCoins,
      life: 0,
      maxLife: 0.18
    });
  }

  private addDamageText(x: number, y: number, text: string, color: string): void {
    this.damageTexts.push({
      x: x + (Math.random() * 16 - 8),
      y,
      text,
      color,
      life: 0,
      maxLife: 0.85
    });
  }

  private spawnHitSparks(x: number, y: number, weapon: WeaponType): void {
    const count = 14;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      let shape: 'star' | 'heart' | 'bubble' | 'circle' = 'star';
      let color = '#fbbf24';

      if (weapon === 'star_wand') {
        shape = Math.random() > 0.5 ? 'star' : 'heart';
        color = Math.random() > 0.5 ? '#f472b6' : '#c084fc';
      } else if (weapon === 'water_gun') {
        shape = 'bubble';
        color = Math.random() > 0.5 ? '#38bdf8' : '#7dd3fc';
      } else if (weapon === 'candy_blade') {
        const candyColors = ['#f43f5e', '#fb923c', '#fde047', '#4ade80', '#38bdf8', '#c084fc'];
        color = candyColors[Math.floor(Math.random() * candyColors.length)];
        shape = 'circle';
      } else if (weapon === 'toy_hammer') {
        shape = 'star';
        color = Math.random() > 0.5 ? '#f59e0b' : '#fde047';
      }

      this.sparks.push({
        x,
        y: y + 4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        color,
        size: 3 + Math.random() * 3,
        shape,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.3
      });
    }
  }

  private spawnDroppedCoins(x: number, y: number): void {
    for (let i = 0; i < 3; i++) {
      const angle = (Math.PI * 2 * i) / 3 + (Math.random() * 0.4 - 0.2);
      const speed = 1.5 + Math.random() * 2;
      this.droppedCoins.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: -2.5 - Math.random() * 2,
        groundY: y + 10 + Math.random() * 10,
        life: 0,
        maxLife: 3.5
      });
    }
  }

  private spawnRespawnSparks(x: number, y: number): void {
    const rainbow = ['#f43f5e', '#fb923c', '#fde047', '#4ade80', '#38bdf8', '#c084fc'];
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16;
      const speed = 2 + Math.random() * 2;
      this.sparks.push({
        x,
        y: y - 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        color: rainbow[i % rainbow.length],
        size: 4,
        shape: 'star',
        life: 0,
        maxLife: 0.6
      });
    }
  }

  public triggerEmote(playerId: string, emote: string): void {
    soundManager.playEmote();
    const expiresAt = Date.now() + 3000;
    if (this.localPlayer && this.localPlayer.id === playerId) {
      this.localPlayer.currentEmote = { emote, expiresAt };
    } else {
      const remote = this.remotePlayers.get(playerId);
      if (remote) {
        remote.currentEmote = { emote, expiresAt };
      }
    }
  }

  public triggerSpeech(playerId: string, text: string): void {
    soundManager.playChatPop();
    const expiresAt = Date.now() + 4500;
    if (this.localPlayer && this.localPlayer.id === playerId) {
      this.localPlayer.currentSpeech = { text, expiresAt };
    } else {
      const remote = this.remotePlayers.get(playerId);
      if (remote) {
        remote.currentSpeech = { text, expiresAt };
      }
    }
  }

  private setupListeners(): void {
    window.addEventListener('resize', this.handleResize);

    window.addEventListener('keydown', (e) => {
      if (this.isInputDisabled) return;

      const code = e.code;
      const key = e.key ? e.key.toLowerCase() : '';
      const isMoveKey =
        ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code) ||
        ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key);

      if (isMoveKey) {
        this.clickTarget = null;
        if (code) this.keysDown.add(code);
        if (key === 'w') this.keysDown.add('KeyW');
        if (key === 'a') this.keysDown.add('KeyA');
        if (key === 's') this.keysDown.add('KeyS');
        if (key === 'd') this.keysDown.add('KeyD');
        if (key === 'arrowup') this.keysDown.add('ArrowUp');
        if (key === 'arrowdown') this.keysDown.add('ArrowDown');
        if (key === 'arrowleft') this.keysDown.add('ArrowLeft');
        if (key === 'arrowright') this.keysDown.add('ArrowRight');
        e.preventDefault();
      }

      if (code === 'KeyE' || key === 'e') {
        this.tryInteract();
        e.preventDefault();
      }

      if (code === 'Space' || key === ' ') {
        this.triggerLocalAttack();
        e.preventDefault();
      }

      if (code === 'KeyZ' || key === 'z') {
        // Toggle Sit
        if (this.localPlayer) {
          this.localPlayer.isSitting = !this.localPlayer.isSitting;
          this.onPlayerMove(
            this.localPlayer.x,
            this.localPlayer.y,
            this.localPlayer.dir,
            false,
            this.localPlayer.isSitting
          );
        }
      }

      if (code === 'Tab') {
        e.preventDefault();
        if (this.onToggleRanking) {
          this.onToggleRanking();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      const code = e.code;
      const key = e.key ? e.key.toLowerCase() : '';
      if (code) this.keysDown.delete(code);
      if (key === 'w') this.keysDown.delete('KeyW');
      if (key === 'a') this.keysDown.delete('KeyA');
      if (key === 's') this.keysDown.delete('KeyS');
      if (key === 'd') this.keysDown.delete('KeyD');
      if (key === 'arrowup') this.keysDown.delete('ArrowUp');
      if (key === 'arrowdown') this.keysDown.delete('ArrowDown');
      if (key === 'arrowleft') this.keysDown.delete('ArrowLeft');
      if (key === 'arrowright') this.keysDown.delete('ArrowRight');
    });

    // Canvas click to move or interact or attack
    this.canvas.addEventListener('click', (e) => {
      if (this.isInputDisabled || !this.localPlayer) return;

      const rect = this.canvas.getBoundingClientRect();
      const worldClickX = e.clientX - rect.left + this.cameraX;
      const worldClickY = e.clientY - rect.top + this.cameraY;

      // Check if clicked an interactive object
      for (const obj of this.objects) {
        if (
          worldClickX >= obj.x &&
          worldClickX <= obj.x + obj.width &&
          worldClickY >= obj.y &&
          worldClickY <= obj.y + obj.height
        ) {
          const dist = Math.hypot(this.localPlayer.x - (obj.x + obj.width / 2), this.localPlayer.y - (obj.y + obj.height / 2));
          if (dist <= 120) {
            this.onInteract(obj);
            return;
          }
        }
      }

      // Check if clicked on/near another player or within combat melee range
      const distFromPlayer = Math.hypot(worldClickX - this.localPlayer.x, worldClickY - this.localPlayer.y);
      let clickedOtherPlayer = false;
      for (const remote of this.remotePlayers.values()) {
        const d = Math.hypot(worldClickX - remote.x, worldClickY - remote.y);
        if (d <= 32) {
          clickedOtherPlayer = true;
          break;
        }
      }

      if (clickedOtherPlayer || (this.localPlayer.equippedWeapon && distFromPlayer <= 80)) {
        // Face attack direction and swing
        if (Math.abs(worldClickX - this.localPlayer.x) > Math.abs(worldClickY - this.localPlayer.y)) {
          this.localPlayer.dir = worldClickX > this.localPlayer.x ? 'right' : 'left';
        } else {
          this.localPlayer.dir = worldClickY > this.localPlayer.y ? 'down' : 'up';
        }
        this.triggerLocalAttack();
        return;
      }

      // If clicked on walkable ground, set target to walk to
      this.clickTarget = { x: worldClickX, y: worldClickY };
    });
  }

  private handleResize = (): void => {
    const parent = this.canvas.parentElement;
    if (!parent) return;

    const w = parent.clientWidth;
    const h = parent.clientHeight;
    this.canvas.width = w;
    this.canvas.height = h;
    this.viewW = w;
    this.viewH = h;
    this.clampCamera();
  };

  private tryInteract(): void {
    if (!this.localPlayer) return;

    // Find nearest interactive object within 80px
    let nearest: WorldObject | null = null;
    let minDist = 90;

    for (const obj of this.objects) {
      const objCenterX = obj.x + obj.width / 2;
      const objCenterY = obj.y + obj.height / 2;
      const dist = Math.hypot(this.localPlayer.x - objCenterX, this.localPlayer.y - objCenterY);
      if (dist < minDist) {
        minDist = dist;
        nearest = obj;
      }
    }

    if (nearest) {
      this.onInteract(nearest);
    } else if (this.localPlayer.currentMount && this.onMountToggle) {
      // If currently riding and press E in open world, dismount
      this.onMountToggle(null);
    }
  }

  public start(): void {
    this.lastTime = performance.now();
    const loop = (time: number) => {
      const dt = Math.min((time - this.lastTime) / 1000, 0.1);
      this.lastTime = time;

      this.update(dt);
      this.render();

      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  public stop(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    window.removeEventListener('resize', this.handleResize);
  }

  private update(dt: number): void {
    if (!this.localPlayer) return;

    // Dynamic movement speed based on vehicle or mount
    let speed = 3.5;
    if (this.localPlayer.currentMount === 'kart') speed = 6.3;
    else if (this.localPlayer.currentMount === 'horse') speed = 5.4;
    this.moveSpeed = speed;

    let dx = 0;
    let dy = 0;

    if (!this.isInputDisabled) {
      if (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp')) dy -= 1;
      if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) dy += 1;
      if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) dx -= 1;
      if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) dx += 1;

      // Handle Click-to-Move if no keys are pressed
      if (dx === 0 && dy === 0 && this.clickTarget) {
        const toX = this.clickTarget.x - this.localPlayer.x;
        const toY = this.clickTarget.y - (this.localPlayer.y + 6);
        const dist = Math.hypot(toX, toY);
        if (dist > 6) {
          dx = toX / dist;
          dy = toY / dist;
        } else {
          this.clickTarget = null;
        }
      }
    }

    if (this.localPlayer.isKnockedOut) {
      dx = 0;
      dy = 0;
      this.clickTarget = null;
    }

    const isMoving = dx !== 0 || dy !== 0;

    if (isMoving) {
      if (this.localPlayer.isSitting) {
        this.localPlayer.isSitting = false;
      }

      // Normalize diagonal vector
      if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
      }

      // Determine face direction
      let dir = this.localPlayer.dir;
      if (Math.abs(dx) > Math.abs(dy)) {
        dir = dx > 0 ? 'right' : 'left';
      } else if (dy !== 0) {
        dir = dy > 0 ? 'down' : 'up';
      }

      const newX = this.localPlayer.x + dx * this.moveSpeed;
      const newY = this.localPlayer.y + dy * this.moveSpeed;

      // Collision checks at player's feet (standard 2D RPG hitbox: 16x10)
      let finalX = this.localPlayer.x;
      let finalY = this.localPlayer.y;

      const halfW = 8;
      const halfH = 5;
      const curFeetY = this.localPlayer.y + 6;
      const newFeetY = newY + 6;

      const isCurrentlyStuck =
        this.tilemap.isBlocked(this.localPlayer.x - halfW, curFeetY) ||
        this.tilemap.isBlocked(this.localPlayer.x + halfW, curFeetY);

      if (isCurrentlyStuck) {
        // If spawned or trapped inside a wall, allow player to freely walk out
        finalX = newX;
        finalY = newY;
      } else {
        const canMoveX =
          !this.tilemap.isBlocked(newX - halfW, curFeetY - halfH) &&
          !this.tilemap.isBlocked(newX + halfW, curFeetY - halfH) &&
          !this.tilemap.isBlocked(newX - halfW, curFeetY + halfH) &&
          !this.tilemap.isBlocked(newX + halfW, curFeetY + halfH);

        if (canMoveX) {
          finalX = newX;
        }

        const canMoveY =
          !this.tilemap.isBlocked(finalX - halfW, newFeetY - halfH) &&
          !this.tilemap.isBlocked(finalX + halfW, newFeetY - halfH) &&
          !this.tilemap.isBlocked(finalX - halfW, newFeetY + halfH) &&
          !this.tilemap.isBlocked(finalX + halfW, newFeetY + halfH);

        if (canMoveY) {
          finalY = newY;
        }

        // If click-to-move hit an obstacle and cannot move further, stop target
        if (this.clickTarget && finalX === this.localPlayer.x && finalY === this.localPlayer.y) {
          this.clickTarget = null;
        }
      }

      this.localPlayer.x = finalX;
      this.localPlayer.y = finalY;
      this.localPlayer.dir = dir;
      this.localPlayer.isMoving = true;

      // Footstep sound
      this.stepSoundTimer += dt;
      if (this.stepSoundTimer > 0.28) {
        soundManager.playStep();
        this.stepSoundTimer = 0;
      }

      // Check current zone
      this.checkZoneTransition(finalX, finalY);

      this.onPlayerMove(finalX, finalY, dir, true, this.localPlayer.isSitting);
    } else {
      if (this.localPlayer.isMoving) {
        this.localPlayer.isMoving = false;
        this.onPlayerMove(
          this.localPlayer.x,
          this.localPlayer.y,
          this.localPlayer.dir,
          false,
          this.localPlayer.isSitting
        );
      }
    }

    // Smoothly interpolate (LERP) remote players
    for (const remote of this.remotePlayers.values()) {
      const lerpFactor = 0.2;
      remote.x += (remote.targetX - remote.x) * lerpFactor;
      remote.y += (remote.targetY - remote.y) * lerpFactor;
    }

    // Smooth camera follow
    const targetCamX = this.localPlayer.x - this.viewW / 2;
    const targetCamY = this.localPlayer.y - this.viewH / 2;
    this.cameraX += (targetCamX - this.cameraX) * 0.12;
    this.cameraY += (targetCamY - this.cameraY) * 0.12;
    this.clampCamera();

    // Advance Slashes
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const s = this.slashes[i];
      s.life += dt;
      if (s.life >= s.maxLife) {
        this.slashes.splice(i, 1);
      }
    }

    // Advance Sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const sp = this.sparks[i];
      sp.life += dt;
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.vy += 0.14; // gravity
      if (sp.life >= sp.maxLife) {
        this.sparks.splice(i, 1);
      }
    }

    // Advance Damage Texts
    for (let i = this.damageTexts.length - 1; i >= 0; i--) {
      const dtText = this.damageTexts[i];
      dtText.life += dt;
      dtText.y -= 0.6; // float up
      if (dtText.life >= dtText.maxLife) {
        this.damageTexts.splice(i, 1);
      }
    }

    // Advance Dropped Coins
    for (let i = this.droppedCoins.length - 1; i >= 0; i--) {
      const c = this.droppedCoins[i];
      c.life += dt;
      c.x += c.vx;
      c.y += c.vy;
      c.vy += 0.22; // gravity
      if (c.y >= c.groundY) {
        c.y = c.groundY;
        c.vy = -c.vy * 0.45; // bounce
        c.vx *= 0.7;
      }
      if (c.life >= c.maxLife) {
        this.droppedCoins.splice(i, 1);
      }
    }
  }

  private checkZoneTransition(x: number, y: number): void {
    let matchedZone: MapZone | null = null;
    for (const z of this.zones) {
      if (x >= z.x && x <= z.x + z.width && y >= z.y && y <= z.y + z.height) {
        matchedZone = z;
        break;
      }
    }

    if (matchedZone?.id !== this.activeZone?.id) {
      this.activeZone = matchedZone;
      if (matchedZone?.isPrivate) {
        soundManager.playDoor();
      }
      this.onZoneChange(matchedZone);
    }
  }

  private clampCamera(): void {
    const maxX = Math.max(0, MAP_WIDTH - this.viewW);
    const maxY = Math.max(0, MAP_HEIGHT - this.viewH);
    this.cameraX = Math.max(0, Math.min(this.cameraX, maxX));
    this.cameraY = Math.max(0, Math.min(this.cameraY, maxY));
  }

  private render(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.viewW, this.viewH);

    ctx.save();
    ctx.translate(-Math.round(this.cameraX), -Math.round(this.cameraY));

    // 1. Draw Tilemap & World Objects
    this.tilemap.draw(ctx, this.cameraX, this.cameraY, this.viewW, this.viewH, this.zones, this.objects);

    // 1.5 Draw Collectible Ground Coins
    this.drawGroundCoins(ctx);

    // 2. Draw Interaction Hint if close to an object
    this.drawInteractionPrompt(ctx);

    // 3. Collect and Sort Entities by Y-coordinate for proper 2.5D depth
    const allEntities: Player[] = [];
    if (this.localPlayer) allEntities.push(this.localPlayer);
    for (const remote of this.remotePlayers.values()) {
      allEntities.push(remote);
    }
    allEntities.sort((a, b) => a.y - b.y);

    // 4. Render Players
    for (const p of allEntities) {
      this.drawPlayer(ctx, p, p.id === this.localPlayer?.id);
    }

    // 4.5 Render Combat Effects (Slashes, Sparks, Damage Numbers, Dropped Coins)
    this.drawCombatEffects(ctx);

    // 5. Draw Speech Bubbles & Emotes on top
    for (const p of allEntities) {
      this.drawOverheadBubble(ctx, p);
    }

    ctx.restore();

    // 6. Kawaii Bright Ambient Warmth Layer
    const sunGlow = ctx.createRadialGradient(
      this.viewW / 2,
      this.viewH / 2,
      Math.min(this.viewW, this.viewH) * 0.3,
      this.viewW / 2,
      this.viewH / 2,
      Math.max(this.viewW, this.viewH) * 0.9
    );
    sunGlow.addColorStop(0, 'rgba(255, 255, 255, 0.02)');
    sunGlow.addColorStop(1, 'rgba(255, 237, 213, 0.12)');
    ctx.fillStyle = sunGlow;
    ctx.fillRect(0, 0, this.viewW, this.viewH);
  }

  private drawGroundCoins(ctx: CanvasRenderingContext2D): void {
    const time = Date.now();
    for (const coin of this.groundCoins.values()) {
      const bob = Math.sin(time / 180 + coin.x * 0.1) * 3;
      const cy = coin.y + bob;

      // Soft ground shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.beginPath();
      ctx.ellipse(coin.x, coin.y + 10, 9, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Golden outer glow
      const pulse = (Math.sin(time / 160 + coin.y * 0.1) + 1) / 2;
      ctx.fillStyle = `rgba(251, 191, 36, ${0.3 + pulse * 0.3})`;
      ctx.beginPath();
      ctx.arc(coin.x, cy, 12, 0, Math.PI * 2);
      ctx.fill();

      // Shiny Gold Coin Disc
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(coin.x, cy, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Inner bevel
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(coin.x, cy, 6.5, 0, Math.PI * 2);
      ctx.stroke();

      // Shopee 'S'
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('S', coin.x, cy + 0.5);

      // Rotating sparkle stars
      for (let i = 0; i < 2; i++) {
        const starAngle = (time / 300 + (i * Math.PI)) + coin.x;
        const sx = coin.x + Math.cos(starAngle) * 11;
        const sy = cy + Math.sin(starAngle) * 7;
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(sx, sy, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawRidingKart(ctx: CanvasRenderingContext2D, p: Player, bounce: number, time: number): void {
    const isMoving = p.isMoving;
    const dir = p.dir;

    ctx.save();
    // Wheels vibration when driving
    const vib = isMoving ? Math.sin(time / 30) * 1 : 0;

    // Headlight cone beams cast on ground
    ctx.fillStyle = 'rgba(254, 240, 138, 0.2)';
    ctx.beginPath();
    if (dir === 'down') {
      ctx.moveTo(-10, 14);
      ctx.lineTo(-24, 46);
      ctx.lineTo(24, 46);
      ctx.lineTo(10, 14);
    } else if (dir === 'up') {
      ctx.moveTo(-10, -8);
      ctx.lineTo(-24, -40);
      ctx.lineTo(24, -40);
      ctx.lineTo(10, -8);
    } else if (dir === 'left') {
      ctx.moveTo(-12, 0);
      ctx.lineTo(-44, -18);
      ctx.lineTo(-44, 20);
      ctx.lineTo(-12, 10);
    } else {
      ctx.moveTo(12, 0);
      ctx.lineTo(44, -18);
      ctx.lineTo(44, 20);
      ctx.lineTo(12, 10);
    }
    ctx.closePath();
    ctx.fill();

    // 4 Rubber Tires
    ctx.fillStyle = '#1e293b';
    if (dir === 'left' || dir === 'right') {
      ctx.roundRect(-16, 8 + vib, 10, 8, 3);
      ctx.roundRect(8, 8 + vib, 10, 8, 3);
    } else {
      ctx.roundRect(-17, -2 + vib, 6, 12, 3);
      ctx.roundRect(11, -2 + vib, 6, 12, 3);
      ctx.roundRect(-17, 8 + vib, 6, 12, 3);
      ctx.roundRect(11, 8 + vib, 6, 12, 3);
    }
    ctx.fill();

    // Kart Chassis (Shopee Red-Orange)
    ctx.fillStyle = '#ee4d2d';
    ctx.beginPath();
    ctx.roundRect(-14, 2 + bounce * 0.5, 28, 16, 6);
    ctx.fill();

    // Front Bumper / Hood
    ctx.fillStyle = '#ea580c';
    if (dir === 'down') {
      ctx.fillRect(-12, 12, 24, 5);
      // Yellow headlights
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(-8, 14, 2.5, 0, Math.PI * 2);
      ctx.arc(8, 14, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (dir === 'up') {
      ctx.fillRect(-12, 1, 24, 4);
    } else if (dir === 'left') {
      ctx.fillRect(-16, 4, 5, 12);
      // Left headlight
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(-15, 6, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(11, 4, 5, 12);
      // Right headlight
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(15, 6, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Steering Wheel in front of driver
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 3 + bounce * 0.5, 4.5, 0, Math.PI * 2);
    ctx.stroke();

    // Exhaust Smoke Puffs if moving
    if (isMoving && Math.random() < 0.3) {
      let exX = 0;
      let exY = 16;
      if (dir === 'down') exY = -2;
      else if (dir === 'up') exY = 18;
      else if (dir === 'left') exX = 16;
      else if (dir === 'right') exX = -16;

      this.sparks.push({
        x: p.x + exX + (Math.random() * 4 - 2),
        y: p.y + exY,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -0.8 - Math.random() * 0.5,
        color: 'rgba(226, 232, 240, 0.7)',
        size: 3 + Math.random() * 2,
        shape: 'circle',
        life: 0,
        maxLife: 0.35
      });
    }

    ctx.restore();
  }

  private drawRidingHorse(ctx: CanvasRenderingContext2D, p: Player, bounce: number, time: number): void {
    const isMoving = p.isMoving;
    const dir = p.dir;

    ctx.save();
    // Galloping rhythm bob
    const gallop = isMoving ? Math.sin(time / 65) * 3.5 : 0;

    // 4 Pony Legs & Golden Hooves
    ctx.fillStyle = '#ffffff';
    const legMotion = isMoving ? Math.sin(time / 65) * 4 : 0;
    [-9, -3, 3, 9].forEach((lx, idx) => {
      const offset = (idx % 2 === 0 ? legMotion : -legMotion);
      ctx.fillRect(lx - 1.5, 8 + gallop + offset, 3.5, 8);
    });
    // Golden Hooves
    ctx.fillStyle = '#f59e0b';
    [-9, -3, 3, 9].forEach((lx, idx) => {
      const offset = (idx % 2 === 0 ? legMotion : -legMotion);
      ctx.fillRect(lx - 1.5, 15 + gallop + offset, 3.5, 3);
    });

    // Pony Chibi Body (White)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, 7 + gallop * 0.5, 14, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Pony Head
    let headX = -9;
    let headY = 1 + gallop * 0.5;
    if (dir === 'right') headX = 9;
    else if (dir === 'up') headY = -3 + gallop * 0.5;
    else if (dir === 'down') headY = 4 + gallop * 0.5;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(headX, headY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Unicorn Golden Horn
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(headX, headY - 6);
    ctx.lineTo(headX + (dir === 'right' ? 4 : -4), headY - 14);
    ctx.lineTo(headX + 2, headY - 6);
    ctx.closePath();
    ctx.fill();

    // Rainbow Mane (Pink & Cyan)
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.arc(headX - (dir === 'right' ? 4 : -4), headY - 4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(headX - (dir === 'right' ? 7 : -7), headY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Rainbow Tail
    const tailX = dir === 'right' ? -13 : 13;
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.ellipse(tailX, 6 + gallop * 0.5, 3.5, 6, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Golden & Orange Saddle under player
    ctx.fillStyle = '#ee4d2d';
    ctx.fillRect(-7, 4 + gallop * 0.5, 14, 4);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-7, 7 + gallop * 0.5, 14, 1.5);

    // Sparkles from hooves when galloping
    if (isMoving && Math.random() < 0.28) {
      const rainbow = ['#f43f5e', '#fb923c', '#fde047', '#4ade80', '#38bdf8', '#c084fc'];
      this.sparks.push({
        x: p.x + (Math.random() * 16 - 8),
        y: p.y + 16,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -0.8 - Math.random() * 0.6,
        color: rainbow[Math.floor(Math.random() * rainbow.length)],
        size: 3,
        shape: 'star',
        life: 0,
        maxLife: 0.35
      });
    }

    ctx.restore();
  }

  private drawInteractionPrompt(ctx: CanvasRenderingContext2D): void {
    if (!this.localPlayer) return;

    for (const obj of this.objects) {
      const cx = obj.x + obj.width / 2;
      const cy = obj.y + obj.height / 2;
      const dist = Math.hypot(this.localPlayer.x - cx, this.localPlayer.y - cy);

      if (dist < 85) {
        // Kawaii Cloud Prompt Pill
        const promptText = obj.interactionPrompt;
        ctx.font = 'bold 12px "Be Vietnam Pro", sans-serif';
        const textW = ctx.measureText(promptText).width;
        const pillW = textW + 24;
        const pillH = 26;
        const px = cx - pillW / 2;
        const py = obj.y - 32;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
        ctx.strokeStyle = '#ff7043';
        ctx.lineWidth = 2;

        // Rounded pill
        ctx.beginPath();
        ctx.roundRect(px, py, pillW, pillH, 13);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ea580c';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(promptText, cx, py + pillH / 2);
        break;
      }
    }
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, p: Player, isSelf: boolean): void {
    const { x, y, dir, isMoving, isSitting, skin } = p;
    const time = Date.now();
    const bodyColor = skin.outfitColor || '#ee4d2d';
    const hairColor = skin.hairColor || '#4f46e5';
    const skinTone = skin.bodyColor || '#fcd34d';

    ctx.save();
    ctx.translate(x, y);

    // 0. Cute Knockout Ghost State
    if (p.isKnockedOut) {
      const ghostBob = Math.sin(time / 140) * 4.5;
      // Soft shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 14, 12, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ghost cute body
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.beginPath();
      ctx.arc(0, -10 + ghostBob, 12, Math.PI, 0, false);
      ctx.lineTo(12, 6 + ghostBob);
      // Wavy tail
      ctx.quadraticCurveTo(6, 12 + ghostBob, 0, 6 + ghostBob);
      ctx.quadraticCurveTo(-6, 12 + ghostBob, -12, 6 + ghostBob);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Ghost cute sleepy eyes
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('x  x', 0, -8 + ghostBob);

      // Cute blush
      ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
      ctx.beginPath();
      ctx.arc(-6, -5 + ghostBob, 2.5, 0, Math.PI * 2);
      ctx.arc(6, -5 + ghostBob, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Revolving dizzy stars overhead
      for (let i = 0; i < 3; i++) {
        const starAngle = (time / 300 + (i * Math.PI * 2) / 3);
        const sx = Math.cos(starAngle) * 15;
        const sy = -28 + ghostBob + Math.sin(starAngle) * 5;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Knockout status text
      ctx.font = 'bold 10px "Be Vietnam Pro", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f43f5e';
      ctx.fillText('💫 Hồi sinh sau 3s...', 0, -38 + ghostBob);

      ctx.restore();
      return;
    }

    const isMounted = !!p.currentMount;

    // 1. Smooth Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    if (isMounted) {
      ctx.ellipse(0, 15, 20, 8, 0, 0, Math.PI * 2);
    } else {
      ctx.ellipse(0, 14, 14, 6, 0, 0, Math.PI * 2);
    }
    ctx.fill();

    // Walking animation bounce & step cycle
    const bounce = isMoving ? Math.sin(time / 100) * 2.5 : 0;
    const legSwing = (isMoving && !isMounted) ? Math.sin(time / 80) * 5 : 0;

    // Render Mount Base (Kart or Pony) underneath feet
    if (p.currentMount === 'kart') {
      this.drawRidingKart(ctx, p, bounce, time);
    } else if (p.currentMount === 'horse') {
      this.drawRidingHorse(ctx, p, bounce, time);
    }

    // 2. Shoes / Feet (Animated Walking Cycle)
    ctx.fillStyle = '#0f172a';
    if (isMounted) {
      // Sitting snug in mount / over saddle
      ctx.fillRect(-7, 8, 5, 4);
      ctx.fillRect(2, 8, 5, 4);
    } else if (isSitting) {
      // Sitting shoes tucked forward
      ctx.fillRect(-8, 10, 6, 4);
      ctx.fillRect(2, 10, 6, 4);
    } else {
      // Left shoe & Right shoe
      ctx.fillRect(-8, 10 + legSwing, 6, 4);
      ctx.fillRect(2, 10 - legSwing, 6, 4);
    }

    // 3. Body / Torso (Jacket with white collar trim)
    ctx.fillStyle = bodyColor;
    if (isSitting) {
      ctx.beginPath();
      ctx.roundRect(-10, 0, 20, 12, 4);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.roundRect(-10, -6 + bounce, 20, 17, 4);
      ctx.fill();

      // White inner collar
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-3, -6 + bounce, 6, 4);

      // Arms swinging
      ctx.fillStyle = bodyColor;
      const armSwing = isMoving ? Math.sin(time / 80) * 4 : 0;
      ctx.beginPath();
      ctx.roundRect(-13, -4 + bounce + armSwing, 4, 10, 2);
      ctx.roundRect(9, -4 + bounce - armSwing, 4, 10, 2);
      ctx.fill();
    }

    // 4. Head
    ctx.fillStyle = skinTone;
    ctx.beginPath();
    ctx.arc(0, -16 + bounce, 11, 0, Math.PI * 2);
    ctx.fill();

    // 5. Hair (Back and Top)
    ctx.fillStyle = hairColor;
    ctx.beginPath();
    ctx.arc(0, -19 + bounce, 12, Math.PI * 0.9, Math.PI * 2.1);
    ctx.fill();

    // Hair Top Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.arc(0, -22 + bounce, 8, Math.PI * 1.1, Math.PI * 1.9);
    ctx.fill();

    // 6. Cute Chibi Face & Eyes
    const headY = -16 + bounce;
    if (dir === 'down') {
      // Left Eye
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(-4.5, headY, 2.5, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-5.5, headY - 1.2, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Right Eye
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(3.5, headY, 2.5, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(2.5, headY - 1.2, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Soft Blush Cheeks
      ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
      ctx.beginPath();
      ctx.arc(-7, headY + 3, 2.2, 0, Math.PI * 2);
      ctx.arc(6, headY + 3, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Smile
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(-0.5, headY + 2.5, 2, 0.2, Math.PI - 0.2);
      ctx.stroke();

      // Front Hair Bangs
      ctx.fillStyle = hairColor;
      ctx.beginPath();
      ctx.moveTo(-9, headY - 8);
      ctx.lineTo(-2, headY - 3);
      ctx.lineTo(3, headY - 8);
      ctx.lineTo(8, headY - 4);
      ctx.lineTo(9, headY - 9);
      ctx.fill();
    } else if (dir === 'up') {
      // Back of head
      ctx.fillStyle = hairColor;
      ctx.beginPath();
      ctx.arc(0, headY, 11, 0, Math.PI * 2);
      ctx.fill();
    } else if (dir === 'left') {
      // Profile Eye Left
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(-6, headY, 2.2, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-6.8, headY - 1.2, 1.1, 0, Math.PI * 2);
      ctx.fill();

      // Blush
      ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
      ctx.beginPath();
      ctx.arc(-4, headY + 3, 2, 0, Math.PI * 2);
      ctx.fill();

      // Side hair
      ctx.fillStyle = hairColor;
      ctx.beginPath();
      ctx.arc(2, headY - 2, 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (dir === 'right') {
      // Profile Eye Right
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(5, headY, 2.2, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(4.2, headY - 1.2, 1.1, 0, Math.PI * 2);
      ctx.fill();

      // Blush
      ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
      ctx.beginPath();
      ctx.arc(3, headY + 3, 2, 0, Math.PI * 2);
      ctx.fill();

      // Side hair
      ctx.fillStyle = hairColor;
      ctx.beginPath();
      ctx.arc(-2, headY - 2, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6.5 Draw Equipped Weapon Held in Hand (with attack swing rotation)
    this.drawEquippedWeapon(ctx, p, bounce, time);

    // 7. Glowing Ring around local player
    if (isSelf) {
      ctx.strokeStyle = '#ff7043';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 8, 19, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 7.5 Hit Flash Indicator
    if (p.hitFlashUntil && p.hitFlashUntil > time) {
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -6 + bounce, 21, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 7.6 Invincibility Shield
    if (p.invincibleUntil && p.invincibleUntil > time) {
      const pulse = (Math.sin(time / 120) + 1) / 2;
      const grad = ctx.createRadialGradient(0, -6 + bounce, 8, 0, -6 + bounce, 24);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
      grad.addColorStop(0.7, 'rgba(56, 189, 248, 0.2)');
      grad.addColorStop(1, 'rgba(192, 132, 252, 0.45)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, -6 + bounce, 23 + pulse * 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }

    // 8. Overhead Name Tag with Status Indicator
    ctx.font = 'bold 11px "Be Vietnam Pro", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const tagText = isSelf ? `${p.name} (Bạn)` : p.name;
    const tagW = ctx.measureText(tagText).width + 18;

    ctx.fillStyle = isSelf ? 'rgba(255, 255, 255, 0.96)' : 'rgba(255, 255, 255, 0.92)';
    ctx.strokeStyle = isSelf ? '#ff7043' : 'rgba(255, 112, 67, 0.3)';
    ctx.lineWidth = isSelf ? 1.5 : 1;
    ctx.beginPath();
    ctx.roundRect(-tagW / 2, -44 + bounce, tagW, 18, 9);
    ctx.fill();
    ctx.stroke();

    // Online green dot
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(-tagW / 2 + 7, -35 + bounce, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isSelf ? '#ea580c' : '#1e293b';
    ctx.fillText(tagText, 3, -30 + bounce);

    // 8.5 Overhead Flaming Kill Badge if player scored kills
    if (p.kills && p.kills > 0) {
      const badgeX = tagW / 2 + 12;
      const badgeY = -35 + bounce;
      const flamePulse = (Math.sin(time / 140) + 1) / 2;

      // Fiery glowing aura
      ctx.fillStyle = `rgba(239, 68, 68, ${0.35 + flamePulse * 0.4})`;
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, 11 + flamePulse * 2, 0, Math.PI * 2);
      ctx.fill();

      // Outer fire rim
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, 8.5, 0, Math.PI * 2);
      ctx.fill();

      // Inner molten yellow core
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, 6.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Fire kill text
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 8.5px "Be Vietnam Pro", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${p.kills}`, badgeX, badgeY + 0.5);
    }

    // 9. Overhead Cute HP Bar
    const maxHp = p.maxHp || 100;
    const curHp = Math.max(0, Math.min(p.hp !== undefined ? p.hp : 100, maxHp));
    const hpRatio = curHp / maxHp;
    const barW = 38;
    const barH = 5;
    const barX = -barW / 2;
    const barY = -24 + bounce;

    // HP Bar background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.beginPath();
    ctx.roundRect(barX - 1, barY - 1, barW + 2, barH + 2, 3);
    ctx.fill();

    let hpColor = '#10b981';
    if (hpRatio < 0.3) hpColor = '#f43f5e';
    else if (hpRatio < 0.6) hpColor = '#f59e0b';

    if (curHp > 0) {
      ctx.fillStyle = hpColor;
      ctx.beginPath();
      ctx.roundRect(barX, barY, Math.max(3, barW * hpRatio), barH, 2.5);
      ctx.fill();

      // Specular shine line
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillRect(barX + 2, barY + 0.8, Math.max(2, (barW * hpRatio) - 4), 1.2);
    }

    ctx.restore();
  }

  private drawEquippedWeapon(ctx: CanvasRenderingContext2D, p: Player, bounce: number, time: number): void {
    if (!p.equippedWeapon) return;

    const weapon = p.equippedWeapon;
    const dir = p.dir;

    // Check active attack swing
    const swing = this.attackSwings.get(p.id);
    let swingProgress = -1;
    if (swing && (time - swing.startTime) < 200) {
      swingProgress = (time - swing.startTime) / 200;
    } else if (swing) {
      this.attackSwings.delete(p.id);
    }

    ctx.save();

    // Determine hand pivot
    let hx = 10;
    let hy = 2 + bounce;
    let baseAngle = 0.2;

    if (dir === 'down') {
      hx = 11;
      hy = 3 + bounce;
      baseAngle = 0.4;
    } else if (dir === 'up') {
      hx = 9;
      hy = -2 + bounce;
      baseAngle = -0.5;
    } else if (dir === 'left') {
      hx = -10;
      hy = 2 + bounce;
      baseAngle = -0.4;
    } else if (dir === 'right') {
      hx = 10;
      hy = 2 + bounce;
      baseAngle = 0.4;
    }

    ctx.translate(hx, hy);

    // Apply swing rotation
    if (swingProgress >= 0) {
      const swingArc = Math.sin(swingProgress * Math.PI) * 1.5;
      ctx.rotate(baseAngle + (dir === 'left' ? -swingArc : swingArc));
    } else {
      ctx.rotate(baseAngle);
    }

    // Weapon scale upgraded with coins (up to +65% larger)
    const coins = p.coins || 0;
    const coinScale = 1 + Math.min(0.65, coins * 0.07);
    ctx.scale(coinScale, coinScale);

    // Golden radiance & rotating stars aura if player has coins!
    if (coins > 0) {
      const auraPulse = (Math.sin(time / 140) + 1) / 2;
      ctx.strokeStyle = `rgba(251, 191, 36, ${0.35 + auraPulse * 0.35})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, -6, 12 + auraPulse * 3, 0, Math.PI * 2);
      ctx.stroke();

      const sa = time / 220;
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(Math.cos(sa) * 14, -6 + Math.sin(sa) * 9, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    if (weapon === 'candy_blade') {
      // 🍭 Lollipop Blade
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-1.5, -4, 3, 16);
      const rainbow = ['#f43f5e', '#fb923c', '#fde047', '#4ade80', '#38bdf8', '#c084fc'];
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = rainbow[i];
        ctx.beginPath();
        ctx.moveTo(0, -9);
        ctx.arc(0, -9, 8, (i * Math.PI) / 3, ((i + 1) * Math.PI) / 3);
        ctx.fill();
      }
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -9, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (weapon === 'toy_hammer') {
      // 🔨 Squeaky Toy Hammer
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-1.5, -3, 3, 16);
      // Mallet head
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.roundRect(-10, -12, 20, 10, 3);
      ctx.fill();
      // Star sticker
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(0, -7, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (weapon === 'star_wand') {
      // 🪄 Star Magical Wand
      ctx.fillStyle = '#f472b6';
      ctx.fillRect(-1.5, -3, 3, 16);
      // Star head
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const rot = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        const rOuter = 8;
        const rInner = 4;
        ctx.lineTo(Math.cos(rot) * rOuter, -8 + Math.sin(rot) * rOuter);
        const rotInner = rot + Math.PI / 5;
        ctx.lineTo(Math.cos(rotInner) * rInner, -8 + Math.sin(rotInner) * rInner);
      }
      ctx.closePath();
      ctx.fill();
    } else if (weapon === 'water_gun') {
      // 🔫 Duckie Water Blaster
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.roundRect(-4, -8, 16, 9, 3);
      ctx.fill();
      ctx.fillStyle = '#f97316';
      ctx.fillRect(12, -6, 4, 4);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-2, -12, 8, 5);
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(6, -4, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawCombatEffects(ctx: CanvasRenderingContext2D): void {
    // 1. Draw Slashes
    for (const s of this.slashes) {
      const p = s.life / s.maxLife; // 0 -> 1
      const alpha = 1 - p;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);

      const coinBonus = Math.min(28, (s.attackerCoins || 0) * 3.5);
      const arcRadius = 32 + p * 20 + coinBonus;

      if (s.weapon === 'candy_blade') {
        // Rainbow 7-color crescent slash
        const colors = ['#f43f5e', '#fb923c', '#fde047', '#4ade80', '#38bdf8', '#c084fc'];
        for (let i = 0; i < colors.length; i++) {
          ctx.strokeStyle = colors[i];
          ctx.globalAlpha = alpha * 0.9;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, arcRadius - i * 1.5, -0.7 + p * 0.4, 0.7 + p * 0.4);
          ctx.stroke();
        }
      } else if (s.weapon === 'toy_hammer') {
        // Squeaky shockwave arc
        ctx.strokeStyle = '#f59e0b';
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(0, 0, arcRadius, -0.6, 0.6);
        ctx.stroke();

        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, arcRadius - 4, -0.6, 0.6);
        ctx.stroke();
      } else if (s.weapon === 'star_wand') {
        // Twinkle star magic trail
        ctx.strokeStyle = '#c084fc';
        ctx.globalAlpha = alpha * 0.9;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, arcRadius, -0.8, 0.8);
        ctx.stroke();

        ctx.strokeStyle = '#f472b6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, arcRadius + 4, -0.7, 0.7);
        ctx.stroke();
      } else if (s.weapon === 'water_gun') {
        // Aqua water splash jet
        ctx.fillStyle = '#38bdf8';
        ctx.globalAlpha = alpha * 0.85;
        for (let b = 0; b < 5; b++) {
          const bx = Math.cos((b - 2) * 0.2) * (arcRadius + b * 6);
          const by = Math.sin((b - 2) * 0.2) * (arcRadius + b * 6);
          ctx.beginPath();
          ctx.arc(bx, by, 4 + (1 - p) * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Golden shockwave arc upgrade if attacker collected coins!
      if ((s.attackerCoins || 0) > 0) {
        ctx.strokeStyle = '#fde047';
        ctx.globalAlpha = alpha * 0.85;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, arcRadius + 6, -0.85, 0.85);
        ctx.stroke();
      }

      ctx.restore();
    }

    // 2. Draw Sparks
    for (const sp of this.sparks) {
      const alpha = Math.max(0, 1 - sp.life / sp.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = sp.color;

      if (sp.shape === 'star') {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const rot = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          const rOut = sp.size;
          const rIn = sp.size / 2;
          ctx.lineTo(sp.x + Math.cos(rot) * rOut, sp.y + Math.sin(rot) * rOut);
          const rotIn = rot + Math.PI / 5;
          ctx.lineTo(sp.x + Math.cos(rotIn) * rIn, sp.y + Math.sin(rotIn) * rIn);
        }
        ctx.closePath();
        ctx.fill();
      } else if (sp.shape === 'heart') {
        ctx.beginPath();
        const topCurveHeight = sp.size * 0.3;
        ctx.moveTo(sp.x, sp.y + topCurveHeight);
        ctx.bezierCurveTo(sp.x, sp.y, sp.x - sp.size / 2, sp.y, sp.x - sp.size / 2, sp.y + topCurveHeight);
        ctx.bezierCurveTo(sp.x - sp.size / 2, sp.y + (sp.size + topCurveHeight) / 2, sp.x, sp.y + (sp.size + topCurveHeight) / 2, sp.x, sp.y + sp.size);
        ctx.bezierCurveTo(sp.x, sp.y + (sp.size + topCurveHeight) / 2, sp.x + sp.size / 2, sp.y + (sp.size + topCurveHeight) / 2, sp.x + sp.size / 2, sp.y + topCurveHeight);
        ctx.bezierCurveTo(sp.x + sp.size / 2, sp.y, sp.x, sp.y, sp.x, sp.y + topCurveHeight);
        ctx.closePath();
        ctx.fill();
      } else {
        // Circle / Bubble
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        ctx.fill();
        if (sp.shape === 'bubble') {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // 3. Draw Dropped Coins
    for (const c of this.droppedCoins) {
      const alpha = Math.min(1, (c.maxLife - c.life) / 0.5);
      ctx.save();
      ctx.globalAlpha = alpha;
      // Golden coin disc
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Shopee 'S'
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('S', c.x, c.y + 0.5);
      ctx.restore();
    }

    // 4. Draw Floating Damage Text
    for (const dt of this.damageTexts) {
      const p = dt.life / dt.maxLife;
      const alpha = 1 - p;
      const scale = 1 + Math.sin(p * Math.PI) * 0.3;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(dt.x, dt.y);
      ctx.scale(scale, scale);

      ctx.font = '900 16px "Be Vietnam Pro", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Outer outline
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeText(dt.text, 0, 0);

      // Inner text
      ctx.fillStyle = dt.color;
      ctx.fillText(dt.text, 0, 0);

      ctx.restore();
    }
  }

  private drawOverheadBubble(ctx: CanvasRenderingContext2D, p: Player): void {
    const now = Date.now();

    // Floating Emote
    if (p.currentEmote && p.currentEmote.expiresAt > now) {
      const remaining = p.currentEmote.expiresAt - now;
      const progress = 1 - remaining / 3000;
      const floatY = p.y - 50 - progress * 30;
      const opacity = Math.min(1, remaining / 500);

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.currentEmote.emote, p.x, floatY);
      ctx.restore();
    }

    // Proximity Speech Bubble
    if (p.currentSpeech && p.currentSpeech.expiresAt > now) {
      const text = p.currentSpeech.text;
      ctx.font = '12px "Be Vietnam Pro", sans-serif';
      const textW = Math.min(ctx.measureText(text).width, 180);
      const bubbleW = textW + 20;
      const bubbleH = 26;
      const bx = p.x - bubbleW / 2;
      const by = p.y - 68;

      ctx.save();
      // Bubble background
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#ff7043';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(bx, by, bubbleW, bubbleH, 8);
      ctx.fill();
      ctx.stroke();

      // Tail arrow
      ctx.beginPath();
      ctx.moveTo(p.x - 6, by + bubbleH);
      ctx.lineTo(p.x, by + bubbleH + 6);
      ctx.lineTo(p.x + 6, by + bubbleH);
      ctx.fill();
      ctx.stroke();

      // Text
      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text.length > 24 ? text.slice(0, 22) + '...' : text, p.x, by + bubbleH / 2);
      ctx.restore();
    }
  }
}
