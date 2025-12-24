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

const FavoriteRoomList: React.FC = () => {
  const [rooms, setRooms] = useState<RoomCardType[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomDetailType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Lấy danh sách phòng yêu thích
  useEffect(() => {
    const fetchFavoriteRooms = async () => {
      try {
        setLoading(true);
        const response = await PostAPI.getFavoritePosts() as any;
        const favorites = response.data || response || [];
        
        // Transform data từ API
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
            badge: post.category?.name || "Đã duyệt",
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

  // Lấy chi tiết phòng khi nhấn
  useEffect(() => {
    if (!selectedPostId) return;

    const fetchRoomDetail = async () => {
      try {
        setLoading(true);
        const res = await PostAPI.getPostDetail(selectedPostId) as any;
        setSelectedRoom(res);
        console.log("Selected room detail:", res);
      } catch (err: any) {
        console.error("Error fetching room detail:", err);
        setError(err.message || "Lỗi khi lấy dữ liệu chi tiết");
      } finally {
        setLoading(false);
      }
    };

    fetchRoomDetail();
  }, [selectedPostId]);

  // Callback để refresh danh sách khi có thay đổi favorite
  // const refreshFavorites = async () => {
  //   try {
  //     const response = await PostAPI.getFavoritePosts() as any;
  //     const favorites = response.data || response || [];
      
  //     const roomsData: RoomCardType[] = favorites.map((item: any) => {
  //       const post = item.post;
  //       return {
  //         _id: post._id,
  //         image: post.images?.[0] || "https://visaho.vn/upload_images/images/2022/04/01/phan-loai-can-ho-chung-cu-7.jpg",
  //         type: post.title,
  //         area: `${post.superficies ?? "--"} m²`,
  //         address: `${post.district}, ${post.city}`,
  //         rooms: 1,
  //         price: post.price.toLocaleString(),
  //         badge: post.category?.name || "Đã duyệt",
  //       };
  //     });

  //     setRooms(roomsData);
  //   } catch (err) {
  //     console.error("Error refreshing favorites:", err);
  //   }
  // };

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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách yêu thích...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-lg mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-teal-600 hover:text-teal-700 font-medium underline"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="mb-4">
          <svg
            className="w-24 h-24 mx-auto text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Chưa có phòng yêu thích
        </h3>
        <p className="text-gray-500 mb-6">
          Hãy khám phá và lưu những phòng trọ bạn thích
        </p>
        <a
          href="/"
          className="inline-block bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition"
        >
          Khám phá phòng trọ
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <RoomCard
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

      {/* Modal RoomDetail */}
      {selectedRoom && (
        <RoomDetail
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

export default FavoriteRoomList;