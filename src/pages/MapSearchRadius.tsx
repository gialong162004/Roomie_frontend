import { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaSearch, FaHome, FaRulerCombined, FaSpinner, FaTimes, FaList, FaMap } from 'react-icons/fa';

interface Room {
  _id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  district: string;
  ward?: string;
  price: number;
  superficies?: number;
  images?: string[];
}

interface RoomDetailModalProps {
  room: Room;
  onClose: () => void;
}

const MapSearchRadius = () => {
  const [searchAddress, setSearchAddress] = useState('');
  const [radius, setRadius] = useState(3);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showRoomDetail, setShowRoomDetail] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');

  // Mock data cho demo
  useEffect(() => {
    const mockRooms: Room[] = [
      {
        _id: "1",
        title: "Phòng trọ tiện nghi ngay UTE",
        description: "Gần SPKT, diện tích 30m2, an ninh",
        price: 3500000,
        city: "Hồ Chí Minh",
        district: "Thủ Đức",
        ward: "Hiệp Phú",
        address: "93a Quang Trung, Hiệp Phú, Thủ Đức, Hồ Chí Minh",
        superficies: 30,
        images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400"]
      },
      {
        _id: "2",
        title: "Phòng trọ Đặng Văn Bi",
        description: "Gần UTE, TDC diện tích 20m2",
        price: 3000000,
        city: "Hồ Chí Minh",
        district: "Thủ Đức",
        address: "111 Đặng Văn Bi, Thủ Đức, Hồ Chí Minh",
        superficies: 20,
        images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400"]
      },
      {
        _id: "3",
        title: "Phòng trọ ngã tư Hàng Xanh",
        description: "Gần UTH, HUTECH, diện tích 30m2",
        price: 3000000,
        city: "Hồ Chí Minh",
        district: "Bình Thạnh",
        address: "111 Võ Nguyên Giáp, Bình Thạnh, Hồ Chí Minh",
        images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400"]
      },
      {
        _id: "4",
        title: "Nhà nguyên căn Bình Thạnh",
        description: "Gần UTH, HUTECH, UE",
        price: 7000000,
        city: "Hồ Chí Minh",
        district: "Bình Thạnh",
        ward: "Linh Chiểu",
        address: "93a Quang Trung, Bình Thạnh, Hồ Chí Minh",
        images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400"]
      },
      {
        _id: "5",
        title: "Phòng trọ Hoàng Diệu",
        description: "Ngay SPKT, HUB",
        price: 2600000,
        city: "Hồ Chí Minh",
        district: "Thủ Đức",
        ward: "Linh Chiểu",
        address: "93a Hoàng Diệu, Thủ Đức, Hồ Chí Minh",
        images: ["https://images.unsplash.com/photo-1554995207-c18c203602cb?w=400"]
      }
    ];
    
    setAllRooms(mockRooms);
    setFilteredRooms(mockRooms);
  }, []);

  const calculateDistanceByAddress = (room: Room, searchQuery: string): number => {
    const fullAddress = `${room.address}, ${room.ward || ''}, ${room.district}, ${room.city}`.toLowerCase();
    const searchLower = searchQuery.toLowerCase();

    const normalizeKeyword = (text: string): string => {
      return text
        .replace(/đại học|trường|university/gi, '')
        .replace(/sư phạm kỹ thuật|spkt/gi, 'ute')
        .replace(/bách khoa|bk/gi, 'hcmut')
        .replace(/kinh tế|ktqd/gi, 'ueh')
        .trim();
    };

    const normalizedSearch = normalizeKeyword(searchLower);
    const normalizedRoom = normalizeKeyword(fullAddress);

    if (normalizedRoom.includes(normalizedSearch)) {
      return 1;
    }

    const extractDistrict = (addr: string): string => {
      const districtMatch = addr.match(/qu[aận]+ ?\d+|huy[eện]+ [^\,]+|th[ủị] đ[uức]+/i);
      return districtMatch ? districtMatch[0].toLowerCase() : '';
    };

    const landmarks: Record<string, string> = {
      'ute': 'thủ đức',
      'hcmut': 'quận 10', 
      'ueh': 'quận 1',
      'ton duc thang': 'quận 1',
      'van lang': 'quận 10',
      'fpt': 'quận 9',
      'rmit': 'quận 7',
      'su pham': 'quận 5'
    };

    let searchDistrict = extractDistrict(searchLower);
    if (!searchDistrict) {
      for (const [landmark, district] of Object.entries(landmarks)) {
        if (normalizedSearch.includes(landmark)) {
          searchDistrict = district;
          break;
        }
      }
    }

    const roomDistrict = extractDistrict(room.district.toLowerCase());

    if (searchDistrict && roomDistrict && roomDistrict === searchDistrict) {
      return 3;
    }

    const adjacentDistricts: Record<string, string[]> = {
      'quận 1': ['quận 3', 'quận 4', 'quận 5', 'quận 10', 'bình thạnh'],
      'quận 3': ['quận 1', 'quận 10', 'quận 11', 'bình thạnh', 'phú nhuận'],
      'quận 10': ['quận 1', 'quận 3', 'quận 6', 'quận 11', 'tân bình'],
      'thủ đức': ['quận 9', 'quận 2', 'bình thạnh'],
      'quận 9': ['thủ đức', 'quận 2']
    };

    if (searchDistrict && roomDistrict && adjacentDistricts[searchDistrict]?.some((d: string) => roomDistrict.includes(d))) {
      return 5;
    }

    const roomCity = room.city.toLowerCase();
    if (roomCity.includes('hồ chí minh') || roomCity.includes('tp.hcm') || roomCity.includes('sài gòn')) {
      return 10;
    }

    return 20;
  };

  const handleSearch = () => {
    if (!searchAddress.trim()) {
      alert('Vui lòng nhập địa chỉ cột mốc');
      return;
    }

    setIsSearching(true);
    
    const roomsInRadius = allRooms.filter(room => {
      const estimatedDistance = calculateDistanceByAddress(room, searchAddress);
      return estimatedDistance <= radius;
    });

    setFilteredRooms(roomsInRadius);
    setIsSearching(false);

    if (roomsInRadius.length === 0) {
      alert(`Không tìm thấy phòng trọ nào trong bán kính ${radius}km`);
    }
  };

  const RoomDetailModal = ({ room, onClose }: RoomDetailModalProps) => {
    const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(room.address)}&output=embed`;

    return (
      <div className="fixed inset-0 bg-black/50 flex justify-center items-start overflow-auto z-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-3xl w-full relative my-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
          >
            <FaTimes className="text-gray-600" />
          </button>

          <div className="relative">
            {room.images && room.images[0] ? (
              <img 
                src={room.images[0]} 
                alt={room.title} 
                className="w-full h-96 object-cover rounded-t-2xl" 
              />
            ) : (
              <div className="w-full h-96 bg-gray-200 flex items-center justify-center rounded-t-2xl">
                <FaHome className="text-6xl text-gray-400" />
              </div>
            )}
          </div>

          <div className="p-6 flex flex-col gap-4">
            <h2 className="text-2xl font-semibold">{room.title}</h2>
            <p className="text-gray-600">{room.description}</p>

            <div className="flex gap-4 text-gray-600 text-sm flex-wrap">
              {room.superficies && (
                <div className="flex items-center gap-1">
                  <FaRulerCombined className="text-blue-500" />
                  {room.superficies}m²
                </div>
              )}
              <div className="flex items-center gap-1">
                <FaMapMarkerAlt className="text-blue-500" />
                {room.address}
              </div>
            </div>

            <div className="text-blue-600 font-bold text-xl">
              {Number(room.price).toLocaleString()} VNĐ/tháng
            </div>

            <div className="mt-2 rounded-lg overflow-hidden border-2 border-blue-200">
              <iframe
                src={mapUrl}
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Vị trí phòng trọ"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaMapMarkerAlt className="text-blue-500" />
            Tìm phòng trọ theo bán kính
          </h1>
        </div>
      </div>

      {/* Search Form */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Địa chỉ cột mốc (Trường học, Quận/Huyện)
              </label>
              <input
                type="text"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                placeholder="VD: UTE, Bách Khoa, Quận 1, Thủ Đức..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Có thể tìm theo trường học: UTE, Bách Khoa, UEH, FPT... hoặc Quận/Huyện
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bán kính ước tính (km)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="2"
                  max="15"
                  step="1"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-blue-600 font-semibold min-w-[60px]">
                  {radius} km
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="flex-1 md:flex-initial px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSearching ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Đang tìm kiếm...
                </>
              ) : (
                <>
                  <FaSearch />
                  Tìm kiếm
                </>
              )}
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('map')}
                className={`px-4 py-3 rounded-lg flex items-center gap-2 transition-colors ${
                  viewMode === 'map' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <FaMap />
                <span className="hidden sm:inline">Bản đồ</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-3 rounded-lg flex items-center gap-2 transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <FaList />
                <span className="hidden sm:inline">Danh sách</span>
              </button>
            </div>
          </div>

          {allRooms.length > 0 && (
            <p className="mt-3 text-sm text-gray-600">
              Hiển thị {filteredRooms.length}/{allRooms.length} phòng trọ
            </p>
          )}
        </div>

        {/* Map View */}
        {viewMode === 'map' && filteredRooms.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FaMap className="text-blue-500" />
                Bản đồ các phòng trọ
                <span className="ml-2 bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full">
                  {filteredRooms.length} phòng
                </span>
              </h2>
            </div>
            <div className="rounded-lg overflow-hidden border-2 border-gray-200">
              <iframe
                src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31355.37!2d106.6297!3d10.8231!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDQ5JzIzLjIiTiAxMDbCsDM3JzQ2LjkiRQ!5e0!3m2!1sen!2s!4v1234567890`}
                width="100%"
                height="600"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Bản đồ phòng trọ"
              />
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Gợi ý:</strong> Nhấn vào marker trên bản đồ để xem thông tin chi tiết phòng trọ. 
                Chuyển sang chế độ "Danh sách" để xem thông tin đầy đủ hơn.
              </p>
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && filteredRooms.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaHome className="text-blue-500" />
              Danh sách phòng trọ
              <span className="ml-auto bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full">
                {filteredRooms.length} phòng
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRooms.map((room, index) => (
                <div
                  key={room._id}
                  onClick={() => {
                    setSelectedRoom(room);
                    setShowRoomDetail(true);
                  }}
                  className="border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-48 bg-gray-200">
                    {room.images && room.images[0] ? (
                      <img 
                        src={room.images[0]} 
                        alt={room.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <FaHome className="text-5xl" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      #{index + 1}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                      {room.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2 flex items-start gap-1">
                      <FaMapMarkerAlt className="text-gray-400 mt-1 flex-shrink-0" />
                      {room.address}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-blue-600 font-bold text-lg">
                        {Number(room.price).toLocaleString()} đ
                      </span>
                      {room.superficies && (
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <FaRulerCombined className="text-gray-400" />
                          {room.superficies}m²
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No results */}
        {filteredRooms.length === 0 && allRooms.length > 0 && searchAddress && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FaMapMarkerAlt className="text-5xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Không tìm thấy phòng trọ
            </h3>
            <p className="text-gray-500">
              Thử tìm kiếm với bán kính lớn hơn hoặc địa điểm khác
            </p>
          </div>
        )}

        {/* Empty state */}
        {allRooms.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FaHome className="text-5xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Chưa có phòng trọ nào
            </h3>
            <p className="text-gray-500">
              Hệ thống chưa có dữ liệu phòng trọ
            </p>
          </div>
        )}
      </div>

      {/* Room Detail Modal */}
      {showRoomDetail && selectedRoom && (
        <RoomDetailModal 
          room={selectedRoom}
          onClose={() => {
            setShowRoomDetail(false);
            setSelectedRoom(null);
          }}
        />
      )}
    </div>
  );
};

export default MapSearchRadius;