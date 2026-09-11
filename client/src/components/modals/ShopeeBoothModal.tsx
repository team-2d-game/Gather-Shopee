import React, { useState } from 'react';
import { WorldObject } from '../../types';
import confetti from 'canvas-confetti';
import { soundManager } from '../../engine/AudioSynth';
import { X, ShoppingBag, Tag, Check, Star, Sparkles } from 'lucide-react';

interface ShopeeBoothModalProps {
  isOpen: boolean;
  onClose: () => void;
  boothObject: WorldObject | null;
}

export const ShopeeBoothModal: React.FC<ShopeeBoothModalProps> = ({
  isOpen,
  onClose,
  boothObject
}) => {
  const [claimedCode, setClaimedCode] = useState<string | null>(null);

  if (!isOpen || !boothObject) return null;

  const state = boothObject.state || {
    title: 'Gian Hàng Shopee Expo',
    category: 'Official Merchandise',
    products: []
  };

  const handleClaimVoucher = (code: string) => {
    setClaimedCode(code);
    soundManager.playWin();

    // Confetti burst
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
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
        border: '2px solid rgba(255, 112, 67, 0.25)',
        borderRadius: '28px',
        width: '90%',
        maxWidth: '680px',
        boxShadow: '0 20px 60px rgba(255, 112, 67, 0.16), 0 4px 20px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: '#1e293b'
      }}>
        {/* Banner Header */}
        <div style={{
          background: 'linear-gradient(135deg, #ff7043, #ff5722)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '14px',
              background: '#ffffff',
              color: '#ff5722',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}>
              <ShoppingBag size={22} />
            </div>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.95, fontWeight: '700' }}>
                {state.category}
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: '800' }}>{state.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.25)',
              border: 'none',
              color: '#ffffff',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Voucher Banner */}
        <div style={{
          margin: '16px 20px 0 20px',
          padding: '14px 18px',
          background: '#fff1ee',
          border: '1.5px dashed #ff8a65',
          borderRadius: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Tag size={22} color="#ff5722" />
            <div>
              <div style={{ fontWeight: '800', fontSize: '13px', color: '#c2410c' }}>
                Voucher Độc Quyền Khách Tham Quan Ảo 🎟️
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Giảm ngay 20% tối đa 100.000đ khi mua tại gian hàng
              </div>
            </div>
          </div>
          <button
            onClick={() => handleClaimVoucher('SHOPEE-VIRTUAL-VIP')}
            disabled={claimedCode !== null}
            className="kawaii-btn"
            style={{
              background: claimedCode ? '#10b981' : 'linear-gradient(135deg, #ff7043, #ff5722)',
              padding: '9px 18px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: '800',
              cursor: claimedCode ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {claimedCode ? (
              <>
                <Check size={14} /> Đã Nhận: {claimedCode}
              </>
            ) : (
              <>
                <Sparkles size={14} /> Lấy Mã Ngay
              </>
            )}
          </button>
        </div>

        {/* Product Cards Grid */}
        <div style={{
          padding: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px'
        }}>
          {state.products.map((p: any) => (
            <div
              key={p.id}
              style={{
                background: '#f8fafc',
                border: '1.5px solid #fed7aa',
                borderRadius: '18px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.15s, box-shadow 0.15s',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div>
                <div style={{
                  display: 'inline-block',
                  fontSize: '11px',
                  fontWeight: '800',
                  color: '#ea580c',
                  background: '#fff1ee',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  marginBottom: '10px'
                }}>
                  {p.tag}
                </div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px', lineHeight: '1.3', color: '#1e293b' }}>
                  {p.name}
                </h4>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#f59e0b', marginBottom: '6px', fontWeight: '700' }}>
                  <Star size={13} fill="#f59e0b" color="#f59e0b" />
                  <span>{p.rating}</span>
                </div>
                <div style={{ fontSize: '17px', fontWeight: '800', color: '#e11d48' }}>
                  {p.price}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
