import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "antd";
import "antd/dist/reset.css"; // ✅ THÊM DÒNG NÀY
import "./index.css"; // nếu có
import 'flowbite';
import { ToastProvider } from "./components/common/ToastProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#D97A36", // 🎨 Màu thương hiệu Roomie
          },
        }}
      >
        <ToastProvider>
          <App />
        </ToastProvider>
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
);
