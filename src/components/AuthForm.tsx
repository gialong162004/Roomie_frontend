import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "./ui/Input";
import type { RegisterPayload, LoginPayload } from "../types/auth.type";

/**
 * Thêm thuộc tính renderForgotPassword tùy chọn vào component
 */
type AuthFormProps =
  | {
      mode: "register";
      onSubmit: (data: RegisterPayload & { confirmPassword?: string }) => void | Promise<void>;
      renderForgotPassword?: () => React.ReactNode; // 👈 Nhận hàm render nút quên mật khẩu từ bên ngoài
    }
  | {
      mode: "login";
      onSubmit: (data: LoginPayload) => void | Promise<void>;
      renderForgotPassword?: () => React.ReactNode; // 👈 Nhận hàm render nút quên mật khẩu từ bên ngoài
    };

const AuthForm: React.FC<AuthFormProps> = (props) => {
  const navigate = useNavigate();
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const mode = props.mode;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "register") {
      if (!name || !email || !password || !confirmPassword || !phone) {
        alert("Vui lòng điền đầy đủ thông tin!");
        return;
      }

      if (password !== confirmPassword) {
        alert("Mật khẩu xác nhận không khớp!");
        return;
      }

      const payload: RegisterPayload & { confirmPassword?: string } = {
        name,
        email,
        password,
        phone,
        confirmPassword,
      };

      return props.onSubmit(payload);
    } else {
      if (!email || !password) {
        alert("Vui lòng nhập email và mật khẩu!");
        return;
      }

      const payload: LoginPayload = { email, password };
      return props.onSubmit(payload);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/95 shadow-xl rounded-2xl px-8 pt-8 pb-10 w-full max-w-md mx-auto border border-secondary"
    >
      <h2 className="text-3xl font-bold mb-6 text-center text-primary">
        {mode === "login" ? "Đăng nhập" : "Đăng ký"}
      </h2>

      <div className="space-y-5">
        {mode === "register" && (
          <Input
            label="Họ và tên"
            type="text"
            placeholder="Nhập họ và tên..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}

        <Input
          label="Email"
          type="email"
          placeholder="Nhập email..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Mật khẩu"
          type="password"
          placeholder="Nhập mật khẩu..."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {mode === "register" && (
          <>
            <Input
              label="Xác nhận mật khẩu"
              type="password"
              placeholder="Nhập lại mật khẩu..."
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Input
              label="Số điện thoại"
              type="text"
              placeholder="Nhập số điện thoại..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </>
        )}
      </div>

      <button
        type="submit"
        className="mt-8 w-full bg-primary hover:bg-primaryDark text-white font-semibold py-2.5 rounded-lg transition-all"
      >
        {mode === "login" ? "Đăng nhập" : "Đăng ký"}
      </button>

      <button
        type="button"
        onClick={() => navigate("/")}
        className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg transition-all border border-gray-300"
      >
        Tiếp tục với vai trò khách
      </button>

      {/* Khu vực link điều hướng phía dưới */}
      <div className="mt-6 text-center space-y-2">
        
        {/* 📍 Render nút "Quên mật khẩu?" nằm TRÊN dòng chữ đăng ký */}
        {mode === "login" && props.renderForgotPassword && (
          <div className="mb-2">
            {props.renderForgotPassword()}
          </div>
        )}

        {mode === "login" ? (
          <p className="text-sm text-gray-500">
            Chưa có tài khoản?{" "}
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="text-primary font-semibold hover:underline focus:outline-none"
            >
              Đăng ký ngay
            </button>
          </p>
        ) : (
          <p className="text-sm text-gray-500">
            Đã có tài khoản?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-primary font-semibold hover:underline focus:outline-none"
            >
              Đăng nhập
            </button>
          </p>
        )}
      </div>
    </form>
  );
};

export default AuthForm;