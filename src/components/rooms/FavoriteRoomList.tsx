import React, { useState, useEffect, useMemo } from "react";
import RoomCardHome from "./RoomCardHome";
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
  userId?: { _id: string; name: string; phone?: string };
  superficies?: number;
}

interface FavoriteRoomListProps {
  searchQuery?: string;
  category?: string;
}

const FavoriteRoomList: React.FC<FavoriteRoomListProps> = ({
  searchQuery = "",
  category = "all",
}) => {
  const [rooms, setRooms] = useState<RoomCardType[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomDetailType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFavoriteRooms = async () => {
      try {
        setLoading(true);
        const response = await PostAPI.getFavoritePosts() as any;
        const favorites = response.data || response || [];

        const roomsData: RoomCardType[] = favorites.map((item: any) => {
          const post = item.post;
          return {
            _id: post._id,
            image: post.images?.[0] || "https://visaho.vn/upload_images/images/2022/04/01/phan-loai-can-ho-chung-cu-7.jpg",
            type: post.title,
            area: `${post.superficies ?? "--"} m²`,
            address: `${post.district}, ${post.city}`,
            rooms: 1,
            price: post.price.toLocaleString(),
            badge: post.category?.name || "Yêu thích",
          };
        });

        setRooms(roomsData);
      } catch (err: any) {
        console.error("Error fetching favorite rooms:", err);
        setError(err.message || "Lỗi khi lấy danh sách phòng yêu thích");
      } finally {
        setLoading(false);
      }
    };

    fetchFavoriteRooms();
  }, []);

  useEffect(() => {
    if (!selectedPostId) return;

    const fetchRoomDetail = async () => {
      try {
        setLoading(true);
        const res = await PostAPI.getPostDetail(selectedPostId) as any;
        setSelectedRoom(res);
      } catch (err: any) {
        console.error("Error fetching room detail:", err);
        setError(err.message || "Lỗi khi lấy dữ liệu chi tiết");
      } finally {
        setLoading(false);
      }
    };

    fetchRoomDetail();
  }, [selectedPostId]);

  // Filter theo searchQuery và category
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchSearch =
        searchQuery.trim() === "" ||
        room.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.address.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory =
        category === "all" ||
        (room.badge ?? "").toLowerCase() === category.toLowerCase();

      return matchSearch && matchCategory;
    });
  }, [rooms, searchQuery, category]);

  const getPostedTimeAgo = (updatedAt: string): string => {
    const diffMs = Date.now() - new Date(updatedAt).getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${Math.floor(diffHours / 24)} ngày trước`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-sm text-textGray">Đang tải danh sách yêu thích...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 text-sm mb-3">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-primary hover:text-primaryDark underline underline-offset-2"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-24">
        <svg className="w-16 h-16 mx-auto text-borderLight mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <h3 className="text-base font-semibold text-textDark mb-1">Chưa có phòng yêu thích</h3>
        <p className="text-sm text-textGray mb-5">Hãy khám phá và lưu những phòng trọ bạn thích</p>
        <a
          href="/"
          className="inline-block bg-primary hover:bg-primaryDark text-white text-sm font-medium px-5 py-2.5 rounded-lg transition"
        >
          Khám phá phòng trọ
        </a>
      </div>
    );
  }

  if (filteredRooms.length === 0) {
    return (
      <div className="text-center py-20">
        <svg className="w-14 h-14 mx-auto text-borderLight mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <h3 className="text-base font-semibold text-textDark mb-1">Không tìm thấy kết quả</h3>
        <p className="text-sm text-textGray">Thử tìm với từ khóa hoặc danh mục khác</p>
      </div>
    );
  }

  return (
    <>
      <p className="text-xs text-textGray mb-4">
        {filteredRooms.length} phòng{searchQuery || category !== "all" ? " phù hợp" : " đã lưu"}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
        {filteredRooms.map((room) => (
          <RoomCardHome
            key={room._id}
            _id={room._id}
            image={room.image}
            type={room.type}
            area={room.area}
            address={room.address}
            price={room.price}
            badge={room.badge}
            isSaved={true}
            onView={() => setSelectedPostId(room._id)}
          />
        ))}
      </div>

      {selectedRoom && (
        <RoomDetail
          postId={selectedRoom._id}
          images={
            selectedRoom.images.length > 0
              ? selectedRoom.images
              : ["https://visaho.vn/upload_images/images/2022/04/01/phan-loai-can-ho-chung-cu-7.jpg"]
          }
          type={selectedRoom.title}
          area={selectedRoom.superficies ? `${selectedRoom.superficies} m²` : "-- m²"}
          address={`${selectedRoom.address}, ${selectedRoom.district}, ${selectedRoom.city}`}
          price={selectedRoom.price.toLocaleString()}
          badge={selectedRoom.category?.name || "Đã duyệt"}
          description={selectedRoom.description}
          posterName={selectedRoom.userId?.name || selectedRoom.owner?.name}
          posterId={selectedRoom.userId?._id || selectedRoom.owner?._id}
          phone={selectedRoom.userId?.phone || selectedRoom.owner?.phone || "0123 456 789"}
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

export default FavoriteRoomList;