export const SERVER_CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
  TICK_RATE_MS: 1000 / 30, // 30Hz server tick
  MAP_TILES_X: 60,
  MAP_TILES_Y: 40,
  TILE_SIZE: 32,
  PROXIMITY_RADIUS: 200, // Pixels for proximity speech and sound
  SPAWN_POINT: {
    x: 960, // Tile 30 * 32
    y: 520  // Open Grand Lounge floor (Tile 16.25 * 32)
  },
  MAX_CHAT_HISTORY: 100,
  MAX_WHITEBOARD_LINES: 1000
};
