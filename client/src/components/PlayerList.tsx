import React from 'react';
import { Player, MapZone } from '../types';
import { X, Users, MapPin, Circle } from 'lucide-react';

interface PlayerListProps {
  players: Player[];
  localPlayer: Player | null;
  zones: MapZone[];
  isOpen: boolean;
  onClose: () => void;
}

export const PlayerList: React.FC<PlayerListProps> = ({
  players,
  localPlayer,
  zones,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const getZoneName = (zoneId: string | null) => {
    if (!zoneId) return 'Hành lang chung';
    const found = zones.find((z) => z.id === zoneId);
    return found ? found.name : 'Hành lang';
  };

  return (
    <div style={{
      position: 'absolute',
      top: '16px',
      right: '16px',
      width: '290px',
      maxHeight: 'calc(100vh - 32px)',
      zIndex: 30,
      background: 'rgba(255, 255, 255, 0.96)',
      backdropFilter: 'blur(20px)',
      border: '2px solid rgba(255, 255, 255, 0.9)',
      borderRadius: '24px',
      boxShadow: '0 14px 40px rgba(0, 0, 0, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 18px',
        borderBottom: '1px solid #f1f5f9',
        background: '#fff7ed'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b', fontWeight: '800', fontSize: '14px' }}>
          <Users size={16} color="#ff5722" />
          <span>Bạn Bè Online ({players.length})</span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '2px'
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Players List */}
      <div style={{
        padding: '12px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {players.map((p) => {
          const isSelf = localPlayer && p.id === localPlayer.id;
          return (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '14px',
                background: isSelf ? '#ffedd5' : '#f8fafc',
                border: isSelf ? '1.5px solid #fed7aa' : '1px solid #f1f5f9'
              }}
            >
              {/* Avatar Mini */}
              <div style={{
                position: 'relative',
                width: '34px',
                height: '34px',
                borderRadius: '12px',
                backgroundColor: p.skin?.outfitColor || '#ee4d2d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                color: '#fff',
                fontSize: '13px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                {p.name.charAt(0).toUpperCase()}
                <Circle
                  size={9}
                  fill="#10b981"
                  color="#10b981"
                  style={{ position: 'absolute', bottom: '-2px', right: '-2px' }}
                />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '700',
                  fontSize: '13px',
                  color: isSelf ? '#ea580c' : '#1e293b',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {p.name} {isSelf && '(Bạn)'}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  color: '#64748b',
                  marginTop: '2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  <MapPin size={11} color="#f97316" />
                  <span>{getZoneName(p.zoneId)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
