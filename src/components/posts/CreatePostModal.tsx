import React, { useState, useEffect } from 'react';
import { X, Upload, Home, DollarSign, MapPin } from 'lucide-react';
import type { PostFormData } from '../../types/post.type';
import { PostAPI } from '../../api/api'
import { useToast } from "../common/ToastProvider";
import { provinces, districtsByProvince } from '../../constants/locations';

interface Post {
  _id: string;
  title: string;
  description: string;
  price: number;
  superficies: number;
  category: { _id: string; name: string };
  city: string;
  district: string;
  address: string;
  images: string[];
  createdAt: string;
  statusApproval: boolean;
}


interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPost?: Post | null;
  onSuccess?: () => void;
}

export default function CreatePostModal({ isOpen, onClose, editingPost, onSuccess }: CreatePostModalProps) {
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    description: '',
    superficies: 0,
    price: 0,
    category: '',
    city: '',
    district: '',
    ward: undefined,
    address: '',
    imageFiles: [],
  });

  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await PostAPI.getCategory() as any;
        setCategories(res);
      } catch (error) {
        console.error("Lỗi lấy danh mục:", error);
      }
    };

    fetchCategories();
  }, []);

  // Điền dữ liệu khi edit
  useEffect(() => {
    if (editingPost) {
      console.log("===== EDITING POST DATA =====");
      console.log("Full post:", editingPost);
      
      setFormData({
        title: editingPost.title,
        description: editingPost.description,
        superficies: editingPost.superficies,
        price: editingPost.price,
        category: editingPost.category?._id || '',
        city: editingPost.city || '',
        district: editingPost.district || '',
        ward: undefined,
        address: editingPost.address || '',
        imageFiles: [],
      });
    } else {
      // Reset form khi không edit
      setFormData({
        title: '',
        description: '',
        superficies: 0,
        price: 0,
        category: '',
        city: '',
        district: '',
        ward: undefined,
        address: '',
        imageFiles: [],
      });
    }
  }, [editingPost]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setFormData({ ...formData, imageFiles: files });
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      if (editingPost) {
        // Cập nhật bài đăng
        await PostAPI.updatePost(editingPost._id, formData);
        showToast("Cập nhật bài đăng thành công!", {
          type: "success",
          subtitle: "Bài đăng đã được cập nhật.",
        });
      } else {
        // Tạo bài đăng mới
        await PostAPI.createPost(formData);
        showToast("Đăng tin thành công!", {
          type: "success",
          subtitle: "Vui lòng chờ admin phê duyệt.",
        });
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        superficies: 0,
        price: 0,
        category: '',
        city: '',
        district: '',
        ward: undefined,
        address: '',
        imageFiles: [],
      });

      // Gọi callback success nếu có
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    } catch (error: any) {
      console.error(error);
      showToast(editingPost ? "Cập nhật thất bại!" : "Đăng tin thất bại!", {
        type: "error",
        subtitle: error?.response?.data?.message || "Vui lòng thử lại.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-cardBg rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-primary text-white px-6 py-4 rounded-t-2xl flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold">
            {editingPost ? 'Chỉnh Sửa Bài Đăng' : 'Đăng Tin Cho Thuê Phòng'}
          </h2>
          <button
            onClick={onClose}
            className="hover:bg-primaryDark p-2 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* Tiêu đề */}
          <div>
            <label className="block text-textDark font-semibold mb-2">
              Tiêu đề tin đăng <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              maxLength={100}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ví dụ: Phòng trọ giá rẻ gần trường ĐH Bách Khoa"
              className="w-full px-4 py-3 border-2 border-borderLight rounded-lg focus:border-primary focus:outline-none transition-colors"
              required
            />
            <p className="text-textGray text-sm mt-1">{formData.title.length}/100 ký tự</p>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-textDark font-semibold mb-2">
              Mô tả chi tiết <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả chi tiết về phòng trọ: tiện nghi, vị trí, quy định..."
              className="w-full px-4 py-3 border-2 border-borderLight rounded-lg focus:border-primary focus:outline-none transition-colors resize-none"
              required
            />
          </div>

          {/* Diện tích và Giá */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-textDark font-semibold mb-2">
                Diện tích (m²) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 -translate-y-1/2 text-textGray" size={20} />
                <input
                  type="number"
                  value={formData.superficies}
                  onChange={(e) => setFormData({ ...formData, superficies: Number(e.target.value) })}
                  placeholder="20"
                  className="w-full pl-10 pr-4 py-3 border-2 border-borderLight rounded-lg focus:border-primary focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-textDark font-semibold mb-2">
                Giá thuê (VNĐ) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-textGray" size={20} />
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  placeholder="2000000"
                  className="w-full pl-10 pr-4 py-3 border-2 border-borderLight rounded-lg focus:border-primary focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          {/* Danh mục */}
          <div>
            <label className="block text-textDark font-semibold mb-2">
              Danh mục <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 border-2 border-borderLight rounded-lg focus:border-primary focus:outline-none transition-colors bg-white"
              required
            >
              <option value="">Chọn danh mục</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tỉnh/Thành và Quận/Huyện */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-textDark font-semibold mb-2">
                Tỉnh/Thành phố <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value, district: '' })}
                className="w-full px-4 py-3 border-2 border-borderLight rounded-lg focus:border-primary focus:outline-none transition-colors bg-white"
                required
              >
                <option value="">Chọn tỉnh/thành</option>
                {provinces.map((prov) => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-textDark font-semibold mb-2">
                Quận/Huyện <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-4 py-3 border-2 border-borderLight rounded-lg focus:border-primary focus:outline-none transition-colors bg-white"
                required
                disabled={!formData.city}
              >
                <option value="">Chọn quận/huyện</option>
                {formData.city && districtsByProvince[formData.city]?.map((dist: string) => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Địa chỉ cụ thể */}
          <div>
            <label className="block text-textDark font-semibold mb-2">
              Địa chỉ cụ thể <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-textGray" size={20} />
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Số nhà, tên đường, phường/xã"
                className="w-full pl-10 pr-4 py-3 border-2 border-borderLight rounded-lg focus:border-primary focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          {/* Upload ảnh */}
          <div>
            <label className="block text-textDark font-semibold mb-2">
              Hình ảnh phòng trọ {!editingPost && <span className="text-red-500">*</span>}
            </label>
            <div className="border-2 border-dashed border-primary bg-secondary rounded-lg p-6 text-center hover:bg-primaryLight hover:bg-opacity-10 transition-colors cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="imageUpload"
                required={!editingPost}
              />
              <label htmlFor="imageUpload" className="cursor-pointer">
                <Upload className="mx-auto mb-3 text-primary" size={40} />
                <p className="text-textDark font-medium">
                  {editingPost ? 'Chọn ảnh mới (tùy chọn)' : 'Chọn nhiều ảnh'}
                </p>
                <p className="text-textGray text-sm mt-1">
                  {formData.imageFiles.length > 0 
                    ? `Đã chọn ${formData.imageFiles.length} ảnh mới` 
                    : editingPost 
                      ? `Đang sử dụng ${editingPost.images.length} ảnh hiện tại`
                      : 'Hỗ trợ: JPG, PNG (tối đa 10 ảnh)'}
                </p>
              </label>
            </div>

            {/* Hiển thị ảnh hiện tại khi edit */}
            {editingPost && editingPost.images.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {editingPost.images.slice(0, 4).map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`Ảnh ${index + 1}`}
                    className="w-full h-20 object-cover rounded border border-borderLight"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-borderLight text-textDark rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors shadow-md 
                ${loading 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-accent hover:bg-accentHover text-white"
                }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {editingPost ? 'Đang cập nhật...' : 'Đang đăng...'}
                </div>
              ) : (
                editingPost ? "Cập Nhật" : "Đăng Tin"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}