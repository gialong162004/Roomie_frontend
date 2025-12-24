import { useState } from 'react';
import { Bookmark, Search, Filter } from 'lucide-react';
import FavoriteRoomList from '../rooms/FavoriteRoomList';

export default function SavedPostsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const categories = ['all', 'Phòng trọ', 'Căn hộ', 'Nhà nguyên căn'];

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Integrated Header with Search */}
      <header className="bg-white border-b border-gray-200 sticky top-20 z-10 shadow-sm z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Desktop Layout */}
          <div className="hidden md:flex items-center gap-6">
            {/* Left: Title */}
            <div className="flex items-center gap-3 min-w-fit">
              <div className="bg-teal-600 p-2 rounded-lg">
                <Bookmark className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-700">Phòng Đã Lưu</h1>
                <p className="text-sm text-slate-500">Danh sách phòng trọ đã lưu</p>
              </div>
            </div>

            {/* Right: Search & Filter
            <div className="flex-1 flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Tìm kiếm phòng trọ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent text-slate-700"
                />
              </div>

              <div className="flex items-center gap-2 min-w-fit">
                <Filter className="w-5 h-5 text-slate-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 text-slate-700 bg-white"
                >
                  <option value="all">Tất cả</option>
                  {categories.slice(1).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div> */}
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden space-y-4">
            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="bg-teal-600 p-2 rounded-lg">
                <Bookmark className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-700">Phòng Đã Lưu</h1>
                <p className="text-sm text-slate-500">Danh sách phòng trọ đã lưu</p>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Tìm kiếm phòng trọ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent text-slate-700"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-slate-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 text-slate-700 bg-white"
                >
                  <option value="all">Tất cả</option>
                  {categories.slice(1).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FavoriteRoomList />
      </div>
    </div>
  );
}