import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthAPI } from "../api/api";
import Toast from "../components/common/Toast";

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Lấy email được truyền ngầm từ trang Login qua bằng location.state
  const emailFromState = location.state?.email || "";

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; subtitle: string; type: "success" | "error" | "info" } | null>(null);

  // Nếu người dùng truy cập trực tiếp trang này mà không đi qua bước nhập Email ở Login, đá họ về trang Login lại
  useEffect(() => {
    if (!emailFromState) {
      setToast({
        message: "Lỗi truy cập",
        subtitle: "Không tìm thấy thông tin Email, quay lại trang đăng nhập...",
        type: "error",
      });
      setTimeout(() => navigate("/login"), 2000);
    }
  }, [emailFromState, navigate]);

  const showToast = (message: string, subtitle: string, type: "success" | "error" | "info") => {
    setToast({ message, subtitle, type });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim() || !newPassword.trim()) {
      showToast("Thiếu thông tin", "Vui lòng nhập đầy đủ mã xác nhận và mật khẩu mới!", "info");
      return;
    }

    try {
      setIsSubmitting(true);
      // Gọi API đổi mật khẩu trực tiếp bằng email, code và mật khẩu mới
      await AuthAPI.resetPassword(emailFromState, code, newPassword);

      showToast("Đặt lại thành công!", "Mật khẩu đã được thay đổi. Đang quay lại trang đăng nhập.", "success");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err: any) {
      console.error("❌ Reset password failed:", err);
      const msg = err?.response?.data?.message || "Đặt lại mật khẩu thất bại!";
      showToast(msg, "Vui lòng kiểm tra kỹ lại mã Code xác nhận.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-secondary/30 via-secondary/10 to-primary/10 p-4">
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-md flex flex-col gap-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Đặt lại mật khẩu</h2>
          <p className="text-sm text-gray-500 mt-1">
            Mã xác thực đã được gửi đến tài khoản: <br />
            <span className="font-semibold text-gray-700">{emailFromState || "Chưa xác định"}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          {/* Trường Code */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Mã xác thực (Code)</label>
            <input
              type="text"
              placeholder="Nhập mã code nhận được..."
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="one-time-code"
              className="w-full text-sm p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          {/* Trường Mật khẩu mới */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Mật khẩu mới</label>
            <input
              type="password"
              placeholder="Nhập mật khẩu mới..."
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full text-sm p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          {/* Nút gửi */}
          <button
            type="submit"
            disabled={isSubmitting || !emailFromState}
            className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50 mt-2"
          >
            {isSubmitting ? "Đang xử lý..." : "Xác nhận đổi mật khẩu"}
          </button>
        </form>
      </div>

      {/* Hiển thị thông báo Toast tương thích */}
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