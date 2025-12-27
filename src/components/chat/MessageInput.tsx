import React, { useRef, useState, useEffect } from 'react';
import { X, Image } from 'lucide-react';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (images?: File[]) => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChange,
  onSend,
  disabled = false,
}) => {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (document.activeElement !== inputRef.current) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const renamedFile = new File(
              [file],
              `pasted-${Date.now()}.${file.type.split('/')[1]}`,
              { type: file.type }
            );
            addImages([renamedFile]);
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const addImages = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    const newPreviewUrls = imageFiles.map(file => URL.createObjectURL(file));
    setSelectedImages(prev => [...prev, ...imageFiles]);
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) addImages(Array.from(files));
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    addImages(files);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    onSend(selectedImages.length > 0 ? selectedImages : undefined);
    
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedImages([]);
    setPreviewUrls([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white border-t border-gray-200">
      {previewUrls.length > 0 && (
        <div className="px-4 pt-3 pb-2 border-b border-gray-100">
          <div className="flex gap-2 flex-wrap">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="text-gray-500 hover:text-teal-600 hover:bg-teal-50 p-3 rounded-xl transition-colors disabled:opacity-50"
            title="Chọn ảnh (hoặc paste)"
          >
            <Image className="w-5 h-5" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />

          <div
            className="flex-1"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-800 placeholder-gray-500"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={disabled || (value.trim() === '' && selectedImages.length === 0)}
            className="bg-yellow-400 hover:bg-yellow-500 text-white p-3 rounded-xl transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};