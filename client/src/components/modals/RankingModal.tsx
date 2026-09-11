import React, { useEffect } from 'react';
import { Player, MapZone } from '../../types';
import { X, Trophy, Flame, Coins, Swords, Shield, MapPin, Sparkles } from 'lucide-react';

interface RankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  localPlayer: Player | null;
  zones: MapZone[];
}

export const RankingModal: React.FC<RankingModalProps> = ({
  isOpen,
  onClose,
  players,
  localPlayer,
  zones
}) => {
  // Listen for Escape or Tab to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'Tab') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Merge localPlayer into player list if not already present or updated
  const allPlayersMap = new Map<string, Player>();
  for (const p of players) {
    allPlayersMap.set(p.id, p);
  }
  if (localPlayer) {
    allPlayersMap.set(localPlayer.id, localPlayer);
  }
  const allPlayers = Array.from(allPlayersMap.values());

  // Sort by Kills descending, then Coins descending, then Name
  const sortedPlayers = [...allPlayers].sort((a, b) => {
    const killsA = a.kills || 0;
    const killsB = b.kills || 0;
    if (killsB !== killsA) return killsB - killsA;
    const coinsA = a.coins || 0;
    const coinsB = b.coins || 0;
    if (coinsB !== coinsA) return coinsB - coinsA;
    return a.name.localeCompare(b.name);
  });

  const weaponNames: Record<string, { name: string; icon: string; color: string }> = {
    candy_blade: { name: 'Kiếm Kẹo Mút', icon: '🍭', color: '#f43f5e' },
    toy_hammer: { name: 'Búa Shopee', icon: '🔨', color: '#f59e0b' },
    star_wand: { name: 'Gậy Ngôi Sao', icon: '🪄', color: '#c084fc' },
    water_gun: { name: 'Súng Nước Vịt', icon: '🔫', color: '#0284c7' }
  };

  const getZoneName = (zoneId: string | null | undefined): string => {
    if (!zoneId) return 'Sảnh Trung Tâm';
    const found = zones.find((z) => z.id === zoneId);
    return found ? found.name : 'Sảnh Trung Tâm';
  };

  const topPlayer = sortedPlayers[0];
  const myRankIndex = localPlayer ? sortedPlayers.findIndex((p) => p.id === localPlayer.id) : -1;
  const myRank = myRankIndex !== -1 ? myRankIndex + 1 : null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(16px)',
        padding: '16px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #fef8f4 100%)',
          border: '2px solid #fdba74',
          borderRadius: '28px',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '88vh',
          boxShadow: '0 25px 70px rgba(234, 88, 12, 0.25), 0 8px 30px rgba(0, 0, 0, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#1e293b',
          animation: 'popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #ea580c 0%, #f97316 50%, #f59e0b 100%)',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#ffffff',
            boxShadow: '0 4px 20px rgba(234, 88, 12, 0.25)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Fiery Trophy Badge */}
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, #fef08a 0%, #f59e0b 60%, #dc2626 100%)',
                border: '2.5px solid #fff',
                boxShadow: '0 0 18px #facc15, 0 0 32px #f97316',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px'
              }}
            >
              🏆
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-0.4px', margin: 0 }}>
                  BẢNG XẾP HẠNG CHIẾN THẦN
                </h3>
                <span
                  style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    padding: '2px 10px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: '800',
                    letterSpacing: '0.4px',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}
                >
                  LIVE PvP ⚔️
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', opacity: 0.95, fontWeight: '600' }}>
                Hạ gục đối thủ để thăng hạng, cướp xu và mở rộng tầm đánh của vũ khí!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            title="Đóng (ESC hoặc TAB)"
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              color: '#ffffff',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Highlight Banner: MVP Top 1 & Local Player Summary */}
        <div
          style={{
            padding: '14px 24px',
            background: '#fff7ed',
            borderBottom: '1px solid #fed7aa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          {/* Top 1 MVP */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#c2410c' }}>🔥 CHIẾN THẦN SỐ 1:</span>
            {topPlayer ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#ffffff',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  border: '1.5px solid #f97316',
                  boxShadow: '0 2px 8px rgba(249, 115, 22, 0.15)'
                }}
              >
                <span style={{ fontSize: '16px' }}>👑</span>
                <span style={{ fontWeight: '800', fontSize: '13px', color: '#1e293b' }}>
                  {topPlayer.name} {localPlayer && topPlayer.id === localPlayer.id ? '(Bạn)' : ''}
                </span>
                <span
                  style={{
                    background: 'linear-gradient(135deg, #ef4444, #f97316)',
                    color: '#fff',
                    padding: '1px 8px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: '900'
                  }}
                >
                  🔥 {topPlayer.kills || 0} Kills
                </span>
              </div>
            ) : (
              <span style={{ fontSize: '12px', color: '#64748b' }}>Chưa có chiến tích</span>
            )}
          </div>

          {/* Local Player Stats */}
          {localPlayer && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#ffedd5',
                border: '1.5px solid #fb923c',
                padding: '4px 14px',
                borderRadius: '14px'
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#9a3412' }}>VỊ TRÍ CỦA BẠN:</span>
              <span style={{ fontWeight: '900', color: '#ea580c', fontSize: '14px' }}>
                #{myRank !== null ? myRank : '-'}
              </span>
              <span style={{ color: '#fed7aa' }}>|</span>
              <span style={{ fontWeight: '800', fontSize: '12px', color: '#b45309' }}>
                🔥 {localPlayer.kills || 0} Mạng
              </span>
              <span style={{ color: '#fed7aa' }}>|</span>
              <span style={{ fontWeight: '800', fontSize: '12px', color: '#b45309' }}>
                🪙 {localPlayer.coins || 0} Xu
              </span>
            </div>
          )}
        </div>

        {/* Scrollable Leaderboard Table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', fontSize: '13px' }}>
            <thead>
              <tr style={{ color: '#64748b', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                <th style={{ textAlign: 'center', width: '56px', padding: '0 8px 6px' }}>Hạng</th>
                <th style={{ textAlign: 'left', padding: '0 12px 6px' }}>Chiến Binh</th>
                <th style={{ textAlign: 'center', width: '110px', padding: '0 8px 6px' }}>Hạ Gục</th>
                <th style={{ textAlign: 'center', width: '90px', padding: '0 8px 6px' }}>Xu Nhặt</th>
                <th style={{ textAlign: 'left', width: '180px', padding: '0 12px 6px' }}>Vũ Khí & Xe</th>
                <th style={{ textAlign: 'right', width: '130px', padding: '0 8px 6px' }}>Vị Trí</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player, idx) => {
                const isSelf = localPlayer && player.id === localPlayer.id;
                const rank = idx + 1;
                const kills = player.kills || 0;
                const coins = player.coins || 0;
                const weapon = player.equippedWeapon ? weaponNames[player.equippedWeapon] : null;

                // Rank Medal Styling
                let rankBadge: React.ReactNode = `#${rank}`;
                let rankBg = '#f1f5f9';
                let rankColor = '#64748b';

                if (rank === 1) {
                  rankBadge = '🥇 TOP 1';
                  rankBg = 'linear-gradient(135deg, #fef08a, #f59e0b)';
                  rankColor = '#78350f';
                } else if (rank === 2) {
                  rankBadge = '🥈 TOP 2';
                  rankBg = 'linear-gradient(135deg, #e2e8f0, #94a3b8)';
                  rankColor = '#1e293b';
                } else if (rank === 3) {
                  rankBadge = '🥉 TOP 3';
                  rankBg = 'linear-gradient(135deg, #fed7aa, #d97706)';
                  rankColor = '#7c2d12';
                }

                return (
                  <tr
                    key={player.id}
                    style={{
                      background: isSelf
                        ? 'linear-gradient(90deg, #fff7ed 0%, #ffedd5 100%)'
                        : '#ffffff',
                      border: isSelf ? '2px solid #f97316' : '1px solid #f1f5f9',
                      borderRadius: '16px',
                      boxShadow: isSelf
                        ? '0 4px 16px rgba(249, 115, 22, 0.2)'
                        : '0 2px 8px rgba(0, 0, 0, 0.03)',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    {/* Rank */}
                    <td style={{ padding: '12px 8px', textAlign: 'center', borderTopLeftRadius: '16px', borderBottomLeftRadius: '16px' }}>
                      <span
                        style={{
                          background: rankBg,
                          color: rankColor,
                          padding: '4px 8px',
                          borderRadius: '10px',
                          fontWeight: '900',
                          fontSize: rank <= 3 ? '12px' : '12px',
                          display: 'inline-block',
                          boxShadow: rank === 1 ? '0 0 10px rgba(245, 158, 11, 0.4)' : 'none'
                        }}
                      >
                        {rankBadge}
                      </span>
                    </td>

                    {/* Player Info & Avatar */}
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Mini Chibi Circle Swatch */}
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: player.skin?.bodyColor || '#ff7043',
                            border: `2.5px solid ${player.skin?.hairColor || '#475569'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
                            flexShrink: 0
                          }}
                        >
                          <span style={{ fontSize: '13px' }}>
                            {player.isKnockedOut ? '👻' : '😊'}
                          </span>
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: '800', fontSize: '14px', color: '#1e293b' }}>
                              {player.name}
                            </span>
                            {isSelf && (
                              <span
                                style={{
                                  background: '#ea580c',
                                  color: '#ffffff',
                                  padding: '1px 6px',
                                  borderRadius: '999px',
                                  fontSize: '10px',
                                  fontWeight: '900'
                                }}
                              >
                                Bạn
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '11px', color: player.isKnockedOut ? '#ef4444' : '#10b981', fontWeight: '700' }}>
                            {player.isKnockedOut ? 'Đang hồi sinh...' : 'Sẵn sàng chiến đấu'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Kills with Fiery Effect */}
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 12px',
                            borderRadius: '999px',
                            background: kills > 0
                              ? 'linear-gradient(135deg, #ef4444 0%, #f97316 50%, #f59e0b 100%)'
                              : '#f1f5f9',
                            color: kills > 0 ? '#ffffff' : '#64748b',
                            border: kills > 0 ? '1.5px solid #fde047' : '1px solid #e2e8f0',
                            fontWeight: '900',
                            fontSize: '13px',
                            boxShadow: kills > 0 ? '0 0 14px rgba(239, 68, 68, 0.45)' : 'none'
                          }}
                        >
                          <span style={{ fontSize: kills > 0 ? '15px' : '13px' }}>
                            {kills > 0 ? '🔥' : '⚔️'}
                          </span>
                          <span>{kills}</span>
                        </div>
                      </div>
                    </td>

                    {/* Coins */}
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <span
                        style={{
                          background: '#fef3c7',
                          color: '#b45309',
                          border: '1px solid #fde68a',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontWeight: '800',
                          fontSize: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span>🪙</span>
                        <span>{coins}</span>
                      </span>
                    </td>

                    {/* Equipped Weapon & Mount */}
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {weapon ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{weapon.icon}</span>
                            <span style={{ fontWeight: '700', fontSize: '12px', color: '#334155' }}>
                              {weapon.name}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                            Chưa nhặt vũ khí
                          </span>
                        )}

                        {player.currentMount && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#2563eb', fontWeight: '700' }}>
                            <span>{player.currentMount === 'kart' ? '🚗' : '🦄'}</span>
                            <span>{player.currentMount === 'kart' ? 'Xe Shopee (+80%)' : 'Ngựa Pony (+55%)'}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Zone */}
                    <td style={{ padding: '12px 14px', textAlign: 'right', borderTopRightRadius: '16px', borderBottomRightRadius: '16px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>
                        <MapPin size={13} color="#f97316" />
                        <span>{getZoneName(player.zoneId)}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            background: '#ffffff',
            borderTop: '1px solid #fed7aa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
            <span
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                padding: '2px 8px',
                borderRadius: '6px',
                fontWeight: '800',
                color: '#1e293b'
              }}
            >
              TAB
            </span>
            <span>Bấm TAB hoặc ESC để đóng / mở lại bất kỳ lúc nào</span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, #ea580c, #f97316)',
              color: '#ffffff',
              border: 'none',
              padding: '8px 22px',
              borderRadius: '14px',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(234, 88, 12, 0.3)',
              transition: 'all 0.15s ease'
            }}
          >
            Quay Lại Trận Đấu ⚔️
          </button>
        </div>
      </div>
    </div>
  );
};
