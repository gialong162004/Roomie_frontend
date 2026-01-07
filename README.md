# 🏠 ROOMIE – Website hỗ trợ tìm kiếm phòng trọ (MERN Stack)

Roomie là website hỗ trợ tìm kiếm phòng trọ, nhà trọ dành cho sinh viên và người đi làm.  
Hệ thống được xây dựng theo kiến trúc MERN Stack, cho phép người dùng tìm kiếm, xem chi tiết phòng trọ và liên hệ trực tiếp với chủ trọ.

🌐 Website demo:  
https://roomie-frontend-ochre.vercel.app/

---

## 🎯 Mục tiêu đề tài

- Xây dựng website hỗ trợ tìm kiếm phòng trọ trực tuyến
- Giúp người thuê phòng tiếp cận thông tin phòng trọ nhanh chóng và chính xác
- Hỗ trợ chủ trọ đăng tin và quản lý phòng cho thuê
- Áp dụng kiến thức MERN Stack vào một sản phẩm thực tế

---

## 🧩 Công nghệ sử dụng

### Frontend
- ReactJS
- TypeScript
- Vite
- Tailwind CSS
- Axios
- React Router

### Backend
- Node.js
- Express.js
- RESTful API
- JWT Authentication

### Database
- MongoDB
- Mongoose

### Triển khai
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

---

## ✨ Chức năng chính

### Người dùng
- Đăng ký / Đăng nhập tài khoản
- Tìm kiếm phòng trọ theo vị trí, giá tiền, loại phòng
- Xem chi tiết phòng trọ (hình ảnh, mô tả, giá, tiện ích)
- Liên hệ trực tiếp với chủ trọ
- Lưu phòng trọ yêu thích

### Chủ trọ
- Đăng tin phòng trọ
- Chỉnh sửa tin đăng
- Xóa tin đăng
- Quản lý danh sách phòng trọ

---

## 🏗️ Kiến trúc hệ thống

Frontend (React + Vite)
|
| RESTful API
|
Backend (Node.js + Express)
|
|
MongoDB


---

## 🚀 Hướng dẫn chạy dự án (Local)

### Yêu cầu hệ thống
- Node.js >= 18
- npm hoặc yarn
- MongoDB (local hoặc MongoDB Atlas)

### Clone project

```bash
git clone <repository-url>
cd roomie
```


### Cấu hình Backend

```bash
cd backend
npm install
```

Tạo file `.env`:


PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret


Chạy backend:

```bash
npm run dev
```

### Cấu hình Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Truy cập:


http://localhost:5173


---

## 📁 Cấu trúc thư mục


```bash
roomie/
├── backend/
│ ├── controllers/
│ ├── models/
│ ├── routes/
│ ├── middlewares/
│ └── server.js
│
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ ├── pages/
│ │ ├── services/
│ │ └── App.tsx
│ └── vite.config.ts
```

---

## 📌 Ghi chú

- Dự án được thực hiện phục vụ tiểu luận / học phần chuyên ngành
- Website vẫn đang trong quá trình hoàn thiện và phát triển thêm tính năng

---

## 👨‍💻 Tác giả

Phung Long  
Sinh viên – Trường Đại học Sư phạm Kỹ thuật TP. Hồ Chí Minh