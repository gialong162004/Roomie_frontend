import AuthForm from "../components/AuthForm";
import { AuthAPI } from "../api/api";
import type { RegisterPayload } from "../types/auth.type";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const handleRegister = async (data: RegisterPayload & { confirmPassword?: string }) => {
    try {
      // 🔒 Kiểm tra mật khẩu xác nhận
      if (data.password !== data.confirmPassword) {
        alert("Mật khẩu xác nhận không khớp!");
        return;
      }

      // 📡 Gọi API backend
      const res = await AuthAPI.register({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
      });

      console.log("✅ Register success:", res);

      // 🟢 Thay vì navigate login, chuyển sang trang OTP
      navigate("/verify-otp", { state: { email: data.email } });
    } catch (err: any) {
      console.error("❌ Register failed:", err);
      alert(err?.message || "Đăng ký thất bại, vui lòng thử lại!");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-secondary/30 via-secondary/10 to-primary/10">
      <div className="w-full max-w-md">
        <AuthForm mode="register" onSubmit={handleRegister} />
      </div>
    </div>
  );
}
