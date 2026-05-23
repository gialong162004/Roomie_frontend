import React, { useState, useEffect } from 'react';
import { MessageAPI } from '../../api/api';
import { ChatHeader } from './ChatHeader';
import { ContactList, type Contact } from './ContactList';
import { MessageList, type Message } from './MessageList';
import { MessageInput } from './MessageInput';
import { ChatToggleButton } from './ChatToggleButton';
import { useSocket } from '../../hooks/useSocket';
import { useChatStore } from '../../store/chatStore';
import RoomDetail from '../rooms/RoomDetail';
import { PostAPI } from '../../api/api';

const ChatWidget: React.FC = () => {
  const { 
    isOpen, 
    setIsOpen, 
    selectedUserId, 
    selectedUserName, 
    initialMessage, 
    clearInitialMessage 
  } = useChatStore();

  const [showContactList, setShowContactList] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversationsMap, setConversationsMap] = useState<Record<string, Message[]>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingPostLink, setPendingPostLink] = useState<string | null>(null);
  
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);

  // Helper functions
  const handlePostClick = async (postId: string) => {
    try {
      const res = await PostAPI.getPostDetail(postId);
      setSelectedRoom(res);
    } catch (err) {
      console.error("Error fetching post detail", err);
    }
  };

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

  // Thay thế hàm handleNewMessage hiện tại bằng version này:

  const handleNewMessage = (newMessage: any) => {
    console.log('📨 Received new message:', newMessage);
    
    const senderId = newMessage.sender?._id || newMessage.sender?.id || newMessage.senderId;
    const conversationId = newMessage.conversation || newMessage.conversationId;
    
    if (!conversationId) {
      console.error('❌ No conversationId found in message:', newMessage);
      return;
    }
    
    const formattedMessage: Message = {
      id: newMessage._id || newMessage.id,
      text: newMessage.text || newMessage.content || '',
      sender: (senderId === currentUserId ? 'user' : 'landlord') as 'user' | 'landlord',
      timestamp: new Date(newMessage.createdAt || newMessage.timestamp || Date.now()),
      senderId: senderId,
      conversationId: conversationId,
      isEdited: newMessage.isEdited || false,
      isRecalled: newMessage.isRecalled || false,
      seenBy: newMessage.seenBy || [],
      images: newMessage.images || [], // ✅ Đảm bảo lấy images từ server
    };
    
    console.log('📸 Formatted message images:', formattedMessage.images);
    
    // CẬP NHẬT: Logic xử lý tin nhắn tạm và thật
    setConversationsMap(prev => {
      const existingMessages = prev[conversationId] || [];
      
      // Kiểm tra xem tin nhắn này đã tồn tại chưa (dựa trên ID thật)
      const messageExists = existingMessages.some(msg => msg.id === formattedMessage.id);
      
      if (messageExists) {
        console.log('⚠️ Message already exists, skipping:', formattedMessage.id);
        return prev;
      }
      
      // ✅ FIX: Nếu là tin nhắn của mình, tìm và thay thế tin nhắn tạm
      // thay vì xóa tất cả tin nhắn tạm
      let updatedMessages = [...existingMessages];
      
      if (senderId === currentUserId) {
        // Tìm tin nhắn tạm gần nhất (theo timestamp)
        const tempMessageIndex = updatedMessages.findIndex(msg => 
          msg.id.startsWith('temp_') && 
          msg.sender === 'user' &&
          // So sánh nội dung để tìm đúng tin nhắn tạm
          (msg.text === formattedMessage.text || 
          (msg.images && msg.images.length > 0 && formattedMessage.images && formattedMessage.images.length > 0))
        );
        
        if (tempMessageIndex !== -1) {
          console.log('🔄 Replacing temp message at index:', tempMessageIndex);
          // Thay thế tin nhắn tạm bằng tin nhắn thật
          updatedMessages[tempMessageIndex] = formattedMessage;
        } else {
          console.log('➕ No temp message found, adding new message');
          // Không tìm thấy tin nhắn tạm, thêm mới
          updatedMessages.push(formattedMessage);
        }
      } else {
        // Tin nhắn từ người khác, thêm trực tiếp
        updatedMessages.push(formattedMessage);
      }
      
      return {
        ...prev,
        [conversationId]: updatedMessages
      };
    });

    // Cập nhật messages nếu đang xem conversation này
    if (selectedContact?.id === conversationId) {
      setMessages(prev => {
        const messageExists = prev.some(msg => msg.id === formattedMessage.id);
        
        if (messageExists) {
          console.log('⚠️ Message already exists in current view, skipping');
          return prev;
        }
        
        let updatedMessages = [...prev];
        
        if (senderId === currentUserId) {
          const tempMessageIndex = updatedMessages.findIndex(msg => 
            msg.id.startsWith('temp_') && 
            msg.sender === 'user' &&
            (msg.text === formattedMessage.text || 
            (msg.images && msg.images.length > 0 && formattedMessage.images && formattedMessage.images.length > 0))
          );
          
          if (tempMessageIndex !== -1) {
            updatedMessages[tempMessageIndex] = formattedMessage;
          } else {
            updatedMessages.push(formattedMessage);
          }
        } else {
          updatedMessages.push(formattedMessage);
        }
        
        return updatedMessages;
      });
    }
    
    // Cập nhật lastMessage trong contact list
    const displayText = formattedMessage.text || 
      (formattedMessage.images && formattedMessage.images.length > 0 
        ? `📷 ${formattedMessage.images.length} ảnh` 
        : '');
    
    setContacts(prev => prev.map(c => 
      c.id === conversationId 
        ? { 
            ...c, 
            lastMessage: displayText, 
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

  // Handle open chat from Zustand store
  useEffect(() => {
    const handleStoreOpenChat = async () => {
      if (!selectedUserId) return;
      
      let targetConversationId = null;

      const existingContact = contacts.find(c => c.id === selectedUserId);
      
      if (existingContact) {
        handleSelectContact(existingContact);
        targetConversationId = existingContact.id;
      } else {
        try {
          const response = await MessageAPI.createConversation(selectedUserId);
          const newConversation = response as any;
          
          const otherMember = newConversation.members?.find((m: any) => m._id !== currentUserId);
          
          const newContact: Contact = {
            id: newConversation._id,
            name: otherMember?.name || selectedUserName || 'Người dùng',
            avatar: otherMember?.avatar,
            propertyName: 'Tin nhắn',
            lastMessage: '',
            unreadCount: 0,
            online: false,
          };
          
          targetConversationId = newContact.id;

          setContacts(prev => {
            if (prev.find(c => c.id === newContact.id)) return prev;
            return [newContact, ...prev];
          });
          setSelectedContact(newContact);
          setShowContactList(false);
          setMessages([]);
          
          await loadMessagesForContact(newContact.id);
        } catch (error) {
          console.error('❌ Error creating conversation:', error);
        }
      }
      
      if (initialMessage && targetConversationId) {
        // Prepare as pending message instead of auto-sending
        if (initialMessage.startsWith('{"isPostLink"')) {
          setPendingPostLink(initialMessage);
        } else {
          setInputValue(initialMessage);
        }

        clearInitialMessage();
      }
    };

    handleStoreOpenChat();
  }, [selectedUserId, selectedUserName, initialMessage]);

  // Handle open chat via custom event (fallback/legacy)
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
        
        // FIX: Chuyển lastMessage thành string
        let lastMsg = '';
        if (conv.lastMessage) {
          if (typeof conv.lastMessage === 'string') {
            lastMsg = conv.lastMessage;
          } else if (typeof conv.lastMessage === 'object') {
            lastMsg = conv.lastMessage.text || conv.lastMessage.content || '';
          }
        }
        
        return {
          id: conv._id,
          name: otherMember?.name || 'Người dùng',
          avatar: otherMember?.avatar,
          propertyName: 'Tin nhắn',
          lastMessage: lastMsg, // ✅ Đảm bảo là string
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
          images: msg.images || [],
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

  // Hàm convert ảnh sang base64
  const convertImagesToBase64 = async (images: File[]): Promise<string[]> => {
    const promises = images.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });
    
    return Promise.all(promises);
  };

  // Cập nhật handleSendMessage
  const handleSendMessage = async (images?: File[]) => {
    if ((inputValue.trim() === '' && (!images || images.length === 0) && !pendingPostLink) || !selectedContact || !socketRef.current) {
      return;
    }
  
    // Gửi card bài viết trước nếu có
    if (pendingPostLink) {
      const tempPostId = `temp_post_${Date.now()}`;
      const postMessage: Message = {
        id: tempPostId,
        text: pendingPostLink,
        sender: 'user',
        timestamp: new Date(),
        conversationId: selectedContact.id,
        senderId: currentUserId,
        images: [],
      };
    
      setMessages(prev => [...prev, postMessage]);
      setConversationsMap(prev => ({
        ...prev,
        [selectedContact.id]: [...(prev[selectedContact.id] || []), postMessage]
      }));
      
      try {
        socketRef.current.emit('sendMessage', {
          conversationId: selectedContact.id,
          senderId: currentUserId,
          text: pendingPostLink,
          images: [],
          files: [],
        });
      } catch (error) {
        console.error('❌ Error sending post link:', error);
      }
      
      setPendingPostLink(null);
    }

    // Nếu không có nội dung text hay ảnh thì dừng lại (chỉ gửi card)
    if (inputValue.trim() === '' && (!images || images.length === 0)) {
      return;
    }

    // Convert ảnh sang base64 trước
    let imageData: string[] = [];
    if (images && images.length > 0) {
      try {
        imageData = await convertImagesToBase64(images);
        console.log('📤 Sending images:', imageData.length);
      } catch (error) {
        console.error('❌ Error converting images:', error);
        alert('Không thể xử lý ảnh. Vui lòng thử lại!');
        return;
      }
    }
  
    const tempId = `temp_${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      text: inputValue || '',
      sender: 'user',
      timestamp: new Date(),
      conversationId: selectedContact.id,
      senderId: currentUserId,
      images: imageData,
    };
  
    setMessages(prev => [...prev, tempMessage]);
    setConversationsMap(prev => ({
      ...prev,
      [selectedContact.id]: [...(prev[selectedContact.id] || []), tempMessage]
    }));
    
    setContacts(prev => prev.map(c => 
      c.id === selectedContact.id 
        ? { ...c, lastMessage: inputValue || `📷 ${imageData.length} ảnh` } 
        : c
    ));
    
    const textToSend = inputValue;
    setInputValue('');
  
    try {
      socketRef.current.emit('sendMessage', {
        conversationId: selectedContact.id,
        senderId: currentUserId,
        text: textToSend,
        images: imageData, // Base64 strings
        files: [],
      });
    } catch (error) {
      console.error('❌ Error sending message:', error);
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
    <div className="fixed sm:bottom-6 sm:right-6 bottom-4 right-4 z-[9999] flex flex-col items-end">
      {isOpen && (
        // Mobile: full width (-2rem space), height responsive, PC: width 380px fixed
        <div className="mb-4 w-[calc(100vw-32px)] sm:w-[380px] h-[calc(100vh-140px)] sm:h-auto max-h-[600px] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
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
                onPostClick={handlePostClick}
              />
                
              {/* Phần preview Box Post chuẩn bị được gửi */}
              {pendingPostLink && (() => {
                let pendingPost = null;
                try {
                  pendingPost = JSON.parse(pendingPostLink);
                } catch(e) {}
                  
                if (!pendingPost?.isPostLink) return null;

                return (
                  <div className="relative p-2 bg-gray-50 flex justify-center border-t border-gray-100">
                    <button 
                      onClick={() => setPendingPostLink(null)}
                      className="absolute right-6 top-3 text-gray-400 hover:text-gray-700 bg-white rounded-full p-0.5 shadow-sm border border-gray-200 z-10 hover:bg-gray-100 transition-colors"
                      title="Hủy đính kèm"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="flex items-center gap-2 bg-white p-1.5 w-[240px] rounded-lg shadow-sm border border-teal-100 transition-opacity hover:opacity-100 cursor-default">
                      {pendingPost.image && (
                        <img 
                          src={pendingPost.image} 
                          alt="post thumbnail" 
                          className="w-11 h-11 object-cover rounded flex-shrink-0 border border-slate-100"
                        />
                      )}
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="text-gray-700 text-[11px] font-semibold truncate leading-tight">
                          {pendingPost.title}
                        </div>
                        <div className="text-teal-600 font-bold text-[10px] mt-0.5">
                          {pendingPost.price} VNĐ
                        </div>
                        <div className="text-gray-400 text-[9px] truncate mt-0.5" title={pendingPost.address}>
                          {pendingPost.address}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

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

      {/* Render the post modal when clicking on a post link in chat */}
      {selectedRoom && (
        <RoomDetail
          postId={selectedRoom._id}
          images={selectedRoom.images?.length > 0 
            ? selectedRoom.images 
            : ["https://visaho.vn/upload_images/images/2022/04/01/phan-loai-can-ho-chung-cu-7.jpg"]
          }
          type={selectedRoom.title}
          area={selectedRoom.superficies ? `${selectedRoom.superficies} m²` : "-- m²"}
          address={`${selectedRoom.address}, ${selectedRoom.district}, ${selectedRoom.city}`}
          price={selectedRoom.price.toLocaleString()}
          badge={selectedRoom.category?.name || "Đã duyệt"}
          description={selectedRoom.description}
          posterName={selectedRoom.userId?.name || selectedRoom.owner?.name}
          posterId={selectedRoom.userId?._id || selectedRoom.owner?._id}
          phone={selectedRoom.userId?.phone || selectedRoom.owner?.phone || "Hiển thị để liên hệ"}
          onClose={() => setSelectedRoom(null)}
        />
      )}
    </div>
  );
};

export default ChatWidget;
