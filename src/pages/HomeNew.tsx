import React, { useState, useEffect } from "react";
import { PostAPI } from "../api/api";
import RoomCardHome from "../components/rooms/RoomCardHome";
import RoomDetail from "../components/rooms/RoomDetail";
import Navbar from "../components/layouts/Navbar";
import { useToast } from "../components/common/ToastProvider";
import { useRoomStore } from "../store/roomStore";
import { provinces } from "../constants/locations";

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
  superficies?: number;
}

const getCategoryId = (category: Room["category"]): string | null => {
  if (!category) return null;
  return typeof category === "string" ? category : category._id;
};

const getCategoryName = (category: Room["category"]): string => {
  if (!category) return "";
  return typeof category === "string" ? category : category.name || "";
};

const formatPrice = (price: number): string => {
  const safePrice = Number(price) || 0;
  return safePrice.toLocaleString("vi-VN");
};

const getRoomAddress = (room: Room): string => {
  return `${room.district}, ${room.city}`;
};

const HomeNew: React.FC = () => {
  const { categories, roomsByCategory, recommendedRooms, hasFetched, setData } = useRoomStore();
  const [loadingCategories, setLoadingCategories] = useState(!hasFetched);
  const [loadingRooms, setLoadingRooms] = useState(!hasFetched);
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("Hồ Chí Minh");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomDetailType | null>(null);
  const { showToast } = useToast();

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
        (room: Room) =>
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

  const runSearch = async () => {
    const keyword = searchKeyword.trim();

    setLoadingRooms(true);
    setSelectedCategory(null);

    try {
      const filter: any = {};
      if (keyword) filter.keyword = keyword;
      if (selectedCity) filter.city = selectedCity;

      const shouldSearch = Object.keys(filter).length > 0;
      const response = shouldSearch
        ? ((await PostAPI.searchPosts(filter)) as any)
        : ((await PostAPI.getPost()) as any);

      const rooms = extractRoomsFromResponse(response);
      setData({ ...buildStorePayloadFromRooms(rooms), hasFetched: true });
    } catch (error) {
      console.error("Error searching rooms:", error);
      showToast("Lỗi khi tìm kiếm phòng", { type: "error" });
    } finally {
      setLoadingRooms(false);
    }
  };


  // Fetch categories
  useEffect(() => {
    if (hasFetched) return;
    const fetchCategories = async () => {
      try {
        const response = await PostAPI.getCategory() as any;
        const categoryData = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];

        console.log("Fetched categories:", categoryData);
        setData({ categories: categoryData });
      } catch (error) {
        console.error("Error fetching categories:", error);
        showToast("Lỗi khi tải danh mục", { type: "error" });
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (hasFetched) return;
    const fetchRooms = async () => {
      try {
        const response = await PostAPI.getPost() as any;
        const rooms = extractRoomsFromResponse(response);
        console.log("Fetched rooms:", rooms);

        setData({ ...buildStorePayloadFromRooms(rooms), hasFetched: true });

      } catch (error) {
        console.error("Error fetching rooms:", error);
        showToast("Lỗi khi tải phòng", { type: "error" });
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  const handleViewRoom = (roomId: string) => {
    setSelectedPostId(roomId);
  };

  useEffect(() => {
    if (!selectedPostId) return;

    const fetchRoomDetail = async () => {
      try {
        const res = await PostAPI.getPostDetail(selectedPostId) as any;
        const roomDetail = res?.data ?? res;
        setSelectedRoom(roomDetail);
      } catch (error) {
        console.error("Error fetching room detail:", error);
        showToast("Lỗi khi lấy dữ liệu chi tiết", { type: "error" });
      }
    };

    fetchRoomDetail();
  }, [selectedPostId]);

  const getPostedTimeAgo = (updatedAt: string) => {
    if (!updatedAt) return "Vừa đăng";

    const updatedTime = new Date(updatedAt).getTime();
    const now = Date.now();
    const diffMs = now - updatedTime;

    const diffMinutes = Math.floor(diffMs / 1000 / 60);
    if (diffMinutes < 60) {
      return `${Math.max(diffMinutes, 1)} phút trước`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    }

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
  };

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <div
        style={{
          width: "100%",
          background: "linear-gradient(135deg, #FF6B00 0%, #FF8C00 50%, #FFA500 100%)",
          position: "relative",
          overflow: "hidden",
          padding: "40px 20px 50px",
          textAlign: "center",
        }}
      >
        {/* Background decorative elements */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "bold",
              color: "white",
              marginBottom: "0.5rem",
            }}
          >
            Nhà vừa ý, giá hợp lý!
          </h1>

          {/* Tab buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "24px",
              marginTop: "16px",
            }}
          >
            {["Cho thuê", "Mua bán", "Dự án"].map((tab) => (
              <button
                key={tab}
                style={{
                  padding: "8px 24px",
                  borderRadius: "999px",
                  border: "2px solid white",
                  background: tab === "Mua bán" ? "white" : "transparent",
                  color: tab === "Mua bán" ? "#FF6B00" : "white",
                  fontWeight: "600",
                  fontSize: "0.95rem",
                  cursor: "pointer",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

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
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}
            onSubmit={(e) => {
              e.preventDefault();
              runSearch();
            }}
          >
            {/* Search input */}
            <div style={{ display: "flex", alignItems: "center", flex: 1, gap: "8px" }}>
              <svg width="20" height="20" fill="none" stroke="#999" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Tìm bất động sản..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  fontSize: "0.95rem",
                  color: "#333",
                  width: "100%",
                  background: "transparent",
                }}
              />
            </div>

            {/* Divider */}
            <div style={{ width: "1px", height: "28px", background: "#e0e0e0" }} />

            {/* Location selector */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "0 12px",
                whiteSpace: "nowrap",
              }}
            >
              <svg width="16" height="16" fill="#FF6B00" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  fontSize: "0.9rem",
                  color: "#333",
                  background: "transparent",
                  cursor: "pointer",
                  maxWidth: "180px",
                }}
              >
                <option value="">Toàn quốc</option>
                {provinces.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Divider */}
            <div style={{ width: "1px", height: "28px", background: "#e0e0e0" }} />

            {/* Property type selector */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "0 12px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <svg width="16" height="16" fill="none" stroke="#666" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
              <span style={{ fontSize: "0.9rem", color: "#666" }}>Loại hình BĐS</span>
            </div>

            {/* Search button */}
            <button
              type="submit"
              style={{
                background: "#FF6B00",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "12px 28px",
                fontWeight: "700",
                fontSize: "1rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Tìm nhà
            </button>
          </form>
        </div>
      </div>

      {/* Recommended VIP Section */}
      <section style={{ padding: "80px 40px", backgroundColor: "#FFFFFF" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
            <div>
              <h2 style={{ fontSize: "2rem", fontWeight: "bold", color: "#334155", marginBottom: "8px" }}>
                Bài đăng đề xuất
              </h2>
            </div>
            {recommendedRooms.length > 0 && (
              <span style={{ background: "#FBBF24", color: "#78350F", padding: "8px 14px", borderRadius: "12px", fontWeight: 700, fontSize: "0.9rem" }}>
                TOP {recommendedRooms.length}
              </span>
            )}
          </div>

          {recommendedRooms.length === 0 ? (
            <div style={{ textAlign: "center", color: "#64748B", padding: "32px" }}>
              Chưa có bài VIP. Hãy nạp VIP để đẩy top.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                gap: "18px",
              }}
            >
              {recommendedRooms.map((room) => (
                <div
                  key={room._id}
                  onClick={() => handleViewRoom(room._id)}
                  style={{ cursor: "pointer", minWidth: 0 }}
                >
                  <RoomCardHome
                    _id={room._id}
                    image={room.images?.[0] || "https://via.placeholder.com/300x200"}
                    type={room.title || getCategoryName(room.category)}
                    area={`${room.superficies ?? "--"} m²`}
                    address={getRoomAddress(room)}
                    price={formatPrice(room.price)}
                    badge={"VIP"}
                    isSaved={room.isSaved}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section style={{ padding: "80px 40px", backgroundColor: "#F8FAFC" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <h2
              style={{
                fontSize: "2.5rem",
                fontWeight: "bold",
                color: "#334155",
                marginBottom: "1rem",
              }}
            >
              Danh Mục Phòng
            </h2>
            <p style={{ fontSize: "1.1rem", color: "#64748B" }}>
              Chọn loại phòng phù hợp với nhu cầu của bạn
            </p>
          </div>

          {loadingCategories ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p>Đang tải danh mục...</p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "20px",
              }}
            >
              {categories.map((category) => (
                <div
                  key={category._id}
                  onClick={() => handleCategoryClick(category._id)}
                  style={{
                    padding: "25px",
                    backgroundColor:
                      selectedCategory === category._id ? "#0D9488" : "#FFFFFF",
                    color:
                      selectedCategory === category._id ? "white" : "#334155",
                    borderRadius: "12px",
                    cursor: "pointer",
                    border:
                      selectedCategory === category._id
                        ? "2px solid #0D9488"
                        : "2px solid #E2E8F0",
                    textAlign: "center",
                    transition:
                      "all 0.3s ease, background-color 0.3s, color 0.3s",
                    boxShadow:
                      selectedCategory === category._id
                        ? "0 4px 12px rgba(13, 148, 136, 0.3)"
                        : "0 2px 4px rgba(0, 0, 0, 0.1)",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCategory !== category._id) {
                      e.currentTarget.style.boxShadow =
                        "0 4px 12px rgba(0, 0, 0, 0.15)";
                      e.currentTarget.style.backgroundColor = "#E0F7F5";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCategory !== category._id) {
                      e.currentTarget.style.boxShadow =
                        "0 2px 4px rgba(0, 0, 0, 0.1)";
                      e.currentTarget.style.backgroundColor = "#FFFFFF";
                    }
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.3rem",
                      fontWeight: "600",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {category.name}
                  </h3>
                  <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                    {roomsByCategory[category._id]?.length || 0} phòng
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Rooms by Category Section */}
      <section style={{ padding: "80px 40px", backgroundColor: "white" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {loadingRooms ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p>Đang tải phòng...</p>
            </div>
          ) : selectedCategory ? (
            // Show rooms for selected category
            <>
              <h2
                style={{
                  fontSize: "2rem",
                  fontWeight: "bold",
                  marginBottom: "40px",
                  color: "#334155",
                }}
              >
                {categories.find((c) => c._id === selectedCategory)?.name} (
                {roomsByCategory[selectedCategory]?.length || 0} phòng)
              </h2>
              {roomsByCategory[selectedCategory]?.length > 0 ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(210px, 1fr))",
                    gap: "18px",
                  }}
                >
                  {roomsByCategory[selectedCategory].map((room) => (
                    <div
                      key={room._id}
                      onClick={() => handleViewRoom(room._id)}
                      style={{ cursor: "pointer", minWidth: 0 }}
                    >
                      <RoomCardHome
                        _id={room._id}
                        image={
                          room.images?.[0] ||
                          "https://via.placeholder.com/300x200"
                        }
                        type={room.title || getCategoryName(room.category)}
                        area={`${room.superficies ?? "--"} m²`}
                        address={getRoomAddress(room)}
                        price={formatPrice(room.price)}
                        badge="Mới"
                        isSaved={room.isSaved}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px 20px",
                    color: "#64748B",
                  }}
                >
                  <p style={{ fontSize: "1.2rem" }}>
                    Không có phòng trong danh mục này
                  </p>
                </div>
              )}
            </>
          ) : (
            // Show all rooms grouped by category
            <>
              <h2
                style={{
                  fontSize: "2rem",
                  fontWeight: "bold",
                  marginBottom: "40px",
                  color: "#334155",
                }}
              >
                Tất Cả Phòng
              </h2>
              {categories.map((category) => (
                <div key={category._id} style={{ marginBottom: "80px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "30px",
                      paddingBottom: "15px",
                      borderBottom: "3px solid #0D9488",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: "600",
                        color: "#334155",
                        margin: 0,
                      }}
                    >
                      {category.name}
                    </h3>
                    <span
                      style={{
                        marginLeft: "10px",
                        backgroundColor: "#0D9488",
                        color: "white",
                        padding: "5px 12px",
                        borderRadius: "20px",
                        fontSize: "0.9rem",
                        fontWeight: "600",
                      }}
                    >
                      {roomsByCategory[category._id]?.length || 0}
                    </span>
                  </div>

                  {roomsByCategory[category._id]?.length > 0 ? (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(210px, 1fr))",
                        gap: "18px",
                      }}
                    >
                      {roomsByCategory[category._id]
                        .slice(0, 5)
                        .map((room) => (
                          <div
                            key={room._id}
                            onClick={() => handleViewRoom(room._id)}
                            style={{ cursor: "pointer", minWidth: 0 }}
                          >
                            <RoomCardHome
                              _id={room._id}
                              image={
                                room.images?.[0] ||
                                "https://via.placeholder.com/300x200"
                              }
                              type={room.title || getCategoryName(room.category)}
                              area={`${room.superficies ?? "--"} m²`}
                              address={getRoomAddress(room)}
                              price={formatPrice(room.price)}
                              badge="Mới"
                              isSaved={room.isSaved}
                            />
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div style={{ color: "#64748B", padding: "20px" }}>
                      Không có phòng trong danh mục này
                    </div>
                  )}

                  {roomsByCategory[category._id]?.length > 4 && (
                    <div style={{ textAlign: "center", marginTop: "30px" }}>
                      <button
                        onClick={() => handleCategoryClick(category._id)}
                        style={{
                          padding: "12px 30px",
                          backgroundColor: "#0D9488",
                          color: "white",
                          border: "none",
                          borderRadius: "25px",
                          cursor: "pointer",
                          fontSize: "1rem",
                          fontWeight: "600",
                          transition: "background-color 0.3s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#0F766E";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#0D9488";
                        }}
                      >
                        Xem tất cả ({roomsByCategory[category._id].length}{" "}
                        phòng)
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: "80px 40px", backgroundColor: "#F8FAFC" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <h2
              style={{
                fontSize: "2.5rem",
                fontWeight: "bold",
                color: "#334155",
                marginBottom: "1rem",
              }}
            >
              Tại sao chọn chúng tôi?
            </h2>
            <p style={{ fontSize: "1.1rem", color: "#64748B" }}>
              Nền tảng cho thuê phòng uy tín và hiệu quả
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "30px",
            }}
          >
            {[
              {
                icon: "🏠",
                title: "Phòng đa dạng",
                desc: "Hàng trăm phòng cho thuê với mọi loại và giá cả phù hợp",
              },
              {
                icon: "💰",
                title: "Giá cạnh tranh",
                desc: "Giá hợp lý, không phí ẩn, minh bạch hoàn toàn",
              },
              {
                icon: "🔒",
                title: "Tin cậy",
                desc: "Được xác minh đầy đủ, bảo vệ quyền người dùng",
              },
              {
                icon: "⚡",
                title: "Nhanh chóng",
                desc: "Tìm kiếm và đặt lịch xem phòng chỉ trong vài phút",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                style={{
                  padding: "30px",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "12px",
                  textAlign: "center",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                  transition: "transform 0.3s, box-shadow 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 16px rgba(0, 0, 0, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(0, 0, 0, 0.1)";
                }}
              >
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
                  {feature.icon}
                </div>
                <h3
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: "600",
                    marginBottom: "0.5rem",
                    color: "#334155",
                  }}
                >
                  {feature.title}
                </h3>
                <p style={{ color: "#64748B" }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section
        style={{
          padding: "80px 40px",
          background: "linear-gradient(135deg, #14B8A6 0%, #0F766E 100%)",
          marginTop: "24px",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "40px",
              textAlign: "center",
              color: "white",
            }}
          >
            {[
              { number: "10K+", label: "Người dùng" },
              { number: "5K+", label: "Phòng cho thuê" },
              { number: "100+", label: "Thành phố" },
              { number: "98%", label: "Hài lòng" },
            ].map((stat, idx) => (
              <div key={idx}>
                <div
                  style={{
                    fontSize: "3rem",
                    fontWeight: "bold",
                    marginBottom: "0.5rem",
                  }}
                >
                  {stat.number}
                </div>
                <div style={{ fontSize: "1.1rem", opacity: 0.9 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          padding: "80px 40px",
          background: "linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)",
          color: "white",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "2.5rem",
              fontWeight: "bold",
              marginBottom: "1.5rem",
            }}
          >
            Sẵn sàng tìm phòng của bạn?
          </h2>
          <p style={{ fontSize: "1.2rem", marginBottom: "2rem", opacity: 0.9 }}>
            Tham gia cùng hàng ngàn người dùng đang tìm kiếm phòng cho thuê trên
            nền tảng của chúng tôi
          </p>
          <a href="/#categories-section">
            <button
              style={{
                backgroundColor: "white",
                color: "#0F766E",
                padding: "15px 40px",
                fontSize: "1.1rem",
                fontWeight: "600",
                border: "none",
                borderRadius: "50px",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
                transition: "transform 0.3s, box-shadow 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow =
                  "0 6px 20px rgba(0, 0, 0, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 4px 15px rgba(0, 0, 0, 0.2)";
              }}
            >
              Khám phá ngay
            </button>
          </a>
        </div>
      </section>

      {selectedRoom && (
        <RoomDetail
          postId={selectedRoom._id}
          images={selectedRoom.images?.length
            ? selectedRoom.images
            : ["https://visaho.vn/upload_images/images/2022/04/01/phan-loai-can-ho-chung-cu-7.jpg"]
          }
          type={selectedRoom.title}
          area={selectedRoom.superficies ? `${selectedRoom.superficies} m²` : "-- m²"}
          address={`${selectedRoom.address}, ${selectedRoom.district}, ${selectedRoom.city}`}
          price={formatPrice(selectedRoom.price)}
          badge={selectedRoom.category?.name || "Đã duyệt"}
          description={selectedRoom.description}
          posterName={selectedRoom.owner?.name}
          posterId={selectedRoom.owner?._id}
          phone={selectedRoom.owner?.phone || "0123 456 789"}
          postedMinutesAgo={getPostedTimeAgo(selectedRoom.updatedAt)}
          onClose={() => {
            setSelectedRoom(null);
            setSelectedPostId(null);
          }}
        />
      )}

    </>
  );
};

export default HomeNew;
