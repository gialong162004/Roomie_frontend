import React, { useState, useEffect } from 'react';
import { MessageAPI } from '../../api/api';
import { ChatHeader } from './ChatHeader';
import { ContactList, type Contact } from './ContactList';
import { MessageList, type Message } from './MessageList';
import { MessageInput } from './MessageInput';
import { ChatToggleButton } from './ChatToggleButton';
import { useSocket } from '../../hooks/useSocket';

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showContactList, setShowContactList] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversationsMap, setConversationsMap] = useState<Record<string, Message[]>>({});
  const [messages, setMessages] = useState<Message[]>([]);

  // Helper functions
  const getCurrentUserId = (): string => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user._id || user.id || '';
      }
    } catch (error) {
      console.error('❌ Error parsing user from localStorage:', error);
    }
    return '';
  };

  const currentUserId = getCurrentUserId();

  // Socket handlers
  const handleMessageHistory = (conversationId: string, messagesData: Message[]) => {
    
    const formattedMessages = messagesData.map((msg: any) => {
      const senderId = msg.sender?._id || msg.sender?.id || msg.senderId;
      return {
        ...msg,
        sender: (senderId === currentUserId ? 'user' : 'landlord') as 'user' | 'landlord',
        senderId: senderId,
      };
    });
    
    setConversationsMap(prev => ({
      ...prev,
      [conversationId]: formattedMessages
    }));
    
    if (selectedContact?.id === conversationId) {
      setMessages(formattedMessages);
    }
  };

  const handleNewMessage = (newMessage: any) => {
    
    const senderId = newMessage.sender?._id || newMessage.sender?.id || newMessage.senderId;
    const conversationId = newMessage.conversation || newMessage.conversationId;
    
    if (!conversationId) {
      console.error('❌ No conversationId found in message:', newMessage);
      return;
    }
    
    const formattedMessage: Message = {
      id: newMessage._id || newMessage.id,
      text: newMessage.text || newMessage.content,
      sender: (senderId === currentUserId ? 'user' : 'landlord') as 'user' | 'landlord',
      timestamp: new Date(newMessage.createdAt || newMessage.timestamp || Date.now()),
      senderId: senderId,
      conversationId: conversationId,
      isEdited: newMessage.isEdited || false,
      isRecalled: newMessage.isRecalled || false,
      seenBy: newMessage.seenBy || [],
    };
    
    // CẬP NHẬT: Chỉ loại bỏ tin nhắn tạm của chính mình
    setConversationsMap(prev => {
      const existingMessages = prev[conversationId] || [];
      
      // Kiểm tra xem tin nhắn này đã tồn tại chưa (dựa trên ID thật)
      const messageExists = existingMessages.some(msg => msg.id === formattedMessage.id);
      
      if (messageExists) {
        return prev;
      }
      
      // Nếu là tin nhắn của mình (user), loại bỏ tin nhắn tạm
      const filteredMessages = senderId === currentUserId
        ? existingMessages.filter(msg => !msg.id.startsWith('temp_'))
        : existingMessages;
      
      return {
        ...prev,
        [conversationId]: [...filteredMessages, formattedMessage]
      };
    });

    if (selectedContact?.id === conversationId) {
      setMessages(prev => {
        // Kiểm tra xem tin nhắn này đã tồn tại chưa
        const messageExists = prev.some(msg => msg.id === formattedMessage.id);
        
        if (messageExists) {
          return prev;
        }
        
        // Nếu là tin nhắn của mình, loại bỏ tin nhắn tạm
        const filteredMessages = senderId === currentUserId
          ? prev.filter(msg => !msg.id.startsWith('temp_'))
          : prev;
        
        return [...filteredMessages, formattedMessage];
      });
    }
    
    setContacts(prev => prev.map(c => 
      c.id === conversationId 
        ? { 
            ...c, 
            lastMessage: formattedMessage.text, 
            unreadCount: c.id !== selectedContact?.id ? (c.unreadCount || 0) + 1 : 0
          }
        : c
    ));
  };

  const handleMessageEdited = (conversationId: string, messageId: string, newText: string) => {
    
    setConversationsMap(prev => ({
      ...prev,
      [conversationId]: prev[conversationId]?.map(msg =>
        msg.id === messageId ? { ...msg, text: newText, isEdited: true } : msg
      ) || []
    }));

    if (selectedContact?.id === conversationId) {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, text: newText, isEdited: true } : msg
        )
      );
    }
    
    setContacts(prev => prev.map(c => {
      if (c.id === conversationId) {
        const msgs = conversationsMap[conversationId] || [];
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg?.id === messageId) {
          return { ...c, lastMessage: newText };
        }
      }
      return c;
    }));
  };

  const handleMessageRecalled = (conversationId: string, messageId: string) => {
    
    const recalledText = 'Tin nhắn đã được thu hồi';
    
    setConversationsMap(prev => ({
      ...prev,
      [conversationId]: prev[conversationId]?.map(msg =>
        msg.id === messageId ? { ...msg, isRecalled: true, text: recalledText } : msg
      ) || []
    }));

    if (selectedContact?.id === conversationId) {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, isRecalled: true, text: recalledText } : msg
        )
      );
    }
    
    setContacts(prev => prev.map(c => {
      if (c.id === conversationId) {
        const msgs = conversationsMap[conversationId] || [];
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg?.id === messageId) {
          return { ...c, lastMessage: recalledText };
        }
      }
      return c;
    }));
  };

  const handleMessageRead = (conversationId: string, messageId: string, seenBy: string[]) => {
    
    setConversationsMap(prev => ({
      ...prev,
      [conversationId]: prev[conversationId]?.map(msg =>
        msg.id === messageId ? { ...msg, seenBy } : msg
      ) || []
    }));

    if (selectedContact?.id === conversationId) {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, seenBy } : msg
        )
      );
    }
  };

  const socketRef = useSocket({
    currentUserId,
    selectedContactId: selectedContact?.id || null,
    onMessageHistory: handleMessageHistory,
    onNewMessage: handleNewMessage,
    onMessageEdited: handleMessageEdited,
    onMessageRecalled: handleMessageRecalled,
    onMessageRead: handleMessageRead,
  });

  // Event listener for opening chat from other components
  useEffect(() => {
    const handleOpenChat = async (event: any) => {
      const { userId, userName } = event.detail;
      
      setIsOpen(true);
      
      const existingContact = contacts.find(c => c.id === userId);
      
      if (existingContact) {
        handleSelectContact(existingContact);
      } else {
        try {
          const response = await MessageAPI.createConversation(userId);
          const newConversation = response as any;
          
          const otherMember = newConversation.members?.find((m: any) => m._id !== currentUserId);
          
          const newContact: Contact = {
            id: newConversation._id,
            name: otherMember?.name || userName || 'Người dùng',
            avatar: otherMember?.avatar,
            propertyName: 'Tin nhắn',
            lastMessage: '',
            unreadCount: 0,
            online: false,
          };
          
          setContacts(prev => [newContact, ...prev]);
          setSelectedContact(newContact);
          setShowContactList(false);
          setMessages([]);
          
          await loadMessagesForContact(newContact.id);
        } catch (error) {
          console.error('❌ Error creating conversation:', error);
        }
      }
    };

    window.addEventListener('openChat', handleOpenChat);
    return () => window.removeEventListener('openChat', handleOpenChat);
  }, [contacts]);

  // API functions
  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await MessageAPI.getConversation();
      
      let conversationsList = Array.isArray(response) ? response : response.data || [];
      
      const conversationsData: Contact[] = conversationsList.map((conv: any) => {
        const otherMember = conv.members?.find((m: any) => m._id !== currentUserId);
        const lastMsg = conv.lastMessage?.text || conv.lastMessage || '';
        
        return {
          id: conv._id,
          name: otherMember?.name || 'Người dùng',
          avatar: otherMember?.avatar,
          propertyName: 'Tin nhắn',
          lastMessage: lastMsg,
          unreadCount: conv.unreadCount || 0,
          online: false,
        };
      });
      
      setContacts(conversationsData);
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessagesByAPI = async (conversationId: string) => {
    try {
      const response = await MessageAPI.getMessages(conversationId);
      let messagesList = Array.isArray(response) ? response : response.data || [];
      
      // Lấy trạng thái hiện tại của các tin nhắn đã được edit/recall
      const currentMessages = conversationsMap[conversationId] || [];
      const editedRecalledMap = new Map();
      currentMessages.forEach(msg => {
        if (msg.isEdited || msg.isRecalled) {
          editedRecalledMap.set(msg.id, {
            isEdited: msg.isEdited,
            isRecalled: msg.isRecalled,
            text: msg.text
          });
        }
      });
      
      const messagesData: Message[] = messagesList.map((msg: any) => {
        const senderId = msg.sender?._id || msg.sender?.id || msg.senderId;
        const msgId = msg._id || msg.id;
        
        // Kiểm tra xem tin nhắn này có trong cache không
        const cachedState = editedRecalledMap.get(msgId);
        
        return {
          id: msgId,
          text: cachedState?.text || msg.text || msg.content,
          sender: (senderId === currentUserId ? 'user' : 'landlord') as 'user' | 'landlord',
          timestamp: new Date(msg.createdAt || msg.timestamp),
          senderId: senderId,
          conversationId: conversationId,
          isEdited: cachedState?.isEdited || msg.isEdited || false,
          isRecalled: cachedState?.isRecalled || msg.isRecalled || false,
          seenBy: msg.seenBy || [],
        };
      });
      
      setConversationsMap(prev => ({
        ...prev,
        [conversationId]: messagesData,
      }));
      
      setMessages(messagesData);
      
      if (messagesData.length > 0) {
        const lastMsg = messagesData[messagesData.length - 1];
        setContacts(prev => prev.map(c => 
          c.id === conversationId ? { ...c, lastMessage: lastMsg.text } : c
        ));
      }
    } catch (error) {
      console.error('❌ Error fetching messages by API:', error);
    }
  };

  const loadMessagesForContact = async (conversationId: string) => {
    const existingMessages = conversationsMap[conversationId] || [];
    setMessages(existingMessages);

    if (socketRef.current) {
      socketRef.current.emit('getMessageHistory', { conversationId });
    }
    
    await fetchMessagesByAPI(conversationId);
  };

  const handleSelectContact = async (contact: Contact) => {
    
    setSelectedContact(contact);
    setShowContactList(false);
    
    await loadMessagesForContact(contact.id);
    
    if (socketRef.current) {
      socketRef.current.emit('joinConversation', contact.id);
    } else {
      console.error('❌ Socket not connected');
    }
    
    setContacts(prev => prev.map(c => 
      c.id === contact.id ? { ...c, unreadCount: 0 } : c
    ));
  };

  const handleBackToContacts = () => {
    setShowContactList(true);
    setSelectedContact(null);
    
    if (socketRef.current && selectedContact) {
      socketRef.current.emit('leaveConversation', selectedContact.id);
    }
  };

  const handleSendMessage = () => {
    if (inputValue.trim() === '' || !selectedContact || !socketRef.current) {
      console.warn('⚠️ Cannot send message:', { 
        hasInput: inputValue.trim() !== '', 
        hasContact: !!selectedContact, 
        hasSocket: !!socketRef.current 
      });
      return;
    }

    // THAY ĐỔI: Sử dụng prefix "temp_" để dễ nhận biết tin nhắn tạm
    const tempId = `temp_${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
      conversationId: selectedContact.id,
      senderId: currentUserId,
    };

    setMessages(prev => [...prev, tempMessage]);
    setConversationsMap(prev => ({
      ...prev,
      [selectedContact.id]: [...(prev[selectedContact.id] || []), tempMessage]
    }));
    
    setContacts(prev => prev.map(c => 
      c.id === selectedContact.id ? { ...c, lastMessage: inputValue } : c
    ));
    
    const textToSend = inputValue;
    setInputValue('');

    try {
      const messageData = {
        conversationId: selectedContact.id,
        senderId: currentUserId,
        text: textToSend,
        images: [],
        files: [],
      };
      
      socketRef.current.emit('sendMessage', messageData);
    } catch (error) {
      console.error('❌ Error sending message:', error);
      // Xóa tin nhắn tạm nếu gửi thất bại
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInputValue(textToSend);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await MessageAPI.deleteConversation(conversationId);
      setContacts(prev => prev.filter(c => c.id !== conversationId));
      
      if (selectedContact?.id === conversationId) {
        handleBackToContacts();
      }
    } catch (error) {
      console.error('❌ Error deleting conversation:', error);
      alert('Không thể xóa cuộc trò chuyện. Vui lòng thử lại.');
    }
  };

  const handleEditMessage = (messageId: string, newText: string) => {
    if (!selectedContact || !socketRef.current) {
      console.warn('⚠️ Cannot edit message: no contact or socket');
      return;
    }

    // Emit socket event với đúng format mà backend yêu cầu
    socketRef.current.emit('editMessage', {
      messageId: messageId,
      userId: currentUserId,
      text: newText,
      conversationId: selectedContact.id,
    });

    // Cập nhật local state ngay lập tức để UX mượt hơn
    handleMessageEdited(selectedContact.id, messageId, newText);
  };

  const handleRecallMessage = (messageId: string) => {
    if (!selectedContact || !socketRef.current) {
      console.warn('⚠️ Cannot recall message: no contact or socket');
      return;
    }

    // Emit socket event với đúng format mà backend yêu cầu
    socketRef.current.emit('recallMessage', {
      messageId: messageId,
      userId: currentUserId,
      conversationId: selectedContact.id,
    });

    // Cập nhật local state ngay lập tức để UX mượt hơn
    handleMessageRecalled(selectedContact.id, messageId);
  };

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  const totalUnreadCount = contacts.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="mb-4 w-[380px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
          <ChatHeader
            showContactList={showContactList}
            selectedContact={selectedContact}
            contactsCount={contacts.length}
            onBack={handleBackToContacts}
            onClose={() => setIsOpen(false)}
          />

          {showContactList ? (
            <ContactList
              contacts={contacts}
              loading={loading}
              onSelectContact={handleSelectContact}
              onDeleteContact={handleDeleteConversation}
            />
          ) : (
            <>
              <MessageList 
                messages={messages}
                onEditMessage={handleEditMessage}
                onRecallMessage={handleRecallMessage}
              />
              <MessageInput
                value={inputValue}
                onChange={setInputValue}
                onSend={handleSendMessage}
              />
            </>
          )}
        </div>
      )}

      <ChatToggleButton
        isOpen={isOpen}
        unreadCount={totalUnreadCount}
        onClick={() => setIsOpen(!isOpen)}
      />
    </div>
  );
};

export default ChatWidget;