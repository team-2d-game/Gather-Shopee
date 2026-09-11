import React, { useState, useEffect } from 'react';
import { CaroGameState } from '../../types';
import { socketClient } from '../../network/socketClient';
import { soundManager } from '../../engine/AudioSynth';
import confetti from 'canvas-confetti';
import { X, Swords, RefreshCw, UserCheck } from 'lucide-react';

interface CaroModalProps {
  isOpen: boolean;
  onClose: () => void;
  selfId: string;
  selfName: string;
  initialState: CaroGameState;
}

export const CaroModal: React.FC<CaroModalProps> = ({
  isOpen,
  onClose,
  selfId,
  selfName,
  initialState
}) => {
  const [gameState, setGameState] = useState<CaroGameState>(initialState);

  useEffect(() => {
    if (!isOpen) return;
    const unsub = socketClient.on('CARO_SYNC', (newState: CaroGameState) => {
      setGameState(newState);
      if (newState.winner && newState.winner !== 'draw') {
        soundManager.playWin();
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.5 } });
      }
    });

    return () => {
      unsub();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isPlayerX = gameState.playerX?.id === selfId;
  const isPlayerO = gameState.playerO?.id === selfId;
  const isMyTurn = (gameState.currentTurn === 'X' && isPlayerX) || (gameState.currentTurn === 'O' && isPlayerO);

  const handleCellClick = (row: number, col: number) => {
    if (!isMyTurn || gameState.winner || gameState.board[row][col] !== null) return;
    soundManager.playStep();
    socketClient.sendCaroAction('move', { row, col });
  };

  const handleJoin = (role: 'X' | 'O') => {
    socketClient.sendCaroAction('join', { role });
  };

  const handleLeave = () => {
    socketClient.sendCaroAction('leave');
  };

  const handleReset = () => {
    socketClient.sendCaroAction('reset');
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
        border: '2px solid #e0e7ff',
        borderRadius: '28px',
        width: '95%',
        maxWidth: '680px',
        boxShadow: '0 20px 60px rgba(99, 102, 241, 0.15), 0 4px 20px rgba(0, 0, 0, 0.05)',
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
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              background: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Swords size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>Bàn Đấu Cờ Caro Gomoku (15x15) ⚔️</h3>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Xếp 5 quân liền nhau theo hàng ngang, dọc hoặc chéo để chiến thắng</p>
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

        {/* Players Status & Seats */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 22px',
          background: '#f1f5f9',
          borderBottom: '1px solid #e2e8f0'
        }}>
          {/* Player X */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: '900', color: '#ef4444' }}>X</span>
            {gameState.playerX ? (
              <div style={{ fontSize: '13px', color: '#1e293b' }}>
                <strong>{gameState.playerX.name}</strong> {isPlayerX && '(Bạn)'}
              </div>
            ) : (
              <button
                onClick={() => handleJoin('X')}
                style={{
                  background: '#fee2e2',
                  border: '1.5px solid #f87171',
                  color: '#dc2626',
                  padding: '5px 12px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                Ngồi ghế X
              </button>
            )}
          </div>

          {/* Turn Indicator */}
          <div style={{
            fontSize: '13px',
            fontWeight: '800',
            color: gameState.winner
              ? '#059669'
              : gameState.currentTurn === 'X'
              ? '#dc2626'
              : '#2563eb'
          }}>
            {gameState.winner ? (
              gameState.winner === 'draw' ? (
                'Trận đấu Hòa!'
              ) : (
                `🎉 Người chơi ${gameState.winner} Thắng Cuộc!`
              )
            ) : (
              `Lượt đi: ${gameState.currentTurn} ${isMyTurn ? '(LƯỢT CỦA BẠN)' : ''}`
            )}
          </div>

          {/* Player O */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {gameState.playerO ? (
              <div style={{ fontSize: '13px', textAlign: 'right', color: '#1e293b' }}>
                <strong>{gameState.playerO.name}</strong> {isPlayerO && '(Bạn)'}
              </div>
            ) : (
              <button
                onClick={() => handleJoin('O')}
                style={{
                  background: '#dbeafe',
                  border: '1.5px solid #60a5fa',
                  color: '#2563eb',
                  padding: '5px 12px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                Ngồi ghế O
              </button>
            )}
            <span style={{ fontSize: '18px', fontWeight: '900', color: '#2563eb' }}>O</span>
          </div>
        </div>

        {/* Board Grid */}
        <div style={{
          padding: '16px',
          display: 'flex',
          justifyContent: 'center',
          background: '#fafaf9',
          overflowX: 'auto'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(15, 28px)',
            gap: '1px',
            background: '#d97706',
            padding: '3px',
            borderRadius: '10px',
            boxShadow: '0 4px 14px rgba(217, 119, 6, 0.25)'
          }}>
            {gameState.board.map((row, r) =>
              row.map((cell, c) => {
                const isWinningCell = gameState.winningLine?.some(([wr, wc]) => wr === r && wc === c);
                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    style={{
                      width: '28px',
                      height: '28px',
                      background: isWinningCell
                        ? '#fde047'
                        : '#fffbeb',
                      border: 'none',
                      color: cell === 'X' ? '#dc2626' : '#2563eb',
                      fontSize: '16px',
                      fontWeight: '900',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: !cell && isMyTurn && !gameState.winner ? 'pointer' : 'default',
                      padding: 0,
                      transition: 'background 0.1s'
                    }}
                  >
                    {cell}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '12px 22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0'
        }}>
          {(isPlayerX || isPlayerO) && (
            <button
              onClick={handleLeave}
              style={{
                background: '#fee2e2',
                border: '1px solid #fca5a5',
                color: '#dc2626',
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Rời Ghế Đấu
            </button>
          )}

          <button
            onClick={handleReset}
            style={{
              marginLeft: 'auto',
              background: '#ede9fe',
              border: '1px solid #c4b5fd',
              color: '#6d28d9',
              padding: '7px 16px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={14} /> Ván Mới
          </button>
        </div>
      </div>
    </div>
  );
};
