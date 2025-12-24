import React from 'react';
import { type Contact } from './ContactList';

interface ContactItemProps {
  contact: Contact;
  onSelect: (contact: Contact) => void;
  onDelete: (id: string) => void;
}

export const ContactItem: React.FC<ContactItemProps> = ({ contact, onSelect, onDelete }) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Bạn có chắc muốn xóa cuộc trò chuyện này?')) {
      onDelete(contact.id);
    }
  };

  return (
    <div className="relative group">
      <button
        onClick={() => onSelect(contact)}
        className="w-full p-4 hover:bg-white transition-colors border-b border-gray-200 text-left flex items-start gap-3"
      >
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center overflow-hidden">
            {contact.avatar ? (
              <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-semibold">
                {contact.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          {contact.online && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h4 className="font-semibold text-gray-800 text-sm truncate">{contact.name}</h4>
            {contact.unreadCount! > 0 && (
              <span className="bg-yellow-400 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2">
                {contact.unreadCount}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 truncate mb-1">{contact.propertyName}</p>
          {contact.lastMessage && (
            <p className="text-xs text-gray-600 truncate">{contact.lastMessage}</p>
          )}
        </div>
      </button>
      
      <button
        onClick={handleDelete}
        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
};