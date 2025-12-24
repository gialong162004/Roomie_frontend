// Danh sách tỉnh/thành phố
export const provinces: string[] = [
  "Hà Nội",
  "Hồ Chí Minh",
  "Đà Nẵng",
  "Hải Phòng",
  "Cần Thơ",
  "An Giang",
  "Bà Rịa - Vũng Tàu",
  "Bắc Giang",
  "Bắc Kạn",
  "Bạc Liêu",
  "Bình Dương",
  "Đồng Nai",
];

// Danh sách quận/huyện theo tỉnh/thành phố
export const districtsByProvince: { [key: string]: string[] } = {
  "Hà Nội": ["Hoàn Kiếm", "Ba Đình", "Đống Đa", "Hai Bà Trưng", "Cầu Giấy", "Thanh Xuân"],
  "Hồ Chí Minh": ["Quận 1", "Quận 2", "Quận 3", "Quận 4", "Quận 5", "Bình Thạnh", "Thủ Đức"],
  "Đà Nẵng": ["Hải Châu", "Thanh Khê", "Sơn Trà", "Ngũ Hành Sơn", "Liên Chiểu"],
  "Đồng Nai": ["Biên Hòa", "Long Thành", "Nhơn Trạch", "Trảng Bom"],
};

