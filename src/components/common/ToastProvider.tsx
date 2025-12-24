import { createContext, useContext, useState, type ReactNode } from "react";
import Toast from "./Toast";

interface ToastItem {
  id: number;
  message: string;
  subtitle?: string;
  type?: "success" | "error" | "info";
  duration?: number;
}

interface ToastContextProps {
  showToast: (msg: string, opt?: Omit<ToastItem, "id" | "message">) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (message: string, options?: Omit<ToastItem, "id" | "message">) => {
    const newToast: ToastItem = {
      id: Date.now(),
      message,
      ...options,
    };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Render tất cả toast */}
      {toasts.map(t => (
        <Toast
          key={t.id}
          message={t.message}
          subtitle={t.subtitle}
          type={t.type}
          duration={t.duration}
          onClose={() => removeToast(t.id)}
        />
      ))}
    </ToastContext.Provider>
  );
};
