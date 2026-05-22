import React from 'react';

interface ChatToggleButtonProps {
  isOpen: boolean;
  unreadCount: number;
  onClick: () => void;
  isBot?: boolean; // Thêm prop này để phân biệt nút của Bot và Người
}

export const ChatToggleButton: React.FC<ChatToggleButtonProps> = ({
  isOpen,
  unreadCount,
  onClick,
  isBot = false, // Mặc định là false (chat người thật)
}) => {
  return (
    <button
      onClick={onClick}
      className={`relative bg-gradient-to-r text-white w-16 h-16 rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-110 flex items-center justify-center ${
        isBot 
          ? 'from-cyan-600 to-blue-500' // Màu xanh công nghệ (AI) cho Bot phân biệt với màu Teal của bạn
          : 'from-teal-600 to-teal-500' // Giữ nguyên màu Teal gốc cho chủ trọ
      }`}
    >
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-yellow-400 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-semibold">
          {unreadCount}
        </span>
      )}
      {isOpen ? (
        // Icon dấu X khi mở (bằng khít kích thước w-7 h-7)
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : isBot ? (
        // Icon Robot AI (Kích thước chuẩn khít w-7 h-7)
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 3h6M12 3v2M4 9h16M4 9a2 2 0 00-2 2v5a2 2 0 002 2h16a2 2 0 002-2v-5a2 2 0 00-2-2M4 9V7a2 2 0 012-2h12a2 2 0 012 2v2M10 13h.01M14 13h.01" 
          />
        </svg>
      ) : (
        // Icon Tin nhắn gốc của bạn (w-7 h-7)
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      )}
    </button>
  );
};