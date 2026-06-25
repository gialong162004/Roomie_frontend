import React, { useState, useEffect } from "react";
import { PostAPI } from "../api/api";
import RoomDetail from "../components/rooms/RoomDetail";
import Navbar from "../components/layouts/Navbar";
import { useToast } from "../components/common/ToastProvider";
import { useRoomStore } from "../store/roomStore";
import { useLocations } from "../hooks/useLocations";
import RoomListSection from "../components/rooms/RoomListSection";
import { useNavigate } from "react-router-dom";
import SurveyModal from "../components/SurveyModal";

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
  owner?: { _id: string; name: string; phone?: string }; 
  userId?: { _id: string; name: string; phone?: string };
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
  const [selectedCity, setSelectedCity] = useState<string>("Toàn quốc");
  const { provinces } = useLocations();
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomDetailType | null>(null);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [showSurveyModal, setShowSurveyModal] = useState(false);

  const allRooms: Room[] = Object.values(roomsByCategory).flat();
  const featuredRooms: Room[] = recommendedRooms;
  const forYouRooms: Room[] = [...allRooms]
  .filter((r) => {
    if (selectedCity === "Toàn quốc" || !selectedCity) return true;
    return r.city === selectedCity;
  })
  .slice(0, 8);

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

    const vipRooms = rooms.filter(
      (room) =>
        (room as any)?.isVip ||
        (room as any)?.priority === "VIP" ||
        (room as any)?.priority === 1
    ).slice(0, 8);

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
    
    // Kiểm tra nếu là "Toàn quốc" thì bỏ qua
    if (selectedCity && selectedCity !== "Toàn quốc") {
      params.append('city', selectedCity);
    }
      
    navigate(`/search?${params.toString()}`);
  };

  useEffect(() => {
    const shouldShowSurvey = localStorage.getItem("showSurvey");

    if (shouldShowSurvey === "true") {
      // Đợi 500ms để trang render ổn định rồi mới hiện modal
      const timer = setTimeout(() => {
        setShowSurveyModal(true);
        // Xóa flag để không hiển thị lại khi refresh trang
        localStorage.removeItem("showSurvey");
      }, 500);

      return () => clearTimeout(timer);
    }
  }, []);

  // Fetch categories
  useEffect(() => {
    if (hasFetched) return;
    (async () => {
      try {
        const response = (await PostAPI.getCategory()) as any;
        const categoryData = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
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

  // Fetch room detail
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
    <div className="w-full min-h-screen bg-white overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <div className="w-full bg-[#f5f5f5] relative overflow-hidden px-4 py-10 md:py-16 text-center">
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-[#334155] mb-6 tracking-tight px-2">
            Roomie – Chạm là thấy phòng.
          </h1>

          {/* Optimized Search Bar */}
          <form
            className="flex flex-col md:flex-row items-stretch md:items-center bg-white rounded-2xl md:rounded-xl p-3 md:p-2 max-w-3xl mx-auto gap-3 shadow-lg border border-gray-100"
            onSubmit={(e) => { e.preventDefault(); runSearch(); }}
          >
            {/* Keyword Input Group */}
            <div className="flex items-center flex-1 gap-3 px-3 py-2 md:py-0 border-b md:border-b-0 border-gray-100">
              <svg width="20" height="20" fill="none" stroke="#64748B" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Tìm tên phòng, khu vực..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="border-none outline-none text-[15px] text-[#334155] w-full bg-transparent placeholder-gray-400"
              />
            </div>

            {/* Desktop Separator */}
            <div className="hidden md:block w-[1px] height-[28px] bg-[#E2E8F0] self-stretch my-2" />

            {/* Location Dropdown Group */}
            <div className="flex items-center gap-2 px-3 py-2 md:py-0 border-b md:border-b-0 border-gray-100">
              <svg width="18" height="18" fill="#14B8A6" viewBox="0 0 24 24" className="shrink-0">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="border-none outline-none text-[14px] font-medium text-[#334155] bg-transparent cursor-pointer w-full md:max-w-[160px] py-1"
              >
                <option value="">Toàn quốc</option>
                {provinces.map((p) => (
                  <option key={p.code} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-[15px] py-3 md:py-2.5 px-6 rounded-xl md:rounded-lg transition-colors duration-200 shrink-0 shadow-md shadow-teal-600/10"
            >
              Tìm phòng
            </button>
          </form>
        </div>
      </div>

      {/* ── Room List Sections ── */}
      <div className="space-y-2">
        <RoomListSection
          title="Bài đăng nổi bật"
          subtitle="Những bài đăng được đề xuất của các đối tác"
          rooms={featuredRooms}
          loading={loadingRooms}
          badge="Đối tác"
          badgeStyle={{ background: "#FBBF24", color: "#78350F" }}
          emptyText="Chưa có bài nổi bật. Hãy nâng cấp VIP để đẩy top."
          onViewRoom={handleViewRoom}
          backgroundColor="#FFFFFF"
          accentColor="#FF6B00"
        />

        <RoomListSection
          title="Dành cho bạn"
          badge="Gợi ý"
          subtitle="Những bài đăng phù hợp với khu vực bạn chọn"
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

        <RoomListSection
          title="Bài đăng mới nhất"
          badge="Mới"
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
      </div>

      {/* Features Section */}
      <section className="py-12 md:py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-2xl md:text-4xl font-bold text-[#334155] mb-3">
            Tại sao chọn chúng tôi?
          </h2>
          <p className="text-sm md:text-base text-[#64748B]">
            Nền tảng cho thuê phòng uy tín và hiệu quả
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: "🏠", title: "Phòng đa dạng", desc: "Hàng trăm phòng cho thuê với mọi loại và giá cả phù hợp" },
            { icon: "💰", title: "Giá cạnh tranh", desc: "Giá hợp lý, không phí ẩn, minh bạch hoàn toàn" },
            { icon: "🔒", title: "Tin cậy", desc: "Được xác minh đầy đủ, bảo vệ quyền người dùng" },
            { icon: "⚡", title: "Nhanh chóng", desc: "Tìm kiếm và đặt lịch xem phòng chỉ trong vài phút" },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="p-6 bg-white border border-gray-50 rounded-2xl text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-base md:text-lg font-semibold mb-2 text-[#334155]">{feature.title}</h3>
              <p className="text-sm text-[#64748B] leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-12 bg-gradient-to-br from-[#14B8A6] to-[#0F766E] px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {[
              { number: "10K+", label: "Người dùng" },
              { number: "5K+", label: "Phòng cho thuê" },
              { number: "100+", label: "Thành phố" },
              { number: "98%", label: "Hài lòng" },
            ].map((stat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="text-3xl md:text-4xl font-bold">{stat.number}</div>
                <div className="text-xs md:text-sm opacity-90">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-[#0D9488] to-[#14B8A6] text-white text-center px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-2xl md:text-4xl font-bold">Sẵn sàng tìm phòng của bạn?</h2>
          <p className="text-sm md:text-base opacity-90 leading-relaxed">
            Tham gia cùng hàng ngàn người dùng đang tìm kiếm phòng cho thuê trên nền tảng của chúng tôi
          </p>
          <div className="pt-2">
            <a href="/#categories-section">
              <button className="bg-white text-[#0F766E] hover:scale-105 active:scale-95 px-8 py-3.5 text-[15px] font-semibold rounded-full shadow-lg transition-transform duration-200">
                Khám phá ngay
              </button>
            </a>
          </div>
        </div>
      </section>

      {showSurveyModal && (
        <SurveyModal 
          onClose={() => setShowSurveyModal(false)} 
          onSuccess={() => setShowSurveyModal(false)}
        />
      )}

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
    </div>
  );
};

export default HomeNew;