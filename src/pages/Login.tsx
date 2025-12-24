import AuthForm from "../components/AuthForm";
import { AuthAPI } from "../api/api";
import type { LoginPayload } from "../types/auth.type";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Toast from "../components/common/Toast"; // 👈 import Toast

export default function Login() {
  const navigate = useNavigate();
  const [toast, setToast] = useState<{ message: string; subtitle:string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, subtitle:string, type: "success" | "error" | "info") => {
    setToast({ message, subtitle, type });
  };

  const handleLogin = async (data: LoginPayload) => {
    try {
      const res = await AuthAPI.login({
        email: data.email,
        password: data.password,
      });

      console.log("✅ Full response:", res);

      const { token, user, message } = res.data || res || {};

      if (!token || !user) {
        showToast(message || "Không nhận được dữ liệu hợp lệ từ máy chủ!", "", "error");
        return;
      }

      // Lưu thông tin đăng nhập
      if (token) localStorage.setItem("token", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));

      // Thông báo thành công
      showToast("Đăng nhập thành công!", "Đang chuyển hướng đến trang chủ", "success");
      setTimeout(() => navigate("/"), 1500); // chuyển trang sau 1.5s
    } catch (err: any) {
      console.error("❌ Login failed:", err);
      const msg = err?.response?.data?.message || "Đăng nhập thất bại!";
      showToast(msg, `${JSON.stringify(err.error)} vui lòng liên hệ ...`, "error");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-secondary/30 via-secondary/10 to-primary/10">
      <div className="w-full max-w-md">
        <AuthForm mode="login" onSubmit={handleLogin} />
      </div>

      {/* Hiển thị toast */}
      {toast && (
        <Toast
          message={toast.message}
          subtitle={toast.subtitle}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
