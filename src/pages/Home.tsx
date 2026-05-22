import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { PostAPI } from "../api/api";
import RoomCardHome from "../components/rooms/RoomCardHome";
import RoomDetail from "../components/rooms/RoomDetail";
import { useLocations } from "../hooks/useLocations";

const formatPrice = (price: number): string => {
  return (Number(price) || 0).toLocaleString("vi-VN");
};

const getPostedTimeAgo = (updatedAt: string) => {
  if (!updatedAt) return "Vừa đăng";
  const diffMs = Date.now() - new Date(updatedAt).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
};

export default function Home() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // State
  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [district, setDistrict] = useState(searchParams.get("district") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");

  const [categories, setCategories] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);

  const { provinces, districts: availableDistricts } = useLocations(city);

  useEffect(() => {
    if (!selectedPostId) {
      setSelectedRoom(null);
      return;
    }
    (async () => {
      try {
        const res = (await PostAPI.getPostDetail(selectedPostId)) as any;
        setSelectedRoom(res?.data ?? res);
      } catch (error) {
        console.error("Lỗi lấy chi tiết phòng:", error);
      }
    })();
  }, [selectedPostId]);

  useEffect(() => {
    // Fetch categories options
    const fetchCategories = async () => {
      try {
        const response = await PostAPI.getCategory() as any;
        setCategories(Array.isArray(response) ? response : (response.data || []));
      } catch (error) {
        console.error("Lỗi lấy danh mục:", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    // Perform search whenever url parameters change
    const performSearch = async () => {
      setLoading(true);
      try {
        const filter: any = {};
        const qKeyword = searchParams.get("keyword");
        const qCity = searchParams.get("city");
        const qDistrict = searchParams.get("district");
        const qCategory = searchParams.get("category");
        const qMinPrice = searchParams.get("minPrice");
        const qMaxPrice = searchParams.get("maxPrice");

        if (qKeyword) filter.keyword = qKeyword;
        if (qCity) filter.city = qCity;
        if (qDistrict) filter.district = qDistrict;
        if (qCategory) filter.category = qCategory;
        if (qMinPrice) filter.minPrice = Number(qMinPrice);
        if (qMaxPrice) filter.maxPrice = Number(qMaxPrice);

        const response = await PostAPI.searchPosts(filter) as any;
        setResults(response.content || response.data?.content || response.data || response || []);
      } catch (error) {
        console.error("Lỗi tìm kiếm:", error);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [searchParams]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.append("keyword", keyword.trim());
    if (city) params.append("city", city);
    if (district) params.append("district", district);
    if (category) params.append("category", category);
    if (minPrice) params.append("minPrice", minPrice);
    if (maxPrice) params.append("maxPrice", maxPrice);
    
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="w-full bg-[#f8fafc] min-h-screen">
      <div className="bg-teal-600 text-white text-center py-10 shadow-md">
        <h1 className="text-3xl font-bold">Tìm kiếm nâng cao</h1>
        <p className="mt-2 opacity-90">Tìm kiếm phòng trọ theo các tiêu chí chi tiết</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Filters */}
        <div className="lg:col-span-1">
          <form onSubmit={handleApplyFilter} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-5 sticky top-24">
            <h2 className="font-bold text-lg text-gray-800 border-b pb-3">Bộ lọc tìm kiếm</h2>
            
            {/* Từ khóa */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Từ khóa</label>
              <input 
                type="text" 
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" 
                placeholder="Nhập tên, địa chỉ..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>

            {/* Loại phòng */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Loại phòng</label>
              <select 
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Tất cả</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Tỉnh / TP */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tỉnh / Thành phố</label>
              <select 
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                value={city}
                onChange={(e) => { setCity(e.target.value); setDistrict(""); }}
              >
                <option value="">Toàn quốc</option>
                {provinces.map((p) => (
                  <option key={p.code} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Quận / Huyện */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Quận / Huyện</label>
              <select 
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white disabled:bg-gray-100"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                disabled={!city}
              >
                <option value="">{city ? "Tất cả quận/huyện" : "Chọn tỉnh/thành trước"}</option>
                {availableDistricts.map((d) => (
                  <option key={d.code} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Giá */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Khoảng giá (VNĐ)</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" 
                  placeholder="Từ"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <input 
                  type="number" 
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" 
                  placeholder="Đến"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit"
              className="mt-2 w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              Áp dụng lọc
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">
              Kết quả tìm kiếm
            </h2>
            <span className="text-teal-600 font-semibold bg-teal-50 px-3 py-1 rounded-full">
              {results.length} phòng
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center p-12">
              <span className="text-gray-500">Đang tìm kiếm...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {results.map((room) => (
                <RoomCardHome
                  key={room._id}
                  _id={room._id}
                  type={room.title}
                  price={room.price}
                  address={`${room.district}, ${room.city}`}
                  image={room.images?.[0] || 'https://via.placeholder.com/300x200'}
                  area={room.superficies ? `${room.superficies} m²` : undefined}
                  isSaved={room.isSaved}
                  badge={(room.isVip || room.priority === 'VIP' || room.priority === 1) ? 'VIP' : undefined}
                  onView={() => setSelectedPostId(room._id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">Không tìm thấy kết quả phù hợp</h3>
              <p className="text-gray-500">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để xem thêm các phòng khác.</p>
              <button 
                onClick={() => {
                  setKeyword(""); setCity(""); setDistrict(""); setCategory(""); setMinPrice(""); setMaxPrice("");
                  navigate("/search");
                }}
                className="mt-6 text-teal-600 font-semibold hover:underline"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Room Detail Modal */}
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
}
