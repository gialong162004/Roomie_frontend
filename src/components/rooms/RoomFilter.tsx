import React, { useState } from "react";
import { Menu } from "lucide-react"; // chỉ cần icon Menu

const RoomFilter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [hasParking, setHasParking] = useState(false);

  return (
    <>
      {/* Nút menu (dùng chung cho mở & đóng) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-4 left-4 z-50 p-2 rounded-md shadow-lg transition-all duration-200
          ${isOpen ? "bg-white text-[#D97A36] border border-gray-200" : "bg-[#D97A36] text-white hover:bg-[#c96b28]"}
        `}
      >
        <Menu size={22} />
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-16 left-0 h-full bg-white shadow-xl transform transition-transform duration-300 z-40 w-72 
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex justify-center items-center px-5 py-4 border-b">
          <h2 className="text-xl font-bold text-[#D97A36]">Bộ lọc</h2>
        </div>

        <div className="p-5 overflow-y-auto h-[calc(100%-60px)]">
          {/* --- Giá thuê --- */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Khoảng giá (triệu/tháng)
            </label>
            <input
              type="range"
              min="0"
              max="10"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([0, Number(e.target.value)])}
              className="w-full accent-[#D97A36]"
            />
            <p className="text-sm text-gray-600 mt-1">
              Dưới {priceRange[1]} triệu
            </p>
          </div>

          {/* --- Loại phòng --- */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại phòng
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full border border-orange-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D97A36] focus:border-[#D97A36]"
            >
              <option value="">Tất cả</option>
              <option value="tro">Phòng trọ</option>
              <option value="chungcu">Chung cư mini</option>
              <option value="nhao">Nhà nguyên căn</option>
            </select>
          </div>

          {/* --- Có chỗ để xe --- */}
          <div className="mb-5">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={hasParking}
                onChange={(e) => setHasParking(e.target.checked)}
                className="text-[#D97A36] focus:ring-[#D97A36]"
              />
              <span className="ml-2 text-sm text-gray-700">Có chỗ để xe</span>
            </label>
          </div>

          {/* --- Nút áp dụng --- */}
          <button
            onClick={() =>
              alert(
                `Lọc với giá <= ${priceRange[1]} triệu, loại: ${
                  selectedType || "Tất cả"
                }, ${hasParking ? "có" : "không có"} chỗ để xe`
              )
            }
            className="w-full bg-[#D97A36] hover:bg-[#c96b28] text-white font-semibold py-2.5 rounded-lg focus:ring-4 focus:ring-orange-200 transition-all"
          >
            Áp dụng
          </button>
        </div>
      </div>
    </>
  );
};

export default RoomFilter;
