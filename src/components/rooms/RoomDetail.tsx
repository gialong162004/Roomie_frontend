import React from "react";
import { FaRulerCombined, FaMapMarkerAlt, FaPhoneAlt, FaUserAlt, FaCommentAlt, FaMap } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface RoomDetailProps {
  images: string[];
  type: string;
  area?: string;
  address: string;
  rooms?: number;
  price: string | number;
  badge?: string;
  description?: string;
  amenities?: string[];
  posterName?: string;
  posterId?: string;
  postedMinutesAgo?: string;
  phone?: string; 
  onClose: () => void;
}

const RoomDetail: React.FC<RoomDetailProps> = ({
  images,
  type,
  area,
  address,
  price,
  badge,
  description = "Phòng đầy đủ tiện nghi, sạch sẽ, an ninh tốt, phù hợp sinh viên hoặc người đi làm.",
  posterName = "Chủ nhà",
  posterId,
  postedMinutesAgo = "30 phút trước",
  phone = "0123 456 789",
  onClose,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [showMap, setShowMap] = React.useState(false);
  const navigate = useNavigate();

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handlePosterClick = () => {
    if (posterId) {
      onClose();
      navigate(`/profile/${posterId}`);
    }
  };

  // ✅ SỬA LẠI: Dùng Custom Event thay vì window function
  const handleStartChat = () => {
    if (!posterId) {
      alert('Không tìm thấy thông tin người đăng');
      return;
    }
    
    console.log('🚀 Dispatching openChat event:', { 
      userId: posterId, 
      userName: posterName 
    });
    
    // Tạo và dispatch custom event
    const event = new CustomEvent('openChat', { 
      detail: { 
        userId: posterId, 
        userName: posterName 
      } 
    });
    window.dispatchEvent(event);
    
    // Đóng modal
    onClose();
    
    // Debug: Kiểm tra sau 100ms
    setTimeout(() => {
      console.log('⏰ Event đã được dispatch. Nếu chat không mở, kiểm tra ChatWidget có được mount không.');
    }, 100);
  };

  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-start overflow-auto z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-3xl w-full relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 text-textGray font-bold text-2xl hover:text-primary"
        >
          ×
        </button>

        <div className="relative">
          <img src={images[currentImageIndex]} alt={type} className="w-full h-96 object-cover rounded-t-2xl" />
          {badge && (
            <div className="absolute top-4 left-4 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
              {badge}
            </div>
          )}
          
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white w-10 h-10 rounded-full hover:bg-black/70 transition-colors"
              >
                ‹
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white w-10 h-10 rounded-full hover:bg-black/70 transition-colors"
              >
                ›
              </button>
              
              <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
                {currentImageIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center text-sm text-textGray">
            <button
              onClick={handlePosterClick}
              disabled={!posterId}
              className={`flex items-center gap-2 ${
                posterId 
                  ? 'hover:text-primary cursor-pointer transition-colors' 
                  : 'cursor-default'
              }`}
            >
              <FaUserAlt className="text-primary" /> 
              <span className={posterId ? 'hover:underline' : ''}>
                {posterName}
              </span>
            </button>
            <div>{postedMinutesAgo}</div>
          </div>

          <h2 className="text-2xl font-semibold">{type}</h2>
          <p className="text-textGray">{description}</p>

          <div className="flex gap-4 text-textGray text-sm flex-wrap">
            {area && <div className="flex items-center gap-1"><FaRulerCombined className="text-primary" />{area}</div>}
            <div className="flex items-center gap-1"><FaMapMarkerAlt className="text-primary" />{address}</div>
          </div>

          <div className="text-primary font-bold text-xl">{price} VNĐ</div>

          <button
            onClick={() => setShowMap(!showMap)}
            className="flex items-center justify-center gap-2 bg-secondary text-primary px-4 py-2 rounded-lg hover:bg-primary hover:text-white transition-colors text-sm w-fit font-medium"
          >
            <FaMap /> {showMap ? "Ẩn bản đồ" : "Xem bản đồ"}
          </button>

          {showMap && (
            <div className="mt-2 rounded-lg overflow-hidden border-2 border-secondary">
              <iframe
                src={mapUrl}
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Vị trí phòng trọ"
              />
            </div>
          )}

          {/* ✅ Nút nhắn tin */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2 text-textGray">
              <FaPhoneAlt className="text-primary" /> {phone}
            </div>
            <button 
              onClick={handleStartChat}
              disabled={!posterId}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primaryDark transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaCommentAlt /> Nhắn tin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetail;