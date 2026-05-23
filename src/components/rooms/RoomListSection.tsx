import React, { useRef, useState, useEffect } from "react";
import RoomCardHome from "./RoomCardHome";

interface Room {
  _id: string;
  title: string;
  description: string;
  price: number;
  superficies: number;
  address: string;
  city: string;
  district: string;
  category: string | { _id: string; name?: string };
  images?: string[];
  isSaved?: boolean;
  isVip?: boolean;
  priority?: string | number;
}

interface RoomListSectionProps {
  title: string;
  subtitle?: string;
  rooms: Room[];
  loading?: boolean;
  badge?: string;
  badgeStyle?: React.CSSProperties;
  emptyText?: string;
  maxItems?: number;
  onViewRoom: (roomId: string) => void;
  onViewAll?: () => void;
  viewAllLabel?: string;
  backgroundColor?: string;
  accentColor?: string;
}

const getCategoryName = (category: Room["category"]): string => {
  if (!category) return "";
  return typeof category === "string" ? category : category.name || "";
};

const formatPrice = (price: number): string => {
  return (Number(price) || 0).toLocaleString("vi-VN");
};

const getRoomAddress = (room: Room): string => {
  return `${room.district}, ${room.city}`;
};

const RoomListSection: React.FC<RoomListSectionProps> = ({
  title,
  subtitle,
  rooms,
  loading = false,
  badge,
  badgeStyle,
  emptyText = "Không có bài đăng nào.",
  maxItems,
  onViewRoom,
  onViewAll,
  viewAllLabel,
  backgroundColor = "#FFFFFF",
  accentColor = "#0D9488",
}) => {
  const displayedRooms = maxItems ? rooms.slice(0, maxItems) : rooms;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  useEffect(() => {
    // Kiểm tra môi trường màn hình để phân tách Mobile / PC chuẩn xác
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      updateArrows();
    };

    handleResize();
    const el = scrollRef.current;
    if (!el) return;
    
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", handleResize);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", handleResize);
    };
  }, [displayedRooms]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;

    const firstItem = el.querySelector("div") as HTMLElement;
    if (!firstItem) return;

    const cardWidth = firstItem.getBoundingClientRect().width;
    const computedGap = parseFloat(window.getComputedStyle(el).gap) || (isMobile ? 10 : 16);
    const amount = cardWidth + computedGap;

    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  const ArrowButton = ({
    dir,
    disabled,
  }: {
    dir: "left" | "right";
    disabled: boolean;
  }) => (
    <button
      onClick={() => scroll(dir)}
      disabled={disabled}
      aria-label={dir === "left" ? "Cuộn trái" : "Cuộn phải"}
      className={`hidden md:flex absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border-2 items-center justify-center transition-all duration-200 ${
        dir === "left" ? "-left-5" : "-right-5"
      }`}
      style={{
        border: `2px solid ${disabled ? "#E2E8F0" : accentColor}`,
        background: disabled ? "#F8FAFC" : "#FFFFFF",
        color: disabled ? "#CBD5E1" : accentColor,
        cursor: disabled ? "default" : "pointer",
        boxShadow: disabled ? "none" : "0 4px 12px rgba(0,0,0,0.1)",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = accentColor;
          e.currentTarget.style.color = "#FFFFFF";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = "#FFFFFF";
          e.currentTarget.style.color = accentColor;
        }
      }}
    >
      {dir === "left" ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );

  return (
    <section className="py-8 px-4 md:py-16 md:px-10" style={{ backgroundColor }}>
      <div className="max-w-[1200px] mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 md:mb-8">
          <div>
            <h2 className={`font-bold text-[#334155] tracking-tight text-xl md:text-3xl ${subtitle ? "mb-1.5" : "mb-0"}`}>
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm md:text-base text-[#64748B] m-0">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {badge && rooms.length > 0 && (
              <span
                className="px-3 py-1.5 rounded-xl font-bold text-xs md:text-sm bg-[#FBBF24] text-[#78350F]"
                style={badgeStyle}
              >
                {badge}
              </span>
            )}
            {onViewAll && rooms.length > 0 && (
              <button
                onClick={onViewAll}
                className="px-4 py-2 border-2 rounded-full bg-transparent font-semibold text-xs md:text-sm transition-all duration-200 cursor-pointer"
                style={{
                  borderColor: accentColor,
                  color: accentColor,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = accentColor;
                  e.currentTarget.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = accentColor;
                }}
              >
                {viewAllLabel || `Xem tất cả (${rooms.length})`}
              </button>
            )}
          </div>
        </div>

        {/* Content Slider */}
        {loading ? (
          <div className="text-center py-12 text-[#94A3B8]">
            <div
              className="inline-block w-9 h-9 border-3 rounded-full animate-spin mb-3"
              style={{
                borderStyle: "solid",
                borderColor: "#E2E8F0",
                borderTopColor: accentColor,
              }}
            />
            <p className="m-0 text-sm">Đang tải...</p>
          </div>
        ) : displayedRooms.length === 0 ? (
          <div className="text-center py-12 px-5 text-[#94A3B8] bg-[#F8FAFC] rounded-2xl border-2 border-dashed border-[#E2E8F0]">
            <p className="text-sm md:text-base m-0">{emptyText}</p>
          </div>
        ) : (
          <div className="relative w-full">
            {/* Left Arrow */}
            <ArrowButton dir="left" disabled={!canScrollLeft} />

            {/* Scrollable Container */}
            <div
              ref={scrollRef}
              // Sử dụng gap nhỏ (gap-3) trên Mobile để các card đứng sát nhau gọn gàng
              className="flex flex-row overflow-x-auto gap-3 md:gap-4 scrollbar-none pb-2 px-1 py-1"
              style={{
                scrollSnapType: "x mandatory",
                msOverflowStyle: "none",
                scrollbarWidth: "none",
              }}
            >
              <style>{`div::-webkit-scrollbar { display: none; }`}</style>
              
              {displayedRooms.map((room) => (
                <div
                  key={room._id}
                  onClick={() => onViewRoom(room._id)}
                  className="cursor-pointer shrink-0 scroll-snap-align-start"
                  // 👇 SỬA ĐỔI QUAN TRỌNG: Khớp kích thước với max-w-[200px] của RoomCardHome
                  style={{
                    width: isMobile ? "200px" : "calc(20% - 12.8px)"
                  }}
                >
                  <RoomCardHome
                    _id={room._id}
                    image={room.images?.[0] || "https://via.placeholder.com/300x200"}
                    type={room.title || getCategoryName(room.category)}
                    area={`${room.superficies ?? "--"} m²`}
                    address={getRoomAddress(room)}
                    price={formatPrice(room.price)}
                    badge={
                      room.isVip || room.priority === "VIP" || room.priority === 1
                        ? "VIP"
                        : "Mới"
                    }
                    isSaved={room.isSaved}
                  />
                </div>
              ))}
            </div>

            {/* Right Arrow */}
            <ArrowButton dir="right" disabled={!canScrollRight} />
          </div>
        )}
      </div>
    </section>
  );
};

export default RoomListSection;