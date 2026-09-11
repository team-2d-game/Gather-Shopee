import React from 'react';
import { Armchair } from 'lucide-react';

interface EmotePickerProps {
  onSelectEmote: (emote: string) => void;
  isSitting: boolean;
  onToggleSit: () => void;
}

const EMOTE_LIST = [
  { emote: '👋', label: 'Vẫy tay', key: '1' },
  { emote: '❤️', label: 'Thả tim', key: '2' },
  { emote: '🎉', label: 'Ăn mừng', key: '3' },
  { emote: '🔥', label: 'Cháy', key: '4' },
  { emote: '💡', label: 'Ý tưởng', key: '5' },
  { emote: '😂', label: 'Cười', key: '6' },
  { emote: '☕', label: 'Cafe', key: '7' },
  { emote: '🎮', label: 'Chơi game', key: '8' }
];

export const EmotePicker: React.FC<EmotePickerProps> = ({
  onSelectEmote,
  isSitting,
  onToggleSit
}) => {
  return (
    <div style={{
      position: 'absolute',
      bottom: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 20,
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '2px solid rgba(255, 255, 255, 0.9)',
      borderRadius: '999px',
      padding: '8px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      boxShadow: '0 12px 35px rgba(255, 112, 67, 0.18)'
    }}>
      {EMOTE_LIST.map(({ emote, label, key }) => (
        <button
          key={emote}
          onClick={() => onSelectEmote(emote)}
          title={`${label} (Phím ${key})`}
          style={{
            position: 'relative',
            background: '#fef3c7',
            border: '1px solid #fde68a',
            borderRadius: '12px',
            width: '38px',
            height: '38px',
            fontSize: '19px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.25) translateY(-5px)';
            e.currentTarget.style.backgroundColor = '#fed7aa';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1) translateY(0)';
            e.currentTarget.style.backgroundColor = '#fef3c7';
          }}
        >
          {emote}
        </button>
      ))}

      <div style={{ width: '1.5px', height: '26px', background: '#e2e8f0', margin: '0 6px' }} />

      {/* Sit / Stand button */}
      <button
        onClick={onToggleSit}
        title="Ngồi / Đứng (Phím Z)"
        style={{
          background: isSitting ? '#fee2e2' : '#f0fdf4',
          border: isSitting ? '1.5px solid #f87171' : '1.5px solid #86efac',
          color: isSitting ? '#dc2626' : '#15803d',
          borderRadius: '999px',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12.5px',
          fontWeight: '700',
          cursor: 'pointer',
          transition: 'all 0.15s'
        }}
      >
        <Armchair size={16} />
        <span>{isSitting ? 'Đứng dậy' : 'Ngồi [Z]'}</span>
      </button>
    </div>
  );
};
