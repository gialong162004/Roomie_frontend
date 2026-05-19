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

const CARD_WIDTH = 228; // minWidth + gap

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

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateArrows();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [displayedRooms]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = CARD_WIDTH * 3;
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
      style={{
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        [dir === "left" ? "left" : "right"]: "-20px",
        zIndex: 10,
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        border: `2px solid ${disabled ? "#E2E8F0" : accentColor}`,
        background: disabled ? "#F8FAFC" : "#FFFFFF",
        color: disabled ? "#CBD5E1" : accentColor,
        cursor: disabled ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: disabled ? "none" : "0 2px 8px rgba(0,0,0,0.12)",
        transition: "all 0.2s",
        flexShrink: 0,
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
    <section style={{ padding: "80px 40px", backgroundColor }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "30px",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                color: "#334155",
                marginBottom: subtitle ? "8px" : 0,
              }}
            >
              {title}
            </h2>
            {subtitle && (
              <p style={{ fontSize: "1rem", color: "#64748B", margin: 0 }}>
                {subtitle}
              </p>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {badge && rooms.length > 0 && (
              <span
                style={{
                  padding: "8px 14px",
                  borderRadius: "12px",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  background: "#FBBF24",
                  color: "#78350F",
                  ...badgeStyle,
                }}
              >
                {badge}
              </span>
            )}
            {onViewAll && rooms.length > 0 && (
              <button
                onClick={onViewAll}
                style={{
                  padding: "8px 20px",
                  border: `2px solid ${accentColor}`,
                  borderRadius: "20px",
                  background: "transparent",
                  color: accentColor,
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  transition: "all 0.2s",
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

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px", color: "#94A3B8" }}>
            <div
              style={{
                display: "inline-block",
                width: "36px",
                height: "36px",
                border: `3px solid #E2E8F0`,
                borderTop: `3px solid ${accentColor}`,
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                marginBottom: "12px",
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ margin: 0 }}>Đang tải...</p>
          </div>
        ) : displayedRooms.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px 20px",
              color: "#94A3B8",
              background: "#F8FAFC",
              borderRadius: "12px",
              border: "2px dashed #E2E8F0",
            }}
          >
            <p style={{ fontSize: "1.1rem", margin: 0 }}>{emptyText}</p>
          </div>
        ) : (
          <div style={{ position: "relative" }}>
            {/* Left Arrow */}
            <ArrowButton dir="left" disabled={!canScrollLeft} />

            {/* Scrollable Row */}
            <div
              ref={scrollRef}
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "18px",
                overflowX: "auto",
                scrollSnapType: "x mandatory",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                padding: "4px 28px 8px",
              }}
            >
              <style>{`
                div::-webkit-scrollbar { display: none; }
              `}</style>
              {displayedRooms.map((room) => (
                <div
                  key={room._id}
                  onClick={() => onViewRoom(room._id)}
                  style={{
                    cursor: "pointer",
                    flexShrink: 0,
                    width: "210px",
                    scrollSnapAlign: "start",
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