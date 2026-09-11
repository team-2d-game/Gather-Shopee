import { WSMessage, Player, MapZone, WorldObject, DrawLine, ChatMessage, CaroGameState, Direction, PlayerSkin, MountType } from '../types';

type MessageHandler = (payload: any) => void;

export class SocketClient {
  private ws: WebSocket | null = null;
  private url: string = '';
  private isConnected = false;
  private reconnectTimer: any = null;
  private listeners: Map<string, Set<MessageHandler>> = new Map();

  constructor() {
    const host = window.location.hostname || 'localhost';
    this.url = `ws://${host}:3001`;
  }

  public connect(customUrl?: string): void {
    if (customUrl) this.url = customUrl;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.emit('connection', { status: 'connected' });
        console.log(`[Socket] Connected to ${this.url}`);
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          this.emit(msg.type, msg.payload);
        } catch (err) {
          console.error('[Socket] Failed to parse message:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.emit('connection', { status: 'disconnected' });
        console.log('[Socket] Disconnected. Reconnecting in 2s...');
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.error('[Socket] Error:', err);
      };
    } catch (e) {
      console.error('[Socket] Connection failed:', e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 2000);
  }

  public on(type: string, handler: MessageHandler): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);

    return () => {
      this.listeners.get(type)?.delete(handler);
    };
  }

  private emit(type: string, payload: any): void {
    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.forEach((fn) => fn(payload));
    }
  }

  private send(type: string, payload: any = {}): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const msg: WSMessage = {
        type: type as any,
        timestamp: Date.now(),
        payload
      };
      this.ws.send(JSON.stringify(msg));
    }
  }

  // Action emitters
  public joinSpace(name: string, skin: PlayerSkin): void {
    this.send('JOIN_SPACE', { name, skin });
  }

  public sendMove(x: number, y: number, dir: Direction, isMoving: boolean, isSitting: boolean): void {
    this.send('PLAYER_MOVE', { x, y, dir, isMoving, isSitting });
  }

  public sendChat(text: string, channel: 'global' | 'proximity' | 'zone'): void {
    this.send('CHAT_MESSAGE', { text, channel });
  }

  public sendEmote(emote: string): void {
    this.send('EMOTE', { emote });
  }

  public updateStatus(status: string): void {
    this.send('UPDATE_STATUS', { status });
  }

  public sendWhiteboardDraw(line: DrawLine): void {
    this.send('WHITEBOARD_DRAW', { line });
  }

  public clearWhiteboard(): void {
    this.send('WHITEBOARD_CLEAR');
  }

  public sendCaroAction(action: 'join' | 'move' | 'reset' | 'leave', data: any = {}): void {
    this.send('CARO_ACTION', { action, ...data });
  }

  public spinLuckyWheel(): void {
    this.send('LUCKY_WHEEL_SPIN');
  }

  public playJukeboxNote(note: number, instrument: string = 'synth'): void {
    this.send('JUKEBOX_PLAY', { note, instrument });
  }

  public broadcastPodium(message: string): void {
    this.send('PODIUM_BROADCAST', { message });
  }

  public sendAttack(weapon: string = 'candy_blade'): void {
    this.send('PLAYER_ATTACK', { weapon });
  }

  public sendWeaponEquip(weapon: string): void {
    this.send('WEAPON_EQUIP', { weapon });
  }

  public sendMount(mount: MountType | null): void {
    this.send('PLAYER_MOUNT', { mount });
  }

  public sendInteractObject(objectId: string): void {
    this.send('INTERACT_OBJECT', { objectId });
  }

  public disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const socketClient = new SocketClient();
