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

const RoomList: React.FC = () => {
  const [rooms, setRooms] = useState<RoomCardType[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomDetailType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [favoritePosts, setFavoritePosts] = useState<Set<string>>(new Set());

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

  // Lấy danh sách phòng
  useEffect(() => {
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
      } catch (err: any) {
        setError(err.message || "Lỗi khi lấy dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  // Lấy chi tiết phòng khi nhấn
  useEffect(() => {
    if (!selectedPostId) return;

    const fetchRoomDetail = async () => {
      try {
        setLoading(true);
        const res = await PostAPI.getPostDetail(selectedPostId) as any;
        setSelectedRoom(res);
        console.log("selectRoom: ", res);
      } catch (err: any) {
        setError(err.message || "Lỗi khi lấy dữ liệu chi tiết");
      } finally {
        setLoading(false);
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

  return (
    <>
      {loading && <p>Đang tải dữ liệu...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {!loading &&
          !error &&
          rooms.map((room) => (
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

      {/* Modal RoomDetail */}
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
    </>
  );
};

export default RoomList;