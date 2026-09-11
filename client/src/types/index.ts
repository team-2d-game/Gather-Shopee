export type Direction = 'up' | 'down' | 'left' | 'right';

export interface PlayerSkin {
  avatarId: string;
  hairStyle: string;
  hairColor: string;
  bodyColor: string;
  outfitColor: string;
  accessory?: string;
}

export type WeaponType = 'candy_blade' | 'toy_hammer' | 'star_wand' | 'water_gun';
export type MountType = 'kart' | 'horse';

export interface GroundCoin {
  id: string;
  x: number;
  y: number;
  value: number;
  createdAt: number;
}

export interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  dir: Direction;
  isMoving: boolean;
  skin: PlayerSkin;
  status: string;
  zoneId: string | null;
  isSitting: boolean;
  lastActive: number;
  // Combat properties
  hp: number;
  maxHp: number;
  equippedWeapon?: WeaponType | null;
  isKnockedOut: boolean;
  invincibleUntil?: number;
  coins: number;
  kills: number;
  currentMount?: MountType | null;
  // Client-side visual state
  currentEmote?: {
    emote: string;
    expiresAt: number;
  };
  currentSpeech?: {
    text: string;
    expiresAt: number;
  };
  hitFlashUntil?: number;
}

export type ZoneType = 'lobby' | 'meeting' | 'shopee' | 'game' | 'stage' | 'garden';

export interface MapZone {
  id: string;
  name: string;
  type: ZoneType;
  x: number;
  y: number;
  width: number;
  height: number;
  isPrivate: boolean;
  description?: string;
}

export interface WorldObject {
  id: string;
  type: 'whiteboard' | 'shopee_booth' | 'lucky_wheel' | 'caro_board' | 'podium' | 'jukebox' | 'chair' | 'weapon_pickup' | 'mount_station';
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  interactionPrompt: string;
  state?: any;
}

export interface DrawLine {
  id: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string;
  width: number;
  authorId: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  channel: 'global' | 'proximity' | 'zone';
  zoneId?: string;
  x: number;
  y: number;
  timestamp: number;
}

export interface CaroGameState {
  id: string;
  playerX: { id: string; name: string } | null;
  playerO: { id: string; name: string } | null;
  board: Array<Array<'X' | 'O' | null>>;
  currentTurn: 'X' | 'O';
  winner: 'X' | 'O' | 'draw' | null;
  winningLine?: Array<[number, number]>;
}

export type ActiveModal =
  | null
  | 'whiteboard'
  | 'shopee_booth'
  | 'lucky_wheel'
  | 'caro_board'
  | 'podium'
  | 'jukebox'
  | 'settings';

export type WSMessageType =
  | 'JOIN_SPACE'
  | 'INIT_WORLD'
  | 'PLAYER_JOINED'
  | 'PLAYER_LEFT'
  | 'PLAYER_MOVE'
  | 'PLAYERS_SYNC'
  | 'CHAT_MESSAGE'
  | 'CHAT_BROADCAST'
  | 'EMOTE'
  | 'EMOTE_TRIGGER'
  | 'UPDATE_STATUS'
  | 'INTERACT_OBJECT'
  | 'OBJECT_STATE_UPDATE'
  | 'WHITEBOARD_DRAW'
  | 'WHITEBOARD_SYNC'
  | 'WHITEBOARD_CLEAR'
  | 'CARO_ACTION'
  | 'CARO_SYNC'
  | 'PODIUM_BROADCAST'
  | 'JUKEBOX_PLAY'
  | 'LUCKY_WHEEL_SPIN'
  | 'LUCKY_WHEEL_RESULT'
  | 'WEAPON_EQUIP'
  | 'PLAYER_ATTACK'
  | 'PLAYER_HIT'
  | 'PLAYER_KNOCKOUT'
  | 'PLAYER_RESPAWN'
  | 'COIN_SPAWN'
  | 'COIN_COLLECT'
  | 'PLAYER_MOUNT';

export interface WSMessage<T = any> {
  type: WSMessageType;
  senderId?: string;
  timestamp: number;
  payload: T;
}

