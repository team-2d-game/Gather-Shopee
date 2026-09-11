import React from 'react';
import { socketClient } from '../../network/socketClient';
import { soundManager } from '../../engine/AudioSynth';
import { X, Music } from 'lucide-react';

interface JukeboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NOTES = [
  { label: 'Đô (C4)', key: '1' },
  { label: 'Rê (D4)', key: '2' },
  { label: 'Mi (E4)', key: '3' },
  { label: 'Pha (F4)', key: '4' },
  { label: 'Son (G4)', key: '5' },
  { label: 'La (A4)', key: '6' },
  { label: 'Si (B4)', key: '7' },
  { label: 'Đố (C5)', key: '8' }
];

export const JukeboxModal: React.FC<JukeboxModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const playNote = (index: number) => {
    soundManager.playPianoNote(index);
    socketClient.playJukeboxNote(index);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(250, 246, 240, 0.65)',
      backdropFilter: 'blur(16px)'
    }}>
      <div style={{
        background: '#ffffff',
        border: '2px solid #bae6fd',
        borderRadius: '28px',
        width: '90%',
        maxWidth: '520px',
        boxShadow: '0 20px 60px rgba(56, 189, 248, 0.16), 0 4px 20px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        padding: '26px 24px',
        color: '#1e293b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '14px',
              background: '#e0f2fe',
              border: '1.5px solid #7dd3fc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7'
            }}>
              <Music size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>Kawaii Jukebox (Piano Tương Tác) 🎶</h3>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Người chơi đứng gần bạn sẽ cùng nghe thấy giai điệu bạn chơi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              color: '#64748b',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Piano Keys */}
        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center',
          background: '#f8fafc',
          padding: '20px 14px',
          borderRadius: '20px',
          border: '1.5px solid #e2e8f0',
          boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.04)'
        }}>
          {NOTES.map((n, i) => (
            <button
              key={n.label}
              onClick={() => playNote(i)}
              style={{
                flex: 1,
                height: '145px',
                background: 'linear-gradient(to bottom, #ffffff 60%, #f1f5f9 100%)',
                border: '1.5px solid #cbd5e1',
                borderRadius: '12px',
                color: '#1e293b',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                alignItems: 'center',
                paddingBottom: '12px',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08), inset 0 -3px 0 #cbd5e1',
                transition: 'transform 0.1s, background 0.1s, box-shadow 0.1s'
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.96) translateY(4px)';
                e.currentTarget.style.background = '#38bdf8';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                e.currentTarget.style.background = 'linear-gradient(to bottom, #ffffff 60%, #f1f5f9 100%)';
                e.currentTarget.style.color = '#1e293b';
                e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.08), inset 0 -3px 0 #cbd5e1';
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: '800' }}>{n.label}</span>
              <span style={{ fontSize: '12px', fontWeight: '900', color: '#94a3b8' }}>[{n.key}]</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
