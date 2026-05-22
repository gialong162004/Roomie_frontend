import React, { useState, useEffect } from "react";
import { PostAPI } from "../api/api";
import RoomDetail from "../components/rooms/RoomDetail";
import Navbar from "../components/layouts/Navbar";
import { useToast } from "../components/common/ToastProvider";
import { useRoomStore } from "../store/roomStore";
import { useLocations } from "../hooks/useLocations";
import RoomListSection from "../components/rooms/RoomListSection";
import { useNavigate } from "react-router-dom";

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

interface RoomDetailType {
  _id: string;
  title: string;
  description: string;
  price: number;
  city: string;
  district: string;
  address: string;
  images: string[];
  category?: { id?: string; name?: string };
  updatedAt: string;
  owner?: { _id: string; name: string; phone?: string }; userId?: { _id: string; name: string; phone?: string };
  superficies?: number;
}

const getCategoryId = (category: Room["category"]): string | null => {
  if (!category) return null;
  return typeof category === "string" ? category : category._id;
};

const formatPrice = (price: number): string => {
  return (Number(price) || 0).toLocaleString("vi-VN");
};

const HomeNew: React.FC = () => {
  const { roomsByCategory, recommendedRooms, hasFetched, setData } = useRoomStore();
  const [, setLoadingCategories] = useState(!hasFetched);
  const [loadingRooms, setLoadingRooms] = useState(!hasFetched);
  const [loadingNewPosts, setLoadingNewPosts] = useState(true);
  const [newPosts, setNewPosts] = useState<Room[]>([]);
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("Hồ Chí Minh");
  const { provinces } = useLocations();
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomDetailType | null>(null);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const allRooms: Room[] = Object.values(roomsByCategory).flat();

  const featuredRooms: Room[] = recommendedRooms;

  const forYouRooms: Room[] = [...allRooms]
    .filter((r) => r.city === selectedCity)
    .slice(0, 8);

  // --- Helpers ---
  const extractRoomsFromResponse = (response: any): Room[] => {
    if (Array.isArray(response?.content)) return response.content;
    if (Array.isArray(response?.data?.content)) return response.data.content;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response)) return response;
    return [];
  };

  const buildStorePayloadFromRooms = (rooms: Room[]) => {
    const grouped: { [key: string]: Room[] } = {};
    rooms.forEach((room: Room) => {
      const categoryId = getCategoryId(room.category);
      if (!categoryId) return;
      if (!grouped[categoryId]) grouped[categoryId] = [];
      grouped[categoryId].push(room);
    });

    const vipRooms = rooms
      .filter(
        (room) =>
          (room as any)?.isVip ||
          (room as any)?.priority === "VIP" ||
          (room as any)?.priority === 1
      )
      .slice(0, 8);

    const topRooms = [...rooms]
      .sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
      .slice(0, 8);

    return {
      roomsByCategory: grouped,
      recommendedRooms: vipRooms.length > 0 ? vipRooms : topRooms,
    };
  };

  const runSearch = () => {
    const params = new URLSearchParams();
    if (searchKeyword.trim()) params.append('keyword', searchKeyword.trim());
    if (selectedCity) params.append('city', selectedCity);
    
    navigate(`/search?${params.toString()}`);
  };

  // Fetch categories
  useEffect(() => {
    if (hasFetched) return;
    (async () => {
      try {
        const response = (await PostAPI.getCategory()) as any;
        const categoryData = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : [];
        setData({ categories: categoryData });
      } catch {
        showToast("Lỗi khi tải danh mục", { type: "error" });
      } finally {
        setLoadingCategories(false);
      }
    })();
  }, []);

  // Fetch rooms
  useEffect(() => {
    if (hasFetched) return;
    (async () => {
      try {
        const response = (await PostAPI.getPost({ limit: 10, page: 1 })) as any;
        const rooms = extractRoomsFromResponse(response);
        setData({ ...buildStorePayloadFromRooms(rooms), hasFetched: true });
      } catch {
        showToast("Lỗi khi tải phòng", { type: "error" });
      } finally {
        setLoadingRooms(false);
      }
    })();
  }, []);

  // Fetch newest rooms
  useEffect(() => {
    (async () => {
      try {
        setLoadingNewPosts(true);
        const response = (await PostAPI.getNewPosts({ limit: 8 })) as any;
        setNewPosts(extractRoomsFromResponse(response));
      } catch {
        console.error("Lỗi khi tải phòng mới nhất");
      } finally {
        setLoadingNewPosts(false);
      }
    })();
  }, []);

  // Fetch room detail when selected
  useEffect(() => {
    if (!selectedPostId) return;
    (async () => {
      try {
        const res = (await PostAPI.getPostDetail(selectedPostId)) as any;
        setSelectedRoom(res?.data ?? res);
      } catch {
        showToast("Lỗi khi lấy dữ liệu chi tiết", { type: "error" });
      }
    })();
  }, [selectedPostId]);

  const handleViewRoom = (roomId: string) => setSelectedPostId(roomId);

  const getPostedTimeAgo = (updatedAt: string) => {
    if (!updatedAt) return "Vừa đăng";
    const diffMs = Date.now() - new Date(updatedAt).getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 60) return `${Math.max(minutes, 1)} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return `${Math.floor(hours / 24)} ngày trước`;
  };

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <div
        style={{
          width: "100%",
          background: "#f5f5f5", 
          position: "relative",
          overflow: "hidden",
          padding: "40px 20px 50px",
          textAlign: "center",
        }}
      >
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#334155", marginBottom: "1.5rem" }}> {/* Chuyển sang màu textDark #334155 từ config của bạn */}
            Roomie – Chạm là thấy phòng.
          </h1>

          {/* Search bar */}
          <form
            style={{
              display: "flex",
              alignItems: "center",
              background: "white",
              borderRadius: "12px",
              padding: "8px 8px 8px 16px",
              maxWidth: "860px",
              margin: "0 auto",
              gap: "8px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}
            onSubmit={(e) => { e.preventDefault(); runSearch(); }}
          >
            <div style={{ display: "flex", alignItems: "center", flex: 1, gap: "8px" }}>
              <svg width="20" height="20" fill="none" stroke="#64748B" strokeWidth="2" viewBox="0 0 24 24"> {/* Chuyển stroke sang màu textGray #64748B */}
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Tìm phòng..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                style={{ border: "none", outline: "none", fontSize: "0.95rem", color: "#334155", width: "100%", background: "transparent" }}
              />
            </div>

            <div style={{ width: "1px", height: "28px", background: "#E2E8F0" }} /> {/* Đổi màu gạch dọc sang borderLight #E2E8F0 */}

            <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "0 12px", whiteSpace: "nowrap" }}>
              <svg width="16" height="16" fill="#14B8A6" viewBox="0 0 24 24"> {/* Đổi màu icon định vị sang primaryLight #14B8A6 */}
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                style={{ border: "none", outline: "none", fontSize: "0.9rem", color: "#334155", background: "transparent", cursor: "pointer", maxWidth: "180px" }}
              >
                <option value="">Toàn quốc</option>
                {provinces.map((p) => (
                  <option key={p.code} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            <div style={{ width: "1px", height: "28px", background: "#E2E8F0" }} />

            <button
              type="submit"
              style={{
                background: "#0D9488", // Đổi nút bấm sang màu xanh ngọc primary (#0D9488)
                color: "white", 
                border: "none", 
                borderRadius: "8px",
                padding: "12px 28px", 
                fontWeight: "700", 
                fontSize: "1rem", 
                cursor: "pointer", 
                whiteSpace: "nowrap",
                transition: "background 0.2s", // Thêm hiệu ứng mượt khi hover
              }}
              // Thêm hiệu ứng đổi màu đậm hơn khi người dùng rê chuột vào nút
              onMouseEnter={(e) => (e.currentTarget.style.background = "#0F766E")} // primaryDark (#0F766E)
              onMouseLeave={(e) => (e.currentTarget.style.background = "#0D9488")} // Trở lại primary
            >
              Tìm phòng
            </button>
          </form>
        </div>
      </div>

      {/* ── 3 Room Lists using shared RoomListSection component ── */}

      {/* 1. Bài đăng nổi bật (VIP / top price) */}
      <RoomListSection
        title="Bài đăng nổi bật"
        subtitle="Những bài đăng được đề xuất và ưu tiên hiển thị"
        rooms={featuredRooms}
        loading={loadingRooms}
        badge={`TOP ${featuredRooms.length}`}
        badgeStyle={{ background: "#FBBF24", color: "#78350F" }}
        emptyText="Chưa có bài nổi bật. Hãy nâng cấp VIP để đẩy top."
        onViewRoom={handleViewRoom}
        backgroundColor="#FFFFFF"
        accentColor="#FF6B00"
      />

      {/* 2. Bài đăng mới nhất */}
      <RoomListSection
        title="Bài đăng mới nhất"
        subtitle="Cập nhật liên tục những tin đăng mới nhất"
        rooms={newPosts}
        loading={loadingNewPosts}
        emptyText="Chưa có bài đăng nào."
        maxItems={8}
        onViewRoom={handleViewRoom}
        onViewAll={() => navigate("/search")}
        viewAllLabel="Xem tất cả"
        backgroundColor="#F8FAFC"
        accentColor="#0D9488"
      />

      {/* 3. Bài đăng dành cho bạn (lọc theo thành phố đang chọn) */}
      <RoomListSection
        title="Dành cho bạn"
        subtitle={`Phòng gần bạn tại ${selectedCity || "khắp nơi"}`}
        rooms={forYouRooms}
        loading={loadingRooms}
        emptyText={`Không tìm thấy phòng tại ${selectedCity || "khu vực này"}.`}
        maxItems={8}
        onViewRoom={handleViewRoom}
        onViewAll={() => navigate("/search")}
        viewAllLabel="Khám phá thêm"
        backgroundColor="#FFFFFF"
        accentColor="#6366F1"
      />

      {/* Features Section */}
      <section style={{ padding: "80px 40px", backgroundColor: "#F8FAFC" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <h2 style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#334155", marginBottom: "1rem" }}>
              Tại sao chọn chúng tôi?
            </h2>
            <p style={{ fontSize: "1.1rem", color: "#64748B" }}>
              Nền tảng cho thuê phòng uy tín và hiệu quả
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "30px" }}>
            {[
              { icon: "🏠", title: "Phòng đa dạng", desc: "Hàng trăm phòng cho thuê với mọi loại và giá cả phù hợp" },
              { icon: "💰", title: "Giá cạnh tranh", desc: "Giá hợp lý, không phí ẩn, minh bạch hoàn toàn" },
              { icon: "🔒", title: "Tin cậy", desc: "Được xác minh đầy đủ, bảo vệ quyền người dùng" },
              { icon: "⚡", title: "Nhanh chóng", desc: "Tìm kiếm và đặt lịch xem phòng chỉ trong vài phút" },
            ].map((feature, idx) => (
              <div
                key={idx}
                style={{ padding: "30px", backgroundColor: "#FFFFFF", borderRadius: "12px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", transition: "transform 0.3s, box-shadow 0.3s" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.15)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"; }}
              >
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{feature.icon}</div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: "600", marginBottom: "0.5rem", color: "#334155" }}>{feature.title}</h3>
                <p style={{ color: "#64748B" }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section style={{ padding: "80px 40px", background: "linear-gradient(135deg, #14B8A6 0%, #0F766E 100%)", marginTop: "24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "40px", textAlign: "center", color: "white" }}>
            {[
              { number: "10K+", label: "Người dùng" },
              { number: "5K+", label: "Phòng cho thuê" },
              { number: "100+", label: "Thành phố" },
              { number: "98%", label: "Hài lòng" },
            ].map((stat, idx) => (
              <div key={idx}>
                <div style={{ fontSize: "3rem", fontWeight: "bold", marginBottom: "0.5rem" }}>{stat.number}</div>
                <div style={{ fontSize: "1.1rem", opacity: 0.9 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: "80px 40px", background: "linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)", color: "white", textAlign: "center" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: "1.5rem" }}>Sẵn sàng tìm phòng của bạn?</h2>
          <p style={{ fontSize: "1.2rem", marginBottom: "2rem", opacity: 0.9 }}>
            Tham gia cùng hàng ngàn người dùng đang tìm kiếm phòng cho thuê trên nền tảng của chúng tôi
          </p>
          <a href="/#categories-section">
            <button
              style={{ backgroundColor: "white", color: "#0F766E", padding: "15px 40px", fontSize: "1.1rem", fontWeight: "600", border: "none", borderRadius: "50px", cursor: "pointer", boxShadow: "0 4px 15px rgba(0,0,0,0.2)", transition: "transform 0.3s, box-shadow 0.3s" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.3)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)"; }}
            >
              Khám phá ngay
            </button>
          </a>
        </div>
      </section>

      {selectedRoom && (
        <RoomDetail
          postId={selectedRoom._id}
          images={selectedRoom.images?.length ? selectedRoom.images : ["https://visaho.vn/upload_images/images/2022/04/01/phan-loai-can-ho-chung-cu-7.jpg"]}
          type={selectedRoom.title}
          area={selectedRoom.superficies ? `${selectedRoom.superficies} m²` : "-- m²"}
          address={`${selectedRoom.address}, ${selectedRoom.district}, ${selectedRoom.city}`}
          price={formatPrice(selectedRoom.price)}
          badge={selectedRoom.category?.name || "Đã duyệt"}
          description={selectedRoom.description}
          posterName={selectedRoom.userId?.name || selectedRoom.owner?.name}
          posterId={selectedRoom.userId?._id || selectedRoom.owner?._id}
          phone={selectedRoom.userId?.phone || selectedRoom.owner?.phone || "0123 456 789"}
          postedMinutesAgo={getPostedTimeAgo(selectedRoom.updatedAt)}
          onClose={() => { setSelectedRoom(null); setSelectedPostId(null); }}
        />
      )}
    </>
  );
};

export default HomeNew;
