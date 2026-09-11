import React, { useState } from 'react';
import { socketClient } from '../../network/socketClient';
import { X, Megaphone, Send } from 'lucide-react';

interface PodiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  speakerName: string;
}

export const PodiumModal: React.FC<PodiumModalProps> = ({ isOpen, onClose, speakerName }) => {
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;

    socketClient.broadcastPodium(text);
    setMessage('');
    onClose();
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
        border: '2px solid #fbcfe8',
        borderRadius: '28px',
        width: '90%',
        maxWidth: '460px',
        boxShadow: '0 20px 60px rgba(244, 63, 94, 0.15), 0 4px 20px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        padding: '26px 24px',
        color: '#1e293b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '14px',
              background: '#fff1f2',
              border: '1.5px solid #fecdd3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f43f5e'
            }}>
              <Megaphone size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>Bục Phát Biểu 🎙️</h3>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Thông điệp sẽ hiển thị nổi bật trên màn hình của tất cả mọi người</p>
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

        <form onSubmit={handleBroadcast}>
          <textarea
            placeholder="Nhập thông báo phát thanh toàn không gian (tối đa 120 ký tự)..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={120}
            rows={3}
            style={{
              width: '100%',
              background: '#f8fafc',
              border: '1.5px solid #fed7aa',
              borderRadius: '16px',
              padding: '12px 14px',
              color: '#0f172a',
              fontSize: '14px',
              resize: 'none',
              outline: 'none',
              marginBottom: '16px',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#ff7043';
              e.target.style.boxShadow = '0 0 0 3px rgba(255, 112, 67, 0.15)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#fed7aa';
              e.target.style.boxShadow = 'none';
            }}
          />

          <button
            type="submit"
            className="kawaii-btn"
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #fb7185, #f43f5e)',
              boxShadow: '0 6px 20px rgba(244, 63, 94, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Send size={16} /> Phát Sóng Ngay ✨
          </button>
        </form>
      </div>
    </div>
  );
};
