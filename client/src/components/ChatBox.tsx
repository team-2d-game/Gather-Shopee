import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Player, MapZone } from '../types';
import { Send, MessageSquare, Compass, Shield } from 'lucide-react';

interface ChatBoxProps {
  messages: ChatMessage[];
  localPlayer: Player | null;
  activeZone: MapZone | null;
  onSendMessage: (text: string, channel: 'global' | 'proximity' | 'zone') => void;
  onFocusChange: (focused: boolean) => void;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  localPlayer,
  activeZone,
  onSendMessage,
  onFocusChange
}) => {
  const [activeTab, setActiveTab] = useState<'global' | 'proximity' | 'zone'>('global');
  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  const filteredMessages = messages.filter((m) => {
    if (activeTab === 'global') return true;
    if (activeTab === 'proximity') return m.channel === 'proximity';
    if (activeTab === 'zone') return m.channel === 'zone';
    return true;
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    onSendMessage(text, activeTab);
    setInputText('');
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: '16px',
      left: '16px',
      zIndex: 20,
      width: '350px',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '2px solid rgba(255, 255, 255, 0.9)',
      borderRadius: '24px',
      boxShadow: '0 14px 40px rgba(255, 112, 67, 0.15)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      transition: 'height 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
      height: isMinimized ? '48px' : '320px'
    }}>
      {/* Chat Header & Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        borderBottom: isMinimized ? 'none' : '1px solid #f1f5f9',
        background: '#fff7ed'
      }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('global')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 10px',
              borderRadius: '999px',
              border: 'none',
              background: activeTab === 'global' ? '#ff7043' : 'transparent',
              color: activeTab === 'global' ? '#ffffff' : '#64748b',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <Compass size={12} /> Toàn Bộ
          </button>

          <button
            onClick={() => setActiveTab('proximity')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 10px',
              borderRadius: '999px',
              border: 'none',
              background: activeTab === 'proximity' ? '#06b6d4' : 'transparent',
              color: activeTab === 'proximity' ? '#ffffff' : '#64748b',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <MessageSquare size={12} /> Gần Đây
          </button>

          {activeZone && (
            <button
              onClick={() => setActiveTab('zone')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                borderRadius: '999px',
                border: 'none',
                background: activeTab === 'zone' ? '#a855f7' : 'transparent',
                color: activeTab === 'zone' ? '#ffffff' : '#64748b',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <Shield size={12} /> Phòng
            </button>
          )}
        </div>

        <button
          onClick={() => setIsMinimized(!isMinimized)}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '12px',
            cursor: 'pointer',
            padding: '2px 6px'
          }}
        >
          {isMinimized ? '▲' : '▼'}
        </button>
      </div>

      {/* Messages Feed */}
      {!isMinimized && (
        <>
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {filteredMessages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', marginTop: 'auto', marginBottom: 'auto' }}>
                Chưa có tin nhắn nào. Hãy gửi lời chào nhé! 👋✨
              </div>
            ) : (
              filteredMessages.map((m) => {
                const isSelf = localPlayer && m.senderId === localPlayer.id;
                return (
                  <div key={m.id} style={{
                    fontSize: '12.5px',
                    lineHeight: '1.4',
                    wordBreak: 'break-word'
                  }}>
                    <span style={{
                      fontWeight: '800',
                      color: isSelf ? '#ff5722' : '#0284c7',
                      marginRight: '6px'
                    }}>
                      {m.senderName}:
                    </span>
                    <span style={{ color: '#1e293b' }}>{m.text}</span>
                    {m.channel !== 'global' && (
                      <span style={{
                        fontSize: '9px',
                        fontWeight: '700',
                        marginLeft: '6px',
                        padding: '1px 6px',
                        borderRadius: '6px',
                        backgroundColor: m.channel === 'proximity' ? '#cffafe' : '#f3e8ff',
                        color: m.channel === 'proximity' ? '#0891b2' : '#9333ea'
                      }}>
                        {m.channel === 'proximity' ? 'Gần' : 'Phòng'}
                      </span>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSend} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            borderTop: '1px solid #f1f5f9',
            background: '#fafafa'
          }}>
            <input
              type="text"
              placeholder={activeTab === 'proximity' ? 'Chat người ở gần...' : 'Gõ tin nhắn...'}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onFocus={() => onFocusChange(true)}
              onBlur={() => onFocusChange(false)}
              maxLength={200}
              style={{
                flex: 1,
                background: '#ffffff',
                border: '1.5px solid #fed7aa',
                borderRadius: '12px',
                padding: '9px 14px',
                color: '#1e293b',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #ff7043, #ff5722)',
                border: 'none',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(255, 87, 34, 0.35)'
              }}
            >
              <Send size={14} />
            </button>
          </form>
        </>
      )}
    </div>
  );
};
