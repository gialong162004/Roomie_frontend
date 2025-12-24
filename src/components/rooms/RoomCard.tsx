import React, { useState } from "react";
import { FaRulerCombined, FaMapMarkerAlt, FaRegBookmark, FaBookmark } from "react-icons/fa";
import { PostAPI } from "../../api/api";
import { useToast } from "../common/ToastProvider";

interface RoomCardProps {
  _id: string;
  image: string;
  type: string;
  area?: string;
  address: string;
  price: string | number;
  onView?: () => void;
  badge?: string;
  isSaved?: boolean;
}

const RoomCard: React.FC<RoomCardProps> = ({
  _id,
  image,
  type,
  area,
  address,
  price,
  onView,
  badge,
  isSaved: initialSaved = false,
}) => {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isLoading) return; // Tránh click nhiều lần

    setIsLoading(true);
    
    try {
      if (isSaved) {
        // Xóa khỏi danh sách yêu thích
        await PostAPI.removeFavoritePost( _id);
        setIsSaved(false);
        showToast("Thành công!", {
          type: "success",
          subtitle: "Đã xoá khỏi danh sách yêu thích.",
        });
      } else {
        // Thêm vào danh sách yêu thích
        await PostAPI.addFavoritePost(_id);
        setIsSaved(true);
        showToast("Thành công!", {
          type: "success",
          subtitle: "Đã thêm vào danh sách yêu thích.",
        });
      }
    } catch (error: any) {
      console.error("Error toggling favorite:", error);
      
      // Xử lý lỗi cụ thể
      if (error.response?.status === 401) {
        showToast("Phiên đã hết hạn!", {
          type: "error",
          subtitle: "Vui lòng đăng nhập lại!",
        });
      } else {
        showToast("Có lỗi xảy ra!", {
          type: "error",
          subtitle: "Vui lòng thử lại!",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex bg-secondary rounded-2xl shadow-md hover:shadow-lg transition-shadow overflow-hidden w-full max-w-md h-44 mb-4 relative">
      {/* Badge */}
      {badge && (
        <div className="absolute top-2 left-2 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full shadow z-10">
          {badge}
        </div>
      )}

      {/* Ảnh vuông bên trái */}
      <div className="w-36 h-36 flex-shrink-0 overflow-hidden m-3 rounded-lg">
        <img src={image} alt={type} className="w-full h-full object-cover" />
      </div>

      {/* Nội dung bên phải */}
      <div className="flex flex-col justify-between p-2 flex-1">
        {/* Thông tin phòng */}
        <div className="flex flex-col gap-1 text-sm">
          <h3 className="text-base font-semibold text-textDark">{type}</h3>
          <div className="flex items-center gap-1 text-textGray">
            <FaRulerCombined className="text-primary" />
            <span>{area}</span>
          </div>
          <div className="flex items-center gap-1 text-textGray">
            <FaMapMarkerAlt className="text-primary" />
            <span>{address}</span>
          </div>
        </div>

        {/* Giá + nút Xem + Icon Bookmark */}
        <div className="flex justify-between items-center mt-1">
          <div className="text-primary font-bold text-base">{price} VNĐ</div>
          <div className="flex items-center gap-2">
            {/* Icon Bookmark */}
            <button
              onClick={handleSaveClick}
              disabled={isLoading}
              className={`p-1 hover:scale-110 transition-transform ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              aria-label={isSaved ? "Bỏ lưu" : "Lưu"}
            >
              {isSaved ? (
                <FaBookmark className="text-primary text-xl" />
              ) : (
                <FaRegBookmark className="text-gray-600 text-xl hover:text-primary transition-colors" />
              )}
            </button>
            <button
              onClick={onView}
              className="px-3 py-1 bg-primary text-white rounded-lg hover:bg-primaryDark transition-colors text-sm"
            >
              Xem
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;