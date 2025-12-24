import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Message } from '../components/chat/MessageList';

interface UseSocketProps {
  currentUserId: string;
  selectedContactId: string | null;
  onMessageHistory: (conversationId: string, messages: Message[]) => void;
  onNewMessage: (message: Message) => void;
  onMessageEdited: (conversationId: string, messageId: string, newText: string) => void;
  onMessageRecalled: (conversationId: string, messageId: string) => void;
  onMessageRead: (conversationId: string, messageId: string, seenBy: string[]) => void;
  onNewNotification?: (notification: any) => void;
  onNotificationUpdated?: (notification: any) => void;
  onNotificationDeleted?: (notificationId: string) => void;
  onNotificationsMarkedAllRead?: () => void;
}

export const useSocket = ({
  currentUserId,
  selectedContactId,
  onMessageHistory,
  onNewMessage,
  onMessageEdited,
  onMessageRecalled,
  onMessageRead,
  onNewNotification,
  onNotificationUpdated,
  onNotificationDeleted,
  onNotificationsMarkedAllRead,
}: UseSocketProps) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io('https://tlcn-roomie-api.onrender.com', {
      transports: ['websocket'],
      autoConnect: true,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ Connected to socket server');
      socket.emit('authenticate', currentUserId);
      socket.emit('join', currentUserId);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from socket server');
    });

    socket.on('messageHistory', (data: { conversationId: string; messages: any[] }) => {
      console.log('📚 Received message history:', data);
      
      const messagesData: Message[] = data.messages.map((msg: any) => {
        // Lấy senderId từ sender object hoặc senderId trực tiếp
        const senderId = msg.sender?._id || msg.sender?.id || msg.senderId;
        
        return {
          id: msg._id || msg.id,
          text: msg.text || msg.content,
          sender: (senderId === currentUserId ? 'user' : 'landlord') as 'user' | 'landlord',
          timestamp: new Date(msg.createdAt || msg.timestamp),
          senderId: senderId,
          conversationId: data.conversationId,
          isEdited: msg.isEdited || false,
          isRecalled: msg.isRecalled || false,
          seenBy: msg.seenBy || [],
        };
      });
      
      onMessageHistory(data.conversationId, messagesData);
    });

    socket.on('newMessage', (message: any) => {
      // Lấy senderId từ sender object
      const senderId = message.sender?._id || message.sender?.id || message.senderId;
      
      // Lấy conversationId - server trả về field "conversation" chứ không phải "conversationId"
      const conversationId = message.conversation || message.conversationId;
      
      const newMessage: Message = {
        id: message._id || message.id || Date.now().toString(),
        text: message.text || message.content,
        sender: (senderId === currentUserId ? 'user' : 'landlord') as 'user' | 'landlord',
        timestamp: new Date(message.createdAt || message.timestamp || Date.now()),
        senderId: senderId,
        conversationId: conversationId,
        isEdited: message.isEdited || false,
        isRecalled: message.isRecalled || false,
        seenBy: message.seenBy || [],
      };
      
      onNewMessage(newMessage);
    });

    socket.on('messageEdited', (editedMessage: any) => {
      console.log('✏️ Message edited:', editedMessage);
      
      const conversationId = editedMessage.conversation || editedMessage.conversationId;
      
      onMessageEdited(
        conversationId,
        editedMessage._id || editedMessage.id,
        editedMessage.text
      );
    });

    socket.on('messageRecalled', (recalledMessage: any) => {
      console.log('🔙 Message recalled:', recalledMessage);
      
      const conversationId = recalledMessage.conversation || recalledMessage.conversationId;
      
      onMessageRecalled(
        conversationId,
        recalledMessage._id || recalledMessage.id
      );
    });

    socket.on('messageRead', (readMessage: any) => {
      console.log('👁️ Message read:', readMessage);
      
      const conversationId = readMessage.conversation || readMessage.conversationId;
      
      onMessageRead(
        conversationId,
        readMessage._id || readMessage.id,
        readMessage.seenBy
      );
    });
    socket.on('newNotification', (notification: any) => {
      console.log('🔔 New notification:', notification);
      onNewNotification?.(notification);
    });
    
    socket.on('notificationUpdated', (notification: any) => {
      onNotificationUpdated?.(notification);
    });
    
    socket.on('notificationDeleted', (notificationId: string) => {
      onNotificationDeleted?.(notificationId);
    });
    
    socket.on('notificationsMarkedAllRead', () => {
      onNotificationsMarkedAllRead?.();
    });    

    return () => {
      socket.off('messageHistory');
      socket.off('newMessage');
      socket.off('messageEdited');
      socket.off('messageRecalled');
      socket.off('messageRead');
      socket.off('newNotification');
      socket.off('notificationUpdated');
      socket.off('notificationDeleted');
      socket.off('notificationsMarkedAllRead');
      socket.disconnect();
    };    
  }, [currentUserId, selectedContactId]);

  return socketRef;
};