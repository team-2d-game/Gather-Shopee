import React, { useState, useRef, useEffect } from 'react';
import { PlayerSkin, Direction } from '../types';
import { Sparkles, ArrowRight, User, Dices, RotateCw, Check } from 'lucide-react';

interface CharacterSetupProps {
  onComplete: (name: string, skin: PlayerSkin, status?: string) => void;
}

const RANDOM_NAMES = [
  'Tung_Shopee', 'Alex_Pro', 'Minh_Cyber', 'Linh_Designer', 
  'Hai_Gamer', 'Phuong_Tech', 'Nam_Dev', 'Trang_Chill',
  'Duc_KiemThu', 'Mai_Marketing', 'Bao_Captain', 'Hoa_Shopee'
];

const STATUS_PRESETS = [
  '🚀 Đang làm việc',
  '☕ Đang nghỉ ngơi',
  '🎮 Tìm bạn chơi cờ',
  '🛍️ Săn sale Shopee'
];

export const CharacterSetup: React.FC<CharacterSetupProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [outfitColor, setOutfitColor] = useState('#ee4d2d'); // Shopee Orange
  const [hairColor, setHairColor] = useState('#4f46e5');
  const [skinColor, setSkinColor] = useState('#fcd34d');
  const [hairStyle, setHairStyle] = useState<'short' | 'wavy' | 'cap'>('short');
  const [status, setStatus] = useState(STATUS_PRESETS[0]);
  const [previewDir, setPreviewDir] = useState<Direction>('down');
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const outfitOptions = [
    { label: 'Cam Shopee', color: '#ee4d2d' },
    { label: 'Xanh Biển', color: '#3b82f6' },
    { label: 'Xanh Mint', color: '#10b981' },
    { label: 'Tím Cyber', color: '#8b5cf6' },
    { label: 'Hồng Phấn', color: '#ec4899' },
    { label: 'Vàng Nắng', color: '#f59e0b' },
    { label: 'Cyan Neon', color: '#06b6d4' }
  ];

  const hairOptions = [
    { label: 'Đen Huyền', color: '#1e293b' },
    { label: 'Xanh Indigo', color: '#4f46e5' },
    { label: 'Tím Khói', color: '#9333ea' },
    { label: 'Đỏ Ruby', color: '#e11d48' },
    { label: 'Nâu Hạt Dẻ', color: '#b45309' },
    { label: 'Xanh Rêu', color: '#059669' },
    { label: 'Bạch Kim', color: '#ffffff' }
  ];

  const skinOptions = [
    { label: 'Trắng Sáng', color: '#fef08a' },
    { label: 'Tự Nhiên', color: '#fcd34d' },
    { label: 'Răm Nắng', color: '#fbbf24' },
    { label: 'Bánh Mật', color: '#d97706' }
  ];

  const rollRandomName = () => {
    const random = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    setName(random);
  };

  // Live Canvas Rendering with Chibi Avatar
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const renderPreview = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2 + 10;
      const bounce = Math.sin(time / 200) * 2;
      const legSwing = Math.sin(time / 160) * 3;

      // 1. Pedestal Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 28, 28, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Shoes
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 10, cy + 18 + legSwing, 8, 6);
      ctx.fillRect(cx + 2, cy + 18 - legSwing, 8, 6);

      // 3. Torso (Jacket with Collar)
      ctx.fillStyle = outfitColor;
      ctx.beginPath();
      ctx.roundRect(cx - 15, cy - 6 + bounce, 30, 24, 6);
      ctx.fill();

      // Inner white collar
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 5, cy - 6 + bounce, 10, 6);

      // Arms swinging
      ctx.fillStyle = outfitColor;
      ctx.beginPath();
      ctx.roundRect(cx - 19, cy - 3 + bounce + legSwing, 5, 14, 3);
      ctx.roundRect(cx + 14, cy - 3 + bounce - legSwing, 5, 14, 3);
      ctx.fill();

      // 4. Head
      ctx.fillStyle = skinColor;
      ctx.beginPath();
      ctx.arc(cx, cy - 20 + bounce, 15, 0, Math.PI * 2);
      ctx.fill();

      // 5. Hair Back / Base
      ctx.fillStyle = hairColor;
      if (hairStyle === 'cap') {
        // Baseball cap
        ctx.beginPath();
        ctx.arc(cx, cy - 24 + bounce, 16, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = outfitColor;
        ctx.fillRect(cx - 16, cy - 26 + bounce, 32, 8);
        if (previewDir === 'down') {
          ctx.fillRect(cx - 12, cy - 18 + bounce, 24, 4);
        }
      } else if (hairStyle === 'wavy') {
        // Wavy fluffy hair
        ctx.beginPath();
        ctx.arc(cx, cy - 24 + bounce, 18, Math.PI * 0.85, Math.PI * 2.15);
        ctx.fill();
      } else {
        // Short neat hair
        ctx.beginPath();
        ctx.arc(cx, cy - 24 + bounce, 16, Math.PI * 0.9, Math.PI * 2.1);
        ctx.fill();
      }

      // Hair Top Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.beginPath();
      ctx.arc(cx, cy - 28 + bounce, 11, Math.PI * 1.1, Math.PI * 1.9);
      ctx.fill();

      // 6. Facial Features
      const headY = cy - 20 + bounce;

      if (previewDir === 'down') {
        // Anime Eyes with Specular twinkle
        // Left Eye
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(cx - 6, headY - 1, 3.5, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx - 7.5, headY - 2.5, 1.6, 0, Math.PI * 2);
        ctx.fill();

        // Right Eye
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(cx + 6, headY - 1, 3.5, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx + 4.5, headY - 2.5, 1.6, 0, Math.PI * 2);
        ctx.fill();

        // Soft Blush Cheeks
        ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
        ctx.beginPath();
        ctx.arc(cx - 10, headY + 4, 3, 0, Math.PI * 2);
        ctx.arc(cx + 10, headY + 4, 3, 0, Math.PI * 2);
        ctx.fill();

        // Smile
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(cx, headY + 3.5, 3, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // Front Hair Bangs
        ctx.fillStyle = hairColor;
        ctx.beginPath();
        ctx.moveTo(cx - 12, headY - 10);
        ctx.lineTo(cx - 3, headY - 3);
        ctx.lineTo(cx + 4, headY - 10);
        ctx.lineTo(cx + 11, headY - 5);
        ctx.lineTo(cx + 13, headY - 12);
        ctx.fill();
      } else if (previewDir === 'up') {
        // Back of head
        ctx.fillStyle = hairColor;
        ctx.beginPath();
        ctx.arc(cx, headY, 15, 0, Math.PI * 2);
        ctx.fill();
      } else if (previewDir === 'left') {
        // Profile Left
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(cx - 8, headY - 1, 3, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx - 9.2, headY - 2.5, 1.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
        ctx.beginPath();
        ctx.arc(cx - 5, headY + 4, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = hairColor;
        ctx.beginPath();
        ctx.arc(cx + 3, headY - 4, 14, 0, Math.PI * 2);
        ctx.fill();
      } else if (previewDir === 'right') {
        // Profile Right
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(cx + 8, headY - 1, 3, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx + 6.8, headY - 2.5, 1.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
        ctx.beginPath();
        ctx.arc(cx + 5, headY + 4, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = hairColor;
        ctx.beginPath();
        ctx.arc(cx - 3, headY - 4, 14, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(renderPreview);
    };

    animId = requestAnimationFrame(renderPreview);
    return () => cancelAnimationFrame(animId);
  }, [outfitColor, hairColor, skinColor, hairStyle, previewDir]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || `User_${Math.floor(1000 + Math.random() * 9000)}`;
    const skin: PlayerSkin = {
      avatarId: 'avatar-custom',
      hairStyle,
      hairColor,
      bodyColor: skinColor,
      outfitColor
    };
    onComplete(finalName, skin, status);
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
      backdropFilter: 'blur(20px)',
      padding: '16px'
    }}>
      <div style={{
        background: '#ffffff',
        border: '2px solid rgba(255, 112, 67, 0.22)',
        borderRadius: '28px',
        padding: '24px 28px',
        width: '100%',
        maxWidth: '820px',
        boxShadow: '0 20px 60px rgba(255, 112, 67, 0.16), 0 4px 20px rgba(0, 0, 0, 0.05)',
        color: '#1e293b',
        overflow: 'hidden'
      }}>
        {/* Title Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          borderBottom: '1.5px solid #ffedd5',
          paddingBottom: '12px'
        }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px', color: '#1e293b' }}>
              Tạo Nhân Vật Của Bạn ✨
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
              Tùy chỉnh diện mạo chibi đáng yêu để bước vào không gian ảo Gather Shopee
            </p>
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#fff1ee',
            border: '1px solid #ffccba',
            color: '#ff5722',
            padding: '5px 14px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: '800',
            letterSpacing: '0.5px',
            boxShadow: '0 2px 6px rgba(255, 87, 34, 0.1)'
          }}>
            <Sparkles size={13} /> GATHER SHOPEE 2026
          </div>
        </div>

        {/* 2-Column Main Form Grid */}
        <form onSubmit={handleSubmit} style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: '24px',
          alignItems: 'start'
        }}>
          {/* Left Column: Live Preview Box & Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Live Preview Card */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'radial-gradient(circle, #fff7ed 0%, #fef2f2 100%)',
              border: '2px dashed #fed7aa',
              borderRadius: '20px',
              padding: '14px 10px 12px 10px',
              boxShadow: 'inset 0 2px 8px rgba(255, 112, 67, 0.05)'
            }}>
              <canvas ref={previewCanvasRef} width={140} height={120} />

              {/* Direction Switcher Buttons */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                {[
                  { dir: 'left', label: '← Trái' },
                  { dir: 'down', label: '↓ Trước' },
                  { dir: 'right', label: 'Phải →' },
                  { dir: 'up', label: '↑ Sau' }
                ].map(({ dir, label }) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => setPreviewDir(dir as Direction)}
                    style={{
                      padding: '5px 9px',
                      borderRadius: '999px',
                      border: previewDir === dir ? '2px solid #ff7043' : '1px solid #e2e8f0',
                      background: previewDir === dir ? '#fff1ee' : '#ffffff',
                      color: previewDir === dir ? '#ff5722' : '#64748b',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      boxShadow: previewDir === dir ? '0 2px 6px rgba(255, 87, 34, 0.2)' : 'none'
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Initial Status Tag */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                Trạng thái ban đầu
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {STATUS_PRESETS.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    style={{
                      padding: '7px 8px',
                      borderRadius: '10px',
                      border: status === st ? '2px solid #38bdf8' : '1px solid #e2e8f0',
                      background: status === st ? '#e0f2fe' : '#f8fafc',
                      color: status === st ? '#0284c7' : '#475569',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      transition: 'all 0.15s',
                      boxShadow: status === st ? '0 2px 6px rgba(56, 189, 248, 0.15)' : 'none'
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Name Input, Hair Style, Colors & Submit */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Name Input with Randomizer */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: '800', color: '#334155' }}>
                  Tên hiển thị trong không gian
                </label>
                <button
                  type="button"
                  onClick={rollRandomName}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ff5722',
                    fontSize: '11px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <Dices size={13} /> Đổi tên ngẫu nhiên
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Ví dụ: Tung_Shopee, Alex..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={20}
                  style={{
                    width: '100%',
                    background: '#f8fafc',
                    border: '1.5px solid #fed7aa',
                    borderRadius: '12px',
                    padding: '9px 12px 9px 36px',
                    color: '#0f172a',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#ff7043';
                    e.target.style.boxShadow = '0 0 0 3px rgba(255, 112, 67, 0.12)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#fed7aa';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Hair Style Options */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                Kiểu tóc / Phụ kiện
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                {[
                  { id: 'short', label: '✂️ Tóc Ngắn' },
                  { id: 'wavy', label: '✨ Bồng Bềnh' },
                  { id: 'cap', label: '🧢 Nón Lưỡi Trai' }
                ].map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setHairStyle(style.id as any)}
                    style={{
                      padding: '7px 8px',
                      borderRadius: '10px',
                      border: hairStyle === style.id ? '2px solid #ff7043' : '1px solid #e2e8f0',
                      background: hairStyle === style.id ? '#fff1ee' : '#f8fafc',
                      color: hairStyle === style.id ? '#ff5722' : '#475569',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      boxShadow: hairStyle === style.id ? '0 2px 6px rgba(255, 87, 34, 0.15)' : 'none'
                    }}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Palette Panel: Outfit, Hair, Skin */}
            <div style={{
              background: '#f8fafc',
              border: '1.5px solid #fed7aa',
              borderRadius: '16px',
              padding: '10px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {/* Outfit Color Palette */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#475569', minWidth: '76px' }}>
                  Trang phục:
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {outfitOptions.map((opt) => (
                    <button
                      key={opt.color}
                      type="button"
                      title={opt.label}
                      onClick={() => setOutfitColor(opt.color)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        backgroundColor: opt.color,
                        border: outfitColor === opt.color ? '2.5px solid #1e293b' : '2px solid #ffffff',
                        cursor: 'pointer',
                        transform: outfitColor === opt.color ? 'scale(1.15)' : 'scale(1)',
                        transition: 'all 0.15s',
                        boxShadow: outfitColor === opt.color ? `0 2px 8px ${opt.color}88` : '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Hair Color Palette */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#475569', minWidth: '76px' }}>
                  Màu tóc:
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {hairOptions.map((opt) => (
                    <button
                      key={opt.color}
                      type="button"
                      title={opt.label}
                      onClick={() => setHairColor(opt.color)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        backgroundColor: opt.color,
                        border: hairColor === opt.color ? '2.5px solid #1e293b' : '2px solid #ffffff',
                        cursor: 'pointer',
                        transform: hairColor === opt.color ? 'scale(1.15)' : 'scale(1)',
                        transition: 'all 0.15s',
                        boxShadow: hairColor === opt.color ? `0 2px 8px ${opt.color}88` : '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Skin Tone Palette */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#475569', minWidth: '76px' }}>
                  Tông da:
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {skinOptions.map((opt) => (
                    <button
                      key={opt.color}
                      type="button"
                      title={opt.label}
                      onClick={() => setSkinColor(opt.color)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        backgroundColor: opt.color,
                        border: skinColor === opt.color ? '2.5px solid #1e293b' : '2px solid #ffffff',
                        cursor: 'pointer',
                        transform: skinColor === opt.color ? 'scale(1.15)' : 'scale(1)',
                        transition: 'all 0.15s',
                        boxShadow: skinColor === opt.color ? '0 2px 8px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.08)'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Join Space Submit Button */}
            <button
              type="submit"
              className="kawaii-btn"
              style={{
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '13px 20px',
                fontSize: '15px',
                fontWeight: '800',
                width: '100%'
              }}
            >
              Tham Gia Không Gian Ảo <ArrowRight size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
