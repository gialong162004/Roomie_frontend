import type { ReactNode } from "react";
import { AlertCircle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: ReactNode;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClassName?: string;
  cancelButtonClassName?: string;
}

const ConfirmModal = ({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  confirmButtonClassName = "bg-amber-500 text-white hover:bg-amber-600",
  cancelButtonClassName = "border border-borderLight text-textGray hover:bg-gray-50",
}: ConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-amber-50 p-2 text-amber-500">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-textDark">{title}</h3>
            </div>
          </div>
          <button onClick={onCancel} className="text-textGray transition hover:text-textDark" aria-label="Đóng">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 text-sm leading-relaxed text-textGray">{description}</div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className={`flex-1 rounded-xl py-2 text-sm transition ${cancelButtonClassName}`}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${confirmButtonClassName}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
