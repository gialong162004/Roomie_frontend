import React, { useState, useRef, useEffect } from 'react';
import { type Message } from './MessageList';

interface MessageBubbleProps {
  message: Message;
  onEdit?: (messageId: string, newText: string) => void;
  onRecall?: (messageId: string) => void;
  onPostClick?: (postId: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  onEdit, 
  onRecall,
  onPostClick
}) => {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isOwnMessage = message.sender === 'user';

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

  let postLinkData = null;
  let textToRender = message.text;
  if (message.text && message.text.startsWith('{"isPostLink"')) {
    try {
      const parsed = JSON.parse(message.text);
      if (parsed.isPostLink) {
        postLinkData = parsed;
        textToRender = "";
      }
    } catch (e) {
      // Ignore parsing error, fallback to normal text
    }
  }

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
    <>
      <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} group`}>
        <div className="flex items-center gap-2 max-w-[75%]">
          {isOwnMessage && !editing && (
            <div className="relative flex items-center" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded-full"
              >
                <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 16 16">
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
                {/* Hiển thị ảnh */}
                {message.images && message.images.length > 0 && (
                  <div className={`mb-2 ${message.images.length === 1 ? '' : 'grid grid-cols-2 gap-2'}`}>
                    {message.images.map((imageData, index) => (
                      <div key={index} className="relative group/image">
                        <img
                          src={imageData} // ✅ Base64 string sẽ hoạt động trực tiếp
                          alt={`Image ${index + 1}`}
                          className="rounded-lg max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                          style={{ maxHeight: '200px', objectFit: 'cover' }}
                          onClick={() => setSelectedImage(imageData)}
                          onError={(e) => {
                            console.error('❌ Image load error');
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999"%3ELỗi tải ảnh%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Hiện thị Post Link Card */}
                {postLinkData && (
                  <div 
                    className="flex items-center gap-2 bg-white/90 p-1.5 rounded-lg w-full max-w-[240px] cursor-pointer hover:bg-gray-50 border border-gray-100 shadow-sm transition-all focus:outline-none"
                    onClick={() => {
                      if (onPostClick && postLinkData.postId) {
                        onPostClick(postLinkData.postId);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    {postLinkData.image && (
                      <img 
                        src={postLinkData.image} 
                        alt="post thumbnail" 
                        className="w-12 h-12 object-cover rounded-md flex-shrink-0 border border-gray-100"
                      />
                    )}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="text-gray-800 text-xs font-semibold truncate leading-tight">
                        {postLinkData.title}
                      </div>
                      <div className="text-teal-600 font-bold text-[11px] mt-0.5">
                        {postLinkData.price} VNĐ
                      </div>
                      <div className="text-gray-500 text-[10px] truncate mt-0.5" title={postLinkData.address}>
                        {postLinkData.address}
                      </div>
                    </div>
                  </div>
                )}

                {/* Hiển thị text nếu có */}
                {textToRender && (
                  <p className="text-sm leading-relaxed">{textToRender}</p>
                )}

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

      {/* Modal xem ảnh full size */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-[90vh] rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white text-gray-800 rounded-full p-2 hover:bg-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};