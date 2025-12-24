// ✅ Dữ liệu đăng ký gửi lên API
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone: string;
}

// ✅ Dữ liệu đăng nhập gửi lên API
export interface LoginPayload {
  email: string;
  password: string;
}

// Kiểu dữ liệu dùng cho form (có confirmPassword để validate tại client)
export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

// ✅ Dữ liệu form đăng nhập
export interface LoginFormData extends LoginPayload {}
