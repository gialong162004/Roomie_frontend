import { useState } from "react";
import RoomList from "../components/rooms/RoomList";
import SearchBar from "../components/layouts/SearchBar";
import RoomCard from "../components/rooms/RoomCard";

export default function Home() {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = (searchData: any) => {
    console.log("Dữ liệu tìm kiếm:", searchData);
  };

  const handleSearchResults = (results: any[]) => {
    setSearchResults(results);
    setIsSearchMode(true);
    setIsLoading(false);
  };

  const handleResetSearch = () => {
    setIsSearchMode(false);
    setSearchResults([]);
  };

  return (
    <div className="w-full">
      {/* Slide Section */}
      <section className="relative h-[85vh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://luxurydecor.vn/wp-content/uploads/2019/12/thiet-ke-noi-that-chung-cu-2-phong-ngu-6.jpg"
            alt="Luxury apartment"
            className="w-full h-full object-cover"
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/10"></div>
        </div>

        {/* Text content */}
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center text-white z-10 px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">
            Tìm căn hộ mơ ước của bạn
          </h1>
          <p className="text-lg md:text-xl mb-8 opacity-90">
            Dễ dàng tìm và đặt lịch xem phòng chỉ trong vài phút
          </p>
          <button className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-full font-medium shadow-lg transition">
            Khám phá ngay
          </button>
        </div>
      </section>

      {/* Search Bar */}
      <SearchBar 
        onSearch={handleSearch} 
        onSearchResults={handleSearchResults}
      />

      {/* Room List */}
      <main className="max-w-7xl mx-auto px-4 py-16">
        {isSearchMode && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-teal-600">
              Kết quả tìm kiếm ({searchResults.length} phòng)
            </h2>
            <button
              onClick={handleResetSearch}
              className="text-teal-600 hover:text-teal-700 font-medium underline"
            >
              Xem tất cả phòng
            </button>
          </div>
        )}

        {!isSearchMode && (
          <h2 className="text-2xl font-bold text-teal-600 mb-6 text-center">
            Danh sách phòng trọ
          </h2>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Đang tìm kiếm...</p>
          </div>
        ) : isSearchMode ? (
          searchResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((post) => (
                <RoomCard
                  key={post._id}
                  _id={post._id}
                  image={
                    post.images?.[0] ||
                    "https://visaho.vn/upload_images/images/2022/04/01/phan-loai-can-ho-chung-cu-7.jpg"
                  }
                  type={post.title}
                  area={post.superficies ? `${post.superficies} m²` : "-- m²"}
                  address={`${post.district}, ${post.city}`}
                  price={post.price.toLocaleString()}
                  badge={post.category?.name || "Đã duyệt"}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg mb-4">
                Không tìm thấy phòng trọ phù hợp
              </p>
              <button
                onClick={handleResetSearch}
                className="text-teal-600 hover:text-teal-700 font-medium underline"
              >
                Xem tất cả phòng
              </button>
            </div>
          )
        ) : (
          <RoomList />
        )}
      </main>
    </div>
  );
}