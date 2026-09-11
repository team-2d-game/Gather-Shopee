import React, { useRef, useState, useEffect } from 'react';
import { DrawLine } from '../../types';
import { socketClient } from '../../network/socketClient';
import { X, Trash2, Edit2 } from 'lucide-react';

interface WhiteboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLines: DrawLine[];
  selfId: string;
}

export const WhiteboardModal: React.FC<WhiteboardModalProps> = ({
  isOpen,
  onClose,
  initialLines,
  selfId
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState('#ef4444');
  const [lineWidth, setLineWidth] = useState(3);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const colors = ['#1e293b', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

  // Draw initial lines
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render all lines
    for (const line of initialLines) {
      drawLineOnCanvas(ctx, line);
    }

    // Subscribe to new incoming lines
    const unsubDraw = socketClient.on('WHITEBOARD_DRAW', (payload: { line: DrawLine }) => {
      if (canvasRef.current) {
        const c = canvasRef.current.getContext('2d');
        if (c) drawLineOnCanvas(c, payload.line);
      }
    });

    const unsubClear = socketClient.on('WHITEBOARD_CLEAR', () => {
      if (canvasRef.current) {
        const c = canvasRef.current.getContext('2d');
        if (c) {
          c.fillStyle = '#ffffff';
          c.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    });

    return () => {
      unsubDraw();
      unsubClear();
    };
  }, [isOpen, initialLines]);

  const drawLineOnCanvas = (ctx: CanvasRenderingContext2D, line: DrawLine) => {
    ctx.strokeStyle = line.color;
    ctx.lineWidth = line.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(line.x0, line.y0);
    ctx.lineTo(line.x1, line.y1);
    ctx.stroke();
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    lastPosRef.current = getCanvasCoords(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !lastPosRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentPos = getCanvasCoords(e);
    const line: DrawLine = {
      id: `line-${Date.now()}-${Math.random()}`,
      x0: lastPosRef.current.x,
      y0: lastPosRef.current.y,
      x1: currentPos.x,
      y1: currentPos.y,
      color,
      width: lineWidth,
      authorId: selfId
    };

    drawLineOnCanvas(ctx, line);
    socketClient.sendWhiteboardDraw(line);
    lastPosRef.current = currentPos;
  };

  const handleMouseUp = () => {
    isDrawingRef.current = false;
    lastPosRef.current = null;
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    socketClient.clearWhiteboard();
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
        border: '2px solid #ddd6fe',
        borderRadius: '28px',
        width: '90%',
        maxWidth: '840px',
        boxShadow: '0 20px 60px rgba(139, 92, 246, 0.15), 0 4px 20px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: '#1e293b'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 22px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: '#f3e8ff',
              border: '1.5px solid #d8b4fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9333ea'
            }}>
              <Edit2 size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1e293b' }}>Bảng Trắng Cộng Tác (Live Canvas) 🎨</h3>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Mọi người trong phòng có thể cùng vẽ và brainstorm thời gian thực</p>
            </div>
          </div>

          {/* Color & Tool Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: c,
                    border: color === c ? '3px solid #ff7043' : '2px solid #e2e8f0',
                    cursor: 'pointer',
                    transform: color === c ? 'scale(1.15)' : 'scale(1)',
                    boxShadow: color === c ? '0 2px 8px rgba(0,0,0,0.18)' : 'none',
                    transition: 'all 0.15s'
                  }}
                />
              ))}
            </div>

            {/* Thickness */}
            <select
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              style={{
                background: '#ffffff',
                color: '#1e293b',
                border: '1.5px solid #cbd5e1',
                borderRadius: '10px',
                padding: '5px 10px',
                fontSize: '12px',
                fontWeight: '700',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value={2}>Mảnh (2px)</option>
              <option value={4}>Vừa (4px)</option>
              <option value={8}>Đậm (8px)</option>
            </select>

            <button
              onClick={handleClear}
              title="Xóa bảng"
              style={{
                background: '#fee2e2',
                border: '1px solid #fca5a5',
                color: '#dc2626',
                padding: '6px 12px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
            >
              <Trash2 size={14} /> Xóa bảng
            </button>

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
        </div>

        {/* Canvas Area */}
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', background: '#f8fafc' }}>
          <canvas
            ref={canvasRef}
            width={800}
            height={480}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              borderRadius: '16px',
              border: '2px solid #e2e8f0',
              cursor: 'crosshair',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
            }}
          />
        </div>
      </div>
    </div>
  );
};
