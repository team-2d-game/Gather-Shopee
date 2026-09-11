import { WebSocket } from 'ws';
import { Player, MapZone, WSMessage, ChatMessage, Direction, PlayerSkin, GroundCoin } from './types.js';
import { SERVER_CONFIG } from './config.js';
import { SpatialGrid } from './SpatialGrid.js';
import { ObjectManager } from './ObjectManager.js';

export class RoomManager {
  private players: Map<string, { ws: WebSocket; player: Player }> = new Map();
  private zones: MapZone[] = [];
  public objectManager: ObjectManager;
  private spatialGrid: SpatialGrid;
  private tickInterval: NodeJS.Timeout | null = null;
  private dirtyPositions = false;
  private groundCoins: Map<string, GroundCoin> = new Map();

  constructor() {
    this.objectManager = new ObjectManager();
    this.spatialGrid = new SpatialGrid(256);
    this.initZones();
    this.startTickLoop();
  }

  private initZones(): void {
    this.zones = [
      {
        id: 'zone-lobby',
        name: 'Sảnh Trung Tâm (Grand Lounge)',
        type: 'lobby',
        x: 704,
        y: 448,
        width: 512,
        height: 384,
        isPrivate: false,
        description: 'Khu vực chào mừng, nơi xuất hiện và gặp gỡ bạn bè'
      },
      {
        id: 'zone-coworking',
        name: 'Khu Co-Working & Sáng Tạo',
        type: 'lobby',
        x: 320,
        y: 192,
        width: 384,
        height: 384,
        isPrivate: false,
        description: 'Khu vực làm việc chung và Bảng trắng sáng tạo'
      },
      {
        id: 'zone-meeting-alpha',
        name: 'Phòng Họp Alpha (Private Space)',
        type: 'meeting',
        x: 320,
        y: 640,
        width: 320,
        height: 256,
        isPrivate: true,
        description: 'Phòng họp kín cách âm, thảo luận riêng tư'
      },
      {
        id: 'zone-meeting-beta',
        name: 'Phòng Họp Beta (Private Space)',
        type: 'meeting',
        x: 672,
        y: 640,
        width: 320,
        height: 256,
        isPrivate: true,
        description: 'Phòng họp dự án, chỉ người trong phòng nghe thấy nhau'
      },
      {
        id: 'zone-shopee-expo',
        name: 'Shopee Expo Pavilion',
        type: 'shopee',
        x: 1248,
        y: 192,
        width: 480,
        height: 480,
        isPrivate: false,
        description: 'Gian hàng trải nghiệm sản phẩm & Vòng quay may mắn'
      },
      {
        id: 'zone-arcade',
        name: 'Khu Giải Trí (Arcade & Lounge)',
        type: 'game',
        x: 384,
        y: 864,
        width: 448,
        height: 288,
        isPrivate: false,
        description: 'Bàn đấu Cờ Caro Gomoku và Cyber Jukebox'
      },
      {
        id: 'zone-stage',
        name: 'Bục Phát Biểu (Town Hall Stage)',
        type: 'stage',
        x: 832,
        y: 160,
        width: 320,
        height: 224,
        isPrivate: false,
        description: 'Bục phát biểu với hiệu ứng loa phóng thanh Megaphone toàn map'
      }
    ];
  }

  public getZones(): MapZone[] {
    return this.zones;
  }

  private startTickLoop(): void {
    this.tickInterval = setInterval(() => {
      this.broadcastPlayerPositions();
    }, SERVER_CONFIG.TICK_RATE_MS);
  }

