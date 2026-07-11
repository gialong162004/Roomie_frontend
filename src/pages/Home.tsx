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

  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [district, setDistrict] = useState(searchParams.get("district") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");

  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [isOpenFilterModal, setIsOpenFilterModal] = useState(false);

  const [categories, setCategories] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

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
    const fetchFavorites = async () => {
      try {
        const response = (await PostAPI.getFavoritePosts()) as any;
        const favorites = response?.data || response || [];
        const ids = favorites
          .map((item: any) => item?.post?._id || item?._id)
          .filter(Boolean);
        setFavoriteIds(new Set(ids));
      } catch (error) {
        console.error("Lỗi lấy danh sách yêu thích:", error);
      }
    };

    fetchFavorites();
  }, []);

  useEffect(() => {
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
    const pageFromUrl = Number(searchParams.get("page")) || 1;
    setCurrentPage(pageFromUrl);

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
        
        filter.page = pageFromUrl; 

        const response = await PostAPI.searchPosts(filter) as any;
        
        setResults(response.content || response.data?.content || response.data || response || []);
        
        const totalPages = response.pagination.totalPages;
        const totalItems = response.pagination.total;
        setTotalPages(totalPages);
        setTotal(totalItems);
      } catch (error) {
        console.error("Lỗi tìm kiếm:", error);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [searchParams]);

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    navigate(`/search?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.append("keyword", keyword.trim());
    if (city) params.append("city", city);
    if (district) params.append("district", district);
    if (category) params.append("category", category);
    if (minPrice) params.append("minPrice", minPrice);
    if (maxPrice) params.append("maxPrice", maxPrice);
    params.append("page", "1");
    setIsOpenFilterModal(false);
    navigate(`/search?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setKeyword("");
    setCity("");
    setDistrict("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setIsOpenFilterModal(false);
    navigate("/search?page=1");
  };

  // Hàm sinh cấu trúc mảng hiển thị các số trang (có dấu ba chấm "...") giống ảnh mẫu
  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    const pageRange = 2;
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || 
        i === totalPages || 
        (i >= currentPage - pageRange && i <= currentPage + pageRange)
      ) {
        pages.push(i);
      } else if (
        i === currentPage - pageRange - 1 || 
        i === currentPage + pageRange + 1
      ) {
        pages.push("...");
      }
    }

    // Loại bỏ các dấu ba chấm bị lặp lại đứng cạnh nhau
    return pages.filter((item, index) => pages.indexOf(item) === index);
  };

  const roomsWithFavoriteState = results.map((room) => ({
    ...room,
    isSaved: favoriteIds.has(room._id),
  }));

  return (
    <div className="w-full bg-[#f8fafc] min-h-screen flex flex-col justify-between">
      <div>
        {/* Header Banner */}
        <div className="bg-teal-600 text-white text-center py-10 shadow-md">
          <h1 className="text-3xl font-bold tracking-tight">Tìm kiếm nâng cao</h1>
          <p className="mt-1.5 opacity-90 text-sm">Tìm kiếm phòng trọ theo các tiêu chí chi tiết</p>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-4">
          
          {/* Khu vực Search Bar & Nút Bộ lọc */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 w-full">
            <form onSubmit={handleApplyFilter} className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="relative w-full flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400 text-sm">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Nhập tên phòng, địa chỉ..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-gray-50/40"
                />
              </div>
              
              <div className="flex w-full sm:w-auto gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpenFilterModal(true)}
                  className="flex items-center gap-2 px-4 py-3 bg-[#f7f7f7] hover:bg-[#eaeaea] text-gray-800 border border-gray-300 rounded-full text-sm font-medium transition-all shadow-sm active:scale-95 whitespace-nowrap"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" style={{ display: 'block', height: '14px', width: '14px', fill: 'currentColor' }} aria-hidden="true" focusable="false">
                    <path d="M5 8c1.306 0 2.418.835 2.83 2H14v2H7.83A2.997 2.997 0 0 1 5 14c-1.306 0-2.418-.835-2.83-2H2v-2h.17A2.997 2.997 0 0 1 5 8zm0 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm6-8a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM3 3h5v2H3V3zm11 0v2h-2V3h2z"></path>
                  </svg>
                  <span>Bộ lọc</span>
                </button>

                <button
                  type="submit"
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm w-full sm:w-auto"
                >
                  Tìm kiếm
                </button>
              </div>
            </form>
          </div>

          {/* Thanh đếm số lượng phòng */}
          <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100 w-full">
            <h2 className="text-lg font-bold text-gray-800">Kết quả tìm kiếm</h2>
            <span className="text-teal-600 font-semibold bg-teal-50 px-3.5 py-1 rounded-full text-xs md:text-sm">
              {total} phòng
            </span>
          </div>

          {/* Danh sách phòng */}
          {loading ? (
            <div className="flex justify-center items-center p-20 bg-white rounded-xl shadow-sm border border-gray-100 w-full">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-500 text-sm">Đang tải dữ liệu...</span>
              </div>
            </div>
          ) : roomsWithFavoriteState.length > 0 ? (
            <div className="flex flex-col gap-8 w-full">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8 justify-items-center mx-auto w-full">
                {roomsWithFavoriteState.map((room) => (
                  <RoomCardHome
                    key={room._id}
                    _id={room._id}
                    type={room.title}
                    price={formatPrice(room.price)}
                    address={`${room.district}, ${room.city}`}
                    image={room.images?.[0] || 'https://via.placeholder.com/300x200'}
                    area={room.superficies ? `${room.superficies} m²` : undefined}
                    isSaved={room.isSaved}
                    badge={(room.isVip || room.priority === 'VIP' || room.priority === 1) ? 'VIP' : undefined}
                    onView={() => setSelectedPostId(room._id)}
                  />
                ))}
              </div>

              {/* 📊 THANH PHÂN TRANG (Màu xanh Teal đồng bộ web) */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 py-4 mt-4 select-none">
                  {/* Nút lùi trang (<) */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>

                  {/* Danh sách các số trang */}
                  {renderPageNumbers().map((page, idx) => {
                    if (page === "...") {
                      return (
                        <span key={`dots-${idx}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">
                          ...
                        </span>
                      );
                    }

                    const isCurrent = page === currentPage;
                    return (
                      <button
                        key={`page-${page}`}
                        onClick={() => handlePageChange(page as number)}
                        className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium transition-all ${
                          isCurrent
                            ? "bg-teal-600 text-white shadow-sm shadow-teal-600/20"
                            : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  {/* Nút tiến trang (>) */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center w-full">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">Không tìm thấy kết quả phù hợp</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">Thử thay đổi thông số trong bộ lọc hoặc đặt lại để tìm các tin đăng khác.</p>
              <button 
                onClick={handleClearFilters}
                className="mt-6 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors border"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL BỘ LỌC TÌM KIẾM NÂNG CAO */}
      {isOpenFilterModal && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span>⚙️</span> Bộ lọc nâng cao
              </h3>
              <button 
                type="button"
                onClick={() => setIsOpenFilterModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-medium focus:outline-none p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyFilter} className="p-6 flex flex-col gap-4 overflow-y-auto flex-1">
              {/* Loại phòng */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Loại phòng</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Tất cả loại phòng</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Tỉnh / TP */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Tỉnh / Thành phố</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
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
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Quận / Huyện</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white disabled:bg-gray-100"
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

              {/* Khoảng giá */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Khoảng giá (VNĐ)</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="number" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" 
                    placeholder="Từ giá"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                  <span className="text-gray-400 text-xs">—</span>
                  <input 
                    type="number" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" 
                    placeholder="Đến giá"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t mt-2">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Đặt lại
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                >
                  Áp dụng bộ lọc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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