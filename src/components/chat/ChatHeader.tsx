import React from 'react';

interface ChatHeaderProps {
  showContactList: boolean;
  selectedContact: {
    name: string;
    propertyName: string;
  } | null;
  contactsCount: number;
  onBack: () => void;
  onClose: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  showContactList,
  selectedContact,
  contactsCount,
  onBack,
  onClose,
}) => {
  return (
    <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {!showContactList && selectedContact && (
          <button
            onClick={onBack}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
          {showContactList ? (
            <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          ) : (
            <span className="text-teal-600 font-semibold text-sm">
              {selectedContact?.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-base truncate">
            {showContactList ? 'Tin nhắn' : selectedContact?.name}
          </h3>
          <p className="text-teal-100 text-xs truncate">
            {showContactList ? `${contactsCount} liên hệ` : selectedContact?.propertyName}
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};