import React, { useState, useEffect } from "react";
import RoomCard from "./RoomCard";
import RoomDetail from "./RoomDetail";
import { PostAPI } from "../../api/api";

interface RoomCardType {
  _id: string;
  image: string;
  type: string;
  area?: string;
  address: string;
  rooms?: number;
  price: string;
  badge?: string;
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
  category?: { id: string; name: string };
  updatedAt: string;
  owner?: { _id: string; name: string; phone?: string };
  superficies?: number;
}

interface RoomListProps {
  searchResults?: any[];
  isSearchMode?: boolean;
}

const ITEMS_PER_PAGE = 6;

const RoomList: React.FC<RoomListProps> = ({ 
  searchResults = [], 
  isSearchMode = false 
}) => {
  const [rooms, setRooms] = useState<RoomCardType[]>([]);
  const [displayedRooms, setDisplayedRooms] = useState<RoomCardType[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomDetailType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [favoritePosts, setFavoritePosts] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Lấy danh sách bài đăng yêu thích
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await PostAPI.getFavoritePosts();
        const favorites = response.data;
        const favoriteIds = favorites.map((item: any) => item.post._id);
        setFavoritePosts(new Set(favoriteIds));
      } catch (error) {
        console.error("Error fetching favorites:", error);
      }
    };

    fetchFavorites();
  }, []);

  // Lấy danh sách phòng (hoặc sử dụng search results)
  useEffect(() => {
    // Nếu đang ở search mode và có kết quả search
    if (isSearchMode && searchResults.length >= 0) {
      const searchRoomsData: RoomCardType[] = searchResults.map((post: any) => ({
        _id: post._id,
        image: post.images?.[0] || "https://visaho.vn/upload_images/images/2022/04/01/phan-loai-can-ho-chung-cu-7.jpg",
        type: post.title,
        area: post.superficies ? `${post.superficies} m²` : "-- m²",
        address: `${post.district}, ${post.city}`,
        rooms: 1,
        price: post.price.toLocaleString(),
        badge: post.category?.name || "Đã duyệt",
      }));
      
      setRooms(searchRoomsData);
      setTotalPages(Math.ceil(searchRoomsData.length / ITEMS_PER_PAGE));
      setDisplayedRooms(searchRoomsData.slice(0, ITEMS_PER_PAGE));
      setCurrentPage(1);
      setLoading(false);
      return;
    }

    // Nếu không phải search mode, fetch tất cả phòng
    if (!isSearchMode) {
      const fetchRooms = async () => {
        try {
          setLoading(true);
          const res = await PostAPI.getPost() as any;
          const roomsData: RoomCardType[] = (res.content || []).map((post: any) => ({
            _id: post._id,
            image: post.images[0] || "https://visaho.vn/upload_images/images/2022/04/01/phan-loai-can-ho-chung-cu-7.jpg",
            type: post.title,
            area: `${post.superficies ?? "--"} m²`,
            address: `${post.district}, ${post.city}`,
            rooms: 1,
            price: post.price.toLocaleString(),
            badge: post.category?.name || "Đã duyệt",
          }));
          
          setRooms(roomsData);
          setTotalPages(Math.ceil(roomsData.length / ITEMS_PER_PAGE));
          setDisplayedRooms(roomsData.slice(0, ITEMS_PER_PAGE));
          setCurrentPage(1);
        } catch (err: any) {
          setError(err.message || "Lỗi khi lấy dữ liệu");
        } finally {
          setLoading(false);
        }
      };

      fetchRooms();
    }
  }, [isSearchMode, searchResults]);

  // Lấy chi tiết phòng khi nhấn
  useEffect(() => {
    if (!selectedPostId) return;

    const fetchRoomDetail = async () => {
      try {
        const res = await PostAPI.getPostDetail(selectedPostId) as any;
        setSelectedRoom(res);
        console.log("selectRoom: ", res);
      } catch (err: any) {
        setError(err.message || "Lỗi khi lấy dữ liệu chi tiết");
      }
    };

    fetchRoomDetail();
  }, [selectedPostId]);

  const getPostedTimeAgo = (updatedAt: string) => {
    const updatedTime = new Date(updatedAt).getTime();
    const now = Date.now();
    const diffMs = now - updatedTime;

    const diffMinutes = Math.floor(diffMs / 1000 / 60);
    if (diffMinutes < 60) {
      return `${diffMinutes} phút trước`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    }

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
  };

  const handlePageChange = (page: number) => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    setDisplayedRooms(rooms.slice(startIndex, endIndex));
    setCurrentPage(page);
  };

  const getPaginationButtons = () => {
    const buttons = [];
    const maxButtons = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(i);
    }
    
    return buttons;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-sm text-textGray">
          Hiển thị <span className="font-semibold text-textDark">{displayedRooms.length}</span> / <span className="font-semibold text-textDark">{rooms.length}</span> phòng
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Hiển thị khi search không có kết quả */}
      {!loading && isSearchMode && rooms.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg mb-4">
            Không tìm thấy phòng trọ phù hợp
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {!loading &&
          !error &&
          displayedRooms.map((room) => (
            <RoomCard
              key={room._id}
              _id={room._id}
              image={room.image}
              type={room.type}
              area={room.area}
              address={room.address}
              price={room.price}
              badge={room.badge}
              isSaved={favoritePosts.has(room._id)}
              onView={() => setSelectedPostId(room._id)}
            />
          ))}
      </div>

      {!loading && rooms.length > ITEMS_PER_PAGE && (
        <div className="flex justify-center items-center gap-2 py-8">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg border border-borderLight hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-textDark"
          >
            ← Trước
          </button>

          {currentPage > 3 && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                className="px-4 py-2 rounded-lg border border-borderLight hover:bg-secondary transition-colors text-textDark"
              >
                1
              </button>
              {currentPage > 4 && <span className="px-2 text-textGray">...</span>}
            </>
          )}

          {getPaginationButtons().map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                currentPage === page
                  ? "bg-primary text-white border-primary"
                  : "border-borderLight hover:bg-secondary text-textDark"
              }`}
            >
              {page}
            </button>
          ))}

          {currentPage < totalPages - 2 && (
            <>
              {currentPage < totalPages - 3 && <span className="px-2 text-textGray">...</span>}
              <button
                onClick={() => handlePageChange(totalPages)}
                className="px-4 py-2 rounded-lg border border-borderLight hover:bg-secondary transition-colors text-textDark"
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg border border-borderLight hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-textDark"
          >
            Sau →
          </button>
        </div>
      )}

      {!loading && !error && !isSearchMode && rooms.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-textGray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-textDark">Chưa có phòng nào</h3>
          <p className="mt-1 text-sm text-textGray">Hiện tại chưa có bài đăng cho thuê phòng nào.</p>
        </div>
      )}

      {selectedRoom && (
        <RoomDetail
          images={selectedRoom.images.length > 0 
            ? selectedRoom.images 
            : ["https://visaho.vn/upload_images/images/2022/04/01/phan-loai-can-ho-chung-cu-7.jpg"]
          }
          type={selectedRoom.title}
          area={selectedRoom.superficies ? `${selectedRoom.superficies} m²` : "-- m²"}
          address={`${selectedRoom.address}, ${selectedRoom.district}, ${selectedRoom.city}`}
          price={selectedRoom.price.toLocaleString()}
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
    </div>
  );
};

export default RoomList;