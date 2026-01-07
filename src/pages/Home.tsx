import { useEffect, useState } from "react";
import RoomList from "../components/rooms/RoomList";
import SearchBar from "../components/layouts/SearchBar";

export default function Home() {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(false);

  const handleSearch = (searchData: any) => {
    console.log("Dữ liệu tìm kiếm:", searchData);
  };

  const handleSearchResults = (results: any[]) => {
    setSearchResults(results);
    setIsSearchMode(true);
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
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/10"></div>
        </div>

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

        {/* Chỉ render RoomList và truyền props */}
        <RoomList 
          searchResults={searchResults}
          isSearchMode={isSearchMode}
        />
      </main>
    </div>
  );
}