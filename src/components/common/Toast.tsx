import React, { useEffect, useState } from "react";
import { CircleCheck, Info, CircleX, X } from "lucide-react";

interface ToastProps {
  message: string;
  subtitle?: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  message,
  subtitle,
  type = "info",
  onClose,
  duration = 3000,
}) => {
  const [visible, setVisible] = useState(false);

  // Khi mount → hiển thị (hiệu ứng fade-in)
  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(showTimer);
  }, []);

  // Tự ẩn sau duration
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  // Gọi onClose sau khi animation ẩn xong
  useEffect(() => {
    if (!visible) {
      const timer = setTimeout(onClose, 300);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  const styleMap = {
    success: {
      iconColor: "text-green-500",
      borderColor: "border-green-500",
      Icon: CircleCheck,
    },
    error: {
      iconColor: "text-red-500",
      borderColor: "border-red-500",
      Icon: CircleX,
    },
    info: {
      iconColor: "text-blue-500",
      borderColor: "border-blue-500",
      Icon: Info,
    },
  }[type];

  const { iconColor, borderColor, Icon } = styleMap;

  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-start gap-3 bg-white shadow-lg rounded-lg px-4 py-3.5 w-[340px]
        border transform transition-all duration-300 ease-out
        ${borderColor} 
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0">
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-gray-900 font-semibold text-sm">{message}</div>
        {subtitle && <div className="text-gray-500 text-sm mt-0.5">{subtitle}</div>}
      </div>

      <button
        onClick={() => setVisible(false)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Toast;
