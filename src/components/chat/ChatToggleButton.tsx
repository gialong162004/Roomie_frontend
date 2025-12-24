import React from 'react';

interface ChatToggleButtonProps {
  isOpen: boolean;
  unreadCount: number;
  onClick: () => void;
}

export const ChatToggleButton: React.FC<ChatToggleButtonProps> = ({
  isOpen,
  unreadCount,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="relative bg-gradient-to-r from-teal-600 to-teal-500 text-white w-16 h-16 rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-110 flex items-center justify-center"
    >
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-yellow-400 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-semibold">
          {unreadCount}
        </span>
      )}
      {isOpen ? (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
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