import AuthForm from "../components/AuthForm";
import { AuthAPI, SurveyAPI } from "../api/api";
import type { LoginPayload } from "../types/auth.type";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Toast from "../components/common/Toast";

export default function Login() {
  const navigate = useNavigate();
  const [toast, setToast] = useState<{ message: string; subtitle:string; type: "success" | "error" | "info" } | null>(null);

  // 🔐 State quản lý Popup Quên mật khẩu
  const [showForgotPopup, setShowForgotPopup] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);

  const showToast = (message: string, subtitle:string, type: "success" | "error" | "info") => {
    setToast({ message, subtitle, type });
  };

  const handleLogin = async (data: LoginPayload) => {
    try {
      const res = await AuthAPI.login({
        email: data.email,
        password: data.password,
      });

      const { token, user, message } = res.data || res || {};

      if (!token || !user) {
        showToast(message || "Không nhận được dữ liệu hợp lệ!", "", "error");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Kiểm tra trạng thái khảo sát và lưu flag vào localStorage thay vì mở modal ngay
      try {
        const statusRes = await SurveyAPI.checkServerStatus() as any;
        if (!statusRes.done) {
          localStorage.setItem("showSurvey", "true");
        }
      } catch (err) {
        console.error("Lỗi kiểm tra khảo sát:", err);
      }

      showToast("Đăng nhập thành công!", "Đang chuyển hướng...", "success");
      navigate("/"); // Chuyển hướng về Home
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Đăng nhập thất bại!";
      showToast(msg, "Vui lòng kiểm tra lại thông tin.", "error");
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      showToast("Thiếu thông tin", "Vui lòng nhập email của bạn!", "info");
      return;
    }

    try {
      setIsSubmittingForgot(true);
      await AuthAPI.forgotPassword(forgotEmail);
      
      showToast("Đã gửi mã xác nhận!", "Vui lòng kiểm tra hộp thư email của bạn.", "success");
      setShowForgotPopup(false);
      setTimeout(() => {
        navigate("/reset-password", { state: { email: forgotEmail } });
      }, 1500);
    } catch (err: any) {
      console.error("❌ Forgot password failed:", err);
      const msg = err?.response?.data?.message || "Yêu cầu thất bại, vui lòng thử lại!";
      showToast(msg, "Không thể gửi mã xác nhận đến email này.", "error");
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-secondary/30 via-secondary/10 to-primary/10 p-4">
      <div className="w-full max-w-md">
        {/* Truyền hàm render nút quên mật khẩu vào prop của AuthForm */}
        <AuthForm 
          mode="login" 
          onSubmit={handleLogin} 
          renderForgotPassword={() => (
            <button
              type="button"
              onClick={() => setShowForgotPopup(true)}
              className="text-sm text-primary hover:underline font-semibold transition-colors focus:outline-none"
            >
              Quên mật khẩu?
            </button>
          )}
        />
      </div>

      {/* 🛠️ Giao diện Popup nhập Email */}
      {showForgotPopup && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-fadeIn">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Quên mật khẩu</h3>
            <p className="text-xs text-gray-500 mb-4">Nhập email của bạn để nhận mã xác thực thiết lập lại mật khẩu.</p>
            
            <form onSubmit={handleForgotPasswordSubmit} className="flex flex-col gap-4">
              <input
                type="email"
                placeholder="example@gmail.com"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full text-sm p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              />
              <div className="flex justify-end gap-2 text-sm font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPopup(false);
                    setForgotEmail("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingForgot}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSubmittingForgot ? "Đang gửi..." : "Gửi mã"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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