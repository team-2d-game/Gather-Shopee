import React from 'react';
import { X, Keyboard, Compass, Shield, ShoppingBag, Sparkles } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

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
        border: '2px solid #fed7aa',
        borderRadius: '28px',
        width: '90%',
        maxWidth: '560px',
        boxShadow: '0 20px 60px rgba(255, 112, 67, 0.16), 0 4px 20px rgba(0, 0, 0, 0.05)',
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
              background: '#e0f2fe',
              border: '1.5px solid #7dd3fc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7'
            }}>
              <Keyboard size={22} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>Hướng Dẫn Sử Dụng & Phím Tắt 💡</h3>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
          {/* Controls */}
          <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', padding: '14px 18px', borderRadius: '18px' }}>
            <h4 style={{ fontWeight: '800', color: '#ea580c', marginBottom: '10px', fontSize: '14px' }}>🕹️ Điều Khiển Nhân Vật</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ background: '#ffffff', border: '1px solid #fdba74', padding: '2px 8px', borderRadius: '6px', fontWeight: '800', color: '#c2410c' }}>W A S D</span>
                <span style={{ color: '#475569' }}>hoặc Mũi Tên</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ background: '#ffffff', border: '1px solid #fdba74', padding: '2px 8px', borderRadius: '6px', fontWeight: '800', color: '#c2410c' }}>E</span>
                <span style={{ color: '#475569' }}>Nhặt vũ khí / Tương tác</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ background: '#ffffff', border: '1px solid #fdba74', padding: '2px 8px', borderRadius: '6px', fontWeight: '800', color: '#c2410c' }}>Space / Click</span>
                <span style={{ color: '#475569' }}>Vung vũ khí chém</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ background: '#ffffff', border: '1px solid #fdba74', padding: '2px 8px', borderRadius: '6px', fontWeight: '800', color: '#c2410c' }}>Z</span>
                <span style={{ color: '#475569' }}>Ngồi xuống / Đứng</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ background: '#ffffff', border: '1px solid #fdba74', padding: '2px 8px', borderRadius: '6px', fontWeight: '800', color: '#c2410c' }}>TAB</span>
                <span style={{ color: '#475569' }}>Bảng xếp hạng chiến thần</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ background: '#ffffff', border: '1px solid #fdba74', padding: '2px 8px', borderRadius: '6px', fontWeight: '800', color: '#c2410c' }}>1 - 8</span>
                <span style={{ color: '#475569' }}>Thả biểu cảm (Emotes)</span>
              </div>
            </div>
          </div>

          {/* Combat System Guide */}
          <div style={{ background: '#fff1f2', border: '1.5px solid #fecdd3', padding: '14px 18px', borderRadius: '18px' }}>
            <h4 style={{ fontWeight: '800', color: '#e11d48', marginBottom: '8px', fontSize: '14px' }}>⚔️ Đấu Trường Kawaii PvP (Vui Nhộn)</h4>
            <div style={{ color: '#475569', lineHeight: '1.4', fontSize: '12.5px' }}>
              • Rải rác trên bản đồ có 4 bệ vũ khí phát sáng: 🍭 <strong>Kiếm Kẹo Mút</strong>, 🔨 <strong>Búa Shopee</strong>, 🪄 <strong>Gậy Ngôi Sao</strong>, 🔫 <strong>Súng Nước Vịt</strong>.<br />
              • Tiến lại gần bệ bấm <strong>[E]</strong> để trang bị, bấm <strong>[Space / Click]</strong> để chém đối thủ.<br />
              • Đánh trúng sẽ văng sao, nảy số sát thương và trừ máu HP. Khi hết máu, người chơi biến thành chú ma 👻 và <strong>tự động hồi sinh sau 3 giây</strong> kèm khiên bảo vệ 🛡️!
            </div>
          </div>

          {/* Interactive Stations */}
          <div style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe', padding: '14px 18px', borderRadius: '18px' }}>
            <h4 style={{ fontWeight: '800', color: '#7c3aed', marginBottom: '10px', fontSize: '14px' }}>📍 Các Khu Vực & Điểm Tương Tác</h4>
            <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px', color: '#475569', lineHeight: '1.4' }}>
              <li><strong style={{ color: '#1e293b' }}>Sảnh Trung Tâm</strong>: Nơi bắt đầu, gặp gỡ giao lưu bạn bè.</li>
              <li><strong style={{ color: '#1e293b' }}>Phòng Họp Alpha & Beta (🔒 Private Space)</strong>: Cách âm riêng tư, chỉ người trong phòng mới nghe thấy và chat với nhau.</li>
              <li><strong style={{ color: '#1e293b' }}>Bảng Trắng Live Canvas</strong>: Bước lại gần và nhấn <code>E</code> để cùng vẽ và phác thảo ý tưởng.</li>
              <li><strong style={{ color: '#1e293b' }}>Gian Hàng & Vòng Quay Shopee</strong>: Xem sản phẩm, quay thưởng may mắn nhận Voucher & Xu.</li>
              <li><strong style={{ color: '#1e293b' }}>Bàn Đấu Cờ Caro & Jukebox</strong>: Chơi cờ 15x15 với bạn bè hoặc đàn nhạc piano.</li>
              <li><strong style={{ color: '#1e293b' }}>Bục Phát Biểu (Megaphone Stage)</strong>: Đứng lên bục để phát thông báo toàn không gian.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
