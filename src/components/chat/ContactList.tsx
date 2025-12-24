import React from 'react';
import { ContactItem } from './ContactItem';

export interface Contact {
  id: string;
  name: string;
  avatar?: string;
  propertyName: string;
  lastMessage?: string;
  unreadCount?: number;
  online?: boolean;
}

interface ContactListProps {
  contacts: Contact[];
  loading: boolean;
  onSelectContact: (contact: Contact) => void;
  onDeleteContact: (id: string) => void;
}

export const ContactList: React.FC<ContactListProps> = ({
  contacts,
  loading,
  onSelectContact,
  onDeleteContact,
}) => {
  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center bg-gray-50 text-gray-500">
        <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p className="text-sm">Chưa có tin nhắn nào</p>
      </div>
    );
  }

  return (
    <div className="h-[400px] overflow-y-auto bg-gray-50">
      {contacts.map((contact) => (
        <ContactItem
          key={contact.id}
          contact={contact}
          onSelect={onSelectContact}
          onDelete={onDeleteContact}
        />
      ))}
    </div>
  );
};