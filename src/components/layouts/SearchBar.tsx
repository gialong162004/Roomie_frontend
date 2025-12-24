import { useState, useEffect } from "react";
import { PostAPI } from "../../api/api";
import { provinces, districtsByProvince } from "../../constants/locations";

interface SearchBarProps {
  onSearch: (searchData: any) => void;
  onSearchResults?: (results: any[]) => void;
}

export default function SearchBar({ onSearch, onSearchResults }: SearchBarProps) {
  const [searchData, setSearchData] = useState({
    keyword: "",
    category: "",
    minPrice: "",
    maxPrice: "",
    city: "",
    district: "",
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Lấy danh sách categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await PostAPI.getCategory();
        // Giả sử API trả về mảng categories
        setCategories(response.data || response);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (field: string, value: string) => {
    setSearchData((prev) => ({
      ...prev,
      [field]: value,
      // Reset district khi đổi city
      ...(field === "city" && { district: "" }),
    }));
  };

  const handleSearch = async () => {
    setIsSearching(true);

    try {
      // Tạo filter object, chỉ thêm các field có giá trị
      const filter: any = {};

      if (searchData.keyword) filter.keyword = searchData.keyword;
      if (searchData.category) filter.category = searchData.category;
      if (searchData.minPrice) filter.minPrice = Number(searchData.minPrice);
      if (searchData.maxPrice) filter.maxPrice = Number(searchData.maxPrice);
      if (searchData.city) filter.city = searchData.city;
      if (searchData.district) filter.district = searchData.district;

      console.log("Searching with filter:", filter);

      // Gọi API search
      const response = await PostAPI.searchPosts(filter);
      
      console.log("Search results:", response);
      const results = (response as any)?.content || [];

      // Callback với kết quả tìm kiếm
      if (onSearchResults) {
        onSearchResults(results);
      }

      // Callback với search data
      if (onSearch) {
        onSearch(searchData);
      }
    } catch (error) {
      console.error("Error searching posts:", error);
      // Trả về mảng rỗng nếu có lỗi
      if (onSearchResults) {
        onSearchResults([]);
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Xử lý khi nhấn Enter trong input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const availableDistricts = searchData.city
    ? districtsByProvince[searchData.city as keyof typeof districtsByProvince] || []
    : [];

  return (
    <section className="relative z-20 -mt-12 flex justify-center px-4">
      <div className="bg-white shadow-xl rounded-2xl px-6 py-6 w-full max-w-6xl">
        {/* Row 1: Keyword and Search Button */}
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, địa chỉ..."
            value={searchData.keyword}
            onChange={(e) => handleChange("keyword", e.target.value)}
            onKeyPress={handleKeyPress}
            className="border border-gray-300 rounded-lg px-4 py-2.5 flex-1 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className={`bg-teal-600 hover:bg-teal-700 text-white font-semibold px-8 py-2.5 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap ${
              isSearching ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isSearching ? "Đang tìm..." : "Tìm kiếm"}
          </button>
        </div>

        {/* Row 2: All other filters */}
        <div className="flex gap-4 w-full">
          {/* Category Select */}
          <select
            value={searchData.category}
            onChange={(e) => handleChange("category", e.target.value)}
            className="flex-1 min-w-0 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
          >
            <option value="">Tất cả loại phòng</option>
            {categories.map((cat) => (
              <option key={cat._id || cat.id} value={cat._id || cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Giá thấp nhất"
            value={searchData.minPrice}
            onChange={(e) => handleChange("minPrice", e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 min-w-0 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />

          <input
            type="number"
            placeholder="Giá cao nhất"
            value={searchData.maxPrice}
            onChange={(e) => handleChange("maxPrice", e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 min-w-0 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />

          <select
            value={searchData.city}
            onChange={(e) => handleChange("city", e.target.value)}
            className="flex-1 min-w-0 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
          >
            <option value="">Chọn tỉnh/thành phố</option>
            {provinces.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>

          <select
            value={searchData.district}
            onChange={(e) => handleChange("district", e.target.value)}
            disabled={!searchData.city}
            className="flex-1 min-w-0 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">
              {searchData.city ? "Chọn quận/huyện" : "Chọn tỉnh trước"}
            </option>
            {availableDistricts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}