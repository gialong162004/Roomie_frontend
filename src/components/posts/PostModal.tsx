import React, { useState } from 'react';
import type { ChangeEvent } from 'react';
import { X, Upload, MapPin, DollarSign, Home, Wifi } from 'lucide-react';

interface Amenities {
  wifi: boolean;
  parking: boolean;
  aircon: boolean;
  wm: boolean;
  fridge: boolean;
  kitchen: boolean;
  toilet: boolean;
  security: boolean;
}

interface FormData {
  title: string;
  address: string;
  district: string;
  city: string;
  price: string;
  area: string;
  roomType: string;
  capacity: string;
  description: string;
  amenities: Amenities;
  contact: string;
  images: File[];
}

interface RoomRentalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
}

const RoomRentalModal: React.FC<RoomRentalModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    address: '',
    district: '',
    city: '',
    price: '',
    area: '',
    roomType: 'phong-tro',
    capacity: '1',
    description: '',
    amenities: {
      wifi: false,
      parking: false,
      aircon: false,
      wm: false,
      fridge: false,
      kitchen: false,
      toilet: false,
      security: false
    },
    contact: '',
    images: []
  });

  const handleSubmit = () => {
    if (!formData.title || !formData.address || !formData.district || !formData.city || 
        !formData.price || !formData.area || !formData.contact) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc (*)');
      return;
    }
    onSubmit(formData);
    onClose();
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    if (name.startsWith('amenities.')) {
      const amenity = name.split('.')[1] as keyof Amenities;
      setFormData(prev => ({
        ...prev,
        amenities: { ...prev.amenities, [amenity]: checked }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-2xl font-bold">Đăng Tin Cho Thuê Phòng Trọ</h2>
          <button
            onClick={onClose}
            className="hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Thông tin cơ bản */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Home className="mr-2 text-blue-600" size={20} />
              Thông Tin Cơ Bản
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiêu đề tin đăng *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="VD: Cho thuê phòng trọ giá rẻ gần trường ĐH..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại phòng *
                  </label>
                  <select
                    name="roomType"
                    value={formData.roomType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="phong-tro">Phòng trọ</option>
                    <option value="nha-nguyen-can">Nhà nguyên căn</option>
                    <option value="chung-cu-mini">Chung cư mini</option>
                    <option value="homestay">Homestay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sức chứa
                  </label>
                  <select
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1">1 người</option>
                    <option value="2">2 người</option>
                    <option value="3">3-4 người</option>
                    <option value="4">5+ người</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Địa chỉ */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <MapPin className="mr-2 text-blue-600" size={20} />
              Địa Chỉ
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ chi tiết *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Số nhà, tên đường..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quận/Huyện *
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    placeholder="VD: Quận 1, Huyện Bình Chánh..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tỉnh/Thành phố *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="VD: TP. Hồ Chí Minh"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Giá và diện tích */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <DollarSign className="mr-2 text-blue-600" size={20} />
              Giá & Diện Tích
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá thuê (VNĐ/tháng) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="VD: 2500000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diện tích (m²) *
                </label>
                <input
                  type="number"
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  placeholder="VD: 20"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Tiện ích */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Wifi className="mr-2 text-blue-600" size={20} />
              Tiện Ích
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key: 'wifi', label: 'WiFi' },
                { key: 'parking', label: 'Chỗ đậu xe' },
                { key: 'aircon', label: 'Điều hòa' },
                { key: 'wm', label: 'Máy giặt' },
                { key: 'fridge', label: 'Tủ lạnh' },
                { key: 'kitchen', label: 'Bếp' },
                { key: 'toilet', label: 'WC riêng' },
                { key: 'security', label: 'An ninh' }
              ].map(amenity => (
                <label key={amenity.key} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name={`amenities.${amenity.key}`}
                    checked={formData.amenities[amenity.key as keyof Amenities]}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{amenity.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Mô tả */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả chi tiết
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Mô tả về phòng trọ, môi trường xung quanh, quy định..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Hình ảnh */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hình ảnh
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
              <Upload className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-sm text-gray-600 mb-2">Kéo thả hoặc click để tải ảnh lên</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
              >
                Chọn ảnh
              </label>
              {formData.images.length > 0 && (
                <p className="text-sm text-green-600 mt-2">
                  Đã chọn {formData.images.length} ảnh
                </p>
              )}
            </div>
          </div>

          {/* Thông tin liên hệ */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số điện thoại liên hệ *
            </label>
            <input
              type="tel"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              placeholder="VD: 0901234567"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all font-medium"
            >
              Đăng Tin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomRentalModal;