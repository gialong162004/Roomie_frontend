import React, { useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'landlord';
  timestamp: Date;
  senderId?: string;
  conversationId?: string;
  isEdited?: boolean;
  isRecalled?: boolean;
  seenBy?: string[];
  images?: string[];
}

interface MessageListProps {
  messages: Message[];
  onEditMessage?: (messageId: string, newText: string) => void;
  onRecallMessage?: (messageId: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({ 
  messages,
  onEditMessage,
  onRecallMessage 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="h-[340px] flex items-center justify-center bg-gray-50 text-gray-500">
        <p className="text-sm">Bắt đầu cuộc trò chuyện</p>
      </div>
    );
  }

  return (
    <div className="h-[340px] overflow-y-auto p-4 bg-gray-50 space-y-3">
      {messages.map((message) => (
        <MessageBubble 
          key={message.id} 
          message={message}
          onEdit={onEditMessage}
          onRecall={onRecallMessage}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};