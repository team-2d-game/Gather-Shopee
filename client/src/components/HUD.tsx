import React, { useRef, useEffect, useState } from 'react';
import { Player, MapZone } from '../types';
import { MAP_WIDTH, MAP_HEIGHT } from '../engine/Tilemap';
import { soundManager } from '../engine/AudioSynth';
import { Volume2, VolumeX, Users, MapPin, Keyboard } from 'lucide-react';

interface HUDProps {
  localPlayer: Player | null;
  players: Player[];
  activeZone: MapZone | null;
  onOpenHelp: () => void;
  onTogglePlayerList: () => void;
  onOpenRanking?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  localPlayer,
  players,
  activeZone,
  onOpenHelp,
  onTogglePlayerList,
  onOpenRanking
}) => {
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const minimapRef = useRef<HTMLCanvasElement>(null);

  const toggleSound = () => {
    const next = !isMuted;
    soundManager.setMuted(next);
    setIsMuted(next);
  };

  // Render Minimap in bright pastel kawaii theme
  useEffect(() => {
    const canvas = minimapRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = canvas.width / MAP_WIDTH;
    const scaleY = canvas.height / MAP_HEIGHT;

    // Background
    ctx.fillStyle = '#fefbf6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Pastel Zones
    // Meeting Alpha & Beta (Lavender)
    ctx.fillStyle = 'rgba(192, 132, 252, 0.35)';
    ctx.fillRect(320 * scaleX, 640 * scaleY, 320 * scaleX, 256 * scaleY);
    ctx.fillRect(672 * scaleX, 640 * scaleY, 320 * scaleX, 256 * scaleY);

    // Shopee Expo (Warm Peach)
    ctx.fillStyle = 'rgba(255, 112, 67, 0.3)';
    ctx.fillRect(1248 * scaleX, 192 * scaleY, 480 * scaleX, 480 * scaleY);

    // Arcade (Mint)
    ctx.fillStyle = 'rgba(52, 211, 153, 0.35)';
    ctx.fillRect(384 * scaleX, 864 * scaleY, 448 * scaleX, 288 * scaleY);

    // Stage (Sakura Pink)
    ctx.fillStyle = 'rgba(251, 113, 133, 0.35)';
    ctx.fillRect(832 * scaleX, 160 * scaleY, 320 * scaleX, 224 * scaleY);

    // Draw Other Players (Cute Sky Blue dots)
    for (const p of players) {
      if (localPlayer && p.id === localPlayer.id) continue;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(p.x * scaleX, p.y * scaleY, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Local Player (Glowing Coral / Orange dot)
    if (localPlayer) {
      ctx.fillStyle = '#ff5722';
      ctx.beginPath();
      ctx.arc(localPlayer.x * scaleX, localPlayer.y * scaleY, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [localPlayer, players]);

  return (
    <>
      {/* Top Left Header Bar */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        {/* Logo Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(20px)',
          border: '1.5px solid rgba(255, 255, 255, 0.9)',
          borderRadius: '20px',
          padding: '8px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 8px 30px rgba(255, 112, 67, 0.12)'
        }}>
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #ff7043, #ff5722)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '900',
            fontSize: '15px',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(255, 87, 34, 0.4)'
          }}>
            S
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '15px', letterSpacing: '-0.3px', color: '#1e293b', lineHeight: '1.2' }}>
              Gather <span style={{ color: '#ff5722' }}>Shopee</span>
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>
              Kawaii Space ✨
            </div>
          </div>
        </div>

        {/* Current Zone Badge */}
        {activeZone && (
          <div style={{
            background: activeZone.isPrivate ? 'rgba(243, 232, 255, 0.95)' : 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(20px)',
            border: activeZone.isPrivate ? '1.5px solid #d8b4fe' : '1.5px solid rgba(255, 255, 255, 0.9)',
            borderRadius: '18px',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: activeZone.isPrivate ? '#7e22ce' : '#1e293b',
            fontSize: '13px',
            fontWeight: '700',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)'
          }}>
            <MapPin size={15} color={activeZone.isPrivate ? '#a855f7' : '#ff5722'} />
            <span>{activeZone.name}</span>
            {activeZone.isPrivate && (
              <span style={{
                fontSize: '10px',
                background: '#c084fc',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '999px',
                marginLeft: '4px'
              }}>
                🔒 Cách âm
              </span>
            )}
          </div>
        )}

        {/* Online Count & Participant Toggle */}
        <button
          onClick={onTogglePlayerList}
          style={{
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(20px)',
            border: '1.5px solid rgba(255, 255, 255, 0.9)',
            borderRadius: '18px',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#059669',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.15s'
          }}
        >
          <Users size={15} />
          <span>{players.length} bạn online</span>
        </button>

        {/* Equipped Weapon Pill */}
        {localPlayer?.equippedWeapon && (() => {
          const weaponMeta: Record<string, { name: string; icon: string; dmg: number; color: string }> = {
            candy_blade: { name: 'Kiếm Kẹo Mút', icon: '🍭', dmg: 25, color: '#f43f5e' },
            toy_hammer: { name: 'Búa Shopee', icon: '🔨', dmg: 35, color: '#f59e0b' },
            star_wand: { name: 'Gậy Ngôi Sao', icon: '🪄', dmg: 20, color: '#c084fc' },
            water_gun: { name: 'Súng Nước Vịt', icon: '🔫', dmg: 15, color: '#0284c7' }
          };
          const w = weaponMeta[localPlayer.equippedWeapon] || weaponMeta.candy_blade;
          return (
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: `2px solid ${w.color}`,
              borderRadius: '18px',
              padding: '7px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#1e293b',
              fontSize: '13px',
              fontWeight: '800',
              boxShadow: `0 8px 25px ${w.color}35`,
              animation: 'popIn 0.3s ease'
            }}>
              <span style={{ fontSize: '18px' }}>{w.icon}</span>
              <span>{w.name}</span>
              <span style={{
                fontSize: '10px',
                background: w.color,
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '999px',
                fontWeight: '900',
                letterSpacing: '0.3px'
              }}>
                {w.dmg} DMG
              </span>
              <span style={{
                fontSize: '11px',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                padding: '2px 6px',
                borderRadius: '6px',
                color: '#475569',
                marginLeft: '4px'
              }}>
                Space / Click
              </span>
            </div>
          );
        })()}

        {/* Coin Counter & Hitbox Upgrade Pill */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '2px solid #f59e0b',
          borderRadius: '18px',
          padding: '7px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#b45309',
          fontSize: '13px',
          fontWeight: '800',
          boxShadow: '0 8px 25px rgba(245, 158, 11, 0.25)'
        }}>
          <span style={{ fontSize: '18px' }}>🪙</span>
          <span>{localPlayer?.coins || 0} Xu</span>
          {(localPlayer?.coins || 0) > 0 && (
            <span style={{
              fontSize: '10px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: '999px',
              fontWeight: '900'
            }}>
              +{(localPlayer?.coins || 0) * 5}% Hitbox ✨
            </span>
          )}
        </div>

        {/* Fiery Kill Badge (Tròn, hiệu ứng cực cháy) */}
        <div
          onClick={onOpenRanking}
          title={`Chiến tích: ${localPlayer?.kills || 0} mạng hạ gục! Click hoặc nhấn [TAB] để xem Bảng Xếp Hạng`}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 30%, #ffffff 0%, #fef08a 25%, #f97316 60%, #dc2626 90%, #7f1d1d 100%)',
            border: '2.5px solid #facc15',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            animation: 'fireFlame 1.6s infinite ease-in-out, fireBorderGlow 1.4s infinite ease-in-out',
            flexShrink: 0,
            transition: 'transform 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {/* Flame Icon */}
          <span style={{ fontSize: '13px', lineHeight: '1', animation: 'flameWiggle 1.2s infinite ease-in-out' }}>
            🔥
          </span>
          {/* Kill Count */}
          <span style={{
            fontSize: '13px',
            fontWeight: '900',
            color: '#ffffff',
            lineHeight: '1',
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.9), 0 0 8px #f59e0b'
          }}>
            {localPlayer?.kills || 0}
          </span>
        </div>

        {/* Tab Ranking Quick Button */}
        <button
          onClick={onOpenRanking}
          title="Xem Bảng Xếp Hạng Chiến Thần (Phím tắt: TAB)"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1.5px solid #fdba74',
            borderRadius: '18px',
            padding: '7px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#c2410c',
            fontSize: '13px',
            fontWeight: '800',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(234, 88, 12, 0.15)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#fff7ed';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <span style={{
            fontSize: '10px',
            background: '#ffedd5',
            border: '1px solid #fb923c',
            padding: '1px 5px',
            borderRadius: '5px',
            fontWeight: '900',
            color: '#ea580c'
          }}>
            TAB
          </span>
          <span>🏆 Xếp Hạng</span>
        </button>

        {/* Current Mount / Vehicle Pill */}
        {localPlayer?.currentMount && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '2px solid #3b82f6',
            borderRadius: '18px',
            padding: '7px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#1d4ed8',
            fontSize: '13px',
            fontWeight: '800',
            boxShadow: '0 8px 25px rgba(59, 130, 246, 0.25)',
            animation: 'popIn 0.3s ease'
          }}>
            <span style={{ fontSize: '18px' }}>{localPlayer.currentMount === 'kart' ? '🚗' : '🦄'}</span>
            <span>{localPlayer.currentMount === 'kart' ? 'Xe Shopee Express' : 'Ngựa Pony Cầu Vồng'}</span>
            <span style={{
              fontSize: '10px',
              background: '#3b82f6',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: '999px',
              fontWeight: '900'
            }}>
              {localPlayer.currentMount === 'kart' ? '+80% Tốc độ' : '+55% Tốc độ'}
            </span>
            <span style={{
              fontSize: '11px',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              padding: '2px 6px',
              borderRadius: '6px',
              color: '#475569',
              marginLeft: '4px'
            }}>
              Bấm E để xuống
            </span>
          </div>
        )}
      </div>

      {/* Top Right Controls & Minimap */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Sound Toggle Button */}
          <button
            onClick={toggleSound}
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(255, 255, 255, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isMuted ? '#f43f5e' : '#0284c7',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.06)'
            }}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          {/* Help Button */}
          <button
            onClick={onOpenHelp}
            title="Hướng dẫn phím tắt & tương tác"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(255, 255, 255, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1e293b',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.06)'
            }}
          >
            <Keyboard size={18} />
          </button>
        </div>

        {/* Minimap Box */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(255, 255, 255, 0.9)',
          borderRadius: '20px',
          padding: '10px',
          boxShadow: '0 10px 30px rgba(255, 112, 67, 0.12)'
        }}>
          <canvas
            ref={minimapRef}
            width={160}
            height={106}
            style={{
              borderRadius: '12px',
              display: 'block',
              border: '1px solid #f1f5f9'
            }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '9.5px',
            fontWeight: '600',
            color: '#64748b',
            marginTop: '6px',
            padding: '0 2px'
          }}>
            <span>🟠 Bạn</span>
            <span>🔵 Bạn bè</span>
            <span>🟧 Shopee</span>
          </div>
        </div>
      </div>
    </>
  );
};
