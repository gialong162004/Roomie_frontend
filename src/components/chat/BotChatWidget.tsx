import React, { useState, useEffect } from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageList, type Message } from './MessageList';
import { MessageInput } from './MessageInput';
import { ChatToggleButton } from './ChatToggleButton';
import RoomDetail from '../rooms/RoomDetail';
import { PostAPI, MessageAPI } from '../../api/api';

const BotChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'bot_welcome',
          text: 'Xin chào! Tôi là Trợ lý tự động. Tôi có thể giúp gì cho bạn hôm nay?',
          sender: 'landlord',
          timestamp: new Date(),
          senderId: 'bot',
          conversationId: 'chatbot',
          isEdited: false,
          isRecalled: false,
          seenBy: [],
          images: [],
        },
      ]);
    }
  }, []);

  // Xử lý sự kiện click vào Card bài viết phòng trọ trong ô chat
  const handlePostClick = async (postId: string) => {
    console.log("🎯 [CLICKED SUCCESS]: Hàm handlePostClick tại cha ĐÃ ĐƯỢC GỌI! postId truyền lên =", postId);
    try {
      const res = await PostAPI.getPostDetail(postId);
      setSelectedRoom(res);
      console.log("✅ Fetched post detail for postId:", postId, res);
    } catch (err) {
      console.error("❌ Error fetching post detail in bot:", err);
    }
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || isBotTyping) return;

    const userText = inputValue.trim();
    setInputValue('');

    // 1. Thêm tin nhắn của User vào khung chat
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      text: userText,
      sender: 'user',
      timestamp: new Date(),
      senderId: 'current_user',
      conversationId: 'chatbot',
      isEdited: false,
      isRecalled: false,
      seenBy: [],
      images: [],
    };

    setMessages(prev => [...prev, userMessage]);
    setIsBotTyping(true);

    try {
      // 2. Gọi API chatbot từ MessageAPI dùng chung hệ thống
      const response = await MessageAPI.chatBot(userText);
      const data = response as any;

      const newBotMessages: Message[] = [];
      const timestamp = new Date();

      // 3. Thêm tin nhắn text thông thường từ Bot trước (nếu có)
      if (data?.reply) {
        newBotMessages.push({
          id: `bot_txt_${Date.now()}`,
          text: data.reply,
          sender: 'landlord',
          timestamp: timestamp,
          senderId: 'bot',
          conversationId: 'chatbot',
          isEdited: false,
          isRecalled: false,
          seenBy: [],
          images: [],
        });
      }

      // 4. Nếu Bot trả về danh sách bài viết (`posts`), duyệt qua và chuyển đổi thành format JSON Card bài viết
      if (data?.posts && Array.isArray(data.posts)) {
        data.posts.forEach((post: any, index: number) => {
          const postLinkString = JSON.stringify({
            isPostLink: true,
            id: post._id,
            title: post.title,
            price: post.price,
            image: post.images?.[0] || '',
            address: `${post.address || ''}, ${post.district || ''}, ${post.city || ''}`
          });

          newBotMessages.push({
            id: `bot_post_${Date.now()}_${index}`,
            text: postLinkString, // Đẩy thẳng chuỗi JSON này vào trường text
            sender: 'landlord',
            timestamp: new Date(timestamp.getTime() + (index + 1) * 100), // Lệch time một chút để xếp đúng hàng tự
            senderId: 'bot',
            conversationId: 'chatbot',
            isEdited: false,
            isRecalled: false,
            seenBy: [],
            images: [],
          });
        });
      }

      // Cập nhật tất cả tin nhắn mới của Bot vào UI cùng lúc
      if (newBotMessages.length > 0) {
        setMessages(prev => [...prev, ...newBotMessages]);
      }

    } catch (error) {
      console.error('❌ Error fetching Bot response:', error);
      setMessages(prev => [...prev, {
        id: `bot_err_${Date.now()}`,
        text: '⚠️ Không thể kết nối với hệ thống AI. Vui lòng thử lại!',
        sender: 'landlord',
        timestamp: new Date(),
        senderId: 'bot',
        conversationId: 'chatbot',
        isEdited: false,
        isRecalled: false,
        seenBy: [],
        images: [],
      }]);
    } finally {
      setIsBotTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-24 z-50">
      {isOpen && (
        <div className="mb-4 w-[380px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
          <ChatHeader
            showContactList={false}
            selectedContact={{
              name: 'Trợ lý ảo Tìm Phòng',
              propertyName: 'Hỗ trợ tự động 24/7'
            }}
            contactsCount={0}
            onBack={() => {}}
            onClose={() => setIsOpen(false)}
          />

          <div className="flex flex-col h-[400px] overflow-hidden relative">
            <MessageList 
              messages={messages}
              onEditMessage={() => {}}
              onRecallMessage={() => {}}
              onPostClick={handlePostClick}
            />

            {isBotTyping && (
              <div className="absolute bottom-2 left-4 bg-gray-100 text-gray-500 text-xs px-3 py-2 rounded-xl rounded-bl-none shadow-sm animate-pulse flex items-center gap-1">
                <span>Bot đang tìm phòng</span>
                <span className="inline-flex gap-0.5">
                  <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></span>
                </span>
              </div>
            )}
          </div>

          <MessageInput
            value={inputValue}
            onChange={setInputValue}
            onSend={() => handleSendMessage()}
          />
        </div>
      )}

      {/* Nút bấm ChatBot tùy chỉnh giao diện Robot AI */}
      <ChatToggleButton
        isOpen={isOpen}
        unreadCount={0}
        onClick={() => setIsOpen(!isOpen)}
        isBot={true}
      />

      {/* Hiển thị Popup chi tiết phòng trọ khi người dùng bấm vào các Card phòng trọ do Bot gửi */}
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
          posterName={selectedRoom.owner?.name}
          posterId={selectedRoom.owner?._id}
          phone={selectedRoom.owner?.phone || "Hiển thị để liên hệ"}
          onClose={() => setSelectedRoom(null)}
        />
      )}
    </div>
  );
};

export default BotChatWidget;