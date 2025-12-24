import React, { useState } from "react";
import Input from "../components/ui/Input";
import { AuthAPI } from "../api/api";
import { useNavigate, useLocation } from "react-router-dom";

export default function VerifyOTP() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email; // Lấy email từ register page

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage("❌ Không tìm thấy email để xác thực!");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Gọi API xác thực OTP
      const res = await AuthAPI.verifyRegister({ email, code: otp });
      console.log("✅ Verify success:", res.data);
      setMessage("✅ Xác thực thành công!");

      // Sau khi xác thực thành công → chuyển đến login
      setTimeout(() => navigate("/login"), 1500);
    } catch (err: any) {
      console.error("❌ Verify failed:", err);
      setMessage("❌ Mã OTP không hợp lệ hoặc đã hết hạn!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-secondary/30 via-secondary/10 to-primary/10">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center mb-4 text-primary">
          Xác thực mã OTP
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Vui lòng nhập mã OTP được gửi đến email của bạn
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <Input
            label="Mã OTP"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Nhập mã gồm 6 số"
            maxLength={6}
          />

          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary/80 disabled:bg-gray-400 transition"
          >
            {loading ? "Đang xác thực..." : "Xác nhận"}
          </button>
        </form>

        {message && (
          <p className="text-center text-sm mt-4 text-gray-700">{message}</p>
        )}
      </div>
    </div>
  );
}
