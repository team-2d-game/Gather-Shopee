import React, { useState, useRef, useEffect } from 'react';
import { socketClient } from '../../network/socketClient';
import { soundManager } from '../../engine/AudioSynth';
import confetti from 'canvas-confetti';
import { X, Sparkles, Award } from 'lucide-react';

interface LuckyWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LuckyWheelModal: React.FC<LuckyWheelModalProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<{ prize: string; voucherCode: string; icon: string } | null>(null);
  const rotationAngleRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  const prizes = [
    { label: '50.000đ', color: '#ef4444' },
    { label: 'Giảm 20%', color: '#f59e0b' },
    { label: 'Freeship', color: '#10b981' },
    { label: '1000 Xu', color: '#3b82f6' },
    { label: 'Jackpot', color: '#ec4899' },
    { label: '30.000đ', color: '#8b5cf6' }
  ];

  // Draw wheel on canvas
  const drawWheel = (angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = canvas.width / 2 - 12;
    const numSlices = prizes.length;
    const arc = (Math.PI * 2) / numSlices;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    // Draw slices
    for (let i = 0; i < numSlices; i++) {
      const sliceAngle = i * arc;
      ctx.fillStyle = prizes[i].color;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, sliceAngle, sliceAngle + arc);
      ctx.fill();

      // Border line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.rotate(sliceAngle + arc / 2);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px Inter';
      ctx.textAlign = 'right';
      ctx.fillText(prizes[i].label, radius - 16, 5);
      ctx.restore();
    }

    ctx.restore();

    // Center Hub
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎁', cx, cy);

    // Pointer Top Arrow
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(cx, 4);
    ctx.lineTo(cx - 12, 24);
    ctx.lineTo(cx + 12, 24);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  useEffect(() => {
    if (!isOpen) return;
    drawWheel(rotationAngleRef.current);

    const unsubResult = socketClient.on('LUCKY_WHEEL_RESULT', (payload) => {
      // Complete spin animation
      setTimeout(() => {
        setIsSpinning(false);
        setResult(payload);
        soundManager.playWin();

        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      }, 3000);
    });

    return () => {
      unsubResult();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen]);

  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setResult(null);

    // Request spin from server
    socketClient.spinLuckyWheel();

    // Fast rotation animation for 3 seconds
    const startTime = performance.now();
    const duration = 3000;
    const initialSpeed = 25;

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentSpeed = initialSpeed * (1 - ease);

      rotationAngleRef.current += currentSpeed * 0.05;
      drawWheel(rotationAngleRef.current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

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
        maxWidth: '460px',
        boxShadow: '0 20px 60px rgba(255, 112, 67, 0.16), 0 4px 20px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '28px 24px',
        position: 'relative',
        color: '#1e293b'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: '#f1f5f9',
            border: 'none',
            color: '#64748b',
            borderRadius: '50%',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
        >
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#d97706',
            background: '#fef3c7',
            padding: '5px 14px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            <Sparkles size={14} /> SHOPEE LUCKY WHEEL
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginTop: '6px', color: '#1e293b' }}>
            Vòng Quay May Mắn ✨
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Quay mỗi ngày để nhận ngẫu nhiên Voucher và Xu Shopee!
          </p>
        </div>

        {/* Canvas Wheel */}
        <div style={{
          position: 'relative',
          margin: '8px 0',
          padding: '10px',
          background: 'radial-gradient(circle, #fff7ed 0%, #fef2f2 100%)',
          borderRadius: '50%',
          boxShadow: '0 8px 24px rgba(255, 112, 67, 0.12)'
        }}>
          <canvas ref={canvasRef} width={280} height={280} />
        </div>

        {/* Spin Button */}
        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className="kawaii-btn"
          style={{
            padding: '14px 40px',
            fontSize: '16px',
            fontWeight: '800',
            cursor: isSpinning ? 'default' : 'pointer',
            opacity: isSpinning ? 0.7 : 1,
            marginTop: '14px'
          }}
        >
          {isSpinning ? 'Đang quay...' : 'QUAY NGAY 🎰'}
        </button>

        {/* Result Card */}
        {result && (
          <div style={{
            marginTop: '18px',
            width: '100%',
            background: '#ecfdf5',
            border: '2px dashed #34d399',
            borderRadius: '18px',
            padding: '16px',
            textAlign: 'center',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.15)'
          }}>
            <div style={{ fontSize: '28px' }}>{result.icon}</div>
            <div style={{ fontWeight: '800', fontSize: '18px', color: '#059669', marginTop: '4px' }}>
              {result.prize}
            </div>
            <div style={{ fontSize: '13px', color: '#334155', marginTop: '4px' }}>
              Mã đổi thưởng: <strong style={{ color: '#d97706', fontSize: '14px' }}>{result.voucherCode}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
