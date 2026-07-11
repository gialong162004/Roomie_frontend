import React, { useEffect, useState } from "react";
import { FaHeart, FaRegHeart, FaStar } from "react-icons/fa";
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
  rating?: number;
  nights?: number;
  onToggleFavorite?: (isSaved: boolean) => void;
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
  rating,
  onToggleFavorite,
}) => {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setIsSaved(initialSaved);
  }, [initialSaved, _id]);

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return;
    setIsLoading(true);
    try {
      if (isSaved) {
        await PostAPI.removeFavoritePost(_id);
        setIsSaved(false);
        onToggleFavorite?.(false);
        showToast("Thành công!", {
          type: "success",
          subtitle: "Đã xoá khỏi danh sách yêu thích.",
        });
      } else {
        await PostAPI.addFavoritePost(_id);
        setIsSaved(true);
        onToggleFavorite?.(true);
        showToast("Thành công!", {
          type: "success",
          subtitle: "Đã thêm vào danh sách yêu thích.",
        });
      }
    } catch (error: any) {
      console.error("Error toggling favorite:", error);
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
    <div
      onClick={onView}
      className="cursor-pointer w-full max-w-[200px] group"
    >
      {/* Image Container (Hỗ trợ cả Ảnh và Video làm Thumbnail) */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden mb-3">
        {(() => {
          const isVideo = image?.match(/\.(mp4|webm|ogv|mov|avi)$/i);

          if (isVideo) {
            return (
              <video 
                src={image} 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                muted
                playsInline
                autoPlay
                loop
                preload="metadata"
              />
            );
          } else {
            return (
              <img
                src={image || "https://via.placeholder.com/300?text=No+Image"} // Fallback nếu URL rỗng
                alt={type}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            );
          }
        })()}

        {/* Gradient overlay at top for heart visibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent pointer-events-none rounded-2xl" />

        {/* Badge */}
        {badge && (
          <div className="absolute top-3 left-3 bg-white text-gray-800 text-xs font-semibold px-3 py-1 rounded-full shadow-md">
            {badge}
          </div>
        )}

        {/* Heart Button */}
        <button
          onClick={handleSaveClick}
          disabled={isLoading}
          className={`absolute top-3 right-3 p-1 transition-transform active:scale-90 ${
            isLoading ? "opacity-50 cursor-not-allowed" : "hover:scale-110"
          }`}
          aria-label={isSaved ? "Bỏ lưu" : "Lưu"}
        >
          {isSaved ? (
            <FaHeart className="text-red-500 text-2xl drop-shadow-md" />
          ) : (
            <FaRegHeart className="text-white text-2xl drop-shadow-md" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }} />
          )}
        </button>
      </div>

      {/* Info */}
      <div className="px-1">
        {/* Title row with rating */}
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-sm font-semibold text-textDark leading-snug truncate">
            {type}
          </h3>
          {rating !== undefined && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <FaStar className="text-textDark text-xs" />
              <span className="text-sm font-medium text-textDark">{rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Address */}
        <p className="text-sm text-textGray truncate mt-0.5">{address}</p>

        {/* Area */}
        {area && <p className="text-xs text-textGray mt-0.5">{area}</p>}

        {/* Price */}
        <p className="text-sm text-textDark mt-1">
          <span className="font-semibold">{price} VNĐ</span>
          <span className="text-textGray font-normal"></span>
        </p>
      </div>
    </div>
  );
};

export default RoomCard;