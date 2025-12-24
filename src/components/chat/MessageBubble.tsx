import React, { useState, useRef, useEffect } from 'react';
import { type Message } from './MessageList';

interface MessageBubbleProps {
  message: Message;
  onEdit?: (messageId: string, newText: string) => void;
  onRecall?: (messageId: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  onEdit, 
  onRecall 
}) => {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isOwnMessage = message.sender === 'user';

  // Đóng menu khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleEditSubmit = () => {
    if (editText.trim() !== '' && editText !== message.text) {
      onEdit?.(message.id, editText.trim());
    }
    setEditing(false);
  };

  if (message.isRecalled) {
    return (
      <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-[75%] px-4 py-3 rounded-2xl bg-gray-200 text-gray-500 italic text-sm">
          Tin nhắn đã được thu hồi
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} group`}>
      <div className="flex items-center gap-2 max-w-[75%]">
        {isOwnMessage && !editing && (
          <div className="relative flex items-center" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded-full"
            >
              <svg
                className="w-4 h-4 text-gray-600"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <circle cx="8" cy="2" r="1.5" />
                <circle cx="8" cy="8" r="1.5" />
                <circle cx="8" cy="14" r="1.5" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute bottom-full mb-1 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[100px] z-10">
                <button
                  onClick={() => {
                    setEditing(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                >
                  Sửa
                </button>
                <button
                  onClick={() => {
                    onRecall?.(message.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                >
                  Thu hồi
                </button>
              </div>
            )}
          </div>
        )}

        <div
          className={`rounded-2xl px-4 py-3 ${
            message.sender === 'user'
              ? 'bg-teal-600 text-white rounded-br-sm'
              : 'bg-white text-gray-800 shadow-sm rounded-bl-sm border border-gray-200'
          }`}
        >
          {editing ? (
            <div className="space-y-2">
              <input
                className="text-sm py-1 px-2 rounded border border-gray-300 text-gray-700 w-full focus:outline-none focus:border-teal-500"
                type="text"
                value={editText}
                autoFocus
                maxLength={500}
                onChange={e => setEditText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleEditSubmit();
                  if (e.key === 'Escape') setEditing(false);
                }}
              />
              <div className="flex gap-2 justify-end">
                <button 
                  onClick={handleEditSubmit} 
                  className="text-xs bg-teal-500 text-white px-3 py-1 rounded hover:bg-teal-700"
                >
                  Lưu
                </button>
                <button 
                  onClick={() => setEditing(false)} 
                  className="text-xs border px-3 py-1 rounded hover:bg-gray-200"
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm leading-relaxed">{message.text}</p>
              <div className="flex items-center justify-between mt-1">
                <p
                  className={`text-xs ${
                    message.sender === 'user' ? 'text-teal-100' : 'text-gray-600'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {message.isEdited && ' (đã chỉnh sửa)'}
                </p>
                {message.sender === 'user' && message.seenBy && message.seenBy.length > 0 && (
                  <span className="text-xs text-teal-100">✓✓</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};