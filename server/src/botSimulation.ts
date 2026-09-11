import { WebSocket } from 'ws';
import { SERVER_CONFIG } from './config.js';
import { WSMessage } from './types.js';

const NUM_BOTS = 5;
const DURATION_MS = 10000; // 10 seconds test

console.log(`🤖 Starting Automated Bot Simulation with ${NUM_BOTS} bots for ${DURATION_MS / 1000}s...`);

interface BotClient {
  id: string;
  name: string;
  ws: WebSocket;
  x: number;
  y: number;
  dir: 'up' | 'down' | 'left' | 'right';
  receivedSyncs: number;
}

const bots: BotClient[] = [];
const botNames = ['Alice_Shopee', 'Bob_Dev', 'Charlie_Gamer', 'Daisy_Designer', 'Ethan_PM'];
const emotes = ['👋', '🔥', '🎉', '❤️', '💡', '😂'];

function createBot(index: number): Promise<BotClient> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${SERVER_CONFIG.PORT}`);
    const bot: BotClient = {
      id: '',
      name: botNames[index] || `Bot_${index}`,
      ws,
      x: SERVER_CONFIG.SPAWN_POINT.x + (index * 20 - 40),
      y: SERVER_CONFIG.SPAWN_POINT.y + (index * 20 - 40),
      dir: 'down',
      receivedSyncs: 0
    };

    ws.on('open', () => {
      // Send JOIN_SPACE
      const joinMsg: WSMessage = {
        type: 'JOIN_SPACE',
        timestamp: Date.now(),
        payload: {
          name: bot.name,
          skin: {
            avatarId: `avatar-${index + 1}`,
            hairStyle: 'short',
            hairColor: index % 2 === 0 ? '#4f46e5' : '#059669',
            bodyColor: '#fcd34d',
            outfitColor: index % 2 === 0 ? '#ec4899' : '#3b82f6'
          }
        }
      };
      ws.send(JSON.stringify(joinMsg));
    });

    ws.on('message', (data: string) => {
      try {
        const msg: WSMessage = JSON.parse(data.toString());
        if (msg.type === 'INIT_WORLD') {
          bot.id = msg.payload.selfId;
          resolve(bot);
        } else if (msg.type === 'PLAYERS_SYNC') {
          bot.receivedSyncs++;
        }
      } catch (err) {
        console.error('Bot parse error:', err);
      }
    });

    ws.on('error', (err) => {
      reject(err);
    });
  });
}

async function run() {
  try {
    for (let i = 0; i < NUM_BOTS; i++) {
      const bot = await createBot(i);
      bots.push(bot);
      console.log(`✅ ${bot.name} connected successfully with ID: ${bot.id}`);
    }

    console.log(`\n🎮 All ${NUM_BOTS} bots connected! Starting movement & interaction simulation...`);

    const moveInterval = setInterval(() => {
      const directions: Array<'up' | 'down' | 'left' | 'right'> = ['up', 'down', 'left', 'right'];
      for (const bot of bots) {
        // Random move step
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const step = 8;
        if (dir === 'left') bot.x -= step;
        if (dir === 'right') bot.x += step;
        if (dir === 'up') bot.y -= step;
        if (dir === 'down') bot.y += step;
        bot.dir = dir;

        const moveMsg: WSMessage = {
          type: 'PLAYER_MOVE',
          timestamp: Date.now(),
          payload: {
            x: bot.x,
            y: bot.y,
            dir: bot.dir,
            isMoving: true
          }
        };
        bot.ws.send(JSON.stringify(moveMsg));

        // Occasional chat or emote
        if (Math.random() < 0.1) {
          const emote = emotes[Math.floor(Math.random() * emotes.length)];
          bot.ws.send(
            JSON.stringify({
              type: 'EMOTE',
              timestamp: Date.now(),
              payload: { emote }
            })
          );
        }
      }
    }, 150);

    setTimeout(() => {
      clearInterval(moveInterval);
      console.log('\n📊 Simulation Finished! Verification Stats:');
      for (const bot of bots) {
        console.log(` - ${bot.name}: Received ${bot.receivedSyncs} player sync packets.`);
        bot.ws.close();
      }
      const allPassed = bots.every(b => b.receivedSyncs > 20);
      if (allPassed) {
        console.log('\n🌟 SUCCESS: WebSocket server handled multiplayer synchronization flawlessly!');
        process.exit(0);
      } else {
        console.error('\n⚠️ WARNING: Some bots received fewer sync packets than expected.');
        process.exit(1);
      }
    }, DURATION_MS);
  } catch (err) {
    console.error('❌ Bot simulation failed:', err);
    process.exit(1);
  }
}

run();
