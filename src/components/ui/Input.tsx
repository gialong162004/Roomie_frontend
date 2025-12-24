import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  labelClassName?: string;
  className?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  type = "text",
  labelClassName,
  className,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className="relative">
      {/* Label */}
      <label
        className={`block text-sm font-medium mb-1 ${
          labelClassName || "text-textDark"
        }`}
      >
        {label}
      </label>

      {/* Input */}
      <div className="relative">
        <input
          {...props}
          type={inputType}
          className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 transition-all pr-10 placeholder:text-gray-400
            ${className || "border-inputBorder focus:ring-primary focus:border-primary"}`}
        />

        {/* Nút ẩn/hiện mật khẩu */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-textGray hover:text-primary focus:outline-none"
          >
            {showPassword ? (
              <EyeOff size={18} strokeWidth={2} />
            ) : (
              <Eye size={18} strokeWidth={2} />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default Input;
