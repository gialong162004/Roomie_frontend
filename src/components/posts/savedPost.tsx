import { useState } from 'react';
import { Bookmark, Search, SlidersHorizontal, X } from 'lucide-react';
import FavoriteRoomList from '../rooms/FavoriteRoomList';

export default function SavedPostsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { value: 'all', label: 'Tất cả' },
    { value: 'Phòng trọ', label: 'Phòng trọ' },
    { value: 'Căn hộ', label: 'Căn hộ' },
    { value: 'Nhà nguyên căn', label: 'Nhà nguyên căn' },
  ];

  return (
    <div className="min-h-screen bg-background">

      {/* Sticky header */}
      <div className="sticky top-20 z-20 bg-white/80 backdrop-blur border-b border-borderLight">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Title row */}
          <div className="flex items-center gap-3 pt-5 pb-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <Bookmark className="w-4.5 h-4.5 text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-textDark leading-tight">Phòng đã lưu</h1>
              <p className="text-xs text-textGray">Danh sách phòng trọ yêu thích của bạn</p>
            </div>
          </div>

          {/* Search + filter row */}
          <div className="flex items-center gap-2 pb-4">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textGray pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm kiếm phòng trọ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-borderLight bg-background text-textDark placeholder-textGray focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-textGray hover:text-textDark transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category filter — chips on md+, select on mobile */}
            <div className="hidden sm:flex items-center gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${
                    selectedCategory === cat.value
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-textGray border-borderLight hover:border-primary hover:text-primary'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Mobile: dropdown */}
            <div className="sm:hidden flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-textGray flex-shrink-0" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-sm py-2 pl-2 pr-6 rounded-lg border border-borderLight text-textDark bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FavoriteRoomList searchQuery={searchQuery} category={selectedCategory} />
      </div>

    </div>
  );
}