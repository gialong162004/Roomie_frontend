import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, DollarSign, Home, Calendar, X, ChevronLeft, ChevronRight, Zap } from "lucide-react";

interface Post {
  _id: string;
  title: string;
  description: string;
  price: number;
  superficies: number;
  category?: { _id: string; name: string };
  address: string;
  images: string[];
  createdAt: string;
  statusApproval: boolean;
}

interface BoostPackage {
  id: string;
  label: string;
  days: number;
  price: number;
}

const BOOST_PACKAGES: BoostPackage[] = [
  { id: "3days", label: "3 ngày", days: 3, price: 29000 },
  { id: "7days", label: "7 ngày", days: 7, price: 59000 },
  { id: "30days", label: "30 ngày", days: 30, price: 199000 },
];

interface PostCardProps {
  post: Post;
  isOwner: boolean;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onBoost?: (postId: string, packageId: string) => void; // gọi API / redirect thanh toán
}

const PostCard = ({ post, isOwner, onEdit, onDelete, onBoost }: PostCardProps) => {
  const navigate = useNavigate();
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isBoostModalOpen, setIsBoostModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<BoostPackage>(BOOST_PACKAGES[1]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  const displayImages = post.images.slice(0, 4);
  const remainingCount = post.images.length - 4;

  const openViewer = (index: number) => {
    setCurrentImageIndex(index);
    setIsViewerOpen(true);
  };

  const nextImage = () =>
    setCurrentImageIndex((prev) => (prev + 1) % post.images.length);

  const prevImage = () =>
    setCurrentImageIndex((prev) => (prev - 1 + post.images.length) % post.images.length);

  const handleBoostConfirm = () => {
    if (onBoost) {
      onBoost(post._id, selectedPackage.id);
    }
    setIsBoostModalOpen(false);
  };

  return (
    <>
      <div className="bg-cardBg rounded-lg shadow-sm overflow-hidden hover:shadow-md transition border border-borderLight">
        <div className="flex flex-col sm:flex-row">
          {/* Phần ảnh bên trái */}
          <div className="sm:w-80 relative">
            <div className="grid grid-cols-2 gap-1 p-1">
              {displayImages.map((image, index) => (
                <div
                  key={index}
                  className={`relative cursor-pointer ${
                    displayImages.length === 1 ? "col-span-2 h-64" :
                    displayImages.length === 2 && index === 0 ? "col-span-2 h-40" :
                    displayImages.length === 3 && index === 0 ? "col-span-2 h-40" :
                    "h-32"
                  }`}
                  onClick={() => openViewer(index)}
                >
                  <img
                    src={image}
                    alt={`${post.title} ${index + 1}`}
                    className="w-full h-full object-cover rounded hover:opacity-90 transition"
                  />
                  {index === 3 && remainingCount > 0 && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded hover:bg-opacity-70 transition">
                      <span className="text-white text-2xl font-bold">+{remainingCount}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <span
              className={`absolute top-3 right-3 px-3 py-1 text-xs rounded-full font-medium shadow-md ${
                post.statusApproval === true
                  ? "bg-primary text-white"
                  : "bg-textGray text-white"
              }`}
            >
              {post.statusApproval === true ? "Đã duyệt" : "Chưa duyệt"}
            </span>
          </div>

          {/* Phần thông tin bên phải */}
          <div className="flex-1 p-5 flex flex-col">
            <h3 className="text-xl font-bold text-textDark hover:text-primary cursor-pointer mb-2 line-clamp-2">
              {post.title}
            </h3>

            <p className="text-sm text-textGray mb-3 line-clamp-2">
              {post.description}
            </p>

            <div className="flex items-center gap-4 mb-3 text-sm">
              <div className="flex items-center gap-1 text-textDark">
                <Home className="w-4 h-4" />
                <span className="font-medium">{post.category?.name}</span>
              </div>
              <div className="flex items-center gap-1 text-textDark">
                <span className="font-medium">{post.superficies}m²</span>
              </div>
            </div>

            <div className="flex items-start gap-2 text-textGray mb-4">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="text-sm line-clamp-1">{post.address}</span>
            </div>

            <div className="flex items-center justify-between mt-auto pt-3 border-t border-borderLight">
              <div className="flex items-center gap-1">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="text-lg font-bold text-primary">
                  {formatPrice(post.price)}
                </span>
              </div>

              <div className="flex items-center gap-1 text-textGray text-sm">
                <Calendar className="w-4 h-4" />
                <span>{new Date(post.createdAt).toLocaleDateString("vi-VN")}</span>
              </div>
            </div>

            {/* Nút hành động cho chủ bài đăng */}
            {isOwner && (
              <div className="flex gap-2 mt-3">
                {/* Nút đẩy bài - nổi bật nhất */}
                <button
                  onClick={() => navigate("/pricing")}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded transition text-sm font-medium shadow-sm"
                >
                  <Zap className="w-4 h-4" />
                  Đẩy bài
                </button>

                <button
                  onClick={() => onEdit?.(post._id)}
                  className="flex-1 px-4 py-2 text-primary border border-primary hover:bg-secondary rounded transition text-sm font-medium"
                >
                  Sửa
                </button>
                <button
                  onClick={() => onDelete?.(post._id)}
                  className="flex-1 px-4 py-2 text-red-600 border border-red-600 hover:bg-red-50 rounded transition text-sm font-medium"
                >
                  Xóa
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal đẩy bài ── */}
      {isBoostModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsBoostModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-textDark">Đẩy bài lên top</h2>
              </div>
              <button
                onClick={() => setIsBoostModalOpen(false)}
                className="text-textGray hover:text-textDark transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-textGray mb-5">
              Bài viết sẽ được hiển thị ưu tiên trên đầu kết quả tìm kiếm.
            </p>

            {/* Chọn gói */}
            <div className="flex flex-col gap-3 mb-6">
              {BOOST_PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition text-left ${
                    selectedPackage.id === pkg.id
                      ? "border-amber-500 bg-amber-50"
                      : "border-borderLight hover:border-amber-300"
                  }`}
                >
                  <div>
                    <p className="font-semibold text-textDark">{pkg.label}</p>
                    <p className="text-xs text-textGray">Hiển thị top {pkg.days} ngày</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-amber-600">{formatPrice(pkg.price)}</p>
                    {selectedPackage.id === pkg.id && (
                      <span className="text-xs text-amber-500 font-medium">Đã chọn ✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Tổng tiền + xác nhận */}
            <div className="border-t border-borderLight pt-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-textGray">Tổng thanh toán</span>
                <span className="text-xl font-bold text-amber-600">
                  {formatPrice(selectedPackage.price)}
                </span>
              </div>
              <button
                onClick={handleBoostConfirm}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Thanh toán &amp; Đẩy bài
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Image Viewer Modal ── */}
      {isViewerOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={() => setIsViewerOpen(false)}
        >
          <button
            onClick={() => setIsViewerOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition"
          >
            <X className="w-8 h-8" />
          </button>

          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white text-lg font-medium">
            {currentImageIndex + 1} / {post.images.length}
          </div>

          {post.images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-4 text-white hover:text-gray-300 transition"
            >
              <ChevronLeft className="w-12 h-12" />
            </button>
          )}

          <img
            src={post.images[currentImageIndex]}
            alt={`${post.title} ${currentImageIndex + 1}`}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {post.images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-4 text-white hover:text-gray-300 transition"
            >
              <ChevronRight className="w-12 h-12" />
            </button>
          )}

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] px-4">
            {post.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Thumbnail ${index + 1}`}
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }}
                className={`w-16 h-16 object-cover rounded cursor-pointer transition ${
                  currentImageIndex === index
                    ? "ring-2 ring-primary opacity-100"
                    : "opacity-50 hover:opacity-75"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default PostCard;