  public stopTickLoop(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  public handleConnection(ws: WebSocket, clientId: string): void {
    ws.on('message', (rawData: string) => {
      try {
        const message: WSMessage = JSON.parse(rawData.toString());
        this.handleMessage(ws, clientId, message);
      } catch (err) {
        console.error(`[WS Error] Invalid JSON from client ${clientId}:`, err);
      }
    });

    ws.on('close', () => {
      this.handleDisconnect(clientId);
    });

    ws.on('error', (err) => {
      console.error(`[WS Socket Error] Client ${clientId}:`, err);
    });
  }

  public handleDisconnect(clientId: string): void {
    const entry = this.players.get(clientId);
    if (!entry) return;

    this.players.delete(clientId);
    this.spatialGrid.removePlayer(clientId);

    // If player was in Caro game, handle exit
    const caroChanged = this.objectManager.leaveCaroGame(clientId);
    if (caroChanged) {
      this.broadcast({
        type: 'CARO_SYNC',
        timestamp: Date.now(),
        payload: this.objectManager.getCaroState()
      });
    }

    this.broadcast({
      type: 'PLAYER_LEFT',
      timestamp: Date.now(),
      payload: { id: clientId }
    });

    console.log(`[Player Left] ${entry.player.name} (${clientId}). Online: ${this.players.size}`);
  }

  private handleMessage(ws: WebSocket, clientId: string, msg: WSMessage): void {
    switch (msg.type) {
      case 'JOIN_SPACE': {
        const payload = msg.payload || {};
        const name: string = (payload.name || 'Visitor').trim().slice(0, 20) || 'Visitor';
        const skin: PlayerSkin = payload.skin || {
          avatarId: 'avatar-1',
          hairStyle: 'short',
          hairColor: '#4f46e5',
          bodyColor: '#fcd34d',
          outfitColor: '#ec4899'
        };

        const newPlayer: Player = {
          id: clientId,
          name,
          x: SERVER_CONFIG.SPAWN_POINT.x + (Math.random() * 40 - 20),
          y: SERVER_CONFIG.SPAWN_POINT.y + (Math.random() * 40 - 20),
          targetX: SERVER_CONFIG.SPAWN_POINT.x,
          targetY: SERVER_CONFIG.SPAWN_POINT.y,
          dir: 'down',
          isMoving: false,
          skin,
          status: 'Online',
          zoneId: 'zone-lobby',
          isSitting: false,
          lastActive: Date.now(),
          hp: 100,
          maxHp: 100,
          equippedWeapon: null,
          isKnockedOut: false,
          invincibleUntil: 0,
          coins: 0,
          kills: 0,
          currentMount: null
        };

        this.players.set(clientId, { ws, player: newPlayer });
        this.spatialGrid.updatePlayerPosition(newPlayer);

        // Send full world state to the joining player
        this.sendTo(ws, {
          type: 'INIT_WORLD',
          timestamp: Date.now(),
          payload: {
            selfId: clientId,
            player: newPlayer,
            zones: this.zones,
            players: Array.from(this.players.values()).map(p => p.player),
            objects: this.objectManager.getAllObjects(),
            whiteboardLines: this.objectManager.getWhiteboardLines(),
            caroState: this.objectManager.getCaroState(),
            groundCoins: Array.from(this.groundCoins.values())
          }
        });

        // Notify other players
        this.broadcastExcept(clientId, {
          type: 'PLAYER_JOINED',
          timestamp: Date.now(),
          payload: { player: newPlayer }
        });

        console.log(`[Player Joined] ${newPlayer.name} (${clientId}). Online: ${this.players.size}`);
        break;
      }

      case 'PLAYER_MOVE': {
        const entry = this.players.get(clientId);
        if (!entry) return;

        // Disallow movement if player is knocked out
        if (entry.player.isKnockedOut) return;

        const { x, y, dir, isMoving, isSitting } = msg.payload;
        if (typeof x === 'number' && typeof y === 'number') {
          entry.player.x = x;
          entry.player.y = y;
          entry.player.dir = dir || entry.player.dir;
          entry.player.isMoving = !!isMoving;
          if (typeof isSitting === 'boolean') {
            entry.player.isSitting = isSitting;
          }
          entry.player.lastActive = Date.now();

          // Check zone transition
          const currentZone = SpatialGrid.resolveZone(x, y, this.zones);
          const newZoneId = currentZone ? currentZone.id : null;
          if (entry.player.zoneId !== newZoneId) {
            entry.player.zoneId = newZoneId;
          }

          // Check coin pickup (< 32px)
          for (const [coinId, coin] of this.groundCoins.entries()) {
            const dist = Math.hypot(x - coin.x, y - coin.y);
            if (dist <= 32) {
              this.groundCoins.delete(coinId);
              entry.player.coins += coin.value;
              this.broadcast({
                type: 'COIN_COLLECT',
                timestamp: Date.now(),
                payload: {
                  playerId: clientId,
                  coinId,
                  coins: entry.player.coins,
                  x: coin.x,
                  y: coin.y
                }
              });
            }
          }

          this.spatialGrid.updatePlayerPosition(entry.player);
          this.dirtyPositions = true;
        }
        break;
      }

      case 'CHAT_MESSAGE': {
        const entry = this.players.get(clientId);
        if (!entry) return;

        const text: string = (msg.payload.text || '').trim().slice(0, 300);
        if (!text) return;

        const channel: 'global' | 'proximity' | 'zone' = msg.payload.channel || 'global';
        const chatMsg: ChatMessage = {
          id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          senderId: clientId,
          senderName: entry.player.name,
          text,
          channel,
          zoneId: entry.player.zoneId || undefined,
          x: entry.player.x,
          y: entry.player.y,
          timestamp: Date.now()
        };

        if (channel === 'global') {
          this.broadcast({
            type: 'CHAT_BROADCAST',
            timestamp: Date.now(),
            payload: chatMsg
          });
        } else if (channel === 'zone') {
          // Send only to players in the exact same zone
          const targetZoneId = entry.player.zoneId;
          for (const p of this.players.values()) {
            if (p.player.zoneId === targetZoneId) {
              this.sendTo(p.ws, {
                type: 'CHAT_BROADCAST',
                timestamp: Date.now(),
                payload: chatMsg
              });
            }
          }
        } else if (channel === 'proximity') {
          // Send to players within proximity radius
          for (const p of this.players.values()) {
            const inRange = SpatialGrid.isWithinRadius(
              entry.player.x,
              entry.player.y,
              p.player.x,
              p.player.y,
              SERVER_CONFIG.PROXIMITY_RADIUS
            );
            if (inRange) {
              this.sendTo(p.ws, {
                type: 'CHAT_BROADCAST',
                timestamp: Date.now(),
                payload: chatMsg
              });
            }
          }
        }
        break;
      }

      case 'EMOTE': {
        const entry = this.players.get(clientId);
        if (!entry) return;

        const emote: string = msg.payload.emote || '👋';
        this.broadcast({
          type: 'EMOTE_TRIGGER',
          senderId: clientId,
          timestamp: Date.now(),
          payload: {
            playerId: clientId,
            playerName: entry.player.name,
            emote
          }
        });
        break;
      }

      case 'UPDATE_STATUS': {
        const entry = this.players.get(clientId);
        if (!entry) return;

        const status: string = (msg.payload.status || 'Online').slice(0, 30);
        entry.player.status = status;
        this.broadcast({
          type: 'OBJECT_STATE_UPDATE',
          timestamp: Date.now(),
          payload: {
            type: 'player_status',
            playerId: clientId,
            status
          }
        });
        break;
      }

      case 'WHITEBOARD_DRAW': {
        const line = msg.payload.line;
        if (line) {
          this.objectManager.addWhiteboardLine(line);
          this.broadcast({
            type: 'WHITEBOARD_DRAW',
            timestamp: Date.now(),
            payload: { line }
          });
        }
        break;
      }

      case 'WHITEBOARD_CLEAR': {
        this.objectManager.clearWhiteboard();
        this.broadcast({
          type: 'WHITEBOARD_CLEAR',
          timestamp: Date.now(),
          payload: {}
        });
        break;
      }

      case 'CARO_ACTION': {
        const entry = this.players.get(clientId);
        if (!entry) return;

        const action = msg.payload.action;
        if (action === 'join') {
          const role = msg.payload.role as 'X' | 'O';
          const result = this.objectManager.joinCaroGame(
            { id: clientId, name: entry.player.name },
            role
          );
          if (result.success) {
            this.broadcast({
              type: 'CARO_SYNC',
              timestamp: Date.now(),
              payload: this.objectManager.getCaroState()
            });
          }
        } else if (action === 'move') {
          const { row, col } = msg.payload;
          const result = this.objectManager.makeCaroMove(clientId, row, col);
          if (result.success) {
            this.broadcast({
              type: 'CARO_SYNC',
              timestamp: Date.now(),
              payload: this.objectManager.getCaroState()
            });
          }
        } else if (action === 'reset') {
          this.objectManager.resetCaroBoard();
          this.broadcast({
            type: 'CARO_SYNC',
            timestamp: Date.now(),
            payload: this.objectManager.getCaroState()
          });
        } else if (action === 'leave') {
          this.objectManager.leaveCaroGame(clientId);
          this.broadcast({
            type: 'CARO_SYNC',
            timestamp: Date.now(),
            payload: this.objectManager.getCaroState()
          });
        }
        break;
      }

      case 'PODIUM_BROADCAST': {
        const entry = this.players.get(clientId);
        if (!entry) return;

        const announcementText = (msg.payload.message || '').trim().slice(0, 150);
        if (!announcementText) return;

        this.broadcast({
          type: 'PODIUM_BROADCAST',
          timestamp: Date.now(),
          payload: {
            speakerName: entry.player.name,
            speakerId: clientId,
            message: announcementText
          }
        });
        break;
      }

      case 'LUCKY_WHEEL_SPIN': {
        const entry = this.players.get(clientId);
        if (!entry) return;

        const prize = this.objectManager.spinLuckyWheel(clientId);
        this.sendTo(ws, {
          type: 'LUCKY_WHEEL_RESULT',
          timestamp: Date.now(),
          payload: prize
        });

        // If top tier, notify all
        if (prize.prize.includes('Jackpot') || prize.prize.includes('500.000đ')) {
          this.broadcast({
            type: 'CHAT_BROADCAST',
            timestamp: Date.now(),
            payload: {
              id: `jackpot-${Date.now()}`,
              senderId: 'system',
              senderName: 'Shopee Lucky Wheel',
              text: `🎉 Chúc mừng ${entry.player.name} vừa trúng ${prize.prize}! Mã: ${prize.voucherCode}`,
              channel: 'global',
              x: entry.player.x,
              y: entry.player.y,
              timestamp: Date.now()
            }
          });
        }
        break;
      }

      case 'JUKEBOX_PLAY': {
        const entry = this.players.get(clientId);
        if (!entry) return;

        const { note, instrument } = msg.payload;
        // Broadcast audio note to players within proximity
        for (const p of this.players.values()) {
          const inRange = SpatialGrid.isWithinRadius(
            entry.player.x,
            entry.player.y,
            p.player.x,
            p.player.y,
            SERVER_CONFIG.PROXIMITY_RADIUS * 1.5
          );
          if (inRange) {
            this.sendTo(p.ws, {
              type: 'JUKEBOX_PLAY',
              timestamp: Date.now(),
              payload: {
                note,
                instrument,
                sourceX: entry.player.x,
                sourceY: entry.player.y
              }
            });
          }
        }
        break;
      }

      case 'INTERACT_OBJECT': {
        const entry = this.players.get(clientId);
        if (!entry || entry.player.isKnockedOut) return;

        const objectId = msg.payload?.objectId;
        const obj = this.objectManager.getObject(objectId);
        if (obj && obj.type === 'weapon_pickup' && obj.state?.weaponType) {
          entry.player.equippedWeapon = obj.state.weaponType;
          this.broadcast({
            type: 'WEAPON_EQUIP',
            timestamp: Date.now(),
            payload: {
              playerId: clientId,
              weapon: obj.state.weaponType,
              weaponName: obj.state.name
            }
          });
        } else if (obj && obj.type === 'mount_station' && obj.state?.mountType) {
          // Toggle mount / dismount
          if (entry.player.currentMount === obj.state.mountType) {
            entry.player.currentMount = null;
          } else {
            entry.player.currentMount = obj.state.mountType;
          }
          this.broadcast({
            type: 'PLAYER_MOUNT',
            timestamp: Date.now(),
            payload: {
              playerId: clientId,
              mount: entry.player.currentMount
            }
          });
        }
        break;
      }

      case 'PLAYER_MOUNT': {
        const entry = this.players.get(clientId);
        if (!entry || entry.player.isKnockedOut) return;

        entry.player.currentMount = msg.payload?.mount || null;
        this.broadcast({
          type: 'PLAYER_MOUNT',
          timestamp: Date.now(),
          payload: {
            playerId: clientId,
            mount: entry.player.currentMount
          }
        });
        break;
      }

      case 'WEAPON_EQUIP': {
        const entry = this.players.get(clientId);
        if (!entry || entry.player.isKnockedOut) return;

        const weapon = msg.payload?.weapon;
        if (weapon) {
          entry.player.equippedWeapon = weapon;
          this.broadcast({
            type: 'WEAPON_EQUIP',
            timestamp: Date.now(),
            payload: {
              playerId: clientId,
              weapon
            }
          });
        }
        break;
      }

      case 'PLAYER_ATTACK': {
        const entry = this.players.get(clientId);
        if (!entry || entry.player.isKnockedOut) return;

        const weapon = entry.player.equippedWeapon || 'candy_blade';
        const weaponConfigs: Record<string, { damage: number; range: number; arc: number }> = {
          candy_blade: { damage: 25, range: 65, arc: Math.PI * 0.75 },
          toy_hammer: { damage: 35, range: 55, arc: Math.PI * 0.65 },
          star_wand: { damage: 20, range: 80, arc: Math.PI * 0.85 },
          water_gun: { damage: 15, range: 130, arc: Math.PI * 0.45 }
        };
        const config = weaponConfigs[weapon] || weaponConfigs.candy_blade;

        // Weapon Hitbox scaling based on collected coins
        const extraRange = Math.min(65, (entry.player.coins || 0) * 4.5);
        const extraArc = Math.min(0.45, (entry.player.coins || 0) * 0.035);
        const effectiveRange = config.range + extraRange;
        const effectiveArc = config.arc + extraArc;

        let baseAngle = Math.PI / 2; // down
        if (entry.player.dir === 'up') baseAngle = -Math.PI / 2;
        else if (entry.player.dir === 'left') baseAngle = Math.PI;
        else if (entry.player.dir === 'right') baseAngle = 0;

        // Broadcast attack swing animation (with coin tier info for enhanced visual)
        this.broadcast({
          type: 'PLAYER_ATTACK',
          timestamp: Date.now(),
          payload: {
            attackerId: clientId,
            weapon,
            x: entry.player.x,
            y: entry.player.y,
            dir: entry.player.dir,
            angle: baseAngle,
            coins: entry.player.coins || 0,
            effectiveRange
          }
        });

        const now = Date.now();
        // Check hits against other players
        for (const [targetId, target] of this.players.entries()) {
          if (targetId === clientId) continue;
          if (target.player.isKnockedOut) continue;
          if (target.player.invincibleUntil && target.player.invincibleUntil > now) continue;

          const dx = target.player.x - entry.player.x;
          const dy = target.player.y - entry.player.y;
          const dist = Math.hypot(dx, dy);

          if (dist <= effectiveRange) {
            const angleToVictim = Math.atan2(dy, dx);
            let diff = Math.abs(angleToVictim - baseAngle);
            while (diff > Math.PI) diff = Math.abs(diff - 2 * Math.PI);

            if (diff <= effectiveArc / 2 + 0.35) {
              const newHp = Math.max(0, target.player.hp - config.damage);
              target.player.hp = newHp;

              // Knockback push (14px)
              const pushDist = 14;
              const pushX = dist > 0 ? (dx / dist) * pushDist : pushDist;
              const pushY = dist > 0 ? (dy / dist) * pushDist : 0;
              target.player.x += pushX;
              target.player.y += pushY;

              this.broadcast({
                type: 'PLAYER_HIT',
                timestamp: Date.now(),
                payload: {
                  attackerId: clientId,
                  victimId: targetId,
                  damage: config.damage,
                  victimHp: newHp,
                  weapon,
                  x: target.player.x,
                  y: target.player.y,
                  knockbackX: pushX,
                  knockbackY: pushY
                }
              });

              if (newHp === 0) {
                target.player.isKnockedOut = true;
                entry.player.kills = (entry.player.kills || 0) + 1;
                this.dirtyPositions = true;
                const weaponNames: Record<string, string> = {
                  candy_blade: 'Kiếm Kẹo Mút Cầu Vồng 🍭',
                  toy_hammer: 'Búa Đồ Chơi Shopee 🔨',
                  star_wand: 'Gậy Phép Thuật Ngôi Sao 🪄',
                  water_gun: 'Súng Nước Vịt Vàng 🔫'
                };

                // Spawn 3 - 5 collectable GroundCoins!
                const numCoins = 3 + Math.floor(Math.random() * 3);
                for (let i = 0; i < numCoins; i++) {
                  const coinId = `coin-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                  const angle = Math.random() * Math.PI * 2;
                  const dropDist = 16 + Math.random() * 26;
                  const newCoin: GroundCoin = {
                    id: coinId,
                    x: Math.round(target.player.x + Math.cos(angle) * dropDist),
                    y: Math.round(target.player.y + Math.sin(angle) * dropDist),
                    value: 1,
                    createdAt: Date.now()
                  };
                  this.groundCoins.set(coinId, newCoin);
                  this.broadcast({
                    type: 'COIN_SPAWN',
                    timestamp: Date.now(),
                    payload: { coin: newCoin }
                  });
                }

                this.broadcast({
                  type: 'PLAYER_KNOCKOUT',
                  timestamp: Date.now(),
                  payload: {
                    attackerId: clientId,
                    attackerName: entry.player.name,
                    attackerKills: entry.player.kills,
                    victimId: targetId,
                    victimName: target.player.name,
                    weapon,
                    weaponName: weaponNames[weapon] || 'Đòn Đánh Vui Nhộn',
                    x: target.player.x,
                    y: target.player.y
                  }
                });

                // Global celebration notice
                this.broadcast({
                  type: 'CHAT_BROADCAST',
                  timestamp: Date.now(),
                  payload: {
                    id: `ko-${Date.now()}`,
                    senderId: 'system',
                    senderName: 'Chiến Đấu Kawaii',
                    text: `💥 ${entry.player.name} vừa hạ gục ${target.player.name} bằng ${weaponNames[weapon] || 'Đòn Đánh Vui Nhộn'}! (Hồi sinh sau 3s)`,
                    channel: 'global',
                    x: target.player.x,
                    y: target.player.y,
                    timestamp: Date.now()
                  }
                });

                // Respawn countdown: 3 seconds
                setTimeout(() => {
                  const pEntry = this.players.get(targetId);
                  if (pEntry) {
                    pEntry.player.hp = pEntry.player.maxHp;
                    pEntry.player.isKnockedOut = false;
                    pEntry.player.invincibleUntil = Date.now() + 2500;
                    this.broadcast({
                      type: 'PLAYER_RESPAWN',
                      timestamp: Date.now(),
                      payload: {
                        playerId: targetId,
                        hp: pEntry.player.maxHp,
                        x: pEntry.player.x,
                        y: pEntry.player.y,
                        invincibleUntil: pEntry.player.invincibleUntil
                      }
                    });
                  }
                }, 3000);
              }
            }
          }
        }
        break;
      }
    }
  }

  private broadcastPlayerPositions(): void {
    if (!this.dirtyPositions && this.players.size === 0) return;

    const positions = Array.from(this.players.values()).map(p => ({
      id: p.player.id,
      x: Math.round(p.player.x * 10) / 10,
      y: Math.round(p.player.y * 10) / 10,
      dir: p.player.dir,
      isMoving: p.player.isMoving,
      isSitting: p.player.isSitting,
      zoneId: p.player.zoneId,
      hp: p.player.hp,
      maxHp: p.player.maxHp,
      equippedWeapon: p.player.equippedWeapon,
      isKnockedOut: p.player.isKnockedOut,
      invincibleUntil: p.player.invincibleUntil,
      coins: p.player.coins || 0,
      kills: p.player.kills || 0,
      currentMount: p.player.currentMount || null
    }));

    const syncMsg: WSMessage = {
      type: 'PLAYERS_SYNC',
      timestamp: Date.now(),
      payload: { positions }
    };

    const serialized = JSON.stringify(syncMsg);
    for (const { ws } of this.players.values()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(serialized);
      }
    }

    this.dirtyPositions = false;
  }

  public sendTo(ws: WebSocket, message: WSMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  public broadcast(message: WSMessage): void {
    const serialized = JSON.stringify(message);
    for (const { ws } of this.players.values()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(serialized);
      }
    }
  }

  public broadcastExcept(excludeClientId: string, message: WSMessage): void {
    const serialized = JSON.stringify(message);
    for (const [id, { ws }] of this.players.entries()) {
      if (id !== excludeClientId && ws.readyState === WebSocket.OPEN) {
        ws.send(serialized);
      }
    }
  }
}
