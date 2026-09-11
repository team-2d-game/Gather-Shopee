import React, { useState, useEffect, useRef } from 'react';
import { Player, MapZone, WorldObject, DrawLine, ChatMessage, CaroGameState, Direction, PlayerSkin, ActiveModal, WeaponType } from './types';
import { Tilemap } from './engine/Tilemap';
import { GameEngine } from './engine/GameEngine';
import { socketClient } from './network/socketClient';
import { soundManager } from './engine/AudioSynth';

import { CharacterSetup } from './components/CharacterSetup';
import { HUD } from './components/HUD';
import { ChatBox } from './components/ChatBox';
import { EmotePicker } from './components/EmotePicker';
import { PlayerList } from './components/PlayerList';

import { WhiteboardModal } from './components/modals/WhiteboardModal';
import { ShopeeBoothModal } from './components/modals/ShopeeBoothModal';
import { LuckyWheelModal } from './components/modals/LuckyWheelModal';
import { CaroModal } from './components/modals/CaroModal';
import { PodiumModal } from './components/modals/PodiumModal';
import { JukeboxModal } from './components/modals/JukeboxModal';
import { HelpModal } from './components/modals/HelpModal';
import { RankingModal } from './components/modals/RankingModal';

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // App & User State
  const [hasJoined, setHasJoined] = useState(false);
  const [localPlayer, setLocalPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [zones, setZones] = useState<MapZone[]>([]);
  const [objects, setObjects] = useState<WorldObject[]>([]);
  const [activeZone, setActiveZone] = useState<MapZone | null>(null);

  // Chat & Realtime State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [whiteboardLines, setWhiteboardLines] = useState<DrawLine[]>([]);
  const [caroState, setCaroState] = useState<CaroGameState | null>(null);

  // Modals & Panels
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [selectedBooth, setSelectedBooth] = useState<WorldObject | null>(null);
  const [isPlayerListOpen, setIsPlayerListOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isRankingOpen, setIsRankingOpen] = useState(false);

  // Megaphone Announcement Banner
  const [podiumAnnouncement, setPodiumAnnouncement] = useState<{ speaker: string; text: string } | null>(null);
  const [knockoutAnnouncement, setKnockoutAnnouncement] = useState<{ killer: string; victim: string; weaponName: string } | null>(null);
  const knockoutTimerRef = useRef<any>(null);

  // Initialize Canvas Engine & Socket listeners
  useEffect(() => {
    if (!canvasRef.current) return;

    const tilemap = new Tilemap();

    const engine = new GameEngine({
      canvas: canvasRef.current,
      tilemap,
      onPlayerMove: (x: number, y: number, dir: Direction, isMoving: boolean, isSitting: boolean) => {
        socketClient.sendMove(x, y, dir, isMoving, isSitting);
      },
      onInteract: (obj: WorldObject) => {
        handleObjectInteraction(obj);
      },
      onZoneChange: (zone: MapZone | null) => {
        setActiveZone(zone);
      },
      onAttack: (weapon: WeaponType) => {
        socketClient.sendAttack(weapon);
      },
      onMountToggle: (mount) => {
        socketClient.sendMount(mount);
      },
      onToggleRanking: () => {
        setIsRankingOpen((prev) => !prev);
      }
    });

    engineRef.current = engine;
    engine.start();

    // Connect to WebSocket Server
    socketClient.connect();

    // Socket Event Subscriptions
    const unsubInit = socketClient.on('INIT_WORLD', (payload) => {
      setLocalPlayer(payload.player);
      setZones(payload.zones);
      setObjects(payload.objects);
      setPlayers(payload.players);
      setWhiteboardLines(payload.whiteboardLines || []);
      setCaroState(payload.caroState);

      engine.setWorldData(payload.zones, payload.objects);
      engine.setLocalPlayer(payload.player);
      if (payload.groundCoins) {
        engine.setGroundCoins(payload.groundCoins);
      }

      for (const p of payload.players) {
        if (p.id !== payload.selfId) {
          engine.updateRemotePlayer(p);
        }
      }
    });

    const unsubJoined = socketClient.on('PLAYER_JOINED', (payload) => {
      setPlayers((prev) => [...prev.filter((p) => p.id !== payload.player.id), payload.player]);
      engine.updateRemotePlayer(payload.player);
    });

    const unsubLeft = socketClient.on('PLAYER_LEFT', (payload) => {
      setPlayers((prev) => prev.filter((p) => p.id !== payload.id));
      engine.removeRemotePlayer(payload.id);
    });

    const unsubSync = socketClient.on('PLAYERS_SYNC', (payload) => {
      engine.syncPositions(payload.positions);
      setPlayers((prev) =>
        prev.map((p) => {
          const found = payload.positions.find((pos: any) => pos.id === p.id);
          if (!found) return p;
          let changed = false;
          const updated = { ...p };
          if (typeof found.kills === 'number' && found.kills !== p.kills) {
            updated.kills = found.kills;
            changed = true;
          }
          if (typeof found.coins === 'number' && found.coins !== p.coins) {
            updated.coins = found.coins;
            changed = true;
          }
          if (typeof found.hp === 'number' && found.hp !== p.hp) {
            updated.hp = found.hp;
            changed = true;
          }
          return changed ? updated : p;
        })
      );
      setLocalPlayer((prev) => {
        if (!prev) return prev;
        const found = payload.positions.find((pos: any) => pos.id === prev.id);
        if (!found) return prev;
        let changed = false;
        const updated = { ...prev };
        if (typeof found.kills === 'number' && found.kills !== prev.kills) {
          updated.kills = found.kills;
          changed = true;
        }
        if (typeof found.coins === 'number' && found.coins !== prev.coins) {
          updated.coins = found.coins;
          changed = true;
        }
        if (typeof found.hp === 'number' && found.hp !== prev.hp) {
          updated.hp = found.hp;
          changed = true;
        }
        return changed ? updated : prev;
      });
    });

    const unsubChat = socketClient.on('CHAT_BROADCAST', (msg: ChatMessage) => {
      setMessages((prev) => [...prev.slice(-100), msg]);
      // Show speech bubble over player
      engine.triggerSpeech(msg.senderId, msg.text);
    });

    const unsubEmote = socketClient.on('EMOTE_TRIGGER', (payload) => {
      engine.triggerEmote(payload.playerId, payload.emote);
    });

    const unsubPodium = socketClient.on('PODIUM_BROADCAST', (payload) => {
      setPodiumAnnouncement({ speaker: payload.speakerName, text: payload.message });
      soundManager.playWin();
      setTimeout(() => {
        setPodiumAnnouncement(null);
      }, 6000);
    });

    const unsubJukebox = socketClient.on('JUKEBOX_PLAY', (payload) => {
      soundManager.playPianoNote(payload.note);
    });

    const unsubAttack = socketClient.on('PLAYER_ATTACK', (payload) => {
      engine.handleRemoteAttack(payload.attackerId, payload.weapon, payload.x, payload.y, payload.dir, payload.angle);
    });

    const unsubHit = socketClient.on('PLAYER_HIT', (payload) => {
      engine.handlePlayerHit(payload);
      setPlayers((prev) =>
        prev.map((p) => (p.id === payload.victimId ? { ...p, hp: payload.victimHp } : p))
      );
      setLocalPlayer((prev) =>
        prev && prev.id === payload.victimId ? { ...prev, hp: payload.victimHp } : prev
      );
    });

    const unsubKnockout = socketClient.on('PLAYER_KNOCKOUT', (payload) => {
      engine.handlePlayerKnockout(payload);
      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id === payload.victimId) return { ...p, hp: 0, isKnockedOut: true, currentMount: null };
          if (p.id === payload.attackerId && typeof payload.attackerKills === 'number') {
            return { ...p, kills: payload.attackerKills };
          }
          return p;
        })
      );
      setLocalPlayer((prev) => {
        if (!prev) return prev;
        if (prev.id === payload.victimId) return { ...prev, hp: 0, isKnockedOut: true, currentMount: null };
        if (prev.id === payload.attackerId && typeof payload.attackerKills === 'number') {
          return { ...prev, kills: payload.attackerKills };
        }
        return prev;
      });

      // MegaPhone Loud Knockout Announcement
      setKnockoutAnnouncement({
        killer: payload.attackerName || 'Chiến binh Shopee',
        victim: payload.victimName || 'Đối thủ',
        weaponName: payload.weaponName || 'Vũ khí Shopee'
      });
      soundManager.playMegaphoneAnnouncement();

      if (knockoutTimerRef.current) clearTimeout(knockoutTimerRef.current);
      knockoutTimerRef.current = setTimeout(() => {
        setKnockoutAnnouncement(null);
      }, 5500);
    });

    const unsubCoinSpawn = socketClient.on('COIN_SPAWN', (payload) => {
      engine.addGroundCoin(payload.coin);
    });

    const unsubCoinCollect = socketClient.on('COIN_COLLECT', (payload) => {
      engine.removeGroundCoin(payload.coinId, payload.playerId);
      setPlayers((prev) =>
        prev.map((p) => (p.id === payload.playerId ? { ...p, coins: payload.coins } : p))
      );
      setLocalPlayer((prev) =>
        prev && prev.id === payload.playerId ? { ...prev, coins: payload.coins } : prev
      );
    });

    const unsubMount = socketClient.on('PLAYER_MOUNT', (payload) => {
      engine.updatePlayerMount(payload.playerId, payload.mount);
      setPlayers((prev) =>
        prev.map((p) => (p.id === payload.playerId ? { ...p, currentMount: payload.mount } : p))
      );
      setLocalPlayer((prev) =>
        prev && prev.id === payload.playerId ? { ...prev, currentMount: payload.mount } : prev
      );
    });

    const unsubRespawn = socketClient.on('PLAYER_RESPAWN', (payload) => {
      engine.handlePlayerRespawn(payload);
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === payload.playerId
            ? { ...p, hp: payload.hp, isKnockedOut: false, invincibleUntil: payload.invincibleUntil }
            : p
        )
      );
      setLocalPlayer((prev) =>
        prev && prev.id === payload.playerId
          ? { ...prev, hp: payload.hp, isKnockedOut: false, invincibleUntil: payload.invincibleUntil }
          : prev
      );
    });

    const unsubEquip = socketClient.on('WEAPON_EQUIP', (payload) => {
      engine.handleWeaponEquip(payload.playerId, payload.weapon);
      setPlayers((prev) =>
        prev.map((p) => (p.id === payload.playerId ? { ...p, equippedWeapon: payload.weapon } : p))
      );
      setLocalPlayer((prev) =>
        prev && prev.id === payload.playerId ? { ...prev, equippedWeapon: payload.weapon } : prev
      );
    });

    return () => {
      engine.stop();
      unsubInit();
      unsubJoined();
      unsubLeft();
      unsubSync();
      unsubChat();
      unsubEmote();
      unsubPodium();
      unsubJukebox();
      unsubAttack();
      unsubHit();
      unsubKnockout();
      unsubRespawn();
      unsubEquip();
      unsubCoinSpawn();
      unsubCoinCollect();
      unsubMount();
    };
  }, []);

  // Sync Input Disabled state to GameEngine when any modal is open
  useEffect(() => {
    const isAnyModalOpen =
      activeModal !== null ||
      isHelpOpen ||
      isRankingOpen ||
      !hasJoined;

    if (engineRef.current) {
      engineRef.current.setInputDisabled(isAnyModalOpen);
    }
  }, [activeModal, isHelpOpen, isRankingOpen, hasJoined]);

  // Global Tab key listener to toggle ranking modal and prevent browser focus jump
  useEffect(() => {
    const handleGlobalTab = (e: KeyboardEvent) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        setIsRankingOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalTab);
    return () => window.removeEventListener('keydown', handleGlobalTab);
  }, []);

  const handleObjectInteraction = (obj: WorldObject) => {
    switch (obj.type) {
      case 'weapon_pickup':
      case 'mount_station':
        socketClient.sendInteractObject(obj.id);
        break;
      case 'whiteboard':
        setActiveModal('whiteboard');
        break;
      case 'shopee_booth':
        setSelectedBooth(obj);
        setActiveModal('shopee_booth');
        break;
      case 'lucky_wheel':
        setActiveModal('lucky_wheel');
        break;
      case 'caro_board':
        setActiveModal('caro_board');
        break;
      case 'podium':
        setActiveModal('podium');
        break;
      case 'jukebox':
        setActiveModal('jukebox');
        break;
      default:
        break;
    }
  };

  const handleCharacterJoin = (name: string, skin: PlayerSkin, status?: string) => {
    socketClient.joinSpace(name, skin);
    if (status) {
      setTimeout(() => {
        socketClient.updateStatus(status);
      }, 300);
    }
    setHasJoined(true);
  };

  const handleSendMessage = (text: string, channel: 'global' | 'proximity' | 'zone') => {
    socketClient.sendChat(text, channel);
  };

  const handleSendEmote = (emote: string) => {
    socketClient.sendEmote(emote);
  };

  const handleToggleSit = () => {
    if (!localPlayer) return;
    const nextSitting = !localPlayer.isSitting;
    setLocalPlayer({ ...localPlayer, isSitting: nextSitting });
    socketClient.sendMove(localPlayer.x, localPlayer.y, localPlayer.dir, false, nextSitting);
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#0f172a' }}>
      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          outline: 'none'
        }}
      />

      {/* Megaphone Knockout Announcement Banner */}
      {knockoutAnnouncement && (
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          background: 'linear-gradient(135deg, #ef4444 0%, #f97316 45%, #eab308 100%)',
          boxShadow: '0 12px 45px rgba(239, 68, 68, 0.65), 0 0 65px rgba(234, 179, 8, 0.45)',
          border: '3px solid #ffffff',
          borderRadius: '24px',
          padding: '18px 40px',
          color: '#ffffff',
          textAlign: 'center',
          animation: 'bounceIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          maxWidth: '85vw',
          pointerEvents: 'none'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            fontWeight: '900',
            color: '#fef08a'
          }}>
            <span style={{ fontSize: '20px' }}>📢</span>
            <span>BẢNG TIN CHIẾN CÔNG • BỤC PHÁT BIỂU (MEGAPHONE)</span>
            <span style={{ fontSize: '20px' }}>🏆</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', marginTop: '8px', textShadow: '0 2px 10px rgba(0,0,0,0.35)' }}>
            💥 <span style={{ color: '#ffffff', textDecoration: 'underline decoration-yellow-300' }}>{knockoutAnnouncement.killer}</span> ĐÃ HẠ GỤC <span style={{ color: '#fecdd3' }}>{knockoutAnnouncement.victim}</span>!
          </div>
          <div style={{ fontSize: '15px', fontWeight: '800', marginTop: '6px', color: '#fef3c7' }}>
            Bằng {knockoutAnnouncement.weaponName} • Xu vàng 🪙 đã rơi khắp mặt cỏ! Mau lại nhặt để nâng cấp!
          </div>
        </div>
      )}

      {/* Megaphone Podium Screen Announcement Banner */}
      {podiumAnnouncement && (
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 40,
          background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.95), rgba(225, 29, 72, 0.95))',
          boxShadow: '0 0 40px rgba(244, 63, 94, 0.6)',
          border: '2px solid #ffffff',
          borderRadius: '20px',
          padding: '16px 32px',
          color: '#ffffff',
          textAlign: 'center',
          animation: 'pulseSlow 1.5s infinite ease-in-out',
          maxWidth: '80vw'
        }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '800', opacity: 0.9 }}>
            📢 THÔNG BÁO TỪ BỤC PHÁT BIỂU • {podiumAnnouncement.speaker}
          </div>
          <div style={{ fontSize: '20px', fontWeight: '900', marginTop: '6px' }}>
            "{podiumAnnouncement.text}"
          </div>
        </div>
      )}

      {/* HUD Bar & Minimap */}
      <HUD
        localPlayer={localPlayer}
        players={players}
        activeZone={activeZone}
        onOpenHelp={() => setIsHelpOpen(true)}
        onTogglePlayerList={() => setIsPlayerListOpen(!isPlayerListOpen)}
        onOpenRanking={() => setIsRankingOpen(true)}
      />

      {/* Multi-channel Chat Box */}
      <ChatBox
        messages={messages}
        localPlayer={localPlayer}
        activeZone={activeZone}
        onSendMessage={handleSendMessage}
        onFocusChange={(focused) => {
          if (engineRef.current) engineRef.current.setInputDisabled(focused);
        }}
      />

      {/* Emote Reaction Bar */}
      <EmotePicker
        onSelectEmote={handleSendEmote}
        isSitting={localPlayer?.isSitting || false}
        onToggleSit={handleToggleSit}
      />

      {/* Participant List Sidebar */}
      <PlayerList
        players={players}
        localPlayer={localPlayer}
        zones={zones}
        isOpen={isPlayerListOpen}
        onClose={() => setIsPlayerListOpen(false)}
      />

      {/* Setup Modal on Initial Entry */}
      {!hasJoined && (
        <CharacterSetup onComplete={handleCharacterJoin} />
      )}

      {/* Interactive Modals */}
      <WhiteboardModal
        isOpen={activeModal === 'whiteboard'}
        onClose={() => setActiveModal(null)}
        initialLines={whiteboardLines}
        selfId={localPlayer?.id || ''}
      />

      <ShopeeBoothModal
        isOpen={activeModal === 'shopee_booth'}
        onClose={() => setActiveModal(null)}
        boothObject={selectedBooth}
      />

      <LuckyWheelModal
        isOpen={activeModal === 'lucky_wheel'}
        onClose={() => setActiveModal(null)}
      />

      {caroState && (
        <CaroModal
          isOpen={activeModal === 'caro_board'}
          onClose={() => setActiveModal(null)}
          selfId={localPlayer?.id || ''}
          selfName={localPlayer?.name || 'Visitor'}
          initialState={caroState}
        />
      )}

      <PodiumModal
        isOpen={activeModal === 'podium'}
        onClose={() => setActiveModal(null)}
        speakerName={localPlayer?.name || 'Speaker'}
      />

      <JukeboxModal
        isOpen={activeModal === 'jukebox'}
        onClose={() => setActiveModal(null)}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      <RankingModal
        isOpen={isRankingOpen}
        onClose={() => setIsRankingOpen(false)}
        players={players}
        localPlayer={localPlayer}
        zones={zones}
      />
    </div>
  );
};
