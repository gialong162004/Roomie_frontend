import React, { useState } from "react";
import { 
  FaRulerCombined, 
  FaMapMarkerAlt, 
  FaPhoneAlt, 
  FaUserAlt, 
  FaCommentAlt, 
  FaMap, 
  FaExclamationTriangle 
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../../store/chatStore";
import { PostAPI } from "../../api/api";
import Toast from "../common/Toast"; // 👈 Thêm import Toast

interface RoomDetailProps {
  postId?: string;
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
  postId,
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
  
  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedReason, setSelectedReason] = useState(""); 
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // 🍞 State quản lý Toast giống page Login của bạn
  const [toast, setToast] = useState<{ message: string; subtitle: string; type: "success" | "error" | "info" } | null>(null);

  const navigate = useNavigate();
  const openChat = useChatStore(state => state.openChat);

  const showToast = (message: string, subtitle: string, type: "success" | "error" | "info") => {
    setToast({ message, subtitle, type });
  };

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

  const handleStartChat = () => {
    if (!posterId) {
      showToast("Không tìm thấy thông tin", "Không thể bắt đầu cuộc trò chuyện với người đăng", "error");
      return;
    }
    
    const postLinkData = JSON.stringify({
      isPostLink: true,
      postId: postId || "",
      title: type,
      price: price,
      address: address,
      image: images[0] || "",
    });
    
    openChat(posterId, posterName, postLinkData);
    onClose();
  };

  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postId) {
      showToast("Lỗi hệ thống", "Không tìm thấy ID bài đăng để báo cáo!", "error");
      return;
    }
    if (!selectedReason) {
      showToast("Thiếu thông tin", "Vui lòng chọn một lý do báo cáo!", "info");
      return;
    }

    try {
      setIsSubmittingReport(true);
      
      const response = await PostAPI.reportPost(postId, selectedReason);
      
      if (response.status === 200 || response.status === 201 || response.data) {
        showToast("Báo cáo thành công!", "Cảm ơn bạn! Báo cáo vi phạm đã được gửi tới ban quản trị.", "success");
        setSelectedReason("");
        setTimeout(() => {
          setShowReportForm(false);
        }, 1500);
      }
    } catch (error: any) {
      console.error("❌ Lỗi gửi báo cáo lên hệ thống:", error);
      const errorMessage = error.response?.data?.message || "Gửi báo cáo thất bại. Vui lòng thử lại sau!";
      showToast(errorMessage, "Hệ thống ghi nhận lỗi", "error");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Giữ nguyên chuỗi gốc ban đầu của bạn
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/50 flex justify-center items-start overflow-y-auto p-0 md:p-8"
      onClick={onClose}
    >
      <div
        className="bg-white md:rounded-2xl shadow-lg max-w-3xl w-full relative min-h-screen md:min-h-[auto] container-room-detail"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng Modal (X) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 text-textGray font-bold text-2xl hover:text-primary bg-white/80 w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
        >
          ×
        </button>

        {/* Nút Báo cáo bài đăng (!) */}
        {postId && (
          <button
            onClick={() => setShowReportForm(!showReportForm)}
            title="Báo cáo bài đăng này"
            className="absolute top-4 right-16 z-50 text-red-500 hover:text-red-700 bg-white/80 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-transform hover:scale-110"
          >
            <FaExclamationTriangle size={14} />
          </button>
        )}

        {/* Khu vực hiển thị Slide Ảnh */}
        <div className="relative">
          <img src={images[currentImageIndex]} alt={type} className="w-full h-64 sm:h-80 md:h-96 object-cover md:rounded-t-2xl" />
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

        {/* Nội dung thông tin chi tiết phòng */}
        <div className="p-6 flex flex-col gap-4">
          
          {/* ✅ Khôi phục chuẩn 100% danh sách option cố định ban đầu */}
          {showReportForm && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-fadeIn transition-all">
              <h4 className="text-sm font-semibold text-red-700 flex items-center gap-2 mb-2">
                <FaExclamationTriangle /> Báo cáo bài đăng vi phạm
              </h4>
              <form onSubmit={handleSendReport} className="flex flex-col gap-2">
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-gray-300 text-gray-700 focus:outline-none focus:border-red-500 bg-white"
                >
                  <option value="">Lí do báo cáo...</option>
                  <option value="Spam">Spam</option>
                  <option value="Lừa đảo">Lừa đảo</option>
                  <option value="Nội dung không phù hợp">Nội dung không phù hợp</option>
                  <option value="Tin giả">Tin giả</option>
                </select>

                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReportForm(false);
                      setSelectedReason("");
                    }}
                    className="px-3 py-1 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-100 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReport || !selectedReason}
                    className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingReport ? "Đang gửi..." : "Gửi báo cáo"}
                  </button>
                </div>
              </form>
            </div>
          )}

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
          <p className="text-textGray whitespace-pre-wrap">{description}</p>

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

          {/* Nút liên hệ & nhắn tin */}
          <div className="mt-4 flex flex-row items-center justify-between gap-4 border-t pt-4 sticky bottom-0 bg-white z-10 md:static md:border-t-0 md:pt-0">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <FaPhoneAlt /> 
              <span>{phone}</span>
            </div>
            <button 
              onClick={handleStartChat}
              disabled={!posterId}
              className="flex-1 max-w-[120px] md:flex-none md:max-w-none flex items-center justify-center gap-2 bg-primary text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-primaryDark transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <FaCommentAlt /> Nhắn tin
            </button>
          </div>
        </div>
      </div>

      {/* 🍞 Hiển thị Toast động ở cuối component */}
      {toast && (
        <Toast
          message={toast.message}
          subtitle={toast.subtitle}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default RoomDetail